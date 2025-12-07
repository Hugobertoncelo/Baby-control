import { NextRequest, NextResponse } from "next/server";
import { withAuthContext, ApiResponse, AuthResult } from "@/app/api/utils/auth";
import prisma from "@/prisma/db";
import crypto from "crypto";

interface SetupLinkResponse {
  setupUrl: string;
  token: string;
}

interface SetupLinkRequest {
  password: string;
}

async function handler(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<SetupLinkResponse>>> {
  const { caretakerId, isSysAdmin } = authContext;
  if (!isSysAdmin) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Apenas administradores do sistema podem criar links de configuração",
      },
      { status: 403 }
    );
  }
  try {
    const { password }: SetupLinkRequest = await req.json();
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }
    let actualCaretakerId = caretakerId;
    if (!actualCaretakerId) {
      const systemCaretaker = await prisma.caretaker.findFirst({
        where: {
          loginId: "00",
          deletedAt: null,
        },
      });
      if (!systemCaretaker) {
        return NextResponse.json(
          { success: false, error: "Administrador do sistema não encontrado" },
          { status: 500 }
        );
      }
      actualCaretakerId = systemCaretaker.id;
    }
    let token = "";
    let tokenExists = true;
    let attempts = 0;
    const maxAttempts = 10;
    while (tokenExists && attempts < maxAttempts) {
      token = crypto.randomBytes(3).toString("hex");
      const existingToken = await prisma.familySetup.findUnique({
        where: { token },
      });
      tokenExists = !!existingToken;
      attempts++;
    }
    if (tokenExists || !token) {
      return NextResponse.json(
        { success: false, error: "Não foi possível gerar um token único" },
        { status: 500 }
      );
    }
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.familySetup.create({
      data: {
        token,
        password,
        expiresAt,
        createdBy: actualCaretakerId,
      },
    });
    const setupUrl = `/setup/${token}`;
    return NextResponse.json({ success: true, data: { setupUrl, token } });
  } catch (error) {
    console.error("Erro ao criar link de configuração:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao criar link de configuração" },
      { status: 500 }
    );
  }
}

export const POST = withAuthContext(handler);
