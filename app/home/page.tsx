"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { ThemeToggle } from "@/src/components/ui/theme-toggle";
import { AccountButton } from "@/src/components/ui/account-button";
import AccountModal from "@/src/components/modals/AccountModal";
import { useTheme } from "@/src/context/theme";
import { Github, Users, TrendingUp, Calendar, BarChart3 } from "lucide-react";
import PrivacyPolicyModal from "@/src/components/modals/privacy-policy";
import TermsOfUseModal from "@/src/components/modals/terms-of-use";
import "./home.css";

const home = () => {
  const { theme } = useTheme();
  const [currentActivity, setCurrentActivity] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentCaretakerVideo, setCurrentCaretakerVideo] = useState(0);
  const [isCaretakerTransitioning, setIsCaretakerTransitioning] =
    useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<
    "login" | "register" | "verify" | "reset-password"
  >("register");
  const [verificationToken, setVerificationToken] = useState<
    string | undefined
  >();
  const [resetToken, setResetToken] = useState<string | undefined>();

  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfUse, setShowTermsOfUse] = useState(false);

  const [showAccountManager, setShowAccountManager] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const activities = [
    "Sono",
    "Mamadeiras",
    "Fraldas",
    "Banhos",
    "Conquistas",
    "Remédios",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentActivity((prev) => (prev + 1) % activities.length);
        setIsAnimating(false);
      }, 400);
    }, 2000);
    return () => clearInterval(interval);
  }, [activities.length]);

  useEffect(() => {
    const scheduleNextTransition = () => {
      const videoDurations = [
        [15500, 14000],
        [7500, 9500],
      ];

      const themeIndex = theme === "dark" ? 1 : 0;
      const currentDuration = videoDurations[currentCaretakerVideo][themeIndex];

      const timeout = setTimeout(() => {
        setIsCaretakerTransitioning(true);
        setTimeout(() => {
          setCurrentCaretakerVideo((prev) => (prev + 1) % 2);
          setIsCaretakerTransitioning(false);
        }, 100);
      }, currentDuration);

      return timeout;
    };

    const timeout = scheduleNextTransition();
    return () => clearTimeout(timeout);
  }, [currentCaretakerVideo, theme]);

  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#verify?")) {
        const urlParams = new URLSearchParams(hash.substring(8));
        const token = urlParams.get("token");
        if (token) {
          setVerificationToken(token);
          setAccountModalMode("verify");
          setShowAccountModal(true);
          window.history.replaceState(null, "", window.location.pathname);
        }
      } else if (hash.startsWith("#passwordreset?")) {
        const urlParams = new URLSearchParams(hash.substring(15));
        const token = urlParams.get("token");
        if (token) {
          setResetToken(token);
          setAccountModalMode("reset-password");
          setShowAccountModal(true);
          window.history.replaceState(null, "", window.location.pathname);
        }
      }
    };

    const checkQueryParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const upgrade = urlParams.get("upgrade");
      const family = urlParams.get("family");

      if (upgrade === "true") {
        setAccountModalMode("login");
        setShowAccountModal(true);

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("upgrade");
        newUrl.searchParams.delete("family");
        window.history.replaceState(null, "", newUrl.toString());
      }
    };

    checkHash();
    checkQueryParams();

    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailValue) {
      setEmailError("Email é obrigatório");
      return false;
    }
    if (!emailRegex.test(emailValue)) {
      setEmailError("Por favor, insira um endereço de email válido");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleFormSubmit = async () => {
    if (!validateEmail(email)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao se inscrever");
      }

      setShowSuccess(true);
      setEmail("");
      setFirstName("");
      setLastName("");

      setTimeout(() => {
        setShowSuccess(false);
      }, 10000);
    } catch (error) {
      console.error("Erro ao enviar inscrição:", error);
      alert("Houve um erro ao se inscrever. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="saas-homepage">
      <header className="saas-header">
        <nav className="saas-nav">
          <div className="saas-nav-content">
            <div className="saas-logo">
              <img
                src="/sprout-256.png"
                alt="Logotipo do Baby Control"
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Baby Control</span>
            </div>
            <div className="flex items-center gap-2">
              <AccountButton
                label="Inscrever-se"
                showIcon={false}
                variant="link"
                initialMode="register"
                onOpenAccountModal={(mode) => {
                  setAccountModalMode(mode);
                  setShowAccountModal(true);
                }}
                hideWhenLoggedIn={true}
              />
              <AccountButton
                label="Entrar"
                showIcon={false}
                initialMode="login"
                onOpenAccountModal={(mode) => {
                  setAccountModalMode(mode);
                  setShowAccountModal(true);
                }}
                className="saas-account-btn"
                onAccountManagerOpen={() => setShowAccountManager(true)}
              />
              <ThemeToggle variant="light" className="saas-theme-toggle" />
            </div>
          </div>
        </nav>
      </header>

      <section className="saas-hero">
        <div className="saas-hero-content">
          <div className="saas-hero-text">
            <h1 className="saas-hero-title">
              Acompanhe facilmente o{" "}
              <span
                className={`saas-hero-animated-word ${
                  isAnimating ? "animating" : ""
                }`}
              >
                {activities[currentActivity]}
              </span>{" "}
              do seu bebê
            </h1>
            <p className="saas-hero-description">
              A solução completa de acompanhamento de bebês criada por pais para
              pais. Monitore sono, alimentação, fraldas, marcos e muito mais com
              nossa plataforma intuitiva e amigável para a família.
            </p>
            <p className="saas-hero-description">
              <b>
                Fácil de usar. Focado na privacidade. Acessível em qualquer
                lugar.
              </b>
            </p>
          </div>
        </div>
      </section>

      <section className="saas-main-demo">
        <div className="saas-main-demo-content"></div>
      </section>

      <section className="saas-transition-section">
        <div className="saas-transition-content"></div>
      </section>

      <section id="demo" className="saas-cta">
        <div className="saas-cta-content">
          <h2 className="saas-cta-title">
            Não acredite apenas em nossa palavra - experimente você mesmo!
          </h2>
          <p className="saas-cta-description">
            Experimente o Baby Control com nosso ambiente de demonstração ao
            vivo baseado em dados realistas.
          </p>
          <div className="saas-cta-actions">
            <div className="max-w-md mx-auto space-y-4">
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                asChild
              >
                <a href="/demo">Experimente a Demonstração ao Vivo</a>
              </Button>
              <div className="saas-demo-details">
                <p className="saas-demo-details-title">
                  Detalhes de Acesso à Demonstração:
                </p>
                <div className="saas-demo-details-grid">
                  <div>
                    <span className="saas-demo-label">ID de Login:</span>
                    <span className="saas-demo-value">01</span>
                  </div>
                  <div>
                    <span className="saas-demo-label">PIN:</span>
                    <span className="saas-demo-value">111111</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="saas-feature-section saas-feature-section-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="saas-feature-title">
                Gerencie Sua Equipe de Cuidados
              </h3>
              <p className="saas-feature-description">
                Adicione vários cuidadores à sua conta familiar. Pais, avós,
                babás e provedores de creche podem contribuir para acompanhar as
                atividades do seu bebê com acesso seguro e individual.
              </p>
              <ul className="saas-feature-list">
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Acesso fácil por ID e PIN para cada cuidador (sem necessidade
                  de conta)
                </li>
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Tudo acessível a partir do seu endereço web familiar único
                </li>
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
                  Sincronização em tempo real em todos os dispositivos
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative overflow-visible">
              <div className="absolute bottom-16 -right-12 z-0">
                <Users size={200} className="text-teal-500 opacity-20" />
              </div>
              <div className="relative z-10 max-w-sm mx-auto"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="saas-feature-section saas-feature-section-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative overflow-visible">
              <div className="absolute bottom-16 -left-12 z-0">
                <TrendingUp
                  size={200}
                  className="text-emerald-500 opacity-20"
                />
              </div>
              <div className="relative z-10 max-w-sm mx-auto"></div>
            </div>
            <div>
              <h3 className="saas-feature-title">
                Acompanhe Informações Importantes do Bebê
              </h3>
              <p className="saas-feature-description">
                Veja instantaneamente os últimos eventos do seu bebê, verifique
                contatos familiares e visualize tendências do último mês—como
                médias de mamadas, fraldas, janelas de vigília, janelas de sono
                e muito mais—tudo em um só lugar.
              </p>
              <ul className="saas-feature-list">
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Veja as atividades importantes mais recentes de relance
                </li>
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Verifique rapidamente contatos de emergência
                </li>
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Identifique tendências e mudanças nas rotinas diárias do seu
                  bebê
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="saas-feature-section saas-feature-section-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h3 className="saas-feature-title">
                Visão Geral da Atividade Diária
              </h3>
              <p className="saas-feature-description">
                Obtenha uma visão completa do dia do seu bebê com resumos
                diários intuitivos. Veja horários de alimentação, trocas de
                fraldas, períodos de sono e atividades de relance.
              </p>
              <ul className="saas-feature-list">
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Visualização em linha do tempo das atividades diárias
                </li>
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Estatísticas rápidas e totais do dia
                </li>
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Filtro para atividades específicas
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative overflow-visible">
              <div className="absolute bottom-16 -right-12 z-0">
                <BarChart3 size={200} className="text-teal-600 opacity-20" />
              </div>
              <div className="relative z-10 max-w-sm mx-auto"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="saas-feature-section saas-feature-section-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative overflow-visible">
              <div className="absolute bottom-16 -left-12 z-0">
                <Calendar size={200} className="text-teal-600 opacity-20" />
              </div>
              <div className="relative z-10 max-w-sm mx-auto"></div>
            </div>
            <div>
              <h3 className="saas-feature-title">
                Agende e Planeje com Antecedência
              </h3>
              <p className="saas-feature-description">
                Acompanhe compromissos, horários de cuidadores e eventos
                importantes com nosso calendário integrado. Mantenha todos
                informados!
              </p>
              <ul className="saas-feature-list">
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Ajude a coordenar horários entre cuidadores
                </li>
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Acompanhe compromissos
                </li>
                <li className="saas-feature-list-item">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></span>
                  Adicione eventos e lembretes personalizados
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section
        id="signup"
        className="py-16 bg-gradient-to-r from-teal-600 to-emerald-600"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Preços fáceis de entender
            </h2>
            <p className="text-xl text-teal-100 mb-8">
              Assinatura de $2, ou $12 para sempre
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="saas-pricing-card saas-pricing-card-on-gradient">
              <div className="mb-4">
                <h3 className="saas-pricing-card-title saas-pricing-card-title-on-gradient">
                  Mensal
                </h3>
                <p className="saas-pricing-card-description saas-pricing-card-description-on-gradient">
                  Perfeito para experimentar o Baby Control
                </p>
              </div>
              <div className="mb-6">
                <span className="saas-pricing-card-price saas-pricing-card-price-on-gradient">
                  $2
                </span>
                <span className="saas-pricing-card-interval saas-pricing-card-interval-on-gradient">
                  /mês
                </span>
              </div>
              <ul className="saas-pricing-card-features">
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Bebês e cuidadores ilimitados</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Acompanhe todas as atividades</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Calendário e lembretes</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Acompanhamento de medicamentos</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Exportação de dados</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Interface amigável para dispositivos móveis</span>
                </li>
              </ul>
            </div>

            <div className="saas-pricing-card saas-pricing-card-highlighted saas-pricing-card-on-gradient">
              <div className="saas-pricing-card-badge saas-pricing-card-badge-on-gradient">
                MELHOR VALOR
              </div>
              <div className="mb-4">
                <h3 className="saas-pricing-card-title saas-pricing-card-title-on-gradient">
                  Para Sempre
                </h3>
                <p className="saas-pricing-card-description saas-pricing-card-description-on-gradient">
                  Pagamento único, acesso vitalício
                </p>
              </div>
              <div className="mb-6">
                <span className="saas-pricing-card-price saas-pricing-card-price-on-gradient">
                  $12
                </span>
                <span className="saas-pricing-card-interval saas-pricing-card-interval-on-gradient">
                  {" "}
                  para sempre
                </span>
              </div>
              <ul className="saas-pricing-card-features">
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Tudo no Mensal</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Atualizações vitalícias</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Sem pagamentos recorrentes</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Suporte prioritário para sempre</span>
                </li>
                <li className="saas-pricing-card-feature saas-pricing-card-feature-on-gradient">
                  <span className="saas-pricing-card-check saas-pricing-card-check-on-gradient">
                    ✓
                  </span>
                  <span>Melhor valor a longo prazo</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="saas-feature-section saas-feature-section-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="saas-feature-title mb-6">Comece a Acompanhar Hoje</h2>
          <p className="saas-feature-description text-lg mb-8 max-w-2xl mx-auto">
            Pronto para tornar o acompanhamento de trocas de fraldas e mamadas
            noturnas uma brincadeira? Experimente o Baby Control gratuitamente
            por 14 dias — sono não incluído!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
              onClick={() => {
                setAccountModalMode("register");
                setShowAccountModal(true);
              }}
            >
              Clique Aqui para Começar
            </Button>
          </div>
          <p className="saas-feature-description text-sm mt-6 max-w-lg mx-auto">
            Não é necessário cartão de crédito ou compromisso.
          </p>
        </div>
      </section>

      <footer className="saas-footer">
        <div className="saas-footer-content">
          <div className="saas-footer-brand">
            <div className="saas-logo">
              <img
                src="/sprout-256.png"
                alt="Logotipo do Baby Control"
                className="saas-logo-image"
              />
              <span className="saas-logo-text">Baby Control</span>
            </div>
            <p className="saas-footer-description">
              Brotando em algo incrível.
            </p>
          </div>
          <div className="saas-footer-demo">
            <Button size="lg" className="mb-4" asChild>
              <a href="/demo">Experimente a Demonstração</a>
            </Button>
            <div className="space-y-1">
              <p className="saas-footer-description text-sm">
                <strong>Acesso à Demonstração:</strong>
              </p>
              <p className="saas-footer-description text-sm">ID de Login: 01</p>
              <p className="saas-footer-description text-sm">PIN: 111111</p>
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
          <div className="flex items-center gap-2 saas-footer-copyright">
            <p>Siga no</p>
            <Button variant="outline" size="sm" asChild className="p-2">
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
                className="saas-github-link"
              >
                <Github size={16} />
              </a>
            </Button>
          </div>
          <div style={{ width: "200px" }}>
            <a href="" className="group block">
              <img
                src="https://img.buymeacoffee.com/button-api/?text=Support This Project&emoji=☕&slug=joverton&button_colour=008375&font_colour=ffffff&font_family=Inter&outline_colour=ffffff&coffee_colour=FFDD00"
                alt="Apoie Este Projeto"
                style={{
                  width: "100%",
                  height: "auto",
                  transition: "transform 0.8s ease",
                }}
                className="group-hover:scale-105"
              />
            </a>
          </div>
        </div>
      </footer>

      <AccountModal
        open={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        initialMode={accountModalMode}
        verificationToken={verificationToken}
        resetToken={resetToken}
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
};

export default home;
