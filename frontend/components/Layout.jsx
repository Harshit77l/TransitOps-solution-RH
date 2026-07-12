"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings, LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

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

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="text-lg font-bold">TransitOps</div>
          <div className="text-[10px] uppercase tracking-wide text-gray-400">Transport Operations</div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm ${
                  active ? "bg-brand/15 font-medium text-brand-dark" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Icon size={16} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="m-3 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
        >
          <LogOut size={16} /> Sign out
        </button>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
          <input
            placeholder="Search…"
            className="w-72 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:border-brand focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-[11px] text-gray-400">{ROLE_LABELS[user.role]}</div>
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
