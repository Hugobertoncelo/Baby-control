export interface DateTimePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}
