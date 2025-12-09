import { cn } from "@/src/lib/utils";

export const quickStatsContainer = () => {
  return cn("flex flex-col");
};

export const babyInfoHeader = (
  gender: "MALE" | "FEMALE" | null | undefined
) => {
  return cn(
    "flex items-center justify-center p-4 rounded-lg",
    gender === "MALE"
      ? "bg-blue-100"
      : gender === "FEMALE"
      ? "bg-pink-100"
      : "bg-gray-100"
  );
};

export const babyNameHeading = () => {
  return cn("text-2xl font-bold text-center", "text-gray-800");
};

export const babyAgeText = () => {
  return cn("text-sm text-gray-600 text-center mt-1");
};

export const placeholderText = () => {
  return cn("text-lg text-gray-500 text-center p-8");
};

export const closeButtonContainer = () => {
  return cn("flex justify-center");
};

export const timePeriodSelectorContainer = () => {
  return cn("flex flex-col");
};

export const timePeriodSelectorLabel = () => {
  return cn("text-sm font-medium text-gray-700");
};

export const timePeriodButtonGroup = () => {
  return cn("flex space-x-1 overflow-x-auto");
};

export const statsCardsGrid = () => {
  return cn(
    "grid grid-cols-2 gap-4 mt-6",
    "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  );
};
