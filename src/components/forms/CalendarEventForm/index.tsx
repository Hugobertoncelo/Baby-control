import React, { useState, useEffect } from "react";
import {
  CalendarEventFormProps,
  CalendarEventFormData,
  CalendarEventFormErrors,
} from "./calendar-event-form.types";
import {
  Baby,
  Contact,
} from "@/src/components/CalendarEvent/calendar-event.types";
import { calendarEventFormStyles as styles } from "./calendar-event-form.styles";
import { CalendarEventType } from "@prisma/client";
import { format } from "date-fns";
import ContactSelector from "./ContactSelector";
import { MapPin, AlertCircle, Loader2, Trash2 } from "lucide-react";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { DateTimePicker } from "@/src/components/ui/date-time-picker";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/src/components/ui/dropdown-menu";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";
import "./calendar-event-form.css";

const CalendarEventForm: React.FC<CalendarEventFormProps> = ({
  isOpen,
  onClose,
  event,
  onSave,
  initialDate,
  babies,
  caretakers,
  contacts,
  isLoading = false,
}) => {
  const { showToast } = useToast();

  const getInitialFormData = (
    eventData: CalendarEventFormData | undefined,
    initialDate: Date | undefined,
    babies: Baby[]
  ): CalendarEventFormData => {
    if (eventData) {
      return { ...eventData };
    }

    const date = initialDate || new Date();

    const startTime = new Date(date);
    startTime.setMinutes(Math.ceil(startTime.getMinutes() / 30) * 30);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);

    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1);

    const activeBabies = babies.filter((baby) => baby.inactive !== true);
    const defaultBabyIds =
      activeBabies.length === 1 ? [activeBabies[0].id] : [];

    return {
      title: "",
      startTime,
      endTime,
      allDay: false,
      type: CalendarEventType.APPOINTMENT,
      recurring: false,
      babyIds: defaultBabyIds,
      caretakerIds: [],
      contactIds: [],
    };
  };

  const [formData, setFormData] = useState<CalendarEventFormData>(() => {
    return getInitialFormData(event, initialDate, babies);
  });

  const [selectedStartDateTime, setSelectedStartDateTime] = useState<Date>(
    () => {
      return formData.startTime || new Date();
    }
  );

  const [selectedEndDateTime, setSelectedEndDateTime] = useState<Date>(() => {
    return formData.endTime || new Date(new Date().getTime() + 60 * 60 * 1000);
  });

  useEffect(() => {
    if (isOpen) {
      if (event) {
        setFormData({ ...event });
        if (event.startTime) {
          setSelectedStartDateTime(event.startTime);
        }
        if (event.endTime) {
          setSelectedEndDateTime(event.endTime);
        }
      } else {
        const newFormData = getInitialFormData(undefined, initialDate, babies);
        setFormData(newFormData);

        if (newFormData.startTime) {
          setSelectedStartDateTime(newFormData.startTime);
        }
        if (newFormData.endTime) {
          setSelectedEndDateTime(newFormData.endTime);
        }
      }
    }
  }, [isOpen, event, initialDate, babies]);

  useEffect(() => {
    if (event && formData.babyIds.length === 0) {
      const activeBabies = babies.filter((baby) => baby.inactive !== true);
      if (activeBabies.length === 1) {
        setFormData((prev) => ({
          ...prev,
          babyIds: [activeBabies[0].id],
        }));
      }
    }
  }, [event, babies, formData.babyIds]);

  const [errors, setErrors] = useState<CalendarEventFormErrors>({});

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof CalendarEventFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleStartDateTimeChange = (date: Date) => {
    setSelectedStartDateTime(date);
    setFormData((prev) => ({ ...prev, startTime: date }));

    if (errors.startTime) {
      setErrors((prev) => ({ ...prev, startTime: undefined }));
    }

    if (formData.endTime && formData.endTime < date) {
      const newEndTime = new Date(date);
      newEndTime.setHours(newEndTime.getHours() + 1);

      setSelectedEndDateTime(newEndTime);
      setFormData((prev) => ({ ...prev, endTime: newEndTime }));
    }
  };

  const handleEndDateTimeChange = (date: Date) => {
    setSelectedEndDateTime(date);
    setFormData((prev) => ({ ...prev, endTime: date }));

    if (errors.endTime) {
      setErrors((prev) => ({ ...prev, endTime: undefined }));
    }
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, color: e.target.value }));
  };

  const handleBabyChange = (babyId: string) => {
    setFormData((prev) => {
      const newBabyIds = prev.babyIds.includes(babyId)
        ? prev.babyIds.filter((id) => id !== babyId)
        : [...prev.babyIds, babyId];

      return { ...prev, babyIds: newBabyIds };
    });
  };

  const handleCaretakerChange = (caretakerId: string) => {
    setFormData((prev) => {
      const newCaretakerIds = prev.caretakerIds.includes(caretakerId)
        ? prev.caretakerIds.filter((id) => id !== caretakerId)
        : [...prev.caretakerIds, caretakerId];

      return { ...prev, caretakerIds: newCaretakerIds };
    });
  };

  const handleContactsChange = (contactIds: string[]) => {
    setFormData((prev) => ({ ...prev, contactIds }));
  };

  const [localContacts, setLocalContacts] = useState<Contact[]>(contacts);

  useEffect(() => {
    setLocalContacts(contacts);
  }, [contacts]);

  const handleAddContact = (newContact: Contact) => {
    console.log("Add new contact:", newContact);

    if (!newContact.id) {
      console.error("New contact missing ID:", newContact);
      return;
    }

    setLocalContacts((prev) => {
      if (!prev.some((c) => c.id === newContact.id)) {
        const updated = [...prev, newContact];
        console.log("Updated local contacts:", updated);
        return updated;
      }
      return prev;
    });

    setFormData((prev) => {
      const updatedFormData = {
        ...prev,
        contactIds: [...prev.contactIds, newContact.id],
      };
      console.log("Updated form data with new contact:", updatedFormData);
      return updatedFormData;
    });
  };

  const handleEditContact = (updatedContact: Contact) => {
    console.log("Edit contact:", updatedContact);

    setLocalContacts((prev) =>
      prev.map((c) => (c.id === updatedContact.id ? updatedContact : c))
    );
  };

  const handleDeleteContact = (contactId: string) => {
    console.log("Delete contact:", contactId);

    setLocalContacts((prev) => prev.filter((c) => c.id !== contactId));

    if (formData.contactIds.includes(contactId)) {
      setFormData((prev) => ({
        ...prev,
        contactIds: prev.contactIds.filter((id) => id !== contactId),
      }));
    }
  };

  const formatDateTimeForInput = (date?: Date): string => {
    if (!date) return "";
    try {
      return format(date, "aaaa-MM-dd'T'HH:mm");
    } catch (error) {
      console.error("Error formatting date for input:", error);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: CalendarEventFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "O título é obrigatório";
    }

    if (!formData.startTime) {
      newErrors.startTime = "O horário de início é obrigatório";
    }

    if (!formData.type) {
      newErrors.type = "O tipo de evento é obrigatório";
    }

    if (
      formData.startTime &&
      formData.endTime &&
      formData.endTime < formData.startTime
    ) {
      newErrors.endTime =
        "O horário de término deve ser posterior ao horário de início.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <FormPage
      isOpen={isOpen}
      onClose={handleClose}
      title={event ? "Editar evento" : "Novo Evento"}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        <FormPageContent>
          <div className="space-y-6 pb-24">
            <div className={styles.section}>
              <Label className="text-lg font-semibold">
                Detalhes do Evento
              </Label>

              <div className={styles.fieldGroup}>
                <Label htmlFor="title">
                  Título
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full"
                  placeholder="Insira o título do evento"
                />
                {errors.title && (
                  <div className={styles.fieldError}>
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.title}
                  </div>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <Label htmlFor="type">
                  Tipo de Evento
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {formData.type.charAt(0) +
                        formData.type.slice(1).toLowerCase().replace("_", " ")}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {Object.values(CalendarEventType).map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, type }));
                          if (errors.type) {
                            setErrors((prev) => ({ ...prev, type: undefined }));
                          }
                        }}
                      >
                        {type.charAt(0) +
                          type.slice(1).toLowerCase().replace("_", " ")}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {errors.type && (
                  <div className={styles.fieldError}>
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.type}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 py-2">
                <Checkbox
                  id="allDay"
                  name="allDay"
                  checked={formData.allDay}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange({
                      target: { name: "allDay", checked: checked === true },
                    } as React.ChangeEvent<HTMLInputElement>)
                  }
                />
                <Label htmlFor="allDay">Evento o dia todo</Label>
              </div>

              <div className="space-y-4">
                <div className={styles.fieldGroup}>
                  <Label htmlFor="startTime">
                    Hora de início
                    <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <div className="grid w-full">
                    <DateTimePicker
                      className="flex-none"
                      value={selectedStartDateTime}
                      onChange={handleStartDateTimeChange}
                      disabled={formData.allDay}
                      placeholder="Selecione o horário de início..."
                    />
                  </div>
                  {errors.startTime && (
                    <div className={styles.fieldError}>
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      {errors.startTime}
                    </div>
                  )}
                </div>

                <div className={styles.fieldGroup}>
                  <Label htmlFor="endTime">Hora de término</Label>
                  <div className="grid w-full">
                    <DateTimePicker
                      className="flex-none"
                      value={selectedEndDateTime}
                      onChange={handleEndDateTimeChange}
                      disabled={formData.allDay}
                      placeholder="Selecione o horário de término..."
                    />
                  </div>
                  {errors.endTime && (
                    <div className={styles.fieldError}>
                      <AlertCircle className="h-3 w-3 inline mr-1" />
                      {errors.endTime}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <Label htmlFor="location">Localização</Label>
                <div className="relative">
                  <Input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location || ""}
                    onChange={handleChange}
                    className="w-full pl-8"
                    placeholder="Insira a localização (opcional)"
                  />
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description || ""}
                  onChange={handleChange}
                  className="w-full min-h-[100px]"
                  placeholder="Insira a descrição do evento (opcional)"
                />
              </div>

              <div className={styles.fieldGroup}>
                <Label htmlFor="color">Cor</Label>
                <div className="flex items-center space-x-2">
                  <div
                    className="h-6 w-6 rounded-full border border-gray-300 dark:border-gray-700"
                    style={{ backgroundColor: formData.color || "#14b8a6" }}
                  />
                  <div className="w-8 h-8 overflow-hidden rounded-md border border-gray-300 dark:border-gray-700">
                    <input
                      type="color"
                      id="color"
                      name="color"
                      value={formData.color || "#14b8a6"}
                      onChange={handleColorChange}
                      className="w-10 h-10 cursor-pointer opacity-0 transform -translate-x-1 -translate-y-1"
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    Cor personalizada para este evento
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <Label className="text-lg font-semibold">Pessoas</Label>

              {babies.filter((baby) => baby.inactive !== true).length > 1 ? (
                <div className={styles.fieldGroup}>
                  <Label>Babies</Label>
                  <div className="space-y-2">
                    {babies.map((baby) => (
                      <div
                        key={baby.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`baby-${baby.id}`}
                          checked={formData.babyIds.includes(baby.id)}
                          onCheckedChange={() => handleBabyChange(baby.id)}
                        />
                        <Label
                          htmlFor={`baby-${baby.id}`}
                          className={
                            baby.inactive === true
                              ? "text-gray-400 dark:text-gray-500 italic"
                              : undefined
                          }
                        >
                          {baby.firstName} {baby.lastName}
                          {baby.inactive === true && " (inactive)"}
                        </Label>
                      </div>
                    ))}

                    {babies.length === 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Não há bebês disponíveis
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="hidden">
                  <input
                    type="hidden"
                    name="babyIds"
                    value={
                      babies.filter((baby) => baby.inactive !== true)[0]?.id ||
                      ""
                    }
                  />
                  {(() => {
                    const activeBaby = babies.filter(
                      (baby) => baby.inactive !== true
                    )[0];
                    if (
                      activeBaby &&
                      !formData.babyIds.includes(activeBaby.id)
                    ) {
                      setTimeout(() => {
                        setFormData((prev) => ({
                          ...prev,
                          babyIds: [activeBaby.id],
                        }));
                      }, 0);
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className={styles.fieldGroup}>
                <Label>Zeladores</Label>
                <div className="space-y-2">
                  {caretakers.map((caretaker) => (
                    <div
                      key={caretaker.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`caretaker-${caretaker.id}`}
                        checked={formData.caretakerIds.includes(caretaker.id)}
                        onCheckedChange={() =>
                          handleCaretakerChange(caretaker.id)
                        }
                      />
                      <Label htmlFor={`caretaker-${caretaker.id}`}>
                        {caretaker.name}{" "}
                        {caretaker.type ? `(${caretaker.type})` : ""}
                      </Label>
                    </div>
                  ))}

                  {caretakers.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Não há cuidadores disponíveis.
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <Label>Contatos</Label>
                <ContactSelector
                  contacts={localContacts}
                  selectedContactIds={formData.contactIds}
                  onContactsChange={handleContactsChange}
                  onAddNewContact={handleAddContact}
                  onEditContact={handleEditContact}
                  onDeleteContact={handleDeleteContact}
                />
              </div>
            </div>
          </div>
        </FormPageContent>

        <FormPageFooter>
          <div className="flex justify-between items-center w-full">
            <div>
              {event && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (!event.id) return;

                    try {
                      const authToken = localStorage.getItem("authToken");
                      const response = await fetch(
                        `/api/calendar-event?id=${event.id}`,
                        {
                          method: "DELETE",
                          headers: {
                            "Content-Type": "application/json",
                            ...(authToken && {
                              Authorization: `Bearer ${authToken}`,
                            }),
                          },
                        }
                      );

                      if (!response.ok) {
                        if (response.status === 403) {
                          const { isExpirationError, errorData } =
                            await handleExpirationError(
                              response,
                              showToast,
                              "gerenciamento de eventos do calendário"
                            );
                          if (isExpirationError) {
                            return;
                          }
                          if (errorData) {
                            showToast({
                              variant: "error",
                              title: "Erro",
                              message:
                                errorData.error || "Falha ao excluir o evento",
                              duration: 5000,
                            });
                            return;
                          }
                        }

                        const errorData = await response.json();
                        console.error("Error deleting event:", errorData.error);
                        showToast({
                          variant: "error",
                          title: "Erro",
                          message:
                            errorData.error || "Falha ao excluir o evento",
                          duration: 5000,
                        });
                        return;
                      }

                      const data = await response.json();

                      if (data.success) {
                        onClose();

                        onSave({
                          ...event,
                          _deleted: true,
                        });
                      } else {
                        console.error("Error deleting event:", data.error);
                        showToast({
                          variant: "error",
                          title: "Erro",
                          message: data.error || "Falha ao excluir o evento",
                          duration: 5000,
                        });
                      }
                    } catch (error) {
                      console.error("Error deleting event:", error);
                      showToast({
                        variant: "error",
                        title: "Erro",
                        message: "Ocorreu um erro inesperado. Tente novamente.",
                        duration: 5000,
                      });
                    }
                  }}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Excluir
                </Button>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Evento"
                )}
              </Button>
            </div>
          </div>
        </FormPageFooter>
      </form>
    </FormPage>
  );
};

export default CalendarEventForm;
