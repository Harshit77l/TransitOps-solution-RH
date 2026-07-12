"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiError } from "@/lib/api";

const DEMO_ROLES = [
  { label: "Fleet Manager", email: "manager@transitops.in" },
  { label: "Dispatcher", email: "dispatch@transitops.in" },
  { label: "Safety Officer", email: "safety@transitops.in" },
  { label: "Financial Analyst", email: "finance@transitops.in" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("dispatch@transitops.in");
  const [password, setPassword] = useState("password123");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(apiError(err, "Invalid credentials."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gray-950 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-14">
        {/* soft accent glows */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5 text-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
            <Truck size={18} className="text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">TransitOps</span>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight text-white">
            Run your entire fleet from one place.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-gray-400">
            Vehicles, drivers, dispatch, maintenance, and costs — with the business rules
            enforced automatically, so nothing slips through.
          </p>
        </div>

        <div className="relative text-xs text-gray-600">
          © 2026 TransitOps · Role-based access enabled
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* logo (mobile only — brand panel is hidden below lg) */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand">
              <Truck size={18} className="text-white" />
            </div>
            <span className="text-lg font-semibold tracking-tight dark:text-white">TransitOps</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Sign in to your TransitOps account.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50"
            >
              {loading ? "Signing in…" : <>Sign in <ArrowRight size={16} /></>}
            </button>
          </form>

          {/* Demo access — subtle role quick-select */}
          {/* <div className="mt-8">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              <span className="text-xs text-gray-400 dark:text-gray-500">Demo access</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {DEMO_ROLES.map((r) => {
                const active = email === r.email;
                return (
                  <button
                    key={r.email}
                    type="button"
                    onClick={() => { setEmail(r.email); setPassword("password123"); }}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "border-brand bg-brand/10 text-brand-dark dark:text-brand"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-900"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}