"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Baby, Gender } from "@prisma/client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
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
import { cn } from "@/src/lib/utils";
import { babyFormStyles } from "./baby-form.styles";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";

interface BabyFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  baby: Baby | null;
  onBabyChange?: () => void;
}

const defaultFormData = {
  firstName: "",
  lastName: "",
  birthDate: undefined as Date | undefined,
  gender: "",
  inactive: false,
  feedWarningTime: "03:00",
  diaperWarningTime: "02:00",
};

export default function BabyForm({
  isOpen,
  onClose,
  isEditing,
  baby,
  onBabyChange,
}: BabyFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (baby && isOpen && !isSubmitting) {
      const birthDate =
        baby.birthDate instanceof Date
          ? baby.birthDate
          : new Date(baby.birthDate as string);

      setFormData({
        firstName: baby.firstName,
        lastName: baby.lastName,
        birthDate,
        gender: baby.gender || "",
        inactive: baby.inactive || false,
        feedWarningTime: baby.feedWarningTime || "03:00",
        diaperWarningTime: baby.diaperWarningTime || "02:00",
      });
    } else if (!isOpen && !isSubmitting) {
      setFormData(defaultFormData);
    }
  }, [baby?.id, isOpen, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/baby", {
        method: isEditing ? "PUT" : "POST",
        headers,
        body: JSON.stringify({
          ...formData,
          id: baby?.id,
          birthDate: formData.birthDate,
          gender: formData.gender as Gender,
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError } = await handleExpirationError(
            response,
            showToast,
            "managing babies"
          );
          if (isExpirationError) {
            return;
          }
        }

        throw new Error("Não conseguiram salvar o bebê.");
      }

      if (onBabyChange) {
        onBabyChange();
      }

      onClose();
    } catch (error) {
      console.error("Error saving baby:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar bebê" : "Adicionar novo bebê"}
      description={
        isEditing
          ? "Atualize as informações do seu bebê."
          : "Insira as informações do seu bebê para começar o acompanhamento."
      }
    >
      <form
        onSubmit={handleSubmit}
        className="h-full flex flex-col overflow-hidden"
      >
        <FormPageContent className={babyFormStyles.content}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Primeiro nome</label>
              <Input
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full"
                placeholder="Digite o primeiro nome"
                required
              />
            </div>
            <div>
              <label className="form-label">Sobrenome</label>
              <Input
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                className="w-full"
                placeholder="Digite o sobrenome"
                required
              />
            </div>
          </div>
          <div>
            <label className="form-label">Data de nascimento</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="input"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.birthDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {formData.birthDate
                    ? format(formData.birthDate, "PPP")
                    : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[100]" align="start">
                <CalendarComponent
                  mode="single"
                  selected={formData.birthDate}
                  onSelect={(date) =>
                    setFormData({ ...formData, birthDate: date })
                  }
                  maxDate={new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="form-label">Gênero</label>
            <Select
              value={formData.gender}
              onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o sexo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Masculino</SelectItem>
                <SelectItem value="FEMALE">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">
                Tempo de aviso de feed (hh:mm)
              </label>
              <Input
                type="text"
                pattern="[0-9]{2}:[0-9]{2}"
                value={formData.feedWarningTime}
                onChange={(e) =>
                  setFormData({ ...formData, feedWarningTime: e.target.value })
                }
                className="w-full"
                placeholder="03:00"
                required
              />
            </div>
            <div>
              <label className="form-label">
                Horário de aviso para troca de fralda (hh:mm)
              </label>
              <Input
                type="text"
                pattern="[0-9]{2}:[0-9]{2}"
                value={formData.diaperWarningTime}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    diaperWarningTime: e.target.value,
                  })
                }
                className="w-full"
                placeholder="02:00"
                required
              />
            </div>
          </div>
          {isEditing && (
            <div className="flex items-center space-x-2 mt-4">
              <label className="form-label flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  checked={formData.inactive}
                  onChange={(e) =>
                    setFormData({ ...formData, inactive: e.target.checked })
                  }
                />
                <span className="ml-2">Marcar como inativo</span>
              </label>
            </div>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
}
