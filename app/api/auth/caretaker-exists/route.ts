import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const familySlug = searchParams.get("familySlug");
    let familyId = null;
    if (familySlug) {
      const family = await prisma.family.findFirst({
        where: {
          slug: familySlug,
          isActive: true,
        },
      });
      if (!family) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Família inválida",
          },
          { status: 404 }
        );
      }
      familyId = family.id;
    }
    const caretakerCount = await prisma.caretaker.count({
      where: {
        deletedAt: null,
        loginId: { not: "00" },
        ...(familyId ? { familyId } : {}),
      },
    });
    let authType = null;
    if (familyId) {
      const settings = await prisma.settings.findFirst({
        where: { familyId },
        select: { authType: true },
      });
      authType =
        settings?.authType || (caretakerCount > 0 ? "CARETAKER" : "SYSTEM");
    }
    return NextResponse.json<
      ApiResponse<{ exists: boolean; authType?: string }>
    >({
      success: true,
      data: {
        exists: caretakerCount > 0,
        authType: authType || undefined,
      },
    });
  } catch (error) {
    console.error("Erro ao verificar cuidadores:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao verificar cuidadores",
      },
      { status: 500 }
    );
  }
}
