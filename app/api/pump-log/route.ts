import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, PumpLogCreate, PumpLogResponse } from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import {
  toUTC,
  formatForResponse,
  calculateDurationMinutes,
} from "../utils/timezone";
import { checkWritePermission } from "../utils/writeProtection";

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId: userFamilyId, caretakerId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const body: PumpLogCreate = await req.json();
    const baby = await prisma.baby.findFirst({
      where: { id: body.babyId, familyId: userFamilyId },
    });
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Bebê não encontrado nesta família." },
        { status: 404 }
      );
    }
    const startTimeUTC = toUTC(body.startTime);
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : undefined;
    let duration = body.duration;
    if (!duration && startTimeUTC && endTimeUTC) {
      duration = calculateDurationMinutes(startTimeUTC, endTimeUTC);
    }
    let totalAmount = body.totalAmount;
    if (!totalAmount && (body.leftAmount || body.rightAmount)) {
      totalAmount = (body.leftAmount || 0) + (body.rightAmount || 0);
    }
    const pumpLog = await prisma.pumpLog.create({
      data: {
        babyId: body.babyId,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        duration,
        leftAmount: body.leftAmount,
        rightAmount: body.rightAmount,
        totalAmount,
        unitAbbr: body.unitAbbr,
        notes: body.notes,
        caretakerId: caretakerId,
        familyId: userFamilyId,
      },
    });
    const response: PumpLogResponse = {
      ...pumpLog,
      startTime: formatForResponse(pumpLog.startTime) || "",
      endTime: formatForResponse(pumpLog.endTime) || null,
      createdAt: formatForResponse(pumpLog.createdAt) || "",
      updatedAt: formatForResponse(pumpLog.updatedAt) || "",
      deletedAt: formatForResponse(pumpLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<PumpLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar registro de bombeamento:", error);
    return NextResponse.json<ApiResponse<PumpLogResponse>>(
      {
        success: false,
        error: "Falha ao criar registro de bombeamento",
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body: Partial<PumpLogCreate> = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<PumpLogResponse>>(
        {
          success: false,
          error: "ID do registro de bombeamento é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingPumpLog = await prisma.pumpLog.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingPumpLog) {
      return NextResponse.json<ApiResponse<PumpLogResponse>>(
        {
          success: false,
          error: "Registro de bombeamento não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    const data: any = {};
    if (body.startTime) {
      data.startTime = toUTC(body.startTime);
    }
    if (body.endTime) {
      data.endTime = toUTC(body.endTime);
    }
    if (body.duration !== undefined) {
      data.duration = body.duration;
    } else if (
      (body.startTime || existingPumpLog.startTime) &&
      (body.endTime || existingPumpLog.endTime)
    ) {
      const start = body.startTime
        ? toUTC(body.startTime)
        : existingPumpLog.startTime;
      const end = body.endTime ? toUTC(body.endTime) : existingPumpLog.endTime;
      if (start && end) {
        data.duration = calculateDurationMinutes(start, end);
      }
    }
    if (body.totalAmount !== undefined) {
      data.totalAmount = body.totalAmount;
    } else if (
      body.leftAmount !== undefined ||
      body.rightAmount !== undefined
    ) {
      const leftAmount =
        body.leftAmount !== undefined
          ? body.leftAmount
          : existingPumpLog.leftAmount || 0;
      const rightAmount =
        body.rightAmount !== undefined
          ? body.rightAmount
          : existingPumpLog.rightAmount || 0;
      data.totalAmount = leftAmount + rightAmount;
    }
    if (body.leftAmount !== undefined) data.leftAmount = body.leftAmount;
    if (body.rightAmount !== undefined) data.rightAmount = body.rightAmount;
    if (body.unitAbbr !== undefined) data.unitAbbr = body.unitAbbr;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.babyId !== undefined) data.babyId = body.babyId;
    const pumpLog = await prisma.pumpLog.update({
      where: { id },
      data,
    });
    const response: PumpLogResponse = {
      ...pumpLog,
      startTime: formatForResponse(pumpLog.startTime) || "",
      endTime: formatForResponse(pumpLog.endTime) || null,
      createdAt: formatForResponse(pumpLog.createdAt) || "",
      updatedAt: formatForResponse(pumpLog.updatedAt) || "",
      deletedAt: formatForResponse(pumpLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<PumpLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar registro de bombeamento:", error);
    return NextResponse.json<ApiResponse<PumpLogResponse>>(
      {
        success: false,
        error: "Falha ao atualizar registro de bombeamento",
      },
      { status: 500 }
    );
  }
}

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
    const id = searchParams.get("id");
    const babyId = searchParams.get("babyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const queryParams: any = {
      familyId: userFamilyId,
      ...(babyId && { babyId }),
    };
    if (startDate && endDate) {
      queryParams.startTime = {
        gte: toUTC(startDate),
        lte: toUTC(endDate),
      };
    }
    if (id) {
      const pumpLog = await prisma.pumpLog.findFirst({
        where: {
          id,
          familyId: userFamilyId,
        },
      });
      if (!pumpLog) {
        return NextResponse.json<ApiResponse<PumpLogResponse>>(
          {
            success: false,
            error: "Registro de bombeamento não encontrado ou acesso negado",
          },
          { status: 404 }
        );
      }
      const response: PumpLogResponse = {
        ...pumpLog,
        startTime: formatForResponse(pumpLog.startTime) || "",
        endTime: formatForResponse(pumpLog.endTime) || null,
        createdAt: formatForResponse(pumpLog.createdAt) || "",
        updatedAt: formatForResponse(pumpLog.updatedAt) || "",
        deletedAt: formatForResponse(pumpLog.deletedAt),
      };
      return NextResponse.json<ApiResponse<PumpLogResponse>>({
        success: true,
        data: response,
      });
    }
    const pumpLogs = await prisma.pumpLog.findMany({
      where: queryParams,
      orderBy: {
        startTime: "desc",
      },
    });
    const response: PumpLogResponse[] = pumpLogs.map((pumpLog) => ({
      ...pumpLog,
      startTime: formatForResponse(pumpLog.startTime) || "",
      endTime: formatForResponse(pumpLog.endTime) || null,
      createdAt: formatForResponse(pumpLog.createdAt) || "",
      updatedAt: formatForResponse(pumpLog.updatedAt) || "",
      deletedAt: formatForResponse(pumpLog.deletedAt),
    }));
    return NextResponse.json<ApiResponse<PumpLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar registros de bombeamento:", error);
    return NextResponse.json<ApiResponse<PumpLogResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar registros de bombeamento",
      },
      { status: 500 }
    );
  }
}

async function handleDelete(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "ID do registro de bombeamento é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingPumpLog = await prisma.pumpLog.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingPumpLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Registro de bombeamento não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.pumpLog.delete({
      where: { id },
    });
    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar registro de bombeamento:", error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: "Falha ao deletar registro de bombeamento",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(
  handleGet as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const POST = withAuthContext(
  handlePost as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const PUT = withAuthContext(
  handlePut as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const DELETE = withAuthContext(
  handleDelete as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
