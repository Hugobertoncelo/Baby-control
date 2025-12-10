import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Baby as BabyIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { ActivityType, TimelineActivityListProps, FilterType } from "./types";
import {
  getActivityIcon,
  getActivityStyle,
  getActivityDescription,
  getActivityTime,
} from "./utils";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/src/context/theme";
import "./timeline-activity-list.css";

const TimelineActivityList = ({
  activities,
  settings,
  isLoading,
  isAnimated = true,
  selectedDate,
  onActivitySelect,
  onSwipeLeft,
  onSwipeRight,
}: TimelineActivityListProps) => {
  const activeFilter = (onSwipeLeft as any)?.activeFilter as
    | FilterType
    | undefined;

  const filteredActivities = useMemo(() => {
    if (!activeFilter || activeFilter === null) {
      return activities;
    }

    return activities.filter((activity) => {
      switch (activeFilter) {
        case "sleep":
          return "Duração" in activity;
        case "feed":
          return "Quantia" in activity;
        case "diaper":
          return "Condição" in activity;
        case "note":
          return "Nota" in activity;
        case "bath":
          return "Sabonete Usado" in activity;
        case "pump":
          return (
            "Quantidade Esquerda" in activity ||
            "Quantidade Direita" in activity
          );
        case "milestone":
          return "Título" in activity && "Categoria" in activity;
        case "measurement":
          return "Valor" in activity && "Unidade" in activity;
        default:
          return true;
      }
    });
  }, [activities, activeFilter]);
  const { theme } = useTheme();

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [swipeProgress, setSwipeProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;
  const maxSwipeDistance = 150;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeProgress(0);
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    const distance = touchStart - currentTouch;
    const absDistance = Math.abs(distance);

    const progress = Math.min(absDistance / maxSwipeDistance, 1);
    setSwipeProgress(progress);

    if (distance > 0) {
      setSwipeDirection("left");
    } else if (distance < 0) {
      setSwipeDirection("right");
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isSwipe = Math.abs(distance) > minSwipeDistance;

    if (isSwipe) {
      if (distance > 0) {
        onSwipeLeft?.();
      } else {
        onSwipeRight?.();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
    setSwipeDirection(null);
    setSwipeProgress(0);
  };

  const groupedActivities = useMemo(() => {
    const groups: { [key: string]: ActivityType[] } = {};

    filteredActivities.forEach((activity) => {
      let groupingTime: Date;

      if (
        "duration" in activity &&
        "startTime" in activity &&
        activity.endTime
      ) {
        const startTime = new Date(activity.startTime);
        const endTime = new Date(activity.endTime);

        const startDate = startTime.toDateString();
        const endDate = endTime.toDateString();

        if (startDate === endDate) {
          groupingTime = startTime;
        } else {
          const viewingDate = selectedDate || new Date();
          const viewingDateStr = viewingDate.toDateString();
          const startDateStr = startTime.toDateString();
          const endDateStr = endTime.toDateString();

          if (startDateStr === viewingDateStr) {
            groupingTime = startTime;
          } else if (endDateStr === viewingDateStr) {
            groupingTime = endTime;
          } else {
            groupingTime = startTime;
          }
        }
      } else {
        groupingTime = new Date(getActivityTime(activity));
      }

      const hourKey = `${groupingTime.getFullYear()}-${groupingTime.getMonth()}-${groupingTime.getDate()}-${groupingTime.getHours()}`;

      if (!groups[hourKey]) {
        groups[hourKey] = [];
      }
      groups[hourKey].push(activity);
    });

    const sortedGroups = Object.entries(groups)
      .map(([hourKey, activities]) => {
        const firstActivity = activities[0];

        let hourTime: Date;
        if (
          "duration" in firstActivity &&
          "startTime" in firstActivity &&
          firstActivity.endTime
        ) {
          const startTime = new Date(firstActivity.startTime);
          const endTime = new Date(firstActivity.endTime);

          const startDate = startTime.toDateString();
          const endDate = endTime.toDateString();

          if (startDate === endDate) {
            hourTime = startTime;
          } else {
            const viewingDate = selectedDate || new Date();
            const viewingDateStr = viewingDate.toDateString();
            const startDateStr = startTime.toDateString();
            const endDateStr = endTime.toDateString();

            if (startDateStr === viewingDateStr) {
              hourTime = startTime;
            } else if (endDateStr === viewingDateStr) {
              hourTime = endTime;
            } else {
              hourTime = startTime;
            }
          }
        } else {
          hourTime = new Date(getActivityTime(firstActivity));
        }

        const hourLabel = hourTime.toLocaleTimeString("pt-BR", {
          hour: "numeric",
          hour12: true,
        });

        const sortedActivities = activities.sort((a, b) => {
          const timeA = new Date(getActivityTime(a));
          const timeB = new Date(getActivityTime(b));
          return timeB.getTime() - timeA.getTime();
        });

        return {
          hourKey,
          hourLabel,
          hourTime,
          activities: sortedActivities,
        };
      })
      .sort((a, b) => b.hourTime.getTime() - a.hourTime.getTime());

    return sortedGroups;
  }, [filteredActivities]);

  useEffect(() => {
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeDirection(null);
    setSwipeProgress(0);
  }, [activities]);
  return (
    <>
      <div
        className="flex-1 overflow-y-auto relative bg-white timeline-activity-scroll-container"
        ref={contentRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {swipeProgress > 0 && (
          <>
            {swipeDirection === "right" && (
              <div
                className="absolute inset-y-0 left-0 pointer-events-none z-10 bg-gradient-to-r from-gray-400/50 to-transparent timeline-swipe-shadow-left"
                style={{
                  width: `${swipeProgress * 30}%`,
                  opacity: swipeProgress * 0.7,
                }}
              ></div>
            )}

            {swipeDirection === "left" && (
              <div
                className="absolute inset-y-0 right-0 pointer-events-none z-10 bg-gradient-to-l from-gray-400/50 to-transparent timeline-swipe-shadow-right"
                style={{
                  width: `${swipeProgress * 30}%`,
                  opacity: swipeProgress * 0.7,
                }}
              ></div>
            )}
          </>
        )}

        <div className="min-h-full bg-white relative timeline-activity-list">
          {activities.length > 0 ? (
            <div className="relative">
              <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-gray-200 timeline-vertical-line"></div>

              <AnimatePresence>
                {groupedActivities.map((group, groupIndex) => (
                  <motion.div
                    key={group.hourKey}
                    className="relative timeline-hour-group"
                    initial={isAnimated ? { opacity: 0, y: -10 } : false}
                    animate={isAnimated ? { opacity: 1, y: 0 } : false}
                    transition={
                      isAnimated
                        ? {
                            delay: groupIndex * 0.05,
                            duration: 0.2,
                            ease: "easeOut",
                          }
                        : { duration: 0 }
                    }
                  >
                    <div className="flex items-center px-4 sticky top-0 z-20">
                      <div className="flex items-center justify-center w-12 h-8 bg-gray-100 rounded-lg mr-6 relative z-10 timeline-hour-marker">
                        <span className="text-sm font-semibold text-gray-600 timeline-hour-text">
                          {group.hourLabel}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 pb-8">
                      {group.activities.map((activity, activityIndex) => {
                        const style = getActivityStyle(activity);
                        const description = getActivityDescription(
                          activity,
                          settings
                        );
                        const activityTime = new Date(
                          getActivityTime(activity)
                        );
                        let timeStr: string;

                        if ("duration" in activity && "startTime" in activity) {
                          const startTime = new Date(activity.startTime);
                          const startTimeStr = startTime.toLocaleTimeString(
                            "pt-BR",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          );

                          if (activity.endTime) {
                            const endTime = new Date(activity.endTime);
                            const endTimeStr = endTime.toLocaleTimeString(
                              "pt-BR",
                              {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              }
                            );
                            timeStr = `${startTimeStr} - ${endTimeStr}`;
                          } else {
                            timeStr = startTimeStr;
                          }
                        } else {
                          timeStr = activityTime.toLocaleTimeString("pt-BR", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                        }

                        const getActivityColor = (bgClass: string) => {
                          if (
                            bgClass.includes("bg-gradient-to-br from-gray-400")
                          )
                            return "#9ca3af";
                          if (bgClass.includes("bg-sky-200")) return "#7dd3fc";
                          if (
                            bgClass.includes("bg-gradient-to-r from-teal-600")
                          )
                            return "#0d9488";
                          if (bgClass.includes("bg-[#FFFF99]"))
                            return "#fef08a";
                          if (
                            bgClass.includes("bg-gradient-to-r from-orange-400")
                          )
                            return "#fb923c";
                          if (
                            bgClass.includes("bg-gradient-to-r from-purple-200")
                          )
                            return "#c084fc";
                          if (bgClass.includes("bg-[#4875EC]"))
                            return "#4875EC";
                          if (bgClass.includes("bg-[#EA6A5E]"))
                            return "#EA6A5E";
                          if (bgClass.includes("bg-[#43B755]"))
                            return "#43B755";
                          return "#9ca3af";
                        };

                        const activityColor = getActivityColor(style.bg);

                        return (
                          <motion.div
                            key={activity.id}
                            className="relative timeline-activity-wrapper"
                            initial={
                              isAnimated
                                ? { opacity: 0, x: -20, scale: 0.95 }
                                : false
                            }
                            animate={
                              isAnimated
                                ? { opacity: 1, x: 0, scale: 1 }
                                : false
                            }
                            transition={
                              isAnimated
                                ? {
                                    delay:
                                      groupIndex * 0.1 + activityIndex * 0.05,
                                    duration: 0.3,
                                    type: "tween",
                                    ease: "easeOut",
                                  }
                                : { duration: 0 }
                            }
                          >
                            <div
                              className="absolute left-16 h-0.5 timeline-connector-line w-4 md:w-12"
                              style={{
                                backgroundColor: activityColor,
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                            ></div>

                            <div
                              className="absolute w-2 h-2 rounded-full z-10 timeline-dot"
                              style={{
                                backgroundColor: activityColor,
                                left: "calc(4rem - 4px)",
                                top: "50%",
                                transform: "translateY(-50%)",
                              }}
                            ></div>

                            <div className="ml-20 md:ml-28 mr-4">
                              <Card
                                className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 timeline-activity-card rounded-xl"
                                style={
                                  {
                                    "--activity-color": activityColor,
                                  } as React.CSSProperties
                                }
                                data-activity-color={activityColor}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className={`flex-shrink-0 ${style.bg} p-2 rounded-xl shadow-sm`}
                                    >
                                      {getActivityIcon(activity)}
                                    </div>

                                    <div
                                      className="flex-1 min-w-0"
                                      onClick={() => {
                                        setTimeout(
                                          () => onActivitySelect(activity),
                                          0
                                        );
                                      }}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 timeline-activity-type">
                                          {description.type}
                                        </span>
                                        <span className="text-xs text-gray-500 timeline-activity-time">
                                          {timeStr}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-900 timeline-activity-details truncate">
                                        {(() => {
                                          if ("duration" in activity) {
                                            const location =
                                              "location" in activity &&
                                              activity.location &&
                                              activity.location !== "OTHER"
                                                ? activity.location
                                                    .split("_")
                                                    .map(
                                                      (word: string) =>
                                                        word
                                                          .charAt(0)
                                                          .toUpperCase() +
                                                        word
                                                          .slice(1)
                                                          .toLowerCase()
                                                    )
                                                    .join(" ")
                                                : "";
                                            const duration = activity.duration
                                              ? `${Math.floor(
                                                  activity.duration / 60
                                                )}h ${activity.duration % 60}m`
                                              : "";
                                            const quality =
                                              "quality" in activity &&
                                              activity.quality
                                                ? activity.quality
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                  activity.quality
                                                    .slice(1)
                                                    .toLowerCase()
                                                : "";
                                            return [location, duration, quality]
                                              .filter(Boolean)
                                              .join(" • ");
                                          }

                                          if ("amount" in activity) {
                                            if (activity.type === "BREAST") {
                                              const side = activity.side
                                                ? activity.side.charAt(0) +
                                                  activity.side
                                                    .slice(1)
                                                    .toLowerCase()
                                                : "";
                                              let duration = "";
                                              if (activity.feedDuration) {
                                                const minutes = Math.floor(
                                                  activity.feedDuration / 60
                                                );
                                                const seconds =
                                                  activity.feedDuration % 60;
                                                duration =
                                                  seconds > 0
                                                    ? `${minutes}m ${seconds}s`
                                                    : `${minutes} min`;
                                              } else if (activity.amount) {
                                                duration = `${activity.amount} min`;
                                              }
                                              return [side + " side", duration]
                                                .filter(Boolean)
                                                .join(" • ");
                                            } else if (
                                              activity.type === "BOTTLE"
                                            ) {
                                              const unit = (
                                                (activity as any).unitAbbr ||
                                                "oz"
                                              ).toLowerCase();
                                              return `${activity.amount} ${unit}`;
                                            } else if (
                                              activity.type === "SOLIDS"
                                            ) {
                                              const unit = (
                                                (activity as any).unitAbbr ||
                                                "g"
                                              ).toLowerCase();
                                              const food = activity.food
                                                ? ` of ${activity.food}`
                                                : "";
                                              return `${activity.amount} ${unit}${food}`;
                                            }
                                          }

                                          if ("condition" in activity) {
                                            const details = [];
                                            if (activity.condition) {
                                              details.push(
                                                activity.condition.charAt(0) +
                                                  activity.condition
                                                    .slice(1)
                                                    .toLowerCase()
                                              );
                                            }
                                            if (activity.color) {
                                              details.push(
                                                activity.color.charAt(0) +
                                                  activity.color
                                                    .slice(1)
                                                    .toLowerCase()
                                              );
                                            }
                                            if (activity.blowout) {
                                              details.push("Estouro/Vazamento");
                                            }
                                            return details.join(" • ");
                                          }

                                          if ("content" in activity) {
                                            return activity.content.length > 50
                                              ? activity.content.substring(
                                                  0,
                                                  50
                                                ) + "..."
                                              : activity.content;
                                          }

                                          if ("soapUsed" in activity) {
                                            const details = [];
                                            if (activity.soapUsed)
                                              details.push("Sabão");
                                            if (activity.shampooUsed)
                                              details.push("Shampoo");
                                            if (details.length === 0)
                                              details.push("Somente água");
                                            if (activity.notes) {
                                              const notes =
                                                activity.notes.length > 30
                                                  ? activity.notes.substring(
                                                      0,
                                                      30
                                                    ) + "..."
                                                  : activity.notes;
                                              details.push(notes);
                                            }
                                            return details.join(" • ");
                                          }

                                          if (
                                            "leftAmount" in activity ||
                                            "rightAmount" in activity
                                          ) {
                                            const amounts = [];
                                            const unit = (
                                              (activity as any).unit || "oz"
                                            ).toLowerCase();
                                            if ((activity as any).leftAmount)
                                              amounts.push(
                                                `L: ${
                                                  (activity as any).leftAmount
                                                } ${unit}`
                                              );
                                            if ((activity as any).rightAmount)
                                              amounts.push(
                                                `R: ${
                                                  (activity as any).rightAmount
                                                } ${unit}`
                                              );
                                            if ((activity as any).totalAmount)
                                              amounts.push(
                                                `Total: ${
                                                  (activity as any).totalAmount
                                                } ${unit}`
                                              );
                                            return amounts.join(" • ");
                                          }

                                          if (
                                            "title" in activity &&
                                            "category" in activity
                                          ) {
                                            const title =
                                              activity.title.length > 40
                                                ? activity.title.substring(
                                                    0,
                                                    40
                                                  ) + "..."
                                                : activity.title;
                                            return title;
                                          }

                                          if (
                                            "value" in activity &&
                                            "unit" in activity
                                          ) {
                                            let unit =
                                              "type" in activity &&
                                              activity.type === "TEMPERATURE"
                                                ? activity.unit
                                                : activity.unit.toLowerCase();

                                            if (
                                              "type" in activity &&
                                              activity.type !== "TEMPERATURE" &&
                                              activity.value >= 1
                                            ) {
                                              if (unit === "lb") {
                                                unit = "lbs";
                                              }
                                            }

                                            return `${activity.value} ${unit}`;
                                          }

                                          if (
                                            "doseAmount" in activity &&
                                            "medicineId" in activity
                                          ) {
                                            const unit = activity.unitAbbr
                                              ? activity.unitAbbr.toLowerCase()
                                              : "";
                                            const dose = activity.doseAmount
                                              ? `${activity.doseAmount} ${unit}`.trim()
                                              : "";
                                            let medName = "Medicine";
                                            if (
                                              "medicine" in activity &&
                                              activity.medicine &&
                                              typeof activity.medicine ===
                                                "object" &&
                                              "name" in activity.medicine
                                            ) {
                                              medName =
                                                (
                                                  activity.medicine as {
                                                    name?: string;
                                                  }
                                                ).name || medName;
                                            }
                                            return `${medName} - ${dose}`;
                                          }

                                          return "Atividade registrada";
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                    <BabyIcon className="h-8 w-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1 timeline-empty-state">
                    Nenhuma atividade registrada
                  </h3>
                  <p className="text-sm text-gray-500 timeline-empty-description">
                    As atividades aparecerão aqui assim que você começar a
                    registrá-las.
                  </p>
                </div>
              </div>
            )
          )}
        </div>
        {isLoading && activities.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center h-full">
            <div className="text-center p-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1 timeline-empty-state">
                Carregando atividades...
              </h3>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TimelineActivityList;
