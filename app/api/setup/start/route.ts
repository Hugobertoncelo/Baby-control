import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import {
  ApiResponse,
  withAdminAuth,
  getAuthenticatedUser,
  AuthResult,
} from "@/app/api/utils/auth";
import { Family } from "@prisma/client";

interface SetupStartRequest {
  name: string;
  slug: string;
  token?: string;
  isNewFamily?: boolean;
}

async function handler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<Family>>> {
  const {
    name,
    slug,
    token,
    isNewFamily = false,
  } = (await req.json()) as SetupStartRequest;

  if (!name || !slug) {
    return NextResponse.json(
      { success: false, error: "Nome da família e slug são obrigatórios" },
      { status: 400 }
    );
  }

  const authResult = await getAuthenticatedUser(req);

  if (!authResult.authenticated) {
    return NextResponse.json(
      { success: false, error: "Autenticação necessária" },
      { status: 401 }
    );
  }

  let setupTokenData = null;
  if (token) {
    if (authResult.isSetupAuth && authResult.setupToken === token) {
      setupTokenData = await prisma.familySetup.findUnique({
        where: { token },
      });
      if (
        !setupTokenData ||
        setupTokenData.expiresAt < new Date() ||
        setupTokenData.familyId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Token de configuração inválido ou expirado",
          },
          { status: 403 }
        );
      }
    } else if (!authResult.isSysAdmin && authResult.caretakerRole !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Autenticação de token de configuração inválida",
        },
        { status: 403 }
      );
    } else {
      setupTokenData = await prisma.familySetup.findUnique({
        where: { token },
      });
      if (
        !setupTokenData ||
        setupTokenData.expiresAt < new Date() ||
        setupTokenData.familyId
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Token de configuração inválido ou expirado",
          },
          { status: 403 }
        );
      }
    }
  }

  try {
    if (token && setupTokenData) {
      const existingFamily = await prisma.family.findUnique({
        where: { slug },
      });
      if (existingFamily) {
        return NextResponse.json(
          { success: false, error: "Esse URL já está em uso" },
          { status: 409 }
        );
      }
      const updatedFamily = await prisma.$transaction(async (tx) => {
        const family = await tx.family.create({
          data: { name, slug, isActive: true },
        });
        await tx.settings.create({
          data: { familyId: family.id, familyName: name },
        });
        await tx.caretaker.create({
          data: {
            loginId: "00",
            name: "system",
            type: "System Administrator",
            role: "ADMIN",
            securityPin: "111222",
            familyId: family.id,
            inactive: false,
          },
        });
        await tx.familySetup.update({
          where: { token },
          data: { familyId: family.id },
        });
        return family;
      });
      return NextResponse.json({ success: true, data: updatedFamily });
    } else if (authResult.isAccountAuth && authResult.accountId) {
      const existingFamily = await prisma.family.findUnique({
        where: { slug },
      });
      if (existingFamily) {
        return NextResponse.json(
          { success: false, error: "Esse URL já está em uso" },
          { status: 409 }
        );
      }
      const existingAccountFamily = await prisma.family.findFirst({
        where: { accountId: authResult.accountId },
      });
      if (existingAccountFamily) {
        return NextResponse.json(
          { success: false, error: "A conta já possui uma família" },
          { status: 409 }
        );
      }
      const family = await prisma.$transaction(async (tx) => {
        const newFamily = await tx.family.create({
          data: { name, slug, isActive: true, accountId: authResult.accountId },
        });
        await tx.settings.create({
          data: {
            familyId: newFamily.id,
            familyName: name,
            securityPin: "111222",
            defaultBottleUnit: "OZ",
            defaultSolidsUnit: "TBSP",
            defaultHeightUnit: "IN",
            defaultWeightUnit: "LB",
            defaultTempUnit: "F",
            activitySettings: JSON.stringify({
              global: {
                order: [
                  "sleep",
                  "feed",
                  "diaper",
                  "note",
                  "bath",
                  "pump",
                  "measurement",
                  "milestone",
                  "medicine",
                ],
                visible: [
                  "sleep",
                  "feed",
                  "diaper",
                  "note",
                  "bath",
                  "pump",
                  "measurement",
                  "milestone",
                  "medicine",
                ],
              },
            }),
          },
        });
        await tx.caretaker.create({
          data: {
            loginId: "00",
            name: "system",
            type: "System Administrator",
            role: "ADMIN",
            securityPin: "111222",
            familyId: newFamily.id,
            inactive: false,
          },
        });
        const accountUpdateData: any = { familyId: newFamily.id };
        const deploymentMode = process.env.DEPLOYMENT_MODE;
        const isSaasMode = deploymentMode === "saas";
        if (isSaasMode) {
          const currentAccount = await tx.account.findUnique({
            where: { id: authResult.accountId },
            select: { betaparticipant: true, trialEnds: true, planType: true },
          });
          if (
            currentAccount &&
            !currentAccount.betaparticipant &&
            !currentAccount.trialEnds &&
            !currentAccount.planType
          ) {
            const trialEndDate = new Date();
            trialEndDate.setDate(trialEndDate.getDate() + 14);
            trialEndDate.setHours(23, 59, 59, 999);
            accountUpdateData.trialEnds = trialEndDate;
          }
        }
        await tx.account.update({
          where: { id: authResult.accountId },
          data: accountUpdateData,
        });
        return newFamily;
      });
      return NextResponse.json({ success: true, data: family });
    } else if (authResult.isSysAdmin || authResult.caretakerRole === "ADMIN") {
      const existingFamily = await prisma.family.findUnique({
        where: { slug },
      });
      if (existingFamily) {
        return NextResponse.json(
          { success: false, error: "Esse URL já está em uso" },
          { status: 409 }
        );
      }
      const updatedFamily = await prisma.$transaction(async (tx) => {
        let family;
        if (isNewFamily) {
          family = await tx.family.create({
            data: { name, slug, isActive: true },
          });
          await tx.settings.create({
            data: { familyId: family.id, familyName: name },
          });
          await tx.caretaker.create({
            data: {
              loginId: "00",
              name: "system",
              type: "System Administrator",
              role: "ADMIN",
              securityPin: "111222",
              familyId: family.id,
              inactive: false,
            },
          });
        } else {
          const families = await tx.family.findMany();
          if (families.length === 1 && families[0].slug === "my-family") {
            family = await tx.family.update({
              where: { id: families[0].id },
              data: { name, slug, isActive: true },
            });
            await tx.settings.updateMany({
              where: { familyId: family.id },
              data: { familyName: name },
            });
          } else {
            family = await tx.family.create({
              data: { name, slug, isActive: true },
            });
            await tx.settings.create({
              data: { familyId: family.id, familyName: name },
            });
            await tx.caretaker.create({
              data: {
                loginId: "00",
                name: "system",
                type: "System Administrator",
                role: "ADMIN",
                securityPin: "111222",
                familyId: family.id,
                inactive: false,
              },
            });
          }
        }
        return family;
      });
      return NextResponse.json({ success: true, data: updatedFamily });
    }
    return NextResponse.json(
      { success: false, error: "Autenticação necessária" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erro ao iniciar configuração" },
      { status: 500 }
    );
  }
}

async function authWrapper(
  req: NextRequest
): Promise<NextResponse<ApiResponse<Family>>> {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult.authenticated) {
    return NextResponse.json(
      { success: false, error: "Autenticação necessária" },
      { status: 401 }
    );
  }
  if (
    authResult.isSysAdmin ||
    authResult.caretakerRole === "ADMIN" ||
    authResult.isSetupAuth ||
    authResult.isAccountAuth
  ) {
    return handler(req);
  }
  return NextResponse.json(
    { success: false, error: "Permissões insuficientes" },
    { status: 403 }
  );
}

export const POST = authWrapper;
