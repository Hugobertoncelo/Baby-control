import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse } from "../types";
import { withAuthContext, AuthResult } from "../utils/auth";
import { formatForResponse } from "../utils/timezone";

async function handleGet(req: NextRequest, authContext: AuthResult) {
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const babyId = searchParams.get("babyId");
    const limit = Number(searchParams.get("limit")) || 5;

    if (!babyId) {
      return NextResponse.json<ApiResponse<any>>(
        {
          success: false,
          error: "ID do bebê é obrigatório",
        },
        { status: 400 }
      );
    }

    const baby = await prisma.baby.findFirst({
      where: { id: babyId, familyId: userFamilyId },
    });

    if (!baby) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Bebê não encontrado nesta família." },
        { status: 404 }
      );
    }

    const now = new Date();

    const events = await prisma.calendarEvent.findMany({
      where: {
        babies: {
          some: {
            babyId,
          },
        },
        startTime: {
          gte: now,
        },
        deletedAt: null,
        familyId: userFamilyId,
      },
      include: {
        babies: {
          include: {
            baby: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        caretakers: {
          include: {
            caretaker: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        contacts: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: limit,
    });

    const formattedEvents = events.map((event) => ({
      ...event,
      startTime: formatForResponse(event.startTime) || "",
      endTime: formatForResponse(event.endTime),
      recurrenceEnd: formatForResponse(event.recurrenceEnd),
      createdAt: formatForResponse(event.createdAt) || "",
      updatedAt: formatForResponse(event.updatedAt) || "",
      deletedAt: formatForResponse(event.deletedAt),
      babies: event.babies.map((be) => be.baby),
      caretakers: event.caretakers.map((ce) => ce.caretaker),
      contacts: event.contacts.map((ce) => ce.contact),
    }));

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: formattedEvents,
    });
  } catch (error) {
    console.error("Erro ao buscar próximos eventos:", error);
    return NextResponse.json<ApiResponse<any>>(
      {
        success: false,
        error: "Falha ao buscar próximos eventos",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(handleGet);
