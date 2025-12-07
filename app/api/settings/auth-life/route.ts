import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../../types";

export async function GET(req: NextRequest) {
  const authLife = parseInt(process.env.AUTH_LIFE || "1800", 10);
  return NextResponse.json<ApiResponse<number>>({
    success: true,
    data: authLife,
  });
}
