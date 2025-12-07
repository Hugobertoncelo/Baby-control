import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, MedicineLogCreate, MedicineLogResponse } from "../types";
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
    const body: MedicineLogCreate = await req.json();
    const [baby, medicine] = await Promise.all([
      prisma.baby.findFirst({
        where: { id: body.babyId, familyId: userFamilyId },
      }),
      prisma.medicine.findFirst({
        where: { id: body.medicineId, familyId: userFamilyId },
      }),
    ]);
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Bebê não encontrado nesta família." },
        { status: 404 }
      );
    }
    if (!medicine) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Medicamento não encontrado nesta família." },
        { status: 404 }
      );
    }
    const timeUTC = toUTC(body.time);
    const medicineLog = await prisma.medicineLog.create({
      data: {
        ...body,
        time: timeUTC,
        caretakerId: caretakerId,
        familyId: userFamilyId,
      },
    });
    const response: MedicineLogResponse = {
      ...medicineLog,
      time: formatForResponse(medicineLog.time) || "",
      createdAt: formatForResponse(medicineLog.createdAt) || "",
      updatedAt: formatForResponse(medicineLog.updatedAt) || "",
      deletedAt: formatForResponse(medicineLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<MedicineLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar registro de medicamento:", error);
    return NextResponse.json<ApiResponse<MedicineLogResponse>>(
      {
        success: false,
        error: "Falha ao criar registro de medicamento",
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
    const body: Partial<MedicineLogCreate> = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<MedicineLogResponse>>(
        {
          success: false,
          error: "ID do registro de medicamento é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingLog = await prisma.medicineLog.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingLog) {
      return NextResponse.json<ApiResponse<MedicineLogResponse>>(
        {
          success: false,
          error: "Registro de medicamento não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    const data: any = { ...body };
    if (body.time) {
      data.time = toUTC(body.time);
    }
    delete data.familyId;
    delete data.babyId;
    delete data.medicineId;
    delete data.caretakerId;
    const medicineLog = await prisma.medicineLog.update({
      where: { id },
      data,
    });
    const response: MedicineLogResponse = {
      ...medicineLog,
      time: formatForResponse(medicineLog.time) || "",
      createdAt: formatForResponse(medicineLog.createdAt) || "",
      updatedAt: formatForResponse(medicineLog.updatedAt) || "",
      deletedAt: formatForResponse(medicineLog.deletedAt),
    };
    return NextResponse.json<ApiResponse<MedicineLogResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar registro de medicamento:", error);
    return NextResponse.json<ApiResponse<MedicineLogResponse>>(
      {
        success: false,
        error: "Falha ao atualizar registro de medicamento",
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
    const medicineId = searchParams.get("medicineId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit") || "10", 10)
      : undefined;
    const where: any = {
      familyId: userFamilyId,
      ...(babyId && { babyId }),
      ...(medicineId && { medicineId }),
      ...(startDate &&
        endDate && {
          time: {
            gte: toUTC(startDate),
            lte: toUTC(endDate),
          },
        }),
    };
    if (id) {
      const medicineLog = await prisma.medicineLog.findFirst({
        where: {
          id,
          ...where,
        },
        include: {
          medicine: {
            include: {
              contacts: {
                include: {
                  contact: true,
                },
              },
            },
          },
          baby: true,
          caretaker: true,
          unit: true,
        },
      });
      if (!medicineLog) {
        return NextResponse.json<ApiResponse<MedicineLogResponse>>(
          {
            success: false,
            error: "Registro de medicamento não encontrado ou acesso negado",
          },
          { status: 404 }
        );
      }
      const response: MedicineLogResponse = {
        ...medicineLog,
        time: formatForResponse(medicineLog.time) || "",
        createdAt: formatForResponse(medicineLog.createdAt) || "",
        updatedAt: formatForResponse(medicineLog.updatedAt) || "",
        deletedAt: formatForResponse(medicineLog.deletedAt),
      };
      return NextResponse.json<ApiResponse<MedicineLogResponse>>({
        success: true,
        data: response,
      });
    }
    const medicineLogs = await prisma.medicineLog.findMany({
      where,
      include: {
        medicine: {
          include: {
            contacts: {
              include: {
                contact: true,
              },
            },
          },
        },
        baby: true,
        caretaker: true,
        unit: true,
      },
      orderBy: { time: "desc" },
      take: limit,
    });
    const response = medicineLogs.map((log) => ({
      ...log,
      time: formatForResponse(log.time) || "",
      createdAt: formatForResponse(log.createdAt) || "",
      updatedAt: formatForResponse(log.updatedAt) || "",
      deletedAt: formatForResponse(log.deletedAt),
    }));
    return NextResponse.json<ApiResponse<MedicineLogResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar registros de medicamento:", error);
    return NextResponse.json<ApiResponse<MedicineLogResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar registros de medicamento",
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
          error: "ID do registro de medicamento é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingLog = await prisma.medicineLog.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingLog) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Registro de medicamento não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.medicineLog.delete({
      where: { id },
    });
    return NextResponse.json<ApiResponse>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar registro de medicamento:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Falha ao deletar registro de medicamento",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet as any);
export const POST = withAuthContext(handlePost as any);
export const PUT = withAuthContext(handlePut as any);
export const DELETE = withAuthContext(handleDelete as any);
