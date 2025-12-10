import { ActivityType } from "./activity-tile.types";
import {
  BathLogResponse,
  PumpLogResponse,
  MeasurementResponse,
  MilestoneResponse,
  MedicineLogResponse,
} from "@/app/api/types";
import { useTimezone } from "@/app/context/timezone";

export const getActivityTime = (activity: ActivityType): string => {
  if ("time" in activity && activity.time) {
    return activity.time;
  }
  if ("startTime" in activity && activity.startTime) {
    if ("duration" in activity && activity.endTime) {
      return String(activity.endTime);
    }
    return String(activity.startTime);
  }
  return new Date().toISOString();
};

export const getActivityVariant = (
  activity: ActivityType
):
  | "sleep"
  | "feed"
  | "diaper"
  | "note"
  | "bath"
  | "pump"
  | "measurement"
  | "milestone"
  | "medicine"
  | "default" => {
  if ("type" in activity) {
    if ("duration" in activity) return "sleep";
    if ("amount" in activity) return "feed";
    if ("condition" in activity) return "diaper";
    if ("soapUsed" in activity || "shampooUsed" in activity) return "bath";
    if ("value" in activity && "unit" in activity) return "measurement";
  }
  if ("doseAmount" in activity && "medicineId" in activity) return "medicine";
  if ("title" in activity && "category" in activity) return "milestone";
  if ("leftAmount" in activity || "rightAmount" in activity) return "pump";
  if ("content" in activity) return "note";
  return "default";
};

export const useActivityDescription = () => {
  const {
    formatDateTime,
    formatTime,
    formatDuration: formatDurationTime,
  } = useTimezone();

  const formatDuration = (minutes: number): string => {
    return `(${formatDurationTime(minutes)})`;
  };

  const getActivityDescription = (activity: ActivityType) => {
    if ("type" in activity) {
      if ("duration" in activity) {
        const startTimeFormatted = activity.startTime
          ? formatDateTime(activity.startTime)
          : "desconhecido";
        const endTimeFormatted = activity.endTime
          ? formatDateTime(activity.endTime)
          : "em andamento";
        const duration = activity.duration
          ? ` ${formatDuration(activity.duration)}`
          : "";
        const location =
          activity.location === "OTHER"
            ? "Outro"
            : activity.location
                ?.split("_")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");

        const endTimeOnly = activity.endTime
          ? formatTime(activity.endTime)
          : "em andamento";

        return {
          type: `${activity.type === "NAP" ? "Soneca" : "Sono Noturno"}${
            location ? ` - ${location}` : ""
          }`,
          details: `${startTimeFormatted} - ${endTimeOnly}${duration}`,
        };
      }
      if ("amount" in activity) {
        const formatFeedType = (type: string) => {
          switch (type) {
            case "BREAST":
              return "Amamentação";
            case "BOTTLE":
              return "Mamadeira";
            case "SOLIDS":
              return "Alimento Sólido";
            default:
              return type
                .split("_")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");
          }
        };
        const formatBreastSide = (side: string) => {
          switch (side) {
            case "LEFT":
              return "Esquerdo";
            case "RIGHT":
              return "Direito";
            default:
              return side
                .split("_")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");
          }
        };

        let details = "";
        if (activity.type === "BREAST") {
          const side = activity.side
            ? `Lado: ${formatBreastSide(activity.side)}`
            : "";
          const duration = activity.amount ? `${activity.amount} min` : "";
          details = [side, duration].filter(Boolean).join(", ");
        } else if (activity.type === "BOTTLE") {
          details = `${activity.amount || "desconhecido"} oz`;
        } else if (activity.type === "SOLIDS") {
          details = `${activity.amount || "desconhecido"} g`;
          if (activity.food) {
            details += ` de ${activity.food}`;
          }
        }

        const time = formatDateTime(activity.time);
        return {
          type: formatFeedType(activity.type),
          details: `${details} - ${time}`,
        };
      }
      if ("condition" in activity) {
        const formatDiaperType = (type: string) => {
          switch (type) {
            case "WET":
              return "Molhada";
            case "DIRTY":
              return "Suja";
            case "BOTH":
              return "Molhada e Suja";
            default:
              return type
                .split("_")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");
          }
        };
        const formatDiaperCondition = (condition: string) => {
          switch (condition) {
            case "NORMAL":
              return "Normal";
            case "LOOSE":
              return "Mole";
            case "FIRM":
              return "Firme";
            case "OTHER":
              return "Outro";
            default:
              return condition
                .split("_")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");
          }
        };
        const formatDiaperColor = (color: string) => {
          switch (color) {
            case "YELLOW":
              return "Amarelo";
            case "BROWN":
              return "Marrom";
            case "GREEN":
              return "Verde";
            case "OTHER":
              return "Outro";
            default:
              return color
                .split("_")
                .map(
                  (word) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ");
          }
        };

        let details = "";
        if (activity.type !== "WET") {
          const conditions = [];
          if (activity.condition)
            conditions.push(formatDiaperCondition(activity.condition));
          if (activity.color)
            conditions.push(formatDiaperColor(activity.color));
          if (conditions.length > 0) {
            details = ` (${conditions.join(", ")}) - `;
          }
        }

        const time = formatDateTime(activity.time);
        return {
          type: formatDiaperType(activity.type),
          details: `${details}${time}`,
        };
      }
    }
    if ("content" in activity) {
      const time = formatDateTime(activity.time);
      const truncatedContent =
        activity.content.length > 50
          ? activity.content.substring(0, 50) + "..."
          : activity.content;
      return {
        type: activity.category || "Nota",
        details: `${time} - ${truncatedContent}`,
      };
    }
    const isBathLog = (activity: ActivityType): activity is BathLogResponse => {
      return "soapUsed" in activity || "shampooUsed" in activity;
    };

    if (isBathLog(activity)) {
      const time = formatDateTime(activity.time);
      const notes = activity.notes ? ` - ${activity.notes}` : "";
      return {
        type: "Banho",
        details: `${time}${notes}`,
      };
    }

    const isPumpLog = (activity: ActivityType): activity is PumpLogResponse => {
      return "leftAmount" in activity || "rightAmount" in activity;
    };

    if (isPumpLog(activity)) {
      const startTime = activity.startTime
        ? formatDateTime(activity.startTime)
        : "";

      let details = startTime;

      if (activity.totalAmount) {
        const amountStr = `${activity.totalAmount} ${
          activity.unitAbbr || "oz"
        }`;
        details += details ? ` - ${amountStr}` : amountStr;
      } else if (activity.leftAmount || activity.rightAmount) {
        const amounts = [];
        if (activity.leftAmount) amounts.push(`E: ${activity.leftAmount}`);
        if (activity.rightAmount) amounts.push(`D: ${activity.rightAmount}`);

        if (amounts.length > 0) {
          const amountStr = `${amounts.join(", ")} ${
            activity.unitAbbr || "oz"
          }`;
          details += details ? ` - ${amountStr}` : amountStr;
        }
      }

      const notes = activity.notes ? ` - ${activity.notes}` : "";

      return {
        type: "Bombear",
        details: `${details}${notes}`,
      };
    }

    return {
      type: "Atividade",
      details: "registrada",
    };
  };

  return { getActivityDescription };
};

export const getActivityDescription = (activity: ActivityType) => {
  console.warn(
    "getActivityDescription está obsoleto. Use useActivityDescription().getActivityDescription() em vez disso."
  );

  return {
    type: getActivityVariant(activity),
    details: "Por favor, atualize para usar o hook useActivityDescription",
  };
};
