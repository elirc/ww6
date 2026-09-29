/**
 * What this file does: Looks up users for authentication/session resolution.
 * What calls it: `src/lib/auth/session.ts`.
 * What it calls: Prisma user model via `src/lib/db.ts`.
 * Junior pitfall: Attempting auth with unscoped email queries instead of immutable user id lookup.
 */
import { db } from "@/lib/db";

export async function findUserById(userId: string) {
  return db.user.findUnique({
    // ⚠️ SENIOR NOTE: user id must remain globally unique; if that changes, auth lookup must include tenant.
    where: { id: userId }
  });
}
