import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "../../utils/auth";
import { ApiResponse } from "../../types";
import jwt from "jsonwebtoken";
import prisma from "../../db";

const JWT_SECRET = process.env.JWT_SECRET || "baby-control-jwt-secret";
const TOKEN_EXPIRATION = parseInt(process.env.AUTH_LIFE || "1800", 10);

export async function POST(req: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Autenticação obrigatória",
        },
        { status: 401 }
      );
    }
    if (!authResult.isAccountAuth || !authResult.accountId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error:
            "Atualização de token disponível apenas para autenticação de conta",
        },
        { status: 400 }
      );
    }
    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      include: {
        family: { select: { id: true, slug: true } },
        caretaker: { select: { id: true, role: true, type: true } },
      },
    });
    if (!account) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Conta não encontrada",
        },
        { status: 404 }
      );
    }
    const tokenData = {
      accountId: account.id,
      accountEmail: account.email,
      isAccountAuth: true,
      familyId: account.family?.id || null,
      familySlug: account.family?.slug || null,
      betaparticipant: account.betaparticipant,
      trialEnds: account.trialEnds?.toISOString(),
      planExpires: account.planExpires?.toISOString(),
      planType: account.planType,
      verified: account.verified,
      ...(account.caretaker && {
        caretakerId: account.caretaker.id,
        caretakerRole: account.caretaker.role,
        caretakerType: account.caretaker.type,
      }),
    };
    const newToken = jwt.sign(tokenData, JWT_SECRET, {
      expiresIn: `${TOKEN_EXPIRATION}s`,
    });
    return NextResponse.json<
      ApiResponse<{ token: string; familySlug: string | null }>
    >({
      success: true,
      data: {
        token: newToken,
        familySlug: account.family?.slug || null,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar token:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao atualizar token",
      },
      { status: 500 }
    );
  }
}
