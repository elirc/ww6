/**
 * What this file does: Starts allocation runs asynchronously and lists recent run history.
 * What calls it: Allocation run dashboard controls.
 * What it calls: `withRole`, run schema, and allocation run service.
 * Junior pitfall: Returning 200 before run record is created, which loses auditability.
 */
import { NextResponse } from "next/server";
import { withRole } from "@/lib/middleware/withRole";
import { createAllocationRunSchema } from "@/lib/validation/allocationSchemas";
import { createRunAndQueue, listRuns } from "@/services/allocationRunService";

export const GET = withRole("readReports", async (_request, auth) => {
  const runs = await listRuns(auth.tenantId);
  return NextResponse.json({ items: runs });
});

export const POST = withRole("runAllocation", async (request, auth) => {
  // ⚠️ SENIOR NOTE: returning 202 communicates async semantics to API clients and avoids false assumptions of completion.
  const payload = createAllocationRunSchema.parse(await request.json());
  const run = await createRunAndQueue(auth, payload.monthStart);

  return NextResponse.json(
    {
      item: run,
      message: "Allocation run queued"
    },
    { status: 202 }
  );
});
