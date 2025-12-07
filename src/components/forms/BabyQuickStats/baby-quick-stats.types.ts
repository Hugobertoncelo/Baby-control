/**
 * Types for the BabyQuickStats component
 */
import { Baby } from "@prisma/client";
import { ActivityType } from "@/src/components/ui/activity-tile/activity-tile.types";

/**
 * Time period options for stats
 */
export type TimePeriod = "2dia" | "7dia" | "14dia" | "30dia";

/**
 * Props for the BabyQuickStats component
 */
export interface BabyQuickStatsProps {
  /**
   * Whether the form is open
   */
  isOpen: boolean;

  /**
   * Function to call when the form should be closed
   */
  onClose: () => void;

  /**
   * The currently selected baby
   */
  selectedBaby: Baby | null;

  /**
   * Function to calculate the age of a baby
   */
  calculateAge?: (birthDate: Date) => string;

  /**
   * Activities data for the baby
   */
  activities?: ActivityType[];
}
