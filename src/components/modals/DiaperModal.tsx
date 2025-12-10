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
import { DiaperType } from "@prisma/client";
import { DiaperLogResponse } from "@/app/api/types";

interface DiaperModalProps {
  open: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  activity?: DiaperLogResponse;

  variant?: "diaper" | "default";
}

export default function DiaperModal({
  open,
  onClose,
  babyId,
  initialTime,
  activity,
  variant = "default",
}: DiaperModalProps) {
  const [formData, setFormData] = useState({
    time: initialTime,
    type: "" as DiaperType | "",
    condition: "",
    color: "",
  });

  const formatDateForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (open) {
      if (activity) {
        setFormData({
          time: formatDateForInput(initialTime),
          type: activity.type,
          condition: activity.condition || "",
          color: activity.color || "",
        });
      } else {
        setFormData((prev) => ({
          ...prev,
          time: formatDateForInput(initialTime),
        }));
      }
    }
  }, [open, initialTime, activity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyId) return;

    if (!formData.type || !formData.time) {
      console.error("Required fields missing");
      return;
    }

    try {
      const payload = {
        babyId,
        time: formData.time,
        type: formData.type,
        condition: formData.condition || null,
        color: formData.color || null,
      };

      const response = await fetch(
        `/api/diaper-log${activity ? `?id=${activity.id}` : ""}`,
        {
          method: activity ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao salvar o registro de fraldas");
      }

      onClose();

      setFormData({
        time: initialTime,
        type: "" as DiaperType | "",
        condition: "",
        color: "",
      });
    } catch (error) {
      console.error("Error saving diaper log:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="dialog-content !p-4 sm:!p-6">
        <DialogHeader className="dialog-header">
          <DialogTitle className="dialog-title">
            {activity ? "Editar Troca de Fralda" : "Registrar Troca de Fralda"}
          </DialogTitle>
          <DialogDescription className="dialog-description">
            {activity
              ? "Atualize os detalhes sobre a troca de fralda do seu bebê"
              : "Registre os detalhes sobre a troca de fralda do seu bebê"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Hora</label>
              <Input
                type="datetime-local"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="w-full"
                required
                tabIndex={-1}
              />
            </div>
            <div>
              <label className="form-label">Tipo</label>
              <Select
                value={formData.type || ""}
                onValueChange={(value: DiaperType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WET">Molhada</SelectItem>
                  <SelectItem value="DIRTY">Suja</SelectItem>
                  <SelectItem value="BOTH">Molhada e Suja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.type && formData.type !== "WET" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Condição</label>
                <Select
                  value={formData.condition}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, condition: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a condição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="LOOSE">Solta</SelectItem>
                    <SelectItem value="FIRM">Firme</SelectItem>
                    <SelectItem value="OTHER">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="form-label">Cor</label>
                <Select
                  value={formData.color}
                  onValueChange={(value: string) =>
                    setFormData({ ...formData, color: value })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a cor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YELLOW">Amarela</SelectItem>
                    <SelectItem value="BROWN">Marrom</SelectItem>
                    <SelectItem value="GREEN">Verde</SelectItem>
                    <SelectItem value="OTHER">Outra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:flex sm:justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="hover:bg-slate-50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700"
            >
              {activity ? "Atualizar Troca" : "Salvar Troca"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
