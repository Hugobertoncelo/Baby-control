import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";
import { withSysAdminAuth } from "../../utils/auth";

interface AccountManageResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  verified: boolean;
  betaparticipant: boolean;
  closed: boolean;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  familyId: string | null;
  family: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

async function getHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<AccountManageResponse[]>>> {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        family: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const accountsData: AccountManageResponse[] = accounts.map((account) => ({
      id: account.id,
      email: account.email,
      firstName: account.firstName,
      lastName: account.lastName,
      verified: account.verified,
      betaparticipant: account.betaparticipant,
      closed: account.closed,
      closedAt: account.closedAt?.toISOString() || null,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      familyId: account.familyId,
      family: account.family,
    }));

    return NextResponse.json<ApiResponse<AccountManageResponse[]>>({
      success: true,
      data: accountsData,
    });
  } catch (error) {
    console.error("Erro ao buscar contas para gerenciamento:", error);
    return NextResponse.json<ApiResponse<AccountManageResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar contas",
      },
      { status: 500 }
    );
  }
}

async function putHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const body = await req.json();
    const { id, closed } = body;

    if (!id || typeof closed !== "boolean") {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        {
          success: false,
          error: "ID da conta e status de fechamento são obrigatórios",
        },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id },
      include: {
        family: true,
        caretaker: true,
      },
    });

    if (!account) {
      return NextResponse.json<ApiResponse<{ message: string }>>(
        {
          success: false,
          error: "Conta não encontrada",
        },
        { status: 404 }
      );
    }

    const updateData: any = {
      closed,
      closedAt: closed ? new Date() : null,
    };

    await prisma.account.update({
      where: { id },
      data: updateData,
    });

    if (closed) {
      if (account.familyId) {
        await prisma.family.update({
          where: { id: account.familyId },
          data: { isActive: false },
        });
      }

      if (account.caretaker) {
        await prisma.caretaker.update({
          where: { id: account.caretaker.id },
          data: { deletedAt: new Date() },
        });
      }
    } else {
      if (account.familyId) {
        await prisma.family.update({
          where: { id: account.familyId },
          data: { isActive: true },
        });
      }

      if (account.caretaker) {
        await prisma.caretaker.update({
          where: { id: account.caretaker.id },
          data: { deletedAt: null },
        });
      }
    }

    const action = closed ? "fechada" : "reaberta";
    console.log(`Conta ${action} para o e-mail: ${account.email}`);

    return NextResponse.json<ApiResponse<{ message: string }>>({
      success: true,
      data: {
        message: `Conta ${action} com sucesso`,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar status da conta:", error);
    return NextResponse.json<ApiResponse<{ message: string }>>(
      {
        success: false,
        error: "Falha ao atualizar status da conta",
      },
      { status: 500 }
    );
  }
}

export const GET = withSysAdminAuth(getHandler);
export const PUT = withSysAdminAuth(putHandler);
