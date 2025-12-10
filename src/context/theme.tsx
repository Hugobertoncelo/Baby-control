"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  useSystemTheme: boolean;
  toggleTheme: () => void;
  toggleUseSystemTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [useSystemTheme, setUseSystemTheme] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const savedUseSystemTheme = localStorage.getItem("useSystemTheme");
    return savedUseSystemTheme === null
      ? false
      : savedUseSystemTheme === "true";
  });

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    if (useSystemTheme) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    const savedTheme = localStorage.getItem("theme") as Theme;
    return savedTheme || "light";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        if (useSystemTheme) {
          const systemTheme: Theme = e.matches ? "dark" : "light";
          setTheme(systemTheme);
        }
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, useSystemTheme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (useSystemTheme) {
        const systemTheme: Theme = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches
          ? "dark"
          : "light";
        setTheme(systemTheme);
      } else {
        const savedTheme = localStorage.getItem("theme") as Theme;
        if (savedTheme) {
          setTheme(savedTheme);
        }
      }
    }
  }, [useSystemTheme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    if (!useSystemTheme) {
      localStorage.setItem("theme", newTheme);
    }
    setTheme(newTheme);
  };

  const toggleUseSystemTheme = () => {
    const newUseSystemTheme = !useSystemTheme;
    localStorage.setItem("useSystemTheme", String(newUseSystemTheme));
    setUseSystemTheme(newUseSystemTheme);
    if (newUseSystemTheme && typeof window !== "undefined") {
      const systemTheme: Theme = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches
        ? "dark"
        : "light";
      setTheme(systemTheme);
    }
  };

  return (
    <ThemeContext.Provider
      value={{ theme, useSystemTheme, toggleTheme, toggleUseSystemTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme deve ser usado dentro de um ThemeProvider");
  }
  return context;
}
