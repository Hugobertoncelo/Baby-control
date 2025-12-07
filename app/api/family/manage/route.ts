import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import {
  ApiResponse,
  FamilyResponse,
  FamilyCreate,
  FamilyUpdate,
} from "../../types";
import { withSysAdminAuth } from "../../utils/auth";

async function getHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<FamilyResponse[]>>> {
  try {
    const families = await prisma.family.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        _count: {
          select: {
            caretakers: true,
            babies: true,
          },
        },
      },
    });
    const familyResponses: (FamilyResponse & {
      caretakerCount: number;
      babyCount: number;
    })[] = families.map((family) => ({
      id: family.id,
      name: family.name,
      slug: family.slug,
      isActive: family.isActive,
      createdAt: family.createdAt.toISOString(),
      updatedAt: family.updatedAt.toISOString(),
      caretakerCount: family._count.caretakers,
      babyCount: family._count.babies,
    }));
    return NextResponse.json({
      success: true,
      data: familyResponses,
    });
  } catch (error) {
    console.error("Erro ao buscar famílias para gerenciamento:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao buscar famílias",
      },
      { status: 500 }
    );
  }
}

async function postHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<FamilyResponse>>> {
  try {
    const body: FamilyCreate = await req.json();
    if (!body.name || !body.slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Nome e slug são obrigatórios",
        },
        { status: 400 }
      );
    }
    const existingFamily = await prisma.family.findUnique({
      where: { slug: body.slug },
    });
    if (existingFamily) {
      return NextResponse.json(
        {
          success: false,
          error: "Slug já existe",
        },
        { status: 400 }
      );
    }
    const family = await prisma.family.create({
      data: {
        name: body.name,
        slug: body.slug,
        isActive: body.isActive ?? true,
      },
    });
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
    console.error("Erro ao criar família:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao criar família",
      },
      { status: 500 }
    );
  }
}

async function putHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<FamilyResponse>>> {
  try {
    const body: FamilyUpdate = await req.json();
    if (!body.id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID da família é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingFamily = await prisma.family.findUnique({
      where: { id: body.id },
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
    if (body.slug && body.slug !== existingFamily.slug) {
      const slugExists = await prisma.family.findFirst({
        where: {
          slug: body.slug,
          id: { not: body.id },
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
    const { id, ...updateData } = body;
    const family = await prisma.family.update({
      where: { id },
      data: updateData,
    });
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

export const GET = withSysAdminAuth(getHandler);
export const POST = withSysAdminAuth(postHandler);
export const PUT = withSysAdminAuth(putHandler);
