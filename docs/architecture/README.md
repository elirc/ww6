# Architecture Overview

This project is a multi-tenant infrastructure cost allocation and chargeback platform built with Next.js App Router and a layered backend (`route -> middleware -> validation -> service -> repository -> Prisma`).

## Top-Level Folder Map

- `prisma/`
  - Database schema and seed data.
  - Example files: `prisma/schema.prisma`, `prisma/seed.ts`.
- `src/app/`
  - UI pages and REST API route handlers.
  - Example files: `src/app/page.tsx`, `src/app/api/allocation-runs/route.ts`.
- `src/lib/`
  - Cross-cutting infrastructure (auth, middleware, validation, queue, HTTP utilities).
  - Example files: `src/lib/middleware/withRole.ts`, `src/lib/validation/costSchemas.ts`.
- `src/services/`
  - Business logic and orchestration.
  - Example files: `src/services/allocationRunService.ts`, `src/services/reportService.ts`.
- `src/repositories/`
  - Tenant-scoped database access.
  - Example files: `src/repositories/costLineItemRepository.ts`, `src/repositories/reportRepository.ts`.
- `src/hooks/` and `src/components/`
  - React Query hooks and dashboard components.
  - Example files: `src/hooks/useChargebackReport.ts`, `src/components/dashboard/AllocationRunPanel.tsx`.
- `tests/`
  - Focused tests for RBAC, validation, state transitions, and tenant isolation.
  - Example files: `tests/permissions/allocation-run-permission.test.ts`, `tests/isolation/cost-repository-isolation.test.ts`.
- `docs/`
  - Architecture and learning guides anchored to concrete code paths.

## Layering Rule

1. `src/app/api/**/route.ts` accepts HTTP request.
2. `src/lib/middleware/withAuth.ts` + `src/lib/middleware/withRole.ts` enforces identity and RBAC.
3. `src/lib/validation/*.ts` enforces payload/query boundary.
4. `src/services/*.ts` applies business rules and workflow/state logic.
5. `src/repositories/*.ts` performs tenant-scoped Prisma queries.
6. Prisma models in `prisma/schema.prisma` persist data in PostgreSQL.
