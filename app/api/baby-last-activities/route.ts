import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse } from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { formatForResponse } from "../utils/timezone";

const getMeasurementByType = (measurements: any[], type: string) => {
  const measurement = measurements.find((m) => m.type === type);
  if (!measurement) return null;
  return {
    ...measurement,
    date: formatForResponse(measurement.date) || "",
    caretakerName: measurement.caretaker?.name,
  };
};

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get("babyId");
    if (!babyId) {
      return NextResponse.json<ApiResponse<any>>(
        {
          success: false,
          error: "ID do bebê é obrigatório",
        },
        { status: 400 }
      );
    }
    const baby = await prisma.baby.findFirst({
      where: { id: babyId, familyId: userFamilyId },
    });
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Bebê não encontrado nesta família." },
        { status: 404 }
      );
    }
    const [lastDiaper, lastPoopDiaper, lastBath, measurements, lastNote] =
      await Promise.all([
        prisma.diaperLog.findFirst({
          where: {
            babyId,
            deletedAt: null,
            familyId: userFamilyId,
          },
          orderBy: { time: "desc" },
          include: { caretaker: true },
        }),
        prisma.diaperLog.findFirst({
          where: {
            babyId,
            deletedAt: null,
            type: { in: ["DIRTY", "BOTH"] },
            familyId: userFamilyId,
          },
          orderBy: { time: "desc" },
          include: { caretaker: true },
        }),
        prisma.bathLog.findFirst({
          where: {
            babyId,
            deletedAt: null,
            familyId: userFamilyId,
          },
          orderBy: { time: "desc" },
          include: { caretaker: true },
        }),
        prisma.measurement.findMany({
          where: {
            babyId,
            deletedAt: null,
            familyId: userFamilyId,
          },
          orderBy: { date: "desc" },
          include: { caretaker: true },
        }),
        prisma.note.findFirst({
          where: {
            babyId,
            deletedAt: null,
            familyId: userFamilyId,
          },
          orderBy: { time: "desc" },
          include: { caretaker: true },
        }),
      ]);
    const response = {
      lastDiaper: lastDiaper
        ? {
            ...lastDiaper,
            time: formatForResponse(lastDiaper.time) || "",
            caretakerName: lastDiaper.caretaker?.name,
          }
        : null,
      lastPoopDiaper: lastPoopDiaper
        ? {
            ...lastPoopDiaper,
            time: formatForResponse(lastPoopDiaper.time) || "",
            caretakerName: lastPoopDiaper.caretaker?.name,
          }
        : null,
      lastBath: lastBath
        ? {
            ...lastBath,
            time: formatForResponse(lastBath.time) || "",
            caretakerName: lastBath.caretaker?.name,
          }
        : null,
      lastMeasurements: {
        height: getMeasurementByType(measurements, "HEIGHT"),
        weight: getMeasurementByType(measurements, "WEIGHT"),
        headCircumference: getMeasurementByType(
          measurements,
          "HEAD_CIRCUMFERENCE"
        ),
      },
      lastNote: lastNote
        ? {
            ...lastNote,
            time: formatForResponse(lastNote.time) || "",
            caretakerName: lastNote.caretaker?.name,
          }
        : null,
    };
    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar últimas atividades:", error);
    return NextResponse.json<ApiResponse<any>>(
      {
        success: false,
        error: "Falha ao buscar últimas atividades",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet);
