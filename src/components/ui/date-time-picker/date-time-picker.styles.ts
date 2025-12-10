import { cn } from "@/src/lib/utils";

export const dateTimePickerContainerStyles = cn("flex gap-2");

export const dateTimePickerButtonStyles = cn(
  "flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md shadow-sm",
  "hover:bg-gray-50 transition-colors duration-200"
);

export const dateTimePickerPopoverContentStyles = cn(
  "p-0 z-[100] border-gray-200 shadow-lg",
  "rounded-md overflow-hidden"
);

export const dateTimePickerCalendarContainerStyles = cn();

export const dateTimePickerTimeContainerStyles = cn();

export const dateTimePickerFooterStyles = cn(
  "flex justify-end p-3 border-t border-gray-200"
);

export const dateTimePickerInputContainerStyles = cn("relative cursor-pointer");

export const dateTimePickerCalendarIconStyles = cn(
  "absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none"
);
