"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolved: "light" | "dark";
  setTheme: (theme: Theme) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  resolved: "light",
  setTheme: () => {},
  mounted: false,
});

const STORAGE_KEY = "fiyatcim_theme";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Read the initial theme from localStorage and resolve it synchronously
 * so the first client render matches what the inline <head> script already applied.
 * This prevents the dark-mode hydration flash.
 */
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && ["light", "dark", "system"].includes(stored)) return stored;
  } catch {
    // localStorage unavailable
  }
  return "system";
}

function getInitialResolved(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  // Read from the DOM class that the inline <head> script already set
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [resolved, setResolved] = useState<"light" | "dark">(getInitialResolved);
  const [mounted, setMounted] = useState(false);

  // Mark as mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Apply theme to <html> and resolve
  useEffect(() => {
    const root = document.documentElement;
    const effectiveTheme = theme === "system" ? getSystemTheme() : theme;

    if (effectiveTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setResolved(effectiveTheme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const sys = mq.matches ? "dark" : "light";
      setResolved(sys);
      document.documentElement.classList.toggle("dark", sys === "dark");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // localStorage unavailable
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
