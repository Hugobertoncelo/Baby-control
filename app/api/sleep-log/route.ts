import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, SleepLogCreate, SleepLogResponse } from "../types";
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

    const body: SleepLogCreate = await req.json();

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
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : null;
    const duration = endTimeUTC
      ? calculateDurationMinutes(startTimeUTC, endTimeUTC)
      : undefined;

    const sleepLog = await prisma.sleepLog.create({
      data: {
        ...body,
        startTime: startTimeUTC,
        ...(endTimeUTC && { endTime: endTimeUTC }),
        duration,
        caretakerId: caretakerId,
        familyId: userFamilyId,
      },
    });

    const response: SleepLogResponse = {
      ...sleepLog,
      startTime: formatForResponse(sleepLog.startTime) || "",
      endTime: formatForResponse(sleepLog.endTime) || null,
      createdAt: formatForResponse(sleepLog.createdAt) || "",
      updatedAt: formatForResponse(sleepLog.updatedAt) || "",
      deletedAt: formatForResponse(sleepLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<SleepLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<SleepLogResponse>>(
      {
        success: false,
        error: "Falha ao criar registro de sono",
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
    const body: Partial<SleepLogCreate> = await req.json();

    if (!id) {
      return NextResponse.json<ApiResponse<SleepLogResponse>>(
        {
          success: false,
          error: "ID do registro de sono é obrigatório",
        },
        { status: 400 }
      );
    }

    const existingSleepLog = await prisma.sleepLog.findFirst({
      where: { id, familyId: userFamilyId },
    });

    if (!existingSleepLog) {
      return NextResponse.json<ApiResponse<SleepLogResponse>>(
        {
          success: false,
          error: "Registro de sono não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }

    const startTimeUTC = body.startTime ? toUTC(body.startTime) : undefined;
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : undefined;
    const duration = endTimeUTC
      ? calculateDurationMinutes(
          startTimeUTC || existingSleepLog.startTime,
          endTimeUTC
        )
      : undefined;

    const sleepLog = await prisma.sleepLog.update({
      where: { id },
      data: {
        ...body,
        ...(startTimeUTC && { startTime: startTimeUTC }),
        ...(endTimeUTC && { endTime: endTimeUTC }),
        ...(duration !== undefined && { duration }),
      },
    });

    const response: SleepLogResponse = {
      ...sleepLog,
      startTime: formatForResponse(sleepLog.startTime) || "",
      endTime: formatForResponse(sleepLog.endTime) || null,
      createdAt: formatForResponse(sleepLog.createdAt) || "",
      updatedAt: formatForResponse(sleepLog.updatedAt) || "",
      deletedAt: formatForResponse(sleepLog.deletedAt),
    };

    return NextResponse.json<ApiResponse<SleepLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<SleepLogResponse>>(
      {
        success: false,
        error: "Falha ao atualizar registro de sono",
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
      ...(startDate &&
        endDate && {
          startTime: {
            gte: toUTC(startDate),
            lte: toUTC(endDate),
          },
        }),
    };

    if (id) {
      const sleepLog = await prisma.sleepLog.findFirst({
        where: {
          id,
          familyId: userFamilyId,
        },
      });

      if (!sleepLog) {
        return NextResponse.json<ApiResponse<SleepLogResponse>>(
          {
            success: false,
            error: "Registro de sono não encontrado ou acesso negado",
          },
          { status: 404 }
        );
      }

      const response: SleepLogResponse = {
        ...sleepLog,
        startTime: formatForResponse(sleepLog.startTime) || "",
        endTime: formatForResponse(sleepLog.endTime) || null,
        createdAt: formatForResponse(sleepLog.createdAt) || "",
        updatedAt: formatForResponse(sleepLog.updatedAt) || "",
        deletedAt: formatForResponse(sleepLog.deletedAt),
      };

      return NextResponse.json<ApiResponse<SleepLogResponse>>({
        success: true,
        data: response,
      });
    }

    const sleepLogs = await prisma.sleepLog.findMany({
      where: queryParams,
      orderBy: {
        startTime: "desc",
      },
    });

    const response: SleepLogResponse[] = sleepLogs.map((sleepLog) => ({
      ...sleepLog,
      startTime: formatForResponse(sleepLog.startTime) || "",
      endTime: formatForResponse(sleepLog.endTime) || null,
      createdAt: formatForResponse(sleepLog.createdAt) || "",
      updatedAt: formatForResponse(sleepLog.updatedAt) || "",
      deletedAt: formatForResponse(sleepLog.deletedAt),
    }));

    return NextResponse.json<ApiResponse<SleepLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<SleepLogResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar registros de sono",
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
          error: "ID do registro de sono é obrigatório",
        },
        { status: 400 }
      );
    }

    const existingSleepLog = await prisma.sleepLog.findFirst({
      where: { id, familyId: userFamilyId },
    });

    if (!existingSleepLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Registro de sono não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }

    await prisma.sleepLog.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: "Falha ao deletar registro de sono",
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
