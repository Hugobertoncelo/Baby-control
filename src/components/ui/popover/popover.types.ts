import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";

export interface PopoverProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Root> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface PopoverTriggerProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Trigger> {
  asChild?: boolean;
}

export interface PopoverContentProps
  extends React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> {
  className?: string;

  align?: "start" | "center" | "end";

  side?: "top" | "right" | "bottom" | "left";

  sideOffset?: number;
}
