"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Gender } from "@prisma/client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { ShareButton } from "@/src/components/ui/share-button";
import { format } from "date-fns";
import { cn } from "@/src/lib/utils";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";
import "./FamilyForm.css";

interface FamilyData {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FamilyFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  family: FamilyData | null;
  onFamilyChange: () => void;
}

type SetupMode = "manual" | "token";

interface CaretakerData {
  loginId: string;
  name: string;
  type: string;
  role: "ADMIN" | "USER";
  securityPin: string;
}

export default function FamilyForm({
  isOpen,
  onClose,
  isEditing,
  family,
  onFamilyChange,
}: FamilyFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [appConfig, setAppConfig] = useState<{
    rootDomain: string;
    enableHttps: boolean;
  } | null>(null);

  const [setupMode, setSetupMode] = useState<SetupMode>("manual");

  const [familyName, setFamilyName] = useState("");
  const [familySlug, setFamilySlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugValidated, setSlugValidated] = useState(false);

  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [tokenPassword, setTokenPassword] = useState("");
  const [confirmTokenPassword, setConfirmTokenPassword] = useState("");

  const [useSystemPin, setUseSystemPin] = useState(true);
  const [systemPin, setSystemPin] = useState("");
  const [confirmSystemPin, setConfirmSystemPin] = useState("");
  const [caretakers, setCaretakers] = useState<CaretakerData[]>([]);
  const [newCaretaker, setNewCaretaker] = useState<CaretakerData>({
    loginId: "",
    name: "",
    type: "",
    role: "ADMIN",
    securityPin: "",
  });

  const [babyFirstName, setBabyFirstName] = useState("");
  const [babyLastName, setBabyLastName] = useState("");
  const [babyBirthDate, setBabyBirthDate] = useState<Date | null>(null);
  const [babyGender, setBabyGender] = useState<Gender | "">("");
  const [feedWarningTime, setFeedWarningTime] = useState("02:00");
  const [diaperWarningTime, setDiaperWarningTime] = useState("03:00");

  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAppConfig = async () => {
      try {
        const response = await fetch("/api/app-config/public");
        const data = await response.json();
        if (data.success) {
          setAppConfig(data.data);
        }
      } catch (error) {
        console.error("Error fetching app config:", error);
      }
    };

    if (isOpen) {
      fetchAppConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (isEditing && family) {
        setFamilyName(family.name);
        setFamilySlug(family.slug);
      } else {
        setSetupMode("manual");
        setFamilyName("");
        setFamilySlug("");
        setSlugError("");
        setSlugValidated(false);
        setGeneratedToken(null);
        setTokenPassword("");
        setConfirmTokenPassword("");
        setUseSystemPin(true);
        setSystemPin("");
        setConfirmSystemPin("");
        setCaretakers([]);
        setNewCaretaker({
          loginId: "",
          name: "",
          type: "",
          role: "ADMIN",
          securityPin: "",
        });
        setBabyFirstName("");
        setBabyLastName("");
        setBabyBirthDate(null);
        setBabyGender("");
        setFeedWarningTime("02:00");
        setDiaperWarningTime("03:00");
        setError("");
      }
    }
  }, [isOpen, isEditing, family]);

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };
  };

  const generateSlug = async () => {
    try {
      const response = await fetch("/api/family/generate-slug", {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success && data.data.slug) {
        setFamilySlug(data.data.slug);
        setSlugError("");
        setSlugValidated(false);
      } else {
        setSlugError("Falha ao gerar URL única");
      }
    } catch (error) {
      console.error("Erro ao gerar o slug:", error);
      setSlugError("Erro ao gerar URL");
    }
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSlugFieldClick = () => {
    if (!familySlug && familyName) {
      const autoSlug = generateSlugFromName(familyName);
      if (autoSlug) {
        setFamilySlug(autoSlug);
      }
    }
  };

  const checkSlugUniqueness = useCallback(async (slug: string) => {
    if (!slug || slug.trim() === "") {
      setSlugError("");
      setSlugValidated(false);
      return;
    }

    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      setSlugError(
        "O termo slug só pode conter letras minúsculas, números e hífenes."
      );
      setSlugValidated(false);
      return;
    }

    if (slug.length < 3) {
      setSlugError("O slug deve ter pelo menos 3 caracteres.");
      setSlugValidated(false);
      return;
    }

    if (slug.length > 50) {
      setSlugError("O slug deve ter menos de 50 caracteres.");
      setSlugValidated(false);
      return;
    }

    setCheckingSlug(true);
    setSlugValidated(false);
    try {
      const response = await fetch(
        `/api/family/by-slug/${encodeURIComponent(slug)}`,
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await response.json();

      if (data.success && data.data) {
        setSlugError("Este URL já está em uso.");
        setSlugValidated(false);
      } else {
        setSlugError("");
        setSlugValidated(true);
      }
    } catch (error) {
      console.error("Erro ao verificar o slug:", error);
      setSlugError("Erro ao verificar a disponibilidade do URL");
      setSlugValidated(false);
    } finally {
      setCheckingSlug(false);
    }
  }, []);

  useEffect(() => {
    if (familySlug) {
      const timeoutId = setTimeout(() => {
        checkSlugUniqueness(familySlug);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [familySlug, checkSlugUniqueness]);

  const addCaretaker = () => {
    if (newCaretaker.loginId.length !== 2) {
      setError("O ID de login deve ter exatamente 2 dígitos.");
      return;
    }

    if (!/^\d+$/.test(newCaretaker.loginId)) {
      setError("O ID de login deve conter apenas dígitos.");
      return;
    }

    if (newCaretaker.loginId === "00") {
      setError('O ID de login "00" está reservado para uso do sistema.');
      return;
    }

    if (caretakers.some((c) => c.loginId === newCaretaker.loginId)) {
      setError("Este ID de login já está em uso.");
      return;
    }

    if (!newCaretaker.name.trim()) {
      setError("Por favor, insira o nome do zelador.");
      return;
    }

    if (
      newCaretaker.securityPin.length < 6 ||
      newCaretaker.securityPin.length > 10
    ) {
      setError("O PIN deve ter entre 6 e 10 dígitos.");
      return;
    }

    setCaretakers([...caretakers, { ...newCaretaker }]);
    setNewCaretaker({
      loginId: "",
      name: "",
      type: "",
      role: "USER",
      securityPin: "",
    });
    setError("");
  };

  const removeCaretaker = (index: number) => {
    const updatedCaretakers = [...caretakers];
    updatedCaretakers.splice(index, 1);
    setCaretakers(updatedCaretakers);
  };

  const handleGenerateToken = async () => {
    setError("");

    if (!tokenPassword.trim()) {
      setError("Por favor, insira uma senha de configuração.");
      return;
    }

    if (tokenPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (tokenPassword !== confirmTokenPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/family/create-setup-link", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          password: tokenPassword,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError, errorData } = await handleExpirationError(
            response,
            showToast,
            "criando convites de configuração"
          );
          if (isExpirationError) {
            return;
          }
          if (errorData) {
            setError(
              errorData.error || "Falha ao gerar o token de configuração."
            );
            return;
          }
        }

        const errorData = await response.json();
        setError(errorData.error || "Falha ao gerar o token de configuração.");
        return;
      }

      const data = await response.json();

      if (data.success) {
        setGeneratedToken(data.data.setupUrl);
        onFamilyChange();
      } else {
        setError(data.error || "Falha ao gerar o token de configuração.");
      }
    } catch (error) {
      console.error("Erro ao gerar o token de configuração:", error);
      setError("Falha ao gerar o token de configuração. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    setError("");

    if (!familyName.trim()) {
      setError("Por favor, insira um sobrenome.");
      return;
    }

    if (!familySlug.trim()) {
      setError("Por favor, insira um URL familiar.");
      return;
    }

    if (familySlug) {
      await checkSlugUniqueness(familySlug);
    }

    if (slugError) {
      setError("Por favor, corrija o erro de URL antes de prosseguir.");
      return;
    }

    if (useSystemPin) {
      if (systemPin.length < 6 || systemPin.length > 10) {
        setError("O PIN deve ter entre 6 e 10 dígitos.");
        return;
      }

      if (systemPin !== confirmSystemPin) {
        setError("Os PINs não coincidem.");
        return;
      }
    } else {
      if (caretakers.length === 0) {
        setError("Por favor, adicione pelo menos um cuidador.");
        return;
      }
    }

    if (!babyFirstName.trim()) {
      setError("Por favor, digite o primeiro nome do bebê.");
      return;
    }

    if (!babyLastName.trim()) {
      setError("Por favor, digite o sobrenome do bebê.");
      return;
    }

    if (!babyBirthDate) {
      setError("Por favor, insira a data de nascimento do bebê.");
      return;
    }

    if (!babyGender) {
      setError("Por favor, selecione o sexo do bebê.");
      return;
    }

    try {
      setLoading(true);

      const familyResponse = await fetch("/api/setup/start", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: familyName,
          slug: familySlug,
          isNewFamily: true,
        }),
      });

      if (!familyResponse.ok) {
        if (familyResponse.status === 403) {
          const { isExpirationError, errorData } = await handleExpirationError(
            familyResponse,
            showToast,
            "criando famílias"
          );
          if (isExpirationError) {
            return;
          }
          if (errorData) {
            throw new Error(errorData.error || "Não conseguiu formar família");
          }
          throw new Error("Não conseguiu formar família");
        }

        const errorData = await familyResponse.json();
        throw new Error(errorData.error || "Não conseguiu formar uma família");
      }

      const familyData = await familyResponse.json();

      if (!familyData.success) {
        throw new Error(familyData.error || "Não conseguiu formar família");
      }

      const createdFamilyId = familyData.data.id;

      if (useSystemPin) {
        const settingsResponse = await fetch(
          `/api/settings?familyId=${createdFamilyId}`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              familyName: familyName,
              securityPin: systemPin,
            }),
          }
        );

        if (!settingsResponse.ok) {
          if (settingsResponse.status === 403) {
            const { isExpirationError } = await handleExpirationError(
              settingsResponse,
              showToast,
              "salvando configurações de segurança"
            );
            if (isExpirationError) {
              return;
            }
          }
          throw new Error("Falha ao salvar o PIN de segurança");
        }
      } else {
        for (const caretaker of caretakers) {
          const caretakerResponse = await fetch("/api/caretaker", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              ...caretaker,
              familyId: createdFamilyId,
            }),
          });

          if (!caretakerResponse.ok) {
            if (caretakerResponse.status === 403) {
              const { isExpirationError } = await handleExpirationError(
                caretakerResponse,
                showToast,
                "adicionando cuidadores"
              );
              if (isExpirationError) {
                return;
              }
            }
            throw new Error(`Falha em salvar o zelador: ${caretaker.name}`);
          }
        }

        const settingsResponse = await fetch(
          `/api/settings?familyId=${createdFamilyId}`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              familyName: familyName,
            }),
          }
        );

        if (!settingsResponse.ok) {
          if (settingsResponse.status === 403) {
            const { isExpirationError } = await handleExpirationError(
              settingsResponse,
              showToast,
              "salvando configurações de segurança"
            );
            if (isExpirationError) {
              return;
            }
          }
          throw new Error(
            "Não foi possível atualizar o sobrenome nas configurações."
          );
        }
      }

      const babyResponse = await fetch("/api/baby/create", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          firstName: babyFirstName,
          lastName: babyLastName,
          birthDate: babyBirthDate.toISOString(),
          gender: babyGender,
          feedWarningTime,
          diaperWarningTime,
          familyId: createdFamilyId,
        }),
      });

      if (!babyResponse.ok) {
        if (babyResponse.status === 403) {
          const { isExpirationError } = await handleExpirationError(
            babyResponse,
            showToast,
            "adicionando informações sobre bebês"
          );
          if (isExpirationError) {
            return;
          }
        }
        throw new Error("Falha ao salvar as informações do bebê");
      }

      onFamilyChange();
      onClose();
    } catch (error) {
      console.error("Error creating family:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a família. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar família" : "Adicionar nova família"}
      description={
        isEditing
          ? "Editar informações da família"
          : "Crie uma nova família escolhendo o método de configuração que preferir."
      }
    >
      <FormPageContent>
        <div className="space-y-6">
          {!isEditing && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 family-form-heading">
                Método de configuração
              </h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="manual"
                    checked={setupMode === "manual"}
                    onChange={() => setSetupMode("manual")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="manual"
                    className="text-sm font-medium text-gray-700 family-form-radio-label"
                  >
                    Adicionar família manualmente (concluir configuração agora)
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="token"
                    checked={setupMode === "token"}
                    onChange={() => setSetupMode("token")}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="token"
                    className="text-sm font-medium text-gray-700 family-form-radio-label"
                  >
                    Gerar convite de configuração (permitir que a família
                    complete sua própria configuração)
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-500 family-form-text-muted">
                {setupMode === "manual"
                  ? "Agora você vai configurar todos os detalhes da família, a segurança e adicionar o primeiro bebê."
                  : "Você criará um link de convite seguro que a família poderá usar para configurar seu próprio nome, PIN, responsáveis ​​e informações do bebê."}
              </p>
            </div>
          )}

          {!isEditing && setupMode === "token" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 family-form-heading">
                Gerar convite de configuração
              </h3>

              <p className="text-sm text-gray-600 family-form-text-secondary">
                Crie um link de convite para configuração que as famílias possam
                usar para configurar o seu próprio:
              </p>
              <ul className="text-sm text-gray-600 family-form-text-secondary list-disc list-inside ml-4 space-y-1">
                <li>Nome de família e URL</li>
                <li>PIN de segurança ou contas individuais de cuidadores</li>
                <li>Informações do bebê</li>
              </ul>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                    Senha de configuração
                  </Label>
                  <Input
                    type="password"
                    value={tokenPassword}
                    onChange={(e) => setTokenPassword(e.target.value)}
                    placeholder="Digite a senha para acessar a configuração."
                    disabled={loading}
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500 family-form-text-muted mt-1">
                    Esta senha será necessária para acessar a configuração.
                    Convite
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                    Confirme sua senha
                  </Label>
                  <Input
                    type="password"
                    value={confirmTokenPassword}
                    onChange={(e) => setConfirmTokenPassword(e.target.value)}
                    placeholder="Confirme a senha de configuração"
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </div>

              {generatedToken && (
                <div className="space-y-4 p-4 bg-green-50 family-form-success-bg border border-green-200 family-form-success-border rounded-lg">
                  <h4 className="text-md font-semibold text-green-800 family-form-success-heading">
                    Convite de configuração gerado!
                  </h4>
                  <p className="text-sm text-green-700 family-form-success-text">
                    Compartilhe este link com a família para que eles possam
                    concluir a configuração:
                  </p>
                  <div className="flex items-center gap-2">
                    <ShareButton
                      familySlug={generatedToken.replace(/^\//, "")}
                      familyName="Family Setup Invitation"
                      appConfig={appConfig || undefined}
                      urlSuffix=""
                      variant="outline"
                      size="sm"
                      showText={true}
                    />
                  </div>
                  <p className="text-xs text-green-600 family-form-success-text-muted">
                    Este link de configuração expirará em 7 dias e só poderá ser
                    usado uma vez.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isEditing && setupMode === "manual" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 family-form-heading">
                Informações familiares
              </h3>

              <div>
                <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                  Nome de família
                </Label>
                <Input
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Digite o nome da família"
                  disabled={loading}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                  URL da família
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={familySlug}
                    onChange={(e) =>
                      setFamilySlug(e.target.value.toLowerCase())
                    }
                    onClick={handleSlugFieldClick}
                    placeholder="family-url"
                    className={cn(
                      slugError ? "border-red-500" : "",
                      checkingSlug ? "border-blue-400" : "",
                      !slugError && familySlug && !checkingSlug
                        ? "border-green-500"
                        : ""
                    )}
                    disabled={loading || checkingSlug}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSlug}
                    disabled={loading || checkingSlug}
                  >
                    Gerar
                  </Button>
                </div>
                {slugError && (
                  <p className="text-red-600 text-sm mt-1">{slugError}</p>
                )}
                {checkingSlug && (
                  <p className="text-blue-600 text-sm mt-1">
                    Verificando disponibilidade...
                  </p>
                )}
                {!slugError && familySlug && !checkingSlug && slugValidated && (
                  <p className="text-green-600 text-sm mt-1">
                    O URL está disponível
                  </p>
                )}
                <p className="text-sm text-gray-500 family-form-text-muted mt-1">
                  Seus dados de contato com sua família estarão disponíveis em:
                  /{familySlug || "your-family-url"}
                </p>
              </div>
            </div>
          )}

          {!isEditing && setupMode === "manual" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 family-form-heading">
                Configuração de segurança
              </h3>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="systemPin"
                    checked={useSystemPin}
                    onChange={() => setUseSystemPin(true)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="systemPin"
                    className="text-sm font-medium text-gray-700 family-form-radio-label"
                  >
                    Use o PIN do sistema.
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="caretakers"
                    checked={!useSystemPin}
                    onChange={() => setUseSystemPin(false)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500"
                  />
                  <label
                    htmlFor="caretakers"
                    className="text-sm font-medium text-gray-700 family-form-radio-label"
                  >
                    Adicione cuidadores com PINs individuais.
                  </label>
                </div>
              </div>

              {useSystemPin ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                      PIN do sistema (6 a 10 dígitos)
                    </Label>
                    <Input
                      type="password"
                      value={systemPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) {
                          setSystemPin(value);
                        }
                      }}
                      placeholder="Insira o PIN"
                      disabled={loading}
                      minLength={6}
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                      Confirmar PIN
                    </Label>
                    <Input
                      type="password"
                      value={confirmSystemPin}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        if (value.length <= 10) {
                          setConfirmSystemPin(value);
                        }
                      }}
                      placeholder="Confirmar PIN"
                      disabled={loading}
                      minLength={6}
                      maxLength={10}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-4 p-4 border border-gray-200 family-form-border rounded-lg">
                    <h4 className="text-md font-semibold text-gray-800 family-form-heading">
                      Adicionar zelador
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                          ID de login (2 dígitos)
                        </Label>
                        <Input
                          value={newCaretaker.loginId}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 2) {
                              setNewCaretaker({
                                ...newCaretaker,
                                loginId: value,
                              });
                            }
                          }}
                          placeholder="Exemplo: 01, 12, 99"
                          disabled={loading}
                          maxLength={2}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                          Função
                        </Label>
                        <Select
                          value={newCaretaker.role}
                          onValueChange={(value) =>
                            setNewCaretaker({
                              ...newCaretaker,
                              role: value as "ADMIN" | "USER",
                            })
                          }
                          disabled={loading || caretakers.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Administrador</SelectItem>
                            <SelectItem value="USER">Usuário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                        Nome
                      </Label>
                      <Input
                        value={newCaretaker.name}
                        onChange={(e) =>
                          setNewCaretaker({
                            ...newCaretaker,
                            name: e.target.value,
                          })
                        }
                        placeholder="Nome completo"
                        disabled={loading}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                          Tipo (Opcional)
                        </Label>
                        <Input
                          value={newCaretaker.type}
                          onChange={(e) =>
                            setNewCaretaker({
                              ...newCaretaker,
                              type: e.target.value,
                            })
                          }
                          placeholder="Pai/Mãe, Babá, etc."
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                          PIN (6-10 digits)
                        </Label>
                        <Input
                          type="password"
                          value={newCaretaker.securityPin}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 10) {
                              setNewCaretaker({
                                ...newCaretaker,
                                securityPin: value,
                              });
                            }
                          }}
                          placeholder="PIN"
                          disabled={loading}
                          minLength={6}
                          maxLength={10}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={addCaretaker}
                      disabled={loading}
                      className="w-full"
                    >
                      Adicionar zelador
                    </Button>
                  </div>

                  {caretakers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-md font-semibold text-gray-800 family-form-heading">
                        Zeladores
                      </h4>
                      <ul className="space-y-2">
                        {caretakers.map((caretaker, index) => (
                          <li
                            key={index}
                            className="flex justify-between items-center bg-gray-50 family-form-caretaker-item p-2 rounded"
                          >
                            <div>
                              <span className="font-medium">
                                {caretaker.name}
                              </span>
                              <span className="text-xs text-gray-500 family-form-caretaker-text-muted ml-2">
                                ({caretaker.loginId}) - {caretaker.role}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCaretaker(index)}
                              disabled={loading}
                            >
                              Remover
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!isEditing && setupMode === "manual" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 family-form-heading">
                Informações sobre o bebê
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                    Primeiro nome
                  </Label>
                  <Input
                    value={babyFirstName}
                    onChange={(e) => setBabyFirstName(e.target.value)}
                    placeholder="Primeiro nome"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                    Sobrenome
                  </Label>
                  <Input
                    value={babyLastName}
                    onChange={(e) => setBabyLastName(e.target.value)}
                    placeholder="Sobrenome"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                  Data de nascimento
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="input"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !babyBirthDate && "text-gray-400"
                      )}
                      disabled={loading}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {babyBirthDate
                        ? format(babyBirthDate, "PPP")
                        : "Selecione a data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-200" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={babyBirthDate || undefined}
                      onSelect={(date: Date | undefined) => {
                        if (date) setBabyBirthDate(date);
                      }}
                      maxDate={new Date()}
                      initialFocus
                      className="rounded-md border"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                  Gênero
                </Label>
                <Select
                  value={babyGender}
                  onValueChange={(value) => setBabyGender(value as Gender)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o sexo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Masculino</SelectItem>
                    <SelectItem value="FEMALE">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                    Tempo de aviso de feed
                  </Label>
                  <Input
                    type="text"
                    pattern="[0-9]{2}:[0-9]{2}"
                    value={feedWarningTime}
                    onChange={(e) => setFeedWarningTime(e.target.value)}
                    placeholder="02:00"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 family-form-text-muted mt-1">
                    Formato: hh:mm
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 family-form-text mb-1">
                    Tempo de aviso de fralda
                  </Label>
                  <Input
                    type="text"
                    pattern="[0-9]{2}:[0-9]{2}"
                    value={diaperWarningTime}
                    onChange={(e) => setDiaperWarningTime(e.target.value)}
                    placeholder="03:00"
                    disabled={loading}
                  />
                  <p className="text-xs text-gray-500 family-form-text-muted mt-1">
                    Formato: hh:mm
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 family-form-error-bg border border-red-200 family-form-error-border rounded text-red-600 family-form-error-text text-sm">
              {error}
            </div>
          )}
        </div>
      </FormPageContent>

      <FormPageFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        {!isEditing && setupMode === "token" ? (
          <Button
            onClick={handleGenerateToken}
            disabled={
              loading ||
              !tokenPassword ||
              !confirmTokenPassword ||
              tokenPassword !== confirmTokenPassword
            }
          >
            {loading ? "Gerando..." : "Gerar convite de configuração"}
          </Button>
        ) : (
          <Button
            onClick={handleManualSave}
            disabled={loading || !familyName || !familySlug || !!slugError}
          >
            {loading ? "Salvando..." : "Salvar família"}
          </Button>
        )}
      </FormPageFooter>
    </FormPage>
  );
}
