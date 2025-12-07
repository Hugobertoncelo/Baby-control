import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import { sendVerificationEmail } from "../../utils/account-emails";

interface ResendVerificationRequest {
  email: string;
}

interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

const resendAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_RESEND_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

function checkResendRateLimit(ip: string): {
  allowed: boolean;
  remainingTime: number;
} {
  const now = Date.now();
  const attempt = resendAttempts.get(ip);
  if (!attempt) {
    return { allowed: true, remainingTime: 0 };
  }
  if (now > attempt.resetTime) {
    resendAttempts.delete(ip);
    return { allowed: true, remainingTime: 0 };
  }
  if (attempt.count >= MAX_RESEND_ATTEMPTS) {
    const remainingTime = Math.ceil((attempt.resetTime - now) / 1000 / 60);
    return { allowed: false, remainingTime };
  }
  return { allowed: true, remainingTime: 0 };
}

function recordResendAttempt(ip: string): void {
  const now = Date.now();
  const attempt = resendAttempts.get(ip);
  if (!attempt || now > attempt.resetTime) {
    resendAttempts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
  } else {
    attempt.count += 1;
    resendAttempts.set(ip, attempt);
  }
}

function generateVerificationToken(): string {
  return randomBytes(3).toString("hex");
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<ResendVerificationResponse>>> {
  try {
    const ip = getClientIP(req);
    const rateLimitCheck = checkResendRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      console.log(
        `Limite de reenvio de verificação excedido para o IP: ${ip}, tempo restante: ${rateLimitCheck.remainingTime} minutos`
      );
      return NextResponse.json<ApiResponse<ResendVerificationResponse>>(
        {
          success: false,
          error: `Muitas tentativas de reenvio. Por favor, tente novamente em ${rateLimitCheck.remainingTime} minutos.`,
        },
        { status: 429 }
      );
    }
    const body: ResendVerificationRequest = await req.json();
    const { email } = body;
    if (!email) {
      return NextResponse.json<ApiResponse<ResendVerificationResponse>>(
        {
          success: false,
          error: "E-mail é obrigatório",
        },
        { status: 400 }
      );
    }
    recordResendAttempt(ip);
    const account = await prisma.account.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!account) {
      console.log(
        `Solicitação de reenvio de verificação para e-mail inexistente: ${email}`
      );
      return NextResponse.json<ApiResponse<ResendVerificationResponse>>({
        success: true,
        data: {
          success: true,
          message:
            "Se existir uma conta com este e-mail e ela ainda não estiver verificada, um novo e-mail de verificação foi enviado.",
        },
      });
    }
    if (account.verified) {
      console.log(
        `Solicitação de reenvio de verificação para conta já verificada: ${email}`
      );
      return NextResponse.json<ApiResponse<ResendVerificationResponse>>({
        success: true,
        data: {
          success: true,
          message:
            "Se existir uma conta com este e-mail e ela ainda não estiver verificada, um novo e-mail de verificação foi enviado.",
        },
      });
    }
    const verificationToken = generateVerificationToken();
    await prisma.account.update({
      where: { id: account.id },
      data: {
        verificationToken,
      },
    });
    console.log(
      `Token de verificação atualizado para a conta: ${email}, accountId: ${account.id}`
    );
    try {
      await sendVerificationEmail(
        account.email,
        verificationToken,
        account.firstName || "Usuário"
      );
      console.log(`E-mail de verificação reenviado para: ${email}`);
    } catch (emailError) {
      console.error("Falha ao reenviar e-mail de verificação:", emailError);
    }
    return NextResponse.json<ApiResponse<ResendVerificationResponse>>({
      success: true,
      data: {
        success: true,
        message:
          "Se existir uma conta com este e-mail e ela ainda não estiver verificada, um novo e-mail de verificação foi enviado.",
      },
    });
  } catch (error) {
    console.error("Erro ao reenviar verificação:", error);
    return NextResponse.json<ApiResponse<ResendVerificationResponse>>(
      {
        success: false,
        error:
          "Falha ao reenviar o e-mail de verificação. Por favor, tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}
