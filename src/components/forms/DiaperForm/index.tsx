"use client";

import React, { useState, useEffect } from "react";
import { DiaperType } from "@prisma/client";
import { DiaperLogResponse } from "@/app/api/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import { Checkbox } from "@/src/components/ui/checkbox";
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
import { useTimezone } from "@/app/context/timezone";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";
import { useParams } from "next/navigation";

interface DiaperFormProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  activity?: DiaperLogResponse;
  onSuccess?: () => void;
}

export default function DiaperForm({
  isOpen,
  onClose,
  babyId,
  initialTime,
  activity,
  onSuccess,
}: DiaperFormProps) {
  const { toUTCString } = useTimezone();
  const { showToast } = useToast();
  const params = useParams();
  const familySlug = params?.slug as string;

  const [selectedDateTime, setSelectedDateTime] = useState<Date>(() => {
    try {
      const date = new Date(initialTime);
      if (isNaN(date.getTime())) {
        return new Date();
      }
      return date;
    } catch (error) {
      console.error("Error parsing initialTime:", error);
      return new Date();
    }
  });
  const [formData, setFormData] = useState({
    time: initialTime,
    type: "" as DiaperType | "",
    condition: "",
    color: "",
    blowout: false,
  });
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializedTime, setInitializedTime] = useState<string | null>(null);

  const handleDateTimeChange = (date: Date) => {
    setSelectedDateTime(date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData((prev) => ({ ...prev, time: formattedTime }));
  };

  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (activity) {
        try {
          const activityDate = new Date(activity.time);
          if (!isNaN(activityDate.getTime())) {
            setSelectedDateTime(activityDate);
          }
        } catch (error) {
          console.error("Error parsing activity time:", error);
        }

        const date = new Date(activity.time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        setFormData({
          time: formattedTime,
          type: activity.type,
          condition: activity.condition || "",
          color: activity.color || "",
          blowout: activity.blowout || false,
        });

        setInitializedTime(activity.time);
      } else {
        try {
          const date = new Date(initialTime);
          if (!isNaN(date.getTime())) {
            setSelectedDateTime(date);

            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            const hours = String(date.getHours()).padStart(2, "0");
            const minutes = String(date.getMinutes()).padStart(2, "0");
            const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;

            setFormData((prev) => ({ ...prev, time: formattedTime }));
          }
        } catch (error) {
          console.error("Error parsing initialTime:", error);
        }

        setInitializedTime(initialTime);
      }

      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
      setInitializedTime(null);
    }
  }, [isOpen, activity, initialTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyId) return;

    if (!formData.type) {
      console.error("Required fields missing: type");
      return;
    }

    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      console.error("Required fields missing: valid date time");
      return;
    }

    setLoading(true);

    try {
      const utcTimeString = toUTCString(selectedDateTime);

      console.log("Original time (local):", formData.time);
      console.log("Converted time (UTC):", utcTimeString);

      const payload = {
        babyId,
        time: utcTimeString,
        type: formData.type,
        condition: formData.condition || null,
        color: formData.color || null,
        blowout: formData.blowout,
      };

      const authToken = localStorage.getItem("authToken");

      const response = await fetch(
        `/api/diaper-log${activity ? `?id=${activity.id}` : ""}`,
        {
          method: activity ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: authToken ? `Bearer ${authToken}` : "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError } = await handleExpirationError(
            response,
            showToast,
            "rastreando trocas de fraldas"
          );
          if (isExpirationError) {
            return;
          }
        }

        throw new Error("Failed to save diaper log");
      }

      onClose();
      onSuccess?.();

      setSelectedDateTime(new Date(initialTime));
      setFormData({
        time: initialTime,
        type: "" as DiaperType | "",
        condition: "",
        color: "",
        blowout: false,
      });
    } catch (error) {
      console.error("Error saving diaper log:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={activity ? "Editar troca de fralda" : "Registrar troca de fralda"}
      description={
        activity
          ? "Atualize os detalhes sobre a troca de fraldas do seu bebê."
          : "Anote os detalhes da troca de fraldas do seu bebê."
      }
    >
      <FormPageContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Horário</label>
              <DateTimePicker
                value={selectedDateTime}
                onChange={handleDateTimeChange}
                disabled={loading}
                placeholder="Select diaper change time..."
              />
            </div>

            <div>
              <label className="form-label">Tipo</label>
              <Select
                value={formData.type || ""}
                onValueChange={(value: DiaperType) =>
                  setFormData({ ...formData, type: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WET">Molhada</SelectItem>
                  <SelectItem value="DIRTY">Suja</SelectItem>
                  <SelectItem value="BOTH">Molhado e Sujo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Blowout/Leakage checkbox - visible for all diaper types */}
            {formData.type && (
              <div className="flex items-center space-x-3">
                <Checkbox
                  checked={formData.blowout}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, blowout: checked })
                  }
                  disabled={loading}
                />
                <label className="form-label text-sm">Estouro/Vazamento</label>
              </div>
            )}

            {formData.type && formData.type !== "WET" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Condição</label>
                  <Select
                    value={formData.condition}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, condition: value })
                    }
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a condição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="LOOSE">Solta</SelectItem>
                      <SelectItem value="FIRM">Empresa</SelectItem>
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
                    disabled={loading}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a cor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="YELLOW">Amarelo</SelectItem>
                      <SelectItem value="BROWN">Marrom</SelectItem>
                      <SelectItem value="GREEN">Verde</SelectItem>
                      <SelectItem value="BLACK">Preto</SelectItem>
                      <SelectItem value="RED">Vermelho</SelectItem>
                      <SelectItem value="OTHER">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        </form>
      </FormPageContent>
      <FormPageFooter>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {activity ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
}
