"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { useDeployment } from "../../app/context/deployment";

interface Family {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

interface FamilyContextType {
  family: Family | null;
  loading: boolean;
  error: string | null;
  setFamily: (family: Family) => void;
  families: Family[];
  loadFamilies: () => Promise<void>;
  handleLogout?: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({
  children,
  onLogout,
}: {
  children: ReactNode;
  onLogout?: () => void;
}) {
  const [family, setFamily] = useState<Family | null>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedFamily");
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const { isSaasMode } = useDeployment();

  const getFamilySlugFromUrl = () => {
    if (!pathname) return null;
    const segments = pathname.split("/").filter(Boolean);
    return segments.length > 0 ? segments[0] : null;
  };

  useEffect(() => {
    if (family) {
      localStorage.setItem("selectedFamily", JSON.stringify(family));
    }
  }, [family]);

  useEffect(() => {
    const loadFamilyFromUrl = async () => {
      const slug = getFamilySlugFromUrl();
      if (!slug) {
        setLoading(false);
        return;
      }
      try {
        const authToken = localStorage.getItem("authToken");
        let isSysAdmin = false;
        if (authToken) {
          try {
            const payload = authToken.split(".")[1];
            const decodedPayload = JSON.parse(atob(payload));
            isSysAdmin = decodedPayload.isSysAdmin || false;
          } catch (error) {}
        }
        const response = await fetch(`/api/family/by-slug/${slug}`, {
          headers: authToken
            ? {
                Authorization: `Bearer ${authToken}`,
              }
            : {},
        });
        if (!response.ok) {
          throw new Error("Falha ao carregar dados da família");
        }
        const data = await response.json();
        if (data.success && data.data) {
          setFamily(data.data);
          if (isSysAdmin && typeof window !== "undefined") {
            sessionStorage.setItem(
              "sysadmin-family-context",
              JSON.stringify(data.data)
            );
          }
        } else {
          setError(data.error || "Falha ao carregar dados da família");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ocorreu um erro");
      } finally {
        setLoading(false);
      }
    };
    loadFamilyFromUrl();
  }, [pathname]);

  const loadFamilies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/family/list");
      if (!response.ok) {
        throw new Error("Falha ao carregar famílias");
      }
      const data = await response.json();
      if (data.success && data.data) {
        setFamilies(data.data);
      } else {
        setError(data.error || "Falha ao carregar famílias");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro");
    } finally {
      setLoading(false);
    }
  };

  const checkAccountExpiration = useCallback(() => {
    if (typeof window === "undefined" || !family?.slug) return;
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) return;
      if (!isSaasMode) return;
      let decodedPayload;
      try {
        const payload = authToken.split(".")[1];
        decodedPayload = JSON.parse(atob(payload));
      } catch (error) {
        return;
      }
      if (!decodedPayload.isAccountAuth) return;
      if (decodedPayload.betaparticipant) return;
      const now = new Date();
      let isExpired = false;
      if (decodedPayload.trialEnds) {
        const trialEndDate = new Date(decodedPayload.trialEnds);
        isExpired = now > trialEndDate;
      } else if (decodedPayload.planExpires) {
        const planEndDate = new Date(decodedPayload.planExpires);
        isExpired = now > planEndDate;
      } else if (!decodedPayload.planType && !decodedPayload.betaparticipant) {
        isExpired = true;
      }
      if (isExpired) {
      }
    } catch (error) {}
  }, [family?.slug, onLogout, isSaasMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    checkAccountExpiration();
    const expirationCheckInterval = setInterval(checkAccountExpiration, 30000);
    return () => {
      clearInterval(expirationCheckInterval);
    };
  }, [checkAccountExpiration]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const authToken = localStorage.getItem("authToken");
        const url =
          typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url;
        const isApiCall =
          url &&
          typeof url === "string" &&
          (url.startsWith("/api") || url.includes("/api/"));
        if (isApiCall && authToken) {
          const options = args[1] || {};
          const headers = new Headers(options.headers || {});
          if (!headers.has("Authorization")) {
            headers.set("Authorization", `Bearer ${authToken}`);
          }
          args[1] = {
            ...options,
            headers,
          };
        }
        const response = await originalFetch(...args);
        if (response.status === 401) {
          if (onLogout) {
            setTimeout(() => {
              if (onLogout) {
                onLogout();
              }
            }, 100);
          }
        }
        return response;
      } catch (error) {
        throw error;
      }
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, [onLogout]);

  const authenticatedFetch = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      const authToken =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;
      const headers = new Headers(options?.headers || {});
      if (authToken && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${authToken}`);
      }
      const mergedOptions: RequestInit = {
        ...options,
        headers,
      };
      try {
        const response = await fetch(url, mergedOptions);
        if (response.status === 401) {
          if (onLogout) {
            setTimeout(() => {
              if (onLogout) {
                onLogout();
              }
            }, 100);
          }
        }
        return response;
      } catch (error) {
        throw error;
      }
    },
    [onLogout]
  );

  const value = {
    family,
    loading,
    error,
    setFamily,
    families,
    loadFamilies,
    handleLogout: onLogout,
    authenticatedFetch,
  };

  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error("useFamily deve ser usado dentro de um FamilyProvider");
  }
  return context;
}
