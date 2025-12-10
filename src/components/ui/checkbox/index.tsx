"use client";

import * as React from "react";
import { cn } from "@/src/lib/utils";
import { Check } from "lucide-react";
import { useTheme } from "@/src/context/theme";
import { checkboxVariants } from "./checkbox.styles";
import { CheckboxProps } from "./checkbox.types";
import "./checkbox.css";

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, variant, size, checked, onCheckedChange, ...props }, ref) => {
    const { theme } = useTheme();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (onCheckedChange) {
        onCheckedChange(event.target.checked);
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        <div
          className={cn(
            checkboxVariants({ variant, size }),
            checked ? "" : "bg-white",
            className,
            "checkbox",
            `checkbox-${variant || "default"}`
          )}
          data-state={checked ? "checked" : "unchecked"}
          onClick={() => onCheckedChange?.(!checked)}
        >
          {checked && (
            <Check className="h-3.5 w-3.5 text-white checkbox-check" />
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox, checkboxVariants };
export type { CheckboxProps };
export default Checkbox;
