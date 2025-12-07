import * as React from "react"
import { cn } from "@/src/lib/utils"
import { inputStyles } from "./input.styles"
import { InputProps } from "./input.types"
import { useTheme } from "@/src/context/theme"
import "./input.css"

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <input
        type={type}
        className={cn(inputStyles.base, className, "input-dark")}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
