import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, ApiResponse } from "../../utils/auth";
import prisma from "../../db";

interface LinkCaretakerRequest {
  caretakerId: string;
}

interface LinkCaretakerResponse {
  success: boolean;
  message: string;
}

async function handler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<LinkCaretakerResponse>>> {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: "Autenticação obrigatória",
        },
        { status: 401 }
      );
    }
    if (!authResult.isAccountAuth || !authResult.accountId) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: "Este endpoint está disponível apenas para usuários de conta",
        },
        { status: 403 }
      );
    }
    const body: LinkCaretakerRequest = await req.json();
    const { caretakerId } = body;
    if (!caretakerId || typeof caretakerId !== "string") {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: "ID do cuidador é obrigatório",
        },
        { status: 400 }
      );
    }
    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      include: { family: true },
    });
    if (!account) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: "Conta não encontrada",
        },
        { status: 404 }
      );
    }
    if (!account.familyId) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: "A conta não está associada a uma família",
        },
        { status: 400 }
      );
    }
    const caretaker = await prisma.caretaker.findUnique({
      where: { id: caretakerId },
    });
    if (!caretaker) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: "Cuidador não encontrado",
        },
        { status: 404 }
      );
    }
    if (caretaker.familyId !== account.familyId) {
      return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
        {
          success: false,
          error: "O cuidador não pertence à sua família",
        },
        { status: 403 }
      );
    }
    await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: authResult.accountId },
        data: { caretakerId },
      });
      await tx.caretaker.update({
        where: { id: caretakerId },
        data: { accountId: authResult.accountId },
      });
    });
    return NextResponse.json<ApiResponse<LinkCaretakerResponse>>({
      success: true,
      data: {
        success: true,
        message: "Conta vinculada ao cuidador com sucesso",
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<LinkCaretakerResponse>>(
      {
        success: false,
        error:
          "Falha ao vincular cuidador à conta. Por favor, tente novamente.",
      },
      { status: 500 }
    );
  }
}

export const POST = handler;
