"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Baby } from "@prisma/client";

interface AccountStatus {
  accountId: string;
  email: string;
  firstName: string;
  lastName?: string;
  verified: boolean;
  hasFamily: boolean;
  familySlug?: string;
  familyName?: string;
}

interface BabyContextType {
  selectedBaby: Baby | null;
  setSelectedBaby: (baby: Baby | null) => void;
  sleepingBabies: Set<string>;
  setSleepingBabies: (
    babies: Set<string> | ((prev: Set<string>) => Set<string>)
  ) => void;
  accountStatus: AccountStatus | null;
  isAccountAuth: boolean;
  isCheckingAccountStatus: boolean;
}

const BabyContext = createContext<BabyContextType>({
  selectedBaby: null,
  setSelectedBaby: () => {},
  sleepingBabies: new Set(),
  setSleepingBabies: () => {},
  accountStatus: null,
  isAccountAuth: false,
  isCheckingAccountStatus: false,
});

interface BabyProviderProps {
  children: React.ReactNode;
}

export function BabyProvider({ children }: BabyProviderProps) {
  const [selectedBaby, setSelectedBaby] = useState<Baby | null>(null);
  const [sleepingBabies, setSleepingBabies] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sleepingBabies");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });
  const [currentFamily, setCurrentFamily] = useState<{
    id: string;
    slug: string;
  } | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [isAccountAuth, setIsAccountAuth] = useState(false);
  const [isCheckingAccountStatus, setIsCheckingAccountStatus] = useState(false);

  const checkAccountAuth = (): boolean => {
    if (typeof window === "undefined") return false;

    const authToken = localStorage.getItem("authToken");
    if (!authToken) return false;

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
      return decoded.isAccountAuth === true;
    } catch (error) {
      console.error("Erro ao verificar a autenticação da conta:", error);
      return false;
    }
  };

  const fetchAccountStatus = async (): Promise<AccountStatus | null> => {
    if (typeof window === "undefined") return null;

    const authToken = localStorage.getItem("authToken");
    if (!authToken) return null;

    try {
      setIsCheckingAccountStatus(true);
      const response = await fetch("/api/accounts/status", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
      return null;
    } catch (error) {
      console.error("Erro ao obter o status da conta:", error);
      return null;
    } finally {
      setIsCheckingAccountStatus(false);
    }
  };

  const getCurrentFamily = (): { id: string; slug: string } | null => {
    if (typeof window === "undefined") return null;

    const pathname = window.location.pathname;
    const segments = pathname.split("/").filter(Boolean);
    const familySlug = segments.length > 0 ? segments[0] : null;

    if (familySlug) {
      const savedFamily = localStorage.getItem("selectedFamily");
      if (savedFamily) {
        try {
          const family = JSON.parse(savedFamily);
          if (family.slug === familySlug) {
            return { id: family.id, slug: family.slug };
          }
        } catch (e) {
          console.error("Erro ao analisar a família salva:", e);
        }
      }
    }

    if (accountStatus?.hasFamily && accountStatus.familySlug) {
      if (pathname === "/coming-soon" || pathname.startsWith("/account/")) {
        window.location.href = `/${accountStatus.familySlug}`;
        return null;
      }

      return null;
    }

    return null;
  };

  const getFamilySpecificKey = (baseKey: string, familyId?: string): string => {
    if (familyId) {
      return `${baseKey}_${familyId}`;
    }
    return baseKey;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = checkAccountAuth();
      setIsAccountAuth(isAuth);

      if (isAuth) {
        const status = await fetchAccountStatus();
        setAccountStatus(status);

        if (
          status?.verified &&
          !status.hasFamily &&
          typeof window !== "undefined"
        ) {
          const pathname = window.location.pathname;
          if (
            pathname !== "/account/family-setup" &&
            pathname !== "/coming-soon"
          ) {
            window.location.href = "/coming-soon";
          }
        }
      } else {
        setAccountStatus(null);
      }
    };

    checkAuth();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken") {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    const family = getCurrentFamily();

    if (family && (!currentFamily || currentFamily.id !== family.id)) {
      setCurrentFamily(family);

      const familyBabyKey = getFamilySpecificKey("selectedBaby", family.id);
      const saved = localStorage.getItem(familyBabyKey);

      if (saved) {
        try {
          const baby = JSON.parse(saved);
          if (baby.familyId === family.id) {
            setSelectedBaby(baby);
          } else {
            setSelectedBaby(null);
            localStorage.removeItem(familyBabyKey);
          }
        } catch (e) {
          console.error("Erro ao analisar o bebê salvo:", e);
          setSelectedBaby(null);
        }
      } else {
        setSelectedBaby(null);
      }

      const familySleepingKey = getFamilySpecificKey(
        "sleepingBabies",
        family.id
      );
      const savedSleeping = localStorage.getItem(familySleepingKey);
      if (savedSleeping) {
        try {
          setSleepingBabies(new Set(JSON.parse(savedSleeping)));
        } catch (e) {
          console.error("Erro ao analisar os bebês adormecidos salvos:", e);
          setSleepingBabies(new Set());
        }
      } else {
        setSleepingBabies(new Set());
      }
    } else if (!family && currentFamily) {
      setCurrentFamily(null);
      setSelectedBaby(null);
      setSleepingBabies(new Set());
    }
  }, [currentFamily]);

  useEffect(() => {
    const handlePopState = () => {
      const family = getCurrentFamily();
      if (family && (!currentFamily || currentFamily.id !== family.id)) {
        setCurrentFamily(family);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [currentFamily]);

  useEffect(() => {
    if (currentFamily?.id) {
      const familyBabyKey = getFamilySpecificKey(
        "selectedBaby",
        currentFamily.id
      );

      if (selectedBaby) {
        if (selectedBaby.familyId === currentFamily.id) {
          localStorage.setItem(familyBabyKey, JSON.stringify(selectedBaby));
        }
      } else {
        localStorage.removeItem(familyBabyKey);
      }
    }
  }, [selectedBaby, currentFamily]);

  useEffect(() => {
    if (currentFamily?.id) {
      const familySleepingKey = getFamilySpecificKey(
        "sleepingBabies",
        currentFamily.id
      );
      localStorage.setItem(
        familySleepingKey,
        JSON.stringify(Array.from(sleepingBabies))
      );
    }
  }, [sleepingBabies, currentFamily]);

  useEffect(() => {
    if (selectedBaby) {
      const url = new URL(window.location.href);
      url.searchParams.set("babyId", selectedBaby.id);
      window.history.replaceState({}, "", url.toString());
    }
  }, [selectedBaby]);

  const setSelectedBabyWithValidation = (baby: Baby | null) => {
    if (baby && currentFamily?.id && baby.familyId !== currentFamily.id) {
      console.warn(
        "Tentou-se selecionar um bebê de uma família diferente:",
        baby.familyId,
        "vs",
        currentFamily.id
      );
      return;
    }
    setSelectedBaby(baby);
  };

  return (
    <BabyContext.Provider
      value={{
        selectedBaby,
        setSelectedBaby: setSelectedBabyWithValidation,
        sleepingBabies,
        setSleepingBabies,
        accountStatus,
        isAccountAuth,
        isCheckingAccountStatus,
      }}
    >
      {children}
    </BabyContext.Provider>
  );
}

export function useBaby() {
  const context = useContext(BabyContext);
  if (!context) {
    throw new Error(
      "O uso de useBaby deve ser feito dentro de um BabyProvider."
    );
  }
  return context;
}
