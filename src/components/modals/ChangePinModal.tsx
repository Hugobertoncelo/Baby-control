"use client";

import { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

interface ChangePinModalProps {
  open: boolean;
  onClose: () => void;
  currentPin: string;
  onPinChange: (newPin: string) => void;
}

export default function ChangePinModal({
  open,
  onClose,
  currentPin,
  onPinChange,
}: ChangePinModalProps) {
  const [step, setStep] = useState<"verify" | "new" | "confirm">("verify");
  const [verifyPin, setVerifyPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [hasCaretakers, setHasCaretakers] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      const checkCaretakers = async () => {
        try {
          setLoading(true);
          const response = await fetch("/api/caretaker");
          if (response.ok) {
            const data = await response.json();
            const hasActiveCaretakers =
              data.success && Array.isArray(data.data) && data.data.length > 0;
            setHasCaretakers(hasActiveCaretakers);

            if (hasActiveCaretakers) {
              setError(
                "A alteração do PIN do sistema é desativada quando há responsáveis ​​pelo sistema. Use a autenticação de responsável."
              );
            }
          }
        } catch (error) {
          console.error("Error checking caretakers:", error);
        } finally {
          setLoading(false);
        }
      };

      checkCaretakers();
    }
  }, [open]);

  const handleVerifyPin = () => {
    if (hasCaretakers) {
      setError(
        "A alteração do PIN do sistema é desativada quando há responsáveis ​​pelo sistema. Use a autenticação de responsável."
      );
      return;
    }

    if (verifyPin === currentPin) {
      setStep("new");
      setError("");
    } else {
      setError("PIN incorreto");
      setVerifyPin("");
    }
  };

  const handleNewPin = () => {
    if (hasCaretakers) {
      setError(
        "A alteração do PIN do sistema é desativada quando há responsáveis ​​pelo sistema. Use a autenticação de responsável."
      );
      return;
    }

    if (newPin.length < 6) {
      setError("O PIN deve ter pelo menos 6 dígitos.");
      return;
    }
    if (newPin.length > 10) {
      setError("O PIN não pode ter mais de 10 dígitos.");
      return;
    }
    setStep("confirm");
    setError("");
  };

  const handleConfirmPin = () => {
    if (hasCaretakers) {
      setError(
        "A alteração do PIN do sistema é desativada quando há responsáveis ​​pelo sistema. Use a autenticação de responsável."
      );
      return;
    }

    if (newPin === confirmPin) {
      onPinChange(newPin);
      handleClose();
    } else {
      setError("Os PINs não coincidem.");
      setConfirmPin("");
    }
  };

  const handleClose = () => {
    setStep("verify");
    setVerifyPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "verify" && "Verifique o PIN atual"}
            {step === "new" && "Insira o novo PIN"}
            {step === "confirm" && "Confirmar novo PIN"}
          </DialogTitle>
          <DialogDescription>
            {step === "verify" &&
              "Por favor, insira seu PIN atual para continuar."}
            {step === "new" && "Digite um novo PIN com 6 a 10 dígitos."}
            {step === "confirm" &&
              "Digite seu novo PIN novamente para confirmar."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "verify" && (
            <div className="space-y-2">
              <Label>PIN atual</Label>
              <Input
                type="password"
                value={verifyPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setVerifyPin(value);
                  if (!hasCaretakers) {
                    setError("");
                  }
                }}
                placeholder="Insira o PIN atual"
                pattern="\d*"
                disabled={hasCaretakers || loading}
              />
            </div>
          )}

          {step === "new" && (
            <div className="space-y-2">
              <Label>Novo PIN</Label>
              <Input
                type="password"
                value={newPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setNewPin(value);
                    if (!hasCaretakers) {
                      setError("");
                    }
                  }
                }}
                placeholder="Insira o novo PIN"
                minLength={6}
                maxLength={10}
                pattern="\d*"
                disabled={hasCaretakers}
              />
              <p className="text-sm text-gray-500">
                O PIN deve ter entre 6 e 10 dígitos.
              </p>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-2">
              <Label>Confirmar PIN</Label>
              <Input
                type="password"
                value={confirmPin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  if (value.length <= 10) {
                    setConfirmPin(value);
                    if (!hasCaretakers) {
                      setError("");
                    }
                  }
                }}
                placeholder="Confirme o novo PIN"
                minLength={6}
                maxLength={10}
                pattern="\d*"
                disabled={hasCaretakers}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (step === "verify") handleVerifyPin();
                else if (step === "new") handleNewPin();
                else if (step === "confirm") handleConfirmPin();
              }}
              disabled={hasCaretakers || loading}
            >
              {step === "verify" && "Verificar"}
              {step === "new" && "Próximo"}
              {step === "confirm" && "Alterar PIN"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
