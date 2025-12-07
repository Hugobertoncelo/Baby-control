"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/context/theme";
import { Share, Copy, Check } from "lucide-react";

import { shareButtonVariants } from "./share-button.styles";
import { ShareButtonProps } from "./share-button.types";
import "./share-button.css";

const ShareButton = React.forwardRef<HTMLButtonElement, ShareButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      familySlug,
      familyName,
      appConfig,
      urlSuffix = "/login",
      showText = true,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [copied, setCopied] = React.useState(false);
    const [shareUrl, setShareUrl] = React.useState<string>("");
    const [supportsNativeShare, setSupportsNativeShare] = React.useState(false);
    const [showToast, setShowToast] = React.useState(false);

    const showSuccessToast = () => {
      setCopied(true);

      if (!showText) {
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
      }

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    };

    React.useEffect(() => {
      const checkNativeShare = () => {
        const hasNavigator = typeof navigator !== "undefined";
        const hasShare =
          hasNavigator &&
          "share" in navigator &&
          typeof navigator.share === "function";

        if (hasShare) {
          try {
            const isCallable = typeof navigator.share === "function";
            console.log("Web Share API detection:", {
              hasNavigator,
              hasShare,
              isCallable,
            });
            setSupportsNativeShare(isCallable);
          } catch (error) {
            console.log("Web Share API check failed:", error);
            setSupportsNativeShare(false);
          }
        } else {
          console.log("Web Share API not available:", {
            hasNavigator,
            hasShare,
          });
          setSupportsNativeShare(false);
        }
      };

      checkNativeShare();
    }, []);

    React.useEffect(() => {
      const generateShareUrl = async () => {
        try {
          if (appConfig) {
            const { rootDomain, enableHttps } = appConfig;
            const protocol = enableHttps ? "https" : "http";
            const url = `${protocol}://${rootDomain}/${familySlug}${urlSuffix}`;
            setShareUrl(url);
          } else {
            const response = await fetch("/api/app-config/public");
            const data = await response.json();

            if (data.success) {
              const { rootDomain, enableHttps } = data.data;
              const protocol = enableHttps ? "https" : "http";
              const url = `${protocol}://${rootDomain}/${familySlug}${urlSuffix}`;
              setShareUrl(url);
            } else {
              const currentDomain = window.location.host;
              const currentProtocol = window.location.protocol;
              const url = `${currentProtocol}//${currentDomain}/${familySlug}${urlSuffix}`;
              setShareUrl(url);
            }
          }
        } catch (error) {
          console.error("Error generating share URL:", error);
          const currentDomain = window.location.host;
          const currentProtocol = window.location.protocol;
          const url = `${currentProtocol}//${currentDomain}/${familySlug}${urlSuffix}`;
          setShareUrl(url);
        }
      };

      if (familySlug) {
        generateShareUrl();
      }
    }, [familySlug, appConfig, urlSuffix]);

    const handleShare = async () => {
      if (!shareUrl) return;

      const shareData = {
        title: `${familyName || "Baby Control"} - Login da família`,
        text: `Junte-se ao ${familyName || "family"} baby control`,
        url: shareUrl,
      };

      if (supportsNativeShare) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          console.log(
            "Native share cancelled or failed, falling back to clipboard:",
            error
          );
        }
      }

      const hasClipboardAPI =
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function";

      if (hasClipboardAPI) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          showSuccessToast();
          return;
        } catch (error) {
          console.error("Clipboard API failed:", error);
        }
      }

      try {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          showSuccessToast();
        } else {
          throw new Error("execCommand copy failed");
        }
      } catch (error) {
        console.error("All copy methods failed:", error);
        if (typeof prompt === "function") {
          prompt("Copy this URL:", shareUrl);
        } else {
          alert(`Share this URL: ${shareUrl}`);
        }
      }
    };

    if (!shareUrl) {
      return null;
    }

    const darkModeClass =
      variant === "outline"
        ? "share-button-dark-outline"
        : variant === "ghost"
        ? "share-button-dark-ghost"
        : variant === "link"
        ? "share-button-dark-link"
        : "";

    const copiedClass = copied ? "share-button-copied" : "";

    const Comp = asChild ? Slot : "button";

    return (
      <>
        <Comp
          className={cn(
            shareButtonVariants({
              variant,
              size,
              state: copied ? "copied" : "normal",
              className,
            }),
            darkModeClass,
            copiedClass
          )}
          ref={ref}
          onClick={handleShare}
          title={
            supportsNativeShare
              ? "Compartilhar login da família"
              : "Copiar link para a área de transferência"
          }
          {...props}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : supportsNativeShare ? (
            <Share className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {showText && (
            <span className="ml-1">
              {copied
                ? "Copied!"
                : supportsNativeShare
                ? "Compartilhar"
                : "Cópia"}
            </span>
          )}
        </Comp>

        {showToast && !showText && (
          <div
            className={cn(
              "fixed top-4 left-1/2 transform -translate-x-1/2 z-50",
              "bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg",
              "flex items-center gap-2 transition-all duration-300",
              "animate-in slide-in-from-top-2"
            )}
          >
            <Check className="h-4 w-4" />
            <span className="text-sm font-medium">
              URL da família copiada para a área de transferência!
            </span>
          </div>
        )}
      </>
    );
  }
);
ShareButton.displayName = "ShareButton";

export { ShareButton, shareButtonVariants };
export type { ShareButtonProps };
