import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import jwt from "jsonwebtoken";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "baby-control-jwt-secret";
}

const tokenBlacklist = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  Array.from(tokenBlacklist.entries()).forEach(([token, expiry]) => {
    if (now > expiry) {
      tokenBlacklist.delete(token);
    }
  });
}, 60 * 60 * 1000);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResult {
  authenticated: boolean;
  caretakerId?: string | null;
  caretakerType?: string | null;
  caretakerRole?: string;
  familyId?: string | null;
  familySlug?: string | null;
  isSysAdmin?: boolean;
  isSetupAuth?: boolean;
  setupToken?: string;
  authType?: string;
  isAccountAuth?: boolean;
  accountId?: string;
  accountEmail?: string;
  isAccountOwner?: boolean;
  verified?: boolean;
  betaparticipant?: boolean;
  isExpired?: boolean;
  trialEnds?: string | null;
  planExpires?: string | null;
  planType?: string | null;
  error?: string;
}

export async function verifyAuthentication(req: NextRequest): Promise<boolean> {
  const authResult = await getAuthenticatedUser(req);
  return authResult.authenticated;
}

export async function getAuthenticatedUser(
  req: NextRequest
): Promise<AuthResult> {
  try {
    const authHeader = req.headers.get("Authorization");
    let token: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    const caretakerId = req.cookies.get("caretakerId")?.value;
    if (token) {
      if (tokenBlacklist.has(token)) {
        return { authenticated: false, error: "Token foi invalidado" };
      }
      try {
        const decoded = jwt.verify(token, getJwtSecret()) as any;
        if (decoded.isSetupAuth && decoded.setupToken) {
          return {
            authenticated: true,
            caretakerId: null,
            caretakerType: "Setup",
            caretakerRole: "ADMIN",
            familyId: null,
            familySlug: null,
            isSysAdmin: false,
            isSetupAuth: true,
            setupToken: decoded.setupToken,
          };
        }
        if (decoded.isAccountAuth) {
          try {
            const account = await prisma.account.findUnique({
              where: { id: decoded.accountId },
              include: {
                family: { select: { id: true, slug: true } },
                caretaker: {
                  select: { id: true, role: true, type: true, loginId: true },
                },
              },
            });
            if (!account) {
              return { authenticated: false, error: "Conta não encontrada" };
            }
            if (account.closed) {
              return { authenticated: false, error: "Conta está encerrada" };
            }
            const isSaasMode = process.env.DEPLOYMENT_MODE === "saas";
            let isExpired = false;
            if (isSaasMode && account.family && !account.betaparticipant) {
              const now = new Date();
              if (account.trialEnds) {
                const trialEndDate = new Date(account.trialEnds);
                isExpired = now > trialEndDate;
              } else if (account.planExpires) {
                const planEndDate = new Date(account.planExpires);
                isExpired = now > planEndDate;
              } else if (!account.planType) {
                isExpired = true;
              }
            }
            if (account.caretaker) {
              return {
                authenticated: true,
                caretakerId: account.caretaker.id,
                caretakerType:
                  account.caretaker.type || "Proprietário da Conta",
                caretakerRole: account.caretaker.role,
                familyId: account.family?.id || null,
                familySlug: account.family?.slug || null,
                isAccountAuth: true,
                accountId: decoded.accountId,
                accountEmail: decoded.accountEmail,
                isAccountOwner: true,
                verified: account.verified,
                betaparticipant: account.betaparticipant,
                isExpired,
                trialEnds: account.trialEnds?.toISOString() || null,
                planExpires: account.planExpires?.toISOString() || null,
                planType: account.planType,
              };
            } else {
              if (!account.family) {
                return {
                  authenticated: true,
                  caretakerId: decoded.accountId,
                  caretakerType: "ACCOUNT",
                  caretakerRole: "OWNER",
                  familyId: null,
                  familySlug: null,
                  isAccountAuth: true,
                  accountId: decoded.accountId,
                  accountEmail: decoded.accountEmail,
                  isAccountOwner: true,
                  verified: account.verified,
                  betaparticipant: account.betaparticipant,
                  isExpired,
                  trialEnds: account.trialEnds?.toISOString() || null,
                  planExpires: account.planExpires?.toISOString() || null,
                  planType: account.planType,
                };
              } else {
                return {
                  authenticated: true,
                  caretakerId: decoded.accountId,
                  caretakerType: "ACCOUNT",
                  caretakerRole: "OWNER",
                  familyId: account.family.id,
                  familySlug: account.family.slug,
                  isAccountAuth: true,
                  accountId: decoded.accountId,
                  accountEmail: decoded.accountEmail,
                  isAccountOwner: true,
                  verified: account.verified,
                  betaparticipant: account.betaparticipant,
                  isExpired,
                  trialEnds: account.trialEnds?.toISOString() || null,
                  planExpires: account.planExpires?.toISOString() || null,
                  planType: account.planType,
                };
              }
            }
          } catch (error) {
            return {
              authenticated: false,
              error: "Falha ao verificar status da conta",
            };
          }
        }
        const regularDecoded = decoded as {
          id: string;
          name: string;
          type: string | null;
          role: string;
          familyId: string | null;
          familySlug: string | null;
          isSysAdmin?: boolean;
        };
        let isExpired = false;
        let trialEnds: string | null = null;
        let planExpires: string | null = null;
        let planType: string | null = null;
        let betaparticipant = false;
        if (regularDecoded.familyId && !regularDecoded.isSysAdmin) {
          try {
            const family = await prisma.family.findUnique({
              where: { id: regularDecoded.familyId },
              include: {
                account: {
                  select: {
                    id: true,
                    betaparticipant: true,
                    trialEnds: true,
                    planType: true,
                    planExpires: true,
                    closed: true,
                  },
                },
              },
            });
            if (family?.account) {
              const account = family.account;
              const isSaasMode = process.env.DEPLOYMENT_MODE === "saas";
              if (account.closed) {
                return {
                  authenticated: false,
                  error: "Conta da família está encerrada",
                };
              }
              betaparticipant = account.betaparticipant || false;
              trialEnds = account.trialEnds?.toISOString() || null;
              planExpires = account.planExpires?.toISOString() || null;
              planType = account.planType;
              if (isSaasMode && !account.betaparticipant) {
                const now = new Date();
                if (account.trialEnds) {
                  const trialEndDate = new Date(account.trialEnds);
                  isExpired = now > trialEndDate;
                } else if (account.planExpires) {
                  const planEndDate = new Date(account.planExpires);
                  isExpired = now > planEndDate;
                } else if (!account.planType) {
                  isExpired = true;
                }
              }
            }
          } catch (error) {}
        }
        return {
          authenticated: true,
          caretakerId: regularDecoded.isSysAdmin ? null : regularDecoded.id,
          caretakerType: regularDecoded.type,
          caretakerRole: regularDecoded.role,
          familyId: regularDecoded.familyId,
          familySlug: regularDecoded.familySlug,
          isSysAdmin: regularDecoded.isSysAdmin || false,
          authType: (regularDecoded as any).authType || "CARETAKER",
          betaparticipant,
          isExpired,
          trialEnds,
          planExpires,
          planType,
        };
      } catch (jwtError) {
        return { authenticated: false, error: "Token inválido ou expirado" };
      }
    }
    if (caretakerId) {
      const caretaker = await prisma.caretaker.findFirst({
        where: {
          id: caretakerId,
          deletedAt: null,
        },
        include: {
          family: {
            include: {
              account: {
                select: {
                  id: true,
                  betaparticipant: true,
                  trialEnds: true,
                  planType: true,
                  planExpires: true,
                  closed: true,
                },
              },
            },
          },
        },
      });
      if (caretaker) {
        let isExpired = false;
        let trialEnds: string | null = null;
        let planExpires: string | null = null;
        let planType: string | null = null;
        let betaparticipant = false;
        if (caretaker.family?.account) {
          const account = caretaker.family.account;
          const isSaasMode = process.env.DEPLOYMENT_MODE === "saas";
          if (account.closed) {
            return {
              authenticated: false,
              error: "Conta da família está encerrada",
            };
          }
          betaparticipant = account.betaparticipant || false;
          trialEnds = account.trialEnds?.toISOString() || null;
          planExpires = account.planExpires?.toISOString() || null;
          planType = account.planType;
          if (isSaasMode && !account.betaparticipant) {
            const now = new Date();
            if (account.trialEnds) {
              const trialEndDate = new Date(account.trialEnds);
              isExpired = now > trialEndDate;
            } else if (account.planExpires) {
              const planEndDate = new Date(account.planExpires);
              isExpired = now > planEndDate;
            } else if (!account.planType) {
              isExpired = true;
            }
          }
        }
        return {
          authenticated: true,
          caretakerId: caretaker.id,
          caretakerType: caretaker.type,
          caretakerRole: (caretaker as any).role || "USER",
          familyId: caretaker.familyId,
          familySlug: caretaker.family?.slug,
          isSysAdmin: false,
          authType: "CARETAKER",
          betaparticipant,
          isExpired,
          trialEnds,
          planExpires,
          planType,
        };
      }
    }
    return {
      authenticated: false,
      error: "Nenhuma autenticação válida encontrada",
    };
  } catch (error) {
    return {
      authenticated: false,
      error: "Falha na verificação de autenticação",
    };
  }
}

export function withAuth<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    req: NextRequest
  ): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Autenticação necessária",
        },
        { status: 401 }
      );
    }
    return handler(req);
  };
}

export function withAdminAuth<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    req: NextRequest
  ): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Autenticação necessária",
        },
        { status: 401 }
      );
    }
    let isSystemCaretaker = false;
    if (authResult.caretakerId) {
      try {
        const caretaker = await prisma.caretaker.findFirst({
          where: {
            id: authResult.caretakerId,
            loginId: "00",
            deletedAt: null,
          },
        });
        isSystemCaretaker = !!caretaker;
      } catch (error) {}
    }
    if (
      authResult.caretakerRole !== "ADMIN" &&
      !isSystemCaretaker &&
      !authResult.isSysAdmin
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Acesso de administrador necessário",
        },
        { status: 403 }
      );
    }
    return handler(req);
  };
}

export function withSysAdminAuth<T>(
  handler: (req: NextRequest) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    req: NextRequest
  ): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Autenticação necessária",
        },
        { status: 401 }
      );
    }
    if (!authResult.isSysAdmin) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Acesso de administrador do sistema necessário",
        },
        { status: 403 }
      );
    }
    return handler(req);
  };
}

export function withAccountOwner<T>(
  handler: (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    req: NextRequest
  ): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { success: false, error: "Autenticação necessária" },
        { status: 401 }
      );
    }
    if (!authResult.isAccountOwner && !authResult.isSysAdmin) {
      return NextResponse.json(
        { success: false, error: "Acesso de proprietário da conta necessário" },
        { status: 403 }
      );
    }
    return handler(req, authResult);
  };
}

export function withAuthContext<T>(
  handler: (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (
    req: NextRequest
  ): Promise<NextResponse<ApiResponse<T | null>>> => {
    const authResult = await getAuthenticatedUser(req);
    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Autenticação necessária",
        },
        { status: 401 }
      );
    }
    if (authResult.isSetupAuth && authResult.setupToken) {
      const { searchParams } = new URL(req.url);
      let familyId = searchParams.get("familyId");
      if (familyId) {
        try {
          const setupToken = await prisma.familySetup.findUnique({
            where: { token: authResult.setupToken },
          });
          if (
            setupToken &&
            (setupToken.familyId === familyId || !setupToken.familyId)
          ) {
            const modifiedAuthResult = {
              ...authResult,
              familyId: familyId,
            };
            return handler(req, modifiedAuthResult);
          } else {
            return NextResponse.json<ApiResponse<null>>(
              {
                success: false,
                error: "Token de configuração não autorizado para esta família",
              },
              { status: 403 }
            );
          }
        } catch (error) {
          return NextResponse.json<ApiResponse<null>>(
            {
              success: false,
              error: "Falha ao validar autorização de configuração",
            },
            { status: 500 }
          );
        }
      }
      return handler(req, authResult);
    }
    if (authResult.isSysAdmin) {
      const { searchParams } = new URL(req.url);
      let familyId = searchParams.get("familyId");
      if (!familyId) {
        const url = new URL(req.url);
        const pathSegments = url.pathname.split("/").filter(Boolean);
        if (
          pathSegments.length > 0 &&
          !pathSegments[0].startsWith("api") &&
          !pathSegments[0].startsWith("family-manager") &&
          !pathSegments[0].startsWith("setup")
        ) {
          const familySlug = pathSegments[0];
          try {
            const family = await prisma.family.findUnique({
              where: { slug: familySlug },
            });
            if (family) {
              familyId = family.id;
            }
          } catch (error) {}
        }
      }
      if (!familyId) {
        const referer = req.headers.get("referer");
        if (referer) {
          try {
            const refererUrl = new URL(referer);
            const refererPathSegments = refererUrl.pathname
              .split("/")
              .filter(Boolean);
            if (
              refererPathSegments.length > 0 &&
              !refererPathSegments[0].startsWith("api") &&
              !refererPathSegments[0].startsWith("family-manager") &&
              !refererPathSegments[0].startsWith("setup")
            ) {
              const familySlug = refererPathSegments[0];
              const family = await prisma.family.findUnique({
                where: { slug: familySlug },
              });
              if (family) {
                familyId = family.id;
              }
            }
          } catch (error) {}
        }
      }
      const modifiedAuthResult = {
        ...authResult,
        familyId: familyId || authResult.familyId,
      };
      return handler(req, modifiedAuthResult);
    }
    return handler(req, authResult);
  };
}

export function invalidateToken(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as { exp?: number };
    if (decoded && decoded.exp) {
      const expiryMs = decoded.exp * 1000;
      tokenBlacklist.set(token, expiryMs);
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}
