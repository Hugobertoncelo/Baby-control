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
  NextResponse<ApiResponse<{ planType: string; subscriptionId?: string }>>
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
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: "sessionId ausente" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "payment_intent"],
    });

    if (session.metadata?.accountId !== accountId) {
      return NextResponse.json(
        { success: false, error: "Sessão não pertence a esta conta" },
        { status: 403 }
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Pagamento não concluído" },
        { status: 400 }
      );
    }

    const planType = session.metadata?.planType as "sub" | "full";

    if (!planType || !["sub", "full"].includes(planType)) {
      return NextResponse.json(
        { success: false, error: "Tipo de plano inválido na sessão" },
        { status: 400 }
      );
    }

    if (planType === "sub") {
      const subscription = session.subscription as Stripe.Subscription;

      if (!subscription) {
        return NextResponse.json(
          { success: false, error: "Assinatura não encontrada" },
          { status: 400 }
        );
      }

      const periodEnd = subscription.items.data[0]?.current_period_end;

      await prisma.account.update({
        where: { id: accountId },
        data: {
          planType: "sub",
          subscriptionId: subscription.id,
          planExpires: periodEnd ? new Date(periodEnd * 1000) : null,
          stripeCustomerId: session.customer as string,
          trialEnds: null,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          planType: "sub",
          subscriptionId: subscription.id,
        },
      });
    } else {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { subscriptionId: true },
      });

      if (account?.subscriptionId) {
        try {
          await stripe.subscriptions.cancel(account.subscriptionId);
          console.log(
            "Assinatura existente cancelada:",
            account.subscriptionId
          );
        } catch (error) {
          console.error("Falha ao cancelar assinatura:", error);
        }
      }

      const lifetimeExpires = new Date();
      lifetimeExpires.setFullYear(lifetimeExpires.getFullYear() + 100);

      await prisma.account.update({
        where: { id: accountId },
        data: {
          planType: "full",
          planExpires: lifetimeExpires,
          stripeCustomerId: session.customer as string,
          trialEnds: null,
          subscriptionId: null,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          planType: "full",
        },
      });
    }
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Falha ao verificar sessão",
      },
      { status: 500 }
    );
  }
}

export const POST = withAccountOwner(handler);
