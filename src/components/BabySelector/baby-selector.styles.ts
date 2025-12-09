import { cn } from "@/src/lib/utils";

export const babySelectorContainer = (
  gender: "MALE" | "FEMALE" | null | undefined
) => {
  return cn(
    "h-auto py-1 px-2 text-white transition-colors duration-200 flex items-center space-x-2 rounded-full",
    gender === "MALE" ? "bg-blue-500" : gender === "FEMALE" ? "bg-rose-300" : ""
  );
};

export const babySelectorContent = () => {
  return cn("flex flex-col items-start cursor-pointer");
};

export const babySelectorNameContainer = () => {
  return cn("flex items-center ml-2 space-x-1");
};

export const babySelectorName = () => {
  return cn("text-sm font-medium");
};

export const babySelectorAge = () => {
  return cn("text-xs opacity-80 ml-2");
};

export const babySelectorDropdownButton = () => {
  return cn(
    "h-8 w-8 rounded-full flex items-center justify-center",
    "bg-white/10 hover:bg-white/20 transition-colors duration-200",
    "ml-1 p-1"
  );
};

export const babySelectorDropdownItem = (
  gender: "MALE" | "FEMALE" | null | undefined
) => {
  return cn(
    gender === "MALE"
      ? "bg-blue-500/10 hover:bg-blue-500/20"
      : gender === "FEMALE"
      ? "bg-pink-500/10 hover:bg-pink-500/20"
      : ""
  );
};
