import React, { useEffect, useState } from "react";
import ChangelogModal from "@/src/components/modals/changelog";
import FeedbackForm from "@/src/components/forms/FeedbackForm";
import {
  X,
  Settings,
  LogOut,
  MessageSquare,
  CreditCard,
  Clock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import ThemeToggle from "@/src/components/ui/theme-toggle";
import { ShareButton } from "@/src/components/ui/share-button";
import { Label } from "@/src/components/ui/label";
import Image from "next/image";
import { useTheme } from "@/src/context/theme";
import { useDeployment } from "@/app/context/deployment";
import { cn } from "@/src/lib/utils";
import { sideNavStyles, triggerButtonVariants } from "./side-nav.styles";
import {
  SideNavProps,
  SideNavTriggerProps,
  SideNavItemProps,
} from "./side-nav.types";
import { ReactNode } from "react";
import "./side-nav.css";
import packageInfo from "@/package.json";

interface FooterButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  ariaLabel?: string;
}

interface AccountStatus {
  accountId: string;
  email: string;
  firstName: string;
  lastName?: string;
  verified: boolean;
  hasFamily: boolean;
  familySlug?: string;
  familyName?: string;
  betaparticipant: boolean;
  closed: boolean;
  closedAt?: string;
  planType?: string;
  planExpires?: string;
  trialEnds?: string;
  subscriptionActive: boolean;
  accountStatus:
    | "active"
    | "inactive"
    | "trial"
    | "expired"
    | "closed"
    | "no_family";
}

const FooterButton: React.FC<FooterButtonProps> = ({
  icon,
  label,
  onClick,
  ariaLabel,
}) => {
  return (
    <button
      className={cn(sideNavStyles.settingsButton, "side-nav-settings-button")}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <span className={sideNavStyles.settingsIcon}>{icon}</span>
      <span className={sideNavStyles.settingsLabel}>{label}</span>
    </button>
  );
};

export const SideNavTrigger: React.FC<SideNavTriggerProps> = ({
  onClick,
  isOpen,
  className,
  children,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(triggerButtonVariants({ isOpen }), className)}
    >
      {children}
    </div>
  );
};

export const SideNavItem: React.FC<SideNavItemProps> = ({
  path,
  label,
  icon,
  isActive,
  onClick,
  className,
}) => {
  return (
    <button
      className={cn(
        sideNavStyles.navItem,
        isActive && sideNavStyles.navItemActive,
        className,
        isActive && "active"
      )}
      onClick={() => onClick(path)}
    >
      {icon && <span className={sideNavStyles.navItemIcon}>{icon}</span>}
      <span className={sideNavStyles.navItemLabel}>{label}</span>
    </button>
  );
};

export const SideNav: React.FC<SideNavProps> = ({
  isOpen,
  onClose,
  currentPath,
  onNavigate,
  onSettingsClick,
  onLogout,
  isAdmin,
  className,
  nonModal = false,
  familySlug,
  familyName,
}) => {
  const { theme } = useTheme();
  const { isSaasMode } = useDeployment();
  const [isSystemDarkMode, setIsSystemDarkMode] = useState<boolean>(false);
  const [showChangelog, setShowChangelog] = useState<boolean>(false);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [isAccountAuth, setIsAccountAuth] = useState<boolean>(false);

  useEffect(() => {
    const fetchAccountStatus = async () => {
      if (!isSaasMode) return;

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        setIsAccountAuth(false);
        return;
      }

      try {
        const payload = authToken.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));
        const isAccountBased = decodedPayload.isAccountAuth || false;
        setIsAccountAuth(isAccountBased);

        if (!isAccountBased) return;

        const response = await fetch("/api/accounts/status", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAccountStatus(data.data);
          }
        }
      } catch (error) {}
    };

    fetchAccountStatus();
  }, [isSaasMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const darkModeMediaQuery = window.matchMedia(
        "(prefers-color-scheme: dark)"
      );
      setIsSystemDarkMode(darkModeMediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsSystemDarkMode(e.matches);
      };

      darkModeMediaQuery.addEventListener("change", handleChange);
      return () =>
        darkModeMediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !nonModal) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    if (isOpen && !nonModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, nonModal]);

  return (
    <>
      {!nonModal && (
        <div
          className={cn(
            sideNavStyles.overlay,
            isOpen ? sideNavStyles.overlayOpen : sideNavStyles.overlayClosed
          )}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          nonModal ? sideNavStyles.containerNonModal : sideNavStyles.container,
          !nonModal &&
            (isOpen
              ? sideNavStyles.containerOpen
              : sideNavStyles.containerClosed),
          className,
          "side-nav"
        )}
        role={nonModal ? "navigation" : "dialog"}
        aria-modal={nonModal ? "false" : "true"}
        aria-label="Navegação principal"
      >
        <header className="w-full bg-white sticky top-0 z-40 side-nav-header">
          <div className="mx-auto">
            <div
              className={cn(
                "flex justify-between items-center min-h-20",
                sideNavStyles.header
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center">
                  <Image
                    src="/sprout-128.png"
                    alt="Logo Sprout"
                    width={40}
                    height={40}
                    className={sideNavStyles.logo}
                    priority
                  />
                </div>

                <div className="flex flex-col justify-center flex-1">
                  {isSaasMode ? (
                    <button
                      onClick={() => {
                        window.location.href = "/";
                      }}
                      className="text-left cursor-pointer hover:opacity-80 transition-opacity"
                      aria-label="Ir para a página inicial"
                    >
                      <span
                        className={cn(
                          sideNavStyles.appName,
                          "side-nav-app-name"
                        )}
                      >
                        Baby Control
                      </span>
                    </button>
                  ) : (
                    <span
                      className={cn(sideNavStyles.appName, "side-nav-app-name")}
                    >
                      Baby Control
                    </span>
                  )}

                  {familyName && (
                    <div className="flex items-center gap-2 mt-1">
                      <Label className="text-sm text-gray-600 truncate">
                        {familyName}
                      </Label>
                      {familySlug && (
                        <ShareButton
                          familySlug={familySlug}
                          familyName={familyName}
                          variant="ghost"
                          size="sm"
                          showText={false}
                          className="h-5 w-5 p-0"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {!nonModal && (
                <button
                  onClick={onClose}
                  className={cn(
                    sideNavStyles.closeButton,
                    "side-nav-close-button"
                  )}
                  aria-label="Fechar navegação"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        </header>

        <nav className={sideNavStyles.navItems}>
          <SideNavItem
            path="/log-entry"
            label="Entrada de registro"
            isActive={currentPath === "/log-entry"}
            onClick={onNavigate}
            className="side-nav-item"
          />
          <SideNavItem
            path="/full-log"
            label="Registro completo"
            isActive={currentPath === "/full-log"}
            onClick={onNavigate}
            className="side-nav-item"
          />
          <SideNavItem
            path="/calendar"
            label="Calendário"
            isActive={currentPath === "/calendar"}
            onClick={onNavigate}
            className="side-nav-item"
          />
        </nav>

        <div className="w-full text-center mb-4">
          <span
            className="text-xs text-gray-500 cursor-pointer hover:text-teal-600 transition-colors"
            onClick={() => setShowChangelog(true)}
            aria-label="Ver histórico de alterações"
          >
            v{packageInfo.version}
          </span>

          {isSaasMode && (
            <div className="mt-2">
              <button
                className="flex items-center justify-center w-full text-xs text-gray-500 hover:text-emerald-600 transition-colors cursor-pointer"
                onClick={() => setShowFeedback(true)}
                aria-label="Enviar feedback sobre o app"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Enviar feedback
              </button>
            </div>
          )}

          {isSaasMode && isAccountAuth && accountStatus && (
            <>
              {accountStatus.trialEnds &&
                !accountStatus.subscriptionActive &&
                !accountStatus.betaparticipant &&
                accountStatus.accountStatus === "trial" && (
                  <div className="mt-4 px-4">
                    <div
                      className={cn(
                        "bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2",
                        "side-nav-trial-container"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center text-amber-700",
                          "side-nav-trial-header"
                        )}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-xs font-medium">
                          Versão de avaliação
                        </span>
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-xs text-amber-600",
                            "side-nav-trial-text"
                          )}
                        >
                          Término:{" "}
                          {new Date(accountStatus.trialEnds).toLocaleDateString(
                            "pt-BR",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white"
                        onClick={() => setShowPaymentModal(true)}
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Comprar agora
                      </Button>
                    </div>
                  </div>
                )}
            </>
          )}
        </div>

        <ChangelogModal
          open={showChangelog}
          onClose={() => setShowChangelog(false)}
          version={packageInfo.version}
        />

        {isSaasMode && (
          <FeedbackForm
            isOpen={showFeedback}
            onClose={() => setShowFeedback(false)}
            onSuccess={() => {
              setShowFeedback(false);
              if (!nonModal) {
                onClose();
              }
            }}
          />
        )}

        <div className={cn(sideNavStyles.footer, "side-nav-footer")}>
          <ThemeToggle className="mb-2" />

          {isAdmin && (
            <FooterButton
              icon={<Settings />}
              label="Configurações"
              onClick={onSettingsClick}
            />
          )}

          <FooterButton icon={<LogOut />} label="Sair" onClick={onLogout} />
        </div>
      </div>
    </>
  );
};

export default SideNav;
