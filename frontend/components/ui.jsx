"use client";

export function KpiCard({ label, value, accent }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-[11px] uppercase tracking-wide text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${accent || "text-gray-800"}`}>{value}</div>
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <input
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        {...props}
      />
    </label>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
      <select
        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Btn({ children, variant = "primary", ...props }) {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    ghost: "border border-gray-200 text-gray-600 hover:bg-gray-50",
    danger: "text-red-600 hover:bg-red-50",
  };
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40 ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
