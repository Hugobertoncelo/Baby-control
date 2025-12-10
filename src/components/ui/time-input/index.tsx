import * as React from "react";
import { cn } from "@/src/lib/utils";
import { timeInputStyles } from "./time-input.styles";
import { TimeInputProps } from "./time-input.types";
import { useTheme } from "@/src/context/theme";
import { AlertCircle, Check } from "lucide-react";
import "./time-input.css";

const TimeInput = React.forwardRef<HTMLInputElement, TimeInputProps>(
  (
    {
      className,
      value,
      onChange,
      onBlur,
      errorMessage,
      showValidation = true,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [isValid, setIsValid] = React.useState(true);
    const [internalValue, setInternalValue] = React.useState<string>(
      (value as string) || ""
    );

    const timeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;

    const validateTimeFormat = (timeString: string): boolean => {
      if (!timeString) return true;
      return timeRegex.test(timeString);
    };

    const formatTimeInput = (input: string): string => {
      const digitsOnly = input.replace(/\D/g, "");
      if (digitsOnly.length <= 2) {
        return digitsOnly;
      } else if (digitsOnly.length <= 4) {
        return `${digitsOnly.substring(0, 2)}:${digitsOnly.substring(2)}`;
      } else {
        return `${digitsOnly.substring(0, 2)}:${digitsOnly.substring(2, 4)}`;
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const formattedValue = formatTimeInput(rawValue);
      setInternalValue(formattedValue);
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: formattedValue,
        },
      };
      if (onChange) {
        onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const isTimeValid = validateTimeFormat(internalValue);
      setIsValid(isTimeValid);
      if (onBlur) {
        onBlur(e);
      }
    };

    const getValidationClasses = () => {
      if (!showValidation) return "";
      if (internalValue && !isValid) {
        return timeInputStyles.error + " time-input-error";
      }
      if (internalValue && isValid) {
        return timeInputStyles.valid + " time-input-valid";
      }
      return "";
    };

    return (
      <div className={timeInputStyles.container}>
        <div className="relative">
          <input
            type="text"
            className={cn(
              timeInputStyles.base,
              getValidationClasses(),
              className,
              "time-input-dark"
            )}
            value={internalValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="HH:MM (ex.: 06:00)"
            maxLength={5}
            ref={ref}
            {...props}
          />
          {showValidation && internalValue && (
            <>
              {isValid ? (
                <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
              )}
            </>
          )}
        </div>
        {showValidation && !isValid && errorMessage && (
          <div className={timeInputStyles.errorMessage}>
            <AlertCircle className="h-3 w-3 inline mr-1" />
            {errorMessage}
          </div>
        )}
      </div>
    );
  }
);

TimeInput.displayName = "TimeInput";

export { TimeInput };
