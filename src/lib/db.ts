/**
 * What this file does: Exposes a singleton Prisma client for server-side database access.
 * What calls it: Repository files under `src/repositories/*`.
 * What it calls: PrismaClient constructor.
 * Junior pitfall: Creating a new PrismaClient per request, which can exhaust DB connections in development.
 */
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const db = global.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  // ⚠️ SENIOR NOTE: global caching is dev-only to survive hot reloads without opening extra connections.
  global.prisma = db;
}
