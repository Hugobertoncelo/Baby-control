"use client";

import React, { useState, useEffect } from "react";
import FormPage, { FormPageFooter } from "@/src/components/ui/form-page";
import { FormPageTab } from "@/src/components/ui/form-page/form-page.types";
import { Button } from "@/src/components/ui/button";
import {
  Loader2,
  Settings,
  Users,
  Download,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { styles } from "./account-manager.styles";
import {
  AccountManagerProps,
  AccountStatus,
  FamilyData,
} from "./account-manager.types";
import AccountSettingsTab from "./AccountSettingsTab";
import FamilyPeopleTab from "./FamilyPeopleTab";
import "./account-manager.css";

const AccountManager: React.FC<AccountManagerProps> = ({ isOpen, onClose }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [familyData, setFamilyData] = useState<FamilyData | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication token not found");
      }

      const fetchOptions = {
        headers: { Authorization: `Bearer ${authToken}` },
      };

      const accountStatusRes = await fetch(
        "/api/accounts/status",
        fetchOptions
      );

      if (accountStatusRes.ok) {
        const data = await accountStatusRes.json();
        if (data.success) {
          setAccountStatus(data.data);

          if (data.data.hasFamily && data.data.familySlug) {
            try {
              const familyRes = await fetch("/api/family", fetchOptions);
              if (familyRes.ok) {
                const familyData = await familyRes.json();
                if (familyData.success) {
                  setFamilyData(familyData.data);
                } else {
                  console.warn(
                    "Failed to fetch detailed family data:",
                    familyData.error
                  );
                  setFamilyData(null);
                }
              } else {
                console.warn("Family API call failed");
                setFamilyData(null);
              }
            } catch (familyErr) {
              console.warn("Family data not available:", familyErr);
              setFamilyData(null);
            }
          } else {
            setFamilyData(null);
          }
        } else {
          throw new Error(data.error || "Falha ao obter o status da conta");
        }
      } else {
        throw new Error("Falha ao obter o status da conta");
      }
    } catch (err) {
      console.error("Error fetching account data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os dados da conta. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataRefresh = () => {
    fetchData();
  };

  const tabs: FormPageTab[] = [
    {
      id: "account-settings",
      label: familyData ? "Account" : "Account",
      icon: Settings,
      content: (
        <>
          {isLoading && (
            <div
              className={cn(
                styles.loadingContainer,
                "account-manager-loading-container"
              )}
            >
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p
                className={cn(
                  "mt-2 text-gray-600",
                  "account-manager-loading-text"
                )}
              >
                Carregando...
              </p>
            </div>
          )}

          {error && (
            <div
              className={cn(
                styles.errorContainer,
                "account-manager-error-container"
              )}
            >
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Error</p>
              </div>
              <p
                className={cn(
                  "text-red-500 mb-4",
                  "account-manager-error-text"
                )}
              >
                {error}
              </p>
              <Button variant="outline" onClick={fetchData} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !error && accountStatus && (
            <AccountSettingsTab
              accountStatus={accountStatus}
              familyData={familyData}
              onDataRefresh={handleDataRefresh}
            />
          )}
        </>
      ),
    },
  ];

  if (familyData) {
    tabs.push({
      id: "family-people",
      label: "Family & People",
      icon: Users,
      content: (
        <>
          {isLoading && (
            <div
              className={cn(
                styles.loadingContainer,
                "account-manager-loading-container"
              )}
            >
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p
                className={cn(
                  "mt-2 text-gray-600",
                  "account-manager-loading-text"
                )}
              >
                Carregando...
              </p>
            </div>
          )}

          {error && (
            <div
              className={cn(
                styles.errorContainer,
                "account-manager-error-container"
              )}
            >
              <div className="flex items-center gap-2 text-red-600 mb-2">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-medium">Error</p>
              </div>
              <p
                className={cn(
                  "text-red-500 mb-4",
                  "account-manager-error-text"
                )}
              >
                {error}
              </p>
              <Button variant="outline" onClick={fetchData} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !error && accountStatus && familyData && (
            <FamilyPeopleTab
              familyData={familyData}
              onDataRefresh={handleDataRefresh}
            />
          )}
        </>
      ),
    });
  }

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title="Account Manager"
      description="Manage your account settings and family information"
      tabs={tabs}
      defaultActiveTab="account-settings"
    >
      <FormPageFooter>
        <div
          className={cn(
            styles.footerContainer,
            "account-manager-footer-container"
          )}
        >
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
};

export default AccountManager;
