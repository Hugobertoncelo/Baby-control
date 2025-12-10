import { ReactNode } from "react";

export interface CardVisualProps {
  title: string;
  mainValue: string | number;
  comparativeValue?: string | number;
  icon?: ReactNode;
  className?: string;
  description?: string;
  trend?: "positive" | "negative" | "neutral";
}
