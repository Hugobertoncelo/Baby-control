"use client";

import React, { useState, useEffect } from "react";
import { MilestoneCategory } from "@prisma/client";
import { MilestoneResponse } from "@/app/api/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
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
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";

interface MilestoneFormProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  activity?: MilestoneResponse;
  onSuccess?: () => void;
}

export default function MilestoneForm({
  isOpen,
  onClose,
  babyId,
  initialTime,
  activity,
  onSuccess,
}: MilestoneFormProps) {
  const { toUTCString } = useTimezone();
  const { showToast } = useToast();
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
    date: initialTime,
    title: "",
    description: "",
    category: "" as MilestoneCategory | "",
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
    setFormData((prev) => ({ ...prev, date: formattedTime }));
  };

  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (activity) {
        try {
          const activityDate = new Date(activity.date);
          if (!isNaN(activityDate.getTime())) {
            setSelectedDateTime(activityDate);
          }
        } catch (error) {
          console.error("Error parsing activity date:", error);
        }

        const date = new Date(activity.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        setFormData({
          date: formattedTime,
          title: activity.title,
          description: activity.description || "",
          category: activity.category,
        });
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

            setFormData((prev) => ({ ...prev, date: formattedTime }));
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

    if (!formData.title || !formData.category) {
      console.error("Required fields missing: title or category");
      return;
    }

    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      console.error("Required fields missing: valid date time");
      return;
    }

    setLoading(true);

    try {
      const utcDateString = toUTCString(selectedDateTime);

      const payload = {
        babyId,
        date: utcDateString,
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
      };

      const authToken = localStorage.getItem("authToken");

      const response = await fetch(
        `/api/milestone-log${activity ? `?id=${activity.id}` : ""}`,
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
          const { isExpirationError, errorData } = await handleExpirationError(
            response,
            showToast,
            "marcos de registro"
          );
          if (isExpirationError) {
            return;
          }
          if (errorData) {
            showToast({
              variant: "error",
              title: "Erro",
              message: errorData.error || "Falha ao salvar o marco",
              duration: 5000,
            });
            throw new Error(errorData.error || "Falha ao salvar o marco");
          }
        }

        const errorData = await response.json();
        showToast({
          variant: "error",
          title: "Erro",
          message: errorData.error || "Falha ao salvar o marco",
          duration: 5000,
        });
        throw new Error(errorData.error || "Falha ao salvar o marco");
      }

      onClose();
      onSuccess?.();

      setSelectedDateTime(new Date(initialTime));
      setFormData({
        date: initialTime,
        title: "",
        description: "",
        category: "" as MilestoneCategory | "",
      });
    } catch (error) {
      console.error("Error saving milestone:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMilestoneCategoryLabel = (category: MilestoneCategory): string => {
    switch (category) {
      case "MOTOR":
        return "Habilidades motoras";
      case "COGNITIVE":
        return "Desenvolvimento Cognitivo";
      case "SOCIAL":
        return "Social e Emocional";
      case "LANGUAGE":
        return "Linguagem e Comunicação";
      case "CUSTOM":
        return "Personalizado";
      default:
        return category;
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={activity ? "Editar marco" : "Marco de registro"}
      description={
        activity
          ? "Atualize os dados sobre o seu bebê.'s marco"
          : "Registre um novo marco para seu bebê"
      }
    >
      <FormPageContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="form-label">Data e hora</label>
              <DateTimePicker
                value={selectedDateTime}
                onChange={handleDateTimeChange}
                disabled={loading}
                placeholder="Selecione o tempo do marco..."
              />
            </div>

            <div>
              <label className="form-label">Categoria</label>
              <Select
                value={formData.category || ""}
                onValueChange={(value: MilestoneCategory) =>
                  setFormData({ ...formData, category: value })
                }
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MOTOR">Habilidades motoras</SelectItem>
                  <SelectItem value="COGNITIVE">
                    Desenvolvimento Cognitivo
                  </SelectItem>
                  <SelectItem value="SOCIAL">Social e Emocional</SelectItem>
                  <SelectItem value="LANGUAGE">
                    Linguagem e Comunicação
                  </SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="form-label">Título</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full"
                placeholder="Insira o título do marco (por exemplo, Primeiros Passos, Primeira Palavra)"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="form-label">Descrição (Opcional)</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full"
                placeholder="Adicione quaisquer detalhes adicionais sobre este marco."
                disabled={loading}
              />
            </div>
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
