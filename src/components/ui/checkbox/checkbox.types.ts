import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { checkboxVariants } from "./checkbox.styles";

export interface CheckboxProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      "checked" | "onChange" | "size"
    >,
    VariantProps<typeof checkboxVariants> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
