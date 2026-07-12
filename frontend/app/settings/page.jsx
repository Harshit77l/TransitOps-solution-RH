"use client";

import Layout from "@/components/Layout";
import { Field, Select, Btn } from "@/components/ui";

const MATRIX = [
  { role: "Fleet Manager", fleet: "Edit", drivers: "View", trips: "View", fuel: "View", analytics: "View" },
  { role: "Dispatcher", fleet: "View", drivers: "View", trips: "Edit", fuel: "—", analytics: "—" },
  { role: "Safety Officer", fleet: "—", drivers: "Edit", trips: "View", fuel: "—", analytics: "—" },
  { role: "Financial Analyst", fleet: "View", drivers: "—", trips: "—", fuel: "Edit", analytics: "Edit" },
];

function Cell({ v }) {
  const cls = v === "Edit" ? "text-green-600 font-medium" : v === "View" ? "text-gray-500" : "text-gray-300";
  return <td className={`px-3 py-2 text-center ${cls}`}>{v}</td>;
}

export default function SettingsPage() {
  return (
    <Layout>
      <h1 className="mb-4 text-xl font-semibold">Settings & RBAC</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold">General</h2>
          <div className="space-y-3">
            <Field label="Depot Name" defaultValue="Gandhinagar Depot 04" />
            <Select label="Currency" defaultValue="INR"><option>INR (₹)</option><option>USD ($)</option></Select>
            <Select label="Distance Unit" defaultValue="km"><option>Kilometers</option><option>Miles</option></Select>
            <Btn>Save changes</Btn>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          <h2 className="mb-4 text-sm font-semibold">Role-Based Access (RBAC)</h2>
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase tracking-wide text-gray-400">
              <tr>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2">Fleet</th><th className="px-3 py-2">Drivers</th>
                <th className="px-3 py-2">Trips</th><th className="px-3 py-2">Fuel/Exp.</th><th className="px-3 py-2">Analytics</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.role} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2 font-medium">{r.role}</td>
                  <Cell v={r.fleet} /><Cell v={r.drivers} /><Cell v={r.trips} /><Cell v={r.fuel} /><Cell v={r.analytics} />
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-gray-400">Write access is enforced server-side by DRF permission classes. This matrix reflects those rules.</p>
        </div>
      </div>
    </Layout>
  );
}
