/**
 * What this file does: Retrieves anomaly list and supports optional refresh recomputation.
 * What calls it: `src/app/page.tsx` and anomaly UI components.
 * What it calls: `apiFetch` helper.
 * Junior pitfall: Mixing mutation-like refresh behavior with normal read query keys.
 */
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/http/client";

export function useAnomalies(monthStart: string, refresh = false) {
  return useQuery({
    queryKey: ["anomalies", monthStart, refresh],
    queryFn: () =>
      apiFetch<{ items: Array<{ id: string; severity: string; message: string; actualAmount: string }> }>(
        "/api/anomalies",
        {
          query: {
            monthStart,
            refresh: refresh ? "true" : undefined
          }
        }
      )
  });
}
