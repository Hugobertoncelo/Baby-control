"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/src/context/theme";
import SetupWizard from "@/src/components/SetupWizard";

type SetupPageWithTokenProps = {
  params: Promise<{
    token: string;
  }>;
};

export default function SetupPageWithToken({
  params,
}: SetupPageWithTokenProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        const tokenParam = resolvedParams.token;
        setToken(tokenParam);

        const authToken = localStorage.getItem("authToken");
        const unlockTime = localStorage.getItem("unlockTime");

        if (!authToken || !unlockTime) {
          router.push(`/login?setup=token&token=${tokenParam}`);
          return;
        }

        try {
          const payload = authToken.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));

          if (decodedPayload.exp && decodedPayload.exp * 1000 <= Date.now()) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("unlockTime");
            localStorage.removeItem("caretakerId");
            router.push(`/login?setup=token&token=${tokenParam}`);
            return;
          }

          if (
            decodedPayload.isSetupAuth &&
            decodedPayload.setupToken === tokenParam
          ) {
            setIsAuthenticated(true);
          } else if (decodedPayload.isSysAdmin) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem("authToken");
            localStorage.removeItem("unlockTime");
            localStorage.removeItem("caretakerId");
            router.push(`/login?setup=token&token=${tokenParam}`);
            return;
          }
        } catch (error) {
          console.error("Error parsing JWT token:", error);
          localStorage.removeItem("authToken");
          localStorage.removeItem("unlockTime");
          localStorage.removeItem("caretakerId");
          router.push(`/login?setup=token&token=${tokenParam}`);
          return;
        }

        setIsValidToken(true);
      } catch (error) {
        console.error(
          "Error resolving params or setting up token page:",
          error
        );
        setError("Failed to initialize setup page");
      } finally {
        setIsLoading(false);
      }
    };

    resolveParams();
  }, [mounted, params, router]);

  const handleSetupComplete = (family: {
    id: string;
    name: string;
    slug: string;
  }) => {
    console.log("Token-based setup completed for family:", family);
    router.push(`/${family.slug}/login`);
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>
            {!mounted
              ? "Carregando..."
              : "Validando convite de configuração..."}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Erro de configuração
              </h2>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Voltar para Home
              </button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isValidToken) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Validando convite...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SetupWizard
        onComplete={handleSetupComplete}
        token={token || undefined}
      />
    </ThemeProvider>
  );
}
