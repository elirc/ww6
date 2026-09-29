/**
 * What this file does: Creates and lists allocation rules.
 * What calls it: Rule management UI hooks.
 * What it calls: `withRole`, allocation rule schemas, and allocationRule service.
 * Junior pitfall: Letting read-only roles create rules because GET and POST share a route file.
 */
import { NextResponse } from "next/server";
import { withRole } from "@/lib/middleware/withRole";
import { createAllocationRuleSchema } from "@/lib/validation/allocationSchemas";
import { createRule, listRules } from "@/services/allocationRuleService";

export const GET = withRole("readReports", async (_request, auth) => {
  const rules = await listRules(auth.tenantId);
  return NextResponse.json({ items: rules });
});

export const POST = withRole("manageRules", async (request, auth) => {
  // ⚠️ SENIOR NOTE: write path intentionally has stricter role gate than GET to reduce policy blast radius.
  const payload = createAllocationRuleSchema.parse(await request.json());
  const rule = await createRule(auth.tenantId, payload);
  return NextResponse.json({ item: rule }, { status: 201 });
});
