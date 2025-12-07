import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../../types";
import { invalidateToken } from "../../utils/auth";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    let token: string | undefined;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
      if (token) {
        invalidateToken(token);
      }
    }
    const response = NextResponse.json<ApiResponse<{ success: boolean }>>(
      {
        success: true,
        data: { success: true },
      },
      { status: 200 }
    );
    response.cookies.set("caretakerId", "", {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    console.error("Erro ao sair:", error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: "Falha ao sair",
      },
      { status: 500 }
    );
  }
}
