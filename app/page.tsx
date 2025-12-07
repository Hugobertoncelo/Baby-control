"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FamilyResponse } from "./api/types";
import { ThemeProvider } from "@/src/context/theme";
import ComingSoon from "./home/page";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [deploymentMode, setDeploymentMode] = useState<string>("selfhosted");

  useEffect(() => {
    const checkDeploymentMode = async () => {
      try {
        setLoading(true);

        const configResponse = await fetch("/api/deployment-config");
        const configData = await configResponse.json();

        if (configData.success && configData.data?.deploymentMode === "saas") {
          setDeploymentMode("saas");
          setLoading(false);
          return;
        }

        setDeploymentMode("selfhosted");

        const [familiesResponse, caretakerExistsResponse] = await Promise.all([
          fetch("/api/family/public-list"),
          fetch("/api/auth/caretaker-exists"),
        ]);

        const familiesData = await familiesResponse.json();
        const caretakerData = await caretakerExistsResponse.json();

        if (familiesData.success && Array.isArray(familiesData.data)) {
          const familiesList = familiesData.data;
          setFamilies(familiesList);

          const hasCaretakers =
            caretakerData.success && caretakerData.data?.exists;
          const needsSetup =
            familiesList.length === 0 ||
            (familiesList.length === 1 &&
              familiesList[0].slug === "my-family" &&
              !hasCaretakers);

          if (needsSetup) {
            router.push("/login?setup=true");
          } else if (familiesList.length === 1) {
            const familySlug = familiesList[0].slug;

            const authToken = localStorage.getItem("authToken");
            const unlockTime = localStorage.getItem("unlockTime");
            const accountUser = localStorage.getItem("accountUser");

            let isAccountAuth = false;
            if (authToken && accountUser) {
              try {
                const payload = JSON.parse(atob(authToken.split(".")[1]));
                isAccountAuth = payload.isAccountAuth || false;
              } catch (e) {
                isAccountAuth = !!accountUser;
              }
            }

            if (authToken && unlockTime && !isAccountAuth) {
              router.push(`/${familySlug}/log-entry`);
            } else if (!authToken && !isAccountAuth) {
              router.push(`/${familySlug}/login`);
            }
          } else {
            const authToken = localStorage.getItem("authToken");
            const accountUser = localStorage.getItem("accountUser");

            let isAccountAuth = false;
            if (authToken && accountUser) {
              try {
                const payload = JSON.parse(atob(authToken.split(".")[1]));
                isAccountAuth = payload.isAccountAuth || false;
              } catch (e) {
                isAccountAuth = !!accountUser;
              }
            }

            if (!isAccountAuth) {
              router.push("/family-select");
            }
          }
        }
      } catch (error) {
        console.error("Error checking deployment mode or families:", error);
      } finally {
        setLoading(false);
      }
    };

    checkDeploymentMode();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Carregando...
      </div>
    );
  }

  if (deploymentMode === "saas") {
    return (
      <ThemeProvider>
        <ComingSoon />
      </ThemeProvider>
    );
  }

  return null;
}
