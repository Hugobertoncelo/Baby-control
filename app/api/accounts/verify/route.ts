import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";

interface EmailVerificationRequest {
  token: string;
}

interface EmailVerificationResponse {
  success: boolean;
  message: string;
  familySlug?: string;
  redirectUrl?: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<EmailVerificationResponse>>> {
  try {
    const body: EmailVerificationRequest = await req.json();
    const { token } = body;
    if (!token || typeof token !== "string") {
      return NextResponse.json<ApiResponse<EmailVerificationResponse>>(
        {
          success: false,
          error: "Token de verificação é obrigatório",
        },
        { status: 400 }
      );
    }
    const account = await prisma.account.findUnique({
      where: { verificationToken: token },
      include: { family: true },
    });
    if (!account) {
      return NextResponse.json<ApiResponse<EmailVerificationResponse>>(
        {
          success: false,
          error: "Token de verificação inválido ou expirado",
        },
        { status: 404 }
      );
    }
    if (account.verified) {
      if (account.family) {
        return NextResponse.json<ApiResponse<EmailVerificationResponse>>({
          success: true,
          data: {
            success: true,
            message:
              "Conta já verificada. Redirecionando para o painel da sua família.",
            familySlug: account.family.slug,
            redirectUrl: `/${account.family.slug}`,
          },
        });
      } else {
        return NextResponse.json<ApiResponse<EmailVerificationResponse>>({
          success: true,
          data: {
            success: true,
            message:
              "Conta já verificada. Agora você pode configurar sua família.",
            redirectUrl: "/coming-soon",
          },
        });
      }
    }
    const updatedAccount = await prisma.account.update({
      where: { id: account.id },
      data: {
        verified: true,
        verificationToken: null,
      },
    });
    console.log(
      `Conta verificada: accountId=${account.id}, email=${account.email}`
    );
    return NextResponse.json<ApiResponse<EmailVerificationResponse>>({
      success: true,
      data: {
        success: true,
        message:
          "Conta verificada com sucesso! Agora você pode configurar sua família.",
        redirectUrl: "/coming-soon",
      },
    });
  } catch (error) {
    console.error("Erro na verificação de e-mail:", error);
    return NextResponse.json<ApiResponse<EmailVerificationResponse>>(
      {
        success: false,
        error:
          "Falha na verificação. Por favor, tente novamente ou entre em contato com o suporte.",
      },
      { status: 500 }
    );
  }
}
