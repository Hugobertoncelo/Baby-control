import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { shareButtonVariants } from "./share-button.styles";

export interface ShareButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof shareButtonVariants> {
  familySlug: string;
  familyName?: string;
  appConfig?: {
    rootDomain: string;
    enableHttps: boolean;
  };
  urlSuffix?: string;
  showText?: boolean;
  asChild?: boolean;
}
