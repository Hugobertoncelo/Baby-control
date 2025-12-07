import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, FeedLogCreate, FeedLogResponse } from "../types";
import { FeedType } from "@prisma/client";
import { withAuthContext, AuthResult } from "../utils/auth";
import { toUTC, formatForResponse } from "../utils/timezone";
import { checkWritePermission } from "../utils/writeProtection";

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const body: FeedLogCreate = await req.json();
    const { familyId, caretakerId } = authContext;
    const baby = await prisma.baby.findFirst({
      where: {
        id: body.babyId,
        familyId: familyId,
      },
    });
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Bebê não encontrado nesta família.",
        },
        { status: 404 }
      );
    }
    const timeUTC = toUTC(body.time);
    const data = {
      ...body,
      time: timeUTC,
      caretakerId: authContext.caretakerId,
      ...(body.startTime && { startTime: toUTC(body.startTime) }),
      ...(body.endTime && { endTime: toUTC(body.endTime) }),
      ...(body.feedDuration !== undefined && {
        feedDuration: body.feedDuration,
      }),
      familyId,
    };
    const feedLog = await prisma.feedLog.create({
      data,
    });
    const response: FeedLogResponse = {
      ...feedLog,
      time: formatForResponse(feedLog.time) || "",
      createdAt: formatForResponse(feedLog.createdAt) || "",
      updatedAt: formatForResponse(feedLog.updatedAt) || "",
      deletedAt: formatForResponse(feedLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<FeedLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar registro de alimentação:", error);
    return NextResponse.json<ApiResponse<FeedLogResponse>>(
      {
        success: false,
        error: "Falha ao criar registro de alimentação",
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body: Partial<FeedLogCreate> = await req.json();
    const { familyId } = authContext;
    if (!id) {
      return NextResponse.json<ApiResponse<FeedLogResponse>>(
        {
          success: false,
          error: "ID do registro de alimentação é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingFeedLog = await prisma.feedLog.findUnique({
      where: { id },
    });
    if (!existingFeedLog) {
      return NextResponse.json<ApiResponse<FeedLogResponse>>(
        {
          success: false,
          error: "Registro de alimentação não encontrado",
        },
        { status: 404 }
      );
    }
    if (existingFeedLog.familyId !== familyId) {
      return NextResponse.json<ApiResponse<FeedLogResponse>>(
        {
          success: false,
          error: "Proibido",
        },
        { status: 403 }
      );
    }
    const data = {
      ...(body.time ? { time: toUTC(body.time) } : {}),
      ...(body.startTime ? { startTime: toUTC(body.startTime) } : {}),
      ...(body.endTime ? { endTime: toUTC(body.endTime) } : {}),
      ...(body.feedDuration !== undefined
        ? { feedDuration: body.feedDuration }
        : {}),
      ...Object.entries(body)
        .filter(
          ([key]) =>
            ![
              "time",
              "startTime",
              "endTime",
              "feedDuration",
              "familyId",
            ].includes(key)
        )
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };
    const feedLog = await prisma.feedLog.update({
      where: { id },
      data,
    });
    const response: FeedLogResponse = {
      ...feedLog,
      time: formatForResponse(feedLog.time) || "",
      createdAt: formatForResponse(feedLog.createdAt) || "",
      updatedAt: formatForResponse(feedLog.updatedAt) || "",
      deletedAt: formatForResponse(feedLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<FeedLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar registro de alimentação:", error);
    return NextResponse.json<ApiResponse<FeedLogResponse>>(
      {
        success: false,
        error: "Falha ao atualizar registro de alimentação",
      },
      { status: 500 }
    );
  }
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const babyId = searchParams.get("babyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const typeParam = searchParams.get("type");
    const { familyId } = authContext;
    const queryParams: any = {
      familyId,
      ...(babyId && { babyId }),
      ...(typeParam && { type: typeParam as FeedType }),
      ...(startDate &&
        endDate && {
          time: {
            gte: toUTC(startDate),
            lte: toUTC(endDate),
          },
        }),
    };
    if (id) {
      const feedLog = await prisma.feedLog.findFirst({
        where: {
          id,
          familyId,
        },
      });
      if (!feedLog) {
        return NextResponse.json<ApiResponse<FeedLogResponse>>(
          {
            success: false,
            error: "Registro de alimentação não encontrado",
          },
          { status: 404 }
        );
      }
      const response: FeedLogResponse = {
        ...feedLog,
        time: formatForResponse(feedLog.time) || "",
        createdAt: formatForResponse(feedLog.createdAt) || "",
        updatedAt: formatForResponse(feedLog.updatedAt) || "",
        deletedAt: formatForResponse(feedLog.deletedAt),
      };
      return NextResponse.json<ApiResponse<FeedLogResponse>>({
        success: true,
        data: response,
      });
    }
    const feedLogs = await prisma.feedLog.findMany({
      where: queryParams,
      orderBy: {
        time: "desc",
      },
    });
    const response: FeedLogResponse[] = feedLogs.map((feedLog) => ({
      ...feedLog,
      time: formatForResponse(feedLog.time) || "",
      createdAt: formatForResponse(feedLog.createdAt) || "",
      updatedAt: formatForResponse(feedLog.updatedAt) || "",
      deletedAt: formatForResponse(feedLog.deletedAt),
    }));
    return NextResponse.json<ApiResponse<FeedLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar registros de alimentação:", error);
    return NextResponse.json<ApiResponse<FeedLogResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar registros de alimentação",
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
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const { familyId } = authContext;
    if (!id) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "ID do registro de alimentação é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingFeedLog = await prisma.feedLog.findFirst({
      where: { id, familyId },
    });
    if (!existingFeedLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Registro de alimentação não encontrado",
        },
        { status: 404 }
      );
    }
    await prisma.feedLog.delete({
      where: { id },
    });
    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar registro de alimentação:", error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: "Falha ao deletar registro de alimentação",
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
