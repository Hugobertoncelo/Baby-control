import { cva } from "class-variance-authority";

export const formPageStyles = {
  container:
    "fixed inset-y-0 right-0 z-[99] flex flex-col bg-white/95 backdrop-blur-sm transform transition-transform duration-300 ease-in-out w-full sm:max-w-lg md:max-w-xl border-l border-slate-200 overflow-hidden",

  containerOpen: "translate-x-0",

  containerClosed: "translate-x-full",

  overlay: "fixed inset-0 bg-black/30 z-[98] transition-opacity duration-300",

  overlayOpen: "opacity-100",

  overlayClosed: "opacity-0 pointer-events-none",

  header: "flex items-center justify-between p-4 border-b border-gray-200",

  titleContainer: "flex flex-col",

  title: "text-lg font-semibold text-slate-800",

  description: "text-sm text-gray-500 mt-1",

  closeButton:
    "text-gray-500 hover:text-gray-700 transition-colors duration-200 p-2 rounded-full hover:bg-slate-100/80",

  content: "flex-1 overflow-y-auto p-4 pb-20",
  formContent: "flex flex-col space-y-6 mx-auto max-w-md sm:mx-0",

  footer:
    "border-t border-gray-200 p-4 flex justify-end gap-2 bg-white/95 backdrop-blur-sm absolute bottom-0 left-0 right-0 z-10",
};

export const formPageTriggerVariants = cva(
  "flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out",
  {
    variants: {
      isOpen: {
        true: "-rotate-90",
        false: "rotate-0",
      },
    },
    defaultVariants: {
      isOpen: false,
    },
  }
);

export const tabStyles = {
  tabContainer:
    "flex flex-row border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide -webkit-overflow-scrolling-touch",

  tabButton:
    "flex items-center gap-2 py-3 px-4 mx-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-0 rounded-t-lg border-b-2 border-transparent whitespace-nowrap focus:border-b-teal-500",

  tabButtonActive:
    "text-teal-700 bg-teal-50 border-b-teal-500 hover:text-teal-800 hover:bg-teal-100",

  tabIcon: "h-4 w-4 flex-shrink-0",

  tabImage: "h-4 w-4 flex-shrink-0 object-contain",

  tabContent: "flex-1",

  notificationBadge:
    "absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[1.25rem]",
};
