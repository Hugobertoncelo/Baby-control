import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import {
  generateSlug,
  generateSlugWithNumber,
} from "../../utils/slug-generator";
import type { ApiResponse } from "../../utils/auth";

async function handler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ slug: string }>>> {
  try {
    let slug = "";
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      slug = generateSlug();
      const existingFamilies = await prisma.$queryRaw`
        SELECT * FROM "Family" WHERE slug = ${slug} LIMIT 1
      `;
      if (Array.isArray(existingFamilies) && existingFamilies.length === 0) {
        isUnique = true;
      }
      attempts++;
    }
    if (!isUnique) {
      attempts = 0;
      while (!isUnique && attempts < 10) {
        slug = generateSlugWithNumber();
        const existingFamilies = await prisma.$queryRaw`
          SELECT * FROM "Family" WHERE slug = ${slug} LIMIT 1
        `;
        if (Array.isArray(existingFamilies) && existingFamilies.length === 0) {
          isUnique = true;
        }
        attempts++;
      }
    }
    if (!isUnique) {
      slug = generateSlugWithNumber(6);
      const existingFamilies = await prisma.$queryRaw`
        SELECT * FROM "Family" WHERE slug = ${slug} LIMIT 1
      `;
      if (!(Array.isArray(existingFamilies) && existingFamilies.length === 0)) {
        throw new Error(
          "Não foi possível gerar um slug único após várias tentativas"
        );
      }
    }
    return NextResponse.json({
      success: true,
      data: { slug },
    });
  } catch (error) {
    console.error("Erro ao gerar slug único:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao gerar slug único",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export const GET = handler;
