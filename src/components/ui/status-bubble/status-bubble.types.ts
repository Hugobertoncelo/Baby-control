import { ReactElement } from "react";
import { Icon as LucideIcon } from "lucide-react";

export type StatusType = "sleeping" | "awake" | "feed" | "diaper";

export interface StatusBubbleProps {
  status: StatusType;
  durationInMinutes: number;
  warningTime?: string;
  className?: string;
  activityType?: "sleep" | "feed" | "diaper" | "pump";
}

export interface StatusStyle {
  bgColor: string;
  icon: ReactElement<typeof LucideIcon> | null;
}
