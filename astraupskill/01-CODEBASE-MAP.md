# Codebase map

## The run pipeline

| Step | Code | What happens |
|---|---|---|
| 1. HTTP | `src/app/api/allocation-runs/route.ts:17-29` | `withRole("runAllocation")`, parse `{ monthStart }` with `createAllocationRunSchema` (`src/lib/validation/allocationSchemas.ts:25-27`), respond **202** (`:27`). |
| 2. Create | `src/services/allocationRunService.ts:63-78` | `createAllocationRun` writes a PENDING row with `monthStart: new Date(monthStartIso)` (`:66`) — the raw instant, not normalised to the first of the month. |
| 3. Enqueue | `src/lib/queue/allocationQueue.ts:19-29` | `setTimeout(..., 5)` calls the registered worker in the same process. No persistence. |
| 4. Register | `src/services/allocationRunService.ts:116` | `registerAllocationWorker(processQueuedAllocationRun)` runs as an import side effect. |
| 5. Claim | `:90-92` → `transitionRunStatus` (`:35-61`) | read by `(tenantId, id)` (`:41`), check policy (`:47-50`), `updateMany` to RUNNING (`:52-60`). |
| 6. Compute | `src/services/allocationEngineService.ts:27-105` | window from `toUtcMonthWindow` (`:32`); load month's cost items and active rules in parallel (`:33-36`); per item, match rules by tag (`:45`), refuse >100% (`:49-54`), fall back to the item's own project when nothing matches (`:58-75`). |
| 7. Replace | `src/repositories/allocationRunRepository.ts:83-103` | `$transaction` deletes this run's results then `createMany` (`:88-101`). |
| 8. Complete | `src/services/allocationRunService.ts:98-101` | second read-check-update to COMPLETED with `summaryJson`. |
| 9. Fail | `:102-113` | catch writes FAILED via `updateAllocationRunStatus` directly — no policy check. |

[allocationRunRepository.ts](../src/repositories/allocationRunRepository.ts) scopes every read and write by tenant: `getAllocationRunById` uses `findFirst({ id, tenantId })` (`:56-64`) and `updateAllocationRunStatus` uses `updateMany({ id, tenantId })` (`:66-81`). Neither includes the expected current `status`, which is why step 5 is a read-then-update and not an atomic claim.

## Who reads the results

`getChargebackReport` (`src/services/reportService.ts:16-51`) finds the latest COMPLETED run with `monthStart` **equal** to the normalised window start (`src/repositories/reportRepository.ts:9-19`), then groups results by team and project (`:21-57`). If step 2 stored a non-normalised `monthStart`, the report cannot find that run.

## Cross-cutting files

- `src/lib/auth/session.ts:12-32` — identity comes from the `x-user-id` header, looked up by id; role and tenant come from the database row.
- `src/lib/middleware/withRole.ts:15-22` — `assertPermission` against `ROLE_MATRIX` (`src/lib/auth/roles.ts:9-17`).
- `src/lib/http/errors.ts:7-47` — `AppError` subclasses: 401, 403, 422 (validation), 404, 409.
- `src/lib/http/response.ts:11-47` — `AppError` → its status; `ZodError` → 422; else 500.
- `src/lib/time/month.ts:10-22` — UTC month window `[start, nextStart)`.

The [runtime test](../tests/runtime-allocation-state-lab.test.mjs) imports the actual guard through the VM loader and loads the real error classes while stubbing the repository, engine and queue modules (`:7-11`). Adding a new status requires changes to the Prisma enum (`prisma/schema.prisma:22-27`), the transition table, any UI that renders status, and tests.

## Exercises

**Goal:** locate every write to `AllocationRun.status`.
**Check:** three sites — `createAllocationRun` (`allocationRunRepository.ts:40`), `transitionRunStatus` (`allocationRunService.ts:52-60`), and the catch block (`:106-112`).

**Goal:** explain why a crash between steps 2 and 5 leaves a run PENDING forever.
**Check:** you cite the in-memory `setTimeout` (`allocationQueue.ts:21`) and the absence of any sweeper or startup recovery in `src/`.
