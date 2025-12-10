import { Medicine, MedicineLog } from "@prisma/client";

export type MedicineFormTab = "active-doses" | "manage-medicines";

export interface MedicineFormProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  onSuccess?: () => void;
  activity?: any;
}

export interface ActiveDosesTabProps {
  babyId: string | undefined;
  refreshData: () => void;
  onGiveMedicine?: () => void;
  refreshTrigger?: number;
}

export interface GiveMedicineTabProps {
  babyId: string | undefined;
  initialTime: string;
  onSuccess?: () => void;
  refreshData: () => void;
  setIsSubmitting?: React.Dispatch<React.SetStateAction<boolean>>;
  activity?: any;
}

export interface ManageMedicinesTabProps {
  refreshData: () => void;
}

export interface MedicineWithContacts extends Medicine {
  contacts: {
    contact: {
      id: string;
      name: string;
      role: string;
    };
  }[];
  unit?: {
    unitAbbr: string;
    unitName: string;
  } | null;
}

export interface MedicineLogWithDetails extends MedicineLog {
  medicine: MedicineWithContacts;
  unit?: {
    unitAbbr: string;
    unitName: string;
  } | null;
}

export interface MedicineFormData {
  id?: string;
  name: string;
  typicalDoseSize?: number;
  unitAbbr?: string;
  doseMinTime?: string;
  notes?: string;
  active?: boolean;
  contactIds?: string[];
}

export interface MedicineLogFormData {
  babyId: string;
  medicineId: string;
  time: string;
  doseAmount: number;
  unitAbbr?: string;
  notes?: string;
}

export interface ActiveDose {
  id: string;
  medicineName: string;
  doseAmount: number;
  unitAbbr?: string;
  time: string;
  nextDoseTime?: string;
  isSafe: boolean;
  minutesRemaining?: number;
  totalIn24Hours: number;
  doseMinTime: string;
}
