"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface DeploymentConfig {
  deploymentMode: "saas" | "selfhosted" | null;
  enableAccounts: boolean | null;
  allowAccountRegistration: boolean | null;
  betaEnabled: boolean | null;
}

interface DeploymentContextType {
  isLoading: boolean;

  config: DeploymentConfig | null;

  isSaasMode: boolean;

  isSelfHosted: boolean;

  accountsEnabled: boolean;

  registrationAllowed: boolean;

  betaEnabled: boolean;

  refreshConfig: () => void;

  getDeploymentInfo: () => {
    config: DeploymentConfig | null;
    isLoading: boolean;
    lastFetched: Date | null;
  };
}

const DeploymentContext = createContext<DeploymentContextType | undefined>(
  undefined
);

export function DeploymentProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [config, setConfig] = useState<DeploymentConfig | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchDeploymentConfig = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/deployment-config", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        const deploymentConfig: DeploymentConfig = {
          deploymentMode: result.data.deploymentMode || null,
          enableAccounts: result.data.enableAccounts || false,
          allowAccountRegistration:
            result.data.allowAccountRegistration || false,
          betaEnabled:
            result.data.betaEnabled !== undefined
              ? result.data.betaEnabled
              : null,
        };

        setConfig(deploymentConfig);
        setLastFetched(new Date());

        console.log("Configuração de implantação carregada:", deploymentConfig);
      } else {
        throw new Error(
          result.error || "Falha ao obter a configuração de implantação"
        );
      }
    } catch (error) {
      console.error("Erro ao obter a configuração de implantação:", error);

      const fallbackConfig: DeploymentConfig = {
        deploymentMode: null,
        enableAccounts: false,
        allowAccountRegistration: false,
        betaEnabled: null,
      };

      setConfig(fallbackConfig);
      setLastFetched(new Date());

      console.warn(
        "Utilizando a configuração de implantação de fallback:",
        fallbackConfig
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeploymentConfig();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const handleFocus = () => {
        if (lastFetched && Date.now() - lastFetched.getTime() > 5 * 60 * 1000) {
          fetchDeploymentConfig();
        }
      };

      window.addEventListener("focus", handleFocus);
      return () => window.removeEventListener("focus", handleFocus);
    }
  }, [lastFetched]);

  const refreshConfig = (): void => {
    fetchDeploymentConfig();
  };

  const getDeploymentInfo = () => {
    return {
      config,
      isLoading,
      lastFetched,
    };
  };

  const isSaasMode = config?.deploymentMode === "saas";
  const isSelfHosted = config?.deploymentMode === "selfhosted";
  const accountsEnabled = config?.enableAccounts || false;
  const registrationAllowed = config?.allowAccountRegistration || false;
  const betaEnabled = config?.betaEnabled === true;

  return (
    <DeploymentContext.Provider
      value={{
        isLoading,
        config,
        isSaasMode,
        isSelfHosted,
        accountsEnabled,
        registrationAllowed,
        betaEnabled,
        refreshConfig,
        getDeploymentInfo,
      }}
    >
      {children}
    </DeploymentContext.Provider>
  );
}

export function useDeployment() {
  const context = useContext(DeploymentContext);
  if (context === undefined) {
    throw new Error(
      "O método useDeployment deve ser usado dentro de um DeploymentProvider."
    );
  }
  return context;
}
