export const styles = {
  container: "flex flex-col",

  loadingContainer: "flex flex-col items-center justify-center py-12",
  errorContainer: "flex flex-col items-center justify-center py-8",

  footerContainer: "flex justify-center",

  sectionContainer: "mb-6 last:mb-0",
  sectionTitle: "text-lg font-semibold text-gray-800 mb-3",
  sectionBorder: "border border-gray-200 rounded-lg p-4 mb-4",

  formGroup: "space-y-4",
  formRow: "grid grid-cols-1 sm:grid-cols-2 gap-4",
  formField: "space-y-2",

  cardContainer: "space-y-4",
  card: "border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors",
  cardHeader: "flex items-center justify-between mb-2",
  cardTitle: "font-medium text-gray-900",
  cardSubtitle: "text-sm text-gray-600",
  cardContent: "space-y-2",
  cardActions: "flex gap-2 mt-3",

  badge: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
  badgeActive: "bg-green-100 text-green-800",
  badgeInactive: "bg-red-100 text-red-800",
  badgeRole: "bg-blue-100 text-blue-800",

  buttonGroup: "flex gap-2",

  emptyState: "text-center py-8 text-gray-500",

  downloadSection: "border-t border-gray-200 pt-6 mt-6",
  downloadButton: "w-full sm:w-auto",

  closureSection: "border-t border-red-200 pt-6 mt-6 bg-red-50 rounded-lg p-4",
  closureWarning: "text-red-600 text-sm mb-4",
  closureButton: "bg-red-600 hover:bg-red-700 text-white",
};
