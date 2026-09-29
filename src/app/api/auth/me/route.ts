/**
 * What this file does: Returns the authenticated session context for frontend bootstrapping.
 * What calls it: `src/hooks/useCurrentSession.ts` (or any client bootstrap fetch).
 * What it calls: `withAuth` middleware.
 * Junior pitfall: Returning session details without forcing auth middleware first.
 */
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/middleware/withAuth";

export const GET = withAuth(async (_request, auth) => {
  // ⚠️ SENIOR NOTE: exposing tenantId is intentional for client context; avoid returning internal permission matrices here.
  return NextResponse.json({
    user: {
      id: auth.userId,
      tenantId: auth.tenantId,
      email: auth.email,
      name: auth.name,
      role: auth.role
    }
  });
});
