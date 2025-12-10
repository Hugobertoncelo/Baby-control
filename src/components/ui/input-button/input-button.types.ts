import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { inputButtonVariants } from "./input-button.styles";

export type InputButtonLayout = "left" | "right" | "below";

export interface InputButtonProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputButtonVariants> {
  layout?: InputButtonLayout;
  buttonText: string;
  onButtonClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  buttonVariant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "success"
    | "info"
    | "warning";
  buttonSize?: "default" | "sm" | "lg" | "xl" | "icon";
  inputClassName?: string;
  buttonClassName?: string;
  containerClassName?: string;
  buttonDisabled?: boolean;
  buttonLoading?: boolean;
  error?: string;
}
