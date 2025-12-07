import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/api/db";
import {
  withAccountOwner,
  ApiResponse,
  AuthResult,
} from "@/app/api/utils/auth";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2025-10-29.clover",
    })
  : ({} as unknown as Stripe);

async function handler(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<{ message: string }>>> {
  try {
    const deploymentMode = process.env.DEPLOYMENT_MODE || "selfhosted";
    if (deploymentMode !== "saas") {
      return NextResponse.json(
        {
          success: false,
          error: "Pagamentos estão desabilitados no modo self-hosted",
        },
        { status: 404 }
      );
    }

    if (!stripeKey) {
      console.error(
        "[ERRO DE PAGAMENTO] STRIPE_SECRET_KEY não está configurada"
      );
      return NextResponse.json(
        { success: false, error: "Sistema de pagamento não configurado" },
        { status: 500 }
      );
    }

    const accountId = authContext.accountId;

    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "ID da conta não encontrado" },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        subscriptionId: true,
        planType: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    if (!account.subscriptionId) {
      return NextResponse.json(
        { success: false, error: "Nenhuma assinatura ativa encontrada" },
        { status: 400 }
      );
    }

    if (account.planType !== "sub") {
      return NextResponse.json(
        { success: false, error: "A conta não possui um plano de assinatura" },
        { status: 400 }
      );
    }

    try {
      const subscription = await stripe.subscriptions.update(
        account.subscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      return NextResponse.json({
        success: true,
        data: {
          message: "Assinatura reativada com sucesso",
        },
      });
    } catch (stripeError) {
      console.error("Erro ao reativar assinatura no Stripe:", stripeError);
      return NextResponse.json(
        {
          success: false,
          error:
            stripeError instanceof Error
              ? stripeError.message
              : "Falha ao reativar assinatura no Stripe",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erro ao reativar assinatura:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao reativar assinatura",
      },
      { status: 500 }
    );
  }
}

export const POST = withAccountOwner(handler);
