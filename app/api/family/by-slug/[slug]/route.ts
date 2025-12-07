import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { ApiResponse } from "@/app/api/utils/auth";
import { validateSlug } from "@/app/api/utils/slug-validation";
import { Family } from "@prisma/client";

interface FamilyWithAccountStatus extends Family {
  accountStatus?: {
    isExpired: boolean;
    isTrialExpired: boolean;
    expirationDate?: string;
    betaparticipant: boolean;
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ApiResponse<FamilyWithAccountStatus | null>>> {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json(
        {
          success: false,
          error: "Slug da família é obrigatório",
        },
        { status: 400 }
      );
    }
    const validation = validateSlug(slug);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
          data: null,
        },
        { status: 400 }
      );
    }
    const family = await prisma.family.findFirst({
      where: {
        slug: slug,
      },
      include: {
        account: {
          select: {
            id: true,
            betaparticipant: true,
            trialEnds: true,
            planType: true,
            planExpires: true,
          },
        },
      },
    });
    if (!family) {
      return NextResponse.json({ success: false, data: null }, { status: 200 });
    }
    let familyWithStatus: FamilyWithAccountStatus = { ...family };
    if (family.account) {
      const account = family.account;
      const now = new Date();
      let isExpired = false;
      let isTrialExpired = false;
      let expirationDate: string | undefined;
      if (account.betaparticipant) {
        familyWithStatus.accountStatus = {
          isExpired: false,
          isTrialExpired: false,
          betaparticipant: true,
        };
      } else {
        if (account.trialEnds) {
          const trialEndDate = new Date(account.trialEnds);
          if (now > trialEndDate) {
            isTrialExpired = true;
            isExpired = true;
            expirationDate = account.trialEnds.toISOString();
          }
        } else if (account.planExpires) {
          const planEndDate = new Date(account.planExpires);
          if (now > planEndDate) {
            isExpired = true;
            expirationDate = account.planExpires.toISOString();
          }
        } else if (!account.planType) {
          isExpired = true;
        }
        familyWithStatus.accountStatus = {
          isExpired,
          isTrialExpired,
          expirationDate,
          betaparticipant: false,
        };
      }
    }
    return NextResponse.json({
      success: true,
      data: familyWithStatus,
    });
  } catch (error) {
    console.error("Erro ao buscar família pelo slug:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao buscar família",
        data: null,
      },
      { status: 500 }
    );
  }
}
