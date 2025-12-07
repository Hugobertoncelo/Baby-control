import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import { getAuthenticatedUser } from "../../utils/auth";
import { verifyPassword } from "../../utils/password-utils";
import { sendAccountClosureEmail } from "../../utils/account-emails";

interface CloseAccountResponse {
  success: boolean;
  message: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<CloseAccountResponse>>> {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated || !authResult.accountId) {
      return NextResponse.json<ApiResponse<CloseAccountResponse>>(
        {
          success: false,
          error: "Autenticação obrigatória",
        },
        { status: 401 }
      );
    }
    const body = await req.json();
    const { password } = body;
    if (!password) {
      return NextResponse.json<ApiResponse<CloseAccountResponse>>(
        {
          success: false,
          error: "A senha é obrigatória para encerrar a conta",
        },
        { status: 400 }
      );
    }
    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        familyId: true,
        caretaker: { select: { id: true } },
      },
    });
    if (!account) {
      return NextResponse.json<ApiResponse<CloseAccountResponse>>(
        {
          success: false,
          error: "Conta não encontrada",
        },
        { status: 404 }
      );
    }
    const isPasswordValid = await verifyPassword(password, account.password);
    if (!isPasswordValid) {
      return NextResponse.json<ApiResponse<CloseAccountResponse>>(
        {
          success: false,
          error: "Senha incorreta",
        },
        { status: 400 }
      );
    }
    await prisma.account.update({
      where: { id: account.id },
      data: {
        closed: true,
        closedAt: new Date(),
        verificationToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    if (account.familyId) {
      await prisma.family.update({
        where: { id: account.familyId },
        data: {
          isActive: false,
        },
      });
    }
    if (account.caretaker) {
      await prisma.caretaker.update({
        where: { id: account.caretaker.id },
        data: {
          deletedAt: new Date(),
        },
      });
    }
    try {
      await sendAccountClosureEmail(
        account.email,
        account.firstName || "Usuário"
      );
    } catch (emailError) {}
    return NextResponse.json<ApiResponse<CloseAccountResponse>>({
      success: true,
      data: {
        success: true,
        message:
          "Conta encerrada com sucesso. Um e-mail de confirmação foi enviado.",
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<CloseAccountResponse>>(
      {
        success: false,
        error:
          "Falha ao encerrar a conta. Por favor, tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}
