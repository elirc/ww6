/**
 * What this file does: Lists or refreshes anomaly detection results for a month.
 * What calls it: Anomaly panel in dashboard.
 * What it calls: `withRole` and anomaly service.
 * Junior pitfall: Running expensive anomaly detection every GET without a refresh flag.
 */
import { NextResponse } from "next/server";
import { withRole } from "@/lib/middleware/withRole";
import { detectAnomaliesForMonth, getAnomaliesForMonth } from "@/services/anomalyService";

function currentMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export const GET = withRole("readAnomalies", async (request, auth) => {
  const monthStart = request.nextUrl.searchParams.get("monthStart") ?? currentMonthStartIso();
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  // ⚠️ SENIOR NOTE: refresh flag avoids expensive recomputation on every dashboard poll.
  const anomalies = refresh
    ? await detectAnomaliesForMonth(auth.tenantId, monthStart)
    : await getAnomaliesForMonth(auth.tenantId, monthStart);

  return NextResponse.json({ items: anomalies });
});
