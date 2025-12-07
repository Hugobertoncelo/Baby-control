import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, FamilyResponse } from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { checkWritePermission } from "../utils/writeProtection";

async function getHandler(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<FamilyResponse>>> {
  try {
    const { familyId } = authContext;
    if (!familyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não está associado a uma família",
        },
        { status: 403 }
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
    const response: FamilyResponse = {
      id: family.id,
      name: family.name,
      slug: family.slug,
      isActive: family.isActive,
      createdAt: family.createdAt.toISOString(),
      updatedAt: family.updatedAt.toISOString(),
    };
    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar família:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao buscar família",
      },
      { status: 500 }
    );
  }
}

async function putHandler(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<FamilyResponse>>> {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId } = authContext;
    if (!familyId) {
      return NextResponse.json(
        {
          success: false,
          error: "Usuário não está associado a uma família",
        },
        { status: 403 }
      );
    }
    const body = await req.json();
    const { name, slug } = body;
    if (!name || !slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome e slug são obrigatórios",
        },
        { status: 400 }
      );
    }
    const existingFamily = await prisma.family.findUnique({
      where: { id: familyId },
    });
    if (!existingFamily) {
      return NextResponse.json(
        {
          success: false,
          error: "Família não encontrada",
        },
        { status: 404 }
      );
    }
    if (slug !== existingFamily.slug) {
      const slugExists = await prisma.family.findFirst({
        where: {
          slug: slug,
          id: { not: familyId },
        },
      });
      if (slugExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Slug já existe",
          },
          { status: 400 }
        );
      }
    }
    const [family, settings] = await prisma.$transaction([
      prisma.family.update({
        where: { id: familyId },
        data: { name, slug },
      }),
      prisma.settings.updateMany({
        where: { familyId: familyId },
        data: { familyName: name },
      }),
    ]);
    const response: FamilyResponse = {
      id: family.id,
      name: family.name,
      slug: family.slug,
      isActive: family.isActive,
      createdAt: family.createdAt.toISOString(),
      updatedAt: family.updatedAt.toISOString(),
    };
    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar família:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao atualizar família",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(getHandler);
export const PUT = withAuthContext(putHandler);
