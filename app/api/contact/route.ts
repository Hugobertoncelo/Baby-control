import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse } from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { formatForResponse } from "../utils/timezone";
import { checkWritePermission } from "../utils/writeProtection";

interface ContactResponse {
  id: string;
  name: string;
  role: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface ContactCreate {
  name: string;
  role: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId } = authContext;
    if (!familyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const role = searchParams.get("role");
    const where: any = {
      deletedAt: null,
      familyId: familyId,
    };
    if (id) {
      where.id = id;
    }
    if (role) {
      where.role = role;
    }
    if (id) {
      const contact = await prisma.contact.findFirst({
        where: {
          id,
          deletedAt: null,
          familyId: familyId,
        },
      });
      if (!contact) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Contato não encontrado",
          },
          { status: 404 }
        );
      }
      const response: Omit<ContactResponse, "familyId"> = {
        ...contact,
        createdAt: formatForResponse(contact.createdAt) || "",
        updatedAt: formatForResponse(contact.updatedAt) || "",
        deletedAt: formatForResponse(contact.deletedAt),
      };
      return NextResponse.json<ApiResponse<Omit<ContactResponse, "familyId">>>({
        success: true,
        data: response,
      });
    }
    const contacts = await prisma.contact.findMany({
      where,
      orderBy: {
        name: "asc",
      },
    });
    const response: Omit<ContactResponse, "familyId">[] = contacts.map(
      (contact) => ({
        ...contact,
        createdAt: formatForResponse(contact.createdAt) || "",
        updatedAt: formatForResponse(contact.updatedAt) || "",
        deletedAt: formatForResponse(contact.deletedAt),
      })
    );
    return NextResponse.json<ApiResponse<Omit<ContactResponse, "familyId">[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao buscar contatos",
      },
      { status: 500 }
    );
  }
}

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId } = authContext;
    if (!familyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const body: ContactCreate = await req.json();
    if (!body.name || !body.role) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Nome e função são obrigatórios",
        },
        { status: 400 }
      );
    }
    const contact = await prisma.contact.create({
      data: {
        name: body.name,
        role: body.role,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
        familyId: familyId,
      },
    });
    const response: Omit<ContactResponse, "familyId"> = {
      ...contact,
      createdAt: formatForResponse(contact.createdAt) || "",
      updatedAt: formatForResponse(contact.updatedAt) || "",
      deletedAt: formatForResponse(contact.deletedAt),
    };
    return NextResponse.json<ApiResponse<Omit<ContactResponse, "familyId">>>(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar contato:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao criar contato",
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
    const { familyId } = authContext;
    if (!familyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body: ContactCreate = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "ID do contato é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        familyId: familyId,
      },
    });
    if (!existingContact || existingContact.deletedAt) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Contato não encontrado",
        },
        { status: 404 }
      );
    }
    if (!body.name || !body.role) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Nome e função são obrigatórios",
        },
        { status: 400 }
      );
    }
    const contact = await prisma.contact.update({
      where: { id },
      data: {
        name: body.name,
        role: body.role,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        notes: body.notes || null,
      },
    });
    const response: Omit<ContactResponse, "familyId"> = {
      ...contact,
      createdAt: formatForResponse(contact.createdAt) || "",
      updatedAt: formatForResponse(contact.updatedAt) || "",
      deletedAt: formatForResponse(contact.deletedAt),
    };
    return NextResponse.json<ApiResponse<Omit<ContactResponse, "familyId">>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar contato:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao atualizar contato",
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
    const { familyId } = authContext;
    if (!familyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "ID do contato é obrigatório",
        },
        { status: 400 }
      );
    }
    const existingContact = await prisma.contact.findFirst({
      where: {
        id,
        familyId: familyId,
      },
    });
    if (!existingContact || existingContact.deletedAt) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Contato não encontrado",
        },
        { status: 404 }
      );
    }
    await prisma.contact.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Erro ao excluir contato:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao excluir contato",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet as any);
export const POST = withAuthContext(handlePost);
export const PUT = withAuthContext(handlePut);
export const DELETE = withAuthContext(handleDelete as any);
