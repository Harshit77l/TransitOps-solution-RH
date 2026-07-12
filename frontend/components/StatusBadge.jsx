const COLORS = {
  AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  ON_TRIP: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IN_SHOP: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  RETIRED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  OFF_DUTY: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  SUSPENDED: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  DRAFT: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  DISPATCHED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  ACTIVE: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
};

const LABELS = {
  AVAILABLE: "Available", ON_TRIP: "On Trip", IN_SHOP: "In Shop", RETIRED: "Retired",
  OFF_DUTY: "Off Duty", SUSPENDED: "Suspended", DRAFT: "Draft", DISPATCHED: "Dispatched",
  COMPLETED: "Completed", CANCELLED: "Cancelled", ACTIVE: "Active",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${COLORS[status] || "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"}`}>
      {LABELS[status] || status}
    </span>
  );
}
