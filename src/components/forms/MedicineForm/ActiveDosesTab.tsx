"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/src/lib/utils";
import { medicineFormStyles as styles } from "./medicine-form.styles";
import {
  ActiveDosesTabProps,
  MedicineLogWithDetails,
} from "./medicine-form.types";

interface Contact {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
}

interface ActiveDose {
  id: string;
  medicineName: string;
  doseAmount: number;
  unitAbbr?: string;
  time: string;
  nextDoseTime?: string;
  isSafe: boolean;
  minutesRemaining?: number;
  totalIn24Hours: number;
  doseMinTime: string;
  hasRecentDoses: boolean;
  contacts?: Contact[];
}
import {
  PillBottle,
  Clock,
  AlertCircle,
  Loader2,
  ChevronDown,
  Phone,
  Mail,
  Plus,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { useTimezone } from "@/app/context/timezone";

const ActiveDosesTab: React.FC<ActiveDosesTabProps> = ({
  babyId,
  onGiveMedicine,
  refreshTrigger,
}) => {
  const { formatDate, calculateDurationMinutes } = useTimezone();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDoses, setActiveDoses] = useState<ActiveDose[]>([]);
  const [expandedContacts, setExpandedContacts] = useState<
    Record<string, boolean>
  >({});

  const toggleContacts = useCallback((doseId: string) => {
    setExpandedContacts((prev) => ({
      ...prev,
      [doseId]: !prev[doseId],
    }));
  }, []);

  const createActiveDoses = useCallback(
    (logs: MedicineLogWithDetails[] | null): ActiveDose[] => {
      const doses: ActiveDose[] = [];

      if (!logs || !Array.isArray(logs) || logs.length === 0) {
        return doses;
      }

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const medicineGroups = logs.reduce((groups, log) => {
        const key = log.medicine.id;
        if (!groups[key]) groups[key] = [];
        groups[key].push(log);
        return groups;
      }, {} as Record<string, MedicineLogWithDetails[]>);

      Object.values(medicineGroups).forEach(
        (medicineGroup: MedicineLogWithDetails[]) => {
          if (!medicineGroup.length) return;

          medicineGroup.sort(
            (a: MedicineLogWithDetails, b: MedicineLogWithDetails) =>
              new Date(b.time).getTime() - new Date(a.time).getTime()
          );

          const latestLog = medicineGroup[0];
          const medicine = latestLog.medicine;

          let isSafe = true;
          let nextDoseTime = "";
          let minutesRemaining = 0;
          let doseMinTime = "00:00:30";

          if (medicine.doseMinTime) {
            doseMinTime = medicine.doseMinTime;

            const timeRegex = /^([0-9]{1,2}):([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
            if (timeRegex.test(medicine.doseMinTime)) {
              const [days, hours, minutes] = medicine.doseMinTime
                .split(":")
                .map(Number);
              const minTimeMs =
                (days * 24 * 60 + hours * 60 + minutes) * 60 * 1000;
              const lastDoseTime = new Date(latestLog.time).getTime();

              try {
                console.log(
                  `Medicine: ${medicine.name}, Days: ${days}, Hours: ${hours}, Minutes: ${minutes}`
                );
                console.log(
                  `Min time in ms: ${minTimeMs}, which is ${
                    minTimeMs / (1000 * 60 * 60 * 24)
                  } days`
                );

                const safeTime = new Date(lastDoseTime + minTimeMs);

                console.log(
                  `Last dose: ${new Date(lastDoseTime).toISOString()}`
                );
                console.log(`Safe time: ${safeTime.toISOString()}`);
                console.log(`Current time: ${now.toISOString()}`);

                if (!isNaN(safeTime.getTime())) {
                  nextDoseTime = safeTime.toISOString();

                  minutesRemaining = calculateDurationMinutes(
                    now.toISOString(),
                    safeTime.toISOString()
                  );
                  minutesRemaining = Math.max(0, minutesRemaining);
                  console.log(`Minutes remaining: ${minutesRemaining}`);

                  isSafe = safeTime.getTime() <= now.getTime();
                  console.log(
                    `Is safe: ${isSafe}, safeTime <= now: ${
                      safeTime <= now
                    }, safeTime.getTime() <= now.getTime(): ${
                      safeTime.getTime() <= now.getTime()
                    }`
                  );
                } else {
                  console.warn(
                    `Invalid date calculation for medicine ${medicine.name}`
                  );
                  isSafe = true;
                }
              } catch (error) {
                console.error(
                  `Error calculating next dose time for ${medicine.name}:`,
                  error
                );
                isSafe = true;
              }
            } else {
              const oldTimeRegex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
              if (oldTimeRegex.test(medicine.doseMinTime)) {
                const [hours, minutes] = medicine.doseMinTime
                  .split(":")
                  .map(Number);
                const minTimeMs = (hours * 60 + minutes) * 60 * 1000;
                const lastDoseTime = new Date(latestLog.time).getTime();

                try {
                  console.log(
                    `Medicine: ${medicine.name}, Hours: ${hours}, Minutes: ${minutes}`
                  );
                  console.log(
                    `Min time in ms: ${minTimeMs}, which is ${
                      minTimeMs / (1000 * 60 * 60)
                    } hours`
                  );

                  const safeTime = new Date(lastDoseTime + minTimeMs);

                  console.log(
                    `Last dose: ${new Date(lastDoseTime).toISOString()}`
                  );
                  console.log(`Safe time: ${safeTime.toISOString()}`);
                  console.log(`Current time: ${now.toISOString()}`);

                  if (!isNaN(safeTime.getTime())) {
                    nextDoseTime = safeTime.toISOString();

                    minutesRemaining = calculateDurationMinutes(
                      now.toISOString(),
                      safeTime.toISOString()
                    );
                    minutesRemaining = Math.max(0, minutesRemaining);
                    console.log(`Minutes remaining: ${minutesRemaining}`);

                    isSafe = safeTime.getTime() <= now.getTime();
                    console.log(
                      `Is safe: ${isSafe}, safeTime <= now: ${
                        safeTime <= now
                      }, safeTime.getTime() <= now.getTime(): ${
                        safeTime.getTime() <= now.getTime()
                      }`
                    );
                  } else {
                    console.warn(
                      `Invalid date calculation for medicine ${medicine.name}`
                    );
                    isSafe = true;
                  }
                } catch (error) {
                  console.error(
                    `Error calculating next dose time for ${medicine.name}:`,
                    error
                  );
                  isSafe = true;
                }
              } else {
                console.warn(
                  `Invalid doseMinTime format for medicine ${medicine.name}: ${medicine.doseMinTime}`
                );
                isSafe = true;
              }
            }
          }

          const logsIn24Hours = medicineGroup.filter(
            (log) =>
              new Date(log.time).getTime() >= twentyFourHoursAgo.getTime()
          );

          const totalIn24Hours = logsIn24Hours.reduce(
            (sum, log) => sum + log.doseAmount,
            0
          );
          const hasRecentDoses = logsIn24Hours.length > 0;

          const contacts =
            medicine.contacts?.map((c) => {
              const contact: Contact = {
                id: c.contact.id,
                name: c.contact.name,
                role: c.contact.role,
              };

              if ("phone" in c.contact) {
                contact.phone = (c.contact as any).phone;
              }

              if ("email" in c.contact) {
                contact.email = (c.contact as any).email;
              }

              return contact;
            }) || [];

          doses.push({
            id: latestLog.id,
            medicineName: latestLog.medicine.name,
            doseAmount: latestLog.doseAmount,
            unitAbbr:
              latestLog.unitAbbr || latestLog.medicine.unitAbbr || undefined,
            time:
              typeof latestLog.time === "string"
                ? latestLog.time
                : new Date(latestLog.time).toISOString(),
            nextDoseTime: nextDoseTime || "",
            isSafe,
            minutesRemaining,
            totalIn24Hours,
            doseMinTime,
            hasRecentDoses,
            contacts: contacts.length > 0 ? contacts : undefined,
          });
        }
      );

      return doses;
    },
    [calculateDurationMinutes]
  );

  const fetchActiveDoses = useCallback(async () => {
    if (!babyId) return;

    try {
      setIsLoading(true);

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const authToken = localStorage.getItem("authToken");
      const url = `/api/medicine-log?babyId=${babyId}&startDate=${sixtyDaysAgo.toISOString()}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!response.ok) {
        throw new Error("Não foi possível obter as doses ativas.");
      }

      const data = await response.json();
      const logsData = data.data || data;
      const processedDoses = createActiveDoses(
        Array.isArray(logsData) ? logsData : []
      );

      setActiveDoses(processedDoses);
    } catch (error) {
      console.error("Error fetching active doses:", error);
      setError("Falha ao carregar as doses ativas");
    } finally {
      setIsLoading(false);
    }
  }, [babyId, createActiveDoses]);

  useEffect(() => {
    fetchActiveDoses();

    const timer = setInterval(() => {
      if (activeDoses.some((dose) => !dose.isSafe)) {
        fetchActiveDoses();
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [babyId, fetchActiveDoses]);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchActiveDoses();
    }
  }, [refreshTrigger, fetchActiveDoses]);

  const handleRefresh = useCallback(() => {
    fetchActiveDoses();
  }, [fetchActiveDoses]);

  const formatTimeRemaining = (minutes: number, isSafe: boolean): string => {
    if (isSafe && minutes <= 0) return "Seguro para administrar";

    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = Math.floor(minutes % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${mins}m restante`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m restante`;
    }
    return `${mins}m restante`;
  };

  return (
    <div className={cn(styles.tabContent, "medicine-form-tab-content")}>
      <div className="mb-4">
        <Button onClick={onGiveMedicine} className="w-full" disabled={!babyId}>
          <Plus className="h-4 w-4 mr-2" />
          Dê remédio
        </Button>
      </div>

      {isLoading && (
        <div
          className={cn(
            styles.loadingContainer,
            "medicine-form-loading-container"
          )}
        >
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <p className="mt-2 text-gray-600">Carregando doses ativas...</p>
        </div>
      )}

      {error && (
        <div
          className={cn(styles.errorContainer, "medicine-form-error-container")}
        >
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="mt-2 text-red-500">{error}</p>
          <Button variant="outline" onClick={fetchActiveDoses} className="mt-2">
            Tentar novamente
          </Button>
        </div>
      )}

      {!isLoading && !error && activeDoses.length === 0 && (
        <div className={cn(styles.emptyState, "medicine-form-empty-state")}>
          <PillBottle className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p>Nenhuma dose de medicamento nos últimos 60 dias.</p>
        </div>
      )}

      {!isLoading && !error && activeDoses.length > 0 && (
        <div
          className={cn(
            styles.activeDosesContainer,
            "medicine-form-active-doses-container"
          )}
        >
          {activeDoses.map((dose) => (
            <div
              key={dose.id}
              className={cn(styles.doseCard, "medicine-form-dose-card")}
            >
              <div
                className={cn(styles.doseHeader, "medicine-form-dose-header")}
              >
                <div className="flex items-center">
                  <div
                    className={cn(
                      styles.iconContainer,
                      "medicine-form-icon-container"
                    )}
                  >
                    <PillBottle className="h-4 w-4" />
                  </div>
                  <h3
                    className={cn(
                      styles.doseName,
                      "medicine-form-dose-name ml-2"
                    )}
                  >
                    {dose.medicineName}
                  </h3>
                </div>
                <span
                  className={cn(styles.doseAmount, "medicine-form-dose-amount")}
                >
                  {dose.doseAmount} {dose.unitAbbr}
                </span>
              </div>

              {dose.hasRecentDoses && (
                <p className={cn(styles.doseTime, "medicine-form-dose-time")}>
                  Last dose: {formatDate(dose.time)}
                </p>
              )}

              <div
                className={cn(styles.doseInfo, "medicine-form-dose-info mt-3")}
              >
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                  <span
                    className={cn(
                      dose.isSafe
                        ? styles.countdownSafe
                        : styles.countdownWarning,
                      dose.isSafe
                        ? "medicine-form-countdown-safe"
                        : "medicine-form-countdown-warning"
                    )}
                  >
                    {formatTimeRemaining(
                      dose.minutesRemaining || 0,
                      dose.isSafe
                    )}
                  </span>
                </div>
              </div>

              <div
                className={cn(
                  styles.totalDose,
                  "medicine-form-total-dose mt-2"
                )}
              >
                {dose.hasRecentDoses ? (
                  <>
                    Total nas últimas 24 horas: {dose.totalIn24Hours}{" "}
                    {dose.unitAbbr}
                  </>
                ) : (
                  <>
                    Última dose:{" "}
                    {new Date(dose.time).toLocaleDateString("pt-BR", {
                      month: "long",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    - {dose.doseAmount} {dose.unitAbbr}
                  </>
                )}
              </div>

              {dose.contacts && dose.contacts.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-2 dark:border-gray-700">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between py-2 px-0 text-sm font-medium text-gray-600 hover:text-teal-600 dark:text-gray-300 dark:hover:text-teal-400"
                    onClick={() => toggleContacts(dose.id)}
                  >
                    <span className="flex items-center gap-1">
                      <span className="font-medium">
                        Informações de contato
                      </span>
                      <span className="ml-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                        {dose.contacts.length}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-gray-500 transition-transform duration-200 dark:text-gray-400",
                        expandedContacts[dose.id] && "rotate-180"
                      )}
                    />
                  </Button>

                  {expandedContacts[dose.id] && (
                    <div className="space-y-3 pt-1 pb-2">
                      {dose.contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="rounded-md bg-gray-50 p-2 dark:bg-gray-800"
                        >
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {contact.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {contact.role}
                          </div>

                          <div className="mt-1 flex flex-row gap-4 text-xs">
                            {contact.phone && (
                              <div className="flex items-center">
                                <Phone className="mr-1 h-3 w-3 text-gray-500 dark:text-gray-400" />
                                <a
                                  href={`tel:${contact.phone.replace(
                                    /\D/g,
                                    ""
                                  )}`}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                >
                                  {contact.phone}
                                </a>
                              </div>
                            )}

                            {contact.email && (
                              <div className="flex items-center">
                                <Mail className="mr-1 h-3 w-3 text-gray-500 dark:text-gray-400" />
                                <a
                                  href={`mailto:${contact.email}`}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                >
                                  {contact.email}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActiveDosesTab;
