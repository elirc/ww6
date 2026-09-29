# Concepts Demonstrated

## Service Layer
Where to look: `src/services/reportService.ts` — `getChargebackReport()` composes multiple repositories and shapes a report contract.
Also see: `src/services/allocationRunService.ts` for workflow orchestration and state transitions.
Risk if wrong: Business rules spread into route handlers, making behavior inconsistent and hard to test.

## Repository Pattern
Where to look: `src/repositories/costLineItemRepository.ts` — tenant-scoped persistence and aggregation queries.
Also see: `src/repositories/allocationRunRepository.ts` for transactional writes.
Risk if wrong: Database logic gets duplicated with inconsistent tenant filters.

## Zod Validation Boundary
Where to look: `src/lib/validation/costSchemas.ts` — `ingestCostPayloadSchema` enforces nested line-item shape.
Also see: `src/app/api/cost-line-items/route.ts` where `.parse()` is executed before service calls.
Risk if wrong: Bad vendor payloads corrupt financial data and surface as downstream reporting bugs.

## Auth Session Flow
Where to look: `src/lib/auth/session.ts` — `requireSession()` resolves identity and tenant from DB.
Also see: `src/lib/middleware/withAuth.ts` for middleware integration and error mapping.
Risk if wrong: Spoofed tenant/role context allows privilege escalation.

## Role-Based Access Control
Where to look: `src/lib/middleware/withRole.ts` — `assertPermission()` enforces policy names.
Also see: `src/lib/auth/roles.ts` for central role matrix.
Risk if wrong: Unauthorized users can execute allocation runs or modify budgets/rules.

## Status/State Transitions
Where to look: `src/services/allocationRunService.ts` — `VALID_RUN_TRANSITIONS` and `assertValidRunTransition()`.
Also see: `tests/state/allocation-run-transition.test.ts` for rejection coverage.
Risk if wrong: Run lifecycle becomes non-auditable and operational dashboards become misleading.

## Auditability via Run Snapshots
Where to look: `src/repositories/allocationRunRepository.ts` — `createAllocationRun()` and `replaceAllocationResults()`.
Also see: `src/services/reportService.ts` selecting latest completed run.
Risk if wrong: Reports cannot be reconciled back to a specific allocation execution.

## Background Job Design
Where to look: `src/lib/queue/allocationQueue.ts` — enqueue/register boundary for async processing.
Also see: `src/services/allocationRunService.ts` `processQueuedAllocationRun()` worker.
Risk if wrong: Synchronous heavy work causes API timeouts and partial updates.

## Multi-Tenancy Isolation
Where to look: `src/repositories/reportRepository.ts` — groupBy queries include `tenantId` in `where`.
Also see: `src/repositories/costLineItemRepository.ts` and `src/repositories/allocationRunRepository.ts` for scoped reads/writes.
Risk if wrong: Cross-tenant financial data leaks and regulatory/compliance exposure.

## Forecasting Placeholder Model
Where to look: `src/services/forecastService.ts` — `generateForecastForMonth()` with persisted snapshot.
Also see: `src/repositories/forecastRepository.ts` for replacement semantics.
Risk if wrong: Forecast outputs are unstable, duplicated, or not reproducible month-over-month.
