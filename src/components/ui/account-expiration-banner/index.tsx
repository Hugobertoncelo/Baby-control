"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/src/context/theme";
import "./account-expiration-banner.css";

interface AccountStatus {
  accountStatus:
    | "active"
    | "inactive"
    | "trial"
    | "expired"
    | "closed"
    | "no_family";
  subscriptionActive: boolean;
}

interface JWTExpirationInfo {
  isExpired?: boolean;
  trialEnds?: string | null;
  planExpires?: string | null;
  planType?: string | null;
  betaparticipant?: boolean;
}

interface AccountExpirationBannerProps {
  isAccountAuth: boolean;
}

export default function AccountExpirationBanner({
  isAccountAuth,
}: AccountExpirationBannerProps) {
  const { theme } = useTheme();
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [jwtExpirationInfo, setJwtExpirationInfo] =
    useState<JWTExpirationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<"account" | "caretaker" | null>(
    null
  );

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      setLoading(false);
      return;
    }

    let parsedUserType: "account" | "caretaker" | null = null;
    let parsedJwtInfo: JWTExpirationInfo | null = null;

    try {
      const payload = authToken.split(".")[1];
      const decodedPayload = JSON.parse(atob(payload));
      const isAccountUser = decodedPayload.isAccountAuth || false;
      const isSysAdmin = decodedPayload.isSysAdmin || false;

      if (isSysAdmin) {
        setLoading(false);
        return;
      }

      if (isAccountUser) {
        parsedUserType = "account";
      } else {
        parsedUserType = "caretaker";
        parsedJwtInfo = {
          isExpired: decodedPayload.isExpired || false,
          trialEnds: decodedPayload.trialEnds || null,
          planExpires: decodedPayload.planExpires || null,
          planType: decodedPayload.planType || null,
          betaparticipant: decodedPayload.betaparticipant || false,
        };
        setJwtExpirationInfo(parsedJwtInfo);
      }
      setUserType(parsedUserType);
    } catch (error) {
      console.error("Error parsing JWT token:", error);
      setLoading(false);
      return;
    }

    if (parsedUserType === "account") {
      const fetchAccountStatus = async () => {
        try {
          const response = await fetch("/api/accounts/status", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setAccountStatus({
                accountStatus: data.data.accountStatus,
                subscriptionActive: data.data.subscriptionActive,
              });
            }
          }
        } catch (error) {
          console.error("Error fetching account status:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchAccountStatus();

      const interval = setInterval(fetchAccountStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    } else if (parsedUserType === "caretaker") {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [isAccountAuth]);

  const handleUpgradeClick = () => {
    if (userType === "account") {
      window.dispatchEvent(new CustomEvent("openPaymentModal"));
    }
  };

  if (loading || !userType) {
    return null;
  }

  let shouldShow = false;

  if (userType === "account" && accountStatus) {
    shouldShow =
      accountStatus.accountStatus !== "no_family" &&
      accountStatus.accountStatus === "expired";
  } else if (userType === "caretaker" && jwtExpirationInfo) {
    if (!jwtExpirationInfo.betaparticipant) {
      const hasAccountInfo =
        jwtExpirationInfo.trialEnds !== null ||
        jwtExpirationInfo.planExpires !== null ||
        jwtExpirationInfo.planType !== null;

      if (hasAccountInfo) {
        const now = new Date();
        let calculatedIsExpired = false;

        if (jwtExpirationInfo.trialEnds) {
          const trialEndDate = new Date(jwtExpirationInfo.trialEnds);
          calculatedIsExpired = now > trialEndDate;
        } else if (jwtExpirationInfo.planExpires) {
          const planEndDate = new Date(jwtExpirationInfo.planExpires);
          calculatedIsExpired = now > planEndDate;
        } else if (!jwtExpirationInfo.planType) {
          calculatedIsExpired = true;
        }

        shouldShow = calculatedIsExpired;
      }
    }
  }

  if (!shouldShow) {
    return null;
  }

  return (
    <div
      className={`account-expiration-banner account-expiration-banner-${theme}`}
    >
      <div className="account-expiration-banner-content">
        <div className="account-expiration-banner-message">
          <span className="account-expiration-banner-icon">⚠️</span>
          <span>
            {userType === "account" ? (
              <>
                Sua conta não possui uma assinatura ou licença ativa. O
                aplicativo está em modo somente leitura até que você faça o
                upgrade.
              </>
            ) : (
              <>
                A assinatura do proprietário da conta expirou. Por favor, entre
                em contato com ele para fazer o upgrade. O aplicativo está em
                modo somente leitura até que ele faça o upgrade.
              </>
            )}
          </span>
        </div>
        {userType === "account" && (
          <button
            onClick={handleUpgradeClick}
            className="account-expiration-banner-button"
          >
            Fazer upgrade agora
          </button>
        )}
      </div>
    </div>
  );
}
