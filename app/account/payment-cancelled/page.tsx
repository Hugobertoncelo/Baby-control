"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import "../account.css";

export default function PaymentCancelledPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/account");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="payment-cancelled-layout min-h-screen bg-gradient-to-br from-gray-50 to-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center pt-8">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gray-400 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <Label className="text-3xl font-bold text-gray-900 mb-4 block">
            Pagamento Cancelado
          </Label>
          <p className="text-lg text-gray-600 mb-6">
            Seu pagamento foi cancelado. Nenhuma cobrança foi realizada em sua
            conta.
          </p>
          <p className="text-gray-500 mb-8">
            Se você teve algum problema durante o pagamento ou tem dúvidas sobre
            nossos preços, não hesite em entrar em contato com nossa equipe de
            suporte.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-700 font-medium">
              Redirecionando para sua conta em {countdown} segundo
              {countdown !== 1 ? "s" : ""}...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
              <div
                className="bg-gray-600 h-2 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((10 - countdown) / 10) * 100}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            <Button onClick={() => router.push("/account")} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Voltar para Conta
            </Button>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
