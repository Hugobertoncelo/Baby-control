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

interface SubscriptionStatusData {
  isActive: boolean;
  planType: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paymentMethod?: {
    brand: string;
    last4: string;
  };
}

async function handler(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<SubscriptionStatusData>>> {
  try {
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
        planExpires: true,
        stripeCustomerId: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    const deploymentMode = process.env.DEPLOYMENT_MODE || "selfhosted";
    if (deploymentMode !== "saas" || !stripeKey) {
      return NextResponse.json({
        success: true,
        data: {
          isActive: account.planType === "full",
          planType: account.planType,
          currentPeriodEnd: account.planExpires?.toISOString() || null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    if (!account.subscriptionId) {
      return NextResponse.json({
        success: true,
        data: {
          isActive: account.planType === "full",
          planType: account.planType,
          currentPeriodEnd: account.planExpires?.toISOString() || null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    try {
      const subscription = (await stripe.subscriptions.retrieve(
        account.subscriptionId,
        {
          expand: ["default_payment_method"],
        }
      )) as Stripe.Subscription;

      let paymentMethod: { brand: string; last4: string } | undefined;

      if (subscription.default_payment_method) {
        const pm = subscription.default_payment_method as Stripe.PaymentMethod;
        if (pm.card) {
          paymentMethod = {
            brand: pm.card.brand,
            last4: pm.card.last4,
          };
        }
      }

      const periodEnd = subscription.items.data[0]?.current_period_end;

      return NextResponse.json({
        success: true,
        data: {
          isActive:
            subscription.status === "active" ||
            subscription.status === "trialing",
          planType: "sub",
          currentPeriodEnd: periodEnd
            ? new Date(periodEnd * 1000).toISOString()
            : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          paymentMethod,
        },
      });
    } catch (stripeError) {
      console.error("Erro ao buscar assinatura no Stripe:", stripeError);
      return NextResponse.json({
        success: true,
        data: {
          isActive: account.planType === "sub",
          planType: account.planType,
          currentPeriodEnd: account.planExpires?.toISOString() || null,
          cancelAtPeriodEnd: false,
        },
      });
    }
  } catch (error) {
    console.error("Erro ao buscar status da assinatura:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao buscar status da assinatura",
      },
      { status: 500 }
    );
  }
}

export const GET = withAccountOwner(handler);
