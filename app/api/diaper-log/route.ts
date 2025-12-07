import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, DiaperLogCreate, DiaperLogResponse } from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { toUTC, formatForResponse } from "../utils/timezone";
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
    const body: DiaperLogCreate = await req.json();
    const baby = await prisma.baby.findFirst({
      where: { id: body.babyId, familyId: userFamilyId },
    });
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Bebê não encontrado nesta família." },
        { status: 404 }
      );
    }
    const timeUTC = toUTC(body.time);
    const diaperLog = await prisma.diaperLog.create({
      data: {
        ...body,
        time: timeUTC,
        caretakerId: caretakerId,
        familyId: userFamilyId,
      },
    });
    const response: DiaperLogResponse = {
      ...diaperLog,
      time: formatForResponse(diaperLog.time) || "",
      createdAt: formatForResponse(diaperLog.createdAt) || "",
      updatedAt: formatForResponse(diaperLog.updatedAt) || "",
      deletedAt: formatForResponse(diaperLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<DiaperLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar registro de fralda:", error);
    return NextResponse.json<ApiResponse<DiaperLogResponse>>(
      {
        success: false,
        error: "Falha ao criar registro de fralda",
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
    const body: Partial<DiaperLogCreate> = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<DiaperLogResponse>>(
        {
          success: false,
          error: "ID do registro de fralda é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingDiaperLog = await prisma.diaperLog.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingDiaperLog) {
      return NextResponse.json<ApiResponse<DiaperLogResponse>>(
        {
          success: false,
          error: "Registro de fralda não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    const data = body.time ? { ...body, time: toUTC(body.time) } : body;
    const diaperLog = await prisma.diaperLog.update({
      where: { id },
      data,
    });
    const response: DiaperLogResponse = {
      ...diaperLog,
      time: formatForResponse(diaperLog.time) || "",
      createdAt: formatForResponse(diaperLog.createdAt) || "",
      updatedAt: formatForResponse(diaperLog.updatedAt) || "",
      deletedAt: formatForResponse(diaperLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<DiaperLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar registro de fralda:", error);
    return NextResponse.json<ApiResponse<DiaperLogResponse>>(
      {
        success: false,
        error: "Falha ao atualizar registro de fralda",
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
    if (id) {
      const diaperLog = await prisma.diaperLog.findFirst({
        where: { id, familyId: userFamilyId },
      });
      if (!diaperLog) {
        return NextResponse.json<ApiResponse<DiaperLogResponse>>(
          {
            success: false,
            error: "Registro de fralda não encontrado ou acesso negado",
          },
          { status: 404 }
        );
      }
      const response: DiaperLogResponse = {
        ...diaperLog,
        time: formatForResponse(diaperLog.time) || "",
        createdAt: formatForResponse(diaperLog.createdAt) || "",
        updatedAt: formatForResponse(diaperLog.updatedAt) || "",
        deletedAt: formatForResponse(diaperLog.deletedAt),
      };
      return NextResponse.json<ApiResponse<DiaperLogResponse>>({
        success: true,
        data: response,
      });
    }
    const diaperLogs = await prisma.diaperLog.findMany({
      where: {
        familyId: userFamilyId,
        ...(babyId && { babyId }),
        ...(startDate &&
          endDate && {
            time: {
              gte: toUTC(startDate),
              lte: toUTC(endDate),
            },
          }),
      },
      orderBy: {
        time: "desc",
      },
    });
    const response: DiaperLogResponse[] = diaperLogs.map((diaperLog) => ({
      ...diaperLog,
      time: formatForResponse(diaperLog.time) || "",
      createdAt: formatForResponse(diaperLog.createdAt) || "",
      updatedAt: formatForResponse(diaperLog.updatedAt) || "",
      deletedAt: formatForResponse(diaperLog.deletedAt),
    }));
    return NextResponse.json<ApiResponse<DiaperLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar registros de fralda:", error);
    return NextResponse.json<ApiResponse<DiaperLogResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar registros de fralda",
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
          error: "ID do registro de fralda é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingDiaperLog = await prisma.diaperLog.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingDiaperLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Registro de fralda não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.diaperLog.delete({
      where: { id },
    });
    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar registro de fralda:", error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: "Falha ao deletar registro de fralda",
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
