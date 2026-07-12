"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

/**
 * Dark-mode theme provider. Persists choice in localStorage under "theme" and
 * toggles the `dark` class on <html> (Tailwind darkMode: "class").
 *
 * localStorage is fine here — this is the real Next.js app, not a Claude
 * artifact. The JWT is already stored the same way.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const initial =
      stored ||
      (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", theme);
  }, [theme, ready]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext) || { theme: "light", toggle: () => {}, ready: false };
}

// Runs before React hydrates to avoid a flash of the wrong theme.
export const themeInitScript = `
(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();
`;
