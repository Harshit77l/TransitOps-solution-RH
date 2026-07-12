"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload, Trash2 } from "lucide-react";
import { Modal, Field, Select, Btn } from "@/components/ui";
import api, { apiError } from "@/lib/api";

const DOC_TYPES = [
  ["RC", "Registration Certificate"],
  ["INSURANCE", "Insurance"],
  ["PERMIT", "Permit"],
  ["FITNESS", "Fitness Certificate"],
  ["PUC", "Pollution Certificate"],
  ["OTHER", "Other"],
];

function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const days = (new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

export default function VehicleDocsModal({ vehicle, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ doc_type: "INSURANCE", title: "", expiry: "" });
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["vehicle-documents", vehicle.id],
    queryFn: async () => (await api.get("/vehicle-documents/", { params: { vehicle: vehicle.id } })).data,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["vehicle-documents", vehicle.id] });

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("vehicle", vehicle.id);
      fd.append("doc_type", form.doc_type);
      if (form.title) fd.append("title", form.title);
      if (form.expiry) fd.append("expiry", form.expiry);
      fd.append("file", file);
      return api.post("/vehicle-documents/", fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onSuccess: () => { refresh(); setForm({ doc_type: "INSURANCE", title: "", expiry: "" }); setFile(null); setError(""); },
    onError: (e) => setError(apiError(e)),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/vehicle-documents/${id}/`),
    onSuccess: refresh,
    onError: (e) => setError(apiError(e)),
  });

  return (
    <Modal title={`Documents — ${vehicle.reg_no}`} onClose={onClose}>
      {/* Existing documents */}
      <div className="mb-4 max-h-56 space-y-2 overflow-auto">
        {isLoading ? (
          <div className="text-sm text-gray-400">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="text-sm text-gray-400 dark:text-gray-500">No documents uploaded yet.</div>
        ) : docs.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 dark:border-gray-700">
            <a href={d.file} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-dark hover:underline dark:text-brand">
              <FileText size={14} />
              <span>{d.title || DOC_TYPES.find((t) => t[0] === d.doc_type)?.[1] || d.doc_type}</span>
            </a>
            <div className="flex items-center gap-3">
              {d.expiry && (
                <span className={`text-xs ${isExpiringSoon(d.expiry) ? "font-medium text-orange-500" : "text-gray-400 dark:text-gray-500"}`}>
                  exp {d.expiry}
                </span>
              )}
              <button onClick={() => remove.mutate(d.id)} className="text-gray-400 hover:text-red-500" aria-label="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Upload form */}
      <div className="space-y-3 border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-3">
          <Select label="Document Type" value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })}>
            {DOC_TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </Select>
          <Field label="Expiry (optional)" type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} />
        </div>
        <Field label="Title (optional)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label className="block text-sm">
          <span className="mb-1 block text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">File</span>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-brand-dark dark:text-gray-300"
          />
        </label>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
        <Btn disabled={!file || upload.isPending} onClick={() => upload.mutate()}>
          <span className="flex items-center gap-1"><Upload size={14} /> {upload.isPending ? "Uploading…" : "Upload"}</span>
        </Btn>
      </div>
    </Modal>
  );
}
