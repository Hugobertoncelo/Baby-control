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
import { SleepType, SleepQuality } from "@prisma/client";
import { SleepLogResponse } from "@/app/api/types";

interface SleepModalProps {
  open: boolean;
  onClose: () => void;
  isSleeping: boolean;
  onSleepToggle: () => void;
  babyId: string | undefined;
  initialTime: string;
  activity?: SleepLogResponse;
  /**
   * Optional variant to control the modal styling
   */
  variant?: "sleep" | "default";
}

export default function SleepModal({
  open,
  onClose,
  isSleeping,
  onSleepToggle,
  babyId,
  initialTime,
  activity,
  variant = "default",
}: SleepModalProps) {
  const [formData, setFormData] = useState({
    startTime: initialTime,
    endTime: "",
    type: "" as SleepType | "",
    location: "",
    quality: "" as SleepQuality | "",
  });

  // Format date string to be compatible with datetime-local input
  const formatDateForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";

    // Format as YYYY-MM-DDThh:mm in local time
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
        // Editing mode - populate with activity data
        setFormData({
          startTime: formatDateForInput(initialTime),
          endTime: activity.endTime ? formatDateForInput(activity.endTime) : "",
          type: activity.type,
          location: activity.location || "",
          quality: activity.quality || "",
        });
      } else if (isSleeping && babyId) {
        // Ending sleep mode - fetch current sleep
        const fetchCurrentSleep = async () => {
          try {
            const response = await fetch(`/api/sleep-log?babyId=${babyId}`);
            if (!response.ok) return;

            const data = await response.json();
            if (!data.success) return;

            // Find the most recent sleep record without an end time
            const currentSleep = data.data.find(
              (log: SleepLogResponse) => !log.endTime
            );
            if (currentSleep) {
              setFormData((prev) => ({
                ...prev,
                startTime: formatDateForInput(currentSleep.startTime),
                endTime: formatDateForInput(initialTime),
                type: currentSleep.type,
                location: currentSleep.location || "",
                quality: "GOOD", // Default to GOOD when ending sleep
              }));
              return;
            }
          } catch (error) {
            console.error("Error fetching current sleep:", error);
          }
        };
        fetchCurrentSleep();
      } else {
        // Starting new sleep
        setFormData((prev) => ({
          ...prev,
          startTime: formatDateForInput(initialTime),
          endTime: isSleeping ? formatDateForInput(initialTime) : "",
          type: prev.type || "NAP", // Default to NAP if not set
          location: prev.location,
          quality: isSleeping ? "GOOD" : prev.quality,
        }));
      }
    } else {
      // Reset form when modal closes
      setFormData({
        startTime: initialTime,
        endTime: "",
        type: "" as SleepType | "",
        location: "",
        quality: "" as SleepQuality | "",
      });
    }
  }, [open, initialTime, isSleeping, babyId, activity?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyId) return;

    // Validate required fields
    if (
      !formData.type ||
      !formData.startTime ||
      (isSleeping && !formData.endTime)
    ) {
      console.error("Required fields missing");
      return;
    }

    try {
      const startTime = formData.startTime;
      const endTime = formData.endTime || null;
      const duration = endTime
        ? Math.round(
            (new Date(endTime).getTime() - new Date(startTime).getTime()) /
              60000
          )
        : null;

      let response;

      if (activity) {
        // Editing mode - update existing record
        const payload = {
          startTime,
          endTime,
          duration,
          type: formData.type,
          location: formData.location || null,
          quality: formData.quality || null,
        };

        response = await fetch(`/api/sleep-log?id=${activity.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else if (isSleeping) {
        // Ending sleep - update existing record
        const sleepResponse = await fetch(`/api/sleep-log?babyId=${babyId}`);
        if (!sleepResponse.ok) throw new Error("Failed to fetch sleep logs");
        const sleepData = await sleepResponse.json();
        if (!sleepData.success) throw new Error("Failed to fetch sleep logs");

        const currentSleep = sleepData.data.find(
          (log: SleepLogResponse) => !log.endTime
        );
        if (!currentSleep) throw new Error("No ongoing sleep record found");

        response = await fetch(`/api/sleep-log?id=${currentSleep.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endTime,
            duration,
            quality: formData.quality || null,
          }),
        });
      } else {
        // Starting new sleep
        const payload = {
          babyId,
          startTime,
          endTime: null,
          duration: null,
          type: formData.type,
          location: formData.location || null,
          quality: null,
        };

        response = await fetch("/api/sleep-log", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        throw new Error("Failed to save sleep log");
      }

      onClose();
      if (!activity) onSleepToggle(); // Only toggle sleep state when not editing

      // Reset form data
      setFormData({
        startTime: initialTime,
        endTime: "",
        type: "" as SleepType | "",
        location: "",
        quality: "" as SleepQuality | "",
      });
    } catch (error) {
      console.error("Error saving sleep log:", error);
    }
  };

  const isEditMode = !!activity;
  const title = isEditMode
    ? "Editar Registro de Sono"
    : isSleeping
    ? "Encerrar Sessão de Sono"
    : "Iniciar Sessão de Sono";
  const description = isEditMode
    ? "Atualize os detalhes do registro de sono"
    : isSleeping
    ? "Registre quando seu bebê acordou e como ele dormiu"
    : "Registre quando seu bebê vai dormir";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="dialog-content !p-4 sm:!p-6">
        <DialogHeader className="dialog-header">
          <DialogTitle className="dialog-title">{title}</DialogTitle>
          <DialogDescription className="dialog-description">
            {description}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Hora de Início</label>
              <Input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData({ ...formData, startTime: e.target.value })
                }
                className="w-full"
                required
                tabIndex={-1}
                disabled={isSleeping && !isEditMode} // Only disabled when ending sleep and not editing
              />
            </div>
            {(isSleeping || isEditMode) && (
              <div>
                <label className="form-label">Hora de Término</label>
                <Input
                  type="datetime-local"
                  value={formData.endTime || initialTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  className="w-full"
                  required={isSleeping}
                  tabIndex={-1}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Tipo</label>
              <Select
                value={formData.type}
                onValueChange={(value: SleepType) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={isSleeping && !isEditMode} // Only disabled when ending sleep and not editing
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NAP">Soneca</SelectItem>
                  <SelectItem value="NIGHT_SLEEP">Sono Noturno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="form-label">Local</label>
              <Select
                value={formData.location}
                onValueChange={(value: string) =>
                  setFormData({ ...formData, location: value })
                }
                disabled={isSleeping && !isEditMode} // Only disabled when ending sleep and not editing
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Crib">Berço</SelectItem>
                  <SelectItem value="Car Seat">Cadeirinha de Carro</SelectItem>
                  <SelectItem value="Parents Room">Quarto dos Pais</SelectItem>
                  <SelectItem value="Contact">Contato</SelectItem>
                  <SelectItem value="Other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(isSleeping || (isEditMode && formData.endTime)) && (
            <div>
              <label className="form-label">Qualidade do Sono</label>
              <Select
                value={formData.quality}
                onValueChange={(value: SleepQuality) =>
                  setFormData({ ...formData, quality: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Como foi o sono?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POOR">Ruim</SelectItem>
                  <SelectItem value="FAIR">Regular</SelectItem>
                  <SelectItem value="GOOD">Bom</SelectItem>
                  <SelectItem value="EXCELLENT">Excelente</SelectItem>
                </SelectContent>
              </Select>
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
              {isEditMode
                ? "Atualizar Sono"
                : isSleeping
                ? "Encerrar Sono"
                : "Iniciar Sono"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
