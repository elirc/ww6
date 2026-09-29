# Request Lifecycle

Request: Trigger allocation run for March 2026
1. src/app/api/allocation-runs/route.ts — `POST` handler parses `createAllocationRunSchema` payload.
2. src/lib/middleware/withAuth.ts — resolves session by calling `requireSession`.
3. src/lib/middleware/withRole.ts — checks `runAllocation` permission against `ROLE_MATRIX`.
4. src/lib/validation/allocationSchemas.ts — `createAllocationRunSchema.parse()` validates `monthStart`.
5. src/services/allocationRunService.ts — `createRunAndQueue()` creates `AllocationRun` and enqueues job.
6. src/repositories/allocationRunRepository.ts — `createAllocationRun()` inserts run with `PENDING` status.
7. src/lib/queue/allocationQueue.ts — `enqueueAllocationRun()` executes async worker callback.
8. src/services/allocationRunService.ts — `processQueuedAllocationRun()` transitions status and stores results.
9. src/services/allocationEngineService.ts — `computeAllocationResults()` applies rules to cost items.
10. src/repositories/allocationRunRepository.ts — `replaceAllocationResults()` writes allocation outputs in a transaction.
11. Returns 202 with { item: AllocationRun, message: "Allocation run queued" }

Request: Fetch monthly chargeback report
1. src/app/api/reports/chargeback/route.ts — `GET` extracts `monthStart` query.
2. src/lib/middleware/withAuth.ts — authenticates request and injects `auth` context.
3. src/lib/middleware/withRole.ts — enforces `readReports` permission.
4. src/services/reportService.ts — `getChargebackReport()` orchestrates spend, budget, and allocation snapshot reads.
5. src/repositories/reportRepository.ts — `findLatestCompletedRunForMonth()` fetches completed run snapshot.
6. src/repositories/costLineItemRepository.ts — `aggregateCostByService()` returns grouped raw spend.
7. src/repositories/budgetRepository.ts — `listBudgetsByMonth()` loads budget targets.
8. src/repositories/reportRepository.ts — `aggregateAllocationByTeam()` and `aggregateAllocationByProject()` compute chargeback totals.
9. Returns 200 with { monthStart, runStatus, byService, byTeam, byProject, budgets }

Request: Unauthorized role attempts allocation execution (rejection path)
1. src/app/api/allocation-runs/route.ts — `POST` route receives request.
2. src/lib/middleware/withAuth.ts — session resolves successfully.
3. src/lib/middleware/withRole.ts — `assertPermission()` rejects role not in `runAllocation` policy.
4. src/lib/http/response.ts — `toErrorResponse()` maps `ForbiddenError` to HTTP 403.
5. Returns 403 with { error: { code: "FORBIDDEN", message: ... } }

Request: Invalid cost ingestion payload (rejection path)
1. src/app/api/cost-line-items/route.ts — `POST` route starts request.
2. src/lib/middleware/withAuth.ts — verifies session.
3. src/lib/middleware/withRole.ts — checks `ingestCosts` permission.
4. src/lib/validation/costSchemas.ts — `ingestCostPayloadSchema.parse()` throws on invalid line item.
5. src/lib/http/response.ts — maps `ZodError` to HTTP 422 response.
6. Returns 422 with { error: { code: "VALIDATION_ERROR", details: ... } }
