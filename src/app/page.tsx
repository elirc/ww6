"use client";

import { useMemo } from "react";
import { useAnomalies } from "@/hooks/useAnomalies";
import { useChargebackReport } from "@/hooks/useChargebackReport";
import { AllocationRunPanel } from "@/components/dashboard/AllocationRunPanel";
import { AnomalyTable } from "@/components/dashboard/AnomalyTable";
import { CostSummaryCards } from "@/components/dashboard/CostSummaryCards";

function currentMonthStartIso() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export default function HomePage() {
  const monthStart = useMemo(currentMonthStartIso, []);
  const reportQuery = useChargebackReport(monthStart);
  const anomaliesQuery = useAnomalies(monthStart, false);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-10">
      <section className="rounded-2xl bg-slateBrand-900 p-6 text-white shadow-lg">
        <h1 className="text-3xl font-semibold">Infrastructure Cost Allocation and Chargeback</h1>
        <p className="mt-2 text-slate-200">
          Track cloud spend, execute allocation runs, and monitor anomalies for {new Date(monthStart).toLocaleDateString()}.
        </p>
      </section>

      <AllocationRunPanel monthStart={monthStart} />
      <CostSummaryCards isLoading={reportQuery.isLoading} report={reportQuery.data} error={reportQuery.error as Error | null} />
      <AnomalyTable isLoading={anomaliesQuery.isLoading} anomalies={anomaliesQuery.data?.items ?? []} />
    </main>
  );
}
