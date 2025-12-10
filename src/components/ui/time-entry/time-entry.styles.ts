export const timeEntryStyles = {
  container: "relative z-0 flex flex-col overflow-hidden bg-white rounded-md",

  header:
    "bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-2 flex justify-center items-center",
  timeDisplay: "text-4xl font-light tracking-wider",
  amPmDisplay: "text-lg ml-2 flex flex-col",

  clockContainer: "relative p-4 flex justify-center items-center",
  clockFace:
    "relative w-64 h-64 rounded-full bg-gray-100 flex items-center justify-center",
  clockCenter: "absolute w-3 h-3 rounded-full bg-teal-600 z-10",
  clockHand:
    "absolute top-1/2 left-1/2 w-1 bg-teal-600 origin-bottom rounded-full z-0",

  hourMarker:
    "absolute w-8 h-8 flex items-center justify-center text-gray-700 font-medium",
  hourMarkerSelected: "bg-teal-600 text-white rounded-full",

  minuteMarker:
    "absolute w-8 h-8 flex items-center justify-center text-gray-700 font-medium",
  minuteMarkerSelected: "bg-teal-600 text-white rounded-full",

  minuteTickMarker: "absolute w-1 h-4 bg-gray-300 rounded-full",
  minuteTickMarkerSelected: "bg-teal-600",

  footer: "flex justify-between p-3 border-t border-gray-200",
  footerButton: "px-4 py-2 rounded",
  cancelButton: "text-gray-700 hover:bg-gray-100",
  okButton:
    "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700",
  clearButton: "text-gray-700 hover:bg-gray-100",

  amPmToggle: "flex flex-col items-center justify-center",
  amPmButton: "px-2 py-1 text-sm",
  amPmButtonSelected: "font-bold",
} as const;
