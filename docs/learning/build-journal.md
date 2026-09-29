# Build Journal

## Stage 1 — Project Framing
Built: Defined target product scope (cost ingestion, allocation, reporting, anomalies, forecasting) and layered architecture.
Decision: Use explicit route/middleware/service/repository boundaries from day 1.
Why: Keeps auth/validation/business/data concerns reviewable as the codebase grows.

## Stage 2 — Stack Choice
Built: Next.js + React + TypeScript + Prisma + PostgreSQL + Tailwind + Zod + React Query + REST.
Decision: Keep REST over tRPC for this project.
Why: REST keeps boundaries explicit for onboarding and easier cross-language integration later.

## Stage 3 — Domain & Schema
Built: Multi-tenant Prisma schema in `prisma/schema.prisma` and mock seed in `prisma/seed.ts`.
Decision: Model `AllocationRun` + `AllocationResult` as immutable reporting snapshots.
Why: Chargeback outputs must be traceable to specific execution runs.

## Stage 4 — Auth, RBAC, and Tenant Boundaries
Built: `src/lib/auth/session.ts`, `src/lib/middleware/withAuth.ts`, `src/lib/middleware/withRole.ts`, `src/lib/auth/roles.ts`.
Decision: Resolve role/tenant from DB session record, not request headers.
Why: Prevents client-side spoofing of privilege/tenant context.

## Stage 5 — Core Domain Workflows
Built: Ingestion, rule management, allocation run state machine, reporting, anomalies, forecasts, budgets.
Decision: Trigger allocation runs asynchronously through queue abstraction.
Why: Long-running allocation should not block request latency and needs lifecycle visibility.

## Stage 6 — UI + Tests + Learning Docs
Built: Dashboard components/hooks, focused Vitest coverage, architecture and learning docs.
Decision: Keep tests narrow around failure-prone boundaries first.
Why: Highest ROI for preventing security/data-integrity regressions.

## Major Decision Log

### Decision A: Multi-tenancy boundary strategy
Why this matters: Financial data isolation is a critical security/compliance requirement.
Options considered:
1. Global tables without tenant id filters
- Pros: simplest queries
- Cons: impossible strong isolation; high leak risk
- Future pain: expensive rewrite when adding SaaS/org boundaries
2. Tenant-aware repository layer with explicit `tenantId` filters
- Pros: strong, reviewable isolation pattern
- Cons: more boilerplate
- Future pain: requires discipline on every new query
3. Physical database per tenant
- Pros: strongest hard isolation
- Cons: high operational complexity for learning project
- Future pain: migration and analytics complexity
Chosen: Option 2 implemented in `src/repositories/*.ts` with inline tenant-scoping comments.
Why chosen over alternatives: best balance of realism, safety, and implementation effort.
What junior/mid/senior notice:
- Junior: sees repeated `tenantId` and may think it is redundant.
- Mid: recognizes this as core security invariant.
- Senior: worries about enforcing this invariant automatically via linting/code review checklists.

### Decision B: Allocation execution model
Why this matters: Allocation can be compute-heavy and must be auditable.
Options considered:
1. Synchronous `POST /allocation-runs` does all work inline
- Pros: simple
- Cons: request timeouts and poor UX
- Future pain: hard to scale
2. Async run record + background processing
- Pros: auditable status machine, retries/history potential
- Cons: requires queue and lifecycle handling
- Future pain: durable queue migration needed later
3. Nightly batch-only job
- Pros: operationally predictable
- Cons: no on-demand recalculation
- Future pain: product teams blocked on ad-hoc analysis
Chosen: Option 2 in `src/services/allocationRunService.ts` + `src/lib/queue/allocationQueue.ts`.
Why chosen over alternatives: aligns with operational realism and keeps API responsive.
What junior/mid/senior notice:
- Junior: focuses on queueing mechanics.
- Mid: sees value of run statuses and immutable outputs.
- Senior: focuses on durability/idempotency and failure semantics.

### Decision C: API style (REST vs tRPC)
Why this matters: API shape affects onboarding, compatibility, and boundary clarity.
Options considered:
1. tRPC
- Pros: strong end-to-end typing
- Cons: less explicit HTTP contracts for platform integrations
- Future pain: coupling to TS clients
2. REST with Zod at boundary
- Pros: explicit contracts, easier integration and observability
- Cons: more DTO boilerplate
- Future pain: manual type sharing discipline
3. GraphQL
- Pros: flexible reads
- Cons: complexity overhead for CRUD-heavy internal app
- Future pain: permission complexity per field
Chosen: Option 2 using route handlers + Zod schemas.
Why chosen over alternatives: best fit for backend-upskilling focus and explicit boundaries.
What junior/mid/senior notice:
- Junior: sees more files but clearer flow.
- Mid: appreciates explicit validation and status codes.
- Senior: values contract stability and operability.
## PR Slices

### Slice 1 — Domain and persistence foundation
Purpose: Establish tenant-aware schema and baseline data model.
Novel logic files:
- `prisma/schema.prisma`
- `prisma/seed.ts`
Reviewer focus (important files):
- `prisma/schema.prisma`: verify tenant ownership fields and indexes around each model.
- `prisma/schema.prisma`: verify enums for role and allocation status model.
- `prisma/seed.ts`: verify seeded users/tenants map correctly for demo auth.
Junior reviewer miss: Approving schema without checking composite tenant constraints and index coverage.

### Slice 2 — Auth, RBAC, and validation boundary
Purpose: Create centralized security and input validation controls.
Novel logic files:
- `src/lib/auth/roles.ts`
- `src/lib/auth/session.ts`
- `src/lib/middleware/withAuth.ts`
- `src/lib/middleware/withRole.ts`
- `src/lib/validation/costSchemas.ts`
- `src/lib/validation/allocationSchemas.ts`
- `src/lib/validation/budgetSchemas.ts`
Reviewer focus (important files):
- `src/lib/auth/session.ts`: verify DB-derived tenant/role (around `requireSession`).
- `src/lib/middleware/withRole.ts`: verify deny path returns 403 consistently.
- `src/lib/validation/costSchemas.ts`: verify line-item strictness and payload cap.
Junior reviewer miss: Accepting route-level ad hoc checks instead of centralized permission middleware.

### Slice 3 — Core cost allocation workflows
Purpose: Implement ingestion, rule management, allocation state machine, and async processing.
Novel logic files:
- `src/services/ingestionService.ts`
- `src/services/allocationRuleService.ts`
- `src/services/allocationEngineService.ts`
- `src/services/allocationRunService.ts`
- `src/lib/queue/allocationQueue.ts`
- `src/repositories/costLineItemRepository.ts`
- `src/repositories/allocationRuleRepository.ts`
- `src/repositories/allocationRunRepository.ts`
- `src/app/api/cost-line-items/route.ts`
- `src/app/api/allocation-rules/route.ts`
- `src/app/api/allocation-runs/route.ts`
Reviewer focus (important files):
- `src/services/allocationRunService.ts`: verify transition map and terminal failure handling.
- `src/services/allocationEngineService.ts`: verify weight guard and unmatched fallback behavior.
- `src/repositories/allocationRunRepository.ts`: verify tenant-scoped run lookup and transactional result replacement.
Junior reviewer miss: Approving queue behavior without discussing durability and retry semantics.

### Slice 4 — Reporting, anomaly, forecast, and budget features
Purpose: Deliver operational finance outputs from persisted data.
Novel logic files:
- `src/services/reportService.ts`
- `src/services/anomalyService.ts`
- `src/services/forecastService.ts`
- `src/services/budgetService.ts`
- `src/repositories/reportRepository.ts`
- `src/repositories/anomalyRepository.ts`
- `src/repositories/forecastRepository.ts`
- `src/repositories/budgetRepository.ts`
- `src/app/api/reports/chargeback/route.ts`
- `src/app/api/anomalies/route.ts`
- `src/app/api/forecasts/route.ts`
- `src/app/api/budgets/route.ts`
Reviewer focus (important files):
- `src/services/reportService.ts`: verify no-run handling and report shape stability.
- `src/repositories/reportRepository.ts`: verify tenant-scoped aggregate queries.
- `src/services/anomalyService.ts`: verify threshold/severity logic and persistence boundaries.
Junior reviewer miss: Approving hard-coded anomaly/forecast model assumptions without noting future configurability.

### Slice 5 — Frontend integration, tests, and learning docs
Purpose: Connect UI + hooks to API and document system for onboarding.
Novel logic files:
- `src/hooks/useChargebackReport.ts`
- `src/hooks/useAllocationRuns.ts`
- `src/hooks/useAnomalies.ts`
- `src/components/dashboard/AllocationRunPanel.tsx`
- `src/app/page.tsx`
- `tests/permissions/allocation-run-permission.test.ts`
- `tests/validation/cost-schema.test.ts`
- `tests/state/allocation-run-transition.test.ts`
- `tests/isolation/cost-repository-isolation.test.ts`
- `docs/architecture/*`
- `docs/learning/*`
Reviewer focus (important files):
- `src/hooks/useAllocationRuns.ts`: verify invalidation after run trigger.
- `tests/isolation/cost-repository-isolation.test.ts`: verify tenant filter assertion.
- `docs/learning/flow-traces.md`: verify traces match function-level code paths.
Junior reviewer miss: Treating docs as secondary and failing to check whether they match actual implementation.
