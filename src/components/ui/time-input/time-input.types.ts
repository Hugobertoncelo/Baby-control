import * as React from "react";

export interface TimeInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  errorMessage?: string;

  showValidation?: boolean;
}
