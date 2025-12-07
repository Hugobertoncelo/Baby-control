"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "@/src/context/theme";
import SetupWizard from "@/src/components/SetupWizard";

export default function SetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        const unlockTime = localStorage.getItem("unlockTime");

        if (!authToken || !unlockTime) {
          router.push("/login?setup=true");
          return;
        }

        try {
          const payload = authToken.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));

          if (decodedPayload.exp && decodedPayload.exp * 1000 <= Date.now()) {
            localStorage.removeItem("authToken");
            localStorage.removeItem("unlockTime");
            localStorage.removeItem("caretakerId");
            router.push("/login?setup=true");
            return;
          }
        } catch (error) {
          console.error("Error parsing JWT token:", error);
          localStorage.removeItem("authToken");
          localStorage.removeItem("unlockTime");
          localStorage.removeItem("caretakerId");
          router.push("/login?setup=true");
          return;
        }

        setIsAuthenticated(true);

        const [familiesResponse, caretakerExistsResponse] = await Promise.all([
          fetch("/api/family/public-list"),
          fetch("/api/auth/caretaker-exists"),
        ]);

        const familiesData = await familiesResponse.json();
        const caretakerData = await caretakerExistsResponse.json();

        if (familiesData.success && caretakerData.success) {
          const families = familiesData.data || [];
          const hasCaretakers = caretakerData.data?.exists || false;

          if (
            families.length === 0 ||
            (families.length === 1 &&
              families[0].slug === "my-family" &&
              !hasCaretakers)
          ) {
            setNeedsSetup(true);
          } else {
            router.push("/");
          }
        } else {
          setNeedsSetup(true);
        }
      } catch (error) {
        console.error("Error checking setup status:", error);
        setNeedsSetup(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkSetupStatus();
  }, [router]);

  const handleSetupComplete = (family: {
    id: string;
    name: string;
    slug: string;
  }) => {
    console.log("Configuração concluída para a família:", family);

    const authToken = localStorage.getItem("authToken");
    let isAccountAuth = false;

    if (authToken) {
      try {
        const base64Url = authToken.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join("")
        );

        const decoded = JSON.parse(jsonPayload);
        isAccountAuth = decoded.isAccountAuth === true;
      } catch (error) {
        console.error("Erro ao verificar autenticação da conta:", error);
      }
    }

    if (isAccountAuth) {
      router.push(`/${family.slug}`);
    } else {
      router.push(`/${family.slug}/login`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Verificando status da configuração...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!needsSetup) {
    return null;
  }

  return (
    <ThemeProvider>
      <SetupWizard onComplete={handleSetupComplete} initialSetup={true} />
    </ThemeProvider>
  );
}
