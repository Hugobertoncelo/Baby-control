import { cva } from "class-variance-authority";

export const mobileMenuVariants = cva("mobile-menu-container", {
  variants: {},
  defaultVariants: {},
});

export const desktopNavVariants = cva(
  "hidden md:flex md:items-center md:gap-4"
);
