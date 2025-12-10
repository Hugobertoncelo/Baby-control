import { cva } from "class-variance-authority";

export const styles = {
  search: {
    bar: "border-t border-gray-200 bg-gray-100 p-3",
    container: "bg-white px-2 py-1",
    input: "border-0 bg-transparent focus:ring-0 focus:border-0 h-8 px-0 py-1",
  },
  container: "flex flex-col h-[calc(100vh-80px)] border-t-[1px] border-white",
  content: "flex-1 overflow-y-auto bg-white",
  activityList: "divide-y divide-gray-100 h-full",
  activityItem:
    "group hover:bg-gray-50/50 transition-colors duration-200 cursor-pointer",
  activityContent: "flex items-center px-6 py-3",
  activityIcon: "flex-shrink-0 p-2 rounded-xl mr-4",
  activityDetails: "min-w-0 flex-1",
  activityType:
    "inline-flex items-center rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10",
  activityInfo: "text-gray-900",
  emptyState: "h-full flex items-center justify-center",
  emptyStateContent: "text-center",
  emptyStateIcon:
    "w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center",
  emptyStateIconInner: "h-8 w-8 text-indigo-600",
  emptyStateTitle: "text-lg font-medium text-gray-900 mb-1",
  emptyStateDescription: "text-sm text-gray-500",
  paginationContainer:
    "flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50",
  paginationSelect: "h-8 px-2 rounded-md border border-gray-200 text-sm",
  paginationControls: "flex items-center gap-2",
  paginationText: "px-4 py-2 text-sm",
};

export default styles;
