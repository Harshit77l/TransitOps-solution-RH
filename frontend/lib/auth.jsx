"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "./api";

const AuthContext = createContext(null);

// Which nav sections each role sees. Everyone can READ everything server-side,
// but the nav is scoped to each role's primary workflow to reduce clutter.
// Dashboard / Analytics / Settings are shown to all; each role additionally
// gets the sections it owns (writes) plus closely related read views.
export const ROLE_ACCESS = {
  FLEET_MANAGER: ["dashboard", "vehicles", "drivers", "trips", "maintenance", "fuel", "analytics", "settings"],
  DISPATCHER: ["dashboard", "vehicles", "drivers", "trips", "analytics", "settings"],
  SAFETY_OFFICER: ["dashboard", "drivers", "vehicles", "trips", "analytics", "settings"],
  FINANCIAL_ANALYST: ["dashboard", "fuel", "maintenance", "vehicles", "analytics", "settings"],
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    setReady(true);
  }, []);

  async function login(email, password) {
    const { data } = await api.post("/auth/login/", { email, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("access");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
