"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { Modal, Field, Select, Btn } from "@/components/ui";
import api, { apiError } from "@/lib/api";

const BLANK = { name: "", license_no: "", license_cat: "LMV", license_expiry: "", contact: "", safety_score: 100, status: "AVAILABLE" };

function isExpired(dateStr) {
  return new Date(dateStr) <= new Date();
}

export default function DriversPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");

  const { data = [], isLoading } = useQuery({
    queryKey: ["drivers", filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      return (await api.get("/drivers/", { params })).data;
    },
  });

  const create = useMutation({
    mutationFn: (body) => api.post("/drivers/", body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["drivers"] }); setOpen(false); setForm(BLANK); setError(""); },
    onError: (e) => setError(apiError(e)),
  });

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Drivers & Safety Profiles</h1>
        <Btn onClick={() => { setForm(BLANK); setError(""); setOpen(true); }}>
          <span className="flex items-center gap-1"><Plus size={14} /> Add Driver</span>
        </Btn>
      </div>

      <div className="mb-4 flex gap-3">
        <select className="rounded-md border border-gray-200 px-3 py-1.5 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Status: All</option>
          <option value="AVAILABLE">Available</option><option value="ON_TRIP">On Trip</option>
          <option value="OFF_DUTY">Off Duty</option><option value="SUSPENDED">Suspended</option>
        </select>
        <input placeholder="Search name / license…" className="rounded-md border border-gray-200 px-3 py-1.5 text-sm" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-400">
            <tr>
              <th className="px-4 py-2">Driver</th><th>License No.</th><th>Category</th>
              <th>Expiry</th><th>Contact</th><th>Safety</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Loading…</td></tr>
            ) : data.map((d) => (
              <tr key={d.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium">{d.name}</td>
                <td>{d.license_no}</td><td>{d.license_cat}</td>
                <td className={isExpired(d.license_expiry) ? "font-medium text-red-600" : ""}>
                  {d.license_expiry}{isExpired(d.license_expiry) && " · EXPIRED"}
                </td>
                <td>{d.contact}</td><td>{d.safety_score}%</td>
                <td><StatusBadge status={d.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-orange-600">Rule: Expired license or Suspended status → blocked from trip assignment.</p>

      {open && (
        <Modal title="Add Driver" onClose={() => setOpen(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Field label="License No." value={form.license_no} onChange={(e) => setForm({ ...form, license_no: e.target.value })} />
            <Select label="Category" value={form.license_cat} onChange={(e) => setForm({ ...form, license_cat: e.target.value })}>
              <option>LMV</option><option>HMV</option>
            </Select>
            <Field label="License Expiry" type="date" value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} />
            <Field label="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <Field label="Safety Score" type="number" value={form.safety_score} onChange={(e) => setForm({ ...form, safety_score: e.target.value })} />
          </div>
          {error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}
          <div className="mt-4 flex justify-end gap-2">
            <Btn variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn>
            <Btn onClick={() => create.mutate({ ...form, safety_score: Number(form.safety_score) })} disabled={create.isPending}>Save</Btn>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
