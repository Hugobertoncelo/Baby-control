import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, MeasurementCreate, MeasurementResponse } from "../types";
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
    const body: MeasurementCreate = await req.json();
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
    const measurement = await prisma.measurement.create({
      data: {
        ...body,
        date: dateUTC,
        caretakerId: caretakerId,
        familyId: userFamilyId,
      },
    });
    const response: MeasurementResponse = {
      ...measurement,
      date: formatForResponse(measurement.date) || "",
      createdAt: formatForResponse(measurement.createdAt) || "",
      updatedAt: formatForResponse(measurement.updatedAt) || "",
      deletedAt: formatForResponse(measurement.deletedAt),
    };
    return NextResponse.json<ApiResponse<MeasurementResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar medição:", error);
    return NextResponse.json<ApiResponse<MeasurementResponse>>(
      {
        success: false,
        error: "Falha ao criar medição",
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
    const body: Partial<MeasurementCreate> = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<MeasurementResponse>>(
        {
          success: false,
          error: "ID da medição é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingMeasurement = await prisma.measurement.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingMeasurement) {
      return NextResponse.json<ApiResponse<MeasurementResponse>>(
        {
          success: false,
          error: "Medição não encontrada ou acesso negado",
        },
        { status: 404 }
      );
    }
    const updateData: any = { ...body };
    if (body.date) {
      updateData.date = toUTC(body.date);
    }
    delete updateData.familyId;
    const measurement = await prisma.measurement.update({
      where: { id },
      data: updateData,
    });
    const response: MeasurementResponse = {
      ...measurement,
      date: formatForResponse(measurement.date) || "",
      createdAt: formatForResponse(measurement.createdAt) || "",
      updatedAt: formatForResponse(measurement.updatedAt) || "",
      deletedAt: formatForResponse(measurement.deletedAt),
    };
    return NextResponse.json<ApiResponse<MeasurementResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar medição:", error);
    return NextResponse.json<ApiResponse<MeasurementResponse>>(
      {
        success: false,
        error: "Falha ao atualizar medição",
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
    const type = searchParams.get("type");
    if (id) {
      const measurement = await prisma.measurement.findFirst({
        where: {
          id,
          familyId: userFamilyId,
        },
      });
      if (!measurement) {
        return NextResponse.json<ApiResponse<MeasurementResponse>>(
          {
            success: false,
            error: "Medição não encontrada ou acesso negado",
          },
          { status: 404 }
        );
      }
      const response: MeasurementResponse = {
        ...measurement,
        date: formatForResponse(measurement.date) || "",
        createdAt: formatForResponse(measurement.createdAt) || "",
        updatedAt: formatForResponse(measurement.updatedAt) || "",
        deletedAt: formatForResponse(measurement.deletedAt),
      };
      return NextResponse.json<ApiResponse<MeasurementResponse>>({
        success: true,
        data: response,
      });
    }
    const queryParams: any = {
      familyId: userFamilyId,
      ...(babyId && { babyId }),
      ...(type && { type }),
      ...(startDate &&
        endDate && {
          date: {
            gte: toUTC(startDate),
            lte: toUTC(endDate),
          },
        }),
    };
    const measurements = await prisma.measurement.findMany({
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
    const response = measurements.map((measurement) => {
      const { baby, caretaker, ...measurementData } = measurement;
      return {
        ...measurementData,
        date: formatForResponse(measurement.date) || "",
        createdAt: formatForResponse(measurement.createdAt) || "",
        updatedAt: formatForResponse(measurement.updatedAt) || "",
        deletedAt: formatForResponse(measurement.deletedAt),
      } as MeasurementResponse;
    });
    return NextResponse.json<ApiResponse<MeasurementResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar medições:", error);
    return NextResponse.json<ApiResponse<MeasurementResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar medições",
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
          error: "ID da medição é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingMeasurement = await prisma.measurement.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingMeasurement) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Medição não encontrada ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.measurement.delete({
      where: { id },
    });
    return NextResponse.json<ApiResponse<void>>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar medição:", error);
    return NextResponse.json<ApiResponse<void>>(
      {
        success: false,
        error: "Falha ao deletar medição",
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
