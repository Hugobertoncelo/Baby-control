import React, { useState, useEffect } from "react";

interface TimerInputProps {
  hours: number;
  minutes: number;
  seconds: number;
  onHoursChange: (value: number) => void;
  onMinutesChange: (value: number) => void;
  onSecondsChange: (value: number) => void;
  onSave: () => void;
  disabled?: boolean;
  className?: string;
  fieldPrefix: string;
}

export default function TimerInput({
  hours,
  minutes,
  seconds,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  onSave,
  disabled = false,
  className = "",
  fieldPrefix,
}: TimerInputProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [placeholderFields, setPlaceholderFields] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fields = new Set<string>();
    if (hours === 0) fields.add(`${fieldPrefix}Hours`);
    if (minutes === 0) fields.add(`${fieldPrefix}Minutes`);
    if (seconds === 0) fields.add(`${fieldPrefix}Seconds`);
    setPlaceholderFields(fields);
  }, [hours, minutes, seconds, fieldPrefix]);

  const getDisplayValue = (value: number, fieldId: string) => {
    if (editingField === fieldId && value === 0) {
      return "";
    }
    if (value === 0) return "00";
    if (editingField === fieldId) {
      return value.toString();
    }
    return value.toString().padStart(2, "0");
  };

  const getInputClassName = (baseClassName: string) => {
    return baseClassName;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: number) => void,
    max: number,
    fieldId: string
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (numValue <= max) {
      setter(numValue);
      if (numValue > 0) {
        setPlaceholderFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldId);
          return newSet;
        });
      }
    }
  };

  const handleFocus = (
    e: React.FocusEvent<HTMLInputElement>,
    fieldId: string
  ) => {
    setEditingField(fieldId);
    setTimeout(() => e.target.select(), 0);
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement>,
    setter: (value: number) => void,
    fieldId: string
  ) => {
    setEditingField(null);
    const value = e.target.value;

    if (value === "" || value === "0") {
      setter(0);
      setPlaceholderFields((prev) => new Set(prev).add(fieldId));
    } else {
      const numValue = parseInt(value, 10);
      setter(numValue);
      setPlaceholderFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldId);
        return newSet;
      });
    }

    onSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSave();
    }
  };

  return (
    <div
      className={`flex items-center text-2xl font-medium tracking-wider ${className}`}
    >
      <input
        type="text"
        inputMode="numeric"
        value={getDisplayValue(hours, `${fieldPrefix}Horas`)}
        onChange={(e) =>
          handleInputChange(e, onHoursChange, 23, `${fieldPrefix}Horas`)
        }
        onFocus={(e) => handleFocus(e, `${fieldPrefix}Horas`)}
        onBlur={(e) => handleBlur(e, onHoursChange, `${fieldPrefix}Horas`)}
        onKeyDown={handleKeyDown}
        className={getInputClassName(
          "w-12 text-center bg-transparent border-none outline-none text-2xl font-medium cursor-pointer hover:bg-gray-50 rounded px-1"
        )}
        disabled={disabled}
        placeholder=""
      />
      <span className="timer-separator">:</span>
      <input
        type="text"
        inputMode="numeric"
        value={getDisplayValue(minutes, `${fieldPrefix}Minutos`)}
        onChange={(e) =>
          handleInputChange(e, onMinutesChange, 59, `${fieldPrefix}Minutos`)
        }
        onFocus={(e) => handleFocus(e, `${fieldPrefix}Minutos`)}
        onBlur={(e) => handleBlur(e, onMinutesChange, `${fieldPrefix}Minutos`)}
        onKeyDown={handleKeyDown}
        className={getInputClassName(
          "w-12 text-center bg-transparent border-none outline-none text-2xl font-medium cursor-pointer hover:bg-gray-50 rounded px-1"
        )}
        disabled={disabled}
        placeholder=""
      />
      <span className="timer-separator">:</span>
      <input
        type="text"
        inputMode="numeric"
        value={getDisplayValue(seconds, `${fieldPrefix}Segundos`)}
        onChange={(e) =>
          handleInputChange(e, onSecondsChange, 59, `${fieldPrefix}Segundos`)
        }
        onFocus={(e) => handleFocus(e, `${fieldPrefix}Segundos`)}
        onBlur={(e) => handleBlur(e, onSecondsChange, `${fieldPrefix}Segundos`)}
        onKeyDown={handleKeyDown}
        className={getInputClassName(
          "w-12 text-center bg-transparent border-none outline-none text-2xl font-medium cursor-pointer hover:bg-gray-50 rounded px-1"
        )}
        disabled={disabled}
        placeholder=""
      />
    </div>
  );
}
