import { CalendarEventType, RecurrencePattern } from "@prisma/client";
import { Baby } from "@/src/components/CalendarEvent/calendar-event.types";
import { Caretaker } from "@/src/components/CalendarEvent/calendar-event.types";
import { Contact } from "@/src/components/CalendarEvent/calendar-event.types";

export interface CalendarEventFormProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEventFormData;
  onSave: (event: CalendarEventFormData) => void;
  initialDate?: Date;
  babies: Baby[];
  caretakers: Caretaker[];
  contacts: Contact[];
  isLoading?: boolean;
  familyId?: string;
}

export interface CalendarEventFormData {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  allDay: boolean;
  type: CalendarEventType;
  location?: string;
  color?: string;
  recurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEnd?: Date;
  customRecurrence?: string;
  reminderTime?: number;
  babyIds: string[];
  caretakerIds: string[];
  contactIds: string[];
  familyId?: string;
  _deleted?: boolean;
}

export interface CalendarEventFormErrors {
  title?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  recurrencePattern?: string;
  recurrenceEnd?: string;
  reminderTime?: string;
}
