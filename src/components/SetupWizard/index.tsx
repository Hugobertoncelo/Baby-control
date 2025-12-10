"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { styles } from "./setup-wizard.styles";
import { SetupWizardProps } from "./setup-wizard.types";
import FamilySetupStage from "./FamilySetupStage";
import SecuritySetupStage from "./SecuritySetupStage";
import BabySetupStage from "./BabySetupStage";
import { Gender } from "@prisma/client";
import "./setup-wizard.css";

const SetupWizard: React.FC<SetupWizardProps> = ({
  onComplete,
  token,
  initialSetup = false,
}) => {
  const [stage, setStage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [familyName, setFamilyName] = useState("");
  const [familySlug, setFamilySlug] = useState("");
  const [createdFamily, setCreatedFamily] = useState<{
    id: string;
    name: string;
    slug: string;
  } | null>(null);

  const [useSystemPin, setUseSystemPin] = useState(true);
  const [systemPin, setSystemPin] = useState("");
  const [confirmSystemPin, setConfirmSystemPin] = useState("");
  const [caretakers, setCaretakers] = useState<
    Array<{
      loginId: string;
      name: string;
      type: string;
      role: "ADMIN" | "USER";
      securityPin: string;
    }>
  >([]);
  const [newCaretaker, setNewCaretaker] = useState({
    loginId: "",
    name: "",
    type: "",
    role: "ADMIN" as "ADMIN" | "USER",
    securityPin: "",
  });

  const [babyFirstName, setBabyFirstName] = useState("");
  const [babyLastName, setBabyLastName] = useState("");
  const [babyBirthDate, setBabyBirthDate] = useState<Date | null>(null);
  const [babyGender, setBabyGender] = useState<Gender | "">("");
  const [feedWarningTime, setFeedWarningTime] = useState("02:00");
  const [diaperWarningTime, setDiaperWarningTime] = useState("03:00");

  const [error, setError] = useState("");

  const getAuthHeaders = () => {
    const authToken = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };
  };

  const isAccountAuth = () => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) return false;

    try {
      const base64Url = authToken.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const decoded = JSON.parse(jsonPayload);
      return decoded.isAccountAuth === true;
    } catch (error) {
      console.error("Error checking account auth:", error);
      return false;
    }
  };

  const handleNext = async () => {
    setError("");

    if (stage === 1) {
      if (!familyName.trim()) {
        setError("Por favor, insira o nome da família");
        return;
      }

      if (!familySlug.trim()) {
        setError("Por favor, insira a URL da família");
        return;
      }

      const slugPattern = /^[a-z0-9-]+$/;
      if (!slugPattern.test(familySlug)) {
        setError(
          "A URL da família só pode conter letras minúsculas, números e hífens"
        );
        return;
      }

      if (familySlug.length < 3) {
        setError("A URL da família deve ter pelo menos 3 caracteres");
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/setup/start", {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: familyName,
            slug: familySlug,
            token: token,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setCreatedFamily(data.data);
          setStage(2);
        } else {
          setError(data.error || "Falha ao criar família");
        }
      } catch (error) {
        console.error("Error creating family:", error);
        setError("Falha ao criar família. Tente novamente.");
      } finally {
        setLoading(false);
      }
    } else if (stage === 2) {
      if (useSystemPin) {
        if (systemPin.length < 6 || systemPin.length > 10) {
          setError("O PIN deve ter entre 6 e 10 dígitos");
          return;
        }

        if (systemPin !== confirmSystemPin) {
          setError("Os PINs não coincidem");
          return;
        }

        if (token || isAccountAuth()) {
          setStage(3);
          return;
        }

        try {
          setLoading(true);

          const settingsResponse = await fetch(
            `/api/settings?familyId=${createdFamily?.id}`,
            {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                securityPin: systemPin,
              }),
            }
          );

          if (!settingsResponse.ok) {
            throw new Error(
              "Não foi possível salvar o PIN de segurança nas configurações."
            );
          }

          const caretakerId = localStorage.getItem("caretakerId");
          if (caretakerId) {
            const caretakerResponse = await fetch("/api/caretaker", {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                id: caretakerId,
                securityPin: systemPin,
              }),
            });

            if (!caretakerResponse.ok) {
              console.warn("Failed to update system caretaker PIN (non-fatal)");
            }
          }

          setStage(3);
        } catch (error) {
          console.error("Error saving security PIN:", error);
          setError("Falha ao salvar o PIN de segurança. Tente novamente.");
        } finally {
          setLoading(false);
        }
      } else {
        if (caretakers.length === 0) {
          setError("Adicione pelo menos um cuidador");
          return;
        }

        if (token || isAccountAuth()) {
          setStage(3);
          return;
        }

        try {
          setLoading(true);
          for (const caretaker of caretakers) {
            const response = await fetch("/api/caretaker", {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                ...caretaker,
                familyId: createdFamily?.id,
              }),
            });

            if (!response.ok) {
              throw new Error(`Falha em salvar o zelador: ${caretaker.name}`);
            }
          }

          setStage(3);
        } catch (error) {
          console.error("Error saving caretakers:", error);
          setError("Falha ao salvar cuidadores. Tente novamente.");
        } finally {
          setLoading(false);
        }
      }
    } else if (stage === 3) {
      if (!babyFirstName.trim()) {
        setError("Por favor, insira o primeiro nome do bebê");
        return;
      }

      if (!babyLastName.trim()) {
        setError("Por favor, insira o sobrenome do bebê");
        return;
      }

      if (!babyBirthDate) {
        setError("Por favor, insira a data de nascimento do bebê");
        return;
      }

      if (!babyGender) {
        setError("Por favor, selecione o gênero do bebê");
        return;
      }

      try {
        setLoading(true);

        if (token || isAccountAuth()) {
          const babyResponse = await fetch("/api/baby", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              firstName: babyFirstName,
              lastName: babyLastName,
              birthDate: new Date(babyBirthDate),
              gender: babyGender,
              feedWarningTime,
              diaperWarningTime,
              familyId: createdFamily?.id,
            }),
          });

          if (!babyResponse.ok) {
            throw new Error("Falha ao salvar informações do bebê");
          }

          if (useSystemPin) {
            const settingsResponse = await fetch(
              `/api/settings?familyId=${createdFamily?.id}`,
              {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  securityPin: systemPin,
                }),
              }
            );

            if (!settingsResponse.ok) {
              throw new Error(
                "Não foi possível salvar o PIN de segurança nas configurações."
              );
            }

            if (isAccountAuth()) {
              try {
                const systemCaretakerResponse = await fetch(
                  `/api/caretaker/system?familyId=${createdFamily?.id}`,
                  {
                    headers: getAuthHeaders(),
                  }
                );

                if (systemCaretakerResponse.ok) {
                  const systemCaretakerData =
                    await systemCaretakerResponse.json();
                  if (
                    systemCaretakerData.success &&
                    systemCaretakerData.data?.id
                  ) {
                    const linkResponse = await fetch(
                      "/api/accounts/link-caretaker",
                      {
                        method: "POST",
                        headers: getAuthHeaders(),
                        body: JSON.stringify({
                          caretakerId: systemCaretakerData.data.id,
                        }),
                      }
                    );
                    if (!linkResponse.ok) {
                    } else {
                    }
                  }
                } else {
                }
              } catch (error) {
                console.error(
                  "Error linking account to system caretaker:",
                  error
                );
              }
            }
          } else {
            let accountCaretakerId: string | null = null;

            for (const caretaker of caretakers) {
              const caretakerResponse = await fetch("/api/caretaker", {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  ...caretaker,
                  familyId: createdFamily?.id,
                }),
              });

              if (!caretakerResponse.ok) {
                throw new Error(`Falha em salvar o zelador: ${caretaker.name}`);
              }

              if (isAccountAuth() && !accountCaretakerId) {
                const caretakerData = await caretakerResponse.json();
                if (caretakerData.success && caretakerData.data?.id) {
                  accountCaretakerId = caretakerData.data.id;
                }
              }
            }

            if (isAccountAuth() && accountCaretakerId) {
              try {
                const linkResponse = await fetch(
                  "/api/accounts/link-caretaker",
                  {
                    method: "POST",
                    headers: getAuthHeaders(),
                    body: JSON.stringify({
                      caretakerId: accountCaretakerId,
                    }),
                  }
                );

                if (!linkResponse.ok) {
                }
              } catch (error) {
                console.error("Error linking caretaker to account:", error);
              }
            }
          }
        } else {
          const babyResponse = await fetch("/api/baby", {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              firstName: babyFirstName,
              lastName: babyLastName,
              birthDate: new Date(babyBirthDate),
              gender: babyGender,
              feedWarningTime,
              diaperWarningTime,
              familyId: createdFamily?.id,
            }),
          });

          if (!babyResponse.ok) {
            throw new Error("Falha ao salvar informações do bebê");
          }
        }

        if (createdFamily) {
          const accountAuth = isAccountAuth();

          console.log("Setup completion - account auth check:", accountAuth);

          if (accountAuth) {
            try {
              const refreshResponse = await fetch("/api/auth/refresh-token", {
                method: "POST",
                headers: getAuthHeaders(),
              });

              if (refreshResponse.ok) {
                const refreshData = await refreshResponse.json();
                if (refreshData.success && refreshData.data?.token) {
                  localStorage.setItem("authToken", refreshData.data.token);
                } else {
                  console.error("Failed to refresh token:", refreshData.error);
                }
              } else {
                console.error(
                  "Token refresh request failed:",
                  refreshResponse.status
                );
              }
            } catch (error) {
              console.error("Error refreshing token:", error);
            }
          } else {
            localStorage.removeItem("authToken");
            localStorage.removeItem("unlockTime");
            localStorage.removeItem("caretakerId");
          }

          onComplete(createdFamily);
        }
      } catch (error) {
        console.error("Error completing setup:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Falha ao concluir a configuração. Tente novamente."
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    if (stage > 1) {
      setStage(stage - 1);
      setError("");
    }
  };

  const addCaretaker = () => {
    if (newCaretaker.loginId.length !== 2) {
      setError("O ID de login deve ter exatamente 2 dígitos");
      return;
    }

    if (!/^\d+$/.test(newCaretaker.loginId)) {
      setError("O ID de login deve conter apenas dígitos");
      return;
    }

    if (newCaretaker.loginId === "00") {
      setError('O ID de login "00" é reservado para uso do sistema');
      return;
    }

    if (caretakers.some((c) => c.loginId === newCaretaker.loginId)) {
      setError("Este ID de login já está em uso");
      return;
    }

    if (!newCaretaker.name.trim()) {
      setError("Por favor, insira o nome do cuidador");
      return;
    }

    if (
      newCaretaker.securityPin.length < 6 ||
      newCaretaker.securityPin.length > 10
    ) {
      setError("O PIN deve ter entre 6 e 10 dígitos");
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

  return (
    <div className={cn(styles.container, "setup-wizard-container")}>
      <div className={cn(styles.formContainer, "setup-wizard-form-container")}>
        <div
          className={cn(
            styles.headerContainer,
            "setup-wizard-header-container"
          )}
        >
          <Image
            src={
              stage === 1
                ? "/SetupFamily-1024.png"
                : stage === 2
                ? "/SetupSecurity-1024.png"
                : "/SetupBaby-1024.png"
            }
            alt={
              stage === 1
                ? "Configuração da Família"
                : stage === 2
                ? "Configuração de Segurança"
                : "Configuração do Bebê"
            }
            width={128}
            height={128}
            className={cn(styles.stageImage, "setup-wizard-stage-image")}
          />
          <h1 className={cn(styles.title, "setup-wizard-title")}>
            Baby Control
          </h1>
          <div className={cn(styles.progressBar, "setup-wizard-progress-bar")}>
            <div
              className={cn(
                styles.progressIndicator,
                "setup-wizard-progress-indicator"
              )}
              style={{ width: `${(stage / 3) * 100}%` }}
            ></div>
          </div>
          <p
            className={cn(styles.stepIndicator, "setup-wizard-step-indicator")}
          >
            Etapa {stage} de 3
          </p>
        </div>

        {stage === 1 && (
          <FamilySetupStage
            familyName={familyName}
            setFamilyName={setFamilyName}
            familySlug={familySlug}
            setFamilySlug={setFamilySlug}
            token={token}
            initialSetup={initialSetup}
          />
        )}

        {stage === 2 && (
          <SecuritySetupStage
            useSystemPin={useSystemPin}
            setUseSystemPin={setUseSystemPin}
            systemPin={systemPin}
            setSystemPin={setSystemPin}
            confirmSystemPin={confirmSystemPin}
            setConfirmSystemPin={setConfirmSystemPin}
            caretakers={caretakers}
            setCaretakers={setCaretakers}
            newCaretaker={newCaretaker}
            setNewCaretaker={setNewCaretaker}
            addCaretaker={addCaretaker}
            removeCaretaker={removeCaretaker}
          />
        )}

        {stage === 3 && (
          <BabySetupStage
            babyFirstName={babyFirstName}
            setBabyFirstName={setBabyFirstName}
            babyLastName={babyLastName}
            setBabyLastName={setBabyLastName}
            babyBirthDate={babyBirthDate}
            setBabyBirthDate={setBabyBirthDate}
            babyGender={babyGender}
            setBabyGender={setBabyGender}
            feedWarningTime={feedWarningTime}
            setFeedWarningTime={setFeedWarningTime}
            diaperWarningTime={diaperWarningTime}
            setDiaperWarningTime={setDiaperWarningTime}
          />
        )}

        {error && (
          <div
            className={cn(
              styles.errorContainer,
              "setup-wizard-error-container"
            )}
          >
            {error}
          </div>
        )}

        <div
          className={cn(
            styles.navigationContainer,
            "setup-wizard-navigation-container"
          )}
        >
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={stage === 1 || loading}
            className={cn(
              styles.previousButton,
              "setup-wizard-previous-button"
            )}
          >
            {stage === 1 ? "Cancelar" : "Anterior"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className={cn(styles.nextButton, "setup-wizard-next-button")}
          >
            {loading
              ? "Processando..."
              : stage === 3
              ? "Concluir Configuração"
              : "Próximo"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
