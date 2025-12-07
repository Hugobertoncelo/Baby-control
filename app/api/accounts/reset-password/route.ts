import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import { hashPassword } from "../../utils/password-utils";
import {
  checkIpLockout,
  recordFailedAttempt,
  resetFailedAttempts,
} from "../../utils/ip-lockout";

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp;
  }
  return "unknown";
}

function isValidPassword(password: string): boolean {
  return (
    password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
  );
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ResetPasswordResponse>>> {
  try {
    const ip = getClientIP(req);
    const { locked, remainingTime } = checkIpLockout(ip);
    if (locked) {
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error: `Muitas tentativas falhas. Por favor, tente novamente em ${Math.ceil(
            remainingTime / 60000
          )} minutos.`,
        },
        { status: 429 }
      );
    }
    const { token, password }: ResetPasswordRequest = await req.json();
    if (!token || !password) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error: "Token de redefinição e nova senha são obrigatórios",
        },
        { status: 400 }
      );
    }
    if (!isValidPassword(password)) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error:
            "A senha deve ter pelo menos 8 caracteres e conter letras e números",
        },
        { status: 400 }
      );
    }
    const account = await prisma.account.findUnique({
      where: { passwordResetToken: token },
    });
    if (!account) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error: "Token de redefinição inválido ou expirado",
        },
        { status: 400 }
      );
    }
    if (
      !account.passwordResetExpires ||
      account.passwordResetExpires < new Date()
    ) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
        {
          success: false,
          error:
            "O token de redefinição expirou. Solicite uma nova redefinição de senha.",
        },
        { status: 400 }
      );
    }
    const hashedPassword = await hashPassword(password);
    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    resetFailedAttempts(ip);
    console.log(`Senha redefinida com sucesso para a conta: ${account.email}`);
    return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
      {
        success: true,
        data: {
          success: true,
          message:
            "Senha redefinida com sucesso. Agora você pode fazer login com sua nova senha.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    return NextResponse.json<ApiResponse<ResetPasswordResponse>>(
      {
        success: false,
        error:
          "Erro interno do servidor. Por favor, tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ valid: boolean; email?: string }>>> {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json<ApiResponse<{ valid: boolean }>>(
        {
          success: false,
          error: "Token de redefinição é obrigatório",
        },
        { status: 400 }
      );
    }
    const account = await prisma.account.findUnique({
      where: { passwordResetToken: token },
      select: {
        id: true,
        email: true,
        passwordResetExpires: true,
      },
    });
    if (!account) {
      return NextResponse.json<ApiResponse<{ valid: boolean }>>(
        {
          success: true,
          data: { valid: false },
        },
        { status: 200 }
      );
    }
    const isExpired =
      !account.passwordResetExpires ||
      account.passwordResetExpires < new Date();
    return NextResponse.json<ApiResponse<{ valid: boolean; email?: string }>>(
      {
        success: true,
        data: {
          valid: !isExpired,
          email: isExpired ? undefined : account.email,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro na validação do token:", error);
    return NextResponse.json<ApiResponse<{ valid: boolean }>>(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 }
    );
  }
}
