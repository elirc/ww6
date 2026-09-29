/**
 * What this file does: Defines shared backend domain and request-context types used across API, service, and repository layers.
 * What calls it: Middleware (`src/lib/middleware/withAuth.ts`), services (`src/services/*.ts`), and routes (`src/app/api/**/route.ts`).
 * What it calls: No runtime dependencies; type-only contracts.
 * Junior pitfall: Re-declaring similar context types in multiple files and causing drift in security-sensitive fields like `tenantId`.
 */
import type { AllocationRunStatus, Role } from "@prisma/client";

export type AuthContext = {
  userId: string;
  tenantId: string;
  email: string;
  name: string;
  role: Role;
};

export type PaginatedQuery = {
  limit?: number;
  offset?: number;
};

export type MonthWindow = {
  monthStart: Date;
  monthEnd: Date;
};

export type RunTransitionInput = {
  from: AllocationRunStatus;
  to: AllocationRunStatus;
};
