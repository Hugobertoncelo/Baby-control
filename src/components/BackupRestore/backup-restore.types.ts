export interface BackupRestoreProps {
  isLoading?: boolean;
  isSaving?: boolean;
  onBackupSuccess?: () => void;
  onBackupError?: (error: string) => void;
  onRestoreSuccess?: () => void;
  onRestoreError?: (error: string) => void;
  onAdminPasswordReset?: () => void;
  onAdminResetAcknowledged?: () => Promise<void>;
  className?: string;
  importOnly?: boolean;
  initialSetup?: boolean;
}

export interface BackupRestoreState {
  isRestoring: boolean;
  isMigrating: boolean;
  error: string | null;
  success: string | null;
  migrationStep: string | null;
  awaitingAdminResetAck: boolean;
}
