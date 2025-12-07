import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import {
  ApiResponse,
  MedicineCreate,
  MedicineResponse,
  MedicineUpdate,
} from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { formatForResponse } from "../utils/timezone";
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
    const body: MedicineCreate = await req.json();
    const { contactIds, ...medicineData } = body;
    const medicine = await prisma.medicine.create({
      data: {
        ...medicineData,
        familyId: userFamilyId,
      },
    });
    if (contactIds && contactIds.length > 0) {
      const uniqueContactIds = Array.from(new Set(contactIds));
      const contactMedicineData = uniqueContactIds.map((contactId) => ({
        contactId,
        medicineId: medicine.id,
      }));
      await prisma.contactMedicine.createMany({
        data: contactMedicineData,
      });
    }
    const medicineWithContacts = await prisma.medicine.findUnique({
      where: { id: medicine.id },
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
        unit: true,
      },
    });
    if (!medicineWithContacts) {
      throw new Error("Falha ao recuperar o medicamento criado");
    }
    const response: MedicineResponse = {
      ...medicineWithContacts,
      unitAbbr: medicineWithContacts.unit?.unitAbbr || null,
      createdAt: formatForResponse(medicineWithContacts.createdAt) || "",
      updatedAt: formatForResponse(medicineWithContacts.updatedAt) || "",
      deletedAt: formatForResponse(medicineWithContacts.deletedAt),
    };
    return NextResponse.json<ApiResponse<MedicineResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar medicamento:", error);
    return NextResponse.json<ApiResponse<MedicineResponse>>(
      {
        success: false,
        error: "Falha ao criar medicamento",
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
    const body: Partial<MedicineCreate> = await req.json();
    const { contactIds, ...updateData } = body;
    if (!id) {
      return NextResponse.json<ApiResponse<MedicineResponse>>(
        {
          success: false,
          error: "ID do medicamento é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingMedicine = await prisma.medicine.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingMedicine) {
      return NextResponse.json<ApiResponse<MedicineResponse>>(
        {
          success: false,
          error: "Medicamento não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    delete (updateData as any).familyId;
    delete (updateData as any).createdById;
    const medicine = await prisma.medicine.update({
      where: { id },
      data: updateData,
    });
    if (contactIds) {
      await prisma.contactMedicine.deleteMany({ where: { medicineId: id } });
      if (contactIds.length > 0) {
        const uniqueContactIds = Array.from(new Set(contactIds));
        const contactMedicineData = uniqueContactIds.map((contactId) => ({
          contactId,
          medicineId: id,
        }));
        await prisma.contactMedicine.createMany({
          data: contactMedicineData,
        });
      }
    }
    const medicineWithContacts = await prisma.medicine.findUnique({
      where: { id },
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
        unit: true,
      },
    });
    if (!medicineWithContacts) {
      throw new Error("Falha ao recuperar o medicamento atualizado");
    }
    const response: MedicineResponse = {
      ...medicineWithContacts,
      unitAbbr: medicineWithContacts.unit?.unitAbbr || null,
      createdAt: formatForResponse(medicineWithContacts.createdAt) || "",
      updatedAt: formatForResponse(medicineWithContacts.updatedAt) || "",
      deletedAt: formatForResponse(medicineWithContacts.deletedAt),
    };
    return NextResponse.json<ApiResponse<MedicineResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar medicamento:", error);
    return NextResponse.json<ApiResponse<MedicineResponse>>(
      {
        success: false,
        error: "Falha ao atualizar medicamento",
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
    const active = searchParams.get("active");
    const contactId = searchParams.get("contactId");
    const where: any = {
      deletedAt: null,
      familyId: userFamilyId,
    };
    if (id) {
      where.id = id;
    }
    if (active !== null) {
      where.active = active === "true";
    }
    if (id) {
      const medicine = await prisma.medicine.findFirst({
        where,
        include: {
          contacts: {
            include: {
              contact: true,
            },
          },
          unit: true,
        },
      });
      if (!medicine) {
        return NextResponse.json<ApiResponse<MedicineResponse>>(
          {
            success: false,
            error: "Medicamento não encontrado ou acesso negado",
          },
          { status: 404 }
        );
      }
      const response: MedicineResponse = {
        ...medicine,
        unitAbbr: medicine.unit?.unitAbbr || null,
        createdAt: formatForResponse(medicine.createdAt) || "",
        updatedAt: formatForResponse(medicine.updatedAt) || "",
        deletedAt: formatForResponse(medicine.deletedAt),
      };
      return NextResponse.json<ApiResponse<MedicineResponse>>({
        success: true,
        data: response,
      });
    }
    if (contactId) {
      const medicinesForContact = await prisma.contactMedicine.findMany({
        where: {
          contactId,
          medicine: {
            deletedAt: null,
            ...(active !== null ? { active: active === "true" } : {}),
            ...(userFamilyId && { familyId: userFamilyId }),
          },
        },
        include: {
          medicine: {
            include: {
              unit: true,
            },
          },
        },
      });
      const medicines = medicinesForContact.map((cm) => cm.medicine);
      const response = medicines.map((medicine) => ({
        ...medicine,
        unitAbbr: medicine.unit?.unitAbbr || null,
        createdAt: formatForResponse(medicine.createdAt) || "",
        updatedAt: formatForResponse(medicine.updatedAt) || "",
        deletedAt: formatForResponse(medicine.deletedAt),
      }));
      return NextResponse.json<ApiResponse<MedicineResponse[]>>({
        success: true,
        data: response,
      });
    }
    const medicines = await prisma.medicine.findMany({
      where,
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
        unit: true,
      },
      orderBy: { name: "asc" },
    });
    const response = medicines.map((medicine) => ({
      ...medicine,
      unitAbbr: medicine.unit?.unitAbbr || null,
      createdAt: formatForResponse(medicine.createdAt) || "",
      updatedAt: formatForResponse(medicine.updatedAt) || "",
      deletedAt: formatForResponse(medicine.deletedAt),
    }));
    return NextResponse.json<ApiResponse<MedicineResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar medicamentos:", error);
    return NextResponse.json<ApiResponse<MedicineResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar medicamentos",
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
          error: "ID do medicamento é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingMedicine = await prisma.medicine.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingMedicine) {
      return NextResponse.json<ApiResponse<void>>(
        {
          success: false,
          error: "Medicamento não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.medicine.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json<ApiResponse>({
      success: true,
    });
  } catch (error) {
    console.error("Erro ao deletar medicamento:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Falha ao deletar medicamento",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet as any);
export const POST = withAuthContext(handlePost as any);
export const PUT = withAuthContext(handlePut as any);
export const DELETE = withAuthContext(handleDelete as any);
