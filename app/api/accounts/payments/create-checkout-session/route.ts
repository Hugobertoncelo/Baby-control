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
): Promise<
  NextResponse<ApiResponse<{ sessionId: string; url: string | null }>>
> {
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

    const body = await req.json();
    const { priceId, planType } = body;

    if (!priceId || !planType) {
      return NextResponse.json(
        {
          success: false,
          error: "Campos obrigatórios ausentes: priceId, planType",
        },
        { status: 400 }
      );
    }

    if (!["sub", "full"].includes(planType)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tipo de plano inválido. Deve ser "sub" ou "full"',
        },
        { status: 400 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        stripeCustomerId: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    let customerId = account.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: account.email,
        name: `${account.firstName} ${account.lastName || ""}`.trim(),
        metadata: {
          accountId: account.id,
        },
      });

      customerId = customer.id;

      await prisma.account.update({
        where: { id: accountId },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: planType === "sub" ? "subscription" : "payment",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/account/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/account/payment-cancelled`,
      metadata: {
        accountId: account.id,
        planType: planType,
      },
    };

    if (planType === "sub") {
      sessionParams.subscription_data = {
        metadata: {
          accountId: account.id,
        },
      };
    } else {
      sessionParams.payment_intent_data = {
        metadata: {
          accountId: account.id,
          planType: "full",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url,
      },
    });
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao criar sessão de checkout",
      },
      { status: 500 }
    );
  }
}

export const POST = withAccountOwner(handler);
