"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginSecurity from "@/src/components/LoginSecurity";
import { useTheme } from "@/src/context/theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { FamilyResponse } from "@/app/api/types";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [tokenPassword, setTokenPassword] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [tokenLoading, setTokenLoading] = useState(false);
  const [showTokenPassword, setShowTokenPassword] = useState(false);

  const setupType = searchParams.get("setup");
  const setupToken = searchParams.get("token");
  const isSetupFlow = setupType === "true";
  const isTokenSetupFlow = setupType === "token" && setupToken;

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/family/public-list");
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setFamilies(data.data);
            if (data.data.length === 1) {
              setSelectedFamily(data.data[0].slug);
            }
          }
        }
      } catch (error) {
        console.error("Erro ao carregar famílias:", error);
      } finally {
        setLoading(false);
      }
    };
    if (!isTokenSetupFlow) {
      loadFamilies();
    } else {
      setLoading(false);
    }
  }, [isTokenSetupFlow]);

  const handleTokenAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenPassword.trim()) {
      setTokenError("A senha é obrigatória");
      return;
    }
    if (!setupToken) {
      setTokenError("Token de configuração não encontrado");
      return;
    }
    try {
      setTokenLoading(true);
      setTokenError("");
      const response = await fetch("/api/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: setupToken,
          password: tokenPassword,
        }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        localStorage.setItem("authToken", data.data.token);
        localStorage.setItem("unlockTime", Date.now().toString());
        router.push(`/setup/${setupToken}`);
      } else {
        setTokenError(data.error || "Senha inválida");
        setTokenPassword("");
      }
    } catch (error) {
      console.error("Erro de autenticação do token:", error);
      setTokenError("Falha na autenticação. Tente novamente.");
      setTokenPassword("");
    } finally {
      setTokenLoading(false);
    }
  };

  const handleUnlock = (caretakerId?: string) => {
    if (isTokenSetupFlow) {
      router.push(`/setup/${setupToken}`);
    } else if (isSetupFlow) {
      router.push("/setup");
    } else {
      if (selectedFamily) {
        router.push(`/${selectedFamily}/log-entry`);
      } else {
        router.push("/family-select");
      }
    }
  };

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const unlockTime = localStorage.getItem("unlockTime");
    if (authToken && unlockTime) {
      try {
        const tokenPayload = JSON.parse(atob(authToken.split(".")[1]));
        const now = Date.now() / 1000;
        if (tokenPayload.exp > now) {
          if (isTokenSetupFlow) {
            router.push(`/setup/${setupToken}`);
          } else if (isSetupFlow) {
            router.push("/setup");
          } else {
            if (selectedFamily) {
              router.push(`/${selectedFamily}/log-entry`);
            } else {
              router.push("/family-select");
            }
          }
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("unlockTime");
          localStorage.removeItem("caretakerId");
        }
      } catch (error) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("unlockTime");
        localStorage.removeItem("caretakerId");
      }
    }
  }, [router, selectedFamily, isSetupFlow, isTokenSetupFlow, setupToken]);

  const handleFamilyChange = (value: string) => {
    setSelectedFamily(value);
  };

  if (isTokenSetupFlow) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-full max-w-md mx-auto mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Convite de Configuração da Família
          </h2>
          <p className="text-blue-700 dark:text-blue-300">
            Por favor, insira a senha fornecida com este convite de configuração
            para continuar.
          </p>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Autenticação da Configuração
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTokenAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tokenPassword">Senha da Configuração</Label>
                <div className="relative">
                  <Input
                    id="tokenPassword"
                    type={showTokenPassword ? "text" : "password"}
                    value={tokenPassword}
                    onChange={(e) => {
                      setTokenPassword(e.target.value);
                      setTokenError("");
                    }}
                    placeholder="Digite a senha de configuração"
                    disabled={tokenLoading}
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowTokenPassword(!showTokenPassword)}
                    disabled={tokenLoading}
                  >
                    {showTokenPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              {tokenError && (
                <div className="text-red-500 text-sm">{tokenError}</div>
              )}
              <Button
                type="submit"
                className="w-full"
                disabled={tokenLoading || !tokenPassword.trim()}
              >
                {tokenLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Autenticando...
                  </>
                ) : (
                  "Continuar para Configuração"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {isSetupFlow && (
        <div className="w-full max-w-md mx-auto mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">
            Configuração Inicial Necessária
          </h2>
          <p className="text-blue-700 dark:text-blue-300">
            Por favor, autentique-se com o PIN do sistema para concluir a
            configuração inicial.
          </p>
        </div>
      )}
      {!isSetupFlow && families.length > 1 && (
        <div className="w-full max-w-md mx-auto mb-4 p-4">
          <label className="block text-sm font-medium mb-2">
            Selecione a família
          </label>
          <Select
            value={selectedFamily || ""}
            onValueChange={handleFamilyChange}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione uma família" />
            </SelectTrigger>
            <SelectContent>
              {families.map((f) => (
                <SelectItem key={f.id} value={f.slug}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <LoginSecurity
        onUnlock={handleUnlock}
        familySlug={isSetupFlow ? undefined : selectedFamily || undefined}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Carregando...</p>
          </div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
