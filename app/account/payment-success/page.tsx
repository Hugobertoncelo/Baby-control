"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Home, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import "../account.css";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(
    null
  );

  const getRedirectUrl = useCallback((): string => {
    try {
      const authToken = localStorage.getItem("authToken");
      if (authToken) {
        const payload = authToken.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));
        const familySlug = decodedPayload.familySlug;
        if (familySlug) {
          return `/${familySlug}/log-entry`;
        }
      }
    } catch (error) {}
    return "/";
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      if (!sessionId) {
        setVerificationError("Nenhum ID de sessão fornecido");
        setVerifying(false);
        return;
      }
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await fetch("/api/accounts/payments/verify-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json();
        if (!data.success) {
          setVerificationError(data.error || "Falha ao verificar o pagamento");
        }
      } catch (error) {
        setVerificationError("Falha ao verificar o pagamento");
      } finally {
        setVerifying(false);
      }
    };
    verifySession();
  }, [sessionId]);

  useEffect(() => {
    if (verifying) {
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [verifying]);

  useEffect(() => {
    if (countdown === 0) {
      router.push(getRedirectUrl());
    }
  }, [countdown, router, getRedirectUrl]);

  return (
    <div className="payment-success-layout min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center pt-8">
          {verifying ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                </div>
              </div>
              <Label className="text-3xl font-bold text-gray-900 mb-4 block">
                Verificando Pagamento...
              </Label>
              <p className="text-lg text-gray-600 mb-6">
                Aguarde enquanto confirmamos seu pagamento.
              </p>
            </>
          ) : verificationError ? (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-amber-600" />
                </div>
              </div>
              <Label className="text-3xl font-bold text-gray-900 mb-4 block">
                Problema na Verificação do Pagamento
              </Label>
              <p className="text-lg text-gray-600 mb-6">{verificationError}</p>
              <p className="text-sm text-gray-500 mb-6">
                Seu pagamento foi processado, mas houve um problema ao ativar
                sua conta. Por favor, entre em contato com o suporte ou tente
                sair e entrar novamente.
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
              <Label className="text-3xl font-bold text-gray-900 mb-4 block">
                Pagamento Realizado com Sucesso!
              </Label>
              <p className="text-lg text-gray-600 mb-6">
                Obrigado pela sua compra. Sua assinatura foi ativada.
              </p>
              {sessionId && (
                <p className="text-sm text-gray-500 mb-6">
                  ID de Confirmação: {sessionId.substring(0, 20)}...
                </p>
              )}
            </>
          )}
          {!verifying && (
            <>
              <div className="bg-teal-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-4xl font-bold text-teal-600">
                    {countdown}
                  </div>
                </div>
                <p className="text-teal-700 font-medium mb-3">
                  Redirecionando para a página inicial em {countdown} segundo
                  {countdown !== 1 ? "s" : ""}...
                </p>
                <div className="w-full bg-teal-200 rounded-full h-3">
                  <div
                    className="bg-teal-600 h-3 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - countdown) / 5) * 100}%` }}
                  />
                </div>
              </div>
              <Button
                onClick={() => router.push(getRedirectUrl())}
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Ir para a Página Inicial Agora
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="payment-success-layout min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="text-center pt-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-teal-600 animate-spin" />
                </div>
              </div>
              <Label className="text-3xl font-bold text-gray-900 mb-4 block">
                Carregando...
              </Label>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
