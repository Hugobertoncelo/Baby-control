import { Settings } from "@prisma/client";
import {
  Moon,
  Icon,
  Edit,
  Bath,
  LampWallDown,
  Trophy,
  Ruler,
  Scale,
  RotateCw,
  Thermometer,
  PillBottle,
} from "lucide-react";
import { diaper, bottleBaby } from "@lucide/lab";
import {
  ActivityType,
  ActivityDetails,
  ActivityDescription,
  ActivityStyle,
} from "./types";

export const getActivityIcon = (activity: ActivityType) => {
  if ("doseAmount" in activity && "medicineId" in activity) {
    return <PillBottle className="h-4 w-4 text-white" />;
  }
  if ("type" in activity) {
    if ("duration" in activity) {
      return <Moon className="h-4 w-4 text-white" />;
    }
    if ("amount" in activity) {
      return <Icon iconNode={bottleBaby} className="h-4 w-4 text-gray-700" />;
    }
    if ("condition" in activity) {
      return <Icon iconNode={diaper} className="h-4 w-4 text-white" />;
    }
  }
  if ("content" in activity) {
    return <Edit className="h-4 w-4 text-gray-700" />;
  }
  if ("soapUsed" in activity) {
    return <Bath className="h-4 w-4 text-white" />;
  }
  if ("leftAmount" in activity || "rightAmount" in activity) {
    return <LampWallDown className="h-4 w-4 text-white" />;
  }
  if ("title" in activity && "category" in activity) {
    return <Trophy className="h-4 w-4 text-white" />;
  }
  if ("value" in activity && "unit" in activity) {
    if ("type" in activity) {
      switch (activity.type) {
        case "HEIGHT":
          return <Ruler className="h-4 w-4 text-white" />;
        case "WEIGHT":
          return <Scale className="h-4 w-4 text-white" />;
        case "HEAD_CIRCUMFERENCE":
          return <RotateCw className="h-4 w-4 text-white" />;
        case "TEMPERATURE":
          return <Thermometer className="h-4 w-4 text-white" />;
        default:
          return <Ruler className="h-4 w-4 text-white" />;
      }
    }
    return <Ruler className="h-4 w-4 text-white" />;
  }
  return null;
};

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
  if ("date" in activity && activity.date) {
    return String(activity.date);
  }
  return new Date().toLocaleString();
};

export const formatTime = (
  date: string,
  settings: Settings | null,
  includeDate: boolean = true
) => {
  if (!date) return "Invalid Date";

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "Invalid Date";

    const timeStr = dateObj.toLocaleTimeString("pt-BR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (!includeDate) return timeStr;

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = dateObj.toDateString() === today.toDateString();
    const isYesterday = dateObj.toDateString() === yesterday.toDateString();

    const dateStr = isToday
      ? "Today"
      : isYesterday
      ? "Yesterday"
      : dateObj
          .toLocaleDateString("pt-BR", {
            month: "short",
            day: "numeric",
          })
          .replace(/(\d+)$/, "$1,");
    return `${dateStr} ${timeStr}`;
  } catch (error) {
    console.error("Error formatting time:", error);
    return "Invalid Date";
  }
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `(${hours.toString().padStart(2, "0")}:${remainingMinutes
    .toString()
    .padStart(2, "0")})`;
};

export const getActivityDetails = (
  activity: ActivityType,
  settings: Settings | null
): ActivityDetails => {
  const caretakerDetail = activity.caretakerName
    ? [{ label: "Zelador", value: activity.caretakerName }]
    : [];

  if ("type" in activity) {
    if ("duration" in activity) {
      const startTime = activity.startTime
        ? formatTime(activity.startTime, settings, true)
        : "unknown";
      let endTime = "ongoing";

      if (activity.endTime) {
        endTime = formatTime(activity.endTime, settings, true);
      }

      const duration = activity.duration
        ? ` ${formatDuration(activity.duration)}`
        : "";
      const formatSleepQuality = (quality: string) => {
        switch (quality) {
          case "POOR":
            return "Poor";
          case "FAIR":
            return "Fair";
          case "GOOD":
            return "Good";
          case "EXCELLENT":
            return "Excellent";
          default:
            return quality;
        }
      };
      const formatLocation = (location: string) => {
        if (location === "OTHER") return "Other";

        return location;
      };
      const details = [
        {
          label: "Type",
          value: activity.type === "NAP" ? "Nap" : "Night Sleep",
        },
        { label: "Start Time", value: startTime },
      ];

      if (activity.endTime) {
        let durationValue = "unknown";
        if (activity.duration) {
          const hours = Math.floor(activity.duration / 60);
          const mins = activity.duration % 60;
          durationValue = `${hours}h ${mins}m`;
        }
        details.push(
          { label: "End Time", value: endTime },
          { label: "Duration", value: durationValue }
        );
        if (activity.quality) {
          details.push({
            label: "Quality",
            value: formatSleepQuality(activity.quality),
          });
        }
      }

      if (activity.location) {
        details.push({
          label: "Location",
          value: formatLocation(activity.location),
        });
      }

      return {
        title: "Sleep Record",
        details: [...details, ...caretakerDetail],
      };
    }
    if ("amount" in activity) {
      const formatFeedType = (type: string) => {
        switch (type) {
          case "BREAST":
            return "Breast";
          case "BOTTLE":
            return "Bottle";
          case "SOLIDS":
            return "Solid Food";
          default:
            return type;
        }
      };
      const formatBreastSide = (side: string) => {
        switch (side) {
          case "LEFT":
            return "Esquerda";
          case "RIGHT":
            return "Direita";
          default:
            return side;
        }
      };
      const details = [
        { label: "Time", value: formatTime(activity.time, settings) },
        { label: "Type", value: formatFeedType(activity.type) },
      ];

      if (
        activity.amount &&
        (activity.type === "BOTTLE" || activity.type === "SOLIDS")
      ) {
        const unit =
          (activity as any).unitAbbr ||
          (activity.type === "BOTTLE" ? "oz" : "g");
        details.push({
          label: "Quantia",
          value: `${activity.amount} ${unit}`,
        });
      }

      if (activity.type === "BREAST") {
        if (activity.side) {
          details.push({
            label: "Lado",
            value: formatBreastSide(activity.side),
          });
        }

        if (activity.feedDuration) {
          const minutes = Math.floor(activity.feedDuration / 60);
          const seconds = activity.feedDuration % 60;
          details.push({
            label: "Duração",
            value:
              seconds > 0
                ? `${minutes} min ${seconds} seg`
                : `${minutes} minutos`,
          });
        } else if (activity.amount) {
          details.push({
            label: "Duração",
            value: `${activity.amount} minutos`,
          });
        }
      }

      if (activity.type === "SOLIDS" && activity.food) {
        details.push({ label: "Comida", value: activity.food });
      }

      return {
        title: "Registro de Feed",
        details: [...details, ...caretakerDetail],
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
            return "Molhada e Sujo";
          default:
            return type;
        }
      };
      const formatDiaperCondition = (condition: string) => {
        switch (condition) {
          case "NORMAL":
            return "Normal";
          case "LOOSE":
            return "Solta";
          case "FIRM":
            return "Firma";
          case "OTHER":
            return "Outra";
          default:
            return condition;
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
            return "Outra";
          default:
            return color;
        }
      };
      const details = [
        { label: "Tempo", value: formatTime(activity.time, settings) },
        { label: "Tipo", value: formatDiaperType(activity.type) },
      ];

      if (activity.type !== "WET") {
        if (activity.condition) {
          details.push({
            label: "Doença",
            value: formatDiaperCondition(activity.condition),
          });
        }
        if (activity.color) {
          details.push({
            label: "Cor",
            value: formatDiaperColor(activity.color),
          });
        }
      }

      if (activity.blowout) {
        details.push({ label: "Blowout/Leakage", value: "Yes" });
      }

      return {
        title: "Registro de Fraldas",
        details: [...details, ...caretakerDetail],
      };
    }
  }
  if ("content" in activity) {
    const noteDetails = [
      { label: "Tempo", value: formatTime(activity.time, settings) },
      { label: "Contente", value: activity.content },
      { label: "Categoria", value: activity.category || "Não especificado" },
    ];

    return {
      title: "Nota",
      details: [...noteDetails, ...caretakerDetail],
    };
  }
  if ("soapUsed" in activity) {
    const bathDetails = [
      { label: "Tempo", value: formatTime(activity.time, settings) },
      { label: "Sabão usado", value: activity.soapUsed ? "Sim" : "Não" },
      { label: "Shampoo usado", value: activity.shampooUsed ? "Sim" : "Não" },
    ];

    if (activity.notes) {
      bathDetails.push({ label: "Notes", value: activity.notes });
    }

    return {
      title: "Registro de banho",
      details: [...bathDetails, ...caretakerDetail],
    };
  }

  if ("leftAmount" in activity || "rightAmount" in activity) {
    const pumpDetails = [];

    const isPumpActivity = (
      act: any
    ): act is {
      startTime?: string;
      endTime?: string | null;
      leftAmount?: number;
      rightAmount?: number;
      totalAmount?: number;
      unit?: string;
      notes?: string;
    } => {
      return "leftAmount" in act || "rightAmount" in act;
    };

    if (isPumpActivity(activity)) {
      if (activity.startTime) {
        pumpDetails.push({
          label: "Hora de início",
          value: formatTime(activity.startTime, settings),
        });
      }

      if (activity.endTime) {
        pumpDetails.push({
          label: "Hora de término",
          value: formatTime(activity.endTime, settings),
        });
      }

      if (activity.leftAmount) {
        pumpDetails.push({
          label: "Peito Esquerdo",
          value: `${activity.leftAmount} ${activity.unit || "oz"}`,
        });
      }

      if (activity.rightAmount) {
        pumpDetails.push({
          label: "Seio direito",
          value: `${activity.rightAmount} ${activity.unit || "oz"}`,
        });
      }

      if (activity.totalAmount) {
        pumpDetails.push({
          label: "Montante total",
          value: `${activity.totalAmount} ${activity.unit || "oz"}`,
        });
      }

      if (activity.notes) {
        pumpDetails.push({ label: "Notas", value: activity.notes });
      }
    }

    return {
      title: "Registro de bombeamento mamário",
      details: [...pumpDetails, ...caretakerDetail],
    };
  }

  if ("title" in activity && "categoria" in activity) {
    const formatMilestoneCategory = (category: string) => {
      switch (category) {
        case "MOTOR":
          return "Habilidades motoras";
        case "COGNITIVE":
          return "Cognitiva";
        case "SOCIAL":
          return "Social";
        case "LANGUAGE":
          return "Linguagem";
        case "OTHER":
          return "Outra";
        default:
          return category;
      }
    };

    const milestoneDetails = [
      { label: "Data", value: formatTime(activity.date, settings) },
      { label: "Título", value: activity.title },
      { label: "Categoria", value: formatMilestoneCategory(activity.category) },
    ];

    if (activity.description) {
      milestoneDetails.push({
        label: "Descrição",
        value: activity.description,
      });
    }

    if (activity.ageInDays) {
      const years = Math.floor(activity.ageInDays / 365);
      const months = Math.floor((activity.ageInDays % 365) / 30);
      const days = activity.ageInDays % 30;
      let ageString = "";

      if (years > 0) {
        ageString += `${years} year${years !== 1 ? "s" : ""} `;
      }
      if (months > 0) {
        ageString += `${months} month${months !== 1 ? "s" : ""} `;
      }
      if (days > 0 || (years === 0 && months === 0)) {
        ageString += `${days} day${days !== 1 ? "s" : ""}`;
      }

      milestoneDetails.push({ label: "Age", value: ageString.trim() });
    }

    return {
      title: "Marco",
      details: [...milestoneDetails, ...caretakerDetail],
    };
  }

  if ("value" in activity && "unit" in activity) {
    const formatMeasurementType = (type: string) => {
      switch (type) {
        case "HEIGHT":
          return "Altura";
        case "WEIGHT":
          return "Peso";
        case "HEAD_CIRCUMFERENCE":
          return "Circunferência da Cabeça";
        case "TEMPERATURE":
          return "Temperatura";
        case "OTHER":
          return "Outra";
        default:
          return type;
      }
    };

    const measurementDetails = [
      { label: "Date", value: formatTime(activity.date, settings) },
      { label: "Type", value: formatMeasurementType(activity.type) },
      { label: "Value", value: `${activity.value} ${activity.unit}` },
    ];

    if (activity.notes) {
      measurementDetails.push({ label: "Notes", value: activity.notes });
    }

    return {
      title: "Medição",
      details: [...measurementDetails, ...caretakerDetail],
    };
  }

  return { title: "Activity", details: [...caretakerDetail] };
};

export const getActivityDescription = (
  activity: ActivityType,
  settings: Settings | null
): ActivityDescription => {
  if ("doseAmount" in activity && "medicineId" in activity) {
    let medName = "Medicine";
    if (
      "medicine" in activity &&
      activity.medicine &&
      typeof activity.medicine === "object" &&
      "name" in activity.medicine
    ) {
      medName = (activity.medicine as { name?: string }).name || medName;
    }
    const dose = activity.doseAmount
      ? `${activity.doseAmount} ${activity.unitAbbr || ""}`.trim()
      : "";
    const medTime = formatTime(activity.time, settings, true);
    let notes = activity.notes ? activity.notes : "";
    if (notes.length > 50) notes = notes.substring(0, 50) + "...";
    return {
      type: medName,
      details: [medTime, `- ${dose}`, notes].filter(Boolean).join(" "),
    };
  }
  if ("type" in activity) {
    if ("duration" in activity) {
      const startTimeFormatted = activity.startTime
        ? formatTime(activity.startTime, settings, true)
        : "unknown";
      const endTimeFormatted = activity.endTime
        ? formatTime(activity.endTime, settings, true)
        : "ongoing";
      const duration = activity.duration
        ? ` ${formatDuration(activity.duration)}`
        : "";
      const location =
        activity.location === "OTHER"
          ? "Other"
          : activity.location
              ?.split("_")
              .map(
                (word) =>
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              )
              .join(" ");
      return {
        type: activity.type === "NAP" ? "Sesta" : "Noite de sono",
        details: `${startTimeFormatted} - ${endTimeFormatted
          .split(" ")
          .slice(-2)
          .join(" ")}${duration}`,
      };
    }
    if ("amount" in activity) {
      const formatFeedType = (type: string) => {
        switch (type) {
          case "BREAST":
            return "Seios";
          case "BOTTLE":
            return "Mamadeira";
          case "SOLIDS":
            return "Alimentos Sólidos";
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
            return "Esquerda";
          case "RIGHT":
            return "Direita";
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
          ? `Side: ${formatBreastSide(activity.side)}`
          : "";

        let duration = "";
        if (activity.feedDuration) {
          const minutes = Math.floor(activity.feedDuration / 60);
          const seconds = activity.feedDuration % 60;
          duration = seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} min`;
        } else if (activity.amount) {
          duration = `${activity.amount} min`;
        }

        details = [side, duration].filter(Boolean).join(", ");
      } else if (activity.type === "BOTTLE") {
        const unit = ((activity as any).unitAbbr || "oz").toLowerCase();
        details = `${activity.amount || "unknown"} ${unit}`;
      } else if (activity.type === "SOLIDS") {
        const unit = ((activity as any).unitAbbr || "g").toLowerCase();
        details = `${activity.amount || "unknown"} ${unit}`;
        if (activity.food) {
          details += ` of ${activity.food}`;
        }
      }

      const time = formatTime(activity.time, settings, true);
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
            return "Solta";
          case "FIRM":
            return "Empresa";
          case "OTHER":
            return "Outra";
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
        if (activity.color) conditions.push(formatDiaperColor(activity.color));
        if (conditions.length > 0) {
          details = ` (${conditions.join(", ")}) - `;
        }
      }

      const blowoutText = activity.blowout ? " - Blowout/Leakage" : "";

      const time = formatTime(activity.time, settings, true);
      return {
        type: formatDiaperType(activity.type),
        details: `${details}${time}${blowoutText}`,
      };
    }
  }
  if ("content" in activity) {
    const time = formatTime(activity.time, settings, true);
    const truncatedContent =
      activity.content.length > 50
        ? activity.content.substring(0, 50) + "..."
        : activity.content;
    return {
      type: activity.category || "Note",
      details: `${time} - ${truncatedContent}`,
    };
  }
  if ("soapUsed" in activity) {
    const time = formatTime(activity.time, settings, true);
    let bathDetails = "";

    if (!activity.soapUsed && !activity.shampooUsed) {
      bathDetails = "water only";
    } else if (activity.soapUsed && activity.shampooUsed) {
      bathDetails = "with soap and shampoo";
    } else if (activity.soapUsed) {
      bathDetails = "with soap";
    } else if (activity.shampooUsed) {
      bathDetails = "with shampoo";
    }

    let notesText = "";
    if (activity.notes) {
      const truncatedNotes =
        activity.notes.length > 30
          ? activity.notes.substring(0, 30) + "..."
          : activity.notes;
      notesText = ` - ${truncatedNotes}`;
    }

    return {
      type: "Bath",
      details: `${time} - ${bathDetails}${notesText}`,
    };
  }

  if ("leftAmount" in activity || "rightAmount" in activity) {
    const isPumpActivity = (
      act: any
    ): act is {
      startTime?: string;
      endTime?: string | null;
      leftAmount?: number;
      rightAmount?: number;
      totalAmount?: number;
      unit?: string;
      duration?: number;
    } => {
      return "leftAmount" in act || "rightAmount" in act;
    };

    if (isPumpActivity(activity)) {
      const startTime = activity.startTime
        ? formatTime(activity.startTime, settings, true)
        : "unknown";
      let details = startTime;

      if (activity.duration) {
        details += ` ${formatDuration(activity.duration)}`;
      } else if (activity.startTime && activity.endTime) {
        const start = new Date(activity.startTime).getTime();
        const end = new Date(activity.endTime).getTime();
        const durationMinutes = Math.floor((end - start) / 60000);
        if (!isNaN(durationMinutes) && durationMinutes > 0) {
          details += ` ${formatDuration(durationMinutes)}`;
        }
      }

      const amountDetails = [];
      if (activity.leftAmount)
        amountDetails.push(
          `Left: ${activity.leftAmount} ${activity.unit || "oz"}`
        );
      if (activity.rightAmount)
        amountDetails.push(
          `Right: ${activity.rightAmount} ${activity.unit || "oz"}`
        );
      if (activity.totalAmount)
        amountDetails.push(
          `Total: ${activity.totalAmount} ${activity.unit || "oz"}`
        );

      if (amountDetails.length > 0) {
        details += ` - ${amountDetails.join(", ")}`;
      }

      return {
        type: "Breast Pumping",
        details,
      };
    }
  }

  if ("title" in activity && "category" in activity) {
    const formatMilestoneCategory = (category: string) => {
      switch (category) {
        case "MOTOR":
          return "Motor";
        case "COGNITIVE":
          return "Cognitiva";
        case "SOCIAL":
          return "Social";
        case "LANGUAGE":
          return "Linguagem";
        case "OTHER":
          return "Outra";
        default:
          return category;
      }
    };

    const date = formatTime(activity.date, settings, true);
    const truncatedTitle =
      activity.title.length > 30
        ? activity.title.substring(0, 30) + "..."
        : activity.title;

    return {
      type: formatMilestoneCategory(activity.category),
      details: `${date} - ${truncatedTitle}`,
    };
  }

  if ("value" in activity && "unit" in activity) {
    const formatMeasurementType = (type: string) => {
      switch (type) {
        case "HEIGHT":
          return "Altura";
        case "WEIGHT":
          return "Peso";
        case "HEAD_CIRCUMFERENCE":
          return "Circunferência da Cabeça";
        case "TEMPERATURE":
          return "Temperatura";
        case "OTHER":
          return "Outra";
        default:
          return type;
      }
    };

    const date = formatTime(activity.date, settings, true);

    return {
      type: formatMeasurementType(activity.type),
      details: `${date} - ${activity.value} ${activity.unit}`,
    };
  }

  return {
    type: "Activity",
    details: "logged",
  };
};

export const getActivityEndpoint = (activity: ActivityType): string => {
  if ("leftAmount" in activity || "rightAmount" in activity) return "pump-log";
  if ("duration" in activity) return "sleep-log";
  if ("amount" in activity) return "feed-log";
  if ("condition" in activity) return "diaper-log";
  if ("doseAmount" in activity && "medicineId" in activity)
    return "medicine-log";
  if ("content" in activity) return "note";
  if ("soapUsed" in activity) return "bath-log";
  if ("title" in activity && "category" in activity) return "milestone-log";
  if ("value" in activity && "unit" in activity) return "measurement-log";

  console.log("Activity type not identified:", activity);

  return "";
};

export const getActivityStyle = (activity: ActivityType): ActivityStyle => {
  if ("doseAmount" in activity && "medicineId" in activity) {
    return {
      bg: "bg-[#43B755]",
      textColor: "text-white",
    };
  }
  if ("type" in activity) {
    if ("duration" in activity) {
      return {
        bg: "bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600",
        textColor: "text-white",
      };
    }
    if ("amount" in activity) {
      return {
        bg: "bg-sky-200",
        textColor: "text-gray-700",
      };
    }
    if ("condition" in activity) {
      return {
        bg: "bg-gradient-to-r from-teal-600 to-teal-700",
        textColor: "text-white",
      };
    }
  }
  if ("content" in activity) {
    return {
      bg: "bg-[#FFFF99]",
      textColor: "text-gray-700",
    };
  }
  if ("soapUsed" in activity) {
    return {
      bg: "bg-gradient-to-r from-orange-400 to-orange-500",
      textColor: "text-white",
    };
  }
  if ("leftAmount" in activity || "rightAmount" in activity) {
    return {
      bg: "bg-gradient-to-r from-purple-200 to-purple-300",
      textColor: "text-white",
    };
  }
  if ("title" in activity && "category" in activity) {
    return {
      bg: "bg-[#4875EC]",
      textColor: "text-white",
    };
  }
  if ("value" in activity && "unit" in activity) {
    return {
      bg: "bg-[#EA6A5E]",
      textColor: "text-white",
    };
  }
  return {
    bg: "bg-gray-100",
    textColor: "text-gray-700",
  };
};
