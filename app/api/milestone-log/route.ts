import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, MilestoneCreate, MilestoneResponse } from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { toUTC, formatForResponse } from "../utils/timezone";
import { checkWritePermission } from "../utils/writeProtection";

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId: userFamilyId, caretakerId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const body: MilestoneCreate = await req.json();
    const baby = await prisma.baby.findFirst({
      where: { id: body.babyId, familyId: userFamilyId },
    });
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Bebê não encontrado nesta família." },
        { status: 404 }
      );
    }
    const dateUTC = toUTC(body.date);
    const milestone = await prisma.milestone.create({
      data: {
        ...body,
        date: dateUTC,
        caretakerId: caretakerId,
        familyId: userFamilyId,
      },
    });
    const response: MilestoneResponse = {
      ...milestone,
      date: formatForResponse(milestone.date) || "",
      createdAt: formatForResponse(milestone.createdAt) || "",
      updatedAt: formatForResponse(milestone.updatedAt) || "",
      deletedAt: formatForResponse(milestone.deletedAt),
    };
    return NextResponse.json<ApiResponse<MilestoneResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar marco:", error);
    return NextResponse.json<ApiResponse<MilestoneResponse>>(
      {
        success: false,
        error: "Falha ao criar marco",
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
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body: Partial<MilestoneCreate> = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<MilestoneResponse>>(
        {
          success: false,
          error: "ID do marco é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id,
        familyId: userFamilyId,
      },
    });
    if (!existingMilestone) {
      return NextResponse.json<ApiResponse<MilestoneResponse>>(
        {
          success: false,
          error: "Marco não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    const data = body.date ? { ...body, date: toUTC(body.date) } : body;
    const milestone = await prisma.milestone.update({
      where: {
        id,
      },
      data,
    });
    const response: MilestoneResponse = {
      ...milestone,
      date: formatForResponse(milestone.date) || "",
      createdAt: formatForResponse(milestone.createdAt) || "",
      updatedAt: formatForResponse(milestone.updatedAt) || "",
      deletedAt: formatForResponse(milestone.deletedAt),
    };
    return NextResponse.json<ApiResponse<MilestoneResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar marco:", error);
    return NextResponse.json<ApiResponse<MilestoneResponse>>(
      {
        success: false,
        error: "Falha ao atualizar marco",
      },
      { status: 500 }
    );
  }
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const babyId = searchParams.get("babyId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const queryParams: any = {
      familyId: userFamilyId,
      ...(babyId && { babyId }),
      ...(category && { category }),
      ...(startDate &&
        endDate && {
          date: {
            gte: toUTC(startDate),
            lte: toUTC(endDate),
          },
        }),
    };
    if (id) {
      const milestone = await prisma.milestone.findFirst({
        where: {
          id,
          familyId: userFamilyId,
        },
      });
      if (!milestone) {
        return NextResponse.json<ApiResponse<MilestoneResponse>>(
          {
            success: false,
            error: "Marco não encontrado ou acesso negado",
          },
          { status: 404 }
        );
      }
      const response: MilestoneResponse = {
        ...milestone,
        date: formatForResponse(milestone.date) || "",
        createdAt: formatForResponse(milestone.createdAt) || "",
        updatedAt: formatForResponse(milestone.updatedAt) || "",
        deletedAt: formatForResponse(milestone.deletedAt),
      };
      return NextResponse.json<ApiResponse<MilestoneResponse>>({
        success: true,
        data: response,
      });
    }
    const milestones = await prisma.milestone.findMany({
      where: queryParams,
      orderBy: {
        date: "desc",
      },
      include: {
        baby: {
          select: {
            firstName: true,
            lastName: true,
            inactive: true,
          },
        },
        caretaker: {
          select: {
            name: true,
            type: true,
            inactive: true,
          },
        },
      },
    });
    const response = milestones.map((milestone) => {
      const { baby, caretaker, ...milestoneData } = milestone;
      return {
        ...milestoneData,
        date: formatForResponse(milestone.date) || "",
        createdAt: formatForResponse(milestone.createdAt) || "",
        updatedAt: formatForResponse(milestone.updatedAt) || "",
        deletedAt: formatForResponse(milestone.deletedAt),
      } as MilestoneResponse;
    });
    return NextResponse.json<ApiResponse<MilestoneResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar marcos:", error);
    return NextResponse.json<ApiResponse<MilestoneResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar marcos",
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
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "ID do marco é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingMilestone = await prisma.milestone.findFirst({
      where: {
        id,
        familyId: userFamilyId,
      },
    });
    if (!existingMilestone) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Marco não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.milestone.delete({
      where: { id },
    });
    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar marco:", error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: "Falha ao deletar marco",
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
