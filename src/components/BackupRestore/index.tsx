"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Settings, Download, Upload, X, Save } from "lucide-react";
import { useTheme } from "@/src/context/theme";
import { cn } from "@/src/lib/utils";

import "./backup-restore.css";
import { backupRestoreStyles } from "./backup-restore.styles";
import { BackupRestoreProps, BackupRestoreState } from "./backup-restore.types";

export const BackupRestore: React.FC<BackupRestoreProps> = ({
  isLoading = false,
  isSaving = false,
  onBackupSuccess,
  onBackupError,
  onRestoreSuccess,
  onRestoreError,
  onAdminPasswordReset,
  onAdminResetAcknowledged,
  className,
  importOnly = false,
  initialSetup = false,
}) => {
  const { theme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const adminResetDetectedRef = useRef<boolean>(false);

  const [state, setState] = useState<BackupRestoreState>({
    isRestoring: false,
    isMigrating: false,
    error: null,
    success: null,
    migrationStep: null,
    awaitingAdminResetAck: false,
  });

  const clearMessages = () => {
    setState((prev) => ({
      ...prev,
      error: null,
      success: null,
      migrationStep: null,
    }));
  };

  const runPostRestoreMigrations = async () => {
    try {
      setState((prev) => ({
        ...prev,
        isMigrating: true,
        migrationStep: "Preparando a migração do banco de dados...",
        error: null,
      }));

      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({
        ...prev,
        migrationStep:
          "Verificando a versão e a compatibilidade do banco de dados...",
      }));

      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      };

      const preMigrationEndpoint = initialSetup
        ? "/api/database/pre-migration-check-initial"
        : "/api/database/pre-migration-check";

      const preMigrationResponse = await fetch(preMigrationEndpoint, {
        method: "POST",
        headers,
      });

      if (!preMigrationResponse.ok) {
        console.warn(
          "A verificação pré-migração falhou; a migração continuará...."
        );
      } else {
        const preMigrationResult = await preMigrationResponse.json();
        if (
          preMigrationResult.success &&
          preMigrationResult.data?.adminResetRequired
        ) {
          console.log(
            "A redefinição da senha de administrador foi necessária e já foi concluída."
          );
          adminResetDetectedRef.current = true;
          onAdminPasswordReset?.();
          setState((prev) => ({
            ...prev,
            migrationStep:
              "Verificação de compatibilidade do banco de dados concluída. Executando migrações...",
          }));
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      setState((prev) => ({
        ...prev,
        migrationStep: "Executando migrações e atualizações de esquema...",
      }));

      const migrationEndpoint = initialSetup
        ? "/api/database/migrate-initial"
        : "/api/database/migrate";
      const response = await fetch(migrationEndpoint, {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();

        if (response.status === 401) {
          throw new Error(
            "É necessária autenticação. Faça login como administrador do sistema para realizar migrações de banco de dados."
          );
        } else if (response.status === 403) {
          throw new Error(
            "É necessário acesso de administrador do sistema. Somente administradores do sistema podem realizar migrações de banco de dados."
          );
        }

        const suggestion = errorData.data?.suggestion
          ? ` ${errorData.data.suggestion}`
          : "";
        throw new Error(
          `${errorData.error || "Falha na migração"}${suggestion}`
        );
      }

      const result = await response.json();

      const shouldWaitForAck =
        adminResetDetectedRef.current && onAdminResetAcknowledged;

      if (shouldWaitForAck) {
        setState((prev) => ({
          ...prev,
          migrationStep:
            "Migração concluída! Por favor, confirme a notificação de redefinição de senha.",
        }));

        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isMigrating: false,
            migrationStep: null,
            success: initialSetup
              ? "Banco de dados importado e migrado com sucesso."
              : "Banco de dados restaurado e migrado com sucesso.",
            awaitingAdminResetAck: true,
          }));
        }, 1000);

        await onAdminResetAcknowledged();

        setState((prev) => ({
          ...prev,
          awaitingAdminResetAck: false,
        }));

        if (!initialSetup) {
        } else {
          onRestoreSuccess?.();
        }
      } else {
        setState((prev) => ({
          ...prev,
          migrationStep: "Migração concluída! Recarregando o aplicativo...",
        }));

        setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isMigrating: false,
            migrationStep: null,
            success: initialSetup
              ? "Banco de dados importado e migrado com sucesso. Redirecionando..."
              : "Banco de dados restaurado e migrado com sucesso. O aplicativo está sendo recarregado...",
          }));

          if (!initialSetup) {
          } else {
            setTimeout(() => {
              onRestoreSuccess?.();
            }, 1000);
          }
        }, 1000);
      }
    } catch (error) {
      console.error("Migration error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Falha ao migrar o banco de dados";
      setState((prev) => ({
        ...prev,
        isMigrating: false,
        migrationStep: null,
        error: `A restauração do banco de dados foi bem-sucedida, mas a migração falhou: ${errorMessage}`,
      }));
    }
  };

  const handleBackup = async () => {
    try {
      clearMessages();

      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {};

      const response = await fetch("/api/database", { headers });
      if (!response.ok) throw new Error("Backup failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        response.headers
          .get("Content-Disposition")
          ?.split("filename=")[1]
          .replace(/"/g, "") || "baby-control-backup.db";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setState((prev) => ({ ...prev, success: "Backup criado com sucesso" }));
      onBackupSuccess?.();
    } catch (error) {
      console.error("Backup error:", error);
      const errorMessage = "Falha ao criar o backup";
      setState((prev) => ({ ...prev, error: errorMessage }));
      onBackupError?.(errorMessage);
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setState((prev) => ({
        ...prev,
        isRestoring: true,
        error: null,
        success: null,
      }));

      const formData = new FormData();
      formData.append("file", file);

      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = authToken
        ? {
            Authorization: `Bearer ${authToken}`,
          }
        : {};

      const restoreEndpoint = initialSetup
        ? "/api/database/restore-initial"
        : "/api/database";
      const response = await fetch(restoreEndpoint, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha na restauração");
      }

      setState((prev) => ({
        ...prev,
        success:
          "Banco de dados restaurado com sucesso. Migrações em execução....",
      }));

      await runPostRestoreMigrations();
    } catch (error) {
      console.error("Restore error:", error);
      const errorMessage = "Falha ao restaurar o backup";
      setState((prev) => ({ ...prev, error: errorMessage }));
      onRestoreError?.(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, isRestoring: false }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn(backupRestoreStyles.container, className)}>
      <input
        type="file"
        ref={fileInputRef}
        accept=".db,.zip"
        onChange={handleRestore}
        style={{ display: "none" }}
      />

      <div className={backupRestoreStyles.header.container}>
        <Settings className={backupRestoreStyles.header.icon} />
        <Label className={backupRestoreStyles.header.title}>
          {importOnly
            ? "Importar dados anteriores"
            : "Gerenciamento de banco de dados"}
        </Label>
      </div>

      <div className={backupRestoreStyles.buttonContainer}>
        {!importOnly && (
          <Button
            type="button"
            variant="outline"
            onClick={handleBackup}
            className={backupRestoreStyles.button.backup}
            disabled={
              isLoading || isSaving || state.isRestoring || state.isMigrating
            }
          >
            <Download className={backupRestoreStyles.icon} />
            Banco de dados de backup
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            backupRestoreStyles.button.restore,
            importOnly && "w-full"
          )}
          disabled={
            isLoading || isSaving || state.isRestoring || state.isMigrating
          }
        >
          <Upload className={backupRestoreStyles.icon} />
          {state.isRestoring
            ? "Importando..."
            : state.isMigrating
            ? "Migrando..."
            : importOnly
            ? "Importar banco de dados"
            : "Restaurar banco de dados"}
        </Button>
      </div>

      <p className={backupRestoreStyles.helpText}>
        {importOnly
          ? "Importe os dados de um backup anterior do banco de dados do Baby Control para começar com os dados familiares existentes ou ignore esta etapa para criar uma nova família do zero."
          : "Crie backups do seu banco de dados ou restaure a partir de um backup anterior. A restauração substituirá todos os dados atuais e executará as migrações necessárias."}
      </p>

      {state.isMigrating && state.migrationStep && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md migration-progress-container">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm text-blue-700 migration-progress-text">
              {state.migrationStep}
            </span>
          </div>
        </div>
      )}

      {state.error && (
        <div className={backupRestoreStyles.error.container}>
          <div className={backupRestoreStyles.error.content}>
            <X className={backupRestoreStyles.error.icon} />
            <span className={backupRestoreStyles.error.text}>
              {state.error}
            </span>
          </div>
        </div>
      )}

      {state.success && (
        <div className={backupRestoreStyles.success.container}>
          <div className={backupRestoreStyles.success.content}>
            <Save className={backupRestoreStyles.success.icon} />
            <span className={backupRestoreStyles.success.text}>
              {state.success}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupRestore;
