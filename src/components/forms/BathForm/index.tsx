"use client";

import React, { useState, useEffect } from "react";
import { BathLogResponse } from "@/app/api/types";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { useTimezone } from "@/app/context/timezone";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";

interface BathFormProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  activity?: BathLogResponse;
  onSuccess?: () => void;
}

export default function BathForm({
  isOpen,
  onClose,
  babyId,
  initialTime,
  activity,
  onSuccess,
}: BathFormProps) {
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
      return new Date();
    }
  });
  const [formData, setFormData] = useState({
    soapUsed: false,
    shampooUsed: false,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializedTime, setInitializedTime] = useState<string | null>(null);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentActivityId = activity?.id || null;
      const shouldInitialize =
        !isInitialized || currentActivityId !== lastActivityId;

      if (shouldInitialize) {
        if (activity) {
          try {
            const activityDate = new Date(activity.time);
            if (!isNaN(activityDate.getTime())) {
              setSelectedDateTime(activityDate);
            }
          } catch (error) {}
          setFormData({
            soapUsed: activity.soapUsed || false,
            shampooUsed: activity.shampooUsed || false,
            notes: activity.notes || "",
          });

          setInitializedTime(activity.time);
        } else {
          try {
            const initialDate = new Date(initialTime);
            if (!isNaN(initialDate.getTime())) {
              setSelectedDateTime(initialDate);
            }
          } catch (error) {}

          setInitializedTime(initialTime);
        }

        setIsInitialized(true);
        setLastActivityId(currentActivityId);
      }
    } else if (!isOpen) {
      setIsInitialized(false);
      setInitializedTime(null);
      setLastActivityId(null);
    }
  }, [isOpen, activity, initialTime, isInitialized, lastActivityId]);

  const handleDateTimeChange = (date: Date) => {
    setSelectedDateTime(date);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!babyId) {
      return;
    }

    setLoading(true);

    try {
      const utcTimeString = toUTCString(selectedDateTime);

      const payload = {
        babyId,
        time: utcTimeString,
        soapUsed: formData.soapUsed,
        shampooUsed: formData.shampooUsed,
        notes: formData.notes || null,
      };

      const authToken = localStorage.getItem("authToken");

      const url = activity
        ? `/api/bath-log?id=${activity.id}`
        : "/api/bath-log";
      const method = activity ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError, errorData } = await handleExpirationError(
            response,
            showToast,
            "tracking baths"
          );
          if (isExpirationError) {
            return;
          }
          if (errorData) {
            showToast({
              variant: "error",
              title: "Error",
              message: errorData.error || "Falha ao salvar o registro de banho",
              duration: 5000,
            });
            return;
          }
        }

        const errorData = await response.json();
        showToast({
          variant: "error",
          title: "Error",
          message: errorData.error || "Falha ao salvar o registro de banho",
          duration: 5000,
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        showToast({
          variant: "error",
          title: "Error",
          message: data.error || "Falha ao salvar o registro de banho",
          duration: 5000,
        });
      }
    } catch (error) {
      showToast({
        variant: "error",
        title: "Error",
        message: "Ocorreu um erro inesperado. Tente novamente.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={activity ? "Editar Banho" : "Banho Novo"}
    >
      <FormPageContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data e hora</Label>
              <DateTimePicker
                value={selectedDateTime}
                onChange={handleDateTimeChange}
                disabled={loading}
                placeholder="Selecione a hora do banho..."
              />
            </div>

            <div className="space-y-2">
              <Label>Opções de Banho</Label>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="soapUsed"
                    checked={formData.soapUsed}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("soapUsed", checked as boolean)
                    }
                    variant="success"
                  />
                  <Label htmlFor="soapUsed" className="cursor-pointer">
                    Sabão usado
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shampooUsed"
                    checked={formData.shampooUsed}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange("shampooUsed", checked as boolean)
                    }
                    variant="success"
                  />
                  <Label htmlFor="shampooUsed" className="cursor-pointer">
                    Shampoo usado
                  </Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes-bath-form"
                name="notes"
                placeholder="Insira quaisquer observações sobre o banho."
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
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
            {loading ? "Salvando..." : activity ? "Atualizar" : "Salvar"}
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
}
