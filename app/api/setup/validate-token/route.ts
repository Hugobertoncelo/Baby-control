import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { ApiResponse } from "@/app/api/utils/auth";

interface ValidateTokenRequest {
  token: string;
}

interface ValidateTokenResponse {
  valid: boolean;
  requiresPassword?: boolean;
}

async function handler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ValidateTokenResponse>>> {
  try {
    const { token }: ValidateTokenRequest = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token é obrigatório" },
        { status: 400 }
      );
    }

    const setupToken = await prisma.familySetup.findUnique({
      where: { token },
    });

    if (!setupToken) {
      return NextResponse.json(
        { success: false, error: "Token de configuração inválido" },
        { status: 404 }
      );
    }

    if (setupToken.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: "Token de configuração expirou" },
        { status: 410 }
      );
    }

    if (setupToken.familyId) {
      return NextResponse.json(
        { success: false, error: "Token de configuração já foi utilizado" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        requiresPassword: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao validar token de configuração" },
      { status: 500 }
    );
  }
}

export const POST = handler;
