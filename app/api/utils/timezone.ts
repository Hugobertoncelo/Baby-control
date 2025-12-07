import prisma from "../db";

export function getSystemTimezone(): string {
  try {
    if (process.env.TZ) {
      return process.env.TZ;
    }
    const { execSync } = require("child_process");
    if (process.platform === "darwin") {
      const tzOutput = execSync("systemsetup -gettimezone").toString().trim();
      const match = tzOutput.match(/Time Zone: (.+)$/);
      if (match && match[1]) {
        return match[1];
      }
    } else if (process.platform === "linux") {
      try {
        return execSync("cat /etc/timezone").toString().trim();
      } catch (error) {
        try {
          const linkTarget = execSync("readlink -f /etc/localtime")
            .toString()
            .trim();
          const match = linkTarget.match(/\/usr\/share\/zoneinfo\/(.+)$/);
          if (match && match[1]) {
            return match[1];
          }
        } catch (innerError) {
          try {
            return execSync("cat /etc/TZ").toString().trim();
          } catch (tzError) {
            if (process.env.TZ) {
              return process.env.TZ;
            }
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
          }
        }
      }
    }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    return "UTC";
  }
}

export async function getSettings() {
  const systemTimezone = getSystemTimezone();
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        familyName: "My Family",
        defaultBottleUnit: "OZ",
        defaultSolidsUnit: "TBSP",
        defaultHeightUnit: "IN",
        defaultWeightUnit: "LB",
        defaultTempUnit: "F",
      },
    });
  }
  return {
    settings,
    systemTimezone,
  };
}

export function toUTC(dateInput: string | Date): Date {
  try {
    if (dateInput instanceof Date) {
      return new Date(dateInput);
    }
    if (
      typeof dateInput === "string" &&
      (dateInput.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(dateInput))
    ) {
      return new Date(dateInput);
    }
    if (typeof dateInput === "string") {
      const [datePart, timePart] = dateInput.split("T");
      if (!datePart) {
        throw new Error("Formato de data inválido");
      }
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes, secondsStr = "0"] = timePart
        ? timePart.split(":")
        : ["0", "0", "0"];
      return new Date(
        Date.UTC(
          year,
          month - 1,
          day,
          Number(hours),
          Number(minutes),
          Number(secondsStr)
        )
      );
    }
    throw new Error("Tipo de entrada de data inválido");
  } catch (error) {
    return new Date();
  }
}

export function formatForResponse(date: Date | string | null): string | null {
  if (!date) return null;
  try {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      throw new Error("Entrada de data inválida");
    }
    return dateObj.toISOString();
  } catch (error) {
    return null;
  }
}

export function calculateDurationMinutes(
  startDate: Date | string,
  endDate: Date | string
): number {
  try {
    const start =
      typeof startDate === "string" ? new Date(startDate) : startDate;
    const end = typeof endDate === "string" ? new Date(endDate) : endDate;
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Entrada de data inválida");
    }
    return Math.round((end.getTime() - start.getTime()) / 60000);
  } catch (error) {
    return 0;
  }
}

export function formatDuration(minutes: number): string {
  try {
    if (minutes < 0) {
      throw new Error("Duração não pode ser negativa");
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, "0")}`;
  } catch (error) {
    return "0:00";
  }
}
