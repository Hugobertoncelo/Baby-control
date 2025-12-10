import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { buttonVariants } from "./button.styles";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
