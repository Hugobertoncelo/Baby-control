"use client";

import React, { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/src/context/theme";
import { cn } from "@/src/lib/utils";
import { themeToggleStyles } from "./theme-toggle.styles";
import { ThemeToggleProps } from "./theme-toggle.types";
import "./theme-toggle.css";

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const { theme, toggleTheme, useSystemTheme, toggleUseSystemTheme } =
    useTheme();

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const cycleTheme = () => {
    if (useSystemTheme) {
      toggleUseSystemTheme();

      if (theme === "dark") {
        toggleTheme();
      }

      localStorage.setItem("theme", "light");
    } else if (theme === "light") {
      toggleTheme();
    } else {
      toggleUseSystemTheme();
    }
  };

  const getNextTheme = () => {
    if (!isHydrated) return "dark";
    if (useSystemTheme) return "light";
    if (theme === "light") return "dark";
    return "sistema";
  };

  const getCurrentThemeIcon = () => {
    const iconSize = variant === "light" ? 14 : 16;
    if (!isHydrated) return <Sun size={iconSize} />;
    if (useSystemTheme) return <Monitor size={iconSize} />;
    return theme === "light" ? (
      <Sun size={iconSize} />
    ) : (
      <Moon size={iconSize} />
    );
  };

  const getCurrentThemeLabel = () => {
    if (!isHydrated) return "Light";
    if (useSystemTheme) return "Sistema";
    return theme === "light" ? "Light" : "Dark";
  };

  if (variant === "light") {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          themeToggleStyles.buttonLight,
          "theme-toggle-button-light",
          className
        )}
        aria-label={`Mudar para ${getNextTheme()} mode`}
        title={`Mudar para ${getNextTheme()} mode`}
        {...props}
      >
        <span className="theme-icon-container-light">
          <span className="theme-icon-light">{getCurrentThemeIcon()}</span>
        </span>
        <span className="theme-info-light">
          <span className="current-theme-light">{getCurrentThemeLabel()}</span>
        </span>
      </button>
    );
  }

  return (
    <div className="theme-toggle-container">
      <div className="theme-toggle-row">
        <button
          onClick={cycleTheme}
          className={cn(
            themeToggleStyles.button,
            "theme-toggle-button",
            className
          )}
          aria-label={`Mudar para ${getNextTheme()} mode`}
          title={`Mudar para ${getNextTheme()} mode`}
          {...props}
        >
          <span className="theme-icon-container">
            <span
              className={cn(
                "theme-icon",
                isHydrated && useSystemTheme && "active-system",
                isHydrated &&
                  !useSystemTheme &&
                  theme === "light" &&
                  "active-light",
                isHydrated &&
                  !useSystemTheme &&
                  theme === "dark" &&
                  "active-dark",
                !isHydrated && "active-light"
              )}
            >
              {getCurrentThemeIcon()}
            </span>
          </span>
          <span className="theme-info">
            <span className="current-theme">{getCurrentThemeLabel()}</span>
            <span className="next-theme">Mudar para {getNextTheme()}</span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;
