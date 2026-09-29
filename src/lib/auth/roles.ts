/**
 * What this file does: Declares role constants and reusable permission rules for centralized RBAC checks.
 * What calls it: `src/lib/middleware/withRole.ts`, tests in `tests/permissions/allocation-run-permission.test.ts`.
 * What it calls: Prisma `Role` enum.
 * Junior pitfall: Scattering role checks in API files, which creates policy drift and inconsistent authorization.
 */
import type { Role } from "@prisma/client";

export const ROLE_MATRIX = {
  runAllocation: ["PLATFORM_ADMIN", "FINOPS_ANALYST"],
  manageRules: ["PLATFORM_ADMIN", "FINOPS_ANALYST"],
  manageBudgets: ["PLATFORM_ADMIN", "FINOPS_ANALYST", "TEAM_MANAGER"],
  ingestCosts: ["PLATFORM_ADMIN", "FINOPS_ANALYST"],
  readReports: ["PLATFORM_ADMIN", "FINOPS_ANALYST", "TEAM_MANAGER", "VIEWER"],
  readAnomalies: ["PLATFORM_ADMIN", "FINOPS_ANALYST", "TEAM_MANAGER"],
  readForecasts: ["PLATFORM_ADMIN", "FINOPS_ANALYST", "TEAM_MANAGER", "VIEWER"]
} as const satisfies Record<string, Role[]>;

// ⚠️ SENIOR NOTE: permission names are API contracts; renaming one without route/test updates silently bypasses checks.
export type PermissionName = keyof typeof ROLE_MATRIX;
