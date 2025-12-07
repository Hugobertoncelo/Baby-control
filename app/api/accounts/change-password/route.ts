import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import { hashPassword, verifyPassword } from "../../utils/password-utils";
import { getAuthenticatedUser } from "../../utils/auth";

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) return false;
  return true;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ChangePasswordResponse>>> {
  try {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated || !authResult.accountId) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: "Autenticação obrigatória",
        },
        { status: 401 }
      );
    }
    const body: ChangePasswordRequest = await req.json();
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: "Senha atual e nova senha são obrigatórias",
        },
        { status: 400 }
      );
    }
    if (!isValidPassword(newPassword)) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error:
            "A nova senha deve ter pelo menos 8 caracteres e incluir letras minúsculas, maiúsculas, números e caracteres especiais (!@#$%^&*()_+-=[]{}|;:,.<>?)",
        },
        { status: 400 }
      );
    }
    if (currentPassword === newPassword) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: "A nova senha deve ser diferente da senha atual",
        },
        { status: 400 }
      );
    }
    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      select: { id: true, email: true, password: true },
    });
    if (!account) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: "Conta não encontrada",
        },
        { status: 404 }
      );
    }
    const isCurrentPasswordValid = await verifyPassword(
      currentPassword,
      account.password
    );
    if (!isCurrentPasswordValid) {
      return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
        {
          success: false,
          error: "A senha atual está incorreta",
        },
        { status: 400 }
      );
    }
    const hashedNewPassword = await hashPassword(newPassword);
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedNewPassword,
      },
    });
    return NextResponse.json<ApiResponse<ChangePasswordResponse>>({
      success: true,
      data: {
        success: true,
        message: "Senha alterada com sucesso",
      },
    });
  } catch (error) {
    return NextResponse.json<ApiResponse<ChangePasswordResponse>>(
      {
        success: false,
        error:
          "Falha ao alterar a senha. Por favor, tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}
