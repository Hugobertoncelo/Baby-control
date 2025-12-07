import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import jwt from "jsonwebtoken";
import { verifyPassword } from "../../utils/password-utils";
import {
  checkIpLockout,
  recordFailedAttempt,
  resetFailedAttempts,
} from "../../utils/ip-lockout";
import { logApiCall, getClientInfo } from "../../utils/api-logger";

const JWT_SECRET = process.env.JWT_SECRET || "baby-control-jwt-secret";
const TOKEN_EXPIRATION = parseInt(process.env.AUTH_LIFE || "43200", 10);

interface AccountLoginRequest {
  email: string;
  password: string;
}

interface AccountLoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    verified: boolean;
    hasFamily: boolean;
    familyId?: string;
    familySlug?: string;
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<AccountLoginResponse>>> {
  const startTime = Date.now();
  const { ip, userAgent } = getClientInfo(req);
  let requestBody: any;

  try {
    const { locked, remainingTime } = checkIpLockout(ip);
    if (locked) {
      const errorMsg = `Muitas tentativas falhas. Por favor, tente novamente em ${Math.ceil(
        remainingTime / 60000
      )} minutos.`;

      logApiCall({
        method: req.method,
        path: "/api/accounts/login",
        status: 429,
        durationMs: Date.now() - startTime,
        ip,
        userAgent,
        error: errorMsg,
      }).catch((err) =>
        console.error("Falha ao registrar chamada de API:", err)
      );

      return NextResponse.json<ApiResponse<AccountLoginResponse>>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 429 }
      );
    }

    requestBody = await req.json();
    const { email, password }: AccountLoginRequest = requestBody;

    if (!email || !password) {
      recordFailedAttempt(ip);
      const errorMsg = "E-mail e senha são obrigatórios";

      logApiCall({
        method: req.method,
        path: "/api/accounts/login",
        status: 400,
        durationMs: Date.now() - startTime,
        ip,
        userAgent,
        error: errorMsg,
        requestBody: { email: email || undefined },
        responseBody: { success: false, error: errorMsg },
      }).catch((err) => console.error("Failed to log API call:", err));

      return NextResponse.json<ApiResponse<AccountLoginResponse>>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      recordFailedAttempt(ip);
      const errorMsg = "Por favor, insira um endereço de e-mail válido";

      logApiCall({
        method: req.method,
        path: "/api/accounts/login",
        status: 400,
        durationMs: Date.now() - startTime,
        ip,
        userAgent,
        error: errorMsg,
        requestBody: { email },
        responseBody: { success: false, error: errorMsg },
      }).catch((err) => console.error("Failed to log API call:", err));

      return NextResponse.json<ApiResponse<AccountLoginResponse>>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        family: true,
        caretaker: true,
      },
    });

    if (!account) {
      recordFailedAttempt(ip);
      const errorMsg = "E-mail ou senha inválidos";

      logApiCall({
        method: req.method,
        path: "/api/accounts/login",
        status: 401,
        durationMs: Date.now() - startTime,
        ip,
        userAgent,
        error: errorMsg,
        requestBody: { email, password: "[REDACTED]" },
        responseBody: { success: false, error: errorMsg },
      }).catch((err) => console.error("Failed to log API call:", err));

      return NextResponse.json<ApiResponse<AccountLoginResponse>>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 401 }
      );
    }

    if (account.closed) {
      recordFailedAttempt(ip);
      const errorMsg = "Esta conta foi encerrada";

      logApiCall({
        method: req.method,
        path: "/api/accounts/login",
        status: 401,
        durationMs: Date.now() - startTime,
        ip,
        userAgent,
        error: errorMsg,
        requestBody: { email, password: "[REDACTED]" },
        responseBody: { success: false, error: errorMsg },
        familyId: account.familyId ?? undefined,
      }).catch((err) => console.error("Failed to log API call:", err));

      return NextResponse.json<ApiResponse<AccountLoginResponse>>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 401 }
      );
    }

    const passwordMatch = await verifyPassword(password, account.password);
    if (!passwordMatch) {
      recordFailedAttempt(ip);
      const errorMsg = "E-mail ou senha inválidos";

      logApiCall({
        method: req.method,
        path: "/api/accounts/login",
        status: 401,
        durationMs: Date.now() - startTime,
        ip,
        userAgent,
        error: errorMsg,
        requestBody: { email, password: "[REDACTED]" },
        responseBody: { success: false, error: errorMsg },
        familyId: account.familyId ?? undefined,
      }).catch((err) => console.error("Failed to log API call:", err));

      return NextResponse.json<ApiResponse<AccountLoginResponse>>(
        {
          success: false,
          error: errorMsg,
        },
        { status: 401 }
      );
    }

    resetFailedAttempts(ip);

    const token = jwt.sign(
      {
        id: account.id,
        name: account.firstName || "User",
        type: "ACCOUNT",
        role: "OWNER",
        familyId: account.familyId,
        familySlug: account.family?.slug,
        isAccountAuth: true,
        accountId: account.id,
        accountEmail: account.email,
        verified: account.verified,
        betaparticipant: account.betaparticipant,
        trialEnds: account.trialEnds?.toISOString(),
        planExpires: account.planExpires?.toISOString(),
        planType: account.planType,
      },
      JWT_SECRET,
      { expiresIn: `${TOKEN_EXPIRATION}s` }
    );

    const response: AccountLoginResponse = {
      success: true,
      message: "Login realizado com sucesso",
      token,
      user: {
        id: account.id,
        email: account.email,
        firstName: account.firstName || "",
        lastName: account.lastName || undefined,
        verified: account.verified,
        hasFamily: !!account.familyId,
        ...(account.familyId && { familyId: account.familyId }),
        ...(account.family?.slug && { familySlug: account.family.slug }),
      },
    };

    logApiCall({
      method: req.method,
      path: "/api/accounts/login",
      status: 200,
      durationMs: Date.now() - startTime,
      ip,
      userAgent,
      caretakerId: account.caretakerId ?? undefined,
      familyId: account.familyId ?? undefined,
      requestBody: { email, password: "[REDACTED]" },
      responseBody: {
        success: true,
        data: {
          id: account.id,
          email: account.email,
          firstName: account.firstName,
          familySlug: account.family?.slug,
        },
      },
    }).catch((err) => console.error("Failed to log API call:", err));

    return NextResponse.json<ApiResponse<AccountLoginResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Account login error:", error);

    const errorMsg =
      "Erro interno do servidor. Por favor, tente novamente mais tarde.";

    logApiCall({
      method: req.method,
      path: "/api/accounts/login",
      status: 500,
      durationMs: Date.now() - startTime,
      ip,
      userAgent,
      error: errorMsg,
      requestBody: requestBody
        ? { email: requestBody.email, password: "[REDACTED]" }
        : undefined,
      responseBody: { success: false, error: errorMsg },
    }).catch((err) => console.error("Failed to log API call:", err));

    return NextResponse.json<ApiResponse<AccountLoginResponse>>(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
