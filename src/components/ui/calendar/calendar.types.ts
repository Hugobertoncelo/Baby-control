import { type VariantProps } from "class-variance-authority";
import { calendarVariants } from "./calendar.styles";

export interface CalendarProps extends VariantProps<typeof calendarVariants> {
  selected?: Date | null | undefined;
  onSelect?: (date: Date) => void;
  rangeFrom?: Date | null | undefined;
  rangeTo?: Date | null | undefined;
  onRangeChange?: (from: Date | null, to: Date | null) => void;
  mode?: "single" | "range";
  month?: Date;
  className?: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  isDateDisabled?: (date: Date) => boolean;
  initialFocus?: boolean;
}

export type CalendarPage = "dates" | "months" | "years";

export interface CalendarState {
  currentPage: CalendarPage;
  displayMonth: Date;
}
