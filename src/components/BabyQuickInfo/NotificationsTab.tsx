import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Bath, MapPin, Ruler, Scale, RotateCw, StickyNote } from "lucide-react";
import { diaper } from "@lucide/lab";
import { Icon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { styles, eventTypeColors } from "./baby-quick-info.styles";
import { NotificationsTabProps } from "./baby-quick-info.types";

const getEventTypeClass = (type: string): string => {
  switch (type) {
    case "APPOINTMENT":
      return styles.eventAppointment;
    case "CARETAKER_SCHEDULE":
      return styles.eventCaretakerSchedule;
    case "REMINDER":
      return styles.eventReminder;
    case "CUSTOM":
      return styles.eventCustom;
    default:
      return styles.eventDefault;
  }
};

const getEventTypeColor = (type: string): string => {
  return (
    eventTypeColors[type as keyof typeof eventTypeColors] ||
    eventTypeColors.DEFAULT
  );
};

const NotificationsTab: React.FC<NotificationsTabProps> = ({
  lastActivities,
  upcomingEvents,
  selectedBaby,
}) => {
  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      const relativeTime = formatDistanceToNow(date, { addSuffix: true });

      return <span className="text-gray-500">{relativeTime}</span>;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  return (
    <div
      className={cn(
        styles.notificationsContainer,
        "baby-quick-info-notifications-container"
      )}
    >
      <div
        className={cn(
          styles.sectionContainer,
          "baby-quick-info-section-container"
        )}
      >
        <h3
          className={cn(styles.sectionTitle, "baby-quick-info-section-title")}
        >
          Últimas Atividades
        </h3>

        <div>
          {lastActivities?.lastPoopDiaper ? (
            <div
              className={cn(
                styles.activityItem,
                "baby-quick-info-activity-item"
              )}
            >
              <div
                className={cn(
                  styles.activityIconContainer,
                  "baby-quick-info-activity-icon-container"
                )}
              >
                <Icon iconNode={diaper} className="h-4 w-4" />
              </div>
              <div
                className={cn(
                  styles.activityContent,
                  "baby-quick-info-activity-content"
                )}
              >
                <div
                  className={cn(
                    styles.activityTitle,
                    "baby-quick-info-activity-title"
                  )}
                >
                  {selectedBaby.firstName}'s last poop was{" "}
                  {formatRelativeTime(lastActivities.lastPoopDiaper.time)}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                styles.emptyMessage,
                "baby-quick-info-empty-message"
              )}
            >
              Ainda não foram registradas evacuações.
            </div>
          )}

          {lastActivities?.lastBath ? (
            <div
              className={cn(
                styles.activityItem,
                "baby-quick-info-activity-item"
              )}
            >
              <div
                className={cn(
                  styles.activityIconContainer,
                  "baby-quick-info-activity-icon-container"
                )}
              >
                <Bath className="h-4 w-4" />
              </div>
              <div
                className={cn(
                  styles.activityContent,
                  "baby-quick-info-activity-content"
                )}
              >
                <div
                  className={cn(
                    styles.activityTitle,
                    "baby-quick-info-activity-title"
                  )}
                >
                  {selectedBaby.firstName}'s last bath was{" "}
                  {formatRelativeTime(lastActivities.lastBath.time)}
                </div>
                <div
                  className={cn(
                    styles.activityTime,
                    "baby-quick-info-activity-time"
                  )}
                >
                  {lastActivities.lastBath.soapUsed
                    ? "Com sabonete"
                    : "Sem sabonete"}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                styles.emptyMessage,
                "baby-quick-info-empty-message"
              )}
            >
              Ainda não há registros de banhos.
            </div>
          )}

          {lastActivities?.lastMeasurements?.height ? (
            <div
              className={cn(
                styles.activityItem,
                "baby-quick-info-activity-item"
              )}
            >
              <div
                className={cn(
                  styles.activityIconContainer,
                  "baby-quick-info-activity-icon-container"
                )}
              >
                <Ruler className="h-4 w-4" />
              </div>
              <div
                className={cn(
                  styles.activityContent,
                  "baby-quick-info-activity-content"
                )}
              >
                <div
                  className={cn(
                    styles.activityTitle,
                    "baby-quick-info-activity-title"
                  )}
                >
                  {selectedBaby.firstName}'s height:{" "}
                  <span className={cn(styles.relativeTime)}>
                    {lastActivities.lastMeasurements.height.value}{" "}
                    {lastActivities.lastMeasurements.height.unit}
                  </span>
                </div>
                <div
                  className={cn(
                    styles.activityTime,
                    "baby-quick-info-activity-time"
                  )}
                >
                  {formatRelativeTime(
                    lastActivities.lastMeasurements.height.date
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                styles.emptyMessage,
                "baby-quick-info-empty-message"
              )}
            >
              Ainda não foram registradas medições de altura.
            </div>
          )}

          {lastActivities?.lastMeasurements?.weight ? (
            <div
              className={cn(
                styles.activityItem,
                "baby-quick-info-activity-item"
              )}
            >
              <div
                className={cn(
                  styles.activityIconContainer,
                  "baby-quick-info-activity-icon-container"
                )}
              >
                <Scale className="h-4 w-4" />
              </div>
              <div
                className={cn(
                  styles.activityContent,
                  "baby-quick-info-activity-content"
                )}
              >
                <div
                  className={cn(
                    styles.activityTitle,
                    "baby-quick-info-activity-title"
                  )}
                >
                  {selectedBaby.firstName}'s weight:{" "}
                  <span className={cn(styles.relativeTime)}>
                    {lastActivities.lastMeasurements.weight.value}{" "}
                    {lastActivities.lastMeasurements.weight.unit}
                  </span>
                </div>
                <div
                  className={cn(
                    styles.activityTime,
                    "baby-quick-info-activity-time"
                  )}
                >
                  {formatRelativeTime(
                    lastActivities.lastMeasurements.weight.date
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                styles.emptyMessage,
                "baby-quick-info-empty-message"
              )}
            >
              Ainda não foram registradas medições de peso.
            </div>
          )}

          {lastActivities?.lastMeasurements?.headCircumference ? (
            <div
              className={cn(
                styles.activityItem,
                "baby-quick-info-activity-item"
              )}
            >
              <div
                className={cn(
                  styles.activityIconContainer,
                  "baby-quick-info-activity-icon-container"
                )}
              >
                <RotateCw className="h-4 w-4" />
              </div>
              <div
                className={cn(
                  styles.activityContent,
                  "baby-quick-info-activity-content"
                )}
              >
                <div
                  className={cn(
                    styles.activityTitle,
                    "baby-quick-info-activity-title"
                  )}
                >
                  {selectedBaby.firstName}'s head circumference:{" "}
                  <span className={cn(styles.relativeTime)}>
                    {lastActivities.lastMeasurements.headCircumference.value}{" "}
                    {lastActivities.lastMeasurements.headCircumference.unit}
                  </span>
                </div>
                <div
                  className={cn(
                    styles.activityTime,
                    "baby-quick-info-activity-time"
                  )}
                >
                  {formatRelativeTime(
                    lastActivities.lastMeasurements.headCircumference.date
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                styles.emptyMessage,
                "baby-quick-info-empty-message"
              )}
            >
              Ainda não foram registradas medidas de circunferência da cabeça.
            </div>
          )}

          {lastActivities?.lastNote ? (
            <div
              className={cn(
                styles.activityItem,
                "baby-quick-info-activity-item"
              )}
            >
              <div
                className={cn(
                  styles.activityIconContainer,
                  "baby-quick-info-activity-icon-container"
                )}
              >
                <StickyNote className="h-4 w-4" />
              </div>
              <div
                className={cn(
                  styles.activityContent,
                  "baby-quick-info-activity-content"
                )}
              >
                <div
                  className={cn(
                    styles.activityTitle,
                    "baby-quick-info-activity-title"
                  )}
                >
                  A última nota dizia:{" "}
                  <span>
                    {lastActivities.lastNote.content.length > 100
                      ? `${lastActivities.lastNote.content.substring(
                          0,
                          100
                        )}...`
                      : lastActivities.lastNote.content}
                  </span>
                </div>
                <div
                  className={cn(
                    styles.activityTime,
                    "baby-quick-info-activity-time"
                  )}
                >
                  {formatRelativeTime(lastActivities.lastNote.time)}
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                styles.emptyMessage,
                "baby-quick-info-empty-message"
              )}
            >
              Nenhuma nota registrada ainda
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          styles.sectionContainer,
          "baby-quick-info-section-container"
        )}
      >
        <h3
          className={cn(styles.sectionTitle, "baby-quick-info-section-title")}
        >
          Próximos eventos
        </h3>

        <div
          className={cn(
            styles.eventsContainer,
            "baby-quick-info-events-container"
          )}
        >
          {upcomingEvents && upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className={cn(
                  styles.eventItem,
                  getEventTypeClass(event.type),
                  "baby-quick-info-event-item",
                  `baby-quick-info-event-${event.type
                    .toLowerCase()
                    .replace("_", "-")}`
                )}
                style={
                  event.color ? { borderLeftColor: event.color } : undefined
                }
              >
                <div
                  className={cn(
                    styles.eventTitle,
                    "baby-quick-info-event-title"
                  )}
                >
                  {event.title}
                </div>
                <div
                  className={cn(styles.eventTime, "baby-quick-info-event-time")}
                >
                  {new Date(event.startTime).toLocaleDateString()} no{" "}
                  {new Date(event.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {event.location && (
                  <div
                    className={cn(
                      styles.eventLocation,
                      "baby-quick-info-event-location"
                    )}
                  >
                    <MapPin
                      className={cn(
                        styles.eventLocationIcon,
                        "baby-quick-info-event-location-icon"
                      )}
                    />
                    {event.location}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div
              className={cn(
                styles.emptyMessage,
                "baby-quick-info-empty-message"
              )}
            >
              Não há eventos futuros
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsTab;
