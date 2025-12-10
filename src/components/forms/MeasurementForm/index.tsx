"use client";

import React, { useState, useEffect } from "react";
import { MeasurementResponse, MeasurementCreate } from "@/app/api/types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import { Label } from "@/src/components/ui/label";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { useTimezone } from "@/app/context/timezone";
import { Textarea } from "@/src/components/ui/textarea";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";

interface MeasurementFormProps {
  isOpen: boolean;
  onClose: () => void;
  babyId: string | undefined;
  initialTime: string;
  activity?: MeasurementResponse;
  onSuccess?: () => void;
}

interface MeasurementData {
  value: string;
  unit: string;
}

interface FormData {
  date: string;
  height: MeasurementData;
  weight: MeasurementData;
  headCircumference: MeasurementData;
  temperature: MeasurementData;
  notes: string;
}

export default function MeasurementForm({
  isOpen,
  onClose,
  babyId,
  initialTime,
  activity,
  onSuccess,
}: MeasurementFormProps) {
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

  const [defaultUnits, setDefaultUnits] = useState({
    height: "in",
    weight: "lb",
    headCircumference: "in",
    temperature: "°C",
  });

  const [formData, setFormData] = useState<FormData>({
    date: initialTime,
    height: { value: "", unit: defaultUnits.height },
    weight: { value: "", unit: defaultUnits.weight },
    headCircumference: { value: "", unit: defaultUnits.headCircumference },
    temperature: { value: "", unit: defaultUnits.temperature },
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializedTime, setInitializedTime] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await fetch("/api/settings", {
          headers: {
            Authorization: authToken ? `Bearer ${authToken}` : "",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const settings = data.data;
            setDefaultUnits({
              height: settings.defaultHeightUnit === "IN" ? "in" : "cm",
              weight:
                settings.defaultWeightUnit === "LB"
                  ? "lb"
                  : settings.defaultWeightUnit === "KG"
                  ? "kg"
                  : "oz",
              headCircumference:
                settings.defaultHeightUnit === "IN" ? "in" : "cm",
              temperature: settings.defaultTempUnit === "F" ? "°F" : "°C",
            });
          }
        }
      } catch (error) {}
    };

    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      height: { ...prev.height, unit: defaultUnits.height },
      weight: { ...prev.weight, unit: defaultUnits.weight },
      headCircumference: {
        ...prev.headCircumference,
        unit: defaultUnits.headCircumference,
      },
      temperature: { ...prev.temperature, unit: defaultUnits.temperature },
    }));
  }, [defaultUnits]);

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
        } catch (error) {}

        const date = new Date(activity.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const formattedTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        const updatedFormData = {
          date: formattedTime,
          notes: activity.notes || "",
          height: { value: "", unit: defaultUnits.height },
          weight: { value: "", unit: defaultUnits.weight },
          headCircumference: {
            value: "",
            unit: defaultUnits.headCircumference,
          },
          temperature: { value: "", unit: defaultUnits.temperature },
        };

        switch (activity.type) {
          case "HEIGHT":
            updatedFormData.height = {
              value: String(activity.value),
              unit: activity.unit,
            };
            break;
          case "WEIGHT":
            updatedFormData.weight = {
              value: String(activity.value),
              unit: activity.unit,
            };
            break;
          case "HEAD_CIRCUMFERENCE":
            updatedFormData.headCircumference = {
              value: String(activity.value),
              unit: activity.unit,
            };
            break;
          case "TEMPERATURE":
            updatedFormData.temperature = {
              value: String(activity.value),
              unit: activity.unit,
            };
            break;
        }

        setFormData(updatedFormData);

        setInitializedTime(activity.date);
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
        } catch (error) {}

        setInitializedTime(initialTime);
      }

      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
      setInitializedTime(null);
    }
  }, [isOpen, activity, initialTime, defaultUnits]);

  const handleValueChange = (
    type: keyof Omit<FormData, "date" | "notes">,
    value: string
  ) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setFormData((prev) => ({
        ...prev,
        [type]: { ...prev[type], value },
      }));
    }
  };

  const handleUnitChange = (
    type: keyof Omit<FormData, "date" | "notes">,
    unit: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: { ...prev[type], unit },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!babyId) return;

    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      return;
    }

    setLoading(true);

    try {
      const utcDateString = toUTCString(selectedDateTime);

      if (!utcDateString) {
        alert("Data inválida. Por favor, tente novamente.");
        setLoading(false);
        return;
      }

      const measurements: Omit<MeasurementCreate, "familyId">[] = [];

      if (formData.height.value) {
        measurements.push({
          babyId,
          date: utcDateString,
          type: "HEIGHT",
          value: parseFloat(formData.height.value),
          unit: formData.height.unit,
          notes: formData.notes || undefined,
        });
      }

      if (formData.weight.value) {
        measurements.push({
          babyId,
          date: utcDateString,
          type: "WEIGHT",
          value: parseFloat(formData.weight.value),
          unit: formData.weight.unit,
          notes: formData.notes || undefined,
        });
      }

      if (formData.headCircumference.value) {
        measurements.push({
          babyId,
          date: utcDateString,
          type: "HEAD_CIRCUMFERENCE",
          value: parseFloat(formData.headCircumference.value),
          unit: formData.headCircumference.unit,
          notes: formData.notes || undefined,
        });
      }

      if (formData.temperature.value) {
        measurements.push({
          babyId,
          date: utcDateString,
          type: "TEMPERATURE",
          value: parseFloat(formData.temperature.value),
          unit: formData.temperature.unit,
          notes: formData.notes || undefined,
        });
      }

      if (measurements.length === 0) {
        alert("Por favor, insira pelo menos um valor de medida");
        setLoading(false);
        return;
      }

      const authToken = localStorage.getItem("authToken");

      if (activity) {
        const matchingMeasurement = measurements.find(
          (m) => m.type === activity.type
        );

        if (matchingMeasurement) {
          const response = await fetch(
            `/api/measurement-log?id=${activity.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: authToken ? `Bearer ${authToken}` : "",
              },
              body: JSON.stringify(matchingMeasurement),
            }
          );

          if (!response.ok) {
            if (response.status === 403) {
              const { isExpirationError, errorData } =
                await handleExpirationError(
                  response,
                  showToast,
                  "atualizando medidas"
                );
              if (isExpirationError) {
                return;
              }
              if (errorData) {
                showToast({
                  variant: "error",
                  title: "Erro",
                  message: errorData.error || "Falha ao atualizar a medida",
                  duration: 5000,
                });
                throw new Error(
                  errorData.error || "Falha ao atualizar a medida"
                );
              }
            }

            const errorData = await response.json();
            showToast({
              variant: "error",
              title: "Erro",
              message: errorData.error || "Falha ao atualizar a medida",
              duration: 5000,
            });
            throw new Error(errorData.error || "Falha ao atualizar a medida");
          }
        } else {
          const response = await fetch(
            `/api/measurement-log?id=${activity.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: authToken ? `Bearer ${authToken}` : "",
              },
            }
          );

          if (!response.ok) {
            if (response.status === 403) {
              const { isExpirationError, errorData } =
                await handleExpirationError(
                  response,
                  showToast,
                  "excluindo medidas"
                );
              if (isExpirationError) {
                return;
              }
              if (errorData) {
                showToast({
                  variant: "error",
                  title: "Erro",
                  message: errorData.error || "Falha ao excluir a medida",
                  duration: 5000,
                });
                throw new Error(errorData.error || "Falha ao excluir a medida");
              }
            }

            const errorData = await response.json();
            showToast({
              variant: "error",
              title: "Erro",
              message: errorData.error || "Falha ao excluir a medida",
              duration: 5000,
            });
            throw new Error(errorData.error || "Falha ao excluir a medida");
          }
        }
      } else {
        for (const measurement of measurements) {
          const response = await fetch("/api/measurement-log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: authToken ? `Bearer ${authToken}` : "",
            },
            body: JSON.stringify(measurement),
          });

          if (!response.ok) {
            if (response.status === 403) {
              const { isExpirationError, errorData } =
                await handleExpirationError(
                  response,
                  showToast,
                  "registrando medidas"
                );
              if (isExpirationError) {
                return;
              }
              if (errorData) {
                showToast({
                  variant: "error",
                  title: "Erro",
                  message:
                    errorData.error ||
                    `Falha ao salvar a medida de ${measurement.type.toLowerCase()}`,
                  duration: 5000,
                });
                throw new Error(
                  errorData.error ||
                    `Falha ao salvar a medida de ${measurement.type.toLowerCase()}`
                );
              }
            }

            const errorData = await response.json();
            showToast({
              variant: "error",
              title: "Erro",
              message:
                errorData.error ||
                `Falha ao salvar a medida de ${measurement.type.toLowerCase()}`,
              duration: 5000,
            });
            throw new Error(
              errorData.error ||
                `Falha ao salvar a medida de ${measurement.type.toLowerCase()}`
            );
          }
        }
      }

      onClose();
      onSuccess?.();

      setSelectedDateTime(new Date(initialTime));
      setFormData({
        date: initialTime,
        height: { value: "", unit: defaultUnits.height },
        weight: { value: "", unit: defaultUnits.weight },
        headCircumference: { value: "", unit: defaultUnits.headCircumference },
        temperature: { value: "", unit: defaultUnits.temperature },
        notes: "",
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={activity ? "Editar Medida" : "Registrar Medidas"}
      description={
        activity
          ? "Atualize os detalhes sobre a medida do seu bebê"
          : "Registre novas medidas para o seu bebê"
      }
    >
      <FormPageContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="measurement-date">Data e Hora</Label>
              <DateTimePicker
                value={selectedDateTime}
                onChange={handleDateTimeChange}
                disabled={loading}
                placeholder="Selecione o horário da medida..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height-value">Altura</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="height-value"
                  type="text"
                  inputMode="decimal"
                  value={formData.height.value}
                  onChange={(e) => handleValueChange("height", e.target.value)}
                  className="flex-1"
                  placeholder="Digite a altura"
                  disabled={loading}
                />
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.height.unit === "in" ? "default" : "outline"
                    }
                    onClick={() => handleUnitChange("height", "in")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    in
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.height.unit === "cm" ? "default" : "outline"
                    }
                    onClick={() => handleUnitChange("height", "cm")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    cm
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight-value">Peso</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="weight-value"
                  type="text"
                  inputMode="decimal"
                  value={formData.weight.value}
                  onChange={(e) => handleValueChange("weight", e.target.value)}
                  className="flex-1"
                  placeholder="Digite o peso"
                  disabled={loading}
                />
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.weight.unit === "lb" ? "default" : "outline"
                    }
                    onClick={() => handleUnitChange("weight", "lb")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    lb
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.weight.unit === "kg" ? "default" : "outline"
                    }
                    onClick={() => handleUnitChange("weight", "kg")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    kg
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.weight.unit === "oz" ? "default" : "outline"
                    }
                    onClick={() => handleUnitChange("weight", "oz")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    oz
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="head-value">Circunferência da Cabeça</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="head-value"
                  type="text"
                  inputMode="decimal"
                  value={formData.headCircumference.value}
                  onChange={(e) =>
                    handleValueChange("headCircumference", e.target.value)
                  }
                  className="flex-1"
                  placeholder="Digite a circunferência da cabeça"
                  disabled={loading}
                />
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.headCircumference.unit === "in"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleUnitChange("headCircumference", "in")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    in
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.headCircumference.unit === "cm"
                        ? "default"
                        : "outline"
                    }
                    onClick={() => handleUnitChange("headCircumference", "cm")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    cm
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temp-value">Temperatura</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="temp-value"
                  type="text"
                  inputMode="decimal"
                  value={formData.temperature.value}
                  onChange={(e) =>
                    handleValueChange("temperature", e.target.value)
                  }
                  className="flex-1"
                  placeholder="Digite a temperatura"
                  disabled={loading}
                />
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.temperature.unit === "°F" ? "default" : "outline"
                    }
                    onClick={() => handleUnitChange("temperature", "°F")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    °F
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={
                      formData.temperature.unit === "°C" ? "default" : "outline"
                    }
                    onClick={() => handleUnitChange("temperature", "°C")}
                    disabled={loading}
                    className="px-2 py-1 h-9"
                  >
                    °C
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (Opcional)</Label>
              <Textarea
                id="notes-measurement-form"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="w-full"
                placeholder="Adicione quaisquer observações adicionais sobre essas medidas"
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
