import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { styles } from "./setup-wizard.styles";
import { FamilySetupStageProps } from "./setup-wizard.types";
import { BackupRestore } from "@/src/components/BackupRestore";
import { AdminPasswordResetModal } from "@/src/components/BackupRestore/AdminPasswordResetModal";

const FamilySetupStage: React.FC<FamilySetupStageProps> = ({
  familyName,
  setFamilyName,
  familySlug,
  setFamilySlug,
  token,
  initialSetup = false,
}) => {
  const router = useRouter();
  const [slugError, setSlugError] = useState("");
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [generatingSlug, setGeneratingSlug] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const adminResetResolverRef = React.useRef<(() => void) | null>(null);

  const handleAdminPasswordReset = useCallback(() => {
    setShowPasswordResetModal(true);
  }, []);

  const handlePasswordResetConfirm = useCallback(() => {
    if (adminResetResolverRef.current) {
      adminResetResolverRef.current();
      adminResetResolverRef.current = null;
    }
  }, []);

  const handleAdminResetAcknowledged = useCallback(() => {
    return new Promise<void>((resolve) => {
      adminResetResolverRef.current = resolve;
    });
  }, []);

  const handleImportSuccess = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("unlockTime");
    localStorage.removeItem("caretakerId");

    router.push("/");
  }, [router]);

  const checkSlugUniqueness = useCallback(async (slug: string) => {
    if (!slug || slug.trim() === "") {
      setSlugError("");
      return;
    }

    setCheckingSlug(true);
    try {
      const response = await fetch(
        `/api/family/by-slug/${encodeURIComponent(slug)}`
      );
      const data = await response.json();

      if (response.status === 400) {
        setSlugError(data.error || "Formato de slug inválido");
      } else if (data.success && data.data) {
        setSlugError("Esta URL já está em uso.");
      } else {
        setSlugError("");
      }
    } catch (error) {
      setSlugError("Erro ao verificar a disponibilidade do URL");
    } finally {
      setCheckingSlug(false);
    }
  }, []);

  const generateSlug = async () => {
    setGeneratingSlug(true);
    try {
      const response = await fetch("/api/family/generate-slug");
      const data = await response.json();

      if (data.success && data.data.slug) {
        setFamilySlug(data.data.slug);
        setSlugError("");
      } else {
        setSlugError("Falha ao gerar URL única");
      }
    } catch (error) {
      setSlugError("Erro ao gerar URL");
    } finally {
      setGeneratingSlug(false);
    }
  };

  const generateSlugFromName = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSlugFieldFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!familySlug && familyName) {
      const autoSlug = generateSlugFromName(familyName);
      if (autoSlug) {
        setFamilySlug(autoSlug);
        setTimeout(() => {
          const input = e.target as HTMLInputElement;
          input.setSelectionRange(input.value.length, input.value.length);
        }, 0);
      }
    }
  };

  useEffect(() => {
    if (familySlug) {
      const timeoutId = setTimeout(() => {
        checkSlugUniqueness(familySlug);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [familySlug, checkSlugUniqueness]);

  return (
    <div className={cn(styles.stageContainer, "setup-wizard-stage-container")}>
      <h2 className={cn(styles.stageTitle, "setup-wizard-stage-title")}>
        {token ? "Crie sua família" : "Crie sua família"}
      </h2>
      <p
        className={cn(
          styles.stageDescription,
          "setup-wizard-stage-description"
        )}
      >
        {token
          ? "Você foi convidado(a) a criar uma nova família. Vamos começar com algumas informações básicas."
          : "Vamos começar com algumas informações básicas."}
      </p>

      <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
        <label
          className={cn(styles.formLabel, "setup-wizard-form-label")}
          htmlFor="familyName"
        >
          Qual é o seu Sobrenome?
        </label>
        <Input
          id="familyName"
          value={familyName}
          onChange={(e) => setFamilyName(e.target.value)}
          placeholder="Digite o nome da família"
          className={cn(styles.formInput, "setup-wizard-form-input")}
        />
      </div>

      <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
        <label
          className={cn(styles.formLabel, "setup-wizard-form-label")}
          htmlFor="familySlug"
        >
          URL da Família
        </label>
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="familySlug"
                value={familySlug}
                onChange={(e) => setFamilySlug(e.target.value.toLowerCase())}
                onFocus={handleSlugFieldFocus}
                placeholder="URL da família"
                className={cn(
                  styles.formInput,
                  "setup-wizard-form-input",
                  slugError ? "border-red-500" : ""
                )}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={generateSlug}
              disabled={generatingSlug}
              className="px-3"
              title="Gerar URL aleatório"
            >
              {generatingSlug ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            Seus dados de contato com sua família estarão disponíveis em:{" "}
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
              /{familySlug || "your-family-url"}
            </span>
          </div>

          <div className="min-h-[20px]">
            {checkingSlug && (
              <div className="flex items-center gap-1 text-blue-600 text-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Verificando disponibilidade...
              </div>
            )}
            {slugError && (
              <div className="flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="h-3 w-3" />
                {slugError}
              </div>
            )}
            {!checkingSlug && !slugError && familySlug && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <span className="h-3 w-3 rounded-full bg-green-600"></span>O URL
                está disponível
              </div>
            )}
          </div>
        </div>

        <p
          className={cn(styles.formHelperText, "setup-wizard-form-helper-text")}
        >
          Este será o endereço web exclusivo da sua família. Ele só pode conter
          letras minúsculas, números e hífenes.
        </p>
      </div>

      {initialSetup && (
        <div
          className={cn(
            styles.formGroup,
            "setup-wizard-form-group",
            "mt-6",
            "pt-6",
            "border-t",
            "border-gray-200",
            "dark:border-gray-700"
          )}
        >
          <BackupRestore
            importOnly={true}
            initialSetup={true}
            onRestoreSuccess={handleImportSuccess}
            onRestoreError={(error) => {}}
            onAdminPasswordReset={handleAdminPasswordReset}
            onAdminResetAcknowledged={handleAdminResetAcknowledged}
          />
        </div>
      )}

      <AdminPasswordResetModal
        open={showPasswordResetModal}
        onOpenChange={setShowPasswordResetModal}
        onConfirm={handlePasswordResetConfirm}
      />
    </div>
  );
};

export default FamilySetupStage;
