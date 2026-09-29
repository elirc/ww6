/**
 * What this file does: Stores and retrieves allocation rules scoped to a tenant.
 * What calls it: `src/services/allocationEngineService.ts` and `src/services/allocationRuleService.ts`.
 * What it calls: Prisma `allocationRule` model operations.
 * Junior pitfall: Trusting rule weights without validation, which can over-allocate a single cost item.
 */
import { db } from "@/lib/db";

type CreateAllocationRuleInput = {
  tenantId: string;
  name: string;
  matchTagKey: string;
  matchTagValue: string;
  weightPercent: number;
  targetTeamId?: string;
  targetProjectId?: string;
};

export async function listAllocationRules(tenantId: string) {
  return db.allocationRule.findMany({
    where: {
      // Tenant scoping is required because rules encode org-specific chargeback policy.
      tenantId
    },
    include: {
      team: true,
      project: true
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }]
  });
}

export async function listActiveAllocationRules(tenantId: string) {
  return db.allocationRule.findMany({
    where: {
      // Tenant boundary + active state keeps allocation runs deterministic for one org.
      tenantId,
      isActive: true
    },
    // ⚠️ SENIOR NOTE: deterministic ordering prevents run-to-run drift when rules have overlapping matches.
    orderBy: [{ weightPercent: "desc" }]
  });
}

export async function createAllocationRule(input: CreateAllocationRuleInput) {
  return db.allocationRule.create({
    data: input,
    include: {
      team: true,
      project: true
    }
  });
}
