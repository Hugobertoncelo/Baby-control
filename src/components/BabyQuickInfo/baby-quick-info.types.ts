import { Baby } from "@prisma/client";

export type Tab = "notifications" | "contacts" | "stats";
export interface BabyQuickInfoProps {
  isOpen: boolean;

  onClose: () => void;

  selectedBaby: Baby | null;

  calculateAge?: (birthDate: Date) => string;
}

export interface NotificationsTabProps {
  lastActivities: any;

  upcomingEvents: any[];

  selectedBaby: Baby;
}
export interface ContactsTabProps {
  contacts: any[];

  selectedBaby: Baby;
}

export interface StatsTabProps {
  activities: any[];

  selectedBaby: Baby;

  calculateAge?: (birthDate: Date) => string;
}

export interface LastActivitiesData {
  lastDiaper: {
    id: string;
    time: string;
    type: string;
    condition: string;
    caretakerName?: string;
  } | null;

  lastBath: {
    id: string;
    time: string;
    soapUsed: boolean;
    caretakerName?: string;
  } | null;

  lastMeasurements: {
    height: {
      id: string;
      date: string;
      value: number;
      unit: string;
      caretakerName?: string;
    } | null;

    weight: {
      id: string;
      date: string;
      value: number;
      unit: string;
      caretakerName?: string;
    } | null;

    headCircumference: {
      id: string;
      date: string;
      value: number;
      unit: string;
      caretakerName?: string;
    } | null;
  };

  lastNote: {
    id: string;
    time: string;
    content: string;
    caretakerName?: string;
  } | null;
}
