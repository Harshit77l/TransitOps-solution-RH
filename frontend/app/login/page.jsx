"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { apiError } from "@/lib/api";

const DEMO = [
  { role: "Fleet Manager", email: "manager@transitops.in" },
  { role: "Dispatcher", email: "dispatch@transitops.in" },
  { role: "Safety Officer", email: "safety@transitops.in" },
  { role: "Financial Analyst", email: "finance@transitops.in" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("dispatch@transitops.in");
  const [password, setPassword] = useState("password123");
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
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden w-2/5 flex-col justify-between bg-gray-900 p-10 text-white lg:flex">
        <div>
          <div className="mb-1 h-9 w-9 rounded bg-brand" />
          <div className="text-2xl font-bold">TransitOps</div>
          <div className="text-sm text-gray-400">Smart Transport Operations Platform</div>
        </div>
        <div className="text-sm text-gray-300">
          <div className="mb-2 font-medium">One login, four roles:</div>
          <ul className="space-y-1 text-gray-400">
            <li>• Fleet Manager</li>
            <li>• Dispatcher</li>
            <li>• Safety Officer</li>
            <li>• Financial Analyst</li>
          </ul>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-gray-600">TransitOps · 2026 · RBAC Enabled</div>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
        <form onSubmit={submit} className="w-full max-w-sm">
          <h1 className="text-xl font-semibold">Sign in to your account</h1>
          <p className="mb-6 text-sm text-gray-500">Enter your credentials to continue</p>

          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-gray-400">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              required
            />
          </label>

          <label className="mb-3 block text-sm">
            <span className="mb-1 block text-[11px] uppercase tracking-wide text-gray-400">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-brand focus:outline-none"
              required
            />
          </label>

          {error && (
            <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mb-4 w-full rounded-md bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <div className="rounded-md border border-gray-200 bg-white p-3 text-xs text-gray-500">
            <div className="mb-1 font-medium text-gray-600">Demo accounts (password: password123)</div>
            {DEMO.map((d) => (
              <button
                type="button"
                key={d.email}
                onClick={() => setEmail(d.email)}
                className="block text-left hover:text-brand-dark"
              >
                {d.role} — {d.email}
              </button>
            ))}
          </div>
        </form>
      </div>
    </div>
  );
}
