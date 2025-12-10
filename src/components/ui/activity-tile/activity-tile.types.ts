import { ReactNode } from "react";
import {
  SleepLogResponse,
  FeedLogResponse,
  DiaperLogResponse,
  MoodLogResponse,
  NoteResponse,
  BathLogResponse,
  PumpLogResponse,
  MeasurementResponse,
  MilestoneResponse,
  MedicineLogResponse,
} from "@/app/api/types";

export type ActivityType =
  | SleepLogResponse
  | FeedLogResponse
  | DiaperLogResponse
  | MoodLogResponse
  | NoteResponse
  | BathLogResponse
  | PumpLogResponse
  | MeasurementResponse
  | MilestoneResponse
  | MedicineLogResponse;

export type ActivityTileVariant =
  | "sleep"
  | "feed"
  | "diaper"
  | "note"
  | "bath"
  | "pump"
  | "measurement"
  | "milestone"
  | "medicine"
  | "default";

export interface ActivityTileProps {
  activity: ActivityType;
  onClick?: () => void;
  icon?: ReactNode;
  title?: string;
  description?: string;
  variant?: ActivityTileVariant;
  className?: string;
  isButton?: boolean;
}

export interface ActivityTileIconProps {
  activity: ActivityType;
  className?: string;
}

export interface ActivityTileContentProps {
  activity: ActivityType;
  title?: string;
  description?: string;
  className?: string;
}
