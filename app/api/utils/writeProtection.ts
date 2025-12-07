import { NextResponse } from "next/server";
import { AuthResult } from "./auth";
import type { ApiResponse } from "../types";

export type WriteProtectionResponse = {
  allowed: boolean;
  response?: NextResponse<ApiResponse<any>>;
};

export function checkWritePermission(
  authContext: AuthResult
): WriteProtectionResponse {
  if (!authContext.authenticated) {
    return {
      allowed: false,
      response: NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: authContext.error || "Autenticação obrigatória",
        },
        { status: 401 }
      ),
    };
  }

  if (authContext.isExpired) {
    const { trialEnds, planExpires } = authContext;
    let expirationType: "TRIAL_EXPIRED" | "PLAN_EXPIRED" | "NO_PLAN" =
      "NO_PLAN";
    let expirationDate: string | undefined;
    if (trialEnds) {
      expirationType = "TRIAL_EXPIRED";
      expirationDate = trialEnds;
    } else if (planExpires) {
      expirationType = "PLAN_EXPIRED";
      expirationDate = planExpires;
    }
    let errorMessage = "Sua conta expirou. Faça o upgrade para continuar.";
    if (expirationType === "TRIAL_EXPIRED") {
      errorMessage =
        "Seu período de teste gratuito terminou. Faça o upgrade para continuar registrando.";
    } else if (expirationType === "PLAN_EXPIRED") {
      errorMessage = "Sua assinatura expirou. Renove para continuar.";
    } else if (expirationType === "NO_PLAN") {
      errorMessage =
        "Nenhuma assinatura ativa encontrada. Assine para continuar.";
    }
    return {
      allowed: false,
      response: NextResponse.json<ApiResponse<any>>(
        {
          success: false,
          error: errorMessage,
          data: {
            expirationInfo: {
              type: expirationType,
              date: expirationDate,
              familySlug: authContext.familySlug,
            },
          },
        },
        { status: 403 }
      ),
    };
  }
  return {
    allowed: true,
  };
}
