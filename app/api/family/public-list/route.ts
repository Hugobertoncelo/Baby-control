import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse, FamilyResponse, Family } from "../../types";

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<FamilyResponse[]>>> {
  try {
    const rawFamilies = await prisma.$queryRaw`
      SELECT id, name, slug, "createdAt", "updatedAt", "isActive"
      FROM "Family"
      WHERE "isActive" = true
      ORDER BY name ASC
    `;
    const families = rawFamilies as Array<{
      id: string;
      name: string;
      slug: string;
      createdAt: Date;
      updatedAt: Date;
      isActive: boolean;
    }>;
    const familyResponses: FamilyResponse[] = families.map((family) => ({
      id: family.id,
      name: family.name,
      slug: family.slug,
      isActive: family.isActive,
      createdAt: new Date(family.createdAt).toISOString(),
      updatedAt: new Date(family.updatedAt).toISOString(),
    }));
    return NextResponse.json({
      success: true,
      data: familyResponses,
    });
  } catch (error) {
    console.error("Erro ao buscar famílias:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao buscar famílias",
      },
      { status: 500 }
    );
  }
}
