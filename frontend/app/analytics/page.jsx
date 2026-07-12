"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Layout from "@/components/Layout";
import { KpiCard, Btn } from "@/components/ui";
import api from "@/lib/api";

export default function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/analytics/")).data,
  });

  function exportCsv() {
    const token = localStorage.getItem("access");
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/analytics/export/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transitops_analytics.csv";
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  const costColors = ["#ef4444", "#f59e0b", "#3b82f6", "#94a3b8", "#94a3b8"];

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reports & Analytics</h1>
        <Btn variant="ghost" onClick={exportCsv}>Export CSV</Btn>
      </div>

      {!data ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Fuel Efficiency" value={`${data.fuelEfficiency} km/l`} />
            <KpiCard label="Fleet Utilization" value={`${data.fleetUtilization}%`} accent="text-brand-dark" />
            <KpiCard label="Operational Cost" value={data.operationalCost.toLocaleString()} accent="text-orange-500" />
            <KpiCard label="Vehicle ROI" value={`${data.vehicleRoi}%`} accent={data.vehicleRoi >= 0 ? "text-green-600" : "text-red-600"} />
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold">Top Costliest Vehicles</h2>
            <p className="mb-3 text-xs text-gray-400">ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topCostly} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 11 }} width={90} />
                <Tooltip />
                <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                  {data.topCostly.map((_, i) => <Cell key={i} fill={costColors[i] || "#94a3b8"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Layout>
  );
}
