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

    if (account.planType === "full") {
      return NextResponse.json(
        { success: false, error: "Planos vitalícios não podem ser cancelados" },
        { status: 400 }
      );
    }

    try {
      const subscription = (await stripe.subscriptions.update(
        account.subscriptionId,
        {
          cancel_at_period_end: true,
        }
      )) as Stripe.Subscription;

      console.log(
        `Assinatura ${account.subscriptionId} cancelada para a conta ${accountId}`
      );

      const periodEnd = subscription.items.data[0]?.current_period_end;
      const endDate = periodEnd
        ? new Date(periodEnd * 1000).toLocaleDateString("pt-BR")
        : "o fim do seu período de cobrança";

      return NextResponse.json({
        success: true,
        data: {
          message: `Assinatura cancelada. Você terá acesso até ${endDate}`,
        },
      });
    } catch (stripeError) {
      console.error("Erro ao cancelar assinatura no Stripe:", stripeError);

      if (
        stripeError instanceof Stripe.errors.StripeError &&
        stripeError.code === "resource_missing"
      ) {
        await prisma.account.update({
          where: { id: accountId },
          data: {
            subscriptionId: null,
          },
        });

        return NextResponse.json(
          {
            success: false,
            error: "Assinatura não encontrada no sistema de pagamento",
          },
          { status: 404 }
        );
      }

      throw stripeError;
    }
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao cancelar assinatura",
      },
      { status: 500 }
    );
  }
}

export const POST = withAccountOwner(handler);
