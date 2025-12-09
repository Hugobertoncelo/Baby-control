"use client";

import React, { useState, useEffect } from "react";
import { useTimezone } from "@/app/context/timezone";

export function TimezoneDebug() {
  const {
    userTimezone,
    getTimezoneInfo,
    formatDateTime,
    isLoading: tzLoading,
    isDST,
    refreshTimezone,
  } = useTimezone();

  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [info, setInfo] = useState({
    userTimezone,
    serverTimezone: "Carregando...",
    currentTime: new Date().toISOString(),
    currentOffset: new Date().getTimezoneOffset(),
    isDST: false,
    formattedCurrentTime: "",
    isMobile:
      typeof navigator !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
    isLoading: tzLoading,
    initTime: new Date().toISOString(),
  });

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
          setIsEnabled(!!data.data.enableDebugTimezone);
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
  }, []);

  const fetchServerTimezone = async () => {
    try {
      const response = await fetch("/api/system-timezone");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.systemTimezone) {
          setInfo((prev) => ({
            ...prev,
            serverTimezone: data.data.systemTimezone,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching server timezone:", error);
      setInfo((prev) => ({
        ...prev,
        serverTimezone: "Erro ao buscar",
      }));
    }
  };

  useEffect(() => {
    if (!tzLoading) {
      refreshInfo();
    }
  }, [tzLoading, userTimezone, isDST]);

  const refreshInfo = () => {
    const now = new Date();
    const nowIso = now.toISOString();
    const tzInfo = getTimezoneInfo();

    const formattedTime =
      formatDateTime(nowIso) +
      " " +
      new Intl.DateTimeFormat("pt-BR", {
        timeZone: userTimezone,
        timeZoneName: "short",
      })
        .format(now)
        .split(", ")[1];

    setInfo((prev) => ({
      ...prev,
      userTimezone,
      currentTime: nowIso,
      currentOffset: tzInfo.currentOffset,
      isDST: tzInfo.isDST,
      formattedCurrentTime: formattedTime,
      isMobile: tzInfo.isMobile,
      isLoading: tzInfo.isLoading,
    }));

    fetchServerTimezone();

    refreshTimezone();

    console.log("Timezone debug info:", {
      userTimezone,
      isDST,
      offset: now.getTimezoneOffset(),
      formattedWithTimezoneName: new Intl.DateTimeFormat("pt-BR", {
        timeZone: userTimezone,
        timeZoneName: "long",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now),
    });
  };

  useEffect(() => {
    if (showDebug) {
      refreshInfo();
    }
  }, [showDebug]);

  if (!isInitialized || !isEnabled) {
    return null;
  }

  if (!showDebug) {
    return (
      <button
        onClick={() => setShowDebug(true)}
        className={`fixed bottom-4 right-4 ${
          isDST ? "bg-green-600" : "bg-red-600"
        } text-white p-2 rounded-full z-50 opacity-50 hover:opacity-100`}
      >
        TZ
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg z-50 max-w-xs w-full text-xs">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Depuração de fuso horário</h3>
        <div className="flex items-center">
          {tzLoading && (
            <span className="text-yellow-500 mr-2">Carregando...</span>
          )}
          <button
            onClick={() => setShowDebug(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            Fechar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <span className="font-semibold">Fuso horário do usuário:</span>{" "}
          {info.userTimezone}
        </div>
        <div>
          <span className="font-semibold">Fuso horário do servidor:</span>{" "}
          {info.serverTimezone}
        </div>
        <div>
          <span className="font-semibold">Hora atual (ISO):</span>{" "}
          {info.currentTime}
        </div>
        <div>
          <span className="font-semibold">Hora atual (formatada):</span>{" "}
          {info.formattedCurrentTime}
        </div>
        <div>
          <span className="font-semibold">Deslocamento de fuso horário:</span>{" "}
          {info.currentOffset} minutos (UTC{info.currentOffset > 0 ? "-" : "+"}
          {Math.abs(info.currentOffset / 60)})
        </div>
        <div
          className={
            info.isDST ? "font-bold text-green-600" : "font-bold text-red-600"
          }
        >
          <span className="font-semibold">O horário de verão está ativo?</span>{" "}
          {info.isDST ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-semibold">É móvel:</span>{" "}
          {info.isMobile ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-semibold">Carregamento de contexto:</span>{" "}
          {info.isLoading ? "Yes" : "No"}
        </div>
        <div>
          <span className="font-semibold">Hora de inicialização:</span>{" "}
          {new Date(info.initTime).toLocaleTimeString()}
        </div>
        <div className="text-xs overflow-hidden text-ellipsis">
          <span className="font-semibold">Informações do navegador:</span>{" "}
          {navigator.userAgent}
        </div>

        <div className="pt-2 flex space-x-2">
          <button
            onClick={refreshInfo}
            className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
          >
            Atualizar informações
          </button>
          <button
            onClick={refreshTimezone}
            className="bg-green-500 text-white px-2 py-1 rounded text-xs"
          >
            Forçar atualização do fuso horário
          </button>
        </div>
      </div>
    </div>
  );
}
