import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/context/theme";
import { buttonVariants } from "./button.styles";
import { ButtonProps } from "./button.types";
import "./button.css";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const { theme } = useTheme();
    const darkModeClass =
      variant === "outline"
        ? "button-dark-outline"
        : variant === "ghost"
        ? "button-dark-ghost"
        : variant === "link"
        ? "button-dark-link"
        : variant === "secondary"
        ? "button-dark-secondary"
        : variant === "input"
        ? "button-dark-input"
        : "";
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          darkModeClass
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
