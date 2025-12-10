import { VariantProps } from "class-variance-authority";
import { badgeVariants } from "./badge.styles";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}
