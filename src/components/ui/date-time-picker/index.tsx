"use client";

import React, { useState, useEffect, useRef } from "react";
import "./date-time-picker.css";
import { Calendar } from "@/src/components/ui/calendar";
import { TimeEntry } from "@/src/components/ui/time-entry";
import { cn } from "@/src/lib/utils";
import { format, isValid } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { DateTimePickerProps } from "./date-time-picker.types";
import {
  dateTimePickerContainerStyles,
  dateTimePickerButtonStyles,
  dateTimePickerPopoverContentStyles,
  dateTimePickerCalendarContainerStyles,
  dateTimePickerTimeContainerStyles,
  dateTimePickerFooterStyles,
} from "./date-time-picker.styles";

export function DateTimePicker({
  value,
  onChange,
  className,
  disabled = false,
  placeholder = "Selecione data e hora...",
}: DateTimePickerProps) {
  const [date, setDate] = useState<Date | null>(() => {
    if (value instanceof Date && isValid(value)) {
      return value;
    }
    if (value === null) {
      return null;
    }
    return new Date();
  });
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  useEffect(() => {
    if (value === null) {
      setDate(null);
    } else if (value instanceof Date && isValid(value)) {
      setDate(value);
    }
  }, [value]);
  const handleDateSelect = (newDate: Date | undefined) => {
    if (!newDate) return;
    const updatedDate = new Date(newDate);
    if (date) {
      updatedDate.setHours(date.getHours());
      updatedDate.setMinutes(date.getMinutes());
    } else {
      updatedDate.setHours(0);
      updatedDate.setMinutes(0);
    }
    updatedDate.setSeconds(0);
    updatedDate.setMilliseconds(0);
    setDate(updatedDate);
    onChange(updatedDate);
    setDateOpen(false);
  };
  const handleTimeChange = (newDate: Date) => {
    setDate(newDate);
    onChange(newDate);
  };
  const formatDate = (date: Date | null): string => {
    if (!date || !isValid(date)) return "Selecione a data";
    try {
      return format(date, "d MMM, yyyy");
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return "Selecione a data";
    }
  };
  const formatTime = (date: Date | null): string => {
    if (!date || !isValid(date)) return "Selecione o horário";
    try {
      return format(date, "H:mm");
    } catch (error) {
      console.error("Erro ao formatar horário:", error);
      return "Selecione o horário";
    }
  };
  return (
    <div
      className={cn(
        dateTimePickerContainerStyles,
        "date-time-picker-container",
        className
      )}
    >
      <Popover open={dateOpen} onOpenChange={setDateOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              dateTimePickerButtonStyles,
              "date-time-picker-button"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4 date-time-picker-calendar-icon" />
            <span>{formatDate(date)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            dateTimePickerPopoverContentStyles,
            "date-time-picker-popover"
          )}
          align="start"
          sideOffset={4}
        >
          <div className={dateTimePickerCalendarContainerStyles}>
            <Calendar
              selected={date}
              onSelect={handleDateSelect}
              isDateDisabled={disabled ? () => true : undefined}
              initialFocus
              variant="date-time-picker"
              className="mx-auto"
            />
          </div>
        </PopoverContent>
      </Popover>
      <Popover open={timeOpen} onOpenChange={setTimeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              dateTimePickerButtonStyles,
              "date-time-picker-button"
            )}
            disabled={disabled}
          >
            <Clock className="h-4 w-4 date-time-picker-clock-icon" />
            <span>{formatTime(date)}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            dateTimePickerPopoverContentStyles,
            "date-time-picker-popover"
          )}
          align="start"
          sideOffset={4}
        >
          <div className={dateTimePickerTimeContainerStyles}>
            <TimeEntry
              value={date}
              onChange={handleTimeChange}
              disabled={disabled}
              className="mx-auto w-full"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateTimePicker;
