import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, BathLogCreate, BathLogResponse } from "../types";
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
    const body: BathLogCreate = await req.json();
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
    const bathLog = await prisma.bathLog.create({
      data: {
        ...body,
        time: timeUTC,
        caretakerId: caretakerId,
        soapUsed: body.soapUsed ?? true,
        shampooUsed: body.shampooUsed ?? true,
        familyId: userFamilyId,
      },
    });
    const response: BathLogResponse = {
      ...bathLog,
      time: formatForResponse(bathLog.time) || "",
      createdAt: formatForResponse(bathLog.createdAt) || "",
      updatedAt: formatForResponse(bathLog.updatedAt) || "",
      deletedAt: formatForResponse(bathLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<BathLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar registro de banho:", error);
    return NextResponse.json<ApiResponse<BathLogResponse>>(
      {
        success: false,
        error: "Falha ao criar registro de banho",
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
    const body: Partial<BathLogCreate> = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<BathLogResponse>>(
        {
          success: false,
          error: "ID do registro de banho é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingBathLog = await prisma.bathLog.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingBathLog) {
      return NextResponse.json<ApiResponse<BathLogResponse>>(
        {
          success: false,
          error: "Registro de banho não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    const data = {
      ...(body.time ? { time: toUTC(body.time) } : {}),
      ...Object.entries(body)
        .filter(([key]) => !["time"].includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };
    const bathLog = await prisma.bathLog.update({
      where: { id },
      data,
    });
    const response: BathLogResponse = {
      ...bathLog,
      time: formatForResponse(bathLog.time) || "",
      createdAt: formatForResponse(bathLog.createdAt) || "",
      updatedAt: formatForResponse(bathLog.updatedAt) || "",
      deletedAt: formatForResponse(bathLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<BathLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar registro de banho:", error);
    return NextResponse.json<ApiResponse<BathLogResponse>>(
      {
        success: false,
        error: "Falha ao atualizar registro de banho",
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
      const bathLog = await prisma.bathLog.findFirst({
        where: { id, familyId: userFamilyId },
      });
      if (!bathLog) {
        return NextResponse.json<ApiResponse<BathLogResponse>>(
          {
            success: false,
            error: "Registro de banho não encontrado ou acesso negado",
          },
          { status: 404 }
        );
      }
      const response: BathLogResponse = {
        ...bathLog,
        time: formatForResponse(bathLog.time) || "",
        createdAt: formatForResponse(bathLog.createdAt) || "",
        updatedAt: formatForResponse(bathLog.updatedAt) || "",
        deletedAt: formatForResponse(bathLog.deletedAt),
      };
      return NextResponse.json<ApiResponse<BathLogResponse>>({
        success: true,
        data: response,
      });
    }
    const bathLogs = await prisma.bathLog.findMany({
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
    const response: BathLogResponse[] = bathLogs.map((bathLog) => ({
      ...bathLog,
      time: formatForResponse(bathLog.time) || "",
      createdAt: formatForResponse(bathLog.createdAt) || "",
      updatedAt: formatForResponse(bathLog.updatedAt) || "",
      deletedAt: formatForResponse(bathLog.deletedAt),
    }));
    return NextResponse.json<ApiResponse<BathLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar registros de banho:", error);
    return NextResponse.json<ApiResponse<BathLogResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar registros de banho",
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
          error: "ID do registro de banho é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingBathLog = await prisma.bathLog.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingBathLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Registro de banho não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.bathLog.delete({
      where: { id },
    });
    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao excluir registro de banho:", error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: "Falha ao excluir registro de banho",
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
