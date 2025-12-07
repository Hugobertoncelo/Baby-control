"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { ThemeToggle } from "@/src/components/ui/theme-toggle";
import { AccountButton } from "@/src/components/ui/account-button";
import { MobileMenu } from "@/src/components/ui/mobile-menu";
import SetupWizard from "@/src/components/SetupWizard";
import AccountModal from "@/src/components/modals/AccountModal";
import { Loader2, AlertCircle } from "lucide-react";
import PrivacyPolicyModal from "@/src/components/modals/privacy-policy";
import TermsOfUseModal from "@/src/components/modals/terms-of-use";
import "../../home/home.css";

interface AccountStatus {
  accountId: string;
  email: string;
  firstName: string;
  verified: boolean;
  hasFamily: boolean;
  familySlug?: string;
}

export default function AccountFamilySetupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(
    null
  );
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);

  useEffect(() => {
    const checkAccountStatus = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        router.push("/coming-soon");
        return;
      }
      try {
        const response = await fetch("/api/accounts/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            const status = data.data;
            if (!status.verified) {
              setError(
                "Por favor, verifique seu endereço de e-mail antes de configurar sua família."
              );
              setIsLoading(false);
              return;
            }
            if (status.hasFamily) {
              router.push(`/${status.familySlug}`);
              return;
            }
            setAccountStatus(status);
            setIsLoading(false);
          } else {
            setError("Falha ao verificar o status da conta.");
            setIsLoading(false);
          }
        } else {
          localStorage.removeItem("authToken");
          localStorage.removeItem("accountUser");
          router.push("/coming-soon");
        }
      } catch (error) {
        setError("Erro de rede. Verifique sua conexão.");
        setIsLoading(false);
      }
    };
    checkAccountStatus();
  }, [router]);

  const handleSetupComplete = (family: {
    id: string;
    name: string;
    slug: string;
  }) => {
    const accountUser = localStorage.getItem("accountUser");
    if (accountUser) {
      try {
        const user = JSON.parse(accountUser);
        user.familySlug = family.slug;
        localStorage.setItem("accountUser", JSON.stringify(user));
      } catch (error) {}
    }
    router.push(`/${family.slug}`);
  };

  if (isLoading) {
    return (
      <div className="saas-homepage">
        <header className="saas-header">
          <nav className="saas-nav">
            <div className="saas-nav-content">
              <Link href="/" className="saas-logo">
                <img
                  src="/sprout-256.png"
                  alt="Logo Baby Control"
                  className="saas-logo-image"
                />
                <span className="saas-logo-text">Baby Control</span>
              </Link>
              <MobileMenu>
                <AccountButton
                  label="Entrar"
                  showIcon={false}
                  initialMode="login"
                  className="saas-account-btn"
                />
                <ThemeToggle variant="light" className="saas-theme-toggle" />
              </MobileMenu>
            </div>
          </nav>
        </header>
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ paddingTop: "6rem" }}
        >
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Verificando status da conta
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              Aguarde enquanto verificamos sua conta...
            </p>
          </div>
        </div>
        <footer className="saas-footer">
          <div className="saas-footer-content">
            <div className="saas-footer-brand">
              <Link href="/" className="saas-logo">
                <img
                  src="/sprout-256.png"
                  alt="Logo Baby Control"
                  className="saas-logo-image"
                />
                <span className="saas-logo-text">Baby Control</span>
              </Link>
              <p className="saas-footer-description">
                Germinando algo incrível.
              </p>
            </div>
            <div className="saas-footer-demo">
              <Button size="lg" className="mb-4" asChild>
                <a
                  href="https://demo.baby-control.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Testar o Demo
                </a>
              </Button>
              <p className="saas-footer-description text-sm mb-4">
                O demo é reiniciado a cada 2 horas
              </p>
              <div className="space-y-1">
                <p className="saas-footer-description text-sm">
                  <strong>Acesso ao Demo:</strong>
                </p>
                <p className="saas-footer-description text-sm">
                  IDs de Login: 01, 02, 03
                </p>
                <p className="saas-footer-description text-sm">PIN: 111222</p>
              </div>
            </div>
          </div>
          <div className="saas-footer-bottom relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p className="saas-footer-copyright">
                © 2025 Hugo Bertoncelo. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
                >
                  Política de Privacidade
                </button>
                <button
                  onClick={() => setShowTermsOfUse(true)}
                  className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
                >
                  Termos de Uso
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saas-homepage">
        <header className="saas-header">
          <nav className="saas-nav">
            <div className="saas-nav-content">
              <Link href="/" className="saas-logo">
                <img
                  src="/sprout-256.png"
                  alt="Logo Baby Control"
                  className="saas-logo-image"
                />
                <span className="saas-logo-text">Baby Control</span>
              </Link>
              <MobileMenu>
                <AccountButton
                  label="Entrar"
                  showIcon={false}
                  initialMode="login"
                  className="saas-account-btn"
                />
                <ThemeToggle variant="light" className="saas-theme-toggle" />
              </MobileMenu>
            </div>
          </nav>
        </header>
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ paddingTop: "6rem" }}
        >
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
              Acesso Negado
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => router.push("/coming-soon")}
              className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
            >
              Voltar para o Início
            </button>
          </div>
        </div>
        <footer className="saas-footer">
          <div className="saas-footer-content">
            <div className="saas-footer-brand">
              <Link href="/" className="saas-logo">
                <img
                  src="/sprout-256.png"
                  alt="Logo Baby Control"
                  className="saas-logo-image"
                />
                <span className="saas-logo-text">Baby Control</span>
              </Link>
              <p className="saas-footer-description">
                Germinando algo incrível.
              </p>
            </div>
            <div className="saas-footer-demo">
              <Button size="lg" className="mb-4" asChild>
                <a
                  href="https://demo.baby-control.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Testar o Demo
                </a>
              </Button>
              <p className="saas-footer-description text-sm mb-4">
                O demo é reiniciado a cada 2 horas
              </p>
              <div className="space-y-1">
                <p className="saas-footer-description text-sm">
                  <strong>Acesso ao Demo:</strong>
                </p>
                <p className="saas-footer-description text-sm">
                  IDs de Login: 01, 02, 03
                </p>
                <p className="saas-footer-description text-sm">PIN: 111222</p>
              </div>
            </div>
          </div>
          <div className="saas-footer-bottom relative flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <p className="saas-footer-copyright">
                © 2025 Hugo Bertoncelo. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-4 text-sm">
                <button
                  onClick={() => setShowPrivacyPolicy(true)}
                  className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
                >
                  Política de Privacidade
                </button>
                <button
                  onClick={() => setShowTermsOfUse(true)}
                  className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
                >
                  Termos de Uso
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (!accountStatus) {
    return null;
  }

  return (
    <div className="saas-homepage">
      <header className="saas-header">
        <nav className="saas-nav">
          <div className="saas-nav-content">
            <Link href="/" className="saas-logo">
              <img
                src="/sprout-256.png"
                alt="Logo Baby Control"
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Baby Control</span>
            </Link>
            <MobileMenu>
              <AccountButton className="saas-account-btn" />
              <ThemeToggle variant="light" className="saas-theme-toggle" />
            </MobileMenu>
          </div>
        </nav>
      </header>
      <main className="min-h-screen">
        <div className="w-full h-full">
          <SetupWizard onComplete={handleSetupComplete} initialSetup={false} />
        </div>
      </main>
      <footer className="saas-footer">
        <div className="saas-footer-content">
          <div className="saas-footer-brand">
            <Link href="/" className="saas-logo">
              <img
                src="/sprout-256.png"
                alt="Logo Baby Control"
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Baby Control</span>
            </Link>
            <p className="saas-footer-description">Germinando algo incrível.</p>
          </div>
          <div className="saas-footer-demo">
            <Button size="lg" className="mb-4" asChild>
              <a
                href="https://demo.baby-control.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                Testar o Demo
              </a>
            </Button>
            <p className="saas-footer-description text-sm mb-4">
              O demo é reiniciado a cada 2 horas
            </p>
            <div className="space-y-1">
              <p className="saas-footer-description text-sm">
                <strong>Acesso ao Demo:</strong>
              </p>
              <p className="saas-footer-description text-sm">
                IDs de Login: 01, 02, 03
              </p>
              <p className="saas-footer-description text-sm">PIN: 111222</p>
            </div>
          </div>
        </div>
        <div className="saas-footer-bottom relative flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <p className="saas-footer-copyright">
              © 2025 Hugo Bertoncelo. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <button
                onClick={() => setShowPrivacyPolicy(true)}
                className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Política de Privacidade
              </button>
              <button
                onClick={() => setShowTermsOfUse(true)}
                className="text-gray-600 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer underline-offset-4 hover:underline"
              >
                Termos de Uso
              </button>
            </div>
          </div>
        </div>
      </footer>
      <AccountModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
      <PrivacyPolicyModal
        open={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
      <TermsOfUseModal
        open={showTermsOfUse}
        onClose={() => setShowTermsOfUse(false)}
      />
    </div>
  );
}
