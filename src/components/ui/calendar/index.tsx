"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/src/lib/utils";
import "./calendar.css";

import {
  calendarVariants,
  calendarHeaderVariants,
  calendarNavButtonVariants,
  calendarMonthSelectVariants,
  calendarDayVariants,
  calendarDayNamesVariants,
  calendarDayNameVariants,
} from "./calendar.styles";
import { CalendarProps, CalendarPage } from "./calendar.types";
import { MonthSelectorPage } from "./MonthSelectorPage";
import { YearSelectorPage } from "./YearSelectorPage";

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
  (
    {
      className,
      variant = "default",
      selected,
      onSelect,
      rangeFrom,
      rangeTo,
      onRangeChange,
      mode = "single",
      month: monthProp,
      minDate,
      maxDate,
      disabledDates = [],
      isDateDisabled,
      initialFocus,
      ...props
    },
    ref
  ) => {
    const [month, setMonth] = React.useState(() => {
      return monthProp || selected || rangeFrom || new Date();
    });
    const [rangeSelectionState, setRangeSelectionState] = React.useState<
      "start" | "end"
    >(rangeFrom && !rangeTo ? "end" : "start");
    const [currentPage, setCurrentPage] = React.useState<CalendarPage>("dates");
    const [yearDecadeStart, setYearDecadeStart] = React.useState(() => {
      return Math.floor(month.getFullYear() / 12) * 12;
    });
    React.useEffect(() => {
      if (monthProp) {
        setMonth(monthProp);
      }
    }, [monthProp]);
    const firstDayOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDayOfMonth = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0
    );
    const firstDayOfWeek = firstDayOfMonth.getDay();
    const daysFromPrevMonth = firstDayOfWeek;
    const daysInMonth = lastDayOfMonth.getDate();
    const daysFromNextMonth = 42 - daysFromPrevMonth - daysInMonth;
    const handlePrevMonth = () => {
      setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
      setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1));
    };
    const isDisabled = (date: Date) => {
      const isInDisabledDates = disabledDates.some(
        (disabledDate) =>
          disabledDate.getFullYear() === date.getFullYear() &&
          disabledDate.getMonth() === date.getMonth() &&
          disabledDate.getDate() === date.getDate()
      );
      const isBeforeMinDate = minDate ? date < minDate : false;
      const isAfterMaxDate = maxDate ? date > maxDate : false;
      const isDisabledByFunction = isDateDisabled
        ? isDateDisabled(date)
        : false;
      return (
        isInDisabledDates ||
        isBeforeMinDate ||
        isAfterMaxDate ||
        isDisabledByFunction
      );
    };
    const isToday = (date: Date) => {
      const today = new Date();
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    };
    const isSameDay = (
      date1: Date | null | undefined,
      date2: Date | null | undefined
    ): boolean => {
      if (!date1 || !date2) return false;
      return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
      );
    };
    const isSelected = (date: Date) => {
      if (mode === "single") {
        return isSameDay(date, selected);
      } else if (mode === "range") {
        return isSameDay(date, rangeFrom) && !rangeTo;
      }
      return false;
    };
    const isRangeStart = (date: Date) => {
      return (
        mode === "range" && rangeFrom && rangeTo && isSameDay(date, rangeFrom)
      );
    };
    const isRangeEnd = (date: Date) => {
      return (
        mode === "range" && rangeFrom && rangeTo && isSameDay(date, rangeTo)
      );
    };
    const isInRange = (date: Date) => {
      if (mode !== "range" || !rangeFrom || !rangeTo) return false;
      const normalizedDate = new Date(date);
      normalizedDate.setHours(0, 0, 0, 0);
      const normalizedFrom = new Date(rangeFrom);
      normalizedFrom.setHours(0, 0, 0, 0);
      const normalizedTo = new Date(rangeTo);
      normalizedTo.setHours(0, 0, 0, 0);
      return normalizedDate > normalizedFrom && normalizedDate < normalizedTo;
    };
    const formatDate = (date: Date | null | undefined) => {
      if (!date) return "";
      return date.toLocaleDateString("pt-BR", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };
    const handleMonthSelect = (monthIndex: number) => {
      const newMonth = new Date(month.getFullYear(), monthIndex, 1);
      setMonth(newMonth);
      setCurrentPage("dates");
    };
    const handleYearSelect = (year: number) => {
      const newMonth = new Date(year, month.getMonth(), 1);
      setMonth(newMonth);
      setCurrentPage("dates");
    };
    const handlePrevYearDecade = () => {
      const newStart = Math.max(1975, yearDecadeStart - 12);
      setYearDecadeStart(newStart);
    };
    const handleNextYearDecade = () => {
      const currentYear = new Date().getFullYear();
      const newStart = Math.min(currentYear - 11, yearDecadeStart + 12);
      setYearDecadeStart(newStart);
    };
    const handleDateSelect = (date: Date) => {
      if (isDisabled(date)) return;
      if (mode === "single") {
        if (onSelect) onSelect(date);
      } else if (mode === "range" && onRangeChange) {
        const clickedDay = new Date(date);
        clickedDay.setHours(0, 0, 0, 0);
        if (rangeSelectionState === "start") {
          onRangeChange(clickedDay, null);
          setRangeSelectionState("end");
        } else {
          if (rangeFrom) {
            const normalizedFrom = new Date(rangeFrom);
            normalizedFrom.setHours(0, 0, 0, 0);
            if (clickedDay > normalizedFrom) {
              onRangeChange(rangeFrom, clickedDay);
              setRangeSelectionState("start");
            } else if (isSameDay(clickedDay, normalizedFrom)) {
              onRangeChange(null, null);
              setRangeSelectionState("start");
            }
          } else {
            onRangeChange(clickedDay, null);
            setRangeSelectionState("end");
          }
        }
      }
    };
    const days = React.useMemo(() => {
      const result = [];
      const prevMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
      const daysInPrevMonth = new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth() + 1,
        0
      ).getDate();
      for (
        let i = daysInPrevMonth - daysFromPrevMonth + 1;
        i <= daysInPrevMonth;
        i++
      ) {
        const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), i);
        result.push({
          date,
          dayOfMonth: i,
          isOutsideMonth: true,
          isDisabled: isDisabled(date),
          isToday: isToday(date),
          isSelected: isSelected(date),
          isRangeStart: isRangeStart(date),
          isRangeEnd: isRangeEnd(date),
          isInRange: isInRange(date),
        });
      }
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(month.getFullYear(), month.getMonth(), i);
        result.push({
          date,
          dayOfMonth: i,
          isOutsideMonth: false,
          isDisabled: isDisabled(date),
          isToday: isToday(date),
          isSelected: isSelected(date),
          isRangeStart: isRangeStart(date),
          isRangeEnd: isRangeEnd(date),
          isInRange: isInRange(date),
        });
      }
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      for (let i = 1; i <= daysFromNextMonth; i++) {
        const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
        result.push({
          date,
          dayOfMonth: i,
          isOutsideMonth: true,
          isDisabled: isDisabled(date),
          isToday: isToday(date),
          isSelected: isSelected(date),
          isRangeStart: isRangeStart(date),
          isRangeEnd: isRangeEnd(date),
          isInRange: isInRange(date),
        });
      }
      return result;
    }, [
      month,
      selected,
      rangeFrom,
      rangeTo,
      disabledDates,
      minDate,
      maxDate,
      isDateDisabled,
      mode,
      rangeSelectionState,
    ]);
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const renderContentArea = () => {
      switch (currentPage) {
        case "months":
          return (
            <MonthSelectorPage
              currentMonth={month.getMonth()}
              currentYear={month.getFullYear()}
              variant={variant || "default"}
              onMonthSelect={handleMonthSelect}
            />
          );
        case "years":
          return (
            <YearSelectorPage
              currentYear={month.getFullYear()}
              variant={variant || "default"}
              onYearSelect={handleYearSelect}
              minYear={1975}
              maxYear={new Date().getFullYear()}
              decadeStart={yearDecadeStart}
            />
          );
        default:
        case "dates":
          return (
            <>
              <div
                className={cn(
                  calendarDayNamesVariants({ variant }),
                  "calendar-day-names"
                )}
              >
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className={cn(
                      calendarDayNameVariants({ variant }),
                      "calendar-day-name"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0 calendar-grid">
                {days.map((day, index) => (
                  <button
                    key={`${day.date.toISOString()}-${index}`}
                    type="button"
                    onClick={() => handleDateSelect(day.date)}
                    disabled={day.isDisabled}
                    className={cn(
                      calendarDayVariants({
                        variant,
                        selected: day.isSelected,
                        rangeStart: day.isRangeStart,
                        rangeEnd: day.isRangeEnd,
                        rangeMiddle: day.isInRange,
                        today: day.isToday,
                        disabled: day.isDisabled,
                        outside: day.isOutsideMonth,
                      }),
                      "calendar-day",
                      day.isSelected && "calendar-day-selected",
                      day.isRangeStart && "calendar-day-range-start",
                      day.isRangeEnd && "calendar-day-range-end",
                      day.isInRange && "calendar-day-range-middle",
                      day.isToday && "calendar-day-today",
                      day.isDisabled && "calendar-day-disabled",
                      day.isOutsideMonth && "calendar-day-outside"
                    )}
                    aria-label={day.date.toLocaleDateString()}
                    aria-selected={
                      day.isSelected || day.isRangeStart || day.isRangeEnd
                        ? "true"
                        : undefined
                    }
                    tabIndex={
                      day.isSelected ||
                      day.isRangeStart ||
                      day.isRangeEnd ||
                      (initialFocus && index === 0)
                        ? 0
                        : -1
                    }
                  >
                    {day.dayOfMonth}
                  </button>
                ))}
              </div>
            </>
          );
      }
    };
    return (
      <div
        ref={ref}
        className={cn(calendarVariants({ variant }), className, "calendar")}
        {...props}
      >
        {mode === "range" && (
          <div className="px-3 pt-2 pb-4 text-sm text-gray-700 flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">De</span>
              <span className="font-semibold">
                {formatDate(rangeFrom) || "—"}
              </span>
            </div>
            <div className="h-px w-4 bg-gray-300 mx-2"></div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 font-medium">Até</span>
              <span className="font-semibold">
                {formatDate(rangeTo) || "—"}
              </span>
            </div>
          </div>
        )}
        <div
          className={cn(calendarHeaderVariants({ variant }), "calendar-header")}
        >
          <button
            type="button"
            onClick={
              currentPage === "dates"
                ? handlePrevMonth
                : currentPage === "years"
                ? handlePrevYearDecade
                : undefined
            }
            disabled={currentPage === "months"}
            className={cn(
              calendarNavButtonVariants({ variant }),
              "calendar-nav-button",
              currentPage === "months" && "opacity-50 cursor-not-allowed"
            )}
            aria-label={
              currentPage === "years" ? "Anos anteriores" : "Mês anterior"
            }
            tabIndex={-1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage("months")}
              className={cn(
                calendarMonthSelectVariants({ variant }),
                "calendar-month-select px-2 py-1 rounded cursor-pointer"
              )}
              aria-label="Selecionar mês"
            >
              {month.toLocaleDateString("pt-BR", { month: "long" })}
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage("years")}
              className={cn(
                calendarMonthSelectVariants({ variant }),
                "calendar-year-select px-2 py-1 rounded cursor-pointer"
              )}
              aria-label="Selecionar ano"
            >
              {month.getFullYear()}
            </button>
          </div>
          <button
            type="button"
            onClick={
              currentPage === "dates"
                ? handleNextMonth
                : currentPage === "years"
                ? handleNextYearDecade
                : undefined
            }
            disabled={currentPage === "months"}
            className={cn(
              calendarNavButtonVariants({ variant }),
              "calendar-nav-button",
              currentPage === "months" && "opacity-50 cursor-not-allowed"
            )}
            aria-label={
              currentPage === "years" ? "Próximos anos" : "Próximo mês"
            }
            tabIndex={-1}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {renderContentArea()}
      </div>
    );
  }
);

Calendar.displayName = "Calendar";

export { Calendar };
export type { CalendarProps };
