# Flow Traces

## Flow: Cost Ingestion Happy Path
1. src/app/page.tsx — user triggers ingestion workflow from dashboard context (future UI action).
2. src/hooks/useAllocationRuns.ts — `apiFetch()` pattern demonstrates authenticated API calls.
3. src/app/api/cost-line-items/route.ts — `POST` route handler.
4. src/lib/middleware/withAuth.ts — authenticates via `requireSession()`.
5. src/lib/middleware/withRole.ts — enforces `ingestCosts` permission.
6. src/lib/validation/costSchemas.ts — `ingestCostPayloadSchema.parse()` validates line items.
7. src/services/ingestionService.ts — `ingestCostLineItems()`, normalizes and maps payload.
8. src/repositories/costLineItemRepository.ts — `createManyCostLineItems()` persists tenant-scoped records.
9. Returns 201 with { insertedCount, source }

## Flow: Allocation Run Async Workflow
1. src/components/dashboard/AllocationRunPanel.tsx — user clicks “Run Allocation”, calls mutation.
2. src/hooks/useAllocationRuns.ts — `useTriggerAllocationRun()` fires POST `/api/allocation-runs`.
3. src/app/api/allocation-runs/route.ts — route handler validates month and enqueues run.
4. src/lib/middleware/withAuth.ts — validates session.
5. src/lib/middleware/withRole.ts — checks `runAllocation` permission.
6. src/lib/validation/allocationSchemas.ts — `createAllocationRunSchema.parse()`.
7. src/services/allocationRunService.ts — `createRunAndQueue()` creates run + enqueues job.
8. src/repositories/allocationRunRepository.ts — `createAllocationRun()` inserts PENDING run.
9. src/lib/queue/allocationQueue.ts — `enqueueAllocationRun()` invokes registered worker.
10. src/services/allocationRunService.ts — `processQueuedAllocationRun()` transitions RUNNING/COMPLETED.
11. src/services/allocationEngineService.ts — `computeAllocationResults()` computes chargeback rows.
12. src/repositories/allocationRunRepository.ts — `replaceAllocationResults()` writes transactionally.
13. Returns 202 with queued run metadata.

## Flow: Permission Rejection (Viewer Cannot Run Allocation)
1. src/components/dashboard/AllocationRunPanel.tsx — user attempts run action.
2. src/hooks/useAllocationRuns.ts — sends POST request to `/api/allocation-runs`.
3. src/app/api/allocation-runs/route.ts — protected route receives request.
4. src/lib/middleware/withAuth.ts — session resolves authenticated VIEWER.
5. src/lib/middleware/withRole.ts — `assertPermission("VIEWER", "runAllocation")` throws `ForbiddenError`.
6. src/lib/http/response.ts — `toErrorResponse()` maps to 403.
7. Returns 403 with { error: { code: "FORBIDDEN" } }

## Flow: Invalid Run Transition Rejection
1. src/services/allocationRunService.ts — `transitionRunStatus()` attempts state change.
2. src/repositories/allocationRunRepository.ts — `getAllocationRunById()` loads current status.
3. src/services/allocationRunService.ts — `assertValidRunTransition()` checks transition map.
4. src/lib/http/errors.ts — `ValidationError` constructed for illegal transition.
5. src/services/allocationRunService.ts — caller catches error and marks run FAILED where appropriate.
6. src/repositories/allocationRunRepository.ts — `updateAllocationRunStatus()` writes terminal failure when needed.
7. Returns failure status path without allowing illegal state rewind.

## Flow: Chargeback Report Read
1. src/app/page.tsx — dashboard mounts and loads report hook.
2. src/hooks/useChargebackReport.ts — fires GET `/api/reports/chargeback`.
3. src/app/api/reports/chargeback/route.ts — route handler.
4. src/lib/middleware/withAuth.ts — authenticates user.
5. src/lib/middleware/withRole.ts — enforces `readReports`.
6. src/services/reportService.ts — `getChargebackReport()` composes financial response.
7. src/repositories/reportRepository.ts — `findLatestCompletedRunForMonth()` and allocation aggregates.
8. src/repositories/costLineItemRepository.ts — `aggregateCostByService()` grouped spend.
9. src/repositories/budgetRepository.ts — `listBudgetsByMonth()` for budget context.
10. Returns 200 with report payload consumed by `src/components/dashboard/CostSummaryCards.tsx`.
