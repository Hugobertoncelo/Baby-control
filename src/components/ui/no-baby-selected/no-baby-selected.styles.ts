import { cva } from "class-variance-authority";

export const noBabySelectedStyles = {
  container:
    "flex flex-col items-center justify-center min-h-screen h-full w-full text-center py-12 px-6 bg-white transition-colors duration-200",
  iconContainer:
    "w-16 h-16 mx-auto mb-6 rounded-full bg-teal-100 flex items-center justify-center transition-colors duration-200",
  icon: "h-8 w-8 text-teal-600 transition-colors duration-200",
  textContainer: "flex flex-col items-center space-y-2",
  title: "text-2xl font-semibold text-gray-900 transition-colors duration-200",
  description: "text-gray-500 transition-colors duration-200 max-w-md",
};
