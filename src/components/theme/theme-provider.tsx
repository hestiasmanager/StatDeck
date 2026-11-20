"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AppTheme = "system" | "light" | "dark" | "cyber" | "sepia";
export type ResolvedTheme = "light" | "dark" | "cyber" | "sepia";

interface ThemeContextType {
  theme: AppTheme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "statdeck-app-theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Read stored preference
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
      if (stored && ["system", "light", "dark", "cyber", "sepia"].includes(stored)) {
        setThemeState(stored);
      }
    } catch {
      // LocalStorage unavailable
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let resolved: ResolvedTheme = "light";

      if (theme === "system") {
        resolved = mediaQuery.matches ? "dark" : "light";
      } else {
        resolved = theme;
      }

      setResolvedTheme(resolved);

      const root = document.documentElement;
      const isDark = resolved === "dark" || resolved === "cyber";

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      root.setAttribute("data-theme", resolved);
    };

    applyTheme();

    // Listen for OS system theme changes
    const handler = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme, mounted]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // LocalStorage unavailable
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
}
