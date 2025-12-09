import { ActivityType } from "../ui/activity-tile/activity-tile.types";

export interface DailyStatsProps {
  activities: ActivityType[];
  date: Date;
  isLoading?: boolean;
}

export interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

export interface StatsTickerProps {
  stats: {
    icon: React.ReactNode;
    label: string;
    value: string;
  }[];
}
