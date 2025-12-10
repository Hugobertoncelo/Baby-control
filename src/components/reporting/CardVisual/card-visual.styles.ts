import { cva } from "class-variance-authority";
import { cn } from "@/src/lib/utils";

export const cardVisualContainer = cva(
  "rounded-lg p-4 bg-white shadow-sm border border-gray-100 flex flex-col h-full",
  {
    variants: {
      trend: {
        positive: "border-l-4 border-l-emerald-500",
        negative: "border-l-4 border-l-red-500",
        neutral: "",
      },
    },
    defaultVariants: {
      trend: "neutral",
    },
  }
);

export const cardVisualTitle = () => {
  return cn("text-sm font-medium text-gray-600 mb-2");
};

export const cardVisualMainValue = () => {
  return cn("text-2xl font-bold text-gray-900");
};

export const cardVisualComparativeValue = () => {
  return cn("text-sm font-medium text-emerald-500 mt-1");
};

export const cardVisualDescription = () => {
  return cn("text-xs text-gray-500 mt-2");
};

export const cardVisualIconContainer = () => {
  return cn("absolute top-3 right-3 text-gray-400");
};
