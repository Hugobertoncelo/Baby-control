import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import {
  ApiResponse,
  SleepLogResponse,
  FeedLogResponse,
  DiaperLogResponse,
  NoteResponse,
  BathLogResponse,
  PumpLogResponse,
  MilestoneResponse,
  MeasurementResponse,
  MedicineLogResponse,
  MedicineResponse,
} from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { toUTC, formatForResponse } from "../utils/timezone";

type ActivityTypeWithCaretaker = (
  | SleepLogResponse
  | FeedLogResponse
  | DiaperLogResponse
  | NoteResponse
  | BathLogResponse
  | PumpLogResponse
  | MilestoneResponse
  | MeasurementResponse
  | MedicineLogResponse
) & {
  caretakerId?: string | null;
  caretakerName?: string;
  medicine?: MedicineResponse;
};

type ActivityType = ActivityTypeWithCaretaker;

const getActivityTime = (activity: any): number => {
  if ("time" in activity && activity.time) {
    return new Date(activity.time).getTime();
  }
  if ("startTime" in activity && activity.startTime) {
    if (
      "type" in activity &&
      ["NAP", "NIGHT"].includes(activity.type) &&
      activity.endTime
    ) {
      return new Date(activity.endTime).getTime();
    }
    if (
      "leftAmount" in activity ||
      "rightAmount" in activity ||
      "totalAmount" in activity
    ) {
      return new Date(activity.startTime).getTime();
    }
    return new Date(activity.startTime).getTime();
  }
  if ("date" in activity && activity.date) {
    return new Date(activity.date).getTime();
  }
  return new Date().getTime();
};

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { caretakerId, familyId: caretakerFamilyId } = authContext;
    if (!caretakerFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const url = new URL(req.url);
    const { searchParams } = url;
    const babyId = searchParams.get("babyId");
    if (!babyId) {
      return NextResponse.json<ApiResponse<ActivityType[]>>(
        {
          success: false,
          error: "ID do bebê é obrigatório",
        },
        { status: 400 }
      );
    }
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        familyId: caretakerFamilyId,
      },
      select: {
        familyId: true,
      },
    });
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Bebê não encontrado nesta família." },
        { status: 404 }
      );
    }
    const familyId = baby.familyId;
    const limit = Number(searchParams.get("limit")) || 200;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    let effectiveStartDate = startDate;
    let effectiveEndDate = endDate;
    let useLimit = true;
    if (startDate && endDate) {
      useLimit = false;
    }
    const startDateUTC = effectiveStartDate
      ? toUTC(effectiveStartDate)
      : undefined;
    const endDateUTC = effectiveEndDate ? toUTC(effectiveEndDate) : undefined;
    const [
      sleepLogs,
      feedLogs,
      diaperLogs,
      noteLogs,
      bathLogs,
      pumpLogs,
      milestoneLogs,
      measurementLogs,
      medicineLogs,
    ] = await Promise.all([
      prisma.sleepLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                OR: [
                  { startTime: { gte: startDateUTC, lte: endDateUTC } },
                  { endTime: { gte: startDateUTC, lte: endDateUTC } },
                  {
                    startTime: { lte: startDateUTC },
                    endTime: { gte: endDateUTC },
                  },
                ],
              }
            : {}),
          familyId,
        },
        include: { caretaker: true },
        orderBy: { startTime: "desc" },
      }),
      prisma.feedLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                time: { gte: startDateUTC, lte: endDateUTC },
              }
            : {}),
          familyId,
        },
        include: { caretaker: true },
        orderBy: { time: "desc" },
      }),
      prisma.diaperLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                time: { gte: startDateUTC, lte: endDateUTC },
              }
            : {}),
          familyId,
        },
        include: { caretaker: true },
        orderBy: { time: "desc" },
      }),
      prisma.note.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                time: { gte: startDateUTC, lte: endDateUTC },
              }
            : {}),
          familyId,
        },
        include: { caretaker: true },
        orderBy: { time: "desc" },
      }),
      prisma.bathLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                time: { gte: startDateUTC, lte: endDateUTC },
              }
            : {}),
          familyId,
        },
        include: { caretaker: true },
        orderBy: { time: "desc" },
      }),
      prisma.pumpLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                startTime: { gte: startDateUTC, lte: endDateUTC },
              }
            : {}),
          familyId,
        },
        include: { caretaker: true },
        orderBy: { startTime: "desc" },
      }),
      prisma.milestone.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                date: { gte: startDateUTC, lte: endDateUTC },
              }
            : {}),
          familyId,
        },
        include: { caretaker: true },
        orderBy: { date: "desc" },
      }),
      prisma.measurement.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                date: { gte: startDateUTC, lte: endDateUTC },
              }
            : {}),
          familyId,
        },
        include: { caretaker: true },
        orderBy: { date: "desc" },
      }),
      prisma.medicineLog.findMany({
        where: {
          babyId,
          ...(startDateUTC && endDateUTC
            ? {
                time: { gte: startDateUTC, lte: endDateUTC },
              }
            : {}),
          familyId,
        },
        include: { caretaker: true, medicine: true },
        orderBy: { time: "desc" },
      }),
    ]);
    const formattedSleepLogs: ActivityTypeWithCaretaker[] = sleepLogs.map(
      (log) => {
        const { caretaker, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          startTime: formatForResponse(log.startTime) || "",
          endTime: formatForResponse(log.endTime) || null,
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      }
    );
    const formattedFeedLogs: ActivityTypeWithCaretaker[] = feedLogs.map(
      (log) => {
        const { caretaker, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || "",
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      }
    );
    const formattedDiaperLogs: ActivityTypeWithCaretaker[] = diaperLogs.map(
      (log) => {
        const { caretaker, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || "",
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      }
    );
    const formattedNoteLogs: ActivityTypeWithCaretaker[] = noteLogs.map(
      (log) => {
        const { caretaker, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || "",
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      }
    );
    const formattedBathLogs: ActivityTypeWithCaretaker[] = bathLogs.map(
      (log) => {
        const { caretaker, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || "",
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      }
    );
    const formattedPumpLogs: ActivityTypeWithCaretaker[] = pumpLogs.map(
      (log) => {
        const { caretaker, ...logWithoutCaretaker } = log;
        const unit = log.unitAbbr ? log.unitAbbr.toLowerCase() : "oz";
        return {
          ...logWithoutCaretaker,
          startTime: formatForResponse(log.startTime) || "",
          endTime: formatForResponse(log.endTime) || null,
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
          unit: unit,
        };
      }
    );
    const formattedMedicineLogs: ActivityTypeWithCaretaker[] = medicineLogs.map(
      (log) => {
        const { caretaker, medicine, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          time: formatForResponse(log.time) || "",
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: caretaker ? caretaker.name : undefined,
          medicine: medicine
            ? {
                ...medicine,
                createdAt: formatForResponse(medicine.createdAt) || "",
                updatedAt: formatForResponse(medicine.updatedAt) || "",
                deletedAt: formatForResponse(medicine.deletedAt),
              }
            : undefined,
        };
      }
    );
    const formattedMilestoneLogs: ActivityTypeWithCaretaker[] =
      milestoneLogs.map((log) => {
        const { caretaker, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          date: formatForResponse(log.date) || "",
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });
    const formattedMeasurementLogs: ActivityTypeWithCaretaker[] =
      measurementLogs.map((log) => {
        const { caretaker, ...logWithoutCaretaker } = log;
        return {
          ...logWithoutCaretaker,
          date: formatForResponse(log.date) || "",
          createdAt: formatForResponse(log.createdAt) || "",
          updatedAt: formatForResponse(log.updatedAt) || "",
          deletedAt: formatForResponse(log.deletedAt),
          caretakerId: log.caretakerId,
          caretakerName: log.caretaker ? log.caretaker.name : undefined,
        };
      });
    const allActivities = [
      ...formattedSleepLogs,
      ...formattedFeedLogs,
      ...formattedDiaperLogs,
      ...formattedNoteLogs,
      ...formattedBathLogs,
      ...formattedPumpLogs,
      ...formattedMilestoneLogs,
      ...formattedMeasurementLogs,
      ...formattedMedicineLogs,
    ].sort((a, b) => getActivityTime(b) - getActivityTime(a));
    const finalActivities = useLimit
      ? allActivities.slice(0, limit)
      : allActivities;
    return NextResponse.json<ApiResponse<ActivityType[]>>({
      success: true,
      data: finalActivities,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao buscar linha do tempo",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet);
