import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import {
  checkIpLockout,
  recordFailedAttempt,
  resetFailedAttempts,
} from "../../utils/ip-lockout";
import { sendPasswordResetEmail } from "../../utils/account-emails";
import crypto from "crypto";

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
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

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateResetToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ForgotPasswordResponse>>> {
  try {
    const ip = getClientIP(req);
    const { locked, remainingTime } = checkIpLockout(ip);
    if (locked) {
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: false,
          error: `Muitas tentativas falhas. Por favor, tente novamente em ${Math.ceil(
            remainingTime / 60000
          )} minutos.`,
        },
        { status: 429 }
      );
    }
    const { email }: ForgotPasswordRequest = await req.json();
    if (!email) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: false,
          error: "E-mail é obrigatório",
        },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: false,
          error: "Por favor, insira um endereço de e-mail válido",
        },
        { status: 400 }
      );
    }
    const account = await prisma.account.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!account) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: true,
          data: {
            success: true,
            message:
              "Se existir uma conta com esse e-mail, enviamos instruções para redefinir a senha.",
          },
        },
        { status: 200 }
      );
    }
    if (!account.verified) {
      recordFailedAttempt(ip);
      return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
        {
          success: false,
          error:
            "A conta não está verificada. Por favor, verifique seu e-mail primeiro.",
        },
        { status: 400 }
      );
    }
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.account.update({
      where: { id: account.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });
    try {
      await sendPasswordResetEmail(
        account.email,
        resetToken,
        account.firstName || "Usuário"
      );
    } catch (emailError) {}
    resetFailedAttempts(ip);
    return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
      {
        success: true,
        data: {
          success: true,
          message:
            "Se existir uma conta com esse e-mail, enviamos instruções para redefinir a senha.",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json<ApiResponse<ForgotPasswordResponse>>(
      {
        success: false,
        error:
          "Erro interno do servidor. Por favor, tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}
