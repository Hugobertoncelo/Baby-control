"use client";

import React, { useState, useMemo, useEffect } from "react";
import { BabyQuickStatsProps, TimePeriod } from "./baby-quick-stats.types";
import {
  quickStatsContainer,
  babyInfoHeader,
  babyNameHeading,
  babyAgeText,
  placeholderText,
  closeButtonContainer,
  timePeriodSelectorContainer,
  timePeriodSelectorLabel,
  timePeriodButtonGroup,
  statsCardsGrid,
} from "./baby-quick-stats.styles";
import FormPage, {
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import CardVisual from "@/src/components/reporting/CardVisual";
import { Clock, Moon, Sun, Utensils, Droplet, Loader2 } from "lucide-react";
import { diaper } from "@lucide/lab";
import { useFamily } from "@/src/context/family";

export const BabyQuickStats: React.FC<BabyQuickStatsProps> = ({
  isOpen,
  onClose,
  selectedBaby,
  calculateAge,
  activities: initialActivities = [],
}) => {
  const { family } = useFamily();

  const [mainPeriod, setMainPeriod] = useState<TimePeriod>("7dia");
  const [comparePeriod, setComparePeriod] = useState<TimePeriod>("14dia");

  const [activities, setActivities] = useState<any[]>(initialActivities);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedBaby) return;

    const fetchActivities = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);

        const startDate = start.toISOString();
        const endDate = end.toISOString();

        const timestamp = new Date().getTime();

        const urlParams = new URLSearchParams({
          babyId: selectedBaby.id,
          startDate: startDate,
          endDate: endDate,
          _t: timestamp.toString(),
        });

        if (family?.id) {
          urlParams.append("familyId", family.id);
        }

        const url = `/api/timeline?${urlParams.toString()}`;

        console.log(`Fetching activities from: ${url}`);

        const response = await fetch(url, {
          cache: "no-store",
          headers: {
            Pragma: "no-cache",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Expires: "0",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setActivities(data.data || []);
            console.log(
              `Fetched ${data.data?.length || 0} activities for baby ${
                selectedBaby.firstName
              }`
            );
          } else {
            setActivities([]);
            setError(data.message || "Failed to fetch activities");
          }
        } else {
          setActivities([]);
          setError("Failed to fetch activities");
        }
      } catch (err) {
        console.error("Error fetching activities:", err);
        setActivities([]);
        setError("Error fetching activities");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [selectedBaby, family?.id]);

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatSeconds = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getDateRangeForPeriod = (
    period: TimePeriod
  ): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case "2dia":
        start.setDate(start.getDate() - 1);
        break;
      case "7dia":
        start.setDate(start.getDate() - 6);
        break;
      case "14dia":
        start.setDate(start.getDate() - 13);
        break;
      case "30dia":
        start.setDate(start.getDate() - 29);
        break;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const filterActivities = (period: TimePeriod) => {
    if (!selectedBaby || !activities.length) return [];

    const { start, end } = getDateRangeForPeriod(period);

    return activities.filter((activity) => {
      if ("babyId" in activity && activity.babyId !== selectedBaby.id) {
        return false;
      }

      const time =
        "time" in activity
          ? new Date(activity.time)
          : "startTime" in activity
          ? new Date(activity.startTime)
          : null;

      if (!time) return false;

      return time >= start && time <= end;
    });
  };

  const mainStats = useMemo(() => {
    const filteredActivities = filterActivities(mainPeriod);
    return calculateStats(filteredActivities, mainPeriod);
  }, [mainPeriod, selectedBaby, activities]);

  const compareStats = useMemo(() => {
    const filteredActivities = filterActivities(comparePeriod);
    return calculateStats(filteredActivities, comparePeriod);
  }, [comparePeriod, selectedBaby, activities]);

  function calculateStats(filteredActivities: any[], period: TimePeriod) {
    if (!filteredActivities.length) {
      return {
        avgWakeWindow: 0,
        avgNapTime: 0,
        avgNightSleepTime: 0,
        avgNightWakings: 0,
        avgFeedings: 0,
        avgFeedAmount: 0,
        avgDiaperChanges: 0,
        avgPoops: 0,
      };
    }

    const daysInPeriod =
      period === "2dia"
        ? 2
        : period === "7dia"
        ? 7
        : period === "14dia"
        ? 14
        : 30;

    let totalWakeMinutes = 0;
    let wakeWindowCount = 0;

    let totalNapMinutes = 0;
    let napCount = 0;

    let nightWakings = 0;
    let nightSleepDaysCount = 0;

    const nightSleepByNight: Record<string, number> = {};

    let feedingCount = 0;
    let totalFeedAmount = 0;
    let feedAmountCount = 0;

    let diaperCount = 0;
    let poopCount = 0;

    const sleepActivities = filteredActivities.filter(
      (a) =>
        "duração" in a &&
        "hora de início" in a &&
        "hora final" in a &&
        a.endTime
    );
    sleepActivities.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    for (let i = 0; i < sleepActivities.length - 1; i++) {
      const currentSleep = sleepActivities[i];
      const nextSleep = sleepActivities[i + 1];

      if (currentSleep.endTime && nextSleep.startTime) {
        const sleepEndTime = new Date(currentSleep.endTime).getTime();
        const nextSleepStartTime = new Date(nextSleep.startTime).getTime();

        const wakeWindowInMinutes = Math.floor(
          (nextSleepStartTime - sleepEndTime) / (1000 * 60)
        );

        if (wakeWindowInMinutes > 0 && wakeWindowInMinutes < 24 * 60) {
          totalWakeMinutes += wakeWindowInMinutes;
          wakeWindowCount++;
        }
      }
    }

    const activitiesByDay: Record<string, any[]> = {};
    filteredActivities.forEach((activity) => {
      const time =
        "time" in activity
          ? new Date(activity.time)
          : "startTime" in activity
          ? new Date(activity.startTime)
          : null;

      if (!time) return;

      const dateStr = time.toISOString().split("T")[0];
      if (!activitiesByDay[dateStr]) {
        activitiesByDay[dateStr] = [];
      }
      activitiesByDay[dateStr].push(activity);
    });

    Object.values(activitiesByDay).forEach((dayActivities) => {
      const nightSleepEvents = dayActivities.filter((a) => {
        if (!("startTime" in a)) return false;
        const startTime = new Date(a.startTime);
        const startHour = startTime.getHours();

        const isNightByStart = startHour >= 19 || startHour < 7;

        if ("endTime" in a && a.endTime) {
          const endTime = new Date(a.endTime);
          const endHour = endTime.getHours();
          const isNightByEnd = endHour >= 19 || endHour < 7;

          return isNightByStart || isNightByEnd;
        }

        return isNightByStart;
      });

      nightSleepEvents.forEach((a) => {
        if (!("startTime" in a) || !("endTime" in a) || !a.endTime) return;

        const startTime = new Date(a.startTime);
        const startHour = startTime.getHours();
        const sleepDate = new Date(startTime);

        let nightKey;
        if (startHour >= 19) {
          nightKey = sleepDate.toISOString().split("T")[0] + "-night";
        } else if (startHour < 7) {
          sleepDate.setDate(sleepDate.getDate() - 1);
          nightKey = sleepDate.toISOString().split("T")[0] + "-night";
        } else {
          return;
        }

        const startTimeMs = new Date(a.startTime).getTime();
        const endTimeMs = new Date(a.endTime).getTime();
        const sleepDurationMinutes = Math.round(
          (endTimeMs - startTimeMs) / (1000 * 60)
        );

        if (sleepDurationMinutes <= 0 || sleepDurationMinutes >= 12 * 60) {
          return;
        }

        if (!nightSleepByNight[nightKey]) {
          nightSleepByNight[nightKey] = 0;

          const wakingsForNight = Math.max(0, nightSleepEvents.length - 1);
          nightWakings += wakingsForNight;
        }

        nightSleepByNight[nightKey] += sleepDurationMinutes;
      });

      const feedingsForDay = dayActivities.filter(
        (a) =>
          "type" in a &&
          (a.type === "BOTTLE" || a.type === "BREAST" || a.type === "SOLIDS")
      ).length;

      feedingCount += feedingsForDay;

      dayActivities.forEach((a) => {
        if ("amount" in a && a.amount && typeof a.amount === "number") {
          totalFeedAmount += a.amount;
          feedAmountCount++;
        }
      });

      dayActivities.forEach((a) => {
        if ("condition" in a) {
          diaperCount++;

          if (a.type === "DIRTY" || a.type === "BOTH") {
            poopCount++;
          }
        }
      });

      const napActivities = dayActivities.filter((a) => {
        if (!("startTime" in a && "endTime" in a)) return false;
        const time = new Date(a.startTime);
        const hour = time.getHours();
        return hour >= 7 && hour < 19;
      });

      napActivities.forEach((a) => {
        if ("startTime" in a && "endTime" in a && a.endTime) {
          const startTime = new Date(a.startTime).getTime();
          const endTime = new Date(a.endTime).getTime();
          const napDurationMinutes = Math.round(
            (endTime - startTime) / (1000 * 60)
          );

          if (napDurationMinutes > 0 && napDurationMinutes < 6 * 60) {
            totalNapMinutes += napDurationMinutes;
            napCount++;
          }
        }
      });
    });

    const avgWakeWindow =
      wakeWindowCount > 0 ? Math.round(totalWakeMinutes / wakeWindowCount) : 0;
    const avgNapTime =
      napCount > 0 ? Math.round(totalNapMinutes / napCount) : 0;

    let totalNightSleepMinutes = 0;
    Object.values(nightSleepByNight).forEach((minutes) => {
      totalNightSleepMinutes += minutes;
    });

    const nightsCount = Object.keys(nightSleepByNight).length;
    const avgNightSleepTime =
      nightsCount > 0 ? Math.round(totalNightSleepMinutes / nightsCount) : 0;
    const avgNightWakings =
      nightsCount > 0 ? Math.round((nightWakings / nightsCount) * 10) / 10 : 0;
    const avgFeedings =
      daysInPeriod > 0
        ? Math.round((feedingCount / daysInPeriod) * 10) / 10
        : 0;
    const avgFeedAmount =
      feedAmountCount > 0
        ? Math.round((totalFeedAmount / feedAmountCount) * 10) / 10
        : 0;
    const avgDiaperChanges =
      daysInPeriod > 0 ? Math.round((diaperCount / daysInPeriod) * 10) / 10 : 0;
    const avgPoops =
      daysInPeriod > 0 ? Math.round((poopCount / daysInPeriod) * 10) / 10 : 0;

    return {
      avgWakeWindow,
      avgNapTime,
      avgNightSleepTime,
      avgNightWakings,
      avgFeedings,
      avgFeedAmount,
      avgDiaperChanges,
      avgPoops,
    };
  }

  const formatPeriodLabel = (period: TimePeriod): string => {
    switch (period) {
      case "2dia":
        return "2 Dias";
      case "7dia":
        return "7 Dias";
      case "14dia":
        return "14 Dias";
      case "30dia":
        return "30 Dias";
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={`${selectedBaby?.firstName}'s Quick Stats`}
    >
      <FormPageContent>
        <div className={quickStatsContainer()}>
          {selectedBaby ? (
            <>
              <div className={timePeriodSelectorContainer()}>
                <div>
                  <Label className={timePeriodSelectorLabel()}>
                    Período Principal:
                  </Label>
                  <div className={timePeriodButtonGroup()}>
                    {(["2dia", "7dia", "14dia", "30dia"] as TimePeriod[]).map(
                      (period) => (
                        <Button
                          key={`main-${period}`}
                          variant={
                            mainPeriod === period ? "default" : "outline"
                          }
                          className="flex-1 px-2 py-1 h-auto text-sm"
                          onClick={() => setMainPeriod(period)}
                        >
                          {formatPeriodLabel(period)}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <Label className={timePeriodSelectorLabel()}>
                    Comparar período:
                  </Label>
                  <div className={timePeriodButtonGroup()}>
                    {(["2dia", "7dia", "14dia", "30dia"] as TimePeriod[]).map(
                      (period) => (
                        <Button
                          key={`compare-${period}`}
                          variant={
                            comparePeriod === period ? "default" : "outline"
                          }
                          className="flex-1 px-2 py-1 h-auto text-sm"
                          onClick={() => setComparePeriod(period)}
                        >
                          {formatPeriodLabel(period)}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600 mb-2" />
                  <p className="text-gray-600">Loading statistics...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-red-500 mb-2">{error}</p>
                  <p className="text-gray-600">
                    Não foi possível carregar as estatísticas. Tente novamente
                    mais tarde.
                  </p>
                </div>
              ) : activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-gray-600">
                    Nenhuma atividade encontrada para o período selecionado.
                  </p>
                </div>
              ) : (
                <div className={statsCardsGrid()}>
                  <CardVisual
                    title="Avg Wake Window"
                    mainValue={formatMinutes(mainStats.avgWakeWindow)}
                    comparativeValue={formatMinutes(compareStats.avgWakeWindow)}
                    trend={
                      mainStats.avgWakeWindow >= compareStats.avgWakeWindow
                        ? "positive"
                        : "negative"
                    }
                  />

                  <CardVisual
                    title="Avg Nap Time"
                    mainValue={formatMinutes(mainStats.avgNapTime)}
                    comparativeValue={formatMinutes(compareStats.avgNapTime)}
                    trend={
                      mainStats.avgNapTime >= compareStats.avgNapTime
                        ? "positive"
                        : "negative"
                    }
                  />

                  <CardVisual
                    title="Avg Night Sleep"
                    mainValue={formatMinutes(mainStats.avgNightSleepTime)}
                    comparativeValue={formatMinutes(
                      compareStats.avgNightSleepTime
                    )}
                    trend={
                      mainStats.avgNightSleepTime >=
                      compareStats.avgNightSleepTime
                        ? "positive"
                        : "negative"
                    }
                  />

                  <CardVisual
                    title="Avg Night Wakings"
                    mainValue={mainStats.avgNightWakings.toFixed(1)}
                    comparativeValue={compareStats.avgNightWakings.toFixed(1)}
                    trend={
                      mainStats.avgNightWakings <= compareStats.avgNightWakings
                        ? "positive"
                        : "negative"
                    }
                  />

                  <CardVisual
                    title="Avg Feedings"
                    mainValue={mainStats.avgFeedings.toFixed(1)}
                    comparativeValue={compareStats.avgFeedings.toFixed(1)}
                    trend="neutral"
                  />

                  <CardVisual
                    title="Avg Feed Amount"
                    mainValue={mainStats.avgFeedAmount.toFixed(1) + " oz"}
                    comparativeValue={
                      compareStats.avgFeedAmount.toFixed(1) + " oz"
                    }
                    trend={
                      mainStats.avgFeedAmount >= compareStats.avgFeedAmount
                        ? "positive"
                        : "negative"
                    }
                  />

                  <CardVisual
                    title="Avg Diaper Changes"
                    mainValue={mainStats.avgDiaperChanges.toFixed(1)}
                    comparativeValue={compareStats.avgDiaperChanges.toFixed(1)}
                    trend="neutral"
                  />

                  <CardVisual
                    title="Avg Poops"
                    mainValue={mainStats.avgPoops.toFixed(1)}
                    comparativeValue={compareStats.avgPoops.toFixed(1)}
                    trend="neutral"
                  />
                </div>
              )}
            </>
          ) : (
            <p className={placeholderText()}>
              Nenhum bebê selecionado. Selecione um bebê para visualizar suas
              estatísticas.
            </p>
          )}
        </div>
      </FormPageContent>

      <FormPageFooter>
        <div className={closeButtonContainer()}>
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
};

export default BabyQuickStats;
