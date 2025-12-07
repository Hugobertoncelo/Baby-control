import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse } from "../types";
import jwt from "jsonwebtoken";
import {
  checkIpLockout,
  recordFailedAttempt,
  resetFailedAttempts,
} from "../utils/ip-lockout";
import { decrypt, isEncrypted } from "../utils/encryption";
import { randomUUID } from "crypto";
import { logApiCall, getClientInfo } from "../utils/api-logger";

const JWT_SECRET = process.env.JWT_SECRET || "baby-control-jwt-secret";
const TOKEN_EXPIRATION = parseInt(process.env.AUTH_LIFE || "1800", 10);

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const { ip, userAgent } = getClientInfo(req);
  let requestBody: any;
  try {
    const { locked, remainingTime } = checkIpLockout(ip);
    if (locked) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: `Você foi bloqueado devido a muitas tentativas falhas. Por favor, tente novamente em ${Math.ceil(
            remainingTime / 60000
          )} minutos.`,
        },
        { status: 429 }
      );
    }
    requestBody = await req.json();
    const { loginId, securityPin, familySlug, adminPassword } = requestBody;
    if (!securityPin && !adminPassword) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "PIN de segurança ou senha de administrador é obrigatório",
        },
        { status: 400 }
      );
    }
    if (adminPassword) {
      try {
        const appConfig = await prisma.appConfig.findFirst();
        if (!appConfig) {
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error: "Configuração do sistema não encontrada",
            },
            { status: 500 }
          );
        }
        let decryptedAdminPass: string;
        if (!appConfig.adminPass || appConfig.adminPass.trim() === "") {
          decryptedAdminPass = "admin";
        } else {
          decryptedAdminPass = isEncrypted(appConfig.adminPass)
            ? decrypt(appConfig.adminPass)
            : appConfig.adminPass;
        }
        if (adminPassword === decryptedAdminPass) {
          const token = jwt.sign(
            {
              id: "sysadmin",
              name: "Administrador do Sistema",
              type: "SYSADMIN",
              role: "SYSADMIN",
              familyId: null,
              familySlug: null,
              isSysAdmin: true,
            },
            JWT_SECRET,
            { expiresIn: `${TOKEN_EXPIRATION}s` }
          );
          resetFailedAttempts(ip);
          const response = NextResponse.json<
            ApiResponse<{
              id: string;
              name: string;
              type: string;
              role: string;
              token: string;
              familyId: string | null;
              familySlug: string | null;
              isSysAdmin: boolean;
            }>
          >({
            success: true,
            data: {
              id: "sysadmin",
              name: "Administrador do Sistema",
              type: "SYSADMIN",
              role: "SYSADMIN",
              token: token,
              familyId: null,
              familySlug: null,
              isSysAdmin: true,
            },
          });
          logApiCall({
            method: req.method,
            path: "/api/auth",
            status: 200,
            durationMs: Date.now() - startTime,
            ip,
            userAgent,
            caretakerId: "sysadmin",
            familyId: undefined,
            requestBody: { ...requestBody, adminPassword: "[REDACTED]" },
            responseBody: {
              success: true,
              data: {
                id: "sysadmin",
                name: "Administrador do Sistema",
                type: "SYSADMIN",
              },
            },
          }).catch((err) =>
            console.error("Falha ao registrar chamada de API:", err)
          );
          return response;
        } else {
          recordFailedAttempt(ip);
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error: "Senha de administrador inválida",
            },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error(
          "Erro de autenticação do administrador do sistema:",
          error
        );
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Falha na autenticação do administrador do sistema",
          },
          { status: 500 }
        );
      }
    }
    let targetFamily = null;
    if (familySlug) {
      targetFamily = await prisma.family.findFirst({
        where: {
          slug: familySlug,
          isActive: true,
        },
        include: {
          account: {
            select: {
              id: true,
              betaparticipant: true,
              trialEnds: true,
              planType: true,
              planExpires: true,
            },
          },
        },
      });
      if (!targetFamily) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Família inválida",
          },
          { status: 404 }
        );
      }
    }
    let settings = targetFamily
      ? await prisma.settings.findFirst({
          where: { familyId: targetFamily.id },
        })
      : await prisma.settings.findFirst();
    if (!settings) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error:
            "Configurações da família não encontradas. Por favor, contate o administrador.",
        },
        { status: 500 }
      );
    }
    const caretakerCount = await prisma.caretaker.count({
      where: {
        deletedAt: null,
        loginId: { not: "00" },
        ...(targetFamily ? { familyId: targetFamily.id } : {}),
      },
    });
    let authType = settings.authType;
    if (!authType) {
      authType = caretakerCount > 1 ? "CARETAKER" : "SYSTEM";
    }
    if (authType === "SYSTEM") {
      if (settings.securityPin === securityPin) {
        let systemCaretaker = await prisma.caretaker.findFirst({
          where: {
            loginId: "00",
            deletedAt: null,
            ...(targetFamily ? { familyId: targetFamily.id } : {}),
          },
          include: {
            family: true,
          },
        });
        if (!systemCaretaker && targetFamily) {
          systemCaretaker = await prisma.caretaker.create({
            data: {
              id: randomUUID(),
              loginId: "00",
              name: "system",
              type: "Administrador do Sistema",
              role: "ADMIN",
              securityPin: settings.securityPin,
              familyId: targetFamily.id,
              inactive: false,
            },
            include: {
              family: true,
            },
          });
        }
        if (systemCaretaker) {
          let tokenData: any = {
            id: systemCaretaker.id,
            name: systemCaretaker.name,
            type: systemCaretaker.type,
            role: (systemCaretaker as any).role || "ADMIN",
            familyId: systemCaretaker.familyId,
            familySlug: systemCaretaker.family?.slug,
            authType: "SYSTEM",
            isAccountAuth: false,
          };
          if (targetFamily?.account) {
            tokenData.betaparticipant = targetFamily.account.betaparticipant;
            tokenData.trialEnds = targetFamily.account.trialEnds?.toISOString();
            tokenData.planExpires =
              targetFamily.account.planExpires?.toISOString();
            tokenData.planType = targetFamily.account.planType;
          }
          const token = jwt.sign(tokenData, JWT_SECRET, {
            expiresIn: `${TOKEN_EXPIRATION}s`,
          });
          const response = NextResponse.json<
            ApiResponse<{
              id: string;
              name: string;
              type: string | null;
              role: string;
              token: string;
              familyId: string | null;
              familySlug: string | null;
            }>
          >({
            success: true,
            data: {
              id: systemCaretaker.id,
              name: systemCaretaker.name,
              type: systemCaretaker.type,
              role: (systemCaretaker as any).role || "ADMIN",
              token: token,
              familyId: systemCaretaker.familyId,
              familySlug: systemCaretaker.family?.slug || null,
            },
          });
          response.cookies.set("caretakerId", systemCaretaker.id, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: "strict",
            maxAge: TOKEN_EXPIRATION,
            path: "/",
          });
          if (!settings.authType) {
            try {
              await prisma.settings.update({
                where: { id: settings.id },
                data: { authType: authType },
              });
            } catch (error) {
              console.error(
                "Erro ao atualizar authType nas configurações:",
                error
              );
            }
          }
          resetFailedAttempts(ip);
          logApiCall({
            method: req.method,
            path: "/api/auth",
            status: 200,
            durationMs: Date.now() - startTime,
            ip,
            userAgent,
            caretakerId: systemCaretaker.id,
            familyId: systemCaretaker.familyId ?? undefined,
            requestBody: { ...requestBody, securityPin: "[REDACTED]" },
            responseBody: {
              success: true,
              data: {
                id: systemCaretaker.id,
                name: systemCaretaker.name,
                familySlug: systemCaretaker.family?.slug,
              },
            },
          }).catch((err) =>
            console.error("Falha ao registrar chamada de API:", err)
          );
          return response;
        } else {
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error:
                "Não foi possível criar o cuidador do sistema. Por favor, contate o administrador.",
            },
            { status: 500 }
          );
        }
      }
    } else if (authType === "CARETAKER") {
      if (!loginId) {
        recordFailedAttempt(ip);
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "ID de login é obrigatório para autenticação de cuidador.",
          },
          { status: 401 }
        );
      }
    }
    if (loginId) {
      const caretaker = await prisma.caretaker.findFirst({
        where: {
          loginId: loginId,
          inactive: false,
          deletedAt: null,
          ...(targetFamily ? { familyId: targetFamily.id } : {}),
        } as any,
        include: {
          family: true,
        },
      });
      if (caretaker && caretaker.loginId === "00" && authType === "CARETAKER") {
        recordFailedAttempt(ip);
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error:
              "Acesso à conta do sistema está desabilitado no modo de autenticação de cuidador",
          },
          { status: 403 }
        );
      }
      if (caretaker && caretaker.loginId === "00") {
        const regularCaretakerCount = await prisma.caretaker.count({
          where: {
            deletedAt: null,
            loginId: { not: "00" },
            ...(targetFamily ? { familyId: targetFamily.id } : {}),
          },
        });
        if (regularCaretakerCount > 0) {
          recordFailedAttempt(ip);
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error:
                "Acesso à conta do sistema está desabilitado quando cuidadores estão configurados",
            },
            { status: 403 }
          );
        }
      }
      if (caretaker && caretaker.securityPin === securityPin) {
        let tokenData: any = {
          id: caretaker.id,
          name: caretaker.name,
          type: caretaker.type,
          role: (caretaker as any).role || "USER",
          familyId: caretaker.familyId,
          familySlug: caretaker.family?.slug,
          authType: authType,
          isAccountAuth: false,
        };
        if (targetFamily?.account) {
          tokenData.betaparticipant = targetFamily.account.betaparticipant;
          tokenData.trialEnds = targetFamily.account.trialEnds?.toISOString();
          tokenData.planExpires =
            targetFamily.account.planExpires?.toISOString();
          tokenData.planType = targetFamily.account.planType;
        }
        const token = jwt.sign(tokenData, JWT_SECRET, {
          expiresIn: `${TOKEN_EXPIRATION}s`,
        });
        const response = NextResponse.json<
          ApiResponse<{
            id: string;
            name: string;
            type: string | null;
            role: string;
            token: string;
            familyId: string | null;
            familySlug: string | null;
          }>
        >({
          success: true,
          data: {
            id: caretaker.id,
            name: caretaker.name,
            type: caretaker.type,
            role: (caretaker as any).role || "USER",
            token: token,
            familyId: caretaker.familyId,
            familySlug: caretaker.family?.slug || null,
          },
        });
        response.cookies.set("caretakerId", caretaker.id, {
          httpOnly: true,
          secure: process.env.COOKIE_SECURE === "true",
          sameSite: "strict",
          maxAge: TOKEN_EXPIRATION,
          path: "/",
        });
        if (!settings.authType) {
          try {
            await prisma.settings.update({
              where: { id: settings.id },
              data: { authType: authType },
            });
          } catch (error) {
            console.error(
              "Erro ao atualizar authType nas configurações:",
              error
            );
          }
        }
        resetFailedAttempts(ip);
        logApiCall({
          method: req.method,
          path: "/api/auth",
          status: 200,
          durationMs: Date.now() - startTime,
          ip,
          userAgent,
          caretakerId: caretaker.id,
          familyId: caretaker.familyId ?? undefined,
          requestBody: { ...requestBody, securityPin: "[REDACTED]" },
          responseBody: {
            success: true,
            data: {
              id: caretaker.id,
              name: caretaker.name,
              familySlug: caretaker.family?.slug,
            },
          },
        }).catch((err) =>
          console.error("Falha ao registrar chamada de API:", err)
        );
        return response;
      }
    }
    recordFailedAttempt(ip);
    const errorMessage = targetFamily
      ? "Credenciais inválidas ou usuário não tem acesso a esta família"
      : "Credenciais inválidas";
    logApiCall({
      method: req.method,
      path: "/api/auth",
      status: 401,
      durationMs: Date.now() - startTime,
      ip,
      userAgent,
      familyId: targetFamily?.id,
      error: errorMessage,
      requestBody: {
        ...requestBody,
        securityPin: requestBody?.securityPin ? "[REDACTED]" : undefined,
        adminPassword: requestBody?.adminPassword ? "[REDACTED]" : undefined,
      },
      responseBody: { success: false, error: errorMessage },
    }).catch((err) => console.error("Falha ao registrar chamada de API:", err));
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: errorMessage,
      },
      { status: 401 }
    );
  } catch (error) {
    console.error("Erro de autenticação:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha na autenticação",
      },
      { status: 500 }
    );
  }
}
