import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { toastVariants } from "./toast.styles";

export type ToastVariant = "info" | "success" | "warning" | "error";

export interface ToastProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof toastVariants> {
  message: string;

  title?: string;

  duration?: number | null;

  dismissible?: boolean;

  onDismiss?: () => void;

  icon?: React.ReactNode;

  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ToastContextType {
  showToast: (
    props: Omit<ToastProps, "variant"> & { variant?: ToastVariant }
  ) => void;

  dismissToast: (id: string) => void;

  dismissAll: () => void;
}

export interface ToastItem extends ToastProps {
  id: string;
  variant: ToastVariant;
  createdAt: number;
}
