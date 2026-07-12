"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import { Modal, Field, Select, Btn } from "@/components/ui";
import api, { apiError } from "@/lib/api";

export default function FuelPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null); // 'fuel' | 'expense'
  const [fuel, setFuel] = useState({ vehicle: "", liters: "", cost: "" });
  const [exp, setExp] = useState({ type: "TOLL", amount: "" });
  const [error, setError] = useState("");

  const { data: vehicles = [] } = useQuery({ queryKey: ["vehicles-all"], queryFn: async () => (await api.get("/vehicles/")).data });
  const { data: fuelLogs = [] } = useQuery({ queryKey: ["fuel"], queryFn: async () => (await api.get("/fuel/")).data });
  const { data: expenses = [] } = useQuery({ queryKey: ["expenses"], queryFn: async () => (await api.get("/expenses/")).data });
  const { data: maint = [] } = useQuery({ queryKey: ["maintenance"], queryFn: async () => (await api.get("/maintenance/")).data });

  const refresh = (k) => { qc.invalidateQueries({ queryKey: [k] }); setModal(null); setError(""); };
  const addFuel = useMutation({ mutationFn: (b) => api.post("/fuel/", b), onSuccess: () => { refresh("fuel"); setFuel({ vehicle: "", liters: "", cost: "" }); }, onError: (e) => setError(apiError(e)) });
  const addExp = useMutation({ mutationFn: (b) => api.post("/expenses/", b), onSuccess: () => { refresh("expenses"); setExp({ type: "TOLL", amount: "" }); }, onError: (e) => setError(apiError(e)) });

  const fuelTotal = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const maintTotal = maint.reduce((s, m) => s + m.cost, 0);
  const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const opCost = fuelTotal + maintTotal + expTotal;

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fuel & Expense Management</h1>
        <div className="flex gap-2">
          <Btn onClick={() => { setError(""); setModal("fuel"); }}>Log Fuel</Btn>
          <Btn variant="ghost" onClick={() => { setError(""); setModal("expense"); }}>Add Expense</Btn>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold">Fuel Logs</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wide text-gray-400">
            <tr><th className="py-2">Vehicle</th><th>Date</th><th>Liters</th><th>Fuel Cost</th></tr>
          </thead>
          <tbody>
            {fuelLogs.map((f) => (
              <tr key={f.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2">{f.vehicle_reg}</td><td>{new Date(f.date).toLocaleDateString()}</td>
                <td>{f.liters} L</td><td>{f.cost.toLocaleString()}</td>
              </tr>
            ))}
            {fuelLogs.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-gray-400">No fuel logs</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
        <h2 className="mb-3 text-sm font-semibold">Other Expenses (Toll / Misc)</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-[11px] uppercase tracking-wide text-gray-400">
            <tr><th className="py-2">Type</th><th>Amount</th><th>Date</th></tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="py-2">{e.type}</td><td>{e.amount.toLocaleString()}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
              </tr>
            ))}
            {expenses.length === 0 && <tr><td colSpan={3} className="py-4 text-center text-gray-400">No expenses</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between rounded-lg border-2 border-brand/30 bg-brand/5 px-5 py-3 dark:border-brand/40 dark:bg-brand/10">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Operational Cost (auto) = Fuel + Maintenance + Expenses</span>
        <span className="text-xl font-bold text-brand-dark">{opCost.toLocaleString()}</span>
      </div>

      {modal === "fuel" && (
        <Modal title="Log Fuel" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Select label="Vehicle" value={fuel.vehicle} onChange={(e) => setFuel({ ...fuel, vehicle: e.target.value })}>
              <option value="">Select…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg_no}</option>)}
            </Select>
            <Field label="Liters" type="number" value={fuel.liters} onChange={(e) => setFuel({ ...fuel, liters: e.target.value })} />
            <Field label="Cost" type="number" value={fuel.cost} onChange={(e) => setFuel({ ...fuel, cost: e.target.value })} />
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
            <Btn disabled={!fuel.vehicle} onClick={() => addFuel.mutate({ vehicle: Number(fuel.vehicle), liters: Number(fuel.liters), cost: Number(fuel.cost) })}>Save</Btn>
          </div>
        </Modal>
      )}
      {modal === "expense" && (
        <Modal title="Add Expense" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <Select label="Type" value={exp.type} onChange={(e) => setExp({ ...exp, type: e.target.value })}>
              <option value="TOLL">Toll</option><option value="MISC">Misc</option><option value="MAINTENANCE">Maintenance</option>
            </Select>
            <Field label="Amount" type="number" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} />
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
            <Btn disabled={!exp.amount} onClick={() => addExp.mutate({ type: exp.type, amount: Number(exp.amount) })}>Save</Btn>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
