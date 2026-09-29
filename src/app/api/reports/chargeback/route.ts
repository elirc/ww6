/**
 * What this file does: Returns monthly chargeback report snapshots.
 * What calls it: Reporting dashboard and exports.
 * What it calls: `withRole` and `reportService`.
 * Junior pitfall: Computing allocation logic directly in route handlers instead of service layer.
 */
import { NextResponse } from "next/server";
import { withRole } from "@/lib/middleware/withRole";
import { getChargebackReport } from "@/services/reportService";

function currentMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export const GET = withRole("readReports", async (request, auth) => {
  const monthStart = request.nextUrl.searchParams.get("monthStart") ?? currentMonthStartIso();
  // ⚠️ SENIOR NOTE: readReports includes VIEWER by design; if this endpoint later includes sensitive tags, revisit permission scope.
  const report = await getChargebackReport(auth.tenantId, monthStart);

  return NextResponse.json(report);
});
