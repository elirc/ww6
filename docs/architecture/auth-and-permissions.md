# Auth and Permissions

Session is verified in `src/lib/auth/session.ts` (`requireSession`, around lines 12-30), and the role check fires in `src/lib/middleware/withRole.ts` (`assertPermission`, around lines 15-24) before the request reaches business handlers.

## Auth Flow

- The request enters route handlers such as `src/app/api/allocation-runs/route.ts`.
- `withRole("runAllocation", ...)` wraps handlers and internally calls `withAuth` in `src/lib/middleware/withAuth.ts`.
- `withAuth` resolves identity via `requireSession` (`src/lib/auth/session.ts`) using the `x-user-id` header and database lookup in `src/repositories/userRepository.ts`.
- **Review note:** the `x-user-id` header is the whole credential. There is no cookie, token or signature, so anyone who knows a user id can act as that user. The browser client sends `NEXT_PUBLIC_DEMO_USER_ID` (`src/lib/http/client.ts:7`, `:31`), and `NEXT_PUBLIC_` values are compiled into the client bundle. What the code does get right is that `tenantId` and `role` are read from the database row (`src/lib/auth/session.ts:25-31`), never from headers.
- On failure, `toErrorResponse` in `src/lib/http/response.ts` maps auth/permission errors to 401/403 JSON responses.

## RBAC Matrix

Role rules are centralized in `src/lib/auth/roles.ts` (`ROLE_MATRIX`).

- `runAllocation`: `PLATFORM_ADMIN`, `FINOPS_ANALYST`
- `manageRules`: `PLATFORM_ADMIN`, `FINOPS_ANALYST`
- `manageBudgets`: `PLATFORM_ADMIN`, `FINOPS_ANALYST`, `TEAM_MANAGER`
- `ingestCosts`: `PLATFORM_ADMIN`, `FINOPS_ANALYST`
- `readReports`: all roles including `VIEWER`
- `readAnomalies`: `PLATFORM_ADMIN`, `FINOPS_ANALYST`, `TEAM_MANAGER`
- `readForecasts`: all roles including `VIEWER`

## Multi-Tenant Isolation

Tenant isolation is first-class and enforced in repositories.

- Example read isolation: `src/repositories/costLineItemRepository.ts` (`listCostLineItemsByMonth`) scopes by `where: { tenantId, usageDate ... }`.
- Example state lookup isolation: `src/repositories/allocationRunRepository.ts` (`getAllocationRunById`) uses `findFirst` with both `id` and `tenantId`.
- Example aggregate isolation: `src/repositories/reportRepository.ts` (`aggregateAllocationByProject`) includes `tenantId` in `groupBy.where`.

Every tenant-scoped query includes an inline comment in repository files explaining why that scope exists.

What tenant scoping does **not** cover: foreign keys supplied in request bodies. `createRule()` (`src/services/allocationRuleService.ts:14-29`), `createBudgetEntry()` (`src/services/budgetService.ts:11-22`) and `ingestCostLineItems()` (`src/services/ingestionService.ts:12-34`) pass `teamId`/`projectId`/`targetTeamId`/`targetProjectId` through without checking that the referenced row belongs to `auth.tenantId`, and the Prisma relations reference `Team.id`/`Project.id` only (`prisma/schema.prisma:148-149`, `:207-208`). Also, `src/app/api/auth/me/route.ts` uses `withAuth` alone, so it is the one route with no permission name.

## Permission Rejection Example

A `VIEWER` hitting `POST /api/allocation-runs` fails in `src/lib/middleware/withRole.ts` before `src/services/allocationRunService.ts` runs. This behavior is unit-tested in `tests/permissions/allocation-run-permission.test.ts`.
