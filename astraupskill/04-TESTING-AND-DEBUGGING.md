# Testing and debugging

## Two test runners

| Suite | Command | Collected by |
|---|---|---|
| 4 Vitest files, 1 case each (`tests/isolation`, `tests/permissions`, `tests/state`, `tests/validation`) | `npm test` → `vitest run` (`package.json:25`) | `include: ["tests/**/*.test.ts"]` (`vitest.config.ts:13`) |
| `tests/runtime-allocation-state-lab.test.mjs`, 4 cases | `node --experimental-vm-modules --test tests/runtime-allocation-state-lab.test.mjs` | not matched by the Vitest glob |

What each Vitest file actually proves:

- `tests/isolation/cost-repository-isolation.test.ts:5-27` — `listCostLineItemsByMonth` passes `tenantId` in `where`, using an injected fake client. Only that one function accepts an injectable client; the run, rule, budget and report repositories import `db` directly and are untested.
- `tests/permissions/allocation-run-permission.test.ts:6-9` — `assertPermission("VIEWER", "runAllocation")` throws `ForbiddenError`. No route is exercised.
- `tests/state/allocation-run-transition.test.ts:5-13` — COMPLETED→RUNNING throws.
- `tests/validation/cost-schema.test.ts:5-23` — amount 0 is rejected.

## Reading lab failures

If a legal edge fails, inspect `VALID_RUN_TRANSITIONS` (`src/services/allocationRunService.ts:20-25`) and the Prisma enum (`prisma/schema.prisma:22-27`) first. If a terminal row reopens, check that the COMPLETED and FAILED arrays remain empty. If an error lacks the statuses, inspect the template string at `:31`. If the module fails to load at all, look for comment or syntax problems in imported files — that is how the `errors.ts` comment bug was found.

## Debugging the running app

- **Run stuck in PENDING.** The job lives only in memory (`src/lib/queue/allocationQueue.ts:21-28`). A dev-server reload or crash after the 202 loses it. Nothing in `src/` re-enqueues PENDING runs.
- **Run FAILED with "Allocation rule configuration exceeds 100%..."** — two or more active rules matched one item and their weights sum above 100 (`src/services/allocationEngineService.ts:47-54`). One misconfigured rule fails the whole month.
- **Report says `NO_COMPLETED_RUN` but a COMPLETED run exists.** Compare the run's stored `monthStart` with the normalised window; the lookup is exact equality (`src/repositories/reportRepository.ts:14`).
- **Every request 401s.** `NEXT_PUBLIC_DEMO_USER_ID` is unset, so the client sends the placeholder `replace_with_seed_user_id` (`src/lib/http/client.ts:7`).
- **`GET /api/cost-line-items?limit=abc` 500s.** `Number("abc")` is `NaN` and is passed to Prisma `take` unvalidated (`src/app/api/cost-line-items/route.ts:27-28`); `toErrorResponse` maps the resulting error to 500 (`src/lib/http/response.ts:38-46`).
- **Refreshed anomalies for last month come back empty.** New anomalies get `detectedAt = now()` (`prisma/schema.prisma:223`) but the list filters `detectedAt` by the requested month (`src/repositories/anomalyRepository.ts:36-39`).

## What the lab cannot prove

It cannot prove the worker's claim update, tenant predicate, Prisma SQL, aggregation, result replacement or failure persistence. A follow-up test should force claim count zero and assert no computation. Another should force computation failure and inspect the direct FAILED update. There is no audit log model in this schema, so no audit assertions are possible. Debug those follow-ups with call order: read, RUNNING update, compute, replace, completion read and update.

## Exercises

**Goal:** list which repository functions are injectable.
**Check:** only the four in `src/repositories/costLineItemRepository.ts` take a `client` parameter (`:27-30`, `:36-41`, `:57-61`, `:74-78`).

**Goal:** reproduce the anomaly-window bug on paper.
**Check:** you state that `detectAnomaliesForMonth(t, "2026-02-01T00:00:00Z")` on 2026-10-07 inserts rows with October `detectedAt` and returns February-detected rows only.
