"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { Settings, Loader2, Save, X, Mail, ChevronDown } from "lucide-react";
import { BackupRestore } from "@/src/components/BackupRestore";
import { AdminPasswordResetModal } from "@/src/components/BackupRestore/AdminPasswordResetModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { EmailProviderType } from "@prisma/client";

interface AppConfigFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AppConfigData {
  id: string;
  adminPass: string;
  rootDomain: string;
  enableHttps: boolean;
  updatedAt: string;
}

interface EmailConfigData {
  id: string;
  providerType: EmailProviderType;
  sendGridApiKey?: string;
  smtp2goApiKey?: string;
  serverAddress?: string;
  port?: number;
  username?: string;
  password?: string;
  enableTls: boolean;
  allowSelfSignedCert: boolean;
  updatedAt: string;
}

export default function AppConfigForm({ isOpen, onClose }: AppConfigFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [appConfig, setAppConfig] = useState<AppConfigData | null>(null);
  const [emailConfig, setEmailConfig] = useState<EmailConfigData | null>(null);
  const [formData, setFormData] = useState({
    adminPass: "",
    rootDomain: "",
    enableHttps: false,
  });
  const [emailFormData, setEmailFormData] = useState({
    providerType: "SENDGRID" as EmailProviderType,
    sendGridApiKey: "",
    smtp2goApiKey: "",
    serverAddress: "",
    port: 587,
    username: "",
    password: "",
    enableTls: true,
    allowSelfSignedCert: false,
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordStep, setPasswordStep] = useState<
    "verify" | "new" | "confirm"
  >("verify");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [originalPassword, setOriginalPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const closeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const adminResetResolverRef = React.useRef<(() => void) | null>(null);

  const handleAdminPasswordReset = () => {
    setShowPasswordResetModal(true);
  };

  const handlePasswordResetConfirm = () => {
    if (adminResetResolverRef.current) {
      adminResetResolverRef.current();
      adminResetResolverRef.current = null;
    }
  };

  const handleAdminResetAcknowledged = () => {
    return new Promise<void>((resolve) => {
      adminResetResolverRef.current = resolve;
    });
  };

  const fetchAppConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/app-config", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setError(
          "É necessária autenticação. Certifique-se de estar conectado como administrador do sistema."
        );
        return;
      }

      if (data.success) {
        setAppConfig(data.data.appConfig);
        setEmailConfig(data.data.emailConfig);
        setOriginalPassword(data.data.appConfig?.adminPass || "");
        setFormData({
          adminPass: data.data.appConfig?.adminPass || "",
          rootDomain: data.data.appConfig?.rootDomain || "",
          enableHttps: data.data.appConfig?.enableHttps || false,
        });
        setEmailFormData({
          providerType: data.data.emailConfig?.providerType || "SENDGRID",
          sendGridApiKey: data.data.emailConfig?.sendGridApiKey || "",
          smtp2goApiKey: data.data.emailConfig?.smtp2goApiKey || "",
          serverAddress: data.data.emailConfig?.serverAddress || "",
          port: data.data.emailConfig?.port || 587,
          username: data.data.emailConfig?.username || "",
          password: data.data.emailConfig?.password || "",
          enableTls: data.data.emailConfig?.enableTls !== false,
          allowSelfSignedCert:
            data.data.emailConfig?.allowSelfSignedCert || false,
        });
        setShowPasswordChange(false);
        setPasswordStep("verify");
        setVerifyPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Falha ao obter a configuração do aplicativo");
      }
    } catch (error) {
      console.error("Error fetching app config:", error);
      setError("Falha ao obter a configuração do aplicativo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAppConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
    setError(null);
    setSuccess(null);
  };

  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setEmailFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) : value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleEmailCheckboxChange = (name: string, checked: boolean) => {
    setEmailFormData((prev) => ({ ...prev, [name]: checked }));
    setError(null);
    setSuccess(null);
  };

  const handleProviderChange = (provider: EmailProviderType) => {
    setEmailFormData((prev) => ({ ...prev, providerType: provider }));
  };

  const handleVerifyPassword = () => {
    if (verifyPassword === originalPassword) {
      setPasswordStep("new");
      setError(null);
    } else {
      setError("Senha atual incorreta");
      setVerifyPassword("");
    }
  };

  const handleNewPassword = () => {
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setPasswordStep("confirm");
    setError(null);
  };

  const handleConfirmPassword = async () => {
    if (newPassword === confirmPassword) {
      try {
        setSaving(true);
        setError(null);

        const authToken = localStorage.getItem("authToken");
        const response = await fetch("/api/app-config", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            appConfigData: { adminPass: newPassword },
          }),
        });

        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          setError(
            "É necessária autenticação. Certifique-se de estar conectado como administrador do sistema."
          );
          return;
        }

        if (data.success) {
          setAppConfig(data.data.appConfig);
          setFormData((prev) => ({
            ...prev,
            adminPass: data.data.appConfig.adminPass,
          }));
          setOriginalPassword(data.data.appConfig.adminPass);

          setShowPasswordChange(false);
          setPasswordStep("verify");
          setVerifyPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setError(null);
          setSuccess("Senha alterada com sucesso");
          scheduleAutoClose();
        } else {
          setError(data.error || "Falha ao atualizar a senha");
        }
      } catch (error) {
        console.error("Error updating password:", error);
        setError("Falha ao atualizar a senha");
      } finally {
        setSaving(false);
      }
    } else {
      setError("As senhas não coincidem.");
      setConfirmPassword("");
    }
  };

  const resetPasswordForm = () => {
    setShowPasswordChange(false);
    setPasswordStep("verify");
    setVerifyPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    if (!formData.adminPass.trim()) {
      setError("A senha do administrador é obrigatória");
      return false;
    }

    if (!formData.rootDomain.trim()) {
      setError("O domínio raiz é obrigatório");
      return false;
    }

    const domainOrIpRegex =
      /^(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?|(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)|localhost)(?::[1-9][0-9]{0,4})?$/;
    if (!domainOrIpRegex.test(formData.rootDomain)) {
      setError(
        "Por favor, insira um domínio válido, um endereço IP ou localhost (com porta opcional)."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const payload = {
      appConfigData: formData,
      emailConfigData: emailFormData,
    };

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/app-config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setError(
          "É necessária autenticação. Certifique-se de estar conectado como administrador do sistema."
        );
        return;
      }

      if (data.success) {
        setAppConfig(data.data.appConfig);
        setEmailConfig(data.data.emailConfig);
        setSuccess("Configuração do aplicativo atualizada com sucesso");
        scheduleAutoClose();
      } else {
        setError(
          data.error || "Falha ao atualizar a configuração do aplicativo"
        );
      }
    } catch (error) {
      console.error("Error updating app config:", error);
      setError("Falha ao atualizar a configuração do aplicativo");
    } finally {
      setSaving(false);
    }
  };

  const scheduleAutoClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }

    closeTimeoutRef.current = setTimeout(() => {
      handleClose();
    }, 500);
  };

  const handleClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }

    setError(null);
    setSuccess(null);
    resetPasswordForm();
    onClose();
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={handleClose}
      title="Configuração do aplicativo"
      description="Gerenciar configurações globais de aplicativos"
    >
      <form
        onSubmit={handleSubmit}
        className="h-full flex flex-col overflow-hidden"
      >
        <FormPageContent className="space-y-6 overflow-y-auto flex-1 pb-24">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <span className="ml-2 text-gray-600">
                Carregando configuração...
              </span>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-teal-600" />
                  <Label className="text-lg font-semibold">
                    Configurações do sistema
                  </Label>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Senha de administrador
                    </Label>

                    {!showPasswordChange ? (
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          disabled
                          value="••••••"
                          className="flex-1 font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowPasswordChange(true)}
                          disabled={loading}
                        >
                          Alterar a senha
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <Label className="text-sm font-medium">
                            Alterar senha de administrador
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetPasswordForm}
                          >
                            Cancelar
                          </Button>
                        </div>

                        {passwordStep === "verify" && (
                          <div className="space-y-2">
                            <Label htmlFor="verifyPassword" className="text-sm">
                              Senha atual
                            </Label>
                            <div className="flex space-x-2">
                              <Input
                                type="password"
                                id="verifyPassword"
                                value={verifyPassword}
                                onChange={(e) => {
                                  setVerifyPassword(e.target.value);
                                  setError(null);
                                  setSuccess(null);
                                }}
                                placeholder="Digite a senha atual"
                                autoComplete="current-password"
                              />
                              <Button
                                type="button"
                                onClick={handleVerifyPassword}
                                disabled={!verifyPassword.trim()}
                              >
                                Continuar
                              </Button>
                            </div>
                          </div>
                        )}

                        {passwordStep === "new" && (
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-sm">
                              Nova Senha
                            </Label>
                            <div className="flex space-x-2">
                              <Input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => {
                                  setNewPassword(e.target.value);
                                  setError(null);
                                  setSuccess(null);
                                }}
                                placeholder="Digite a nova senha"
                                autoComplete="new-password"
                              />
                              <Button
                                type="button"
                                onClick={handleNewPassword}
                                disabled={!newPassword.trim()}
                              >
                                Continuar
                              </Button>
                            </div>
                            <p className="text-xs text-gray-500">
                              A senha deve ter pelo menos 6 caracteres.
                            </p>
                          </div>
                        )}

                        {passwordStep === "confirm" && (
                          <div className="space-y-2">
                            <Label
                              htmlFor="confirmNewPassword"
                              className="text-sm"
                            >
                              Confirme a nova senha
                            </Label>
                            <div className="flex space-x-2">
                              <Input
                                type="password"
                                id="confirmNewPassword"
                                value={confirmPassword}
                                onChange={(e) => {
                                  setConfirmPassword(e.target.value);
                                  setError(null);
                                  setSuccess(null);
                                }}
                                placeholder="Confirme a nova senha"
                                autoComplete="new-password"
                              />
                              <Button
                                type="button"
                                onClick={handleConfirmPassword}
                                disabled={!confirmPassword.trim() || saving}
                              >
                                {saving ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Atualizando...
                                  </>
                                ) : (
                                  "Atualizar"
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-gray-500">
                      Esta senha é usada para acesso administrativo em todo o
                      sistema.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rootDomain" className="text-sm font-medium">
                      Domínio Raiz
                      <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Input
                      type="text"
                      id="rootDomain"
                      name="rootDomain"
                      value={formData.rootDomain}
                      onChange={handleInputChange}
                      placeholder="exemplo.com"
                      required
                    />
                    <p className="text-xs text-gray-500">
                      O domínio principal para esta instância de aplicação.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="enableHttps"
                        checked={formData.enableHttps}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(
                            "enableHttps",
                            checked as boolean
                          )
                        }
                      />
                      <Label
                        htmlFor="enableHttps"
                        className="text-sm font-medium cursor-pointer"
                      >
                        Habilitar HTTPS
                      </Label>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Habilite conexões HTTPS seguras para o aplicativo.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-teal-600" />
                  <Label className="text-lg font-semibold">
                    Configuração de e-mail
                  </Label>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="providerType"
                      className="text-sm font-medium"
                    >
                      Provedor de e-mail
                    </Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          <span>
                            {emailFormData.providerType.replace("_", " ")}
                          </span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        <DropdownMenuItem
                          onSelect={() => handleProviderChange("SENDGRID")}
                        >
                          SendGrid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleProviderChange("SMTP2GO")}
                        >
                          SMTP2GO
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => handleProviderChange("MANUAL_SFTP")}
                        >
                          Manual SMTP
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {emailFormData.providerType === "SENDGRID" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="sendGridApiKey"
                        className="text-sm font-medium"
                      >
                        Chave da API SendGrid
                      </Label>
                      <Input
                        type="password"
                        id="sendGridApiKey"
                        name="sendGridApiKey"
                        value={emailFormData.sendGridApiKey}
                        onChange={handleEmailInputChange}
                        placeholder="Insira a chave da API do SendGrid"
                      />
                    </div>
                  )}

                  {emailFormData.providerType === "SMTP2GO" && (
                    <div className="space-y-2">
                      <Label
                        htmlFor="smtp2goApiKey"
                        className="text-sm font-medium"
                      >
                        Chave da API SMTP2GO
                      </Label>
                      <Input
                        type="password"
                        id="smtp2goApiKey"
                        name="smtp2goApiKey"
                        value={emailFormData.smtp2goApiKey}
                        onChange={handleEmailInputChange}
                        placeholder="Insira a chave da API SMTP2GO"
                      />
                    </div>
                  )}

                  {emailFormData.providerType === "MANUAL_SFTP" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="serverAddress"
                          className="text-sm font-medium"
                        >
                          Endereço do servidor
                        </Label>
                        <Input
                          type="text"
                          id="serverAddress"
                          name="serverAddress"
                          value={emailFormData.serverAddress}
                          onChange={handleEmailInputChange}
                          placeholder="smtp.exemplo.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="port" className="text-sm font-medium">
                          Porta
                        </Label>
                        <Input
                          type="number"
                          id="port"
                          name="port"
                          value={emailFormData.port}
                          onChange={handleEmailInputChange}
                          placeholder="587"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="username"
                          className="text-sm font-medium"
                        >
                          Username
                        </Label>
                        <Input
                          type="text"
                          id="username"
                          name="username"
                          value={emailFormData.username}
                          onChange={handleEmailInputChange}
                          autoComplete="Username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="password"
                          className="text-sm font-medium"
                        >
                          Senha
                        </Label>
                        <Input
                          type="password"
                          id="password"
                          name="password"
                          value={emailFormData.password}
                          onChange={handleEmailInputChange}
                          autoComplete="new-password"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="enableTls"
                          checked={emailFormData.enableTls}
                          onCheckedChange={(checked) =>
                            handleEmailCheckboxChange(
                              "enableTls",
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor="enableTls"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Habilitar TLS
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowSelfSignedCert"
                          checked={emailFormData.allowSelfSignedCert}
                          onCheckedChange={(checked) =>
                            handleEmailCheckboxChange(
                              "allowSelfSignedCert",
                              checked as boolean
                            )
                          }
                        />
                        <Label
                          htmlFor="allowSelfSignedCert"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Permitir certificado autoassinado
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <BackupRestore
                isLoading={loading}
                isSaving={saving}
                onBackupError={(error) => setError(error)}
                onRestoreError={(error) => setError(error)}
                onAdminPasswordReset={handleAdminPasswordReset}
                onAdminResetAcknowledged={handleAdminResetAcknowledged}
              />

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <div className="flex items-center">
                    <X className="h-4 w-4 text-red-500 mr-2" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </span>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center">
                    <Save className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm text-green-700 dark:text-green-300">
                      {success}
                    </span>
                  </div>
                </div>
              )}

              {appConfig && (
                <div className="text-xs text-gray-500 pt-4 border-t border-gray-200 dark:border-gray-700">
                  Última atualização:{" "}
                  {new Date(appConfig.updatedAt).toLocaleString()}
                </div>
              )}
            </>
          )}
        </FormPageContent>

        <FormPageFooter>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700"
              disabled={saving || loading}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar configuração
                </>
              )}
            </Button>
          </div>
        </FormPageFooter>
      </form>

      <AdminPasswordResetModal
        open={showPasswordResetModal}
        onOpenChange={setShowPasswordResetModal}
        onConfirm={handlePasswordResetConfirm}
      />
    </FormPage>
  );
}
