import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import {
  ApiResponse,
  CaretakerCreate,
  CaretakerUpdate,
  CaretakerResponse,
} from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { formatForResponse } from "../utils/timezone";
import { checkWritePermission } from "../utils/writeProtection";

async function postHandler(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const {
      familyId: userFamilyId,
      caretakerRole,
      isSysAdmin,
      isSetupAuth,
      isAccountAuth,
    } = authContext;
    if (!userFamilyId && !isSysAdmin && !isSetupAuth && !isAccountAuth) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    if (
      !isSysAdmin &&
      !isSetupAuth &&
      !isAccountAuth &&
      caretakerRole !== "ADMIN"
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Somente administradores podem criar cuidadores.",
        },
        { status: 403 }
      );
    }
    const requestBody = await req.json();
    const { familyId: bodyFamilyId, ...caretakerData } = requestBody;
    const body: CaretakerCreate = caretakerData;
    let targetFamilyId = userFamilyId;
    if (isSysAdmin || isSetupAuth || isAccountAuth) {
      const { searchParams } = new URL(req.url);
      const queryFamilyId = searchParams.get("familyId");
      if (bodyFamilyId) {
        targetFamilyId = bodyFamilyId;
      } else if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      } else if (!userFamilyId) {
        const userType = isSysAdmin
          ? "Administradores do sistema"
          : isSetupAuth
          ? "Autenticação de configuração"
          : "Autenticação de conta";
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: `${userType} devem especificar o parâmetro familyId ou no corpo da requisição.`,
          },
          { status: 400 }
        );
      }
    }
    if (body.loginId === "00" || body.type === "System Administrator") {
      return NextResponse.json<ApiResponse<CaretakerResponse>>(
        {
          success: false,
          error: "Cuidador do sistema não pode ser criado por esta API.",
        },
        { status: 403 }
      );
    }
    const existingCaretaker = await prisma.caretaker.findFirst({
      where: {
        loginId: body.loginId,
        deletedAt: null,
        familyId: targetFamilyId,
      },
    });
    if (existingCaretaker) {
      return NextResponse.json<ApiResponse<CaretakerResponse>>(
        {
          success: false,
          error: "Login ID já está em uso nesta família. Escolha outro.",
        },
        { status: 400 }
      );
    }
    const caretaker = await prisma.caretaker.create({
      data: {
        ...body,
        familyId: targetFamilyId,
      },
    });
    if (targetFamilyId && caretaker.loginId !== "00") {
      await prisma.familyMember.create({
        data: {
          familyId: targetFamilyId,
          caretakerId: caretaker.id,
          role: caretaker.role === "ADMIN" ? "admin" : "member",
        },
      });
    }
    const response: CaretakerResponse = {
      ...caretaker,
      createdAt: formatForResponse(caretaker.createdAt) || "",
      updatedAt: formatForResponse(caretaker.updatedAt) || "",
      deletedAt: formatForResponse(caretaker.deletedAt),
    };
    return NextResponse.json<ApiResponse<CaretakerResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar cuidador:", error);
    return NextResponse.json<ApiResponse<CaretakerResponse>>(
      {
        success: false,
        error: "Falha ao criar cuidador",
      },
      { status: 500 }
    );
  }
}

async function putHandler(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const {
      familyId: userFamilyId,
      caretakerRole,
      isSysAdmin,
      isSetupAuth,
      isAccountAuth,
    } = authContext;
    if (!userFamilyId && !isSysAdmin && !isSetupAuth && !isAccountAuth) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    if (
      !isSysAdmin &&
      !isSetupAuth &&
      !isAccountAuth &&
      caretakerRole !== "ADMIN"
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Somente administradores podem atualizar cuidadores.",
        },
        { status: 403 }
      );
    }
    const requestBody = await req.json();
    const { familyId: bodyFamilyId, id, ...updateData } = requestBody;
    const body: CaretakerUpdate = { id, ...updateData };
    let targetFamilyId = userFamilyId;
    if (isSysAdmin || isSetupAuth || isAccountAuth) {
      const { searchParams } = new URL(req.url);
      const queryFamilyId = searchParams.get("familyId");
      if (bodyFamilyId) {
        targetFamilyId = bodyFamilyId;
      } else if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      } else if (!userFamilyId) {
        const userType = isSysAdmin
          ? "Administradores do sistema"
          : isSetupAuth
          ? "Autenticação de configuração"
          : "Autenticação de conta";
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: `${userType} devem especificar o parâmetro familyId ou no corpo da requisição.`,
          },
          { status: 400 }
        );
      }
    }
    const existingCaretaker = await prisma.caretaker.findFirst({
      where: {
        id,
        familyId: targetFamilyId,
      },
    });
    if (!existingCaretaker) {
      return NextResponse.json<ApiResponse<CaretakerResponse>>(
        {
          success: false,
          error: "Cuidador não encontrado ou acesso negado.",
        },
        { status: 404 }
      );
    }
    if (updateData.loginId) {
      const duplicateLoginId = await prisma.caretaker.findFirst({
        where: {
          loginId: updateData.loginId,
          id: { not: id },
          deletedAt: null,
          familyId: targetFamilyId,
        },
      });
      if (duplicateLoginId) {
        return NextResponse.json<ApiResponse<CaretakerResponse>>(
          {
            success: false,
            error: "Login ID já está em uso nesta família. Escolha outro.",
          },
          { status: 400 }
        );
      }
    }
    const caretaker = await prisma.caretaker.update({
      where: { id },
      data: {
        ...updateData,
        familyId: targetFamilyId,
      },
    });
    const response: CaretakerResponse = {
      ...caretaker,
      createdAt: formatForResponse(caretaker.createdAt) || "",
      updatedAt: formatForResponse(caretaker.updatedAt) || "",
      deletedAt: formatForResponse(caretaker.deletedAt),
    };
    return NextResponse.json<ApiResponse<CaretakerResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar cuidador:", error);
    return NextResponse.json<ApiResponse<CaretakerResponse>>(
      {
        success: false,
        error: "Falha ao atualizar cuidador",
      },
      { status: 500 }
    );
  }
}

async function deleteHandler(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const {
      familyId: userFamilyId,
      caretakerRole,
      isSysAdmin,
      isSetupAuth,
      isAccountAuth,
    } = authContext;
    if (!userFamilyId && !isSysAdmin && !isSetupAuth && !isAccountAuth) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    if (
      !isSysAdmin &&
      !isSetupAuth &&
      !isAccountAuth &&
      caretakerRole !== "ADMIN"
    ) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Somente administradores podem excluir cuidadores.",
        },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    let targetFamilyId = userFamilyId;
    if (isSysAdmin || isSetupAuth || isAccountAuth) {
      const queryFamilyId = searchParams.get("familyId");
      if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      } else if (!userFamilyId) {
        const userType = isSysAdmin
          ? "Administradores do sistema"
          : isSetupAuth
          ? "Autenticação de configuração"
          : "Autenticação de conta";
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: `${userType} devem especificar o parâmetro familyId.`,
          },
          { status: 400 }
        );
      }
    }
    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "ID do cuidador é obrigatório" },
        { status: 400 }
      );
    }
    const isSystemCaretaker = await prisma.caretaker.findFirst({
      where: {
        id,
        loginId: "00",
        familyId: targetFamilyId,
      },
    });
    if (isSystemCaretaker) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Cuidador do sistema não pode ser excluído.",
        },
        { status: 403 }
      );
    }
    const existingCaretaker = await prisma.caretaker.findFirst({
      where: { id, familyId: targetFamilyId },
    });
    if (!existingCaretaker) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Cuidador não encontrado ou acesso negado." },
        { status: 404 }
      );
    }
    await prisma.caretaker.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    if (existingCaretaker.loginId !== "00" && targetFamilyId) {
      await prisma.familyMember.deleteMany({
        where: {
          caretakerId: id,
          familyId: targetFamilyId,
        },
      });
    }
    return NextResponse.json<ApiResponse<null>>({ success: true, data: null });
  } catch (error) {
    console.error("Erro ao excluir cuidador:", error);
    return NextResponse.json<ApiResponse<null>>(
      { success: false, error: "Falha ao excluir cuidador" },
      { status: 500 }
    );
  }
}

async function getHandler(req: NextRequest, authContext: AuthResult) {
  try {
    const {
      familyId: userFamilyId,
      isAccountAuth,
      caretakerId,
      accountId,
      isSysAdmin,
      isSetupAuth,
    } = authContext;
    if (!userFamilyId && !isSysAdmin && !isSetupAuth && !isAccountAuth) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Usuário não está associado a uma família.",
        },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    let targetFamilyId = userFamilyId;
    if (isSysAdmin || isSetupAuth || isAccountAuth) {
      const queryFamilyId = searchParams.get("familyId");
      if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      } else if (!userFamilyId) {
        const userType = isSysAdmin
          ? "Administradores do sistema"
          : isSetupAuth
          ? "Autenticação de configuração"
          : "Autenticação de conta";
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: `${userType} devem especificar o parâmetro familyId.`,
          },
          { status: 400 }
        );
      }
    }
    if (!targetFamilyId && isAccountAuth) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error:
            "Configuração da conta incompleta. Por favor, complete a configuração da família.",
        },
        { status: 403 }
      );
    }
    if (id) {
      const caretaker = await prisma.caretaker.findFirst({
        where: {
          id,
          deletedAt: null,
          familyId: targetFamilyId,
        },
      });
      if (!caretaker) {
        return NextResponse.json<ApiResponse<CaretakerResponse>>(
          {
            success: false,
            error: "Cuidador não encontrado ou acesso negado.",
          },
          { status: 404 }
        );
      }
      const response: CaretakerResponse = {
        ...caretaker,
        createdAt: formatForResponse(caretaker.createdAt) || "",
        updatedAt: formatForResponse(caretaker.updatedAt) || "",
        deletedAt: formatForResponse(caretaker.deletedAt),
      };
      return NextResponse.json<ApiResponse<CaretakerResponse>>({
        success: true,
        data: response,
      });
    }
    const caretakers = await prisma.caretaker.findMany({
      where: {
        deletedAt: null,
        familyId: targetFamilyId,
        loginId: { not: "00" },
      },
      orderBy: {
        name: "asc",
      },
    });
    const response: CaretakerResponse[] = caretakers.map((caretaker) => ({
      ...caretaker,
      createdAt: formatForResponse(caretaker.createdAt) || "",
      updatedAt: formatForResponse(caretaker.updatedAt) || "",
      deletedAt: formatForResponse(caretaker.deletedAt),
    }));
    return NextResponse.json<ApiResponse<CaretakerResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar cuidadores:", error);
    return NextResponse.json<ApiResponse<CaretakerResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar cuidadores",
      },
      { status: 500 }
    );
  }
}

export const POST = withAuthContext(
  postHandler as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const GET = withAuthContext(
  getHandler as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const PUT = withAuthContext(
  putHandler as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const DELETE = withAuthContext(
  deleteHandler as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
