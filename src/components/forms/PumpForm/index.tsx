"use client";

import React, { useState, useEffect } from "react";
import { PumpLogResponse } from "@/app/api/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { useTimezone } from "@/app/context/timezone";
import { useTheme } from "@/src/context/theme";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";
import { Plus, Minus } from "lucide-react";
import "./pump-form.css";

interface PumpFormProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  activity?: PumpLogResponse;
  onSuccess?: () => void;
}

export default function PumpForm({
  isOpen,
  onClose,
  babyId,
  initialTime,
  activity,
  onSuccess,
}: PumpFormProps) {
  const { formatDate, toUTCString } = useTimezone();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const [selectedStartDateTime, setSelectedStartDateTime] = useState<Date>(
    () => {
      try {
        const date = new Date(initialTime);
        date.setMinutes(date.getMinutes() - 15);
        if (isNaN(date.getTime())) {
          const now = new Date();
          now.setMinutes(now.getMinutes() - 15);
          return now;
        }
        return date;
      } catch (error) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - 15);
        return now;
      }
    }
  );

  const [selectedEndDateTime, setSelectedEndDateTime] = useState<Date>(() => {
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
    startTime: initialTime,
    endTime: "",
    leftAmount: "",
    rightAmount: "",
    totalAmount: "",
    unitAbbr: "OZ",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializedTime, setInitializedTime] = useState<string | null>(null);

  const handleStartDateTimeChange = (date: Date) => {
    setSelectedStartDateTime(date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData((prev) => ({ ...prev, startTime: formattedTime }));
  };

  const handleEndDateTimeChange = (date: Date) => {
    setSelectedEndDateTime(date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData((prev) => ({ ...prev, endTime: formattedTime }));
  };

  useEffect(() => {
    if (isOpen && !isInitialized) {
      if (activity) {
        try {
          const startDate = new Date(activity.startTime);
          if (!isNaN(startDate.getTime())) {
            setSelectedStartDateTime(startDate);
          }

          if (activity.endTime) {
            const endDate = new Date(activity.endTime);
            if (!isNaN(endDate.getTime())) {
              setSelectedEndDateTime(endDate);
            }
          }
        } catch (error) {}

        const startDate = new Date(activity.startTime);
        const startYear = startDate.getFullYear();
        const startMonth = String(startDate.getMonth() + 1).padStart(2, "0");
        const startDay = String(startDate.getDate()).padStart(2, "0");
        const startHours = String(startDate.getHours()).padStart(2, "0");
        const startMinutes = String(startDate.getMinutes()).padStart(2, "0");
        const formattedStartTime = `${startYear}-${startMonth}-${startDay}T${startHours}:${startMinutes}`;

        let formattedEndTime = "";
        if (activity.endTime) {
          const endDate = new Date(activity.endTime);
          const endYear = endDate.getFullYear();
          const endMonth = String(endDate.getMonth() + 1).padStart(2, "0");
          const endDay = String(endDate.getDate()).padStart(2, "0");
          const endHours = String(endDate.getHours()).padStart(2, "0");
          const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
          formattedEndTime = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;
        }

        setFormData({
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          leftAmount: activity.leftAmount?.toString() || "",
          rightAmount: activity.rightAmount?.toString() || "",
          totalAmount: activity.totalAmount?.toString() || "",
          unitAbbr: activity.unitAbbr || "OZ",
          notes: activity.notes || "",
        });
      } else {
        try {
          const date = new Date(initialTime);
          if (!isNaN(date.getTime())) {
            const startDate = new Date(date);
            startDate.setMinutes(startDate.getMinutes() - 15);
            setSelectedStartDateTime(startDate);

            setSelectedEndDateTime(date);

            const startYear = startDate.getFullYear();
            const startMonth = String(startDate.getMonth() + 1).padStart(
              2,
              "0"
            );
            const startDay = String(startDate.getDate()).padStart(2, "0");
            const startHours = String(startDate.getHours()).padStart(2, "0");
            const startMinutes = String(startDate.getMinutes()).padStart(
              2,
              "0"
            );
            const formattedStartTime = `${startYear}-${startMonth}-${startDay}T${startHours}:${startMinutes}`;

            const endYear = date.getFullYear();
            const endMonth = String(date.getMonth() + 1).padStart(2, "0");
            const endDay = String(date.getDate()).padStart(2, "0");
            const endHours = String(date.getHours()).padStart(2, "0");
            const endMinutes = String(date.getMinutes()).padStart(2, "0");
            const formattedEndTime = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`;

            setFormData((prev) => ({
              ...prev,
              startTime: formattedStartTime,
              endTime: formattedEndTime,
            }));
          }
        } catch (error) {}

        setInitializedTime(initialTime);
      }

      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
      setInitializedTime(null);
    }
  }, [isOpen, activity, initialTime]);

  const incrementAmount = (field: "leftAmount" | "rightAmount") => {
    const currentAmount = parseFloat(formData[field] || "0");
    const step = formData.unitAbbr === "ML" ? 5 : 0.5;
    const newAmount = (currentAmount + step).toFixed(1);

    updateAmountField(field, newAmount);
  };

  const decrementAmount = (field: "leftAmount" | "rightAmount") => {
    const currentAmount = parseFloat(formData[field] || "0");
    const step = formData.unitAbbr === "ML" ? 5 : 0.5;
    if (currentAmount >= step) {
      const newAmount = (currentAmount - step).toFixed(1);

      updateAmountField(field, newAmount);
    }
  };

  const updateAmountField = (
    field: "leftAmount" | "rightAmount" | "totalAmount",
    value: string
  ) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (field === "leftAmount" || field === "rightAmount") {
        setFormData((prev) => ({ ...prev, [field]: value }));

        const leftVal = field === "leftAmount" ? value : formData.leftAmount;
        const rightVal = field === "rightAmount" ? value : formData.rightAmount;

        const leftNum = leftVal ? parseFloat(leftVal) : 0;
        const rightNum = rightVal ? parseFloat(rightVal) : 0;

        setFormData((prev) => ({
          ...prev,
          [field]: value,
          totalAmount: (leftNum + rightNum).toFixed(1),
        }));
      } else {
        setFormData((prev) => ({ ...prev, totalAmount: value }));
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (["leftAmount", "rightAmount", "totalAmount"].includes(name)) {
      updateAmountField(
        name as "leftAmount" | "rightAmount" | "totalAmount",
        value
      );
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!babyId) {
      return;
    }

    setLoading(true);

    try {
      let duration: number | undefined = undefined;
      duration = Math.round(
        (selectedEndDateTime.getTime() - selectedStartDateTime.getTime()) /
          60000
      );

      const utcStartTime = toUTCString(selectedStartDateTime);

      const utcEndTime = toUTCString(selectedEndDateTime);

      const payload = {
        babyId,
        startTime: utcStartTime,
        endTime: utcEndTime,
        duration,
        leftAmount: formData.leftAmount
          ? parseFloat(formData.leftAmount)
          : undefined,
        rightAmount: formData.rightAmount
          ? parseFloat(formData.rightAmount)
          : undefined,
        totalAmount: formData.totalAmount
          ? parseFloat(formData.totalAmount)
          : undefined,
        unitAbbr: formData.unitAbbr || "OZ",
        notes: formData.notes || undefined,
      };

      const url = activity
        ? `/api/pump-log?id=${activity.id}`
        : "/api/pump-log";
      const method = activity ? "PUT" : "POST";

      const authToken = localStorage.getItem("authToken");

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
          const { isExpirationError } = await handleExpirationError(
            response,
            showToast,
            "registrando sessões de bomba"
          );
          if (isExpirationError) {
            return;
          }
        }

        const data = await response.json();
        showToast({
          variant: "error",
          title: "Error",
          message: data.error || "Falha ao salvar o registro da bomba",
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
          message: data.error || "Falha ao salvar o registro da bomba",
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
      title={activity ? "Editar bomba" : "Nova Bomba"}
      description={
        activity
          ? "Atualize os detalhes sobre sua sessão de extração de leite."
          : "Anote os detalhes da sua sessão de extração de leite."
      }
    >
      <FormPageContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Hora de início</Label>
              <DateTimePicker
                value={selectedStartDateTime}
                onChange={handleStartDateTimeChange}
                disabled={loading}
                placeholder="Selecione o horário de início..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Hora de término</Label>
              <DateTimePicker
                value={selectedEndDateTime}
                onChange={handleEndDateTimeChange}
                disabled={loading}
                placeholder="Selecione o horário de término..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitAbbr">Unidade</Label>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant={formData.unitAbbr === "OZ" ? "default" : "outline"}
                  className="w-full unit-button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, unitAbbr: "OZ" }))
                  }
                  disabled={loading}
                >
                  l
                </Button>
                <Button
                  type="button"
                  variant={formData.unitAbbr === "ML" ? "default" : "outline"}
                  className="w-full unit-button"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, unitAbbr: "ML" }))
                  }
                  disabled={loading}
                >
                  ml
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leftAmount">Valor restante</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => decrementAmount("leftAmount")}
                  disabled={loading}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 border-0 rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 decrement-button"
                >
                  <Minus className="h-4 w-4 text-white" />
                </Button>
                <div className="flex mx-2">
                  <Input
                    id="leftAmount"
                    name="leftAmount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={formData.leftAmount}
                    onChange={handleInputChange}
                    className="rounded-r-none text-center text-lg w-24"
                  />
                  <div className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md amount-unit">
                    {formData.unitAbbr}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => incrementAmount("leftAmount")}
                  disabled={loading}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 border-0 rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 increment-button"
                >
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rightAmount">Quantidade certa</Label>
              <div className="flex items-center">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => decrementAmount("rightAmount")}
                  disabled={loading}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 border-0 rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 decrement-button"
                >
                  <Minus className="h-4 w-4 text-white" />
                </Button>
                <div className="flex mx-2">
                  <Input
                    id="rightAmount"
                    name="rightAmount"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.0"
                    value={formData.rightAmount}
                    onChange={handleInputChange}
                    className="rounded-r-none text-center text-lg w-24"
                  />
                  <div className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md amount-unit">
                    {formData.unitAbbr}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => incrementAmount("rightAmount")}
                  disabled={loading}
                  className="bg-gradient-to-r from-teal-600 to-emerald-600 border-0 rounded-full h-10 w-10 flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 increment-button"
                >
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalAmount">Montante total</Label>
              <div className="flex">
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={formData.totalAmount}
                  onChange={handleInputChange}
                  className="rounded-r-none text-lg"
                />
                <div className="inline-flex items-center px-3 bg-gray-200 border border-l-0 border-gray-300 rounded-r-md amount-unit">
                  {formData.unitAbbr}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes-pump-form"
                name="notes"
                placeholder="Insira quaisquer observações sobre a sessão de bombeamento."
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
