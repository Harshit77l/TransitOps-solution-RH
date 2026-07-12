"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { Field, Select, Btn } from "@/components/ui";
import api, { apiError } from "@/lib/api";

export default function MaintenancePage() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ vehicle: "", service: "Oil Change", cost: "" });
  const [error, setError] = useState("");

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles-all"],
    queryFn: async () => (await api.get("/vehicles/")).data,
  });
  const { data: logs = [] } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => (await api.get("/maintenance/")).data,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["maintenance"] });
    qc.invalidateQueries({ queryKey: ["vehicles-all"] });
    qc.invalidateQueries({ queryKey: ["kpis"] });
  };

  const create = useMutation({
    mutationFn: (body) => api.post("/maintenance/", body),
    onSuccess: () => { refresh(); setForm({ vehicle: "", service: "Oil Change", cost: "" }); setError(""); },
    onError: (e) => setError(apiError(e)),
  });
  const close = useMutation({
    mutationFn: (id) => api.post(`/maintenance/${id}/close/`),
    onSuccess: refresh,
  });

  return (
    <Layout>
      <h1 className="mb-4 text-xl font-semibold">Maintenance</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold">Log Service Record</h2>
          <div className="space-y-3">
            <Select label="Vehicle" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
              <option value="">Select vehicle…</option>
              {vehicles.filter((v) => v.status !== "RETIRED").map((v) => (
                <option key={v.id} value={v.id}>{v.reg_no} ({v.status})</option>
              ))}
            </Select>
            <Select label="Service Type" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}>
              <option>Oil Change</option><option>Engine Repair</option><option>Tyre Replace</option><option>Brake Service</option>
            </Select>
            <Field label="Cost" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
            <Btn disabled={!form.vehicle || !form.cost || create.isPending} onClick={() => create.mutate({ ...form, vehicle: Number(form.vehicle), cost: Number(form.cost) })}>Save</Btn>
          </div>
          <p className="mt-4 text-xs text-orange-600">Opening a record → vehicle becomes In Shop and is removed from the dispatch pool. Closing → back to Available.</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold">Service Log</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-wide text-gray-400">
              <tr><th className="py-2">Vehicle</th><th>Service</th><th>Cost</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {logs.map((m) => (
                <tr key={m.id} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="py-2">{m.vehicle_reg}</td><td>{m.service}</td>
                  <td>{m.cost.toLocaleString()}</td><td><StatusBadge status={m.status} /></td>
                  <td>{m.status === "ACTIVE" && <button className="text-xs font-medium text-green-600 hover:underline" onClick={() => close.mutate(m.id)}>Close</button>}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="py-4 text-center text-gray-400">No records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
