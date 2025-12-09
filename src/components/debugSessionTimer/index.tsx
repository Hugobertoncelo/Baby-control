"use client";

import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Position, DebugSessionTimerProps } from "./debug-session-timer.types";
import {
  debugTimerContainer,
  debugTimerHeader,
  debugTimerCloseButton,
  debugTimerContent,
  debugTimerRow,
  debugTimerLabel,
  debugTimerValue,
} from "./debug-session-timer.styles";

const DebugSessionTimer: React.FC<DebugSessionTimerProps> = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [tokenExpiration, setTokenExpiration] = useState<Date | null>(null);
  const [idleTime, setIdleTime] = useState(0);
  const [authLifeSeconds, setAuthLifeSeconds] = useState<number | null>(null);
  const [idleTimeSeconds, setIdleTimeSeconds] = useState<number | null>(null);

  const timerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const positionRef = useRef<Position>({ x: 20, y: 20 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });

  const formatTimeRemaining = (date: Date | null): string => {
    if (!date) return "Desconhecido";

    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) return "Expirado";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatIdleTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const getTokenExpiration = (): Date | null => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return null;

      const payload = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payload));

      if (decodedPayload.exp) {
        return new Date(decodedPayload.exp * 1000);
      }

      return null;
    } catch (error) {
      console.error("Error parsing JWT token:", error);
      return null;
    }
  };

  const resetIdleTime = () => {
    lastActivityRef.current = Date.now();
    setIdleTime(0);
  };

  const fetchSettings = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      const response = await fetch("/api/settings", {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setIsEnabled(!!data.data.enableDebugTimer);
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setIsEnabled(false);
    }
    setIsInitialized(true);
  };

  useEffect(() => {
    fetchSettings();

    const storedAuthLife = localStorage.getItem("authLifeSeconds");
    if (storedAuthLife) {
      setAuthLifeSeconds(parseInt(storedAuthLife, 10));
    } else {
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      fetch("/api/settings/auth-life", { headers })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setAuthLifeSeconds(data.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching AUTH_LIFE:", error);
        });
    }

    const storedIdleTime = localStorage.getItem("idleTimeSeconds");
    if (storedIdleTime) {
      setIdleTimeSeconds(parseInt(storedIdleTime, 10));
    } else {
      const authToken = localStorage.getItem("authToken");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      }

      fetch("/api/settings/idle-time", { headers })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setIdleTimeSeconds(data.data);
          }
        })
        .catch((error) => {
          console.error("Error fetching IDLE_TIME:", error);
        });
    }
  }, []);

  useEffect(() => {
    if (!isInitialized || !isEnabled) {
      return;
    }

    setTokenExpiration(getTokenExpiration());

    const tokenInterval = setInterval(() => {
      setTokenExpiration(getTokenExpiration());

      const now = Date.now();
      const idleSeconds = Math.floor((now - lastActivityRef.current) / 1000);
      setIdleTime(idleSeconds);
    }, 1000);

    const activityEvents = ["mousedown", "keydown", "mousemove", "touchstart"];

    const handleUserActivity = () => {
      resetIdleTime();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleUserActivity);
    });

    return () => {
      clearInterval(tokenInterval);

      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleUserActivity);
      });

      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [isInitialized, isEnabled]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      positionRef.current = {
        x: window.innerWidth - 240,
        y: window.innerHeight - 160,
      };

      if (timerRef.current) {
        timerRef.current.style.left = `${positionRef.current.x}px`;
        timerRef.current.style.top = `${positionRef.current.y}px`;
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (
        e.target instanceof HTMLElement &&
        (e.target.classList.contains("drag-handle") ||
          e.target.closest(".drag-handle"))
      ) {
        isDraggingRef.current = true;

        if (timerRef.current) {
          const rect = timerRef.current.getBoundingClientRect();
          dragOffsetRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          };

          timerRef.current.style.cursor = "grabbing";
          if (e.target.classList.contains("drag-handle")) {
            e.target.style.cursor = "grabbing";
          }
        }

        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current && timerRef.current) {
        const newX = e.clientX - dragOffsetRef.current.x;
        const newY = e.clientY - dragOffsetRef.current.y;

        const rect = timerRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        positionRef.current = {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        };

        timerRef.current.style.left = `${positionRef.current.x}px`;
        timerRef.current.style.top = `${positionRef.current.y}px`;
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current && timerRef.current) {
        isDraggingRef.current = false;

        timerRef.current.style.cursor = "default";
        const dragHandle = timerRef.current.querySelector(".drag-handle");
        if (dragHandle instanceof HTMLElement) {
          dragHandle.style.cursor = "grab";
        }
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const showInDevelopment = process.env.NODE_ENV === "development";

  if (!isVisible || (!isEnabled && !showInDevelopment)) {
    return null;
  }

  return (
    <div
      ref={timerRef}
      className={debugTimerContainer(
        isDraggingRef.current,
        positionRef.current.x,
        positionRef.current.y
      )}
      style={{
        position: "fixed",
        zIndex: 9999,
        left: `${positionRef.current.x}px`,
        top: `${positionRef.current.y}px`,
      }}
    >
      <div
        className={`${debugTimerHeader()} drag-handle`}
        style={{ cursor: "grab" }}
      >
        <div>Temporizador de sessão de depuração</div>
        <button
          className={debugTimerCloseButton()}
          onClick={() => setIsVisible(false)}
          aria-label="Fechar temporizador de depuração"
        >
          <X size={16} />
        </button>
      </div>
      <div className={debugTimerContent()}>
        <div className={debugTimerRow()}>
          <span className={debugTimerLabel()}>JWT expira em:</span>
          <span className={debugTimerValue()}>
            {formatTimeRemaining(tokenExpiration)}
          </span>
        </div>
        <div className={debugTimerRow()}>
          <span className={debugTimerLabel()}>Tempo ocioso:</span>
          <span className={debugTimerValue()}>{formatIdleTime(idleTime)}</span>
        </div>
        <div className={debugTimerRow()}>
          <span className={debugTimerLabel()}>Auth Life:</span>
          <span className={debugTimerValue()}>
            {authLifeSeconds
              ? `${Math.floor(authLifeSeconds / 3600)}h ${Math.floor(
                  (authLifeSeconds % 3600) / 60
                )}m`
              : "Unknown"}
          </span>
        </div>
        <div className={debugTimerRow(true)}>
          <span className={debugTimerLabel()}>
            Tempo limite de inatividade:
          </span>
          <span className={debugTimerValue()}>
            {idleTimeSeconds
              ? `${Math.floor(idleTimeSeconds / 3600)}h ${Math.floor(
                  (idleTimeSeconds % 3600) / 60
                )}m`
              : "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
};

export { DebugSessionTimer };
