const COLORS = {
  AVAILABLE: "bg-green-100 text-green-700",
  ON_TRIP: "bg-blue-100 text-blue-700",
  IN_SHOP: "bg-orange-100 text-orange-700",
  RETIRED: "bg-red-100 text-red-700",
  OFF_DUTY: "bg-gray-200 text-gray-600",
  SUSPENDED: "bg-orange-100 text-orange-700",
  DRAFT: "bg-gray-200 text-gray-600",
  DISPATCHED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  ACTIVE: "bg-orange-100 text-orange-700",
};

const LABELS = {
  AVAILABLE: "Available", ON_TRIP: "On Trip", IN_SHOP: "In Shop", RETIRED: "Retired",
  OFF_DUTY: "Off Duty", SUSPENDED: "Suspended", DRAFT: "Draft", DISPATCHED: "Dispatched",
  COMPLETED: "Completed", CANCELLED: "Cancelled", ACTIVE: "Active",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${COLORS[status] || "bg-gray-100 text-gray-600"}`}>
      {LABELS[status] || status}
    </span>
  );
}
