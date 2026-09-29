/**
 * What this file does: Provides tenant-scoped budget persistence for project/team targets.
 * What calls it: `src/services/budgetService.ts` and `src/services/reportService.ts`.
 * What it calls: Prisma `budget` model operations.
 * Junior pitfall: Upserting without tenant scoping, which can overwrite another tenant's budget row.
 */
import { db } from "@/lib/db";
import type { BudgetTargetType } from "@prisma/client";
import type { MonthWindow } from "@/types/domain";

type UpsertBudgetInput = {
  tenantId: string;
  targetType: BudgetTargetType;
  teamId?: string;
  projectId?: string;
  monthStart: Date;
  amount: number;
  alertThresholdPct: number;
};

export async function createBudget(input: UpsertBudgetInput) {
  return db.budget.create({
    // ⚠️ SENIOR NOTE: use create intentionally; true upsert requires a tenant-safe unique key first.
    data: input
  });
}

export async function listBudgetsByMonth(tenantId: string, window: MonthWindow) {
  return db.budget.findMany({
    where: {
      // Tenant scoping keeps budget envelopes private per organization.
      tenantId,
      monthStart: {
        gte: window.monthStart,
        lt: window.monthEnd
      }
    },
    include: {
      team: true,
      project: true
    }
  });
}
