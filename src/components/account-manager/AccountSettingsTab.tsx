import React, { useState, useCallback } from "react";
import { cn } from "@/src/lib/utils";
import { styles } from "./account-manager.styles";
import { AccountSettingsTabProps } from "./account-manager.types";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import PaymentModal from "./PaymentModal";
import PaymentHistory from "./PaymentHistory";
import {
  User,
  Mail,
  Home,
  Link,
  Download,
  AlertTriangle,
  Edit,
  Save,
  X,
  Loader2,
  CheckCircle,
  Key,
  Crown,
  Calendar,
  Shield,
  CreditCard,
  Receipt,
} from "lucide-react";

const AccountSettingsTab: React.FC<AccountSettingsTabProps> = ({
  accountStatus,
  familyData,
  onDataRefresh,
}) => {
  const [editingAccount, setEditingAccount] = useState(false);
  const [editingFamily, setEditingFamily] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const [accountFormData, setAccountFormData] = useState({
    firstName: accountStatus.firstName,
    lastName: accountStatus.lastName || "",
    email: accountStatus.email,
  });

  const [familyFormData, setFamilyFormData] = useState({
    name: familyData?.name || "",
    slug: familyData?.slug || "",
  });

  const [passwordFormData, setPasswordFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordStep, setPasswordStep] = useState<"confirm" | "change">(
    "confirm"
  );
  const [changingPasswordLoading, setChangingPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [confirmingClosure, setConfirmingClosure] = useState(false);
  const [closurePasswordLoading, setClosurePasswordLoading] = useState(false);
  const [closurePasswordMessage, setClosurePasswordMessage] = useState("");
  const [closurePasswordData, setClosurePasswordData] = useState({
    password: "",
  });
  const [accountClosed, setAccountClosed] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(5);

  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });

  const [savingAccount, setSavingAccount] = useState(false);
  const [savingFamily, setSavingFamily] = useState(false);
  const [downloadingData, setDownloadingData] = useState(false);
  const [closingAccount, setClosingAccount] = useState(false);

  const [slugError, setSlugError] = useState("");
  const [checkingSlug, setCheckingSlug] = useState(false);

  const [accountMessage, setAccountMessage] = useState("");
  const [familyMessage, setFamilyMessage] = useState("");

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [showPaymentHistory, setShowPaymentHistory] = useState(false);

  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isActive: boolean;
    planType: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    paymentMethod?: {
      brand: string;
      last4: string;
    };
  } | null>(null);
  const [loadingSubscriptionStatus, setLoadingSubscriptionStatus] =
    useState(false);
  const [renewingSubscription, setRenewingSubscription] = useState(false);

  const checkSlugUniqueness = useCallback(
    async (slug: string) => {
      if (
        !familyData ||
        !slug ||
        slug.trim() === "" ||
        slug === familyData.slug
      ) {
        setSlugError("");
        return;
      }

      setCheckingSlug(true);
      try {
        const authToken = localStorage.getItem("authToken");
        const response = await fetch(
          `/api/family/by-slug/${encodeURIComponent(slug)}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        const data = await response.json();

        if (response.status === 400) {
          setSlugError(data.error || "Formato de slug inválido");
        } else if (
          data.success &&
          data.data &&
          data.data.id !== familyData.id
        ) {
          setSlugError("Essa lesma já foi escolhida.");
        } else {
          setSlugError("");
        }
      } catch (error) {
        console.error("Error checking slug:", error);
        setSlugError("Erro ao verificar a disponibilidade do slug");
      } finally {
        setCheckingSlug(false);
      }
    },
    [familyData?.id, familyData?.slug]
  );

  const handleAccountSave = async () => {
    setSavingAccount(true);
    setAccountMessage("");

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/accounts/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          firstName: accountFormData.firstName,
          lastName: accountFormData.lastName,
          email: accountFormData.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingAccount(false);
        setAccountMessage("Informações da conta atualizadas com sucesso");
        onDataRefresh();

        setTimeout(() => setAccountMessage(""), 3000);
      } else {
        setAccountMessage(
          `Error: ${data.error || "Falha ao atualizar a conta"}`
        );
      }
    } catch (error) {
      console.error("Error updating account:", error);
      setAccountMessage("Erro: Falha ao atualizar a conta");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleFamilySave = async () => {
    if (slugError) {
      setFamilyMessage("Por favor, corrija o erro de slug antes de salvar.");
      return;
    }

    setSavingFamily(true);
    setFamilyMessage("");

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/family", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: familyFormData.name,
          slug: familyFormData.slug,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEditingFamily(false);
        setFamilyMessage("Informações da família atualizadas com sucesso");
        onDataRefresh();

        setTimeout(() => setFamilyMessage(""), 3000);
      } else {
        setFamilyMessage(
          `Error: ${data.error || "Não foi possível atualizar a família"}`
        );
      }
    } catch (error) {
      console.error("Error updating family:", error);
      setFamilyMessage("Erro: Falha ao atualizar a família");
    } finally {
      setSavingFamily(false);
    }
  };

  const handleDataDownload = async () => {
    setDownloadingData(true);

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/accounts/download-data", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `${familyData?.slug || "account"}-data-export.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || "Falha ao baixar os dados"}`);
      }
    } catch (error) {
      console.error("Error downloading data:", error);
      alert("Erro: Falha ao baixar os dados");
    } finally {
      setDownloadingData(false);
    }
  };

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!accountStatus.subscriptionId || accountStatus.planType !== "sub") {
      return;
    }

    setLoadingSubscriptionStatus(true);
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(
        "/api/accounts/payments/subscription-status",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setSubscriptionStatus(data.data);
      }
    } catch (error) {
      console.error("Error fetching subscription status:", error);
    } finally {
      setLoadingSubscriptionStatus(false);
    }
  }, [accountStatus.subscriptionId, accountStatus.planType]);

  React.useEffect(() => {
    if (
      accountStatus.subscriptionActive &&
      accountStatus.subscriptionId &&
      accountStatus.planType === "sub"
    ) {
      fetchSubscriptionStatus();
    }
  }, [
    accountStatus.subscriptionActive,
    accountStatus.subscriptionId,
    accountStatus.planType,
    fetchSubscriptionStatus,
  ]);

  const handleRenewSubscription = async () => {
    setRenewingSubscription(true);
    try {
      const authToken = localStorage.getItem("authToken");

      if (subscriptionStatus?.currentPeriodEnd) {
        const periodEndDate = new Date(subscriptionStatus.currentPeriodEnd);
        const now = new Date();

        if (now < periodEndDate) {
          const response = await fetch(
            "/api/accounts/payments/reactivate-subscription",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          const data = await response.json();
          if (data.success) {
            await fetchSubscriptionStatus();
            onDataRefresh();
          } else {
            alert(`Error: ${data.error || "Falha ao reativar a assinatura"}`);
          }
        } else {
          setShowPaymentModal(true);
        }
      } else {
        setShowPaymentModal(true);
      }
    } catch (error) {
      console.error("Error renewing subscription:", error);
      alert("Erro: Falha ao renovar a assinatura");
    } finally {
      setRenewingSubscription(false);
    }
  };

  const updatePasswordValidation = (password: string) => {
    setPasswordValidation({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    });
  };

  const handlePasswordConfirm = async () => {
    if (!passwordFormData.currentPassword) {
      setPasswordMessage("Por favor, insira sua senha atual.");
      return;
    }

    setChangingPasswordLoading(true);
    setPasswordMessage("");

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/accounts/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.currentPassword,
        }),
      });

      const data = await response.json();

      if (
        response.status === 400 &&
        data.error === "A nova senha deve ser diferente da senha atual."
      ) {
        setPasswordStep("change");
        setPasswordMessage("");
      } else if (
        response.status === 400 &&
        data.error === "A senha atual está incorreta"
      ) {
        setPasswordMessage("A senha atual está incorreta");
      } else if (!data.success) {
        setPasswordMessage(
          `Error: ${data.error || "Falha ao verificar a senha"}`
        );
      }
    } catch (error) {
      console.error("Error verifying password:", error);
      setPasswordMessage("Erro: Falha ao verificar a senha");
    } finally {
      setChangingPasswordLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordFormData.newPassword) {
      setPasswordMessage("Por favor, insira uma nova senha.");
      return;
    }

    if (
      !passwordValidation.length ||
      !passwordValidation.lowercase ||
      !passwordValidation.uppercase ||
      !passwordValidation.number ||
      !passwordValidation.special
    ) {
      setPasswordMessage("A nova senha não atende aos requisitos.");
      return;
    }

    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setPasswordMessage("As senhas não coincidem.");
      return;
    }

    if (passwordFormData.currentPassword === passwordFormData.newPassword) {
      setPasswordMessage("A nova senha deve ser diferente da senha atual.");
      return;
    }

    setChangingPasswordLoading(true);
    setPasswordMessage("");

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/accounts/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: passwordFormData.currentPassword,
          newPassword: passwordFormData.newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setPasswordMessage("Senha alterada com sucesso");
        setChangingPassword(false);
        setPasswordStep("confirm");
        setPasswordFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setPasswordValidation({
          length: false,
          lowercase: false,
          uppercase: false,
          number: false,
          special: false,
        });

        setTimeout(() => setPasswordMessage(""), 3000);
      } else {
        setPasswordMessage(
          `Error: ${data.error || "Falha ao alterar a senha"}`
        );
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordMessage("Erro: Falha ao alterar a senha");
    } finally {
      setChangingPasswordLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setChangingPassword(false);
    setPasswordStep("confirm");
    setPasswordFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordValidation({
      length: false,
      lowercase: false,
      uppercase: false,
      number: false,
      special: false,
    });
    setPasswordMessage("");
  };

  const handleClosurePasswordConfirm = async () => {
    if (!closurePasswordData.password) {
      setClosurePasswordMessage(
        "Por favor, insira sua senha para confirmar o encerramento da conta."
      );
      return;
    }

    setClosurePasswordLoading(true);
    setClosingAccount(true);
    setClosurePasswordMessage("");

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/accounts/close", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          password: closurePasswordData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAccountClosed(true);
        setClosurePasswordLoading(false);
        setClosingAccount(false);

        const countdownInterval = setInterval(() => {
          setLogoutCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownInterval);
              localStorage.removeItem("authToken");
              localStorage.removeItem("accountUser");
              localStorage.removeItem("unlockTime");
              localStorage.removeItem("caretakerId");

              window.location.href = "/";
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setClosurePasswordMessage(
          `Error: ${data.error || "Falha ao fechar a conta"}`
        );
        setClosurePasswordLoading(false);
        setClosingAccount(false);
      }
    } catch (error) {
      console.error("Error closing account:", error);
      setClosurePasswordMessage("Erro: Falha ao fechar a conta");
      setClosurePasswordLoading(false);
      setClosingAccount(false);
    }
  };

  const handleClosureCancel = () => {
    setConfirmingClosure(false);
    setClosurePasswordData({ password: "" });
    setClosurePasswordMessage("");
  };

  React.useEffect(() => {
    if (
      familyData &&
      familyFormData.slug &&
      familyFormData.slug !== familyData.slug
    ) {
      const timeoutId = setTimeout(() => {
        checkSlugUniqueness(familyFormData.slug);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [familyFormData.slug, familyData?.slug, checkSlugUniqueness]);

  return (
    <div className="space-y-6">
      <div
        className={cn(styles.sectionBorder, "account-manager-section-border")}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={cn(styles.sectionTitle, "account-manager-section-title")}
          >
            Informações da conta
          </h3>
          {!editingAccount && !changingPassword && (
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingAccount(true);
                  setAccountMessage("");
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          )}
        </div>

        {editingAccount ? (
          <div className={cn(styles.formGroup, "account-manager-form-group")}>
            <div className={styles.formRow}>
              <div
                className={cn(styles.formField, "account-manager-form-field")}
              >
                <Label htmlFor="firstName">Primeiro nome</Label>
                <Input
                  id="firstName"
                  value={accountFormData.firstName}
                  onChange={(e) =>
                    setAccountFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  disabled={savingAccount}
                />
              </div>
              <div
                className={cn(styles.formField, "account-manager-form-field")}
              >
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={accountFormData.lastName}
                  onChange={(e) =>
                    setAccountFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  disabled={savingAccount}
                />
              </div>
            </div>
            <div className={cn(styles.formField, "account-manager-form-field")}>
              <Label htmlFor="email">Endereço de email</Label>
              <Input
                id="email"
                type="email"
                value={accountFormData.email}
                onChange={(e) =>
                  setAccountFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                disabled={savingAccount}
              />
            </div>

            <div className={styles.buttonGroup}>
              <Button onClick={handleAccountSave} disabled={savingAccount}>
                {savingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingAccount(false);
                  setAccountFormData({
                    firstName: accountStatus.firstName,
                    lastName: accountStatus.lastName || "",
                    email: accountStatus.email,
                  });
                  setAccountMessage("");
                }}
                disabled={savingAccount}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : changingPassword ? (
          <div className={cn(styles.formGroup, "account-manager-form-group")}>
            {passwordStep === "confirm" ? (
              <>
                <h4 className="text-lg font-medium mb-3">
                  Confirme a senha atual
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Por favor, insira sua senha atual para confirmar que deseja
                  alterá-la.
                </p>
                <div
                  className={cn(styles.formField, "account-manager-form-field")}
                >
                  <Label htmlFor="currentPassword">Senha atual</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordFormData.currentPassword}
                    onChange={(e) =>
                      setPasswordFormData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    disabled={changingPasswordLoading}
                    placeholder="Digite sua senha atual"
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <Button
                    onClick={handlePasswordConfirm}
                    disabled={
                      changingPasswordLoading ||
                      !passwordFormData.currentPassword
                    }
                  >
                    {changingPasswordLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 mr-2" />
                        Continuar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePasswordCancel}
                    disabled={changingPasswordLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h4 className="text-lg font-medium mb-3">Definir nova senha</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Digite sua nova senha. Ela deve atender a todos os requisitos
                  abaixo.
                </p>

                <div
                  className={cn(styles.formField, "account-manager-form-field")}
                >
                  <Label htmlFor="newPassword">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordFormData.newPassword}
                    onChange={(e) => {
                      const newPassword = e.target.value;
                      setPasswordFormData((prev) => ({ ...prev, newPassword }));
                      updatePasswordValidation(newPassword);
                    }}
                    disabled={changingPasswordLoading}
                    placeholder="Digite a nova senha"
                  />
                </div>

                <div
                  className={cn(styles.formField, "account-manager-form-field")}
                >
                  <Label htmlFor="confirmPassword">Confirme a nova senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordFormData.confirmPassword}
                    onChange={(e) =>
                      setPasswordFormData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    disabled={changingPasswordLoading}
                    placeholder="Confirme a nova senha"
                  />
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Requisitos de senha:
                  </p>
                  <div className="grid grid-cols-1 gap-1 text-xs">
                    <div
                      className={`flex items-center gap-2 ${
                        passwordValidation.length
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          passwordValidation.length
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {passwordValidation.length && "✓"}
                      </span>
                      Pelo menos 8 caracteres
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordValidation.lowercase
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          passwordValidation.lowercase
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {passwordValidation.lowercase && "✓"}
                      </span>
                      Uma letra minúscula (a-z)
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordValidation.uppercase
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          passwordValidation.uppercase
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {passwordValidation.uppercase && "✓"}
                      </span>
                      Uma letra maiúscula (A-Z)
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordValidation.number
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          passwordValidation.number
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {passwordValidation.number && "✓"}
                      </span>
                      Um número (0-9)
                    </div>
                    <div
                      className={`flex items-center gap-2 ${
                        passwordValidation.special
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          passwordValidation.special
                            ? "bg-green-600 border-green-600 text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {passwordValidation.special && "✓"}
                      </span>
                      Um caractere especial (!@#$%^&*)
                    </div>
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      changingPasswordLoading ||
                      !passwordFormData.newPassword ||
                      !passwordFormData.confirmPassword
                    }
                  >
                    {changingPasswordLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Alterando senha...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Alterar a senha
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePasswordCancel}
                    disabled={changingPasswordLoading}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className={styles.formGroup}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <Label className="font-medium">
                    {accountStatus.firstName} {accountStatus.lastName}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <Label>{accountStatus.email}</Label>
                  {!accountStatus.verified && (
                    <span className="text-amber-600 text-sm">(Unverified)</span>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setChangingPassword(true);
                  setPasswordMessage("");
                }}
                className="self-start"
              >
                <Key className="h-4 w-4 mr-2" />
                Redefinir senha
              </Button>
            </div>
          </div>
        )}

        {(accountMessage || passwordMessage) && (
          <div
            className={cn(
              "mt-4 p-3 rounded-md text-sm",
              (accountMessage && accountMessage.startsWith("Error")) ||
                (passwordMessage && passwordMessage.startsWith("Error"))
                ? "bg-red-50 text-red-600 account-manager-error-message"
                : "bg-green-50 text-green-600 account-manager-success-message"
            )}
          >
            <div className="flex items-center gap-2">
              {(accountMessage && accountMessage.startsWith("Error")) ||
              (passwordMessage && passwordMessage.startsWith("Error")) ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {passwordMessage || accountMessage}
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(styles.sectionBorder, "account-manager-section-border")}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={cn(styles.sectionTitle, "account-manager-section-title")}
          >
            Status da conta
          </h3>
        </div>

        <div className={styles.formGroup}>
          {accountStatus.betaparticipant ? (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <Crown className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-purple-800 mb-2">
                    Participante Beta
                  </h4>
                  <p className="text-purple-700 mb-3">
                    Obrigado por participar do programa beta e ajudar o Baby
                    Control a crescer! Você tem acesso completo a todos os
                    recursos e funcionalidades.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Acesso total</span>
                  </div>
                </div>
              </div>
            </div>
          ) : !accountStatus.hasFamily ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-blue-800 mb-2">
                      Nenhuma família criada ainda
                    </h4>
                    <p className="text-blue-700 mb-3">
                      Comece criando sua família para começar a registrar as
                      atividades.
                    </p>
                    {accountStatus.trialEnds && (
                      <p className="text-sm text-blue-600 mb-3">
                        Você tem um período de teste que expira em{" "}
                        {new Date(accountStatus.trialEnds).toLocaleDateString()}
                        .
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    (window.location.href = "/account/family-setup")
                  }
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Criar família
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Plano de atualização
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    accountStatus.accountStatus === "active"
                      ? "bg-green-500"
                      : accountStatus.accountStatus === "trial"
                      ? "bg-blue-500"
                      : accountStatus.accountStatus === "expired"
                      ? "bg-red-500"
                      : accountStatus.accountStatus === "closed"
                      ? "bg-gray-500"
                      : accountStatus.accountStatus === "no_family"
                      ? "bg-orange-500"
                      : "bg-yellow-500"
                  )}
                />
                <Label className="font-medium capitalize">
                  {accountStatus.accountStatus.replace("_", " ")} Conta
                </Label>
              </div>

              {accountStatus.subscriptionActive && (
                <div className="flex items-center gap-2">
                  <CheckCircle
                    className={cn(
                      "h-4 w-4",
                      subscriptionStatus?.cancelAtPeriodEnd
                        ? "text-amber-600"
                        : "text-green-600"
                    )}
                  />
                  <Label
                    className={cn(
                      "font-medium",
                      subscriptionStatus?.cancelAtPeriodEnd
                        ? "text-amber-700"
                        : "text-green-600"
                    )}
                  >
                    {accountStatus.accountStatus === "trial"
                      ? "Active Trial"
                      : accountStatus.planType === "full"
                      ? "Lifetime Member"
                      : subscriptionStatus?.cancelAtPeriodEnd
                      ? "Subscription Active (Cancelled)"
                      : "Subscription Active"}
                  </Label>
                </div>
              )}

              {accountStatus.trialEnds &&
                accountStatus.accountStatus !== "expired" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <Label className="text-sm">
                        O teste termina{" "}
                        {new Date(accountStatus.trialEnds).toLocaleDateString()}
                      </Label>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setShowPaymentModal(true)}
                      className="mt-2"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </>
                )}

              {accountStatus.planExpires &&
                !accountStatus.trialEnds &&
                accountStatus.planType !== "full" && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <Label className="text-sm">
                      A assinatura termina{" "}
                      {new Date(accountStatus.planExpires).toLocaleDateString()}
                    </Label>
                  </div>
                )}

              {accountStatus.accountStatus === "expired" && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">
                      {accountStatus.trialEnds
                        ? "Trial Expired"
                        : "Subscription Expired"}
                    </span>
                  </div>
                  <p className="text-sm text-red-600 mt-1 mb-3">
                    {accountStatus.trialEnds
                      ? "Your trial has expired. Please subscribe to continue using Baby Control."
                      : "Your subscription has expired. Please renew your subscription to continue using Baby Control."}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => setShowPaymentModal(true)}
                    variant="destructive"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {accountStatus.trialEnds
                      ? "Assine agora"
                      : "Renovar assinatura"}
                  </Button>
                </div>
              )}

              {((accountStatus.subscriptionActive &&
                accountStatus.planType === "sub" &&
                accountStatus.accountStatus !== "trial") ||
                accountStatus.planType === "full") && (
                <div className="flex flex-col items-start sm:flex-row sm:justify-end gap-2 mt-3">
                  {accountStatus.subscriptionActive &&
                    accountStatus.planType === "sub" &&
                    accountStatus.accountStatus !== "trial" &&
                    !subscriptionStatus?.cancelAtPeriodEnd && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPaymentModal(true)}
                        className="self-start"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Gerenciar assinatura
                      </Button>
                    )}
                  {subscriptionStatus?.cancelAtPeriodEnd && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleRenewSubscription}
                      disabled={renewingSubscription}
                      className="self-start"
                    >
                      {renewingSubscription ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Renovando...
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          Renovar assinatura
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPaymentHistory(true)}
                    className="self-start"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Histórico de pagamentos
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {familyData && (
        <div
          className={cn(styles.sectionBorder, "account-manager-section-border")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={cn(
                styles.sectionTitle,
                "account-manager-section-title"
              )}
            >
              Informações familiares
            </h3>
            {!editingFamily && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingFamily(true);
                  setFamilyMessage("");
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </div>

          {editingFamily ? (
            <div className={cn(styles.formGroup, "account-manager-form-group")}>
              <div
                className={cn(styles.formField, "account-manager-form-field")}
              >
                <Label htmlFor="familyName">Nome de família</Label>
                <Input
                  id="familyName"
                  value={familyFormData.name}
                  onChange={(e) =>
                    setFamilyFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  disabled={savingFamily}
                />
              </div>
              <div
                className={cn(styles.formField, "account-manager-form-field")}
              >
                <Label htmlFor="familySlug">Slug de URL da família</Label>
                <div className="relative">
                  <Input
                    id="familySlug"
                    value={familyFormData.slug}
                    onChange={(e) =>
                      setFamilyFormData((prev) => ({
                        ...prev,
                        slug: e.target.value.toLowerCase(),
                      }))
                    }
                    disabled={savingFamily}
                    className={slugError ? "border-red-500" : ""}
                  />
                  {checkingSlug && (
                    <Loader2 className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
                <div className="min-h-[20px] mt-1">
                  {checkingSlug && (
                    <div className="flex items-center gap-1 text-blue-600 text-sm">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Verificando disponibilidade...
                    </div>
                  )}
                  {slugError && (
                    <div className="flex items-center gap-1 text-red-600 text-sm account-manager-validation-error">
                      <AlertTriangle className="h-3 w-3" />
                      {slugError}
                    </div>
                  )}
                  {!checkingSlug &&
                    !slugError &&
                    familyFormData.slug &&
                    familyFormData.slug !== familyData?.slug && (
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <span className="h-3 w-3 rounded-full bg-green-600"></span>
                        O URL está disponível
                      </div>
                    )}
                </div>
                <p className="text-sm text-gray-500 mt-1 account-manager-info-text">
                  Este é o identificador de URL exclusivo da sua família.
                </p>
              </div>

              <div className={styles.buttonGroup}>
                <Button
                  onClick={handleFamilySave}
                  disabled={savingFamily || !!slugError || checkingSlug}
                >
                  {savingFamily ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingFamily(false);
                    setFamilyFormData({
                      name: familyData?.name || "",
                      slug: familyData?.slug || "",
                    });
                    setSlugError("");
                    setFamilyMessage("");
                  }}
                  disabled={savingFamily}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-4 w-4 text-gray-500" />
                <Label className="font-medium">{familyData.name}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Link className="h-4 w-4 text-gray-500" />
                <Label className="font-mono text-sm">/{familyData.slug}</Label>
              </div>
            </div>
          )}

          {familyMessage && (
            <div
              className={cn(
                "mt-4 p-3 rounded-md text-sm",
                familyMessage.startsWith("Error")
                  ? "bg-red-50 text-red-600 account-manager-error-message"
                  : "bg-green-50 text-green-600 account-manager-success-message"
              )}
            >
              <div className="flex items-center gap-2">
                {familyMessage.startsWith("Error") ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {familyMessage}
              </div>
            </div>
          )}
        </div>
      )}

      {familyData && (
        <div
          className={cn(styles.sectionBorder, "account-manager-section-border")}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className={cn(
                styles.sectionTitle,
                "account-manager-section-title"
              )}
            >
              Baixe seus dados
            </h3>
          </div>

          <div className={styles.formGroup}>
            <p className="text-sm text-gray-600 mb-4 account-manager-info-text">
              Download a complete copy of your family's data including all
              activities, contacts, and settings.
            </p>
            <Button onClick={handleDataDownload} disabled={downloadingData}>
              {downloadingData ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Preparando o download...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar dados
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      <div
        className={cn(styles.sectionBorder, "account-manager-section-border")}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={cn(
              styles.sectionTitle,
              "account-manager-section-title text-red-700"
            )}
          >
            Fechar conta
          </h3>
        </div>

        {accountClosed ? (
          <div className={cn(styles.formGroup, "account-manager-form-group")}>
            <div className="text-center py-8">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">
                Conta encerrada com sucesso.
              </h4>
              <p className="text-gray-600 mb-4">
                Sua conta foi encerrada e um e-mail de confirmação foi enviado.
              </p>

              <div className="bg-red-50 rounded-lg p-6 mb-4 max-w-md mx-auto">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-4xl font-bold text-red-600">
                    {logoutCountdown}
                  </div>
                </div>
                <p className="text-red-700 font-medium mb-3">
                  Efetuando logout {logoutCountdown} segundo
                  {logoutCountdown !== 1 ? "s" : ""}...
                </p>
                <div className="w-full bg-red-200 rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((5 - logoutCountdown) / 5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                <p>Obrigado por usar o Baby Control.</p>
                <p>
                  Você será redirecionado automaticamente para a página inicial.
                </p>
              </div>
            </div>
          </div>
        ) : confirmingClosure ? (
          <div className={cn(styles.formGroup, "account-manager-form-group")}>
            <h4 className="text-lg font-medium mb-3 text-red-700">
              Confirmar encerramento da conta
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              Por favor, insira sua senha para confirmar que deseja encerrar
              permanentemente sua conta.
            </p>
            <div className={cn(styles.formField, "account-manager-form-field")}>
              <Label htmlFor="closurePassword">Senha</Label>
              <Input
                id="closurePassword"
                type="password"
                value={closurePasswordData.password}
                onChange={(e) =>
                  setClosurePasswordData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                disabled={closurePasswordLoading || closingAccount}
                placeholder="Enter your password"
              />
            </div>

            <div className={styles.buttonGroup}>
              <Button
                onClick={handleClosurePasswordConfirm}
                disabled={
                  closurePasswordLoading ||
                  closingAccount ||
                  !closurePasswordData.password
                }
                variant="destructive"
              >
                {closurePasswordLoading || closingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {closingAccount ? "Fechando conta..." : "Verificando..."}
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Fechar conta
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleClosureCancel}
                disabled={closurePasswordLoading || closingAccount}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>

            {closurePasswordMessage && (
              <div
                className={cn(
                  "mt-4 p-3 rounded-md text-sm",
                  closurePasswordMessage.startsWith("Error") ||
                    closurePasswordMessage.includes("incorrect")
                    ? "bg-red-50 text-red-600 account-manager-error-message"
                    : "bg-green-50 text-green-600 account-manager-success-message"
                )}
              >
                <div className="flex items-center gap-2">
                  {closurePasswordMessage.startsWith("Error") ||
                  closurePasswordMessage.includes("incorrect") ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {closurePasswordMessage}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.formGroup}>
            <p className="text-sm text-gray-600 mb-4 account-manager-info-text">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              Aviso: O encerramento da sua conta desativará permanentemente o
              acesso a sua {familyData ? "family" : "account"} data. Esta ação
              não pode ser desfeita. Faça o download dos seus dados primeiro se
              quiser mantê-los.
            </p>
            <Button
              onClick={() => setConfirmingClosure(true)}
              variant="destructive"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Fechar conta
            </Button>
          </div>
        )}
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        accountStatus={{
          accountStatus: accountStatus.accountStatus,
          planType: accountStatus.planType || null,
          subscriptionActive: accountStatus.subscriptionActive,
          trialEnds: accountStatus.trialEnds || null,
          planExpires: accountStatus.planExpires || null,
          subscriptionId: accountStatus.subscriptionId || null,
        }}
        onPaymentSuccess={() => {
          setShowPaymentModal(false);
          onDataRefresh();
        }}
      />

      <PaymentHistory
        isOpen={showPaymentHistory}
        onClose={() => setShowPaymentHistory(false)}
      />
    </div>
  );
};

export default AccountSettingsTab;
