import * as React from "react";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/context/theme";
import { switchStyles } from "./switch.styles";
import { SwitchProps } from "./switch.types";
import "./switch.css";

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      checked,
      onCheckedChange,
      disabled,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();

    const handleClick = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    const getBackgroundStyle = () => {
      if (variant === "green") {
        return checked
          ? switchStyles.greenChecked
          : switchStyles.greenUnchecked;
      }
      return checked ? switchStyles.checked : switchStyles.unchecked;
    };

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        ref={ref}
        className={cn(
          switchStyles.base,
          getBackgroundStyle(),
          disabled && switchStyles.disabled,
          className,
          theme === "dark" && "switch-dark"
        )}
        {...props}
      >
        <span
          className={cn(
            switchStyles.thumb,
            checked ? switchStyles.thumbChecked : switchStyles.thumbUnchecked,
            theme === "dark" && "switch-thumb-dark"
          )}
        />
      </button>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
