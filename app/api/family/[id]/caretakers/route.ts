import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../db";
import { ApiResponse, CaretakerResponse } from "../../../types";
import { formatForResponse } from "../../../utils/timezone";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CaretakerResponse[]>>> {
  try {
    const { id: familyId } = await params;
    if (!familyId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID da família é obrigatório",
        },
        { status: 400 }
      );
    }
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    });
    if (!family) {
      return NextResponse.json(
        {
          success: false,
          error: "Família não encontrada",
        },
        { status: 404 }
      );
    }
    const caretakers = await prisma.caretaker.findMany({
      where: {
        familyId: familyId,
        deletedAt: null,
      },
      orderBy: [{ loginId: "asc" }],
    });
    const caretakerResponses: CaretakerResponse[] = caretakers.map(
      (caretaker) => ({
        ...caretaker,
        createdAt: formatForResponse(caretaker.createdAt) || "",
        updatedAt: formatForResponse(caretaker.updatedAt) || "",
        deletedAt: formatForResponse(caretaker.deletedAt),
      })
    );
    return NextResponse.json({
      success: true,
      data: caretakerResponses,
    });
  } catch (error) {
    console.error("Erro ao buscar responsáveis da família:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao buscar responsáveis",
      },
      { status: 500 }
    );
  }
}
