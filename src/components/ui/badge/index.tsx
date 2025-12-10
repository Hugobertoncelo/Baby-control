import * as React from "react";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/context/theme";
import { badgeVariants } from "./badge.styles";
import { BadgeProps } from "./badge.types";
import "./badge.css";

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    const { theme } = useTheme();
    const darkModeClass =
      variant === "outline"
        ? "badge-dark-outline"
        : variant === "secondary"
        ? "badge-dark-secondary"
        : "badge-dark-default";
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className, darkModeClass)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
