# Load-Bearing Files

## src/lib/middleware/withRole.ts
- What it does: Central RBAC enforcement via `assertPermission()` and `withRole()`.
- What calls it: All protected route handlers in `src/app/api/**/route.ts`.
- What it calls: `src/lib/auth/roles.ts`, `src/lib/middleware/withAuth.ts`.
- What would break or become insecure if wrong: Unauthorized users could execute allocation runs, rule writes, or budget changes.
- What a junior engineer would likely miswrite here: Hardcoding role checks in routes instead of permission policy names.

## src/lib/auth/session.ts
- What it does: Authenticates requests and hydrates `AuthContext` with authoritative tenant/role fields.
- What calls it: `src/lib/middleware/withAuth.ts`.
- What it calls: `src/repositories/userRepository.ts`.
- What would break or become insecure if wrong: Tenant spoofing and role escalation if user context is derived from headers.
- What a junior engineer would likely miswrite here: Trusting request payload role/tenant metadata.

## src/services/allocationRunService.ts
- What it does: Owns run lifecycle and status machine (`PENDING -> RUNNING -> COMPLETED/FAILED`).
- What calls it: `src/app/api/allocation-runs/route.ts` and queue callback registration.
- What it calls: `src/lib/queue/allocationQueue.ts`, `src/services/allocationEngineService.ts`, `src/repositories/allocationRunRepository.ts`.
- What would break or become insecure if wrong: Runs get stuck or rewind illegally, breaking auditability and report trust.
- What a junior engineer would likely miswrite here: Updating status directly without transition validation.

## src/services/allocationEngineService.ts
- What it does: Applies allocation rules to monthly cost items and computes output rows.
- What calls it: `src/services/allocationRunService.ts`.
- What it calls: `src/repositories/costLineItemRepository.ts`, `src/repositories/allocationRuleRepository.ts`, `src/lib/time/month.ts`.
- What would break or become insecure if wrong: Chargeback totals become mathematically incorrect (over/under allocation).
- What a junior engineer would likely miswrite here: Ignoring weights above 100% or dropping unmatched costs silently.

## src/repositories/costLineItemRepository.ts
- What it does: Persists and reads cost line items with explicit tenant scoping.
- What calls it: Ingestion, report, anomaly, and forecast services.
- What it calls: Prisma `costLineItem` and `groupBy` operations.
- What would break or become insecure if wrong: Cross-tenant spend leak in listings or service-level aggregates.
- What a junior engineer would likely miswrite here: Missing tenant filter in `groupBy` query.

## src/repositories/allocationRunRepository.ts
- What it does: Persists run status and transactional allocation results.
- What calls it: `src/services/allocationRunService.ts`.
- What it calls: Prisma `allocationRun`, `allocationResult`, and transaction APIs.
- What would break or become insecure if wrong: One tenant could read or mutate another tenant's runs/results.
- What a junior engineer would likely miswrite here: Using `findUnique` by id instead of tenant-aware lookup.

## src/services/reportService.ts
- What it does: Composes run snapshot, raw service spend, and budgets into chargeback output.
- What calls it: `src/app/api/reports/chargeback/route.ts`.
- What it calls: `src/repositories/reportRepository.ts`, `src/repositories/costLineItemRepository.ts`, `src/repositories/budgetRepository.ts`.
- What would break or become insecure if wrong: Finance teams may act on stale or mixed-scope data.
- What a junior engineer would likely miswrite here: Assuming report is valid even without a completed run.

## src/lib/validation/costSchemas.ts
- What it does: Enforces ingestion payload correctness at the API boundary.
- What calls it: `src/app/api/cost-line-items/route.ts`.
- What it calls: Zod runtime validators.
- What would break or become insecure if wrong: Invalid or malicious payloads could corrupt cost datasets.
- What a junior engineer would likely miswrite here: Omitting nested line-item constraints.

## prisma/schema.prisma
- What it does: Defines tenant-owned relational model, status enums, and indexes.
- What calls it: Prisma Client generation used by all repositories.
- What it calls: PostgreSQL datasource configuration.
- What would break or become insecure if wrong: Data shape drift, poor query performance, and weak isolation constraints.
- What a junior engineer would likely miswrite here: Missing composite uniqueness and tenant-focused indexes.
