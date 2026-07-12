"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings, LogOut,
  Sun, Moon,
} from "lucide-react";
import { useAuth, ROLE_ACCESS } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

const NAV = [
  { key: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "vehicles", label: "Fleet", href: "/vehicles", icon: Truck },
  { key: "drivers", label: "Drivers", href: "/drivers", icon: Users },
  { key: "trips", label: "Trips", href: "/trips", icon: Route },
  { key: "maintenance", label: "Maintenance", href: "/maintenance", icon: Wrench },
  { key: "fuel", label: "Fuel & Expenses", href: "/fuel", icon: Fuel },
  { key: "analytics", label: "Analytics", href: "/analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", href: "/settings", icon: Settings },
];

const ROLE_LABELS = {
  FLEET_MANAGER: "Fleet Manager",
  DISPATCHER: "Dispatcher",
  SAFETY_OFFICER: "Safety Officer",
  FINANCIAL_ANALYST: "Financial Analyst",
};

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

export default function Layout({ children }) {
  const { user, ready, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace("/login");
  }, [ready, user, router]);

  if (!ready || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>;
  }

  const initials = (user.name || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
  const allowed = ROLE_ACCESS[user.role] || NAV.map((n) => n.key);
  const nav = NAV.filter((item) => allowed.includes(item.key));

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800 dark:bg-gray-950 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div className="text-lg font-bold">TransitOps</div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Transport Operations</div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-brand/15 font-medium text-brand-dark dark:bg-brand/20 dark:text-brand"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
          <input
            placeholder="Search…"
            className="w-72 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-brand focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-[11px] text-gray-400 dark:text-gray-500">{ROLE_LABELS[user.role]}</div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
