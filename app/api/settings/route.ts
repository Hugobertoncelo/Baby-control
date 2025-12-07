import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse } from "../types";
import { Settings } from "@prisma/client";
import { withAuthContext, AuthResult } from "../utils/auth";
import { checkWritePermission } from "../utils/writeProtection";

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const {
      familyId: userFamilyId,
      isSetupAuth,
      isSysAdmin,
      isAccountAuth,
    } = authContext;
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && (isSetupAuth || isSysAdmin || isAccountAuth)) {
      const { searchParams } = new URL(req.url);
      const queryFamilyId = searchParams.get("familyId");
      if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      }
    }
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    let settings = await prisma.settings.findFirst({
      where: { familyId: targetFamilyId },
    });
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          familyName: "Minha Família",
          defaultBottleUnit: "OZ",
          defaultSolidsUnit: "TBSP",
          defaultHeightUnit: "IN",
          defaultWeightUnit: "LB",
          defaultTempUnit: "F",
          familyId: targetFamilyId,
        },
      });
    }
    return NextResponse.json<ApiResponse<Settings>>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json<ApiResponse<Settings>>(
      {
        success: false,
        error: "Falha ao buscar configurações",
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const {
      familyId: userFamilyId,
      isSetupAuth,
      isSysAdmin,
      isAccountAuth,
    } = authContext;
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && (isSetupAuth || isSysAdmin || isAccountAuth)) {
      const { searchParams } = new URL(req.url);
      const queryFamilyId = searchParams.get("familyId");
      if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      }
    }
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const body = await req.json();
    let existingSettings = await prisma.settings.findFirst({
      where: { familyId: targetFamilyId },
    });
    if (!existingSettings) {
      return NextResponse.json<ApiResponse<Settings>>(
        {
          success: false,
          error: "Configurações não encontradas para esta família.",
        },
        { status: 404 }
      );
    }
    const data: Partial<Settings> = {};
    const allowedFields: (keyof Settings)[] = [
      "familyName",
      "securityPin",
      "authType",
      "defaultBottleUnit",
      "defaultSolidsUnit",
      "defaultHeightUnit",
      "defaultWeightUnit",
      "defaultTempUnit",
      "enableDebugTimer",
      "enableDebugTimezone",
    ];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        (data as any)[field] = body[field];
      }
    }
    const settings = await prisma.settings.update({
      where: { id: existingSettings.id },
      data,
    });
    if (body.securityPin !== undefined) {
      try {
        const systemCaretaker = await prisma.caretaker.findFirst({
          where: {
            loginId: "00",
            familyId: targetFamilyId,
          },
        });
        if (systemCaretaker) {
          await prisma.caretaker.update({
            where: { id: systemCaretaker.id },
            data: { securityPin: body.securityPin },
          });
        }
      } catch (error) {
        console.error(
          "Erro ao atualizar o PIN do responsável do sistema (não fatal):",
          error
        );
      }
    }
    return NextResponse.json<ApiResponse<Settings>>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json<ApiResponse<Settings>>(
      {
        success: false,
        error: "Falha ao atualizar configurações",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet);
export const PUT = withAuthContext(handlePut);
