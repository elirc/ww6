"use client";

type Props = {
  isLoading: boolean;
  report:
    | {
        runStatus: string;
        byService: Array<{ service: string; totalAmount: number }>;
        byTeam: Array<{ allocatedTeamId: string | null; totalAllocated: number }>;
      }
    | undefined;
  error: Error | null;
};

export function CostSummaryCards({ isLoading, report, error }: Props) {
  if (isLoading) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-5">Loading report...</section>;
  }

  if (error) {
    return <section className="rounded-2xl border border-red-200 bg-red-50 p-5">{error.message}</section>;
  }

  const totalServiceSpend = report?.byService.reduce((sum, item) => sum + item.totalAmount, 0) ?? 0;
  const totalAllocated = report?.byTeam.reduce((sum, item) => sum + item.totalAllocated, 0) ?? 0;

  return (
    <section className="grid gap-4 md:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Run Status</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{report?.runStatus ?? "N/A"}</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Service Spend</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-900">${totalServiceSpend.toFixed(2)}</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-medium text-slate-500">Allocated Total</h3>
        <p className="mt-2 text-2xl font-semibold text-slate-900">${totalAllocated.toFixed(2)}</p>
      </article>
    </section>
  );
}
