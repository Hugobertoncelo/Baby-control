export const switchStyles = {
  base: "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2",

  checked: "bg-teal-600",

  unchecked: "bg-gray-200",

  greenChecked: "bg-emerald-500",
  greenUnchecked: "bg-emerald-600",

  disabled: "opacity-50 cursor-not-allowed",

  thumb:
    "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform",

  thumbChecked: "translate-x-5",

  thumbUnchecked: "translate-x-0",
};
