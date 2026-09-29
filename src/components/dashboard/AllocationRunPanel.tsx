"use client";

import { useAllocationRuns, useTriggerAllocationRun } from "@/hooks/useAllocationRuns";

export function AllocationRunPanel({ monthStart }: { monthStart: string }) {
  const runQuery = useAllocationRuns();
  const runMutation = useTriggerAllocationRun(monthStart);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Allocation Runs</h2>
          <p className="text-sm text-slate-600">Queue an asynchronous allocation run for this reporting month.</p>
        </div>
        <button
          className="rounded-lg bg-slateBrand-700 px-4 py-2 text-sm font-medium text-white hover:bg-slateBrand-800 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
        >
          {runMutation.isPending ? "Queueing..." : "Run Allocation"}
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {runQuery.data?.items.map((run) => (
          <li key={run.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
            <span className="font-mono text-xs text-slate-500">{run.id}</span>
            <span className="font-medium text-slate-700">{run.status}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
