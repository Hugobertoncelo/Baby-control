"use client";

import React, { useState, useEffect } from "react";
import { medicineFormStyles as styles } from "./medicine-form.styles";
import { MedicineFormData } from "./medicine-form.types";
import {
  PillBottle,
  Loader2,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import { Switch } from "@/src/components/ui/switch";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Contact } from "@/src/components/CalendarEvent/calendar-event.types";
import ContactSelector from "./ContactSelector";

interface MedicineFormProps {
  isOpen: boolean;
  onClose: () => void;
  medicine?: any;
  units: { unitAbbr: string; unitName: string }[];
  contacts: { id: string; name: string; role: string }[];
  onSave: (formData: MedicineFormData) => Promise<void>;
}

const MedicineForm: React.FC<MedicineFormProps> = ({
  isOpen,
  onClose,
  medicine,
  units,
  contacts,
  onSave,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const convertedContacts: Contact[] = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    role: c.role,
    phone: null,
    email: null,
    address: null,
    notes: null,
  }));

  const [localContacts, setLocalContacts] =
    useState<Contact[]>(convertedContacts);

  const [doseTimeValue, setDoseTimeValue] = useState<string>("");
  const [doseTimeUnit, setDoseTimeUnit] = useState<"hours" | "days">("hours");

  const parseDoseMinTime = (doseMinTime: string) => {
    if (!doseMinTime) {
      setDoseTimeValue("");
      setDoseTimeUnit("hours");
      return;
    }

    const timeRegex = /^([0-9]{1,2}):([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (timeRegex.test(doseMinTime)) {
      const [days, hours, minutes] = doseMinTime.split(":").map(Number);

      const totalHours = days * 24 + hours + minutes / 60;

      if (totalHours < 24) {
        setDoseTimeValue(totalHours.toString());
        setDoseTimeUnit("hours");
      } else {
        const totalDays = totalHours / 24;
        setDoseTimeValue(totalDays.toString());
        setDoseTimeUnit("days");
      }
    }
  };

  const formatDoseMinTime = (value: string, unit: "hours" | "days"): string => {
    if (!value || value === "0") return "";

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return "";

    let totalHours: number;
    if (unit === "days") {
      totalHours = numValue * 24;
    } else {
      totalHours = numValue;
    }

    const days = Math.floor(totalHours / 24);
    const hours = Math.floor(totalHours % 24);
    const minutes = Math.floor((totalHours % 1) * 60);

    return `${days.toString().padStart(2, "0")}:${hours
      .toString()
      .padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const [formData, setFormData] = useState<MedicineFormData>(() => {
    if (medicine) {
      return {
        id: medicine.id,
        name: medicine.name,
        typicalDoseSize: medicine.typicalDoseSize,
        unitAbbr: medicine.unitAbbr || "",
        doseMinTime: medicine.doseMinTime || "",
        notes: medicine.notes || "",
        active: medicine.active,
        contactIds: medicine.contacts?.map((c: any) => c.contact.id) || [],
      };
    }

    return {
      name: "",
      typicalDoseSize: undefined,
      unitAbbr: "",
      doseMinTime: "",
      notes: "",
      active: true,
      contactIds: [],
    };
  });

  useEffect(() => {
    if (medicine) {
      const medicineData = {
        id: medicine.id,
        name: medicine.name,
        typicalDoseSize: medicine.typicalDoseSize,
        unitAbbr: medicine.unitAbbr || "",
        doseMinTime: medicine.doseMinTime || "",
        notes: medicine.notes || "",
        active: medicine.active,
        contactIds: medicine.contacts?.map((c: any) => c.contact.id) || [],
      };
      setFormData(medicineData);
      parseDoseMinTime(medicine.doseMinTime || "");
    } else {
      setFormData({
        name: "",
        typicalDoseSize: undefined,
        unitAbbr: "",
        doseMinTime: "",
        notes: "",
        active: true,
        contactIds: [],
      });
      setDoseTimeValue("");
      setDoseTimeUnit("hours");
    }
    setErrors({});
  }, [medicine, isOpen]);

  useEffect(() => {
    const newContacts: Contact[] = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      phone: null,
      email: null,
      address: null,
      notes: null,
    }));
    setLocalContacts(newContacts);
  }, [contacts]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (!name) {
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleNumberBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value === "") {
      setFormData((prev) => ({ ...prev, [name]: undefined }));
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
      setFormData((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleUnitChange = (unitAbbr: string) => {
    setFormData((prev) => ({ ...prev, unitAbbr }));

    if (errors.unitAbbr) {
      setErrors((prev) => ({ ...prev, unitAbbr: "" }));
    }
  };

  const handleActiveToggle = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, active: checked }));
  };

  const handleDoseTimeValueChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setDoseTimeValue(value);

    const formattedTime = formatDoseMinTime(value, doseTimeUnit);
    setFormData((prev) => ({ ...prev, doseMinTime: formattedTime }));

    if (errors.doseMinTime) {
      setErrors((prev) => ({ ...prev, doseMinTime: "" }));
    }
  };

  const handleDoseTimeUnitToggle = (checked: boolean) => {
    const newUnit = checked ? "days" : "hours";
    setDoseTimeUnit(newUnit);

    const formattedTime = formatDoseMinTime(doseTimeValue, newUnit);
    setFormData((prev) => ({ ...prev, doseMinTime: formattedTime }));

    if (errors.doseMinTime) {
      setErrors((prev) => ({ ...prev, doseMinTime: "" }));
    }
  };

  const handleContactsChange = (contactIds: string[]) => {
    const uniqueContactIds = Array.from(new Set(contactIds));
    setFormData((prev) => ({ ...prev, contactIds: uniqueContactIds }));
  };

  const handleAddContact = (newContact: Contact) => {
    setLocalContacts((prev) => {
      if (!prev.some((c) => c.id === newContact.id)) {
        return [...prev, newContact];
      }
      return prev;
    });

    setFormData((prev) => {
      const currentContactIds = prev.contactIds || [];
      if (!currentContactIds.includes(newContact.id)) {
        return {
          ...prev,
          contactIds: [...currentContactIds, newContact.id],
        };
      }
      return prev;
    });
  };

  const handleEditContact = (updatedContact: Contact) => {
    setLocalContacts((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
    );
  };

  const handleDeleteContact = (contactId: string) => {
    setLocalContacts((prev) => prev.filter((c) => c.id !== contactId));

    if (formData.contactIds?.includes(contactId)) {
      setFormData((prev) => ({
        ...prev,
        contactIds: prev.contactIds?.filter((id) => id !== contactId) || [],
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "O nome é obrigatório";
    }

    if (
      formData.typicalDoseSize &&
      formData.typicalDoseSize > 0 &&
      !formData.unitAbbr
    ) {
      newErrors.unitAbbr =
        "É necessária uma unidade quando o tamanho da dose for especificado.";
    }

    if (formData.doseMinTime) {
      const timeRegex = /^([0-9]{1,2}):([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(formData.doseMinTime)) {
        newErrors.doseMinTime =
          "Por favor, insira um horário válido no formato DD:HH:MM";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const dataToSubmit = {
      ...formData,
      typicalDoseSize: formData.typicalDoseSize,
      contactIds: formData.contactIds
        ? Array.from(new Set(formData.contactIds))
        : [],
    };

    try {
      await onSave(dataToSubmit);
      onClose();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={
        medicine ? `Editar ${medicine.name}` : "Adicionar novo medicamento"
      }
      description={
        medicine
          ? "Atualizar detalhes do medicamento"
          : "Adicionar um novo medicamento ao acompanhamento"
      }
    >
      <FormPageContent>
        <form id="medicine-form" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className={styles.formGroup}>
              <Label htmlFor="name">
                Nome do medicamento
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-9"
                  placeholder="Digite o nome do medicamento"
                />
                <PillBottle className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              {errors.name && (
                <div className="text-xs text-red-500 mt-1">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  {errors.name}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className={styles.formGroup}>
                <Label htmlFor="typicalDoseSize">Tamanho típico da dose</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  name="typicalDoseSize"
                  value={formData.typicalDoseSize || ""}
                  onChange={handleNumberChange}
                  onBlur={handleNumberBlur}
                  placeholder="Insira a dose típica (opcional)"
                />
                {errors.typicalDoseSize && (
                  <div className="text-xs text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.typicalDoseSize}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <Label htmlFor="unitAbbr">Unidade</Label>
                <Select
                  value={formData.unitAbbr}
                  onValueChange={handleUnitChange}
                >
                  <SelectTrigger
                    className={errors.unitAbbr ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Selecione uma unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.unitAbbr} value={unit.unitAbbr}>
                        {unit.unitName} ({unit.unitAbbr})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unitAbbr && (
                  <div className="text-xs text-red-500 mt-1">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.unitAbbr}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <Label htmlFor="doseMinTime">Intervalo mínimo entre doses</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={doseTimeValue}
                      onChange={handleDoseTimeValueChange}
                      className="w-full pl-9"
                      placeholder="Insira a hora"
                    />
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="dose-time-unit"
                      className="text-sm font-medium"
                    >
                      Horas
                    </Label>
                    <Switch
                      id="dose-time-unit"
                      checked={doseTimeUnit === "days"}
                      onCheckedChange={handleDoseTimeUnitToggle}
                      variant="green"
                    />
                    <Label
                      htmlFor="dose-time-unit"
                      className="text-sm font-medium"
                    >
                      Dias
                    </Label>
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  {doseTimeUnit === "hours"
                    ? "Insira o tempo mínimo em horas (por exemplo, 6 para Insira o tempo mínimo em horas (por exemplo, 6 para 6 horas, 0,5 para 30 minutos).6 horas, 0,5 para 30 minutos)"
                    : "Insira o tempo mínimo em dias (por exemplo, 1 para 1 dia, 0,5 para 12 horas)."}
                </div>
              </div>

              {errors.doseMinTime && (
                <div className="text-xs text-red-500 mt-1">
                  <AlertCircle className="h-3 w-3 inline mr-1" />
                  {errors.doseMinTime}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 py-2">
              <Switch
                checked={formData.active}
                onCheckedChange={handleActiveToggle}
                id="active-status"
              />
              <Label
                htmlFor="active-status"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Medicina Ativa
              </Label>
            </div>

            <div className={styles.formGroup}>
              <Label htmlFor="notes">Notes</Label>
              <div className="relative">
                <Textarea
                  id="notes-medicine-form"
                  name="notes"
                  value={formData.notes || ""}
                  onChange={handleChange}
                  className="w-full min-h-[100px] pl-9"
                  placeholder="Insira notas adicionais sobre este medicamento."
                />
                <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className={styles.formGroup}>
              <Label htmlFor="contacts">Contatos Associados</Label>
              <ContactSelector
                contacts={localContacts}
                selectedContactIds={formData.contactIds || []}
                onContactsChange={handleContactsChange}
                onAddNewContact={handleAddContact}
                onEditContact={handleEditContact}
                onDeleteContact={handleDeleteContact}
              />
            </div>
          </div>
        </form>
      </FormPageContent>

      <FormPageFooter>
        <div className="flex justify-end w-full space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>

          <Button form="medicine-form" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Salvando...
              </>
            ) : medicine ? (
              "Atualizar"
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
};

export default MedicineForm;
