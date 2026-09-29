/**
 * What this file does: Tenant-scoped persistence for cloud cost line items.
 * What calls it: `src/services/ingestionService.ts`, `src/services/allocationEngineService.ts`, `src/services/anomalyService.ts`, and report services.
 * What it calls: Prisma `costLineItem` APIs through `src/lib/db.ts`.
 * Junior pitfall: Missing `tenantId` in a read query, which silently leaks another tenant's spend data.
 */
import { db } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";
import type { MonthWindow, PaginatedQuery } from "@/types/domain";

type CostLineItemClient = Pick<PrismaClient, "costLineItem">;

type CreateCostLineItemInput = {
  tenantId: string;
  projectId?: string;
  cloudProvider: string;
  externalResourceId: string;
  service: string;
  region?: string;
  usageDate: Date;
  amount: number;
  currency: string;
  tags: Record<string, string>;
  source: string;
};

export async function createManyCostLineItems(
  records: CreateCostLineItemInput[],
  client: CostLineItemClient = db
) {
  return client.costLineItem.createMany({
    data: records
  });
}

export async function listCostLineItemsByMonth(
  tenantId: string,
  window: MonthWindow,
  pagination: PaginatedQuery,
  client: CostLineItemClient = db
) {
  return client.costLineItem.findMany({
    where: {
      // Tenant boundary is explicit because cost line items are tenant-owned financial records.
      tenantId,
      usageDate: {
        gte: window.monthStart,
        lt: window.monthEnd
      }
    },
    orderBy: [{ usageDate: "desc" }, { service: "asc" }],
    take: pagination.limit ?? 100,
    skip: pagination.offset ?? 0
  });
}

export async function listAllCostLineItemsByMonth(
  tenantId: string,
  window: MonthWindow,
  client: CostLineItemClient = db
) {
  return client.costLineItem.findMany({
    where: {
      // Tenant boundary must be in every query to prevent cross-tenant reporting leaks.
      tenantId,
      usageDate: {
        gte: window.monthStart,
        lt: window.monthEnd
      }
    }
  });
}

export async function aggregateCostByService(
  tenantId: string,
  window: MonthWindow,
  client: CostLineItemClient = db
) {
  const grouped = await client.costLineItem.groupBy({
    by: ["service"],
    where: {
      // ?? SENIOR NOTE: removing this filter would produce financially plausible but incorrect cross-tenant totals.
      tenantId,
      usageDate: {
        gte: window.monthStart,
        lt: window.monthEnd
      }
    },
    _sum: {
      amount: true
    },
    orderBy: {
      _sum: {
        amount: "desc"
      }
    }
  });

  return grouped.map((row) => ({
    service: row.service,
    totalAmount: Number(row._sum.amount ?? 0)
  }));
}
