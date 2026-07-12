"use client";

import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { KpiCard } from "@/components/ui";
import api from "@/lib/api";

function Bar({ label, value, total, color }) {
  const pct = total ? (value / total) * 100 : 0;
  return (
    <div className="mb-2">
      <div className="mb-1 flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 rounded bg-gray-100">
        <div className={`h-2 rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["kpis"],
    queryFn: async () => (await api.get("/dashboard/kpis/")).data,
  });

  return (
    <Layout>
      <h1 className="mb-4 text-xl font-semibold">Dashboard</h1>
      {isLoading || !data ? (
        <div className="text-gray-400">Loading…</div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <KpiCard label="Active Vehicles" value={data.activeVehicles} />
            <KpiCard label="Available" value={data.availableVehicles} accent="text-green-600" />
            <KpiCard label="In Maintenance" value={data.inMaintenance} accent="text-orange-500" />
            <KpiCard label="Active Trips" value={data.activeTrips} accent="text-blue-600" />
            <KpiCard label="Pending Trips" value={data.pendingTrips} />
            <KpiCard label="Drivers On Duty" value={data.driversOnDuty} />
            <KpiCard label="Fleet Utilization" value={`${data.fleetUtilization}%`} accent="text-brand-dark" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold">Recent Trips</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
                    <th className="py-2">Trip</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTrips.map((t) => (
                    <tr key={t.id} className="border-t border-gray-100">
                      <td className="py-2">TRIP-{t.id}</td>
                      <td>{t.vehicle_reg}</td>
                      <td>{t.driver_name}</td>
                      <td><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                  {data.recentTrips.length === 0 && (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-400">No trips yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <h2 className="mb-3 text-sm font-semibold">Vehicle Status</h2>
              {(() => {
                const b = data.vehicleStatusBreakdown;
                const total = b.available + b.onTrip + b.inShop + b.retired || 1;
                return (
                  <>
                    <Bar label="Available" value={b.available} total={total} color="bg-green-500" />
                    <Bar label="On Trip" value={b.onTrip} total={total} color="bg-blue-500" />
                    <Bar label="In Shop" value={b.inShop} total={total} color="bg-orange-500" />
                    <Bar label="Retired" value={b.retired} total={total} color="bg-red-500" />
                  </>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
