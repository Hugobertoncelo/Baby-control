import React, { useMemo, useState } from "react";
import { cn } from "@/src/lib/utils";
import { CalendarDayViewProps, EventGroups } from "./calendar-day-view.types";
import { calendarDayViewStyles as styles } from "./calendar-day-view.styles";
import { CalendarEventItem } from "../CalendarEventItem";
import {
  Loader2,
  Sun,
  Coffee,
  Moon,
  PlusCircle,
  CalendarClock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import CalendarEventForm from "@/src/components/forms/CalendarEventForm";
import { CalendarEventFormData } from "@/src/components/forms/CalendarEventForm/calendar-event-form.types";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";
import "./calendar-day-view.css";

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  date,
  events,
  onAddEvent,
  isLoading = false,
  className,
  onClose,
  isOpen,
}) => {
  const { showToast } = useToast();

  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<
    CalendarEventFormData | undefined
  >(undefined);
  const [babies, setBabies] = useState<any[]>([]);
  const [caretakers, setCaretakers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const fetchOptions = authToken
          ? {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          : {};

        const babiesResponse = await fetch("/api/baby", fetchOptions);
        const babiesData = await babiesResponse.json();

        const caretakersResponse = await fetch("/api/caretaker", fetchOptions);
        const caretakersData = await caretakersResponse.json();

        const contactsResponse = await fetch("/api/contact", fetchOptions);
        const contactsData = await contactsResponse.json();

        setBabies(babiesData.success ? babiesData.data : []);
        setCaretakers(caretakersData.success ? caretakersData.data : []);
        setContacts(contactsData.success ? contactsData.data : []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const formattedDate = useMemo(() => {
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }, [date]);

  const groupedEvents = useMemo(() => {
    const groups: EventGroups = {
      morning: [],
      afternoon: [],
      evening: [],
    };

    if (events && events.length > 0) {
      events.forEach((event) => {
        if (!event.startTime) {
          console.warn("Event missing startTime:", event);
          return;
        }

        const localDate = new Date(event.startTime);
        if (isNaN(localDate.getTime())) {
          console.warn("Invalid event date:", event.startTime);
          return;
        }

        const hour = localDate.getHours();

        if (hour < 12) {
          groups.morning.push(event);
        } else if (hour < 17) {
          groups.afternoon.push(event);
        } else {
          groups.evening.push(event);
        }
      });

      const sortByTime = (a: any, b: any) => {
        return (
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      };

      groups.morning.sort(sortByTime);
      groups.afternoon.sort(sortByTime);
      groups.evening.sort(sortByTime);
    }

    return groups;
  }, [events]);

  const handleEventClick = (event: any) => {
    const formData: CalendarEventFormData = {
      id: event.id,
      title: event.title,
      description: event.description || "",
      startTime: new Date(event.startTime),
      endTime: event.endTime ? new Date(event.endTime) : undefined,
      allDay: event.allDay,
      type: event.type,
      location: event.location || "",
      color: event.color || "",
      recurring: event.recurring,
      recurrencePattern: event.recurrencePattern,
      recurrenceEnd: event.recurrenceEnd
        ? new Date(event.recurrenceEnd)
        : undefined,
      customRecurrence: event.customRecurrence,
      reminderTime: event.reminderTime,
      babyIds: event.babies?.map((baby: any) => baby.id) || [],
      caretakerIds:
        event.caretakers?.map((caretaker: any) => caretaker.id) || [],
      contactIds: event.contacts?.map((contact: any) => contact.id) || [],
    };

    setSelectedEvent(formData);
    setShowEventForm(true);
  };

  const handleAddEvent = () => {
    setSelectedEvent(undefined);
    setShowEventForm(true);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleEventFormClose = () => {
    setShowEventForm(false);
  };

  const handleSaveEvent = async (
    eventData: CalendarEventFormData & { _deleted?: boolean }
  ) => {
    try {
      if (eventData._deleted) {
        setShowEventForm(false);

        if (onAddEvent) {
          onAddEvent(date);
        }

        return;
      }

      const method = eventData.id ? "PUT" : "POST";
      const url = eventData.id
        ? `/api/calendar-event?id=${eventData.id}`
        : "/api/calendar-event";

      const authToken = localStorage.getItem("authToken");
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        body: JSON.stringify({
          ...eventData,
          startTime: eventData.startTime.toISOString(),
          endTime: eventData.endTime?.toISOString(),
          recurrenceEnd: eventData.recurrenceEnd?.toISOString(),
        }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError, errorData } = await handleExpirationError(
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
              title: "Error",
              message: errorData.error || "Falha ao salvar o evento",
              duration: 5000,
            });
            return;
          }
        }

        const errorData = await response.json();
        console.error("Error saving event:", errorData.error);
        showToast({
          variant: "error",
          title: "Erro",
          message: errorData.error || "Falha ao salvar o evento",
          duration: 5000,
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        setShowEventForm(false);

        if (onAddEvent) {
          onAddEvent(date);
        }
      } else {
        console.error("Error saving event:", data.error);
        showToast({
          variant: "error",
          title: "Erro",
          message: data.error || "Falha ao salvar o evento",
          duration: 5000,
        });
      }
    } catch (error) {
      console.error("Error saving event:", error);
      showToast({
        variant: "error",
        title: "Erro",
        message: "Ocorreu um erro inesperado. Tente novamente.",
        duration: 5000,
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`/api/calendar-event?id=${eventId}`, {
        method: "DELETE",
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
      });
      const data = await response.json();
      if (data.success) {
        if (onAddEvent) {
          onAddEvent(date);
        }
      } else {
        console.error("Error deleting event:", data.error);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 text-teal-500 calendar-day-view-loader animate-spin" />
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <CalendarClock className="h-12 w-12 text-gray-400 calendar-day-view-empty-icon mb-2" />
          <p className="text-gray-500 calendar-day-view-empty-text text-sm">
            Nenhum evento agendado para este dia.
          </p>
        </div>
      );
    }

    return (
      <div className="calendar-day-view px-3">
        <div className="max-w-2xl mx-auto mt-2">
          {groupedEvents.morning.length > 0 && (
            <div className={styles.eventGroup}>
              <div className={styles.eventGroupHeader}>
                <Sun className={styles.eventGroupIcon} />
                <h3
                  className={cn(
                    styles.eventGroupTitle,
                    "calendar-day-view-group-title"
                  )}
                >
                  Manhã
                </h3>
              </div>

              <div className={styles.eventsList}>
                {groupedEvents.morning.map((event) => (
                  <CalendarEventItem
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedEvents.afternoon.length > 0 && (
            <div className={styles.eventGroup}>
              <div className={styles.eventGroupHeader}>
                <Coffee className={styles.eventGroupIcon} />
                <h3
                  className={cn(
                    styles.eventGroupTitle,
                    "calendar-day-view-group-title"
                  )}
                >
                  Tarde
                </h3>
              </div>

              <div className={styles.eventsList}>
                {groupedEvents.afternoon.map((event) => (
                  <CalendarEventItem
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                  />
                ))}
              </div>
            </div>
          )}

          {groupedEvents.evening.length > 0 && (
            <div className={styles.eventGroup}>
              <div className={styles.eventGroupHeader}>
                <Moon className={styles.eventGroupIcon} />
                <h3
                  className={cn(
                    styles.eventGroupTitle,
                    "calendar-day-view-group-title"
                  )}
                >
                  Noite
                </h3>
              </div>

              <div className={styles.eventsList}>
                {groupedEvents.evening.map((event) => (
                  <CalendarEventItem
                    key={event.id}
                    event={event}
                    onClick={handleEventClick}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <FormPage
        isOpen={isOpen}
        onClose={handleClose}
        title={formattedDate}
        className={cn(styles.container, className)}
      >
        <FormPageContent className="p-0">
          <div className="flex flex-col h-full">{renderContent()}</div>
        </FormPageContent>
        <FormPageFooter>
          <div className="flex justify-end space-x-2 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={false}
            >
              Fechar
            </Button>
            <Button onClick={handleAddEvent}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Evento
            </Button>
          </div>
        </FormPageFooter>
      </FormPage>
      <CalendarEventForm
        isOpen={showEventForm}
        onClose={handleEventFormClose}
        event={selectedEvent}
        onSave={handleSaveEvent}
        initialDate={date}
        babies={babies}
        caretakers={caretakers}
        contacts={contacts}
      />
    </>
  );
};

export default CalendarDayView;
