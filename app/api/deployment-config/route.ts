import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../types";

export async function GET(
  req: NextRequest
): Promise<NextResponse<ApiResponse<any>>> {
  try {
    const deploymentMode = process.env.DEPLOYMENT_MODE || "selfhosted";
    const config = {
      deploymentMode,
      enableAccounts: process.env.ENABLE_ACCOUNTS === "true",
      allowAccountRegistration:
        process.env.ALLOW_ACCOUNT_REGISTRATION === "true",
      betaEnabled: process.env.BETA === "1",
    };
    return NextResponse.json<ApiResponse<typeof config>>({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Erro ao buscar configuração de implantação:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao buscar configuração de implantação",
      },
      { status: 500 }
    );
  }
}
