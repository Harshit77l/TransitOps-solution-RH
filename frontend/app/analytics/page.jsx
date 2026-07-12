"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Layout from "@/components/Layout";
import { KpiCard, Btn } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import api from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function download(path, filename) {
  const token = localStorage.getItem("access");
  fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.blob())
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    });
}

export default function AnalyticsPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { data } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await api.get("/analytics/")).data,
  });

  const costColors = ["#ef4444", "#f59e0b", "#3b82f6", "#94a3b8", "#94a3b8"];
  const axisColor = dark ? "#9ca3af" : "#6b7280";
  const tooltipStyle = dark
    ? { backgroundColor: "#1f2937", border: "1px solid #374151", color: "#f3f4f6" }
    : undefined;

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reports & Analytics</h1>
        <div className="flex gap-2">
          <Btn variant="ghost" onClick={() => download("/analytics/export/", "transitops_analytics.csv")}>Export CSV</Btn>
          <Btn variant="ghost" onClick={() => download("/analytics/export_pdf/", "transitops_analytics.pdf")}>Export PDF</Btn>
        </div>
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

          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-sm font-semibold">Top Costliest Vehicles</h2>
            <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topCostly} layout="vertical" margin={{ left: 20 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: axisColor }} />
                <YAxis type="category" dataKey="vehicle" tick={{ fontSize: 11, fill: axisColor }} width={90} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }} />
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
