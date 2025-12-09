import React from "react";
import { cn } from "@/src/lib/utils";
import { CalendarEventItemProps } from "./calendar-event-item.types";
import { calendarEventItemStyles as styles } from "./calendar-event-item.styles";
import { CalendarEventType } from "@prisma/client";
import { MapPin, Clock, RepeatIcon, Users } from "lucide-react";
import "./calendar-event-item.css";

export const CalendarEventItem: React.FC<CalendarEventItemProps> = ({
  event,
  onClick,
  className,
}) => {
  const formatEventTime = (
    startTimeStr: string,
    allDay: boolean,
    endTimeStr?: string | null
  ) => {
    const startTime = new Date(startTimeStr);
    const endTime = endTimeStr ? new Date(endTimeStr) : undefined;
    if (allDay) return "All day";

    const formatOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const startFormatted = startTime.toLocaleTimeString("pt-BR", formatOptions);

    if (!endTime) return startFormatted;

    const endFormatted = endTime.toLocaleTimeString("pt-BR", formatOptions);
    return `${startFormatted} - ${endFormatted}`;
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Amanhã";
    }

    return date.toLocaleDateString("pt-BR", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getColorIndicatorClass = () => {
    const baseClass = styles.colorIndicator.base;

    switch (event.type) {
      case CalendarEventType.APPOINTMENT:
        return cn(baseClass, styles.colorIndicator.appointment);
      case CalendarEventType.CARETAKER_SCHEDULE:
        return cn(baseClass, styles.colorIndicator.caretakerSchedule);
      case CalendarEventType.REMINDER:
        return cn(baseClass, styles.colorIndicator.reminder);
      case CalendarEventType.CUSTOM:
        return cn(baseClass, styles.colorIndicator.custom);
      default:
        return cn(baseClass, styles.colorIndicator.custom);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick(event);
    }
  };

  const totalParticipants =
    event.babies.length + event.caretakers.length + event.contacts.length;

  return (
    <div
      className={cn(
        styles.container,
        "calendar-event-item-container",
        className
      )}
      onClick={handleClick}
    >
      <div className={getColorIndicatorClass()} />

      <div className={cn(styles.content, "calendar-event-item")}>
        <h3 className={cn(styles.title, "calendar-event-item-title")}>
          {event.title}
        </h3>

        <div className={cn(styles.details, "calendar-event-item-details")}>
          <Clock className={cn(styles.icon.base, styles.icon.time)} />
          <span>
            {formatEventDate(event.startTime)},{" "}
            {formatEventTime(event.startTime, event.allDay, event.endTime)}
          </span>

          {event.location && (
            <span className={styles.location}>
              <MapPin className={cn(styles.icon.base, styles.icon.location)} />
              {event.location}
            </span>
          )}

          {event.recurring && (
            <RepeatIcon
              className={cn(
                styles.icon.base,
                styles.icon.recurring,
                "recurring-icon-small",
                "ml-2"
              )}
            />
          )}
        </div>
      </div>

      {totalParticipants > 0 && (
        <div className={styles.badgesContainer}>
          <div
            className={cn(
              styles.badge.base,
              styles.badge.baby,
              "calendar-event-item-badge"
            )}
          >
            <Users className="h-3 w-3" />
          </div>
          <span className={styles.badgeCount}>{totalParticipants}</span>
        </div>
      )}
    </div>
  );
};

export default CalendarEventItem;
