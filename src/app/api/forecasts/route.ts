/**
 * What this file does: Lists or regenerates monthly budget forecasts.
 * What calls it: Forecast widgets in dashboard.
 * What it calls: `withRole` and forecast service.
 * Junior pitfall: Letting anyone regenerate forecasts; this route gates writes to reporting roles.
 */
import { NextResponse } from "next/server";
import { withRole } from "@/lib/middleware/withRole";
import { generateForecastForMonth, getForecastForMonth } from "@/services/forecastService";

function currentMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export const GET = withRole("readForecasts", async (request, auth) => {
  const monthStart = request.nextUrl.searchParams.get("monthStart") ?? currentMonthStartIso();
  const refresh = request.nextUrl.searchParams.get("refresh") === "true";

  // ⚠️ SENIOR NOTE: explicit regeneration path helps separate deterministic reads from mutating forecast snapshots.
  const forecasts = refresh
    ? await generateForecastForMonth(auth.tenantId, monthStart)
    : await getForecastForMonth(auth.tenantId, monthStart);

  return NextResponse.json({ items: forecasts });
});
