import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/api/db";

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: "2025-10-29.clover",
    })
  : ({} as unknown as Stripe);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Método não permitido. Este endpoint aceita apenas requisições POST.",
    },
    { status: 405 }
  );
}

export async function POST(req: NextRequest) {
  const deploymentMode = process.env.DEPLOYMENT_MODE || "selfhosted";
  if (deploymentMode !== "saas") {
    return NextResponse.json(
      {
        error: "Webhooks de pagamento estão desabilitados no modo self-hosted",
      },
      { status: 404 }
    );
  }

  if (!stripeKey) {
    console.error("[ERRO WEBHOOK] STRIPE_SECRET_KEY não está configurada");
    return NextResponse.json(
      { error: "Stripe não configurado" },
      { status: 500 }
    );
  }

  const startTime = Date.now();
  console.log("[WEBHOOK] Requisição recebida");
  try {
    if (!webhookSecret) {
      console.error(
        "[ERRO WEBHOOK] STRIPE_WEBHOOK_SECRET não está configurada"
      );
      return NextResponse.json(
        { error: "Webhook secret não configurado" },
        { status: 500 }
      );
    }

    const body = await req.text();
    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      allHeaders[key] =
        value.length > 50 ? value.substring(0, 50) + "..." : value;
    });
    const signature =
      req.headers.get("stripe-signature") ||
      req.headers.get("Stripe-Signature") ||
      req.headers.get("STRIPE-SIGNATURE") ||
      req.headers.get("stripe_signature");

    if (!signature) {
      console.error(
        "[ERRO WEBHOOK] Stripe signature não encontrada nos headers",
        {
          availableHeaders: Object.keys(allHeaders),
          userAgent: req.headers.get("user-agent"),
          contentType: req.headers.get("content-type"),
        }
      );
      return NextResponse.json({ error: "Sem assinatura" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(
        `[WEBHOOK] Assinatura verificada com sucesso para o evento: ${event.type}`
      );
    } catch (err: any) {
      console.error(
        "[ERRO WEBHOOK] Falha na verificação da assinatura do webhook:",
        {
          error: err.message,
          type: err.type,
        }
      );
      return NextResponse.json(
        { error: "Assinatura inválida" },
        { status: 400 }
      );
    }

    console.log(
      `[WEBHOOK] Processando evento: ${event.type} (ID: ${event.id})`
    );

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(
          event.data.object as Stripe.Invoice
        );
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Tipo de evento não tratado: ${event.type}`);
    }

    const processingTime = Date.now() - startTime;
    console.log(
      `[WEBHOOK SUCESSO] Evento ${event.type} processado em ${processingTime}ms`
    );
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("[ERRO WEBHOOK] Erro no handler do webhook:", {
      error: error?.message || error,
      stack: error?.stack,
      processingTime: `${processingTime}ms`,
    });
    return NextResponse.json(
      { error: "Falha no handler do webhook" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  let accountId = session.metadata?.accountId;
  const planType = session.metadata?.planType;
  if (!accountId && session.customer) {
    try {
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer.id;
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted && customer.metadata?.accountId) {
        accountId = customer.metadata.accountId;
      }
    } catch (error) {
      console.error(
        "[ERRO WEBHOOK] Erro ao buscar customer para fallback de metadata:",
        error
      );
    }
  }
  if (!accountId) {
    console.error(
      "[ERRO WEBHOOK] Nenhum accountId na metadata da sessão ou do customer",
      {
        sessionId: session.id,
        sessionMetadata: session.metadata,
        customerId: session.customer,
      }
    );
    return;
  }
  try {
    if (session.mode === "subscription" && session.subscription) {
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
      const subscription = (await stripe.subscriptions.retrieve(
        subscriptionId
      )) as Stripe.Subscription;
      const subscriptionAccountId = subscription.metadata?.accountId;
      if (!subscriptionAccountId || subscriptionAccountId !== accountId) {
        try {
          await stripe.subscriptions.update(subscription.id, {
            metadata: {
              ...subscription.metadata,
              accountId: accountId,
            },
          });
        } catch (error) {
          console.error(
            "[ERRO WEBHOOK] Erro ao atualizar metadata da assinatura:",
            error
          );
        }
      }
      if (session.customer) {
        try {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer.id;
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !customer.deleted && !customer.metadata?.accountId) {
            await stripe.customers.update(customerId, {
              metadata: {
                ...customer.metadata,
                accountId: accountId,
              },
            });
          }
        } catch (error) {
          console.error(
            "[ERRO WEBHOOK] Erro ao atualizar metadata do customer:",
            error
          );
        }
      }
      const periodEnd = subscription.items.data[0]?.current_period_end;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const updateData: any = {
        subscriptionId: subscriptionId,
        planType: "sub",
        planExpires: periodEnd ? new Date(periodEnd * 1000) : null,
        trialEnds: null,
      };
      if (customerId) {
        updateData.stripeCustomerId = customerId;
      }
      await prisma.account.update({
        where: { id: accountId },
        data: updateData,
      });
    } else if (session.mode === "payment" && planType === "full") {
      const account = await prisma.account.findUnique({
        where: { id: accountId },
        select: { subscriptionId: true },
      });
      if (account?.subscriptionId) {
        try {
          await stripe.subscriptions.cancel(account.subscriptionId);
        } catch (error) {
          console.error("[ERRO WEBHOOK] Falha ao cancelar assinatura:", error);
        }
      }
      if (session.customer) {
        try {
          const customerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer.id;
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !customer.deleted && !customer.metadata?.accountId) {
            await stripe.customers.update(customerId, {
              metadata: {
                ...customer.metadata,
                accountId: accountId,
              },
            });
          }
        } catch (error) {
          console.error(
            "[ERRO WEBHOOK] Erro ao atualizar metadata do customer para pagamento vitalício:",
            error
          );
        }
      }
      const lifetimeExpires = new Date();
      lifetimeExpires.setFullYear(lifetimeExpires.getFullYear() + 100);
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const updateData: any = {
        planType: "full",
        planExpires: lifetimeExpires,
        subscriptionId: null,
        trialEnds: null,
      };
      if (customerId) {
        updateData.stripeCustomerId = customerId;
      }
      await prisma.account.update({
        where: { id: accountId },
        data: updateData,
      });
    }
  } catch (error) {
    console.error(
      "[ERRO WEBHOOK] Erro ao processar checkout.session.completed:",
      error
    );
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const accountId = subscription.metadata?.accountId;
  if (!accountId) {
    console.error("[ERRO WEBHOOK] Nenhum accountId na metadata da assinatura");
    return;
  }
  try {
    const periodEnd = subscription.items.data[0]?.current_period_end;
    const updateData = {
      subscriptionId: subscription.id,
      planType: "sub",
      planExpires: periodEnd ? new Date(periodEnd * 1000) : null,
      trialEnds: null,
    };
    await prisma.account.update({
      where: { id: accountId },
      data: updateData,
    });
  } catch (error) {
    console.error(
      "[ERRO WEBHOOK] Erro ao processar atualização de assinatura:",
      error
    );
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const accountId = subscription.metadata?.accountId;
  if (!accountId) {
    console.error("[ERRO WEBHOOK] Nenhum accountId na metadata da assinatura");
    return;
  }
  try {
    await prisma.account.update({
      where: { id: accountId },
      data: {
        subscriptionId: null,
      },
    });
  } catch (error) {
    console.error(
      "[ERRO WEBHOOK] Erro ao processar exclusão de assinatura:",
      error
    );
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice.parent as any)?.subscription_details
    ?.subscription
    ? typeof (invoice.parent as any).subscription_details.subscription ===
      "string"
      ? (invoice.parent as any).subscription_details.subscription
      : (invoice.parent as any).subscription_details.subscription.id
    : null;
  if (!subscriptionId) {
    return;
  }
  try {
    const subscription = (await stripe.subscriptions.retrieve(
      subscriptionId
    )) as Stripe.Subscription;
    const accountId = subscription.metadata?.accountId;
    if (!accountId) {
      console.error(
        "[ERRO WEBHOOK] Nenhum accountId na metadata da assinatura"
      );
      return;
    }
    const periodEnd = subscription.items.data[0]?.current_period_end;
    await prisma.account.update({
      where: { id: accountId },
      data: {
        planExpires: periodEnd ? new Date(periodEnd * 1000) : null,
      },
    });
  } catch (error) {
    console.error(
      "[ERRO WEBHOOK] Erro ao processar invoice.payment_succeeded:",
      error
    );
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice.parent as any)?.subscription_details
    ?.subscription
    ? typeof (invoice.parent as any).subscription_details.subscription ===
      "string"
      ? (invoice.parent as any).subscription_details.subscription
      : (invoice.parent as any).subscription_details.subscription.id
    : null;
  if (!subscriptionId) {
    return;
  }
  try {
    const subscription = (await stripe.subscriptions.retrieve(
      subscriptionId
    )) as Stripe.Subscription;
    const accountId = subscription.metadata?.accountId;
    if (!accountId) {
      console.error(
        "[ERRO WEBHOOK] Nenhum accountId na metadata da assinatura"
      );
      return;
    }
  } catch (error) {
    console.error(
      "[ERRO WEBHOOK] Erro ao processar invoice.payment_failed:",
      error
    );
  }
}
