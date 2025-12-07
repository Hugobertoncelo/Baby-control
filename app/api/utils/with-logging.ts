import { NextRequest, NextResponse } from "next/server";
import { logApiCall, getClientInfo, ApiLogEntry } from "./api-logger";
import { AuthResult } from "./auth";

export function withLogging<T = any>(
  handler: (
    req: NextRequest,
    authContext?: AuthResult
  ) => Promise<NextResponse<T>>
) {
  return async (
    req: NextRequest,
    authContext?: AuthResult
  ): Promise<NextResponse<T>> => {
    const startTime = Date.now();
    const { ip, userAgent } = getClientInfo(req);
    const url = new URL(req.url);
    let requestBody: any = null;
    let response: NextResponse<T>;
    let status: number | undefined;
    let error: string | undefined;
    let responseBody: any = null;
    try {
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        try {
          const clonedReq = req.clone();
          requestBody = await clonedReq.json();
        } catch {}
      }
      response = await handler(req, authContext);
      status = response.status;
      try {
        const clonedRes = response.clone();
        responseBody = await clonedRes.json();
      } catch {}
      return response;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      status = 500;
      throw err;
    } finally {
      if (process.env.ENABLE_LOG === "true") {
        const durationMs = Date.now() - startTime;
        const logEntry: ApiLogEntry = {
          method: req.method,
          path: url.pathname,
          status,
          durationMs,
          ip,
          userAgent,
          caretakerId: authContext?.caretakerId ?? undefined,
          familyId: authContext?.familyId ?? undefined,
          error,
          requestBody,
          responseBody,
        };
        logApiCall(logEntry).catch((logError) => {
          console.error("Falha ao registrar chamada de API:", logError);
        });
      }
    }
  };
}

export function withAuthAndLogging<T = any>(
  handler: (
    req: NextRequest,
    authContext: AuthResult
  ) => Promise<NextResponse<T>>,
  authWrapper: (
    handler: (
      req: NextRequest,
      authContext: AuthResult
    ) => Promise<NextResponse<T>>
  ) => (req: NextRequest) => Promise<NextResponse<T>>
) {
  return authWrapper((req: NextRequest, authContext: AuthResult) => {
    return withLogging<T>((reqInner) => handler(reqInner, authContext))(
      req,
      authContext
    );
  });
}
