"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import LoginSecurity from "@/src/components/LoginSecurity";
import { useTheme } from "@/src/context/theme";
import { useFamily } from "@/src/context/family";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { FamilyResponse } from "@/app/api/types";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const { theme } = useTheme();
  const { family, loading: familyLoading } = useFamily();
  const [families, setFamilies] = useState<FamilyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [slugValidated, setSlugValidated] = useState(false);
  const familySlug = params?.slug as string;

  useEffect(() => {
    const validateSlug = async () => {
      if (!familySlug) {
        setSlugValidated(true);
        return;
      }

      try {
        const response = await fetch(
          `/api/family/by-slug/${encodeURIComponent(familySlug)}`
        );
        const data = await response.json();

        if (!data.success || !data.data) {
          console.log(
            `Family slug "${familySlug}" not found during login, redirecting to home...`
          );
          router.push("/");
          return;
        }

        setSlugValidated(true);
      } catch (error) {
        console.error("Error validating family slug during login:", error);
        router.push("/");
      }
    };

    validateSlug();
  }, [familySlug, router]);

  useEffect(() => {
    if (!slugValidated) return;
    const loadFamilies = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/family/public-list");
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            setFamilies(data.data);
          }
        }
      } catch (error) {
        console.error("Error loading families:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFamilies();
  }, [slugValidated]);

  const handleUnlock = (caretakerId?: string) => {
    if (familySlug) {
      router.push(`/${familySlug}/log-entry`);
    } else {
      router.push("/log-entry");
    }
  };

  useEffect(() => {
    if (!slugValidated) return;

    const authToken = localStorage.getItem("authToken");
    const unlockTime = localStorage.getItem("unlockTime");

    if (authToken && unlockTime) {
      if (familySlug) {
        router.push(`/${familySlug}/log-entry`);
      } else {
        router.push("/log-entry");
      }
    }
  }, [router, familySlug, slugValidated]);

  useEffect(() => {
    if (!slugValidated || familyLoading) return;

    if (family && family.isActive === false) {
      router.push("/");
    } else if (!family && familySlug) {
      router.push("/");
    }
  }, [family, familyLoading, familySlug, router, slugValidated]);

  const handleFamilyChange = (value: string) => {
    const selectedFamily = families.find((f) => f.slug === value);
    if (selectedFamily) {
      router.push(`/${selectedFamily.slug}/login`);
    }
  };

  if (!slugValidated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Validando família...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {families.length > 1 && (
        <div className="w-full max-w-md mx-auto mb-4 p-4">
          <label className="block text-sm font-medium mb-2">
            Selecione a família
          </label>
          <Select
            value={familySlug || ""}
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
        familySlug={familySlug}
        familyName={!familyLoading && family ? family.name : undefined}
      />
    </div>
  );
}
