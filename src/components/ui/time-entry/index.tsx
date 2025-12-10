"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/src/lib/utils";
import { TimeEntryProps } from "./time-entry.types";
import { timeEntryStyles as styles } from "./time-entry.styles";
import "./time-entry.css";

export function TimeEntry({
  value,
  onChange,
  className,
  disabled = false,
  minTime,
  maxTime,
}: TimeEntryProps) {
  const getInitialValues = () => {
    const date =
      value instanceof Date && !isNaN(value.getTime()) ? value : new Date();

    const hours = date.getHours();
    const minutes = date.getMinutes();

    return {
      hours: hours > 12 ? hours - 12 : hours === 0 ? 12 : hours,
      minutes,
      isPM: hours >= 12,
      mode: "hours" as "hours" | "minutes",
    };
  };

  const [state, setState] = useState(getInitialValues);
  const clockFaceRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [exactMinute, setExactMinute] = useState<number | null>(null);
  const isDraggingRef = useRef(false);
  const [previousAngle, setPreviousAngle] = useState<number | null>(null);

  const isTimeValid = useCallback(
    (date: Date): boolean => {
      if (minTime && date < minTime) return false;
      if (maxTime && date > maxTime) return false;
      return true;
    },
    [minTime, maxTime]
  );

  useEffect(() => {
    if (!value) return;

    setState((prevState) => {
      const date =
        value instanceof Date && !isNaN(value.getTime()) ? value : new Date();

      const hours = date.getHours();
      const minutes = date.getMinutes();

      return {
        hours: hours > 12 ? hours - 12 : hours === 0 ? 12 : hours,
        minutes,
        isPM: hours >= 12,
        mode: prevState.mode,
      };
    });
  }, [value]);

  useEffect(() => {
    if (disabled || !clockFaceRef.current || !handRef.current) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        e.target === handRef.current ||
        (handRef.current &&
          e.target instanceof Node &&
          handRef.current.contains(e.target as Node))
      ) {
        e.preventDefault();
        setIsDragging(true);
        isDraggingRef.current = true;
        setPreviousAngle(null);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !clockFaceRef.current) return;

      const rect = clockFaceRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = e.clientX - centerX;
      const y = e.clientY - centerY;

      let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      if (previousAngle === null) {
        setPreviousAngle(angle);
      }

      const baseDate =
        value instanceof Date && !isNaN(value.getTime())
          ? new Date(value)
          : new Date();

      if (state.mode === "hours") {
        let hour = Math.round(angle / 30);
        if (hour === 0 || hour > 12) hour = 12;

        let shouldFlipAmPm = false;

        if (previousAngle !== null) {
          const prevHour = Math.round(previousAngle / 30);
          const prevHourNormalized =
            prevHour === 0 || prevHour > 12 ? 12 : prevHour;

          const angleDiff = angle - previousAngle;
          let normalizedDiff = angleDiff;

          if (normalizedDiff > 180) normalizedDiff -= 360;
          if (normalizedDiff < -180) normalizedDiff += 360;

          const crossed12Line =
            (prevHourNormalized === 11 && hour === 12) ||
            (prevHourNormalized === 1 && hour === 12) ||
            (prevHourNormalized === 12 && hour === 11) ||
            (prevHourNormalized === 12 && hour === 1);

          if (crossed12Line) {
            if (normalizedDiff > 0) {
              if (!state.isPM) shouldFlipAmPm = true;
            } else if (normalizedDiff < 0) {
              if (state.isPM) shouldFlipAmPm = true;
            }
          }
        }

        const newIsPM = shouldFlipAmPm ? !state.isPM : state.isPM;

        setState((prev) => ({
          ...prev,
          hours: hour,
          isPM: newIsPM,
        }));

        const newHours24 = newIsPM
          ? hour === 12
            ? 12
            : hour + 12
          : hour === 12
          ? 0
          : hour;
        baseDate.setHours(newHours24);
        baseDate.setMinutes(state.minutes);
      } else {
        const minute = Math.round(angle / 6) % 60;

        setState((prev) => ({ ...prev, minutes: minute }));
        setExactMinute(minute);

        const newHours24 = state.isPM
          ? state.hours === 12
            ? 12
            : state.hours + 12
          : state.hours === 12
          ? 0
          : state.hours;
        baseDate.setHours(newHours24);
        baseDate.setMinutes(minute);
      }

      baseDate.setSeconds(0);
      baseDate.setMilliseconds(0);

      if (isTimeValid(baseDate)) {
        onChange(baseDate);
      }

      setPreviousAngle(angle);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        setIsDragging(false);
        isDraggingRef.current = false;

        setPreviousAngle(null);

        if (state.mode === "hours") {
          setState((prev) => ({ ...prev, mode: "minutes" }));
        }

        setTimeout(() => {
          setExactMinute(null);
        }, 1000);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.target === clockFaceRef.current && !isDraggingRef.current) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        if (isDraggingRef.current) {
          e.preventDefault();
        }

        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
          clientX: touch.clientX,
          clientY: touch.clientY,
          bubbles: true,
          cancelable: true,
          view: window,
        });
        handleMouseMove(mouseEvent);
      }
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: false });
    document.addEventListener("touchcancel", handleTouchEnd, {
      passive: false,
    });

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [
    disabled,
    state.mode,
    state.isPM,
    state.hours,
    state.minutes,
    onChange,
    isTimeValid,
    value,
  ]);

  const handleHourSelect = (hour: number) => {
    if (disabled) return;

    const newState = {
      ...state,
      hours: hour,
      mode: "minutes" as "hours" | "minutes",
    };

    const baseDate =
      value instanceof Date && !isNaN(value.getTime())
        ? new Date(value)
        : new Date();
    const newHours24 = newState.isPM
      ? newState.hours === 12
        ? 12
        : newState.hours + 12
      : newState.hours === 12
      ? 0
      : newState.hours;
    baseDate.setHours(newHours24);
    baseDate.setMinutes(newState.minutes);
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);

    setState(newState);

    if (isTimeValid(baseDate)) {
      onChange(baseDate);
    }
  };

  const handleMinuteSelect = (minute: number) => {
    if (disabled) return;

    const newState = {
      ...state,
      minutes: minute,
      mode: "minutes" as "hours" | "minutes",
    };

    const baseDate =
      value instanceof Date && !isNaN(value.getTime())
        ? new Date(value)
        : new Date();
    const newHours24 = newState.isPM
      ? newState.hours === 12
        ? 12
        : newState.hours + 12
      : newState.hours === 12
      ? 0
      : newState.hours;
    baseDate.setHours(newHours24);
    baseDate.setMinutes(newState.minutes);
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);

    setState(newState);

    if (isTimeValid(baseDate)) {
      onChange(baseDate);
    }
  };

  const handlePeriodToggle = (isPM: boolean) => {
    if (disabled) return;

    const newState = {
      ...state,
      isPM: isPM,
    };

    const baseDate =
      value instanceof Date && !isNaN(value.getTime())
        ? new Date(value)
        : new Date();
    const newHours24 = newState.isPM
      ? newState.hours === 12
        ? 12
        : newState.hours + 12
      : newState.hours === 12
      ? 0
      : newState.hours;
    baseDate.setHours(newHours24);
    baseDate.setMinutes(newState.minutes);
    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);

    setState(newState);

    if (isTimeValid(baseDate)) {
      onChange(baseDate);
    }
  };

  const handleClockClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !clockFaceRef.current) return;

    const rect = clockFaceRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const x = e.clientX - centerX;
    const y = e.clientY - centerY;
    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    const baseDate =
      value instanceof Date && !isNaN(value.getTime())
        ? new Date(value)
        : new Date();
    let newState = { ...state };
    let newHours24 = 0;

    if (state.mode === "hours") {
      let hour = Math.round(angle / 30);
      if (hour === 0 || hour > 12) hour = 12;
      newState = { ...state, hours: hour, mode: "minutes" };
      newHours24 = newState.isPM
        ? hour === 12
          ? 12
          : hour + 12
        : hour === 12
        ? 0
        : hour;
      baseDate.setHours(newHours24);
      baseDate.setMinutes(newState.minutes);
    } else {
      const minute = Math.round(angle / 6) % 60;
      newState = { ...state, minutes: minute, mode: "minutes" };
      newHours24 = newState.isPM
        ? newState.hours === 12
          ? 12
          : newState.hours + 12
        : newState.hours === 12
        ? 0
        : newState.hours;
      baseDate.setHours(newHours24);
      baseDate.setMinutes(minute);
    }

    baseDate.setSeconds(0);
    baseDate.setMilliseconds(0);

    setState(newState);

    if (isTimeValid(baseDate)) {
      onChange(baseDate);
    }
  };

  const getHandAngle = () => {
    if (state.mode === "hours") {
      const hour = state.hours % 12;
      const hourAngle = (hour * 30 + 180) % 360;
      return hourAngle;
    } else {
      const minuteAngle = (state.minutes * 6 + 180) % 360;
      return minuteAngle;
    }
  };

  const getHandLength = () => {
    return 80;
  };

  const renderClockMarkers = () => {
    if (state.mode === "hours") {
      const hours = Array.from({ length: 12 }, (_, i) => i + 1);
      return hours.map((hour) => {
        const angle = (hour % 12) * 30 - 90;
        const radius = 100;
        const x = Math.cos(angle * (Math.PI / 180)) * radius;
        const y = Math.sin(angle * (Math.PI / 180)) * radius;

        return (
          <div
            key={hour}
            className={cn(styles.hourMarker, "time-entry-hour-marker")}
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleHourSelect(hour);
            }}
          >
            {hour}
          </div>
        );
      });
    } else {
      const minuteMarkers = [];

      for (let i = 0; i < 12; i++) {
        const minute = i * 5;
        const angle = minute * 6 - 90;

        const radius = 100;
        const x = Math.cos(angle * (Math.PI / 180)) * radius;
        const y = Math.sin(angle * (Math.PI / 180)) * radius;

        minuteMarkers.push(
          <div
            key={minute}
            className={cn(
              styles.minuteMarker,
              "time-entry-minute-marker",
              state.minutes === minute && styles.minuteMarkerSelected,
              state.minutes === minute && "time-entry-minute-marker-selected"
            )}
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleMinuteSelect(minute);
            }}
          >
            {minute === 0 ? "00" : minute}
          </div>
        );
      }

      return minuteMarkers;
    }
  };

  return (
    <div
      className={cn(
        styles.container,
        "time-entry-container",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className={cn(styles.header, "time-entry-header")}>
        <div className={cn(styles.timeDisplay, "time-entry-time-display")}>
          <span
            className={cn(
              "cursor-pointer px-1 rounded",
              state.mode === "hours"
                ? "bg-white/20 font-semibold"
                : "hover:bg-white/10"
            )}
            onClick={() => setState((prev) => ({ ...prev, mode: "hours" }))}
          >
            {state.hours}
          </span>
          :
          <span
            className={cn(
              "cursor-pointer px-1 rounded",
              state.mode === "minutes"
                ? "bg-white/20 font-semibold"
                : "hover:bg-white/10"
            )}
            onClick={() => setState((prev) => ({ ...prev, mode: "minutes" }))}
          >
            {state.minutes.toString().padStart(2, "0")}
          </span>
        </div>
        <div className={cn(styles.amPmDisplay, "time-entry-ampm-display")}>
          <div
            className={cn(
              styles.amPmButton,
              !state.isPM && styles.amPmButtonSelected,
              "time-entry-ampm-button",
              !state.isPM && "time-entry-ampm-button-selected"
            )}
            onClick={() => handlePeriodToggle(false)}
          >
            Manhã
          </div>
          <div
            className={cn(
              styles.amPmButton,
              state.isPM && styles.amPmButtonSelected,
              "time-entry-ampm-button",
              state.isPM && "time-entry-ampm-button-selected"
            )}
            onClick={() => handlePeriodToggle(true)}
          >
            Tarde
          </div>
        </div>
      </div>

      <div className={cn(styles.clockContainer, "time-entry-clock-container")}>
        <div
          ref={clockFaceRef}
          className={cn(styles.clockFace, "time-entry-clock-face")}
          onClick={handleClockClick}
          onTouchStart={(e) => {
            const isInteractiveElement = e.target !== clockFaceRef.current;
            if (!isInteractiveElement) {
              e.preventDefault();
            }
          }}
          onTouchMove={(e) => {
            if (isDragging) {
              e.preventDefault();
            }
          }}
        >
          {renderClockMarkers()}

          <div
            ref={handRef}
            className={cn(
              styles.clockHand,
              "time-entry-clock-hand",
              isDragging && "cursor-grabbing"
            )}
            style={{
              height: `${getHandLength()}px`,
              transform: `translateX(-50%) rotate(${getHandAngle()}deg)`,
              transformOrigin: "top center",
              position: "absolute",
              bottom: "50%",
              left: "50%",
              width: "4px",
              cursor: "grab",
              backgroundColor: styles.clockHand.includes("bg-teal-600")
                ? "#0d9488"
                : "#14b8a6",
              zIndex: 20,
              transition: isDragging
                ? "transform 0.05s linear"
                : "transform 0.2s ease",
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsDragging(true);
              isDraggingRef.current = true;
              setPreviousAngle(null);
            }}
            onTouchStart={() => {
              setIsDragging(true);
              isDraggingRef.current = true;
              setPreviousAngle(null);
            }}
          />

          {
            <div
              className={cn(
                "time-entry-selection-circle",
                isDragging && "scale-110"
              )}
              style={{
                position: "absolute",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                backgroundColor: styles.clockHand.includes("bg-teal-600")
                  ? "#0d9488"
                  : "#14b8a6",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold",
                left: `calc(50% + ${
                  Math.cos((getHandAngle() - 270) * (Math.PI / 180)) * 100
                }px)`,
                top: `calc(50% + ${
                  Math.sin((getHandAngle() - 270) * (Math.PI / 180)) * 100
                }px)`,
                transform: "translate(-50%, -50%)",
                zIndex: 25,
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                transition: isDragging ? "all 0.05s linear" : "all 0.2s ease",
                cursor: "grab",
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
                isDraggingRef.current = true;
                setPreviousAngle(null);
              }}
              onTouchStart={() => {
                setIsDragging(true);
                isDraggingRef.current = true;
                setPreviousAngle(null);
              }}
            >
              {state.mode === "hours"
                ? state.hours
                : exactMinute !== null
                ? exactMinute
                : state.minutes}
            </div>
          }

          <div className={cn(styles.clockCenter, "time-entry-clock-center")} />
        </div>
      </div>
    </div>
  );
}

export default TimeEntry;
