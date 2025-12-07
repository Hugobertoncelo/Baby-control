import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse, NoteCreate, NoteResponse } from "../types";
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
    const body: NoteCreate = await req.json();
    const baby = await prisma.baby.findFirst({
      where: { id: body.babyId, familyId: userFamilyId },
    });
    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Bebê não encontrado nesta família." },
        { status: 404 }
      );
    }
    const timeUTC = toUTC(body.time);
    const note = await prisma.note.create({
      data: {
        ...body,
        time: timeUTC,
        caretakerId: caretakerId,
        familyId: userFamilyId,
      },
    });
    const response: NoteResponse = {
      ...note,
      time: formatForResponse(note.time) || "",
      createdAt: formatForResponse(note.createdAt) || "",
      updatedAt: formatForResponse(note.updatedAt) || "",
      deletedAt: formatForResponse(note.deletedAt),
    };
    return NextResponse.json<ApiResponse<NoteResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao criar nota:", error);
    return NextResponse.json<ApiResponse<NoteResponse>>(
      { success: false, error: "Falha ao criar nota" },
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
    const body: Partial<NoteCreate> = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<NoteResponse>>(
        { success: false, error: "ID da nota é obrigatório" },
        { status: 400 }
      );
    }
    const existingNote = await prisma.note.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingNote) {
      return NextResponse.json<ApiResponse<NoteResponse>>(
        { success: false, error: "Nota não encontrada ou acesso negado" },
        { status: 404 }
      );
    }
    const data = body.time ? { ...body, time: toUTC(body.time) } : body;
    const note = await prisma.note.update({
      where: { id },
      data,
    });
    const response: NoteResponse = {
      ...note,
      time: formatForResponse(note.time) || "",
      createdAt: formatForResponse(note.createdAt) || "",
      updatedAt: formatForResponse(note.updatedAt) || "",
      deletedAt: formatForResponse(note.deletedAt),
    };
    return NextResponse.json<ApiResponse<NoteResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar nota:", error);
    return NextResponse.json<ApiResponse<NoteResponse>>(
      { success: false, error: "Falha ao atualizar nota" },
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
    const categories = searchParams.get("categories");
    if (categories === "true") {
      const notes = await prisma.note.findMany({
        where: { familyId: userFamilyId, category: { not: null } },
        distinct: ["category"],
        select: { category: true },
      });
      const uniqueCategories = notes
        .map((note) => note.category)
        .filter((category): category is string => category !== null);
      return NextResponse.json<ApiResponse<string[]>>({
        success: true,
        data: uniqueCategories,
      });
    }
    const queryParams = {
      familyId: userFamilyId,
      ...(babyId && { babyId }),
      ...(startDate &&
        endDate && {
          time: {
            gte: toUTC(startDate),
            lte: toUTC(endDate),
          },
        }),
    };
    if (id) {
      const note = await prisma.note.findFirst({
        where: { id, familyId: userFamilyId },
      });
      if (!note) {
        return NextResponse.json<ApiResponse<NoteResponse>>(
          { success: false, error: "Nota não encontrada ou acesso negado" },
          { status: 404 }
        );
      }
      const response: NoteResponse = {
        ...note,
        time: formatForResponse(note.time) || "",
        createdAt: formatForResponse(note.createdAt) || "",
        updatedAt: formatForResponse(note.updatedAt) || "",
        deletedAt: formatForResponse(note.deletedAt),
      };
      return NextResponse.json<ApiResponse<NoteResponse>>({
        success: true,
        data: response,
      });
    }
    const notes = await prisma.note.findMany({
      where: queryParams,
      orderBy: { time: "desc" },
    });
    const response: NoteResponse[] = notes.map((note) => ({
      ...note,
      time: formatForResponse(note.time) || "",
      createdAt: formatForResponse(note.createdAt) || "",
      updatedAt: formatForResponse(note.updatedAt) || "",
      deletedAt: formatForResponse(note.deletedAt),
    }));
    return NextResponse.json<ApiResponse<NoteResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar notas:", error);
    return NextResponse.json<ApiResponse<NoteResponse[]>>(
      { success: false, error: "Falha ao buscar notas" },
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
        { success: false, error: "ID da nota é obrigatório" },
        { status: 400 }
      );
    }
    const existingNote = await prisma.note.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingNote) {
      return NextResponse.json<ApiResponse<void>>(
        { success: false, error: "Nota não encontrada ou acesso negado" },
        { status: 404 }
      );
    }
    await prisma.note.delete({ where: { id } });
    return NextResponse.json<ApiResponse<void>>({ success: true });
  } catch (error) {
    console.error("Erro ao deletar nota:", error);
    return NextResponse.json<ApiResponse<void>>(
      { success: false, error: "Falha ao deletar nota" },
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
