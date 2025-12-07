"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface TimezoneContextType {
  isLoading: boolean;

  userTimezone: string;

  isDST: boolean;

  formatDate: (
    isoString: string | null | undefined,
    formatOptions?: Intl.DateTimeFormatOptions
  ) => string;

  formatTime: (isoString: string | null | undefined) => string;

  formatDateOnly: (isoString: string | null | undefined) => string;

  formatDateTime: (isoString: string | null | undefined) => string;

  calculateDurationMinutes: (
    startIsoString: string | null | undefined,
    endIsoString: string | null | undefined
  ) => number;

  formatDuration: (minutes: number) => string;

  isToday: (isoString: string | null | undefined) => boolean;

  isYesterday: (isoString: string | null | undefined) => boolean;

  isDaylightSavingTime: (date: Date, timezone: string) => boolean;

  getTimezoneInfo: () => {
    userTimezone: string;
    currentTime: string;
    currentOffset: number;
    isDST: boolean;
    isMobile: boolean;
    isLoading: boolean;
  };

  toLocalDate: (isoString: string | null | undefined) => Date | null;

  toUTCString: (date: Date | null | undefined) => string | null;

  getCurrentUTCString: () => string;

  refreshTimezone: () => void;
}

const TimezoneContext = createContext<TimezoneContextType | undefined>(
  undefined
);

export function TimezoneProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userTimezone, setUserTimezone] = useState<string>("UTC");
  const [isDST, setIsDST] = useState<boolean>(false);

  const detectTimezone = useCallback(() => {
    setIsLoading(true);

    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      const now = new Date();
      const isDSTActive = isDaylightSavingTime(now, detectedTimezone);

      console.log(
        `Detected timezone: ${detectedTimezone}, DST active: ${isDSTActive}`
      );
      console.log(
        `Current time: ${now.toISOString()}, Offset: ${now.getTimezoneOffset()}`
      );

      setUserTimezone(detectedTimezone);
      setIsDST(isDSTActive);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao detectar o fuso horário:", error);
      setUserTimezone("UTC");
      setIsDST(false);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    detectTimezone();
  }, [detectTimezone]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleFocus = () => {
        detectTimezone();
      };

      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
  }, [detectTimezone]);

  const isDaylightSavingTime = (date: Date, timezone: string): boolean => {
    try {
      const formatted = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        timeZoneName: "long",
      }).format(date);

      return formatted.includes("Daylight") || formatted.includes("Summer");
    } catch (error) {
      console.error("Error checking DST:", error);
      return false;
    }
  };

  const formatDate = (
    isoString: string | null | undefined,
    formatOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ): string => {
    if (!isoString) return "";

    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return "";

      const dateIsDST = isDaylightSavingTime(date, userTimezone);

      const formatter = new Intl.DateTimeFormat("en-US", {
        ...formatOptions,
        timeZone: userTimezone,
      });

      const formattedDate = formatter.format(date);

      if (process.env.NODE_ENV === "development") {
        console.debug(
          `Formatting date: ${isoString}, DST: ${dateIsDST}, Result: ${formattedDate}`
        );
      }

      return formattedDate;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const formatTime = (isoString: string | null | undefined): string => {
    return formatDate(isoString, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDateOnly = (isoString: string | null | undefined): string => {
    return formatDate(isoString, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (isoString: string | null | undefined): string => {
    return formatDate(isoString, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateDurationMinutes = (
    startIsoString: string | null | undefined,
    endIsoString: string | null | undefined
  ): number => {
    if (!startIsoString || !endIsoString) return 0;

    try {
      const startDate = new Date(startIsoString);
      const endDate = new Date(endIsoString);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return 0;
      }

      const diffMs = endDate.getTime() - startDate.getTime();
      return Math.floor(diffMs / 60000);
    } catch (error) {
      console.error("Error calculating duration:", error);
      return 0;
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  };

  const isToday = (isoString: string | null | undefined): boolean => {
    if (!isoString) return false;

    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return false;

      const today = new Date();

      const formatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: userTimezone,
      });

      return formatter.format(date) === formatter.format(today);
    } catch (error) {
      console.error("Error checking if date is today:", error);
      return false;
    }
  };

  const isYesterday = (isoString: string | null | undefined): boolean => {
    if (!isoString) return false;

    try {
      const date = new Date(isoString);
      if (isNaN(date.getTime())) return false;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const formatter = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        timeZone: userTimezone,
      });

      return formatter.format(date) === formatter.format(yesterday);
    } catch (error) {
      console.error("Error checking if date is yesterday:", error);
      return false;
    }
  };

  const getTimezoneInfo = () => {
    const now = new Date();
    const isMobile =
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const currentDST = isDaylightSavingTime(now, userTimezone);

    return {
      userTimezone,
      currentTime: now.toISOString(),
      currentOffset: now.getTimezoneOffset(),
      isDST: currentDST,
      isMobile,
      isLoading,
    };
  };

  const refreshTimezone = () => {
    console.log("Manually refreshing timezone");
    detectTimezone();
  };

  const toLocalDate = (isoString: string | null | undefined): Date | null => {
    if (!isoString) return null;

    try {
      const utcDate = new Date(isoString);
      if (isNaN(utcDate.getTime())) return null;

      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: userTimezone,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      });

      const parts = formatter.formatToParts(utcDate);

      const year = parseInt(
        parts.find((p) => p.type === "year")?.value || "0",
        10
      );
      const month =
        parseInt(parts.find((p) => p.type === "month")?.value || "0", 10) - 1;
      const day = parseInt(
        parts.find((p) => p.type === "day")?.value || "0",
        10
      );
      const hour = parseInt(
        parts.find((p) => p.type === "hour")?.value || "0",
        10
      );
      const minute = parseInt(
        parts.find((p) => p.type === "minute")?.value || "0",
        10
      );
      const second = parseInt(
        parts.find((p) => p.type === "second")?.value || "0",
        10
      );

      const localDate = new Date(year, month, day, hour, minute, second);

      if (process.env.NODE_ENV === "development") {
        console.debug(
          `Converting UTC date: ${isoString} to local: ${localDate.toISOString()}`
        );
        console.debug(
          `DST active for this date: ${isDaylightSavingTime(
            utcDate,
            userTimezone
          )}`
        );
      }

      return localDate;
    } catch (error) {
      console.error("Error converting to local date:", error);
      return null;
    }
  };

  const toUTCString = (date: Date | null | undefined): string | null => {
    if (!date) return null;

    try {
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch (error) {
      console.error("Error converting to UTC string:", error);
      return null;
    }
  };

  const getCurrentUTCString = (): string => {
    return new Date().toISOString();
  };

  return (
    <TimezoneContext.Provider
      value={{
        isLoading,
        userTimezone,
        isDST,
        formatDate,
        formatTime,
        formatDateOnly,
        formatDateTime,
        calculateDurationMinutes,
        formatDuration,
        isToday,
        isYesterday,
        isDaylightSavingTime,
        getTimezoneInfo,
        toLocalDate,
        toUTCString,
        getCurrentUTCString,
        refreshTimezone,
      }}
    >
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (context === undefined) {
    throw new Error(
      "O parâmetro useTimezone deve ser usado dentro de um TimezoneProvider."
    );
  }
  return context;
}
