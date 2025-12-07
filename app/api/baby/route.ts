import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, BabyCreate, BabyUpdate, BabyResponse } from "../types";
import { Gender } from "@prisma/client";
import { toUTC, formatForResponse } from "../utils/timezone";
import { withAuthContext, AuthResult } from "../utils/auth";
import { checkWritePermission } from "../utils/writeProtection";

async function handlePost(req: NextRequest, authContext: AuthResult) {
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
    const requestBody = await req.json();
    const { familyId: bodyFamilyId, ...babyData } = requestBody;
    const body: BabyCreate = babyData;
    let targetFamilyId = userFamilyId;
    if (
      !userFamilyId &&
      (isSetupAuth || isSysAdmin || isAccountAuth) &&
      bodyFamilyId
    ) {
      targetFamilyId = bodyFamilyId;
    }
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const baby = await prisma.baby.create({
      data: {
        ...body,
        birthDate: toUTC(body.birthDate),
        familyId: targetFamilyId,
      },
    });
    const response: BabyResponse = {
      ...baby,
      birthDate: formatForResponse(baby.birthDate) || "",
      createdAt: formatForResponse(baby.createdAt) || "",
      updatedAt: formatForResponse(baby.updatedAt) || "",
      deletedAt: formatForResponse(baby.deletedAt),
    };
    return NextResponse.json<ApiResponse<BabyResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar bebê:", error);
    return NextResponse.json<ApiResponse<BabyResponse>>(
      {
        success: false,
        error: "Falha ao criar bebê",
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
    const { familyId: userFamilyId, isSysAdmin } = authContext;
    const requestBody = await req.json();
    const { id, familyId: bodyFamilyId, ...updateData } = requestBody;
    const body: BabyUpdate = { id, ...updateData };
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && isSysAdmin && bodyFamilyId) {
      targetFamilyId = bodyFamilyId;
    }
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const existingBaby = await prisma.baby.findFirst({
      where: { id, familyId: targetFamilyId },
    });
    if (!existingBaby) {
      return NextResponse.json<ApiResponse<BabyResponse>>(
        {
          success: false,
          error: "Bebê não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    const baby = await prisma.baby.update({
      where: { id },
      data: {
        ...updateData,
        birthDate: updateData.birthDate
          ? toUTC(updateData.birthDate)
          : existingBaby.birthDate,
      },
    });
    const response: BabyResponse = {
      ...baby,
      birthDate: formatForResponse(baby.birthDate) || "",
      createdAt: formatForResponse(baby.createdAt) || "",
      updatedAt: formatForResponse(baby.updatedAt) || "",
      deletedAt: formatForResponse(baby.deletedAt),
    };
    return NextResponse.json<ApiResponse<BabyResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar bebê:", error);
    return NextResponse.json<ApiResponse<BabyResponse>>(
      {
        success: false,
        error: "Falha ao atualizar bebê",
      },
      { status: 500 }
    );
  }
}

async function handleDelete(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }

  try {
    const { familyId: userFamilyId, isSysAdmin } = authContext;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const familyId = searchParams.get("familyId");
    if (!id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "ID do bebê é obrigatório",
        },
        { status: 400 }
      );
    }
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && isSysAdmin && familyId) {
      targetFamilyId = familyId;
    }
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const existingBaby = await prisma.baby.findFirst({
      where: { id, familyId: targetFamilyId },
    });
    if (!existingBaby) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Bebê não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.baby.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json<ApiResponse>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao excluir bebê:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Falha ao excluir bebê",
      },
      { status: 500 }
    );
  }
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId, isSysAdmin } = authContext;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const familyId = searchParams.get("familyId");
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && isSysAdmin && familyId) {
      targetFamilyId = familyId;
    }
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    if (id) {
      const baby = await prisma.baby.findFirst({
        where: {
          id,
          deletedAt: null,
          familyId: targetFamilyId,
        },
      });
      if (!baby) {
        return NextResponse.json<ApiResponse<BabyResponse>>(
          {
            success: false,
            error: "Bebê não encontrado",
          },
          { status: 404 }
        );
      }
      const response: BabyResponse = {
        ...baby,
        birthDate: formatForResponse(baby.birthDate) || "",
        createdAt: formatForResponse(baby.createdAt) || "",
        updatedAt: formatForResponse(baby.updatedAt) || "",
        deletedAt: formatForResponse(baby.deletedAt),
      };
      return NextResponse.json<ApiResponse<BabyResponse>>({
        success: true,
        data: response,
      });
    }
    const babies = await prisma.baby.findMany({
      where: {
        deletedAt: null,
        familyId: targetFamilyId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const response: BabyResponse[] = babies.map((baby) => ({
      ...baby,
      birthDate: formatForResponse(baby.birthDate) || "",
      createdAt: formatForResponse(baby.createdAt) || "",
      updatedAt: formatForResponse(baby.updatedAt) || "",
      deletedAt: formatForResponse(baby.deletedAt),
    }));
    return NextResponse.json<ApiResponse<BabyResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar bebês:", error);
    return NextResponse.json<ApiResponse<BabyResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar bebês",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(
  handleGet as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const POST = withAuthContext(
  handlePost as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const PUT = withAuthContext(
  handlePut as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const DELETE = withAuthContext(
  handleDelete as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
