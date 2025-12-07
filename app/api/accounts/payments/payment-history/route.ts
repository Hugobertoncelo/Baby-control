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

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  receiptUrl?: string;
  invoiceUrl?: string;
}

interface PaymentHistoryData {
  transactions: PaymentHistoryItem[];
  hasMore: boolean;
}

async function handler(
  req: NextRequest,
  authContext: AuthResult
): Promise<NextResponse<ApiResponse<PaymentHistoryData>>> {
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
        stripeCustomerId: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "Conta não encontrada" },
        { status: 404 }
      );
    }

    if (!account.stripeCustomerId) {
      return NextResponse.json({
        success: true,
        data: {
          transactions: [],
          hasMore: false,
        },
      });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const startingAfter = searchParams.get("starting_after") || undefined;

    const paymentIntents = await stripe.paymentIntents.list({
      customer: account.stripeCustomerId,
      limit,
      starting_after: startingAfter,
      expand: ["data.charges"],
    });

    const transactions: PaymentHistoryItem[] = paymentIntents.data.map((pi) => {
      const piWithCharges = pi as Stripe.PaymentIntent & {
        charges?: Stripe.ApiList<Stripe.Charge>;
      };
      const charge = piWithCharges.charges?.data?.[0];

      return {
        id: pi.id,
        date: new Date(pi.created * 1000).toISOString(),
        amount: pi.amount / 100,
        currency: pi.currency.toUpperCase(),
        status: pi.status,
        description: pi.description || "Pagamento Baby Control",
        receiptUrl: charge?.receipt_url || undefined,
        invoiceUrl:
          charge && typeof (charge as any).invoice === "string"
            ? `https://invoice.stripe.com/i/${
                ((charge as any).invoice as string).split("_secret_")[0]
              }`
            : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        hasMore: paymentIntents.has_more,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar histórico de pagamentos:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao buscar histórico de pagamentos",
      },
      { status: 500 }
    );
  }
}

export const GET = withAccountOwner(handler);
