"use client";

import { Caretaker as PrismaCaretaker, UserRole } from "@prisma/client";
import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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
import { caretakerFormStyles } from "./caretaker-form.styles";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";

interface Caretaker extends PrismaCaretaker {
  loginId: string;
}

interface CaretakerFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  caretaker: (PrismaCaretaker & { loginId?: string }) | null;
  onCaretakerChange?: () => void;
}

const defaultFormData = {
  loginId: "",
  name: "",
  type: "",
  role: "USER" as UserRole,
  inactive: false,
  securityPin: "",
};

export default function CaretakerForm({
  isOpen,
  onClose,
  isEditing,
  caretaker,
  onCaretakerChange,
}: CaretakerFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState(defaultFormData);
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isFirstCaretaker, setIsFirstCaretaker] = useState(false);
  const [existingCaretakers, setExistingCaretakers] = useState<string[]>([]);
  const [loginIdError, setLoginIdError] = useState("");

  useEffect(() => {
    if (caretaker && isOpen && !isSubmitting) {
      setFormData({
        loginId: caretaker.loginId || "",
        name: caretaker.name,
        type: caretaker.type || "",
        role: caretaker.role || "USER",
        inactive: caretaker.inactive || false,
        securityPin: caretaker.securityPin || "",
      });
      setConfirmPin(caretaker.securityPin || "");
      setIsFirstCaretaker(false);
    } else if (!isOpen && !isSubmitting) {
      setFormData(defaultFormData);
      setConfirmPin("");
      setError("");
      setLoginIdError("");
    }
  }, [caretaker?.id, isOpen, isSubmitting]);
  useEffect(() => {
    if (formData.loginId && formData.loginId.length === 2) {
      if (existingCaretakers.includes(formData.loginId)) {
        setLoginIdError(
          "Este ID de login já está em uso. Por favor, escolha outro."
        );
      } else if (formData.loginId === "00") {
        setLoginIdError(
          'O ID de login "00" está reservado para uso do sistema. Por favor, escolha outro.'
        );
      } else {
        setLoginIdError("");
      }
    } else {
      setLoginIdError("");
    }
  }, [formData.loginId, existingCaretakers]);

  useEffect(() => {
    if (isOpen) {
      const fetchCaretakers = async () => {
        try {
          const token = localStorage.getItem("authToken");

          let isSysAdmin = false;
          let familyId = null;

          if (token) {
            try {
              const payload = token.split(".")[1];
              const decodedPayload = JSON.parse(atob(payload));
              isSysAdmin = decodedPayload.isSysAdmin || false;

              if (isSysAdmin) {
                const familyContext = sessionStorage.getItem(
                  "sysadmin-family-context"
                );
                if (familyContext) {
                  const family = JSON.parse(familyContext);
                  familyId = family.id;
                }
              }
            } catch (error) {
              console.error("Error parsing JWT token:", error);
            }
          }

          let url = "/api/caretaker";
          if (isSysAdmin && familyId) {
            url += `?familyId=${familyId}`;
          }

          const response = await fetch(url, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
            },
          });
          if (response.ok) {
            const data = await response.json();
            const isFirst = !data.data || data.data.length === 0;
            setIsFirstCaretaker(isFirst && !isEditing);

            const existingLoginIds = data.data
              ? data.data
                  .filter((c: any) => !isEditing || c.id !== caretaker?.id)
                  .map((c: any) => c.loginId)
              : [];
            setExistingCaretakers(existingLoginIds);

            if (isFirst && !isEditing) {
              setFormData((prev) => ({ ...prev, role: "ADMIN" }));
            }
          }
        } catch (error) {
          console.error("Error fetching caretakers:", error);
        }
      };

      fetchCaretakers();
    }
  }, [isEditing, isOpen, caretaker?.id]);

  const validatePIN = () => {
    if (formData.securityPin.length < 6) {
      setError("O PIN deve ter pelo menos 6 dígitos.");
      return false;
    }
    if (formData.securityPin.length > 10) {
      setError("O PIN não pode ter mais de 10 dígitos.");
      return false;
    }
    if (formData.securityPin !== confirmPin) {
      setError("Os PINs não coincidem.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.loginId.trim()) {
      setError("O ID de login é obrigatório");
      return;
    }

    if (formData.loginId.length !== 2) {
      setError("O ID de login deve ter exatamente 2 dígitos.");
      return;
    }

    if (!/^\d{2}$/.test(formData.loginId)) {
      setError("O ID de login deve conter apenas dígitos.");
      return;
    }

    if (loginIdError) {
      setError(loginIdError);
      return;
    }

    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!validatePIN()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const token = localStorage.getItem("authToken");

      let isSysAdmin = false;
      let familyId = null;

      if (token) {
        try {
          const payload = token.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));
          isSysAdmin = decodedPayload.isSysAdmin || false;

          if (isSysAdmin) {
            const familyContext = sessionStorage.getItem(
              "sysadmin-family-context"
            );
            if (familyContext) {
              const family = JSON.parse(familyContext);
              familyId = family.id;
            }
          }
        } catch (error) {
          console.error("Error parsing JWT token:", error);
        }
      }

      const requestBody = {
        ...formData,
        id: caretaker?.id,
        ...(isSysAdmin && familyId && { familyId }),
      };

      const response = await fetch("/api/caretaker", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError, errorData } = await handleExpirationError(
            response,
            showToast,
            "gerenciando zeladores"
          );
          if (isExpirationError) {
            setError("");
            return;
          }
          if (errorData) {
            showToast({
              variant: "error",
              title: "Error",
              message: errorData.error || "Não conseguiram salvar o zelador.",
              duration: 5000,
            });
            throw new Error(
              errorData.error || "Não conseguiram salvar o zelador."
            );
          }
        }

        const errorData = await response.json();
        showToast({
          variant: "error",
          title: "Error",
          message: errorData.error || "Não conseguiram salvar o zelador.",
          duration: 5000,
        });
        throw new Error(errorData.error || "Não conseguiram salvar o zelador.");
      }

      if (onCaretakerChange) {
        onCaretakerChange();
      }

      onClose();
    } catch (error) {
      console.error("Error saving caretaker:", error);
      if (
        !(error instanceof Error && error.message.includes("Conta expirada"))
      ) {
        setError(
          error instanceof Error
            ? error.message
            : "Não conseguiram salvar o zelador."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Caretaker" : "Adicionar novo cuidador"}
      description={
        isEditing
          ? "Atualizar informações do cuidador"
          : "Insira as informações do cuidador para adicioná-lo ao sistema."
      }
    >
      <form
        onSubmit={handleSubmit}
        className="h-full flex flex-col overflow-hidden"
      >
        <FormPageContent className={caretakerFormStyles.content}>
          <div>
            <label className="form-label">ID de login</label>
            <Input
              value={formData.loginId}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 2) {
                  setFormData({ ...formData, loginId: value });
                }
              }}
              className={`w-full ${
                loginIdError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                  : ""
              }`}
              placeholder="Digite o ID de 2 dígitos"
              maxLength={2}
              required
              autoComplete="off"
              inputMode="numeric"
              pattern="\d*"
            />
            {loginIdError ? (
              <p className="text-xs text-red-500 mt-1">{loginIdError}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                O ID de login deve ter exatamente 2 dígitos. (atualmente:{" "}
                {formData.loginId.length}/2)
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Nome</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full"
              placeholder="Digite o nome do cuidador"
              required
            />
          </div>
          <div>
            <label className="form-label">Tipo (Opcional)</label>
            <Input
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full"
              placeholder="Pai/Mãe, Avô/Avó, Babá, etc."
            />
          </div>
          <div>
            <label className="form-label">Papel</label>
            <Select
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value as UserRole })
              }
              disabled={isFirstCaretaker}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuário regular</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
            {isFirstCaretaker ? (
              <p className="text-xs text-amber-600 mt-1">
                O primeiro responsável deve ser um administrador para gerenciar
                o sistema.
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">
                Os administradores têm acesso às configurações do sistema e às
                funções administrativas.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="inactive"
              checked={formData.inactive}
              onChange={(e) =>
                setFormData({ ...formData, inactive: e.target.checked })
              }
              className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              disabled={isFirstCaretaker}
            />
            <label htmlFor="inactive" className="form-label mb-0">
              Marcar como inativo
            </label>
          </div>
          {formData.inactive && (
            <p className="text-xs text-amber-600 mt-1">
              Os responsáveis ​​inativos não podem acessar o sistema.
            </p>
          )}
          <div>
            <label className="form-label">PIN de segurança</label>
            <Input
              type="password"
              value={formData.securityPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10) {
                  setFormData({ ...formData, securityPin: value });
                }
              }}
              className="w-full"
              placeholder="Digite um PIN de 6 a 10 dígitos."
              minLength={6}
              maxLength={10}
              pattern="\d*"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              O PIN deve ter entre 6 e 10 dígitos.
            </p>
          </div>
          <div>
            <label className="form-label">Confirmar PIN</label>
            <Input
              type="password"
              value={confirmPin}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 10) {
                  setConfirmPin(value);
                }
              }}
              className="w-full"
              placeholder="Confirmar PIN"
              minLength={6}
              maxLength={10}
              pattern="\d*"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-red-500 font-medium">{error}</div>
          )}
        </FormPageContent>

        <FormPageFooter>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Salvando..."
                : isEditing
                ? "Salvar alterações"
                : "Adicionar zelador"}
            </Button>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
}
