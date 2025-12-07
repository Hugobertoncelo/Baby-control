import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse, FeedLogResponse } from "../../types";
import { FeedType } from "@prisma/client";
import { withAuthContext, AuthResult } from "../../utils/auth";
import { formatForResponse } from "../../utils/timezone";

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get("babyId");
    const type = searchParams.get("type") as FeedType | undefined;
    const { familyId, isAccountAuth, caretakerId, accountId } = authContext;
    if (!babyId) {
      return NextResponse.json<ApiResponse<FeedLogResponse>>(
        {
          success: false,
          error: "ID do bebê é obrigatório",
        },
        { status: 400 }
      );
    }
    if (!familyId) {
      if (isAccountAuth) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error:
              "Configuração da conta incompleta. Por favor, conclua a configuração da família.",
          },
          { status: 403 }
        );
      } else {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Usuário não está associado a uma família.",
          },
          { status: 403 }
        );
      }
    }
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
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
    const whereClause: any = {
      babyId,
      familyId,
      ...(type && { type }),
    };
    const feedLog = await prisma.feedLog.findFirst({
      where: whereClause,
      orderBy: {
        time: "desc",
      },
    });
    if (!feedLog) {
      return NextResponse.json<ApiResponse<FeedLogResponse | undefined>>({
        success: true,
        data: undefined,
      });
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
  } catch (error) {
    console.error("Erro ao buscar último registro de alimentação:", error);
    return NextResponse.json<ApiResponse<FeedLogResponse | undefined>>(
      {
        success: false,
        error: "Falha ao buscar último registro de alimentação",
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
