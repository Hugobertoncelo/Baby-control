export interface TimeEntryProps {
  value: Date | null;

  onChange: (date: Date) => void;

  className?: string;

  disabled?: boolean;

  minTime?: Date;

  maxTime?: Date;
}

export interface TimeEntryState {
  hours: number;

  minutes: number;

  isPM: boolean;

  mode: "hours" | "minutes";
}
