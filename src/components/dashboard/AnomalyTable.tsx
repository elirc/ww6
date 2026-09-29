"use client";

type Props = {
  isLoading: boolean;
  anomalies: Array<{ id: string; severity: string; message: string; actualAmount: string }>;
};

export function AnomalyTable({ isLoading, anomalies }: Props) {
  if (isLoading) {
    return <section className="rounded-2xl border border-slate-200 bg-white p-5">Loading anomalies...</section>;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold text-slate-900">Anomalies</h2>
      <p className="mt-1 text-sm text-slate-600">Detected outliers based on spend trend by service.</p>
      <table className="mt-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600">
            <th className="pb-2">Severity</th>
            <th className="pb-2">Message</th>
            <th className="pb-2">Actual Amount</th>
          </tr>
        </thead>
        <tbody>
          {anomalies.map((item) => (
            <tr key={item.id} className="border-b border-slate-100">
              <td className="py-2 font-medium">{item.severity}</td>
              <td className="py-2">{item.message}</td>
              <td className="py-2">${Number(item.actualAmount).toFixed(2)}</td>
            </tr>
          ))}
          {anomalies.length === 0 ? (
            <tr>
              <td className="py-4 text-slate-500" colSpan={3}>
                No anomalies for this month.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </section>
  );
}
