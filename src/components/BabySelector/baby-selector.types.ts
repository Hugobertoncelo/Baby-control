import { Baby } from "@prisma/client";

export interface BabySelectorProps {
  selectedBaby: Baby | null;

  onBabySelect: (baby: Baby) => void;

  babies: Baby[];

  sleepingBabies: Set<string>;

  calculateAge: (birthDate: Date) => string;

  onOpenQuickStats: () => void;
}
