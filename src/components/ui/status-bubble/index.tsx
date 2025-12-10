import React, { useEffect, useState, useCallback } from "react";
import { Moon, Sun, Icon } from "lucide-react";
import { diaper, bottleBaby } from "@lucide/lab";
import { cn } from "@/src/lib/utils";
import { statusBubbleStyles as styles } from "./status-bubble.styles";
import { StatusBubbleProps, StatusStyle } from "./status-bubble.types";
import { useTimezone } from "@/app/context/timezone";

const getWarningMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export function StatusBubble({
  status,
  durationInMinutes,
  warningTime,
  className,
  startTime,
  activityType,
}: StatusBubbleProps & { startTime?: string }) {
  const { userTimezone, calculateDurationMinutes, formatDuration } =
    useTimezone();
  const [calculatedDuration, setCalculatedDuration] =
    useState(durationInMinutes);

  const updateDuration = useCallback(() => {
    if (startTime) {
      try {
        const now = new Date();
        if (
          !activityType ||
          (status === "sleeping" && activityType === "sleep") ||
          (status === "awake" && activityType === "sleep") ||
          (status === "feed" && activityType === "feed") ||
          (status === "diaper" && activityType === "diaper")
        ) {
          const diffMinutes = calculateDurationMinutes(
            startTime,
            now.toISOString()
          );
          setCalculatedDuration(diffMinutes);
        }
      } catch (error) {
        setCalculatedDuration(durationInMinutes);
      }
    }
  }, [
    startTime,
    calculateDurationMinutes,
    status,
    activityType,
    durationInMinutes,
  ]);

  useEffect(() => {
    if (startTime) {
      updateDuration();
      const interval = setInterval(updateDuration, 60000);
      const handleVisibilityChange = () => {
        if (document.visibilityState === "visible") {
          updateDuration();
        }
      };
      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        clearInterval(interval);
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [startTime, updateDuration]);

  const displayDuration = startTime ? calculatedDuration : durationInMinutes;
  const isWarning =
    warningTime && displayDuration >= getWarningMinutes(warningTime);

  const getStatusStyles = (): StatusStyle => {
    switch (status) {
      case "sleeping":
        return {
          bgColor: styles.statusStyles.sleeping.bgColor,
          icon: <Moon className={styles.icon} />,
        };
      case "awake":
        return {
          bgColor: styles.statusStyles.awake.bgColor,
          icon: (
            <Sun
              className={cn(styles.icon, styles.statusStyles.awake.iconColor)}
            />
          ),
        };
      case "feed":
        return {
          bgColor: isWarning
            ? styles.statusStyles.feed.warning
            : styles.statusStyles.feed.normal,
          icon: <Icon iconNode={bottleBaby} className={styles.icon} />,
        };
      case "diaper":
        return {
          bgColor: isWarning
            ? styles.statusStyles.diaper.warning
            : styles.statusStyles.diaper.normal,
          icon: <Icon iconNode={diaper} className={styles.icon} />,
        };
      default:
        return {
          bgColor: styles.statusStyles.default.bgColor,
          icon: null,
        };
    }
  };

  const { bgColor, icon } = getStatusStyles();

  return (
    <div className={cn(styles.base, bgColor, className)}>
      {icon}
      <span>{formatDuration(displayDuration)}</span>
    </div>
  );
}
