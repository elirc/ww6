/**
 * What this file does: Fetches chargeback report snapshots via React Query.
 * What calls it: `src/app/page.tsx` dashboard.
 * What it calls: `apiFetch` helper.
 * Junior pitfall: Parsing response in components repeatedly instead of typed hook boundary.
 */
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/http/client";

export function useChargebackReport(monthStart: string) {
  return useQuery({
    queryKey: ["chargeback-report", monthStart],
    queryFn: () =>
      apiFetch<{
        monthStart: string;
        runStatus: string;
        runId?: string;
        byService: Array<{ service: string; totalAmount: number }>;
        byTeam: Array<{ allocatedTeamId: string | null; totalAllocated: number }>;
        byProject: Array<{ allocatedProjectId: string | null; totalAllocated: number }>;
        budgets: Array<{ id: string; amount: string }>;
      }>("/api/reports/chargeback", {
        query: { monthStart }
      })
  });
}
