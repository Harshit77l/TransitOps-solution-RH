"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import StatusBadge from "@/components/StatusBadge";
import { Modal, Field, Select, Btn } from "@/components/ui";
import api, { apiError } from "@/lib/api";

const LIFECYCLE = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"];
const BLANK = { source: "", destination: "", vehicle: "", driver: "", cargo_weight_kg: "", planned_distance: "" };

export default function TripsPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(BLANK);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(null); // trip being completed
  const [completeForm, setCompleteForm] = useState({ end_odometer: "", fuel_consumed: "" });

  const { data: options } = useQuery({
    queryKey: ["dispatch-options"],
    queryFn: async () => (await api.get("/trips/dispatch_options/")).data,
  });
  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => (await api.get("/trips/")).data,
  });

  const selectedVehicle = options?.vehicles.find((v) => String(v.id) === String(form.vehicle));
  const cargo = Number(form.cargo_weight_kg) || 0;
  const capacityExceeded = selectedVehicle && cargo > selectedVehicle.capacity_kg;
  const canDispatch = form.source && form.destination && form.vehicle && form.driver && cargo > 0 && !capacityExceeded;

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["trips"] });
    qc.invalidateQueries({ queryKey: ["dispatch-options"] });
    qc.invalidateQueries({ queryKey: ["kpis"] });
  };

  const createAndDispatch = useMutation({
    mutationFn: async (body) => {
      const trip = (await api.post("/trips/", body)).data;
      return api.post(`/trips/${trip.id}/dispatch/`);
    },
    onSuccess: () => { refresh(); setForm(BLANK); setError(""); },
    onError: (e) => setError(apiError(e)),
  });

  const complete = useMutation({
    mutationFn: ({ id, end_odometer, fuel_consumed }) =>
      api.post(`/trips/${id}/complete/`, { end_odometer: Number(end_odometer), fuel_consumed: Number(fuel_consumed) }),
    onSuccess: () => { refresh(); setCompleting(null); setCompleteForm({ end_odometer: "", fuel_consumed: "" }); setError(""); },
    onError: (e) => setError(apiError(e)),
  });

  const cancel = useMutation({
    mutationFn: (id) => api.post(`/trips/${id}/cancel/`),
    onSuccess: refresh,
  });

  const activeTrips = trips.filter((t) => ["DRAFT", "DISPATCHED"].includes(t.status)).slice(0, 8);

  return (
    <Layout>
      <h1 className="mb-4 text-xl font-semibold">Trip Dispatcher</h1>

      {/* Lifecycle stepper */}
      <div className="mb-6 flex items-center gap-2 text-xs">
        {LIFECYCLE.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 ${i === 0 ? "bg-brand text-white" : "bg-gray-100 text-gray-500"}`}>{s}</span>
            {i < LIFECYCLE.length - 1 && <span className="text-gray-300">→</span>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Create trip */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold">Create Trip</h2>
          <div className="space-y-3">
            <Field label="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            <Field label="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            <Select label="Vehicle (available only)" value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })}>
              <option value="">Select vehicle…</option>
              {options?.vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.reg_no} — {v.capacity_kg} kg capacity</option>
              ))}
            </Select>
            <Select label="Driver (available only)" value={form.driver} onChange={(e) => setForm({ ...form, driver: e.target.value })}>
              <option value="">Select driver…</option>
              {options?.drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Field label="Cargo Weight (kg)" type="number" value={form.cargo_weight_kg} onChange={(e) => setForm({ ...form, cargo_weight_kg: e.target.value })} />
            <Field label="Planned Distance (km)" type="number" value={form.planned_distance} onChange={(e) => setForm({ ...form, planned_distance: e.target.value })} />

            {/* Live capacity validation */}
            {selectedVehicle && (
              <div className={`rounded-md border px-3 py-2 text-sm ${capacityExceeded ? "border-red-300 bg-red-50 text-red-600" : "border-green-200 bg-green-50 text-green-700"}`}>
                Vehicle Capacity: {selectedVehicle.capacity_kg} kg · Cargo Weight: {cargo} kg
                {capacityExceeded
                  ? <div className="font-medium">✕ Capacity exceeded by {cargo - selectedVehicle.capacity_kg} kg — dispatch blocked</div>
                  : <div>✓ Within capacity</div>}
              </div>
            )}

            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}

            <div className="flex gap-2">
              <Btn
                disabled={!canDispatch || createAndDispatch.isPending}
                onClick={() => createAndDispatch.mutate({
                  ...form,
                  vehicle: Number(form.vehicle),
                  driver: Number(form.driver),
                  cargo_weight_kg: cargo,
                  planned_distance: Number(form.planned_distance) || 0,
                })}
              >
                {capacityExceeded ? "Dispatch (blocked)" : "Dispatch"}
              </Btn>
              <Btn variant="ghost" onClick={() => setForm(BLANK)}>Cancel</Btn>
            </div>
          </div>
        </div>

        {/* Live board */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold">Live Board</h2>
          <div className="space-y-3">
            {activeTrips.length === 0 && <div className="text-sm text-gray-400">No active trips.</div>}
            {activeTrips.map((t) => (
              <div key={t.id} className="rounded-md border border-gray-100 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{t.source} → {t.destination}</div>
                  <StatusBadge status={t.status} />
                </div>
                <div className="mt-1 text-xs text-gray-500">{t.vehicle_reg} / {t.driver_name} · {t.cargo_weight_kg} kg</div>
                <div className="mt-2 flex gap-2">
                  {t.status === "DISPATCHED" && (
                    <button className="text-xs font-medium text-green-600 hover:underline" onClick={() => { setError(""); setCompleteForm({ end_odometer: t.start_odometer ?? "", fuel_consumed: "" }); setCompleting(t); }}>Complete</button>
                  )}
                  <button className="text-xs font-medium text-red-500 hover:underline" onClick={() => cancel.mutate(t.id)}>Cancel</button>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">On Complete: odometer → fuel log → expenses → Vehicle &amp; Driver return to Available.</p>
        </div>
      </div>

      {completing && (
        <Modal title={`Complete Trip — ${completing.source} → ${completing.destination}`} onClose={() => setCompleting(null)}>
          <div className="space-y-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {completing.vehicle_reg} / {completing.driver_name}
              {completing.start_odometer != null && ` · start odometer ${completing.start_odometer.toLocaleString()}`}
            </p>
            <Field
              label="Final Odometer"
              type="number"
              value={completeForm.end_odometer}
              onChange={(e) => setCompleteForm({ ...completeForm, end_odometer: e.target.value })}
            />
            <Field
              label="Fuel Consumed (liters)"
              type="number"
              value={completeForm.fuel_consumed}
              onChange={(e) => setCompleteForm({ ...completeForm, fuel_consumed: e.target.value })}
            />
            {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">{error}</div>}
            <div className="flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setCompleting(null)}>Cancel</Btn>
              <Btn
                disabled={completeForm.end_odometer === "" || completeForm.fuel_consumed === "" || complete.isPending}
                onClick={() => complete.mutate({ id: completing.id, ...completeForm })}
              >
                {complete.isPending ? "Completing…" : "Complete Trip"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
