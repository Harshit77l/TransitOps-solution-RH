"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import VehicleDocsModal from "@/components/VehicleDocsModal";
import { Modal, Field, Select, Btn } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import api, { apiError } from "@/lib/api";

const BLANK = { reg_no: "", name: "", type: "Van", capacity_kg: "", odometer: 0, acquisition_cost: "", status: "AVAILABLE" };

export default function VehiclesPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canManageDocs = user?.role === "FLEET_MANAGER";
  const [filters, setFilters] = useState({ type: "", status: "", search: "", ordering: "reg_no" });
  const [open, setOpen] = useState(false);
  const [docsVehicle, setDocsVehicle] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["vehicles", filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      return (await api.get("/vehicles/", { params })).data;
    },
  });

  const create = useMutation({
    mutationFn: (body) => api.post("/vehicles/", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); setOpen(false); setForm(BLANK); setError(""); },
    onError: (e) => setError(apiError(e)),
  });

  function submit() {
    create.mutate({
      ...form,
      capacity_kg: Number(form.capacity_kg),
      odometer: Number(form.odometer),
      acquisition_cost: Number(form.acquisition_cost),
    });
  }

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vehicle Registry</h1>
        <Btn onClick={() => { setForm(BLANK); setError(""); setOpen(true); }}>
          <span className="flex items-center gap-1"><Plus size={14} /> Add Vehicle</span>
        </Btn>
      </div>

      {/* Filters (bonus: search / filter / sort) */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select className="rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">Type: All</option><option>Van</option><option>Truck</option><option>Mini</option>
        </select>
        <select className="rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Status: All</option>
          <option value="AVAILABLE">Available</option><option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option><option value="RETIRED">Retired</option>
        </select>
        <input placeholder="Search reg. no…" className="rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="rounded-md border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100" value={filters.ordering} onChange={(e) => setFilters({ ...filters, ordering: e.target.value })}>
          <option value="reg_no">Sort: Reg No</option><option value="capacity_kg">Capacity ↑</option>
          <option value="-capacity_kg">Capacity ↓</option><option value="-acquisition_cost">Cost ↓</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-2">Reg No</th><th>Name/Model</th><th>Type</th>
              <th>Capacity</th><th>Odometer</th><th>Acq. Cost</th><th>Status</th><th>Docs</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
            ) : data.map((v) => (
              <tr key={v.id} className="border-t border-gray-100 dark:border-gray-800">
                <td className="px-4 py-2 font-medium">{v.reg_no}</td>
                <td>{v.name}</td><td>{v.type}</td>
                <td>{v.capacity_kg} kg</td><td>{v.odometer.toLocaleString()}</td>
                <td>{v.acquisition_cost.toLocaleString()}</td>
                <td><StatusBadge status={v.status} /></td>
                <td>
                  <button
                    onClick={() => setDocsVehicle(v)}
                    className="flex items-center gap-1 text-xs font-medium text-brand-dark hover:underline dark:text-brand"
                  >
                    <FileText size={13} /> Docs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-orange-600">Rule: Registration No. must be unique. Retired / In Shop vehicles are hidden from Trip Dispatcher.</p>

      {open && (
        <Modal title="Add Vehicle" onClose={() => setOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Reg No" value={form.reg_no} onChange={(e) => setForm({ ...form, reg_no: e.target.value })} />
            <Field label="Name / Model" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option>Van</option><option>Truck</option><option>Mini</option>
            </Select>
            <Field label="Capacity (kg)" type="number" value={form.capacity_kg} onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })} />
            <Field label="Odometer" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} />
            <Field label="Acquisition Cost" type="number" value={form.acquisition_cost} onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })} />
          </div>
          {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn onClick={submit} disabled={create.isPending}>Save</Btn>
          </div>
        </Modal>
      )}
      {docsVehicle && (
        <VehicleDocsModal vehicle={docsVehicle} onClose={() => setDocsVehicle(null)} />
      )}
    </Layout>
  );
}
