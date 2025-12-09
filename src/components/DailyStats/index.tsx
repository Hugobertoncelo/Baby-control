import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronUp,
  Sun,
  Icon,
  Moon,
  Droplet,
  StickyNote,
  Utensils,
  Bath,
  Trophy,
  LampWallDown,
  Ruler,
  Scale,
  RotateCw,
  Thermometer,
  PillBottle,
} from "lucide-react";
import { diaper, bottleBaby } from "@lucide/lab";
import { Card } from "@/src/components/ui/card";
import { useTheme } from "@/src/context/theme";
import { cn } from "@/src/lib/utils";

import "./daily-stats.css";
import { dailyStatsStyles } from "./daily-stats.styles";
import {
  DailyStatsProps,
  StatItemProps,
  StatsTickerProps,
} from "./daily-stats.types";

const StatsTicker: React.FC<StatsTickerProps> = ({ stats }) => {
  const { theme } = useTheme();
  const tickerRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState(30);

  useEffect(() => {
    if (tickerRef.current) {
      const contentWidth = tickerRef.current.scrollWidth;
      const containerWidth = tickerRef.current.clientWidth;

      if (contentWidth > containerWidth) {
        const newDuration = Math.max(20, Math.min(40, contentWidth / 50));
        setAnimationDuration(newDuration);
      }
    }
  }, [stats]);

  if (stats.length === 0) return null;

  const tickerContent = (
    <>
      {stats.map((stat, index) => (
        <div key={index} className={dailyStatsStyles.ticker.item}>
          <div className={dailyStatsStyles.ticker.icon}>{stat.icon}</div>
          <span className={dailyStatsStyles.ticker.label}>{stat.label}: </span>
          <span className={dailyStatsStyles.ticker.value}>{stat.value}</span>
        </div>
      ))}
    </>
  );

  return (
    <div className={dailyStatsStyles.ticker.container}>
      <div
        ref={tickerRef}
        className={dailyStatsStyles.ticker.animation}
        style={{
          animationDuration: `${animationDuration}s`,
          animationTimingFunction: "linear",
          animationIterationCount: "infinito",
          animationName: "marquise",
        }}
      >
        {tickerContent}
        {tickerContent}
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};

const StatItem: React.FC<StatItemProps> = ({ icon, label, value }) => (
  <div className={dailyStatsStyles.statItem.container}>
    <div className={dailyStatsStyles.statItem.iconContainer}>{icon}</div>
    <div>
      <div className={dailyStatsStyles.statItem.label}>{label}</div>
      <div className={dailyStatsStyles.statItem.value}>{value}</div>
    </div>
  </div>
);

export const DailyStats: React.FC<DailyStatsProps> = ({
  activities,
  date,
  isLoading = false,
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatMinutes = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const {
    awakeTime,
    sleepTime,
    totalConsumed,
    diaperChanges,
    poopCount,
    leftBreastTime,
    rightBreastTime,
    noteCount,
    solidsConsumed,
    bathCount,
    milestoneCount,
    lastMeasurements,
    pumpTotals,
    medicineCounts,
  } = useMemo(() => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let totalSleepMinutes = 0;

    const consumedAmounts: Record<string, number> = {};

    let feedCount = 0;

    const solidsAmounts: Record<string, number> = {};

    let diaperCount = 0;
    let poopCount = 0;

    let leftBreastSeconds = 0;
    let rightBreastSeconds = 0;

    let noteCount = 0;

    let bathCount = 0;

    let milestoneCount = 0;

    const lastMeasurements: Record<
      string,
      { value: number; unit: string; date: Date }
    > = {};

    const pumpTotals: Record<string, number> = {};

    const medicineDoses: Record<
      string,
      { count: number; total: number; unit: string }
    > = {};

    activities.forEach((activity) => {
      if ("duration" in activity && "startTime" in activity) {
        const startTime = new Date(activity.startTime);
        const endTime =
          "endTime" in activity && activity.endTime
            ? new Date(activity.endTime)
            : null;

        if (endTime) {
          const overlapStart = Math.max(
            startTime.getTime(),
            startOfDay.getTime()
          );
          const overlapEnd = Math.min(endTime.getTime(), endOfDay.getTime());

          if (overlapEnd > overlapStart) {
            const overlapMinutes = Math.floor(
              (overlapEnd - overlapStart) / (1000 * 60)
            );
            totalSleepMinutes += overlapMinutes;
          }
        }
      }

      if ("amount" in activity && activity.amount) {
        const time = new Date(activity.time);

        if (time >= startOfDay && time <= endOfDay) {
          const unit = activity.unitAbbr || "oz";

          if ("type" in activity && activity.type === "SOLIDS") {
            if (!solidsAmounts[unit]) {
              solidsAmounts[unit] = 0;
            }
            solidsAmounts[unit] += activity.amount;
          } else if ("type" in activity && activity.type === "BOTTLE") {
            feedCount++;
            if (!consumedAmounts[unit]) {
              consumedAmounts[unit] = 0;
            }
            consumedAmounts[unit] += activity.amount;
          } else {
            if (!consumedAmounts[unit]) {
              consumedAmounts[unit] = 0;
            }
            consumedAmounts[unit] += activity.amount;
          }
        }
      }

      if (
        "type" in activity &&
        activity.type === "BREAST" &&
        "feedDuration" in activity &&
        activity.feedDuration
      ) {
        const time = new Date(activity.time);

        if (time >= startOfDay && time <= endOfDay) {
          if ("side" in activity && activity.side) {
            if (activity.side === "LEFT") {
              leftBreastSeconds += activity.feedDuration;
            } else if (activity.side === "RIGHT") {
              rightBreastSeconds += activity.feedDuration;
            }
          }
        }
      }

      if ("condition" in activity && "type" in activity) {
        const time = new Date(activity.time);

        if (time >= startOfDay && time <= endOfDay) {
          diaperCount++;

          if (activity.type === "DIRTY" || activity.type === "BOTH") {
            poopCount++;
          }
        }
      }

      if ("content" in activity) {
        const time = new Date(activity.time);

        if (time >= startOfDay && time <= endOfDay) {
          noteCount++;
        }
      }

      if ("soapUsed" in activity) {
        const time = new Date(activity.time);

        if (time >= startOfDay && time <= endOfDay) {
          bathCount++;
        }
      }

      if ("title" in activity && "category" in activity) {
        const date = new Date(activity.date);

        if (date >= startOfDay && date <= endOfDay) {
          milestoneCount++;
        }
      }

      if ("value" in activity && "unit" in activity && "type" in activity) {
        const date = new Date(activity.date);

        if (
          !lastMeasurements[activity.type] ||
          date > lastMeasurements[activity.type].date
        ) {
          lastMeasurements[activity.type] = {
            value: activity.value,
            unit: activity.unit,
            date: date,
          };
        }
      }

      if ("leftAmount" in activity || "rightAmount" in activity) {
        const isPumpActivity = (
          act: any
        ): act is {
          startTime?: string | Date;
          endTime?: string | Date | null;
          leftAmount?: number;
          rightAmount?: number;
          totalAmount?: number;
          unit?: string;
        } => {
          return "leftAmount" in act || "rightAmount" in act;
        };

        if (isPumpActivity(activity) && activity.startTime) {
          const startTime = new Date(activity.startTime);

          if (startTime >= startOfDay && startTime <= endOfDay) {
            const unit = activity.unit ? activity.unit.toLowerCase() : "oz";

            if (!pumpTotals[unit]) {
              pumpTotals[unit] = 0;
            }

            if (
              activity.leftAmount &&
              typeof activity.leftAmount === "number"
            ) {
              pumpTotals[unit] += activity.leftAmount;
            }

            if (
              activity.rightAmount &&
              typeof activity.rightAmount === "number"
            ) {
              pumpTotals[unit] += activity.rightAmount;
            }

            if (
              activity.totalAmount &&
              typeof activity.totalAmount === "number" &&
              (!activity.leftAmount || !activity.rightAmount)
            ) {
              pumpTotals[unit] += activity.totalAmount;
            }
          }
        }
      }

      if ("doseAmount" in activity && "medicineId" in activity) {
        const time = new Date(activity.time);

        if (time >= startOfDay && time <= endOfDay) {
          let medicineName = "Unknown";
          if (
            "medicine" in activity &&
            activity.medicine &&
            typeof activity.medicine === "object" &&
            "name" in activity.medicine
          ) {
            medicineName =
              (activity.medicine as { name?: string }).name || medicineName;
          }

          if (!medicineDoses[medicineName]) {
            medicineDoses[medicineName] = {
              count: 0,
              total: 0,
              unit: activity.unitAbbr || "",
            };
          }

          medicineDoses[medicineName].count += 1;
          if (activity.doseAmount && typeof activity.doseAmount === "number") {
            medicineDoses[medicineName].total += activity.doseAmount;
          }
        }
      }
    });

    let totalElapsedMinutes = 24 * 60;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      const elapsedMs = now.getTime() - startOfDay.getTime();
      totalElapsedMinutes = Math.floor(elapsedMs / (1000 * 60));
    }

    const awakeMinutes = totalElapsedMinutes - totalSleepMinutes;

    const formattedAmounts = Object.entries(consumedAmounts)
      .map(([unit, amount]) => `${amount} ${unit.toLowerCase()}`)
      .join(", ");
    const formattedConsumed =
      feedCount > 0
        ? `${feedCount} feed${feedCount !== 1 ? "s" : ""}, ${formattedAmounts}`
        : formattedAmounts || "None";

    const formattedSolidsConsumed = Object.entries(solidsAmounts)
      .map(([unit, amount]) => `${amount} ${unit.toLowerCase()}`)
      .join(", ");

    const formattedPumpTotals = Object.entries(pumpTotals)
      .map(([unit, amount]) => `${amount.toFixed(1)} ${unit}`)
      .join(", ");

    const formattedMedicineCounts = Object.entries(medicineDoses).map(
      ([name, data]) => ({
        name,
        count: data.count,
        total: data.total,
        unit: data.unit,
        display: `${data.count}x (${data.total}${data.unit})`,
      })
    );

    return {
      awakeTime: formatMinutes(awakeMinutes),
      sleepTime: formatMinutes(totalSleepMinutes),
      totalConsumed: formattedConsumed || "None",
      diaperChanges: diaperCount.toString(),
      poopCount: poopCount.toString(),
      leftBreastTime: formatMinutes(Math.floor(leftBreastSeconds / 60)),
      rightBreastTime: formatMinutes(Math.floor(rightBreastSeconds / 60)),
      noteCount: noteCount.toString(),
      solidsConsumed: formattedSolidsConsumed || "None",
      bathCount: bathCount.toString(),
      milestoneCount: milestoneCount.toString(),
      lastMeasurements,
      pumpTotals: formattedPumpTotals || "None",
      medicineCounts: formattedMedicineCounts,
    };
  }, [activities, date]);

  return (
    <Card
      className={cn(
        dailyStatsStyles.container,
        "overflow-hidden border-0 border-b border-gray-200"
      )}
    >
      <div
        className={cn(dailyStatsStyles.header, "cursor-pointer")}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className={dailyStatsStyles.title}>Daily Stats</h3>

        {!isExpanded && !isLoading && activities.length > 0 && (
          <StatsTicker
            stats={[
              ...(awakeTime !== "0h 0m"
                ? [
                    {
                      icon: <Sun className="h-3 w-3 text-amber-500" />,
                      label: "Acordada",
                      value: awakeTime,
                    },
                  ]
                : []),
              ...(sleepTime !== "0h 0m"
                ? [
                    {
                      icon: <Moon className="h-3 w-3 text-gray-700" />,
                      label: "Dormir",
                      value: sleepTime,
                    },
                  ]
                : []),
              ...(totalConsumed !== "None"
                ? [
                    {
                      icon: (
                        <Icon
                          iconNode={bottleBaby}
                          className="h-3 w-3 text-sky-600"
                        />
                      ),
                      label: "Mamadeira",
                      value: totalConsumed,
                    },
                  ]
                : []),
              ...(diaperChanges !== "0"
                ? [
                    {
                      icon: (
                        <Icon
                          iconNode={diaper}
                          className="h-3 w-3 text-teal-600"
                        />
                      ),
                      label: "Fraldas",
                      value: diaperChanges,
                    },
                  ]
                : []),
              ...(poopCount !== "0"
                ? [
                    {
                      icon: (
                        <Icon
                          iconNode={diaper}
                          className="h-3 w-3 text-amber-700"
                        />
                      ),
                      label: "Cocô",
                      value: poopCount,
                    },
                  ]
                : []),
              ...(solidsConsumed !== "None"
                ? [
                    {
                      icon: <Utensils className="h-3 w-3 text-green-600" />,
                      label: "Sólidas",
                      value: solidsConsumed,
                    },
                  ]
                : []),
              ...(leftBreastTime !== "0h 0m"
                ? [
                    {
                      icon: <Droplet className="h-3 w-3 text-blue-500" />,
                      label: "Esquerda",
                      value: leftBreastTime,
                    },
                  ]
                : []),
              ...(rightBreastTime !== "0h 0m"
                ? [
                    {
                      icon: <Droplet className="h-3 w-3 text-red-500" />,
                      label: "Direita",
                      value: rightBreastTime,
                    },
                  ]
                : []),
              ...(noteCount !== "0"
                ? [
                    {
                      icon: <StickyNote className="h-3 w-3 text-yellow-500" />,
                      label: "Notas",
                      value: noteCount,
                    },
                  ]
                : []),
              ...(bathCount !== "0"
                ? [
                    {
                      icon: <Bath className="h-3 w-3 text-orange-500" />,
                      label: "Banhos",
                      value: bathCount,
                    },
                  ]
                : []),
              ...(milestoneCount !== "0"
                ? [
                    {
                      icon: <Trophy className="h-3 w-3 text-blue-500" />,
                      label: "Conquistas",
                      value: milestoneCount,
                    },
                  ]
                : []),
              ...(pumpTotals !== "None"
                ? [
                    {
                      icon: (
                        <LampWallDown className="h-3 w-3 text-purple-500" />
                      ),
                      label: "Bomba",
                      value: pumpTotals,
                    },
                  ]
                : []),
              ...(medicineCounts.length > 0
                ? medicineCounts.map((med) => ({
                    icon: <PillBottle className="h-3 w-3 text-green-600" />,
                    label: med.name,
                    value: med.display,
                  }))
                : []),
              ...(lastMeasurements["HEIGHT"]
                ? [
                    {
                      icon: <Ruler className="h-3 w-3 text-red-500" />,
                      label: "Altura",
                      value: `${lastMeasurements["HEIGHT"].value} ${lastMeasurements["HEIGHT"].unit}`,
                    },
                  ]
                : []),
              ...(lastMeasurements["WEIGHT"]
                ? [
                    {
                      icon: <Scale className="h-3 w-3 text-red-500" />,
                      label: "Peso",
                      value: `${lastMeasurements["WEIGHT"].value} ${lastMeasurements["WEIGHT"].unit}`,
                    },
                  ]
                : []),
              ...(lastMeasurements["HEAD_CIRCUMFERENCE"]
                ? [
                    {
                      icon: <RotateCw className="h-3 w-3 text-red-500" />,
                      label: "Cabeça",
                      value: `${lastMeasurements["HEAD_CIRCUMFERENCE"].value} ${lastMeasurements["HEAD_CIRCUMFERENCE"].unit}`,
                    },
                  ]
                : []),
              ...(lastMeasurements["TEMPERATURE"]
                ? [
                    {
                      icon: <Thermometer className="h-3 w-3 text-red-500" />,
                      label: "Temperatura",
                      value: `${lastMeasurements["TEMPERATURE"].value} ${lastMeasurements["TEMPERATURE"].unit}`,
                    },
                  ]
                : []),
            ]}
          />
        )}

        <button className={dailyStatsStyles.toggle}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {isExpanded && (
        <div className={dailyStatsStyles.content}>
          {isLoading ? (
            <div className={dailyStatsStyles.empty}>
              Carregando estatísticas diárias...
            </div>
          ) : activities.length === 0 ? (
            <div className={dailyStatsStyles.empty}>
              Nenhuma atividade registrada para este dia.
            </div>
          ) : (
            <>
              <StatItem
                icon={<Sun className="h-4 w-4 text-amber-500" />}
                label="Hora de acordar"
                value={awakeTime}
              />
              <StatItem
                icon={<Moon className="h-4 w-4 text-gray-700" />}
                label="Hora de dormir"
                value={sleepTime}
              />
              {totalConsumed !== "None" && (
                <StatItem
                  icon={
                    <Icon
                      iconNode={bottleBaby}
                      className="h-4 w-4 text-sky-600"
                    />
                  }
                  label="Mamadeira"
                  value={totalConsumed}
                />
              )}
              {diaperChanges !== "0" && (
                <StatItem
                  icon={
                    <Icon iconNode={diaper} className="h-4 w-4 text-teal-600" />
                  }
                  label="Trocas de fraldas"
                  value={diaperChanges}
                />
              )}
              {poopCount !== "0" && (
                <StatItem
                  icon={
                    <Icon
                      iconNode={diaper}
                      className="h-4 w-4 text-amber-700"
                    />
                  }
                  label="Cocô"
                  value={poopCount}
                />
              )}
              {solidsConsumed !== "None" && (
                <StatItem
                  icon={<Utensils className="h-4 w-4 text-green-600" />}
                  label="Sólidas"
                  value={solidsConsumed}
                />
              )}
              {leftBreastTime !== "0h 0m" && (
                <StatItem
                  icon={<Droplet className="h-4 w-4 text-blue-500" />}
                  label="Seio Esquerdo"
                  value={leftBreastTime}
                />
              )}
              {rightBreastTime !== "0h 0m" && (
                <StatItem
                  icon={<Droplet className="h-4 w-4 text-red-500" />}
                  label="Seio direito"
                  value={rightBreastTime}
                />
              )}
              {noteCount !== "0" && (
                <StatItem
                  icon={<StickyNote className="h-4 w-4 text-yellow-500" />}
                  label="Notas"
                  value={noteCount}
                />
              )}
              {bathCount !== "0" && (
                <StatItem
                  icon={<Bath className="h-4 w-4 text-orange-500" />}
                  label="Banhos"
                  value={bathCount}
                />
              )}
              {milestoneCount !== "0" && (
                <StatItem
                  icon={<Trophy className="h-4 w-4 text-blue-500" />}
                  label="Conquistas"
                  value={milestoneCount}
                />
              )}
              {pumpTotals !== "None" && (
                <StatItem
                  icon={<LampWallDown className="h-4 w-4 text-purple-500" />}
                  label="Bomba"
                  value={pumpTotals}
                />
              )}
              {medicineCounts.length > 0 &&
                medicineCounts.map((med, index) => (
                  <StatItem
                    key={`med-${index}`}
                    icon={<PillBottle className="h-4 w-4 text-green-600" />}
                    label={med.name}
                    value={med.display}
                  />
                ))}
              {lastMeasurements["HEIGHT"] && (
                <StatItem
                  icon={<Ruler className="h-4 w-4 text-red-500" />}
                  label="Altura"
                  value={`${lastMeasurements["HEIGHT"].value} ${lastMeasurements["HEIGHT"].unit}`}
                />
              )}
              {lastMeasurements["WEIGHT"] && (
                <StatItem
                  icon={<Scale className="h-4 w-4 text-red-500" />}
                  label="Peso"
                  value={`${lastMeasurements["WEIGHT"].value} ${lastMeasurements["WEIGHT"].unit}`}
                />
              )}
              {lastMeasurements["HEAD_CIRCUMFERENCE"] && (
                <StatItem
                  icon={<RotateCw className="h-4 w-4 text-red-500" />}
                  label="Cabeça Circ."
                  value={`${lastMeasurements["HEAD_CIRCUMFERENCE"].value} ${lastMeasurements["HEAD_CIRCUMFERENCE"].unit}`}
                />
              )}
              {lastMeasurements["TEMPERATURE"] && (
                <StatItem
                  icon={<Thermometer className="h-4 w-4 text-red-500" />}
                  label="Temperatura"
                  value={`${lastMeasurements["TEMPERATURE"].value} ${lastMeasurements["TEMPERATURE"].unit}`}
                />
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
};

export default DailyStats;
