import { CalendarEventType, RecurrencePattern } from "@prisma/client";

export interface Baby {
  id: string;
  firstName: string;
  lastName: string;
  inactive?: boolean;
}
export interface Caretaker {
  id: string;
  name: string;
  type: string | null;
}
export interface Contact {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CalendarEventData {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  type: CalendarEventType;
  location: string | null;
  color: string | null;

  recurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  recurrenceEnd: string | null;
  customRecurrence: string | null;

  reminderTime: number | null;
  notificationSent: boolean;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;

  babies: Baby[];
  caretakers: Caretaker[];
  contacts: Contact[];
}
export interface CalendarEventProps {
  event: CalendarEventData;

  onClick?: (event: CalendarEventData) => void;

  compact?: boolean;

  className?: string;
}
