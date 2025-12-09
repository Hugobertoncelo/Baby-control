import { Baby } from "@prisma/client";
import { ActivityType } from "@/src/components/ui/activity-tile/activity-tile.types";

export type TimePeriod = "2dia" | "7dia" | "14dia" | "30dia";
export interface BabyQuickStatsProps {
  isOpen: boolean;

  onClose: () => void;

  selectedBaby: Baby | null;

  calculateAge?: (birthDate: Date) => string;

  activities?: ActivityType[];
}
