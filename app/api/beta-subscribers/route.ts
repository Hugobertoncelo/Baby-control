import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import {
  ApiResponse,
  BetaSubscriberResponse,
  BetaSubscriberUpdate,
} from "../types";
import { withSysAdminAuth } from "../utils/auth";
import { formatForResponse } from "../utils/timezone";

async function getHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<BetaSubscriberResponse[]>>> {
  try {
    const subscribers = await prisma.betaSubscriber.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    const subscriberResponses: BetaSubscriberResponse[] = subscribers.map(
      (sub) => ({
        id: sub.id,
        email: sub.email,
        firstName: sub.firstName,
        lastName: sub.lastName,
        isOptedIn: sub.isOptedIn,
        optedOutAt: formatForResponse(sub.optedOutAt),
        source: sub.source,
        createdAt: formatForResponse(sub.createdAt) || "",
        updatedAt: formatForResponse(sub.updatedAt) || "",
        deletedAt: formatForResponse(sub.deletedAt),
      })
    );
    return NextResponse.json({
      success: true,
      data: subscriberResponses,
    });
  } catch (error) {
    console.error("Erro ao buscar inscritos beta:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao buscar inscritos beta",
      },
      { status: 500 }
    );
  }
}

async function putHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<BetaSubscriberResponse>>> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do inscrito é obrigatório",
        },
        { status: 400 }
      );
    }
    const body: BetaSubscriberUpdate = await req.json();
    const updateData: { isOptedIn: boolean; optedOutAt?: Date } = {
      isOptedIn: body.isOptedIn!,
    };
    if (body.isOptedIn === false) {
      updateData.optedOutAt = new Date();
    }
    const subscriber = await prisma.betaSubscriber.update({
      where: { id },
      data: updateData,
    });
    const response: BetaSubscriberResponse = {
      id: subscriber.id,
      email: subscriber.email,
      firstName: subscriber.firstName,
      lastName: subscriber.lastName,
      isOptedIn: subscriber.isOptedIn,
      optedOutAt: formatForResponse(subscriber.optedOutAt),
      source: subscriber.source,
      createdAt: formatForResponse(subscriber.createdAt) || "",
      updatedAt: formatForResponse(subscriber.updatedAt) || "",
      deletedAt: formatForResponse(subscriber.deletedAt),
    };
    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar inscrito beta:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao atualizar inscrito beta",
      },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  req: NextRequest
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do inscrito é obrigatório",
        },
        { status: 400 }
      );
    }
    await prisma.betaSubscriber.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isOptedIn: false,
        optedOutAt: new Date(),
      },
    });
    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error("Erro ao excluir inscrito beta:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao excluir inscrito beta",
      },
      { status: 500 }
    );
  }
}

export const GET = withSysAdminAuth(getHandler);
export const PUT = withSysAdminAuth(putHandler);
export const DELETE = withSysAdminAuth(deleteHandler);
