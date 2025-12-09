import { CalendarEventData } from "@/src/components/CalendarEvent/calendar-event.types";

export interface CalendarEventItemProps {
  event: CalendarEventData;
  onClick?: (event: CalendarEventData) => void;
  className?: string;
}
