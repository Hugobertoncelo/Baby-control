import { Contact } from "@/src/components/CalendarEvent/calendar-event.types";

export interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact;
  onSave: (contact: ContactFormData) => void;
  onDelete?: (contactId: string) => void;
  isLoading?: boolean;
}

export interface ContactFormData {
  id?: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

export interface ContactFormErrors {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
}
