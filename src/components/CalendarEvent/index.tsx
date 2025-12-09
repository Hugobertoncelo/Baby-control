import React from "react";
import { cn } from "@/src/lib/utils";
import { CalendarEventProps } from "./calendar-event.types";
import { calendarEventStyles as styles } from "./calendar-event.styles";
import { Calendar, Clock, MapPin, Users, Repeat, Bell } from "lucide-react";
import "./calendar-event.css";

const CalendarEvent: React.FC<CalendarEventProps> = ({
  event,
  onClick,
  className,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("pt-BR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateTime = (dateString: string) => {
    if (event.allDay) {
      return formatDate(dateString);
    }
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  };

  const getRecurrenceText = () => {
    if (!event.recurring || !event.recurrencePattern) {
      return null;
    }

    let text = "";
    switch (event.recurrencePattern) {
      case "DAILY":
        text = "Diária";
        break;
      case "WEEKLY":
        text = "Semanalmente";
        break;
      case "BIWEEKLY":
        text = "A cada 2 semanas";
        break;
      case "MONTHLY":
        text = "Mensal";
        break;
      case "YEARLY":
        text = "Anual";
        break;
      case "CUSTOM":
        text = event.customRecurrence || "Personalizada";
        break;
      default:
        text = "Recorrente";
    }

    if (event.recurrenceEnd) {
      text += ` until ${formatDate(event.recurrenceEnd)}`;
    }

    return text;
  };

  const getReminderText = () => {
    if (event.reminderTime === null) {
      return null;
    }

    if (event.reminderTime === 0) {
      return "Na hora do evento";
    }

    if (event.reminderTime < 60) {
      return `${event.reminderTime} minutos antes`;
    }

    if (event.reminderTime === 60) {
      return "1 hora antes";
    }

    if (event.reminderTime < 1440) {
      return `${event.reminderTime / 60} horas antes`;
    }

    if (event.reminderTime === 1440) {
      return "1 dia antes";
    }

    return `${event.reminderTime / 1440} dias antes`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  return (
    <div
      className={cn(styles.container, "calendar-event", className)}
      onClick={handleClick}
      style={{
        borderLeftColor: event.color || "#14b8a6",
        cursor: onClick ? "ponteiro" : "padrão",
      }}
    >
      <div className={styles.header}>
        <h3 className={styles.title}>{event.title}</h3>
        <div className={styles.type}>{event.type.replace("_", " ")}</div>
      </div>

      <div className={styles.content}>
        <div className={styles.detail}>
          <Calendar className={styles.icon} />
          <div>
            <div>{formatDateTime(event.startTime)}</div>
            {event.endTime && !event.allDay && (
              <div className={styles.endTime}>
                to {formatTime(event.endTime)}
              </div>
            )}
          </div>
        </div>

        {event.location && (
          <div className={styles.detail}>
            <MapPin className={styles.icon} />
            <div>{event.location}</div>
          </div>
        )}

        {event.recurring && (
          <div className={styles.detail}>
            <Repeat className={styles.icon} />
            <div>{getRecurrenceText()}</div>
          </div>
        )}

        {event.reminderTime !== null && (
          <div className={styles.detail}>
            <Bell className={styles.icon} />
            <div>{getReminderText()}</div>
          </div>
        )}

        {(event.babies.length > 0 ||
          event.caretakers.length > 0 ||
          event.contacts.length > 0) && (
          <div className={styles.detail}>
            <Users className={styles.icon} />
            <div className={styles.people}>
              {event.babies.length > 0 && (
                <div className={styles.peopleGroup}>
                  <span className={styles.peopleLabel}>Babies:</span>
                  <span className={styles.peopleList}>
                    {event.babies
                      .map((baby) => `${baby.firstName} ${baby.lastName}`)
                      .join(", ")}
                  </span>
                </div>
              )}

              {event.caretakers.length > 0 && (
                <div className={styles.peopleGroup}>
                  <span className={styles.peopleLabel}>Caretakers:</span>
                  <span className={styles.peopleList}>
                    {event.caretakers
                      .map((caretaker) => caretaker.name)
                      .join(", ")}
                  </span>
                </div>
              )}

              {event.contacts.length > 0 && (
                <div className={styles.peopleGroup}>
                  <span className={styles.peopleLabel}>Contacts:</span>
                  <span className={styles.peopleList}>
                    {event.contacts.map((contact) => contact.name).join(", ")}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {event.description && (
          <div className={styles.description}>{event.description}</div>
        )}
      </div>
    </div>
  );
};

export default CalendarEvent;
