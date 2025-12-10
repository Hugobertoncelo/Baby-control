"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import { medicineFormStyles as styles } from "./medicine-form.styles";
import {
  GiveMedicineTabProps,
  MedicineWithContacts,
  MedicineLogFormData,
} from "./medicine-form.types";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import { Label } from "@/src/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
import { useTimezone } from "@/app/context/timezone";
import { useTheme } from "@/src/context/theme";

const GiveMedicineTab: React.FC<GiveMedicineTabProps> = ({
  babyId,
  initialTime,
  onSuccess,
  refreshData,
  setIsSubmitting,
  activity,
}) => {
  const { toUTCString } = useTimezone();
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<MedicineWithContacts[]>([]);
  const [units, setUnits] = useState<{ unitAbbr: string; unitName: string }[]>(
    []
  );
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(
    () => new Date(initialTime)
  );

  const [formData, setFormData] = useState<
    Omit<MedicineLogFormData, "familyId">
  >(() => ({
    babyId: babyId || "",
    medicineId: activity?.medicineId || "",
    time:
      toUTCString(new Date(initialTime)) || new Date(initialTime).toISOString(),
    doseAmount: activity?.doseAmount || 0,
    unitAbbr: activity?.unitAbbr || "",
    notes: activity?.notes || "",
  }));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedMedicine, setSelectedMedicine] =
    useState<MedicineWithContacts | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializedTime, setInitializedTime] = useState<string | null>(null);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);

  useEffect(() => {
    const currentActivityId = activity?.id || null;
    const shouldInitialize =
      !isInitialized || currentActivityId !== lastActivityId;

    if (shouldInitialize) {
      if (activity) {
        setFormData({
          babyId: babyId || "",
          medicineId: activity.medicineId || "",
          time:
            activity.time ||
            toUTCString(new Date(initialTime)) ||
            new Date(initialTime).toISOString(),
          doseAmount: activity.doseAmount || 0,
          unitAbbr: activity.unitAbbr || "",
          notes: activity.notes || "",
        });

        if (activity.time) {
          setSelectedDateTime(new Date(activity.time));
        }

        setInitializedTime(activity.time || initialTime);

        if (medicines.length > 0 && activity.medicineId) {
          const currentMedicine = medicines.find(
            (m: MedicineWithContacts) => m.id === activity.medicineId
          );
          setSelectedMedicine(currentMedicine || null);
        }
      } else {
        const safeResetTime = initialTime ? new Date(initialTime) : new Date();
        const isValidResetDate =
          safeResetTime instanceof Date && !isNaN(safeResetTime.getTime());
        const defaultResetDate = isValidResetDate ? safeResetTime : new Date();

        setFormData({
          babyId: babyId || "",
          medicineId: "",
          time: toUTCString(defaultResetDate) || defaultResetDate.toISOString(),
          doseAmount: 0,
          unitAbbr: "",
          notes: "",
        });
        setSelectedDateTime(defaultResetDate);
        setSelectedMedicine(null);

        setInitializedTime(initialTime);
      }

      setIsInitialized(true);
      setLastActivityId(currentActivityId);
    }
  }, [
    activity,
    babyId,
    initialTime,
    toUTCString,
    medicines,
    isInitialized,
    lastActivityId,
  ]);

  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      setError(null);
      const authToken = localStorage.getItem("authToken");
      try {
        const fetchOptions = {
          headers: { Authorization: `Bearer ${authToken}` },
        };
        const medicinesResponse = await fetch(
          "/api/medicine?active=true",
          fetchOptions
        );
        if (!medicinesResponse.ok)
          throw new Error("Falha ao carregar os medicamentos");
        const medicinesData = await medicinesResponse.json();
        if (medicinesData.success) {
          setMedicines(medicinesData.data);
          if (activity?.medicineId) {
            const currentMedicine = medicinesData.data.find(
              (m: MedicineWithContacts) => m.id === activity.medicineId
            );
            setSelectedMedicine(currentMedicine || null);
          }
        } else {
          setError(medicinesData.error || "Falha ao carregar os medicamentos");
        }

        const unitsResponse = await fetch(
          "/api/units?activityType=medicine",
          fetchOptions
        );
        if (!unitsResponse.ok) throw new Error("Falha ao carregar as unidades");
        const unitsData = await unitsResponse.json();
        if (unitsData.success) setUnits(unitsData.data);
        else setError(unitsData.error || "Falha ao carregar as unidades");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
        );
      } finally {
        setIsFetching(false);
      }
    };
    fetchData();
  }, [activity]);

  const handleDateTimeChange = (date: Date) => {
    setSelectedDateTime(date);
    setFormData((prev) => ({
      ...prev,
      time: toUTCString(date) || date.toISOString(),
    }));
    if (errors.time) setErrors((prev) => ({ ...prev, time: "" }));
  };

  const handleMedicineChange = (medicineId: string) => {
    const medicine = medicines.find((m) => m.id === medicineId);
    setSelectedMedicine(medicine || null);
    setFormData((prev) => ({
      ...prev,
      medicineId,
      unitAbbr: medicine?.unitAbbr || prev.unitAbbr,
      doseAmount: medicine?.typicalDoseSize || prev.doseAmount,
    }));
    if (errors.medicineId) setErrors((prev) => ({ ...prev, medicineId: "" }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value === "") {
      setFormData((prev) => ({ ...prev, [name]: 0 }));
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setErrors((prev) => ({
        ...prev,
        [name]: "Por favor, insira um número válido.",
      }));
      setFormData((prev) => ({ ...prev, [name]: 0 }));
    }
  };

  const handleUnitChange = (unitAbbr: string) => {
    setFormData((prev) => ({ ...prev, unitAbbr }));
    if (errors.unitAbbr) setErrors((prev) => ({ ...prev, unitAbbr: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.medicineId) newErrors.medicineId = "Selecione um medicamento";
    if (!formData.time) newErrors.time = "Selecione um horário";
    if (formData.doseAmount < 0)
      newErrors.doseAmount = "A dose não pode ser negativa.";
    if (formData.doseAmount > 0 && !formData.unitAbbr)
      newErrors.unitAbbr = "Selecione uma unidade";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setIsSubmitting?.(true);
    setError(null);

    try {
      const payload = { ...formData };
      if (payload.doseAmount === 0) payload.unitAbbr = "";

      const url = activity
        ? `/api/medicine-log?id=${activity.id}`
        : "/api/medicine-log";
      const method = activity ? "PUT" : "POST";
      const authToken = localStorage.getItem("authToken");

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Falha ao ${activity ? "atualizar" : "salvar"} registro`
        );
      }

      const result = await response.json();

      if (result.success) {
        setError(null);

        refreshData?.();

        onSuccess?.();
      } else {
        throw new Error(
          result.error ||
            `Falha ao ${activity ? "atualizar" : "salvar"} registro`
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro desconhecido."
      );
    } finally {
      setIsLoading(false);
      setIsSubmitting?.(false);
    }
  };

  return (
    <form
      id="give-medicine-form"
      onSubmit={handleSubmit}
      className="h-full flex flex-col"
    >
      <div className="flex-1 overflow-y-auto p-1">
        {isFetching ? (
          <div
            className={cn(
              styles.loadingContainer,
              "medicine-form-loading-container"
            )}
          >
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="mt-2 text-gray-600">
              Carregando dados do formulário...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div
                className={cn(
                  styles.errorContainer,
                  "medicine-form-error-container flex items-center text-red-500 p-2 bg-red-50 rounded-md"
                )}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <div className={cn(styles.formGroup, "medicine-form-group")}>
              <Label>Medicamentos</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedMedicine
                      ? selectedMedicine.name
                      : "Selecione um medicamento"}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56">
                  <DropdownMenuLabel>
                    Medicamentos Disponíveis
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {medicines.map((med) => (
                    <DropdownMenuItem
                      key={med.id}
                      onSelect={() => handleMedicineChange(med.id)}
                    >
                      {med.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.medicineId && (
                <p className={cn(styles.formError, "medicine-form-error")}>
                  {errors.medicineId}
                </p>
              )}
            </div>

            <div className={cn(styles.formGroup, "medicine-form-group")}>
              <Label>Tempo</Label>
              <DateTimePicker
                value={selectedDateTime}
                onChange={handleDateTimeChange}
              />
              {errors.time && (
                <p className={cn(styles.formError, "medicine-form-error")}>
                  {errors.time}
                </p>
              )}
            </div>

            <div className={cn(styles.formGroup, "medicine-form-group")}>
              <Label>Dose</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="doseAmount"
                  name="doseAmount"
                  type="text"
                  inputMode="decimal"
                  value={formData.doseAmount || ""}
                  onChange={handleNumberChange}
                  onBlur={handleNumberBlur}
                  className="flex-1"
                  placeholder="Insira a quantidade da dose"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[70px]">
                      {formData.unitAbbr || "Unit"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {units.map((unit) => (
                      <DropdownMenuItem
                        key={unit.unitAbbr}
                        onSelect={() => handleUnitChange(unit.unitAbbr)}
                      >
                        {unit.unitName} ({unit.unitAbbr})
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {errors.doseAmount && (
                <p className={cn(styles.formError, "medicine-form-error")}>
                  {errors.doseAmount}
                </p>
              )}
              {errors.unitAbbr && (
                <p className={cn(styles.formError, "medicine-form-error")}>
                  {errors.unitAbbr}
                </p>
              )}
            </div>

            <div className={cn(styles.formGroup, "medicine-form-group")}>
              <Label>Notes (optional)</Label>
              <Textarea
                id="notes-give-medicine"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
          </div>
        )}
      </div>
    </form>
  );
};

export default GiveMedicineTab;
