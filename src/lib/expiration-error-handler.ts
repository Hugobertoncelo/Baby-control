export async function handleExpirationError(
  response: Response,
  showToast: (props: {
    variant?: "info" | "success" | "warning" | "error";
    message: string;
    title?: string;
    duration?: number | null;
    dismissible?: boolean;
    action?: {
      label: string;
      onClick: () => void;
    };
  }) => void,
  context?: string
): Promise<{ isExpirationError: boolean; errorData?: any }> {
  if (response.status !== 403) {
    return { isExpirationError: false };
  }

  const errorData = await response.json();
  const expirationInfo = errorData.data?.expirationInfo;

  if (!expirationInfo) {
    return { isExpirationError: false, errorData };
  }

  let isAccountUser = false;
  let isSysAdmin = false;
  try {
    const token = localStorage.getItem("authToken");
    if (token) {
      const payload = token.split(".")[1];
      const decodedPayload = JSON.parse(atob(payload));
      isAccountUser = decodedPayload.isAccountAuth || false;
      isSysAdmin = decodedPayload.isSysAdmin || false;
    }
  } catch (error) {}

  let variant: "warning" | "error" = "warning";
  let title = "Conta expirada";
  let message =
    errorData.error || "Sua conta expirou. Faça o upgrade para continuar.";

  const contextSuffix = context ? ` ${context}` : "";

  if (expirationInfo?.type === "TRIAL_EXPIRED") {
    title = "Período de teste encerrado";
    message = isAccountUser
      ? `Seu período de teste gratuito terminou. Faça o upgrade para continuar${contextSuffix}.`
      : `O período de teste gratuito do proprietário da conta terminou. Entre em contato para fazer o upgrade.`;
  } else if (expirationInfo?.type === "PLAN_EXPIRED") {
    title = "Assinatura expirada";
    message = isAccountUser
      ? `Sua assinatura expirou. Renove para continuar${contextSuffix}.`
      : `A assinatura do proprietário da conta expirou. Entre em contato para renovar.`;
  } else if (expirationInfo?.type === "NO_PLAN") {
    title = "Sem assinatura ativa";
    message = isAccountUser
      ? `Assine agora para continuar${contextSuffix}.`
      : `O proprietário da conta precisa assinar. Entre em contato para fazer o upgrade.`;
  }

  if (isAccountUser && !isSysAdmin) {
    showToast({
      variant,
      title,
      message,
      duration: 6000,
      action: {
        label: "Fazer upgrade agora",
        onClick: () => {
          window.dispatchEvent(new CustomEvent("openPaymentModal"));
        },
      },
    });
  } else {
    showToast({
      variant,
      title,
      message,
      duration: 6000,
    });
  }

  return { isExpirationError: true, errorData };
}
