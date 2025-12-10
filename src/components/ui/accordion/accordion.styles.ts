export const accordionStyles = {
  root: "w-full",
  item: "border-b border-gray-200",
  trigger:
    "flex w-full items-center justify-between py-4 text-left font-medium text-gray-900 transition-all hover:text-teal-600 [&[data-state=open]>svg]:rotate-180",
  icon: "h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200",
  iconExpanded: "rotate-180",
  content:
    "overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
  contentClosed: "h-0",
  contentInner: "pb-4 pt-0",
};
