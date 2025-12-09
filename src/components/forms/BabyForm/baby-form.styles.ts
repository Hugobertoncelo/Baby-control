import { cn } from "@/src/lib/utils";

export const babyFormStyles = {
  content: cn("space-y-6 overflow-y-auto flex-1 pb-24"),

  footer: cn("gap-3 sm:justify-end"),

  label: cn("block text-sm font-medium text-gray-700 mb-1"),

  formGroup: cn("mb-4"),
};

export const formLabel = () => {
  return cn("block text-sm font-medium text-gray-700 mb-1");
};

export const formGroup = () => {
  return cn("mb-4");
};
