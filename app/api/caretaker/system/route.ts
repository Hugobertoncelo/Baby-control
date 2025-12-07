import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse, CaretakerResponse } from "../../types";
import { withAuthContext, AuthResult } from "../../utils/auth";
import { formatForResponse } from "../../utils/timezone";

async function getSystemCaretaker(req: NextRequest, authContext: AuthResult) {
  try {
    const {
      familyId: userFamilyId,
      isSetupAuth,
      isSysAdmin,
      isAccountAuth,
    } = authContext;
    let targetFamilyId = userFamilyId;
    if (!userFamilyId && (isSetupAuth || isSysAdmin || isAccountAuth)) {
      const { searchParams } = new URL(req.url);
      const queryFamilyId = searchParams.get("familyId");
      if (queryFamilyId) {
        targetFamilyId = queryFamilyId;
      }
    }
    if (!targetFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const systemCaretaker = await prisma.caretaker.findFirst({
      where: {
        loginId: "00",
        familyId: targetFamilyId,
        deletedAt: null,
      },
    });
    if (!systemCaretaker) {
      return NextResponse.json<ApiResponse<CaretakerResponse>>(
        {
          success: false,
          error: "Cuidador do sistema não encontrado para esta família.",
        },
        { status: 404 }
      );
    }
    const response: CaretakerResponse = {
      ...systemCaretaker,
      createdAt: formatForResponse(systemCaretaker.createdAt) || "",
      updatedAt: formatForResponse(systemCaretaker.updatedAt) || "",
      deletedAt: formatForResponse(systemCaretaker.deletedAt),
    };
    return NextResponse.json<ApiResponse<CaretakerResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar cuidador do sistema:", error);
    return NextResponse.json<ApiResponse<CaretakerResponse>>(
      {
        success: false,
        error: "Falha ao buscar cuidador do sistema",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(
  getSystemCaretaker as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
