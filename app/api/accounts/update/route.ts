import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import { withAuthContext, AuthResult } from "../../utils/auth";

interface AccountUpdateRequest {
  firstName: string;
  lastName?: string;
  email: string;
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  try {
    const { accountId, isAccountAuth } = authContext;
    if (!isAccountAuth || !accountId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Autenticação de conta obrigatória" },
        { status: 403 }
      );
    }
    const body: AccountUpdateRequest = await req.json();
    if (!body.firstName || !body.email) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Nome e e-mail são obrigatórios" },
        { status: 400 }
      );
    }
    if (body.email) {
      const existingAccount = await prisma.account.findFirst({
        where: {
          email: body.email,
          id: { not: accountId },
        },
      });
      if (existingAccount) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Endereço de e-mail já está em uso" },
          { status: 400 }
        );
      }
    }
    const updatedAccount = await prisma.account.update({
      where: { id: accountId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName || null,
        email: body.email,
      },
    });
    const response = {
      accountId: updatedAccount.id,
      email: updatedAccount.email,
      firstName: updatedAccount.firstName,
      lastName: updatedAccount.lastName,
      verified: updatedAccount.verified,
      betaparticipant: updatedAccount.betaparticipant,
    };
    return NextResponse.json<ApiResponse<typeof response>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Falha ao atualizar conta" },
      { status: 500 }
    );
  }
}

export const PUT = withAuthContext(handlePut as any);
