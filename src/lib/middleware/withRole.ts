/**
 * What this file does: Enforces role-based authorization using named permissions.
 * What calls it: Every protected route in `src/app/api/**/route.ts`.
 * What it calls: `withAuth` middleware and `ROLE_MATRIX` policy definitions.
 * Junior pitfall: Checking for one role literal (`role === "ADMIN"`) instead of policy-driven permissions.
 */
import type { NextRequest, NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { ForbiddenError } from "@/lib/http/errors";
import type { PermissionName } from "@/lib/auth/roles";
import { ROLE_MATRIX } from "@/lib/auth/roles";
import { withAuth } from "@/lib/middleware/withAuth";
import type { AuthContext } from "@/types/domain";

export function assertPermission(role: Role, permission: PermissionName) {
  const allowedRoles = ROLE_MATRIX[permission];

  // ⚠️ SENIOR NOTE: deny-by-default matters; undefined permission entries should never be treated as allow.
  if (!allowedRoles.includes(role)) {
    throw new ForbiddenError(`Role ${role} cannot perform ${permission}`);
  }
}

export function withRole(
  permission: PermissionName,
  handler: (request: NextRequest, auth: AuthContext) => Promise<NextResponse>
) {
  return withAuth(async (request, auth) => {
    // Keep authorization at middleware boundary so service functions stay pure and reusable.
    assertPermission(auth.role, permission);
    return handler(request, auth);
  });
}
