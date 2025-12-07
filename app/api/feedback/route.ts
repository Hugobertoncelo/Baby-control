import { NextRequest, NextResponse } from "next/server";
import prisma from "../db";
import { withAuthContext, ApiResponse } from "../utils/auth";
import { FeedbackCreate, FeedbackResponse } from "../types";
import { sendFeedbackConfirmationEmail } from "../utils/account-emails";

async function handlePost(
  req: NextRequest,
  authContext: any
): Promise<NextResponse<ApiResponse<FeedbackResponse>>> {
  try {
    const body: FeedbackCreate = await req.json();
    const { subject, message, familyId, submitterName, submitterEmail } = body;

    if (!subject || !message) {
      return NextResponse.json<ApiResponse<FeedbackResponse>>(
        {
          success: false,
          error: "Assunto e mensagem são obrigatórios",
        },
        { status: 400 }
      );
    }

    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject || !trimmedMessage) {
      return NextResponse.json<ApiResponse<FeedbackResponse>>(
        {
          success: false,
          error: "Assunto e mensagem não podem estar vazios",
        },
        { status: 400 }
      );
    }

    let finalFamilyId = familyId || authContext.familyId || null;
    let accountId: string | null = null;
    let caretakerId: string | null = null;
    let finalSubmitterName = submitterName || "Usuário Anônimo";
    let finalSubmitterEmail = submitterEmail || null;

    if (authContext.isAccountAuth && authContext.accountId) {
      accountId = authContext.accountId;
      finalSubmitterEmail = authContext.accountEmail || finalSubmitterEmail;
      if (!submitterName && authContext.accountEmail) {
        finalSubmitterName = authContext.accountEmail.split("@")[0];
      }
    } else if (authContext.caretakerId) {
      caretakerId = authContext.caretakerId;
      if (!submitterName) {
        try {
          const caretaker = await prisma.caretaker.findUnique({
            where: { id: authContext.caretakerId },
            select: { name: true },
          });
          if (caretaker) {
            finalSubmitterName = caretaker.name;
          }
        } catch (error) {
          console.error("Erro ao buscar nome do cuidador:", error);
        }
      }
    }

    const feedback = await prisma.feedback.create({
      data: {
        subject: trimmedSubject,
        message: trimmedMessage,
        familyId: finalFamilyId,
        accountId: accountId,
        caretakerId: caretakerId,
        submitterName: finalSubmitterName,
        submitterEmail: finalSubmitterEmail,
        viewed: false,
      },
    });

    if (finalSubmitterEmail && accountId) {
      try {
        await sendFeedbackConfirmationEmail(
          finalSubmitterEmail,
          finalSubmitterName,
          trimmedSubject
        );
        console.log(
          "E-mail de confirmação de feedback enviado para:",
          finalSubmitterEmail
        );
      } catch (emailError) {
        console.error(
          "Erro ao enviar e-mail de confirmação de feedback:",
          emailError
        );
      }
    }

    const response: FeedbackResponse = {
      id: feedback.id,
      subject: feedback.subject,
      message: feedback.message,
      submittedAt: feedback.submittedAt.toISOString(),
      viewed: feedback.viewed,
      submitterName: feedback.submitterName,
      submitterEmail: feedback.submitterEmail,
      familyId: feedback.familyId,
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
      deletedAt: feedback.deletedAt ? feedback.deletedAt.toISOString() : null,
    };

    return NextResponse.json<ApiResponse<FeedbackResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar feedback:", error);
    return NextResponse.json<ApiResponse<FeedbackResponse>>(
      {
        success: false,
        error: "Falha ao enviar feedback",
      },
      { status: 500 }
    );
  }
}

async function handleGet(
  req: NextRequest,
  authContext: any
): Promise<NextResponse<ApiResponse<FeedbackResponse[]>>> {
  try {
    if (!authContext.isSysAdmin && authContext.caretakerRole !== "ADMIN") {
      return NextResponse.json<ApiResponse<FeedbackResponse[]>>(
        {
          success: false,
          error: "Acesso de administrador necessário",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const viewed = searchParams.get("viewed");
    const familyId = searchParams.get("familyId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {};
    if (viewed !== null) {
      where.viewed = viewed === "true";
    }
    if (familyId) {
      where.familyId = familyId;
    }
    if (!authContext.isSysAdmin && authContext.familyId) {
      where.familyId = authContext.familyId;
    }

    const feedback = await prisma.feedback.findMany({
      where,
      orderBy: {
        submittedAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    const response: FeedbackResponse[] = feedback.map((item: any) => ({
      id: item.id,
      subject: item.subject,
      message: item.message,
      submittedAt: item.submittedAt.toISOString(),
      viewed: item.viewed,
      submitterName: item.submitterName,
      submitterEmail: item.submitterEmail,
      familyId: item.familyId,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      deletedAt: item.deletedAt ? item.deletedAt.toISOString() : null,
    }));

    return NextResponse.json<ApiResponse<FeedbackResponse[]>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao buscar feedbacks:", error);
    return NextResponse.json<ApiResponse<FeedbackResponse[]>>(
      {
        success: false,
        error: "Falha ao buscar feedbacks",
      },
      { status: 500 }
    );
  }
}

async function handlePut(
  req: NextRequest,
  authContext: any
): Promise<NextResponse<ApiResponse<FeedbackResponse>>> {
  try {
    if (!authContext.isSysAdmin && authContext.caretakerRole !== "ADMIN") {
      return NextResponse.json<ApiResponse<FeedbackResponse>>(
        {
          success: false,
          error: "Acesso de administrador necessário",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json<ApiResponse<FeedbackResponse>>(
        {
          success: false,
          error: "ID do feedback é obrigatório",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { viewed } = body;

    const feedback = await prisma.feedback.update({
      where: { id },
      data: {
        viewed: viewed !== undefined ? viewed : undefined,
        updatedAt: new Date(),
      },
    });

    const response: FeedbackResponse = {
      id: feedback.id,
      subject: feedback.subject,
      message: feedback.message,
      submittedAt: feedback.submittedAt.toISOString(),
      viewed: feedback.viewed,
      submitterName: feedback.submitterName,
      submitterEmail: feedback.submitterEmail,
      familyId: feedback.familyId,
      createdAt: feedback.createdAt.toISOString(),
      updatedAt: feedback.updatedAt.toISOString(),
      deletedAt: feedback.deletedAt ? feedback.deletedAt.toISOString() : null,
    };

    return NextResponse.json<ApiResponse<FeedbackResponse>>(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar feedback:", error);
    return NextResponse.json<ApiResponse<FeedbackResponse>>(
      {
        success: false,
        error: "Falha ao atualizar feedback",
      },
      { status: 500 }
    );
  }
}

export const POST = withAuthContext(handlePost);
export const GET = withAuthContext(handleGet);
export const PUT = withAuthContext(handlePut);
