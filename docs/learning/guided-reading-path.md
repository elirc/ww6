# Guided Reading Path

## Step 1 — src/lib/auth/roles.ts
**Why read this:** It defines the permission vocabulary that all protected endpoints rely on.
**What to look for:** How named permissions map to concrete roles in `ROLE_MATRIX`.
**What to trace:** Called by `src/lib/middleware/withRole.ts`; consumed by API routes in `src/app/api/**/route.ts`.
**What a junior would likely miss:** Changing a permission name here without updating route usage creates broken authorization checks.

## Step 2 — src/lib/auth/session.ts
**Why read this:** This is the trust boundary for identity and tenant resolution.
**What to look for:** `requireSession()` deriving role and tenant from DB, not headers.
**What to trace:** Called by `src/lib/middleware/withAuth.ts`; calls `src/repositories/userRepository.ts`.
**What a junior would likely miss:** Accepting `tenantId` from request headers would enable privilege escalation.

## Step 3 — src/lib/middleware/withRole.ts
**Why read this:** Centralized authorization keeps route files thin and reviewable.
**What to look for:** `assertPermission()` and `withRole()` composition over `withAuth()`.
**What to trace:** Called by every API route; calls `src/lib/middleware/withAuth.ts` and `src/lib/auth/roles.ts`.
**What a junior would likely miss:** Copy-pasting role literals in each route instead of policy names.

## Step 4 — src/lib/validation/costSchemas.ts
**Why read this:** It demonstrates a strict validation boundary at API ingress.
**What to look for:** `ingestCostPayloadSchema` line-item constraints and bounded array size.
**What to trace:** Called by `src/app/api/cost-line-items/route.ts`; parsed payload is passed to `src/services/ingestionService.ts`.
**What a junior would likely miss:** Validating top-level fields only and letting invalid line items through.

## Step 5 — src/repositories/costLineItemRepository.ts
**Why read this:** It shows tenant-scoped query design and aggregate reads.
**What to look for:** Mandatory `tenantId` filters in `findMany` and `groupBy` queries.
**What to trace:** Called by `src/services/ingestionService.ts`, `src/services/reportService.ts`, and `src/services/anomalyService.ts`.
**What a junior would likely miss:** Using `findUnique`/`groupBy` without tenant constraints.

## Step 6 — src/services/allocationEngineService.ts
**Why read this:** This is the chargeback allocation algorithm.
**What to look for:** Rule matching by tags, weight validation, and fallback allocation behavior.
**What to trace:** Called by `src/services/allocationRunService.ts`; calls rule and cost repositories.
**What a junior would likely miss:** Not handling unmatched costs, leading to under-reported allocated totals.

## Step 7 — src/services/allocationRunService.ts
**Why read this:** It models status transitions and async orchestration.
**What to look for:** `assertValidRunTransition()` and `processQueuedAllocationRun()`.
**What to trace:** Called by `src/app/api/allocation-runs/route.ts` and queue worker; calls allocation repositories and engine service.
**What a junior would likely miss:** Allowing invalid status rewinds (e.g., `COMPLETED -> RUNNING`).

## Step 8 — src/lib/queue/allocationQueue.ts
**Why read this:** It demonstrates async job abstraction with a replaceable queue boundary.
**What to look for:** `registerAllocationWorker()` and `enqueueAllocationRun()`.
**What to trace:** Called by `src/services/allocationRunService.ts`; calls registered worker callback.
**What a junior would likely miss:** Assuming in-memory queue durability across process restarts.

## Step 9 — src/repositories/allocationRunRepository.ts
**Why read this:** It encapsulates state persistence and result transaction handling.
**What to look for:** Tenant-aware run lookup and transactional `replaceAllocationResults()`.
**What to trace:** Called by `src/services/allocationRunService.ts`; calls Prisma transaction APIs.
**What a junior would likely miss:** Updating run rows by id only instead of id + tenant scope.

## Step 10 — src/services/reportService.ts
**Why read this:** It composes multiple repositories into a stable reporting contract.
**What to look for:** Behavior when no completed allocation run exists for a month.
**What to trace:** Called by `src/app/api/reports/chargeback/route.ts`; calls report/cost/budget repositories.
**What a junior would likely miss:** Treating missing run data as zero instead of explicit "NO_COMPLETED_RUN" status.

## Step 11 — src/services/anomalyService.ts
**Why read this:** It shows domain logic for operational alerts based on spend trends.
**What to look for:** Per-service average calculation and threshold-based severity assignment.
**What to trace:** Called by `src/app/api/anomalies/route.ts`; calls cost and anomaly repositories.
**What a junior would likely miss:** Running anomaly computations in components rather than backend services.

## Step 12 — src/app/api/allocation-runs/route.ts
**Why read this:** It shows the complete route boundary for async workflow kickoff.
**What to look for:** Validation before service invocation and 202 response semantics.
**What to trace:** Called by `src/hooks/useAllocationRuns.ts`; calls middleware + `createRunAndQueue`.
**What a junior would likely miss:** Returning success as if the allocation work already finished.

## Step 13 — src/hooks/useAllocationRuns.ts
**Why read this:** It demonstrates React Query integration with mutation invalidation.
**What to look for:** Mutation path, query key strategy, and cache invalidations.
**What to trace:** Called by `src/components/dashboard/AllocationRunPanel.tsx`; calls `/api/allocation-runs`.
**What a junior would likely miss:** Failing to invalidate report data after triggering a run.

## Step 14 — prisma/schema.prisma
**Why read this:** It captures tenant boundaries and state model in database design.
**What to look for:** Tenant-owned models, indexes, and enum-backed status fields.
**What to trace:** Used by all repositories through Prisma client; mirrored by service-level assumptions.
**What a junior would likely miss:** Missing tenant composite constraints and indexes needed for isolation and performance.
