"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import "../modals/AccountModal/account-modal.css";

interface AccountLoginProps {
  lockoutTime: number | null;
  onLockoutChange: (time: number | null) => void;
}

type LoginMode = "login" | "forgot-password";

export default function AccountLogin({
  lockoutTime,
  onLockoutChange,
}: AccountLoginProps) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateEmail(email)) {
      setError("Por favor, insira um e-mail válido");
      return;
    }

    if (mode === "forgot-password") {
      await handleForgotPassword();
      return;
    }

    if (!password) {
      setError("A senha é obrigatória");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const response = await fetch("/api/accounts/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        localStorage.setItem("authToken", result.data.token);

        localStorage.setItem("unlockTime", Date.now().toString());

        localStorage.setItem(
          "accountUser",
          JSON.stringify({
            firstName: result.data.user.firstName,
            email: result.data.user.email,
            familySlug: result.data.user.familySlug || null,
          })
        );

        const authLifeResponse = await fetch("/api/settings/auth-life");
        const authLifeData = await authLifeResponse.json();
        if (authLifeData.success) {
          localStorage.setItem("authLifeSeconds", authLifeData.data.toString());
        }

        const idleTimeResponse = await fetch("/api/settings/idle-time");
        const idleTimeData = await idleTimeResponse.json();
        if (idleTimeData.success) {
          localStorage.setItem("idleTimeSeconds", idleTimeData.data.toString());
        }

        setEmail("");
        setPassword("");

        if (result.data.user.familySlug) {
          router.push(`/${result.data.user.familySlug}`);
        } else {
          router.push("/setup");
        }
      } else {
        setError(result.error || "Falha no login. Tente novamente.");

        const lockoutCheckResponse = await fetch("/api/auth/ip-lockout");
        const lockoutCheckData = await lockoutCheckResponse.json();

        if (
          lockoutCheckData.success &&
          lockoutCheckData.data &&
          lockoutCheckData.data.locked
        ) {
          const remainingTime = lockoutCheckData.data.remainingTime || 300000;
          const remainingMinutes = Math.ceil(remainingTime / 60000);
          onLockoutChange(Date.now() + remainingTime);
          setError(
            `Muitas tentativas falharam. Tente novamente em ${remainingMinutes} minuto${
              remainingMinutes > 1 ? "s" : ""
            }.`
          );
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    try {
      setIsSubmitting(true);
      setError("");

      if (!email.trim()) {
        setError("Por favor, insira seu endereço de e-mail");
        return;
      }

      if (!validateEmail(email)) {
        setError("Por favor, insira um e-mail válido");
        return;
      }

      const response = await fetch("/api/accounts/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowSuccess(true);
        setEmail("");
        setPassword("");

        setTimeout(() => {
          setShowSuccess(false);
          setMode("login");
        }, 5000);
      } else {
        setError(
          result.error ||
            "Falha ao enviar e-mail de redefinição. Tente novamente."
        );
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      setError("Erro de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const showForgotPassword = () => {
    setMode("forgot-password");
    setError("");
    setShowSuccess(false);
  };

  const formatTimeRemaining = (lockoutTime: number) => {
    const remaining = Math.ceil((lockoutTime - Date.now()) / 1000);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (lockoutTime) {
      const interval = setInterval(() => {
        if (lockoutTime - Date.now() <= 0) {
          onLockoutChange(null);
          setError("");
          clearInterval(interval);
        } else {
          const remainingMinutes = Math.ceil(
            (lockoutTime - Date.now()) / 60000
          );
          setError(
            `Muitas tentativas falharam. Tente novamente em ${remainingMinutes} minuto${
              remainingMinutes > 1 ? "s" : ""
            }.`
          );
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime, onLockoutChange]);

  return (
    <div className="w-full space-y-4">
      {showSuccess ? (
        <div className="w-full max-w-[320px] mx-auto">
          <div className="account-modal-success">
            <div className="account-modal-success-icon">✓</div>
            <h3 className="account-modal-success-title">E-mail enviado!</h3>
            <p className="account-modal-success-message">
              Se existir uma conta com esse e-mail, enviamos instruções para
              redefinir a senha. Verifique seu e-mail e siga o link para
              redefinir.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center">
            <p className="text-sm text-gray-500 login-description account-modal-description">
              {mode === "login"
                ? "Faça login na sua conta para acessar o painel da família"
                : "Digite seu e-mail para receber um link de redefinição de senha"}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[320px] mx-auto space-y-4"
          >
            <div>
              <label className="account-modal-label">E-mail</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                placeholder="Digite seu e-mail"
                className="w-full"
                required
                disabled={isSubmitting || !!lockoutTime}
                autoFocus
              />
            </div>

            {mode !== "forgot-password" && (
              <div>
                <label className="account-modal-label">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Digite sua senha"
                  className="w-full"
                  required
                  disabled={isSubmitting || !!lockoutTime}
                />
              </div>
            )}

            {error && (
              <div className="account-modal-error text-center">
                {error}
                {lockoutTime && ` (${formatTimeRemaining(lockoutTime)})`}
              </div>
            )}

            <Button
              type="submit"
              className="account-modal-submit"
              disabled={isSubmitting || !!lockoutTime}
            >
              {isSubmitting
                ? mode === "login"
                  ? "Entrando..."
                  : "Enviando e-mail..."
                : mode === "login"
                ? "Entrar"
                : "Enviar e-mail de redefinição"}
            </Button>

            {mode === "login" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={showForgotPassword}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                  disabled={isSubmitting}
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {mode === "forgot-password" && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                  className="text-sm text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                  disabled={isSubmitting}
                >
                  Voltar para o login
                </button>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
}
