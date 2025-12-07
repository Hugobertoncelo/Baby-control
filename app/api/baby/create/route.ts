import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { z } from "zod";
import { ApiResponse, getAuthenticatedUser } from "@/app/api/utils/auth";
import { checkWritePermission } from "@/app/api/utils/writeProtection";
import { Baby, Gender } from "@prisma/client";

const CreateBabySchema = z.object({
  familyId: z.string(),
  firstName: z.string().min(1, "O nome é obrigatório"),
  lastName: z.string().min(1, "O sobrenome é obrigatório"),
  birthDate: z.string().datetime(),
  gender: z.nativeEnum(Gender),
  feedWarningTime: z
    .string()
    .regex(/^[0-9]{2}:[0-9]{2}$/, "Formato de hora inválido"),
  diaperWarningTime: z
    .string()
    .regex(/^[0-9]{2}:[0-9]{2}$/, "Formato de hora inválido"),
});

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<Baby>>> {
  const authContext = await getAuthenticatedUser(req);
  if (!authContext.authenticated) {
    return NextResponse.json(
      { success: false, error: "Autenticação obrigatória" },
      { status: 401 }
    );
  }

  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }

  try {
    const body = await req.json();
    const validation = CreateBabySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Entrada inválida",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { familyId, ...babyData } = validation.data;

    const family = await prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      return NextResponse.json(
        { success: false, error: "Família não encontrada" },
        { status: 404 }
      );
    }

    const newBaby = await prisma.baby.create({
      data: {
        ...babyData,
        birthDate: new Date(babyData.birthDate),
        family: {
          connect: { id: familyId },
        },
      },
    });

    return NextResponse.json({ success: true, data: newBaby }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar bebê:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Falha na validação", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Erro ao criar bebê" },
      { status: 500 }
    );
  }
}
