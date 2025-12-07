import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, ApiResponse } from "../../utils/auth";
import prisma from "../../db";

interface AccountStatusResponse {
  accountId: string;
  email: string;
  firstName: string;
  lastName?: string;
  verified: boolean;
  hasFamily: boolean;
  familySlug?: string;
  familyName?: string;
  betaparticipant: boolean;
  closed: boolean;
  closedAt?: string;
  planType?: string;
  planExpires?: string;
  trialEnds?: string;
  subscriptionActive: boolean;
  subscriptionId?: string;
  accountStatus:
    | "active"
    | "inactive"
    | "trial"
    | "expired"
    | "closed"
    | "no_family";
}

async function handler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<AccountStatusResponse>>> {
  try {
    const authResult = await getAuthenticatedUser(req);

    if (!authResult.authenticated) {
      return NextResponse.json<ApiResponse<AccountStatusResponse>>(
        {
          success: false,
          error: "Autenticação obrigatória",
        },
        { status: 401 }
      );
    }

    if (!authResult.isAccountAuth || !authResult.accountId) {
      return NextResponse.json<ApiResponse<AccountStatusResponse>>(
        {
          success: false,
          error: "Autenticação de conta obrigatória",
        },
        { status: 403 }
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: authResult.accountId },
      include: {
        family: {
          select: {
            slug: true,
            name: true,
          },
        },
      },
    });

    if (!account) {
      return NextResponse.json<ApiResponse<AccountStatusResponse>>(
        {
          success: false,
          error: "Conta não encontrada",
        },
        { status: 404 }
      );
    }

    let accountStatus:
      | "active"
      | "inactive"
      | "trial"
      | "expired"
      | "closed"
      | "no_family" = "active";
    let subscriptionActive = false;
    const now = new Date();

    if (account.closed) {
      accountStatus = "closed";
    } else if (!account.family) {
      accountStatus = "no_family";
      if (account.planType === "full") {
        subscriptionActive = true;
      } else if (account.planType === "sub" && account.planExpires) {
        const planEndDate = new Date(account.planExpires);
        subscriptionActive = now <= planEndDate;
      } else if (account.betaparticipant) {
        subscriptionActive = true;
      }
    } else if (account.trialEnds) {
      const trialEndDate = new Date(account.trialEnds);
      if (now > trialEndDate) {
        accountStatus = "expired";
        subscriptionActive = false;
      } else {
        accountStatus = "trial";
        subscriptionActive = false;
      }
    } else if (account.planType === "full") {
      subscriptionActive = true;
    } else if (account.planType === "sub") {
      if (account.planExpires) {
        const planEndDate = new Date(account.planExpires);
        if (now > planEndDate) {
          accountStatus = "expired";
          subscriptionActive = false;
        } else {
          subscriptionActive = true;
        }
      } else {
        accountStatus = "expired";
        subscriptionActive = false;
      }
    } else if (account.betaparticipant) {
      subscriptionActive = true;
    } else {
      accountStatus = "expired";
      subscriptionActive = false;
    }

    return NextResponse.json<ApiResponse<AccountStatusResponse>>({
      success: true,
      data: {
        accountId: account.id,
        email: account.email,
        firstName: account.firstName || "",
        lastName: account.lastName || undefined,
        verified: account.verified,
        hasFamily: !!account.family,
        familySlug: account.family?.slug,
        familyName: account.family?.name,
        betaparticipant: account.betaparticipant,
        closed: account.closed,
        closedAt: account.closedAt?.toISOString(),
        planType: account.planType || undefined,
        planExpires: account.planExpires?.toISOString(),
        trialEnds: account.trialEnds?.toISOString(),
        subscriptionActive,
        subscriptionId: account.subscriptionId || undefined,
        accountStatus,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar status da conta:", error);
    return NextResponse.json<ApiResponse<AccountStatusResponse>>(
      {
        success: false,
        error: "Falha ao buscar status da conta",
      },
      { status: 500 }
    );
  }
}

export const GET = handler;
