import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { ApiResponse } from "../types";
import { CalendarEventType, RecurrencePattern } from "@prisma/client";
import { withAuthContext, AuthResult } from "../utils/auth";
import { toUTC, formatForResponse } from "../utils/timezone";
import { checkWritePermission } from "../utils/writeProtection";

interface CalendarEventResponse {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  type: CalendarEventType;
  location: string | null;
  color: string | null;
  recurring: boolean;
  recurrencePattern: RecurrencePattern | null;
  recurrenceEnd: string | null;
  customRecurrence: string | null;
  reminderTime: number | null;
  notificationSent: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  familyId: string | null;
  babies: Array<{ id: string; firstName: string; lastName: string }>;
  caretakers: Array<{ id: string; name: string; type: string | null }>;
  contacts: Array<{
    id: string;
    name: string;
    role: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    notes: string | null;
  }>;
  contactIds: string[];
}

interface CalendarEventCreate {
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  allDay: boolean;
  type: CalendarEventType;
  location?: string;
  color?: string;
  recurring: boolean;
  recurrencePattern?: RecurrencePattern;
  recurrenceEnd?: string;
  customRecurrence?: string;
  reminderTime?: number;
  babyIds: string[];
  caretakerIds: string[];
  contactIds: string[];
  familyId?: string;
}

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
    const id = searchParams.get("id");
    const babyId = searchParams.get("babyId");
    const caretakerId = searchParams.get("caretakerId");
    const contactId = searchParams.get("contactId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const typeParam = searchParams.get("type");
    const recurringParam = searchParams.get("recurring");
    const where: any = {
      deletedAt: null,
      familyId: userFamilyId,
    };
    if (id) {
      where.id = id;
    }
    if (babyId) {
      const baby = await prisma.baby.findFirst({
        where: {
          id: babyId,
          familyId: userFamilyId,
        },
        select: {
          familyId: true,
        },
      });
      if (!baby) {
        return NextResponse.json<ApiResponse<null>>(
          { success: false, error: "Bebê não encontrado nesta família." },
          { status: 404 }
        );
      }
      where.babies = {
        some: {
          babyId,
        },
      };
    }
    if (caretakerId) {
      where.caretakers = {
        some: {
          caretakerId,
        },
      };
    }
    if (contactId) {
      where.contacts = {
        some: {
          contactId,
        },
      };
    }
    if (startDate && endDate) {
      where.startTime = {
        gte: toUTC(startDate),
        lte: toUTC(endDate),
      };
    }
    if (
      typeParam &&
      Object.values(CalendarEventType).includes(typeParam as CalendarEventType)
    ) {
      where.type = typeParam;
    }
    if (
      recurringParam !== null &&
      ["true", "false"].includes(recurringParam as string)
    ) {
      where.recurring = recurringParam === "true";
    }
    if (id) {
      const event = await prisma.calendarEvent.findFirst({
        where: { id, familyId: userFamilyId },
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
      });
      if (!event || event.deletedAt) {
        return NextResponse.json<ApiResponse<CalendarEventResponse>>(
          {
            success: false,
            error: "Evento de calendário não encontrado ou acesso negado",
          },
          { status: 404 }
        );
      }
      const response: CalendarEventResponse = {
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
        contactIds: event.contacts.map((ce) => ce.contact.id),
      };
      return NextResponse.json<ApiResponse<CalendarEventResponse>>({
        success: true,
        data: response,
      });
    }
    const events = await prisma.calendarEvent.findMany({
      where,
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
    });
    const response: CalendarEventResponse[] = events.map((event) => ({
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
      contactIds: event.contacts.map((ce) => ce.contact.id),
    }));
    return NextResponse.json<ApiResponse<CalendarEventResponse[]>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao buscar eventos do calendário:", error);
    return NextResponse.json<ApiResponse<CalendarEventResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar eventos do calendário",
      },
      { status: 500 }
    );
  }
}

async function handlePost(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId: userFamilyId, caretakerId: userCaretakerId } =
      authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const body: CalendarEventCreate = await req.json();
    if (
      !body.title ||
      !body.startTime ||
      body.type === undefined ||
      body.allDay === undefined
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Campos obrigatórios ausentes" },
        { status: 400 }
      );
    }
    if (body.babyIds.length > 0) {
      const babiesCount = await prisma.baby.count({
        where: {
          id: { in: body.babyIds },
          familyId: userFamilyId,
        },
      });
      if (babiesCount !== body.babyIds.length) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Um ou mais bebês não encontrados nesta família.",
          },
          { status: 404 }
        );
      }
    }
    if (body.caretakerIds.length > 0) {
      const caretakersCount = await prisma.caretaker.count({
        where: {
          id: { in: body.caretakerIds },
          familyId: userFamilyId,
        },
      });
      if (caretakersCount !== body.caretakerIds.length) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Um ou mais cuidadores não encontrados nesta família.",
          },
          { status: 404 }
        );
      }
    }
    if (body.contactIds.length > 0) {
      const contactsCount = await prisma.contact.count({
        where: {
          id: { in: body.contactIds },
          familyId: userFamilyId,
        },
      });
      if (contactsCount !== body.contactIds.length) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Um ou mais contatos não encontrados nesta família.",
          },
          { status: 404 }
        );
      }
    }
    const startTimeUTC = toUTC(body.startTime);
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : null;
    const recurrenceEndUTC = body.recurrenceEnd
      ? toUTC(body.recurrenceEnd)
      : null;
    const event = await prisma.calendarEvent.create({
      data: {
        title: body.title,
        description: body.description || null,
        startTime: startTimeUTC,
        endTime: endTimeUTC,
        allDay: body.allDay,
        type: body.type,
        location: body.location || null,
        color: body.color || null,
        recurring: body.recurring,
        recurrencePattern: body.recurrencePattern || null,
        recurrenceEnd: recurrenceEndUTC || null,
        customRecurrence: body.customRecurrence || null,
        reminderTime: body.reminderTime || null,
        notificationSent: false,
        familyId: userFamilyId || null,
        babies: {
          create: body.babyIds.map((babyId) => ({ babyId })),
        },
        caretakers: {
          create: body.caretakerIds.map((caretakerId) => ({ caretakerId })),
        },
        contacts: {
          create: body.contactIds.map((contactId) => ({ contactId })),
        },
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
    });
    const response: CalendarEventResponse = {
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
      contactIds: event.contacts.map((ce) => ce.contact.id),
    };
    return NextResponse.json<ApiResponse<CalendarEventResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar evento de calendário:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao criar evento de calendário",
      },
      { status: 500 }
    );
  }
}

async function handlePut(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const body: Partial<CalendarEventCreate> = await req.json();
    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "ID do evento de calendário é obrigatório" },
        { status: 400 }
      );
    }
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingEvent || existingEvent.deletedAt) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Evento de calendário não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    if (body.babyIds && body.babyIds.length > 0) {
      const babiesCount = await prisma.baby.count({
        where: { id: { in: body.babyIds }, familyId: userFamilyId },
      });
      if (babiesCount !== body.babyIds.length) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Um ou mais bebês não encontrados nesta família.",
          },
          { status: 404 }
        );
      }
    }
    if (body.caretakerIds && body.caretakerIds.length > 0) {
      const caretakersCount = await prisma.caretaker.count({
        where: { id: { in: body.caretakerIds }, familyId: userFamilyId },
      });
      if (caretakersCount !== body.caretakerIds.length) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Um ou mais cuidadores não encontrados nesta família.",
          },
          { status: 404 }
        );
      }
    }
    if (body.contactIds && body.contactIds.length > 0) {
      const contactsCount = await prisma.contact.count({
        where: { id: { in: body.contactIds }, familyId: userFamilyId },
      });
      if (contactsCount !== body.contactIds.length) {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: "Um ou mais contatos não encontrados nesta família.",
          },
          { status: 404 }
        );
      }
    }
    const startTimeUTC = body.startTime ? toUTC(body.startTime) : undefined;
    const endTimeUTC = body.endTime ? toUTC(body.endTime) : undefined;
    const recurrenceEndUTC = body.recurrenceEnd
      ? toUTC(body.recurrenceEnd)
      : undefined;
    const updatedEvent = await prisma.$transaction(async (tx) => {
      await tx.babyEvent.deleteMany({ where: { eventId: id } });
      await tx.caretakerEvent.deleteMany({ where: { eventId: id } });
      await tx.contactEvent.deleteMany({ where: { eventId: id } });
      const updated = await tx.calendarEvent.update({
        where: { id },
        data: {
          title: body.title,
          description: body.description || null,
          startTime: startTimeUTC,
          endTime: endTimeUTC || null,
          allDay: body.allDay,
          type: body.type,
          location: body.location || null,
          color: body.color || null,
          recurring: body.recurring,
          recurrencePattern: body.recurrencePattern || null,
          recurrenceEnd: recurrenceEndUTC || null,
          customRecurrence: body.customRecurrence || null,
          reminderTime: body.reminderTime || null,
          familyId: userFamilyId || existingEvent.familyId,
          babies: body.babyIds
            ? {
                deleteMany: {},
                create: body.babyIds.map((babyId) => ({ babyId })),
              }
            : undefined,
          caretakers: body.caretakerIds
            ? {
                deleteMany: {},
                create: body.caretakerIds.map((caretakerId) => ({
                  caretakerId,
                })),
              }
            : undefined,
          contacts: body.contactIds
            ? {
                deleteMany: {},
                create: body.contactIds.map((contactId) => ({ contactId })),
              }
            : undefined,
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
      });
      return updated;
    });
    const response: CalendarEventResponse = {
      ...updatedEvent,
      startTime: formatForResponse(updatedEvent.startTime) || "",
      endTime: formatForResponse(updatedEvent.endTime),
      recurrenceEnd: formatForResponse(updatedEvent.recurrenceEnd),
      createdAt: formatForResponse(updatedEvent.createdAt) || "",
      updatedAt: formatForResponse(updatedEvent.updatedAt) || "",
      deletedAt: formatForResponse(updatedEvent.deletedAt),
      babies: updatedEvent.babies.map((be) => be.baby),
      caretakers: updatedEvent.caretakers.map((ce) => ce.caretaker),
      contacts: updatedEvent.contacts.map((ce) => ce.contact),
      contactIds: updatedEvent.contacts.map((ce) => ce.contact.id),
    };
    return NextResponse.json<ApiResponse<CalendarEventResponse>>({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("Erro ao atualizar evento de calendário:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao atualizar evento de calendário",
      },
      { status: 500 }
    );
  }
}

async function handleDelete(req: NextRequest, authContext: AuthResult) {
  const writeCheck = checkWritePermission(authContext);
  if (!writeCheck.allowed) {
    return writeCheck.response!;
  }
  try {
    const { familyId: userFamilyId } = authContext;
    if (!userFamilyId) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "Usuário não está associado a uma família." },
        { status: 403 }
      );
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, error: "ID do evento de calendário é obrigatório" },
        { status: 400 }
      );
    }
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id, familyId: userFamilyId },
    });
    if (!existingEvent) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: "Evento de calendário não encontrado ou acesso negado",
        },
        { status: 404 }
      );
    }
    await prisma.calendarEvent.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
    return NextResponse.json<ApiResponse<null>>({ success: true });
  } catch (error) {
    console.error("Erro ao excluir evento de calendário:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao excluir evento de calendário",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuthContext(
  handleGet as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const POST = withAuthContext(
  handlePost as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const PUT = withAuthContext(
  handlePut as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
export const DELETE = withAuthContext(
  handleDelete as (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<ApiResponse<any>>>
);
