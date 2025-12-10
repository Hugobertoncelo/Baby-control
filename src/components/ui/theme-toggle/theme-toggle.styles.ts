import { cva } from "class-variance-authority";

export const themeToggleStyles = {
  button:
    "flex items-center px-3 py-2 text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors duration-200 rounded-lg w-full",

  buttonLight:
    "flex items-center text-white hover:text-teal-700 transition-colors duration-200",
};

export const themeToggleVariants = cva(
  "flex items-center justify-center cursor-pointer transition-all duration-300 ease-in-out",
  {
    variants: {
      theme: {
        light: "",
        dark: "",
        system: "",
      },
      variant: {
        default: "",
        light: "",
      },
    },
    defaultVariants: {
      theme: "light",
      variant: "default",
    },
  }
);
