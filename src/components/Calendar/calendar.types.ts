import { CalendarEventData } from "@/src/components/CalendarEvent/calendar-event.types";

export interface CalendarProps {
  selectedBabyId: string | undefined;
  userTimezone: string;
  onDateSelect?: (date: Date | null) => void;
}

export interface CalendarDayItem {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  items: any[];
}

export interface CalendarState {
  currentDate: Date;
  selectedDate: Date | null;
  calendarDays: Date[];
  events: CalendarEventData[];
  isLoadingEvents?: boolean;
}
