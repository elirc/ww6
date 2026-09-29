/**
 * What this file does: Builds chargeback report payloads by combining allocations, raw spend, and budgets.
 * What calls it: `src/app/api/reports/chargeback/route.ts`.
 * What it calls: report, cost, and budget repositories.
 * Junior pitfall: Assuming reports can be built only from raw cost lines without immutable allocation run snapshots.
 */
import { toUtcMonthWindow } from "@/lib/time/month";
import { listBudgetsByMonth } from "@/repositories/budgetRepository";
import { aggregateCostByService } from "@/repositories/costLineItemRepository";
import {
  aggregateAllocationByProject,
  aggregateAllocationByTeam,
  findLatestCompletedRunForMonth
} from "@/repositories/reportRepository";

export async function getChargebackReport(tenantId: string, monthStartIso: string) {
  const window = toUtcMonthWindow(monthStartIso);

  const [latestRun, serviceSpend, budgets] = await Promise.all([
    findLatestCompletedRunForMonth(tenantId, window.monthStart),
    aggregateCostByService(tenantId, window),
    listBudgetsByMonth(tenantId, window)
  ]);

  if (!latestRun) {
    // ⚠️ SENIOR NOTE: explicit no-run response prevents consumers from confusing missing data with zero spend.
    return {
      monthStart: window.monthStart.toISOString(),
      runStatus: "NO_COMPLETED_RUN",
      byService: serviceSpend,
      byTeam: [],
      byProject: [],
      budgets
    };
  }

  const [byTeam, byProject] = await Promise.all([
    aggregateAllocationByTeam(tenantId, latestRun.id),
    aggregateAllocationByProject(tenantId, latestRun.id)
  ]);

  return {
    monthStart: window.monthStart.toISOString(),
    runStatus: latestRun.status,
    runId: latestRun.id,
    byService: serviceSpend,
    byTeam,
    byProject,
    budgets
  };
}
