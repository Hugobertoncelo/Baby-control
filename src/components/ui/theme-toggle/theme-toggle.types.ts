import { ButtonHTMLAttributes } from "react";
import { VariantProps } from "class-variance-authority";
import { themeToggleVariants } from "./theme-toggle.styles";

export interface ThemeToggleProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof themeToggleVariants> {
  className?: string;

  variant?: "default" | "light";
}
