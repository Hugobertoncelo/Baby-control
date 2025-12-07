"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { BabyProvider, useBaby } from "../../context/baby";
import { TimezoneProvider } from "../../context/timezone";
import { DeploymentProvider, useDeployment } from "../../context/deployment";
import { ThemeProvider } from "@/src/context/theme";
import { FamilyProvider, useFamily } from "@/src/context/family";
import { ToastProvider } from "@/src/components/ui/toast";
import Image from "next/image";
import "../../globals.css";
import SettingsForm from "@/src/components/forms/SettingsForm";
import { DebugSessionTimer } from "@/src/components/debugSessionTimer";
import { TimezoneDebug } from "@/src/components/debugTimezone";
import { SideNav, SideNavTrigger } from "@/src/components/ui/side-nav";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/src/lib/utils";
import { Baby } from "@prisma/client";
import BabySelector from "@/src/components/BabySelector";
import BabyQuickInfo from "@/src/components/BabyQuickInfo";
import SetupWizard from "@/src/components/SetupWizard";
import { DynamicTitle } from "@/src/components/ui/dynamic-title";
import { AccountButton } from "@/src/components/ui/account-button";
import AccountManager from "@/src/components/account-manager";
import PaymentModal from "@/src/components/account-manager/PaymentModal";
import AccountExpirationBanner from "@/src/components/ui/account-expiration-banner";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

function AppContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { family } = useFamily();
  const { selectedBaby, setSelectedBaby, sleepingBabies } = useBaby();
  const { isSaasMode } = useDeployment();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [quickStatsOpen, setQuickStatsOpen] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [babies, setBabies] = useState<Baby[]>([]);
  const [showSetup, setShowSetup] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window !== "undefined") {
      const unlockTime = localStorage.getItem("unlockTime");
      if (unlockTime && Date.now() - parseInt(unlockTime) <= 60 * 1000) {
        return true;
      }
    }
    return false;
  });

  const [caretakerName, setCaretakerName] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showAccountManager, setShowAccountManager] = useState(false);
  const [isAccountAuth, setIsAccountAuth] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAccountStatus, setPaymentAccountStatus] = useState<any>(null);
  const familySlug = params?.slug as string;

  const calculateAge = (birthday: Date) => {
    const today = new Date();
    const birthDate = new Date(birthday);

    const ageInWeeks = Math.floor(
      (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
    const ageInMonths = Math.floor(
      (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );
    const ageInYears = Math.floor(
      (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    );

    if (ageInMonths < 6) {
      return `${ageInWeeks} semanas`;
    } else if (ageInMonths < 24) {
      return `${ageInMonths} meses`;
    } else {
      return `${ageInYears} ${ageInYears === 1 ? "ano" : "anos"}`;
    }
  };

  const fetchData = async () => {
    try {
      const authToken = localStorage.getItem("authToken");
      let isSysAdmin = false;

      if (authToken) {
        try {
          const payload = authToken.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));
          isSysAdmin = decodedPayload.isSysAdmin || false;
        } catch (error) {
          console.error("Error parsing JWT token:", error);
        }
      }

      let settingsUrl = "/api/settings";
      if (isSysAdmin && family?.id) {
        settingsUrl += `?familyId=${family.id}`;
      }

      const settingsResponse = await fetch(settingsUrl, {
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
      });
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        if (settingsData.success && settingsData.data.familyName) {
          setFamilyName(settingsData.data.familyName);
        }
      }

      let accountUserInfo = null;
      if (authToken) {
        try {
          const payload = authToken.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));
          if (decodedPayload.isAccountAuth) {
            accountUserInfo = {
              name: decodedPayload.name,
              isAccountAuth: true,
            };
            setCaretakerName(decodedPayload.name);
            setIsAccountAuth(true);
            setIsAdmin(true);
          } else {
            setIsAccountAuth(false);
          }
        } catch (error) {
          console.error("Error parsing JWT token for user info:", error);
        }
      }

      if (!accountUserInfo) {
        const caretakerId = localStorage.getItem("caretakerId");
        if (caretakerId) {
          const caretakerResponse = await fetch(
            `/api/caretaker?id=${caretakerId}`
          );
          if (caretakerResponse.ok) {
            const caretakerData = await caretakerResponse.json();
            if (caretakerData.success && caretakerData.data) {
              setCaretakerName(caretakerData.data.name);
            }
          }
        }
      }

      let babiesUrl = "/api/baby";
      if (isSysAdmin && family?.id) {
        babiesUrl += `?familyId=${family.id}`;
      }

      const babiesResponse = await fetch(babiesUrl, {
        headers: authToken
          ? {
              Authorization: `Bearer ${authToken}`,
            }
          : {},
      });
      if (babiesResponse.ok) {
        const babiesData = await babiesResponse.json();
        if (babiesData.success) {
          const activeBabies = babiesData.data.filter(
            (baby: Baby) => !baby.inactive
          );
          setBabies(activeBabies);

          setShowSetup(activeBabies.length === 0);

          const urlParams = new URLSearchParams(window.location.search);
          const babyId = urlParams.get("babyId");

          const foundBaby = activeBabies.find((b: Baby) => b.id === babyId);
          if (foundBaby) {
            setSelectedBaby(foundBaby);
          } else if (activeBabies.length === 1) {
            setSelectedBaby(activeBabies[0]);
          } else {
            setSelectedBaby(null);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const updateUnlockTimer = () => {
    const unlockTime = localStorage.getItem("unlockTime");
    if (unlockTime) {
      localStorage.setItem("unlockTime", Date.now().toString());
    }
  };

  const handleUnlock = (caretakerId?: string) => {
    setIsUnlocked(true);
    fetchData();

    if (caretakerId) {
      const caretakerChangedEvent = new CustomEvent("caretakerChanged", {
        detail: { caretakerId },
      });
      window.dispatchEvent(caretakerChangedEvent);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem("authToken");
    const currentCaretakerId = localStorage.getItem("caretakerId");

    let isAccountAuth = false;
    if (token) {
      try {
        const payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));
        isAccountAuth = decodedPayload.isAccountAuth || false;
      } catch (error) {
        console.error("Error parsing JWT token during logout:", error);
      }
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }

    localStorage.removeItem("unlockTime");
    localStorage.removeItem("caretakerId");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accountUser");
    localStorage.removeItem("attempts");
    localStorage.removeItem("lockoutTime");

    if (currentCaretakerId) {
      const caretakerChangedEvent = new CustomEvent("caretakerChanged", {
        detail: { caretakerId: null },
      });
      window.dispatchEvent(caretakerChangedEvent);
    }

    setIsUnlocked(false);
    setCaretakerName("");
    setIsAdmin(false);
    setSideNavOpen(false);

    setSelectedBaby(null);
    setBabies([]);

    if (isAccountAuth) {
      router.push("/");
    } else if (familySlug) {
      router.push(`/${familySlug}/login`);
    } else {
      router.push("/login");
    }
  };

  const checkScreenWidth = useCallback(() => {
    if (typeof window !== "undefined") {
      const isWide = window.innerWidth > 600;
      setIsWideScreen(isWide);

      setSideNavOpen(isWide);
    }
  }, []);

  useEffect(() => {
    setMounted(true);

    fetchData();

    checkScreenWidth();

    window.addEventListener("click", updateUnlockTimer);
    window.addEventListener("keydown", updateUnlockTimer);
    window.addEventListener("mousemove", updateUnlockTimer);
    window.addEventListener("touchstart", updateUnlockTimer);

    window.addEventListener("resize", checkScreenWidth);

    return () => {
      window.removeEventListener("click", updateUnlockTimer);
      window.removeEventListener("keydown", updateUnlockTimer);
      window.removeEventListener("mousemove", updateUnlockTimer);
      window.removeEventListener("touchstart", updateUnlockTimer);
      window.removeEventListener("resize", checkScreenWidth);
    };
  }, [checkScreenWidth]);

  useEffect(() => {
    if (family?.id) {
      fetchData();
    }
  }, [family?.id]);

  const validateFamilySlug = useCallback(
    async (slug: string) => {
      try {
        const response = await fetch(
          `/api/family/by-slug/${encodeURIComponent(slug)}`
        );
        const data = await response.json();

        if (!data.success || !data.data) {
          if (pathname !== "/") {
            router.push("/");
          }
          return false;
        }

        return true;
      } catch (error) {
        if (pathname !== "/") {
          router.push("/");
        }
        return false;
      }
    },
    [router, pathname]
  );

  useEffect(() => {
    if (!mounted || !familySlug) return;

    validateFamilySlug(familySlug);
  }, [mounted, familySlug, validateFamilySlug]);

  useEffect(() => {
    if (!mounted) return;

    const checkAuthStatus = () => {
      const authToken = localStorage.getItem("authToken");
      const unlockTime = localStorage.getItem("unlockTime");

      let isAccountAuth = false;
      if (authToken) {
        try {
          const payload = authToken.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));
          isAccountAuth = decodedPayload.isAccountAuth || false;
        } catch (error) {
          console.error(
            "Error parsing JWT token for account auth check:",
            error
          );
        }
      }

      if (!authToken || (!isAccountAuth && !unlockTime)) {
        if (familySlug) {
          router.push(`/${familySlug}/login`);
        } else {
          router.push("/login");
        }
        return;
      }

      try {
        const payload = authToken.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));

        if (decodedPayload.exp && decodedPayload.exp * 1000 < Date.now()) {
          console.log("JWT token has expired, logging out...");
          handleLogout();
          return;
        }

        if (
          decodedPayload.familySlug &&
          familySlug &&
          decodedPayload.familySlug !== familySlug
        ) {
          console.log(
            "User trying to access different family. Redirecting to correct family..."
          );
          const currentPath =
            pathname?.split("/").slice(2).join("/") || "log-entry";
          router.push(`/${decodedPayload.familySlug}/${currentPath}`);
          return;
        }
      } catch (error) {
        console.error("Error parsing JWT token:", error);
        handleLogout();
        return;
      }

      if (pathname === `/${familySlug}` || pathname === `/${familySlug}/`) {
        console.log("User on family root, redirecting to log-entry...");
        router.push(`/${familySlug}/log-entry`);
        return;
      }

      if (unlockTime) {
        const lastActivity = parseInt(unlockTime);
        const idleTimeSeconds = parseInt(
          localStorage.getItem("idleTimeSeconds") || "1800",
          10
        );
        if (Date.now() - lastActivity > idleTimeSeconds * 1000) {
          console.log("Session expired due to inactivity, logging out...");
          handleLogout();
        }
      }
    };

    checkAuthStatus();

    const authCheckInterval = setInterval(checkAuthStatus, 1000);

    return () => {
      clearInterval(authCheckInterval);
    };
  }, [mounted, router, handleLogout, familySlug, pathname]);

  useEffect(() => {
    const handleOpenPayment = () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) return;

      try {
        const payload = authToken.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));
        const isAccountUser = decodedPayload.isAccountAuth || false;

        if (!isAccountUser) {
          console.log("PaymentModal can only be opened by account users");
          return;
        }
      } catch (error) {
        console.error("Error parsing JWT token for payment modal:", error);
        return;
      }

      const fetchAccountStatusForPayment = async () => {
        try {
          const response = await fetch("/api/accounts/status", {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setPaymentAccountStatus({
                accountStatus: data.data.accountStatus || "active",
                planType: data.data.planType || null,
                subscriptionActive: data.data.subscriptionActive || false,
                trialEnds: data.data.trialEnds || null,
                planExpires: data.data.planExpires || null,
                subscriptionId: data.data.subscriptionId || null,
              });
              setShowPaymentModal(true);
            }
          }
        } catch (error) {
          console.error(
            "Error fetching account status for payment modal:",
            error
          );
        }
      };

      fetchAccountStatusForPayment();
    };

    window.addEventListener("openPaymentModal", handleOpenPayment);
    return () =>
      window.removeEventListener("openPaymentModal", handleOpenPayment);
  }, []);

  useEffect(() => {
    const checkUnlockStatus = () => {
      const authToken = localStorage.getItem("authToken");
      const unlockTime = localStorage.getItem("unlockTime");

      let isAccountAuth = false;
      if (authToken) {
        try {
          const payload = authToken.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));
          isAccountAuth = decodedPayload.isAccountAuth || false;
        } catch (error) {
          console.error("Error parsing JWT token for unlock status:", error);
        }
      }

      const newUnlockState = !!(authToken && (isAccountAuth || unlockTime));
      setIsUnlocked(newUnlockState);

      if (authToken) {
        try {
          const payload = authToken.split(".")[1];
          const decodedPayload = JSON.parse(atob(payload));

          if (decodedPayload.name) {
            setCaretakerName(decodedPayload.name);
            const isAccountAdmin =
              decodedPayload.isAccountAuth && decodedPayload.role === "OWNER";
            const isRegularAdmin = decodedPayload.role === "ADMIN";
            const isSysAdmin = decodedPayload.isSysAdmin === true;
            setIsAdmin(isAccountAdmin || isRegularAdmin || isSysAdmin);
          }
        } catch (error) {
          console.error("Error parsing JWT token:", error);
        }
      }
    };

    checkUnlockStatus();

    const interval = setInterval(checkUnlockStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  const withFamilySlug = (path: string) => {
    if (!familySlug) return path;

    if (path.startsWith("/")) {
      path = path.substring(1);
    }

    if (path.startsWith(`${familySlug}/`)) {
      return `/${path}`;
    }

    return `/${familySlug}/${path}`;
  };

  return (
    <>
      {(isUnlocked || process.env.NODE_ENV === "development") && (
        <div className="min-h-screen flex">
          {isWideScreen && (
            <SideNav
              isOpen={true}
              nonModal={true}
              onClose={() => {}}
              currentPath={window.location.pathname}
              onNavigate={(path) => {
                router.push(withFamilySlug(path));
              }}
              onSettingsClick={() => {
                setSettingsOpen(true);
              }}
              onLogout={handleLogout}
              isAdmin={isAdmin}
              className="h-screen sticky top-0"
              familySlug={familySlug}
              familyName={family?.name || familyName}
            />
          )}

          <div
            className={`flex flex-col flex-1 min-h-screen ${
              isWideScreen ? "w-[calc(100%-16rem)]" : "w-full"
            }`}
          >
            <header className="w-full bg-gradient-to-r from-teal-600 to-teal-700 sticky top-0 z-40">
              <div className="mx-auto py-2">
                <div className="flex justify-between items-center h-16">
                  {" "}
                  <div
                    className={`flex items-center ${
                      isWideScreen ? "ml-8" : "ml-4 sm:ml-6 lg:ml-8"
                    }`}
                  >
                    {!isWideScreen ? (
                      <SideNavTrigger
                        onClick={() => setSideNavOpen(true)}
                        isOpen={sideNavOpen}
                        className="w-16 h-16 flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 mr-4"
                      >
                        <Image
                          src="/sprout-128.png"
                          alt="Sprout Logo"
                          width={64}
                          height={64}
                          className="object-contain"
                          priority
                        />
                      </SideNavTrigger>
                    ) : null}
                    <div className="flex flex-col">
                      {/* Exibe o nome do cuidador para autenticação via PIN */}
                      {!isAccountAuth &&
                        caretakerName &&
                        caretakerName !== "system" && (
                          <span className="text-white text-xs opacity-80">
                            Olá, {caretakerName}
                          </span>
                        )}
                      {/* Exibe o botão de conta para autenticação por conta */}
                      {isAccountAuth && (
                        <div className="mb-1">
                          <AccountButton
                            variant="white"
                            className="h-8 px-2 text-xs origin-left"
                            showIcon={false}
                            hideFamilyDashboardLink={true}
                            onAccountManagerOpen={() =>
                              setShowAccountManager(true)
                            }
                          />
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">
                        {family?.name || familyName} -{" "}
                        {pathname?.includes("/log-entry")
                          ? "Lançamento de Registro"
                          : pathname?.includes("/calendar")
                          ? "Calendário"
                          : pathname?.includes("/full-log")
                          ? "Registro Completo"
                          : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center mr-4 sm:mr-6 lg:mr-8">
                    {babies.length > 0 && (
                      <BabySelector
                        selectedBaby={selectedBaby}
                        onBabySelect={(baby) => setSelectedBaby(baby)}
                        babies={babies}
                        calculateAge={calculateAge}
                        sleepingBabies={sleepingBabies}
                        onOpenQuickStats={() => setQuickStatsOpen(true)}
                      />
                    )}
                  </div>
                </div>
              </div>
            </header>

            <AccountExpirationBanner isAccountAuth={isAccountAuth} />

            <main className="flex-1 relative z-0">
              {showSetup ? <SetupWizard onComplete={fetchData} /> : children}
            </main>
          </div>

          {!isWideScreen && (
            <SideNav
              isOpen={sideNavOpen}
              onClose={() => setSideNavOpen(false)}
              currentPath={window.location.pathname}
              onNavigate={(path) => {
                router.push(withFamilySlug(path));
                setSideNavOpen(false);
              }}
              onSettingsClick={() => {
                setSettingsOpen(true);
                setSideNavOpen(false);
              }}
              onLogout={handleLogout}
              isAdmin={isAdmin}
              familySlug={familySlug}
              familyName={family?.name || familyName}
            />
          )}
        </div>
      )}

      <SettingsForm
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onBabySelect={(id: string) => {
          const baby = babies.find((b: Baby) => b.id === id);
          if (baby) {
            setSelectedBaby(baby);
          }
        }}
        selectedBabyId={selectedBaby?.id || ""}
        familyId={family?.id}
        onBabyStatusChange={fetchData}
      />

      <BabyQuickInfo
        isOpen={quickStatsOpen}
        onClose={() => setQuickStatsOpen(false)}
        selectedBaby={selectedBaby}
        calculateAge={calculateAge}
      />

      <DebugSessionTimer />
      <TimezoneDebug />

      <AccountManager
        isOpen={showAccountManager}
        onClose={() => setShowAccountManager(false)}
      />

      {isAccountAuth && paymentAccountStatus && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          accountStatus={paymentAccountStatus}
          onPaymentSuccess={() => {
            setShowPaymentModal(false);
          }}
        />
      )}
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const handleLogout = async () => {
    const token = localStorage.getItem("authToken");
    const currentCaretakerId = localStorage.getItem("caretakerId");

    let isAccountAuth = false;
    if (token) {
      try {
        const payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));
        isAccountAuth = decodedPayload.isAccountAuth || false;
      } catch (error) {
        console.error("Error parsing JWT token during logout:", error);
      }
    }

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
    } catch (error) {
      console.error("Error during logout:", error);
    }

    localStorage.removeItem("unlockTime");
    localStorage.removeItem("caretakerId");
    localStorage.removeItem("authToken");
    localStorage.removeItem("accountUser");
    localStorage.removeItem("attempts");
    localStorage.removeItem("lockoutTime");

    if (currentCaretakerId) {
      const caretakerChangedEvent = new CustomEvent("caretakerChanged", {
        detail: { caretakerId: null },
      });
      window.dispatchEvent(caretakerChangedEvent);
    }

    if (isAccountAuth) {
      window.location.href = "/";
    } else {
      const familySlug = window.location.pathname.split("/")[1];
      if (familySlug) {
        window.location.href = `/${familySlug}/login`;
      } else {
        window.location.href = "/login";
      }
    }
  };

  return (
    <DeploymentProvider>
      <FamilyProvider onLogout={handleLogout}>
        <BabyProvider>
          <TimezoneProvider>
            <ThemeProvider>
              <ToastProvider>
                <DynamicTitle />
                <AppContent>{children}</AppContent>
              </ToastProvider>
            </ThemeProvider>
          </TimezoneProvider>
        </BabyProvider>
      </FamilyProvider>
    </DeploymentProvider>
  );
}
