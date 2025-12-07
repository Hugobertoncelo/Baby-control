import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { ApiResponse } from "@/app/api/utils/auth";
import jwt from "jsonwebtoken";

interface TokenAuthRequest {
  token: string;
  password: string;
}

interface TokenAuthResponse {
  success: boolean;
  token: string;
  expiresAt: number;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<TokenAuthResponse>>> {
  try {
    const { token, password }: TokenAuthRequest = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        {
          success: false,
          error: "Token e senha são obrigatórios",
        },
        { status: 400 }
      );
    }

    const setupToken = await prisma.familySetup.findUnique({
      where: { token },
    });

    if (!setupToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Token de configuração inválido",
        },
        { status: 404 }
      );
    }

    if (setupToken.expiresAt < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: "O token de configuração expirou",
        },
        { status: 410 }
      );
    }

    if (setupToken.familyId) {
      return NextResponse.json(
        {
          success: false,
          error: "O token de configuração já foi utilizado",
        },
        { status: 409 }
      );
    }

    if (setupToken.password !== password) {
      return NextResponse.json(
        {
          success: false,
          error: "Senha inválida",
        },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || "baby-control-jwt-secret";

    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const authToken = jwt.sign(
      {
        setupToken: token,
        isSetupAuth: true,
        exp: Math.floor(expiresAt / 1000),
      },
      jwtSecret
    );

    return NextResponse.json({
      success: true,
      data: {
        success: true,
        token: authToken,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("Erro na autenticação do token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha na autenticação",
      },
      { status: 500 }
    );
  }
}
