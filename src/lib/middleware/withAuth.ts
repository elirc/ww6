/**
 * What this file does: Enforces authentication before API handlers run.
 * What calls it: `src/lib/middleware/withRole.ts` and route handlers needing auth-only access.
 * What it calls: `requireSession` and `toErrorResponse`.
 * Junior pitfall: Catching errors inside handlers instead of middleware, causing duplicated and inconsistent auth behavior.
 */
import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { toErrorResponse } from "@/lib/http/response";
import type { AuthContext } from "@/types/domain";

export type AuthenticatedHandler = (
  request: NextRequest,
  auth: AuthContext
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const auth = await requireSession(request);
      return await handler(request, auth);
    } catch (error) {
      // ⚠️ SENIOR NOTE: centralized error mapping keeps auth failures structurally consistent for SIEM alerting.
      return toErrorResponse(error);
    }
  };
}
