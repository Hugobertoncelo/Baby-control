"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ThemeProvider } from "@/src/context/theme";
import { FamilyProvider } from "@/src/context/family";
import { DeploymentProvider } from "@/app/context/deployment";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const params = useParams();
  const familySlug = params?.slug as string;

  useEffect(() => {
    const validateSlug = async () => {
      if (!familySlug) return;

      try {
        const response = await fetch(
          `/api/family/by-slug/${encodeURIComponent(familySlug)}`
        );
        const data = await response.json();

        if (!data.success || !data.data) {
          console.log(
            `Slug da família "${familySlug}" não encontrada na rota de autenticação, redirecionando para a página inicial...`
          );
          router.push("/");
        }
      } catch (error) {
        console.error(
          "Erro ao validar o slug da família no layout de autenticação:",
          error
        );
        router.push("/");
      }
    };

    validateSlug();
  }, [familySlug, router]);

  return (
    <DeploymentProvider>
      <ThemeProvider>
        <FamilyProvider>{children}</FamilyProvider>
      </ThemeProvider>
    </DeploymentProvider>
  );
}
