import { NextResponse } from "next/server";
import { getSystemTimezone } from "../utils/timezone";

export async function GET() {
  try {
    const systemTimezone = getSystemTimezone();
    return NextResponse.json({
      success: true,
      data: {
        systemTimezone,
        currentTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Falha ao obter informações de fuso horário do sistema",
      },
      { status: 500 }
    );
  }
}
