# Concepts: run lifecycle and tenant boundaries

## 1. A lifecycle policy is not a lock

Allocation runs are durable workflow records. PENDING means work can be claimed, RUNNING means a worker owns processing, COMPLETED means result rows and summary were written, and FAILED means terminal failure was recorded. `VALID_RUN_TRANSITIONS` (`src/services/allocationRunService.ts:20-25`) refuses skipped phases and terminal reopening *when a caller invokes it*. It is a policy function; it cannot make an update atomic.

`transitionRunStatus` reads the run (`:41`), validates (`:47-50`), then writes with `updateMany({ id, tenantId })` (`src/repositories/allocationRunRepository.ts:67-72`). Between the read and the write another worker can change the row. A conditional claim — `updateMany({ where: { id, tenantId, status: "PENDING" } })` and treating `count === 0` as "someone else owns it" — closes that gap. It is not implemented.

## 2. The catch path bypasses the policy

The worker's catch (`src/services/allocationRunService.ts:102-113`) writes FAILED directly. That includes the case where the error *was* a transition refusal — for example, if the run was already COMPLETED, the RUNNING transition throws `ValidationError` and the catch overwrites COMPLETED with FAILED. The helper tests therefore do not prove terminal records are immutable.

## 3. Tenant scope is part of identity

Every repository `where` includes `tenantId`. A run id alone is insufficient when APIs serve multiple tenants (`getAllocationRunById`, `allocationRunRepository.ts:56-64`). What is *not* scoped: foreign keys supplied in request bodies. `createRule` passes `targetTeamId`/`targetProjectId` straight through (`src/services/allocationRuleService.ts:20-28`), and the Prisma relations (`prisma/schema.prisma:148-149`) reference `Team.id`/`Project.id` without a tenant component, so a rule can point at another tenant's team if its id is known. Budgets (`src/services/budgetService.ts:11-22`) and cost line items (`src/services/ingestionService.ts:14-26`) have the same shape.

## 4. Month windows and month keys

`toUtcMonthWindow` (`src/lib/time/month.ts:10-22`) is the canonical month: `[Date.UTC(y, m, 1), Date.UTC(y, m+1, 1))`. Range queries use it consistently. Equality lookups need a normalised key, and the code is inconsistent: runs and budgets store `new Date(input)` (`allocationRunService.ts:66`, `budgetService.ts:18`), while forecasts store `window.monthStart` (`src/services/forecastService.ts:23`). The report's run lookup is an equality match (`src/repositories/reportRepository.ts:14`).

## 5. Async semantics

The run route returns 202 (`src/app/api/allocation-runs/route.ts:27`). The queue is `setTimeout` in the same Node process (`src/lib/queue/allocationQueue.ts:21-28`). On a serverless host the function may freeze after the response, and on any host a restart drops the job. The run row survives as PENDING with nothing to resume it.

## 6. Identity from a header

`requireSession` trusts `x-user-id` (`src/lib/auth/session.ts:13`) and loads the user. It correctly derives tenant and role from the database (`:25-31`) rather than from headers, but anyone who learns a user id can act as that user. The browser client sends `NEXT_PUBLIC_DEMO_USER_ID` (`src/lib/http/client.ts:7`, `:31`), a value compiled into the public bundle.

## Exercises

**Goal:** show the COMPLETED→FAILED downgrade path.
**Check:** a sequence that ends at `allocationRunService.ts:106-112` with status FAILED written over COMPLETED, triggered by a duplicate job for the same run id.

**Goal:** predict the chargeback report after posting `{"monthStart":"2026-03-15T00:00:00.000Z"}`.
**Check:** the engine computes March, but `GET /api/reports/chargeback?monthStart=2026-03-01T00:00:00.000Z` returns `runStatus: "NO_COMPLETED_RUN"` because `2026-03-15` ≠ `2026-03-01` at `reportRepository.ts:14`.
