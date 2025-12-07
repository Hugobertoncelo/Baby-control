import { NextRequest, NextResponse } from "next/server";
import prisma from "../../db";
import { ApiResponse } from "../../types";

export async function GET(req: NextRequest) {
  try {
    let appConfig = await prisma.appConfig.findFirst();
    if (!appConfig) {
      appConfig = await prisma.appConfig.create({
        data: {
          adminPass: "admin",
          rootDomain: "localhost",
          enableHttps: false,
        },
      });
    }
    const publicConfig = {
      rootDomain: appConfig.rootDomain,
      enableHttps: appConfig.enableHttps,
    };
    return NextResponse.json<ApiResponse<typeof publicConfig>>({
      success: true,
      data: publicConfig,
    });
  } catch (error) {
    console.error("Erro ao buscar configuração pública do app:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao buscar configuração do aplicativo",
      },
      { status: 500 }
    );
  }
}
