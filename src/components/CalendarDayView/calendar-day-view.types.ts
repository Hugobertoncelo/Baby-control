import { CalendarEventData } from "../CalendarEvent/calendar-event.types";

export interface CalendarDayViewProps {
  date: Date;
  events: CalendarEventData[];
  onEventClick?: (event: CalendarEventData) => void;
  onAddEvent?: (date: Date) => void;
  isLoading?: boolean;
  className?: string;
  onClose?: () => void;
  isOpen: boolean;
}

export interface EventGroups {
  morning: CalendarEventData[];
  afternoon: CalendarEventData[];
  evening: CalendarEventData[];
}
