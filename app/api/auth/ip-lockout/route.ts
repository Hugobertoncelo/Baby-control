import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../../types";
import {
  checkIpLockout,
  recordFailedAttempt,
  resetFailedAttempts,
} from "../../utils/ip-lockout";

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const { locked, remainingTime } = checkIpLockout(ip);
  return NextResponse.json<
    ApiResponse<{ locked: boolean; remainingTime: number }>
  >({
    success: true,
    data: { locked, remainingTime },
  });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const { locked, remainingTime } = recordFailedAttempt(ip);
  return NextResponse.json<
    ApiResponse<{ locked: boolean; remainingTime: number }>
  >({
    success: true,
    data: { locked, remainingTime },
  });
}

export async function DELETE(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  resetFailedAttempts(ip);
  return NextResponse.json<ApiResponse<null>>({
    success: true,
  });
}
