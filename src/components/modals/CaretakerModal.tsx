import { Caretaker as PrismaCaretaker, UserRole } from "@prisma/client";

interface Caretaker extends PrismaCaretaker {
  loginId: string;
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useState, useEffect } from "react";

interface CaretakerModalProps {
  open: boolean;
  onClose: () => void;
  isEditing: boolean;
  caretaker: (PrismaCaretaker & { loginId?: string }) | null;
}

const defaultFormData = {
  loginId: "",
  name: "",
  type: "",
  role: "USER" as UserRole,
  securityPin: "",
};

export default function CaretakerModal({
  open,
  onClose,
  isEditing,
  caretaker,
}: CaretakerModalProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [confirmPin, setConfirmPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isFirstCaretaker, setIsFirstCaretaker] = useState(false);

  useEffect(() => {
    if (caretaker && open) {
      setFormData({
        loginId: caretaker.loginId || "",
        name: caretaker.name,
        type: caretaker.type || "",
        role: caretaker.role || "USER",
        securityPin: caretaker.securityPin,
      });
      setConfirmPin(caretaker.securityPin);
      setIsFirstCaretaker(false);
    } else if (!open) {
      setFormData(defaultFormData);
      setConfirmPin("");
      setError("");
    }
  }, [caretaker, open]);

  useEffect(() => {
    if (!isEditing && open) {
      const checkFirstCaretaker = async () => {
        try {
          const response = await fetch("/api/caretaker");
          if (response.ok) {
            const data = await response.json();
            const isFirst = !data.data || data.data.length === 0;
            setIsFirstCaretaker(isFirst);

            if (isFirst) {
              setFormData((prev) => ({ ...prev, role: "ADMIN" }));
            }
          }
        } catch (error) {
          console.error("Error checking caretakers:", error);
        }
      };

      checkFirstCaretaker();
    }
  }, [isEditing, open]);

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
      setError("Login ID is required");
      return;
    }

    if (formData.loginId.length !== 2) {
      setError("O ID de login deve ter exatamente 2 caracteres.");
      return;
    }

    if (!formData.name.trim()) {
      setError("O nome é obrigatório");
      return;
    }

    if (!validatePIN()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/caretaker", {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          id: caretaker?.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao salvar o zelador");
      }

      onClose();
    } catch (error) {
      console.error("Erro ao salvar o zelador:", error);
      setError(
        error instanceof Error ? error.message : "Falha ao salvar o zelador"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    setConfirmPin("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="dialog-content p-4 sm:p-6">
        <DialogHeader className="dialog-header">
          <DialogTitle className="dialog-title">
            {isEditing ? "Editar zelador" : "Adicionar novo cuidador"}
          </DialogTitle>
          <DialogDescription className="dialog-description">
            {isEditing
              ? "Atualizar informações do cuidador"
              : "Insira as informações do cuidador para adicioná-lo ao sistema."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">ID de login</label>
            <Input
              value={formData.loginId}
              onChange={(e) => {
                const value = e.target.value;
                setFormData({ ...formData, loginId: value });
              }}
              className="w-full"
              placeholder="Insira o ID de login de 2 dígitos."
              maxLength={2}
              required
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 mt-1">
              O ID de login deve ter exatamente 2 dígitos ou caracteres.
              (atualmente: {formData.loginId.length}/2)
            </p>
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
              placeholder="Pai, avô, avó, babá, etc."
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

          <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="hover:bg-slate-50"
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
