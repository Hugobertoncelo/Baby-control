import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import { sendVerificationEmail } from "../../utils/account-emails";
import { hashPassword } from "../../utils/password-utils";

const registrationAttempts = new Map<
  string,
  { count: number; resetTime: number }
>();
const MAX_REGISTRATION_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;

interface AccountRegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface AccountRegistrationResponse {
  success: boolean;
  message: string;
  requiresVerification: boolean;
}

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

function checkRegistrationRateLimit(ip: string): {
  allowed: boolean;
  remainingTime: number;
} {
  const now = Date.now();
  const attempt = registrationAttempts.get(ip);
  if (!attempt) {
    return { allowed: true, remainingTime: 0 };
  }
  if (now > attempt.resetTime) {
    registrationAttempts.delete(ip);
    return { allowed: true, remainingTime: 0 };
  }
  if (attempt.count >= MAX_REGISTRATION_ATTEMPTS) {
    const remainingTime = Math.ceil((attempt.resetTime - now) / 1000 / 60);
    return { allowed: false, remainingTime };
  }
  return { allowed: true, remainingTime: 0 };
}

function recordRegistrationAttempt(ip: string): void {
  const now = Date.now();
  const attempt = registrationAttempts.get(ip);
  if (!attempt || now > attempt.resetTime) {
    registrationAttempts.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
  } else {
    attempt.count += 1;
    registrationAttempts.set(ip, attempt);
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) return false;
  return true;
}

function generateVerificationToken(): string {
  return randomBytes(3).toString("hex");
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<AccountRegistrationResponse>>> {
  try {
    const ip = getClientIP(req);
    const rateLimitCheck = checkRegistrationRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      console.log(
        `Limite de tentativas de registro excedido para o IP: ${ip}, tempo restante: ${rateLimitCheck.remainingTime} minutos`
      );
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: `Muitas tentativas de registro. Por favor, tente novamente em ${rateLimitCheck.remainingTime} minutos.`,
        },
        { status: 429 }
      );
    }
    const body: AccountRegistrationRequest = await req.json();
    const { email, password, firstName, lastName } = body;
    if (!email || !password || !firstName) {
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: "E-mail, senha e nome são obrigatórios",
        },
        { status: 400 }
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: "Por favor, forneça um endereço de e-mail válido",
        },
        { status: 400 }
      );
    }
    if (!isValidPassword(password)) {
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error:
            "A senha deve ter pelo menos 8 caracteres e incluir letras minúsculas, maiúsculas, números e caracteres especiais (!@#$%^&*()_+-=[]{}|;:,.<>?)",
        },
        { status: 400 }
      );
    }
    if (firstName.trim().length < 1) {
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
        {
          success: false,
          error: "O nome não pode estar vazio",
        },
        { status: 400 }
      );
    }
    recordRegistrationAttempt(ip);
    const existingAccount = await prisma.account.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingAccount) {
      console.log(`Tentativa de registro com e-mail já existente: ${email}`);
      return NextResponse.json<ApiResponse<AccountRegistrationResponse>>({
        success: true,
        data: {
          success: true,
          message:
            "Registro realizado com sucesso! Por favor, verifique seu e-mail para instruções de verificação.",
          requiresVerification: true,
        },
      });
    }
    const verificationToken = generateVerificationToken();
    const hashedPassword = await hashPassword(password);
    const isBetaEnabled = process.env.BETA === "1";
    const account = await prisma.account.create({
      data: {
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName?.trim() || null,
        verified: false,
        verificationToken,
        betaparticipant: isBetaEnabled,
        provider: "email",
      },
    });
    console.log(
      `Conta criada (não verificada) para o e-mail: ${email}, accountId: ${account.id}`
    );
    try {
      await sendVerificationEmail(
        account.email,
        verificationToken,
        account.firstName || "Usuário"
      );
      console.log(`E-mail de verificação enviado para: ${email}`);
    } catch (emailError) {
      console.error("Falha ao enviar e-mail de verificação:", emailError);
    }
    return NextResponse.json<ApiResponse<AccountRegistrationResponse>>({
      success: true,
      data: {
        success: true,
        message:
          "Registro realizado com sucesso! Por favor, verifique seu e-mail para instruções de verificação.",
        requiresVerification: true,
      },
    });
  } catch (error) {
    console.error("Erro no registro de conta:", error);
    return NextResponse.json<ApiResponse<AccountRegistrationResponse>>(
      {
        success: false,
        error: "Falha no registro. Por favor, tente novamente mais tarde.",
      },
      { status: 500 }
    );
  }
}
