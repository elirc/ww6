/**
 * What this file does: Lists allocation runs and exposes mutation to trigger a new run.
 * What calls it: `src/components/dashboard/AllocationRunPanel.tsx`.
 * What it calls: `apiFetch` and React Query cache invalidation.
 * Junior pitfall: Triggering runs without invalidating report/run queries, leading to stale UI.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/http/client";

export function useAllocationRuns() {
  return useQuery({
    queryKey: ["allocation-runs"],
    queryFn: () => apiFetch<{ items: Array<{ id: string; status: string; createdAt: string }> }>("/api/allocation-runs")
  });
}

export function useTriggerAllocationRun(monthStart: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<{ item: { id: string } }>("/api/allocation-runs", {
        method: "POST",
        body: { monthStart }
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["allocation-runs"] }),
        queryClient.invalidateQueries({ queryKey: ["chargeback-report", monthStart] })
      ]);
    }
  });
}
