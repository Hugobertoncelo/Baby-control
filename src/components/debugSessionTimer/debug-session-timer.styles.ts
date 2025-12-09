import { cn } from "@/src/lib/utils";

export const debugTimerContainer = (
  isDragging: boolean,
  x: number,
  y: number
) => {
  return cn(
    "fixed z-[9999] bg-black/80 text-white rounded-lg shadow-lg",
    "w-[220px] select-none font-mono text-xs",
    "transition-shadow duration-200 hover:shadow-xl",
    isDragging ? "cursor-grabbing" : "cursor-grab"
  );
};

export const debugTimerHeader = () => {
  return cn(
    "flex justify-between items-center p-2",
    "bg-black/30 rounded-t-lg",
    "border-b border-white/10 font-bold"
  );
};

export const debugTimerCloseButton = () => {
  return cn(
    "bg-transparent border-none text-white/70 cursor-pointer",
    "p-1 flex items-center justify-center rounded",
    "transition-all duration-200 hover:text-white hover:bg-white/10"
  );
};

export const debugTimerContent = () => {
  return cn("p-3");
};

export const debugTimerRow = (isLast: boolean = false) => {
  return cn("flex justify-between", !isLast && "mb-2");
};

export const debugTimerLabel = () => {
  return cn("text-white/70");
};

export const debugTimerValue = () => {
  return cn("font-bold");
};
