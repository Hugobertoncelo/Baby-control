import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { useTheme } from "@/src/context/theme";
import { privacyPolicyModalStyles } from "./privacy-policy.styles";
import { PrivacyPolicyModalProps } from "./privacy-policy.types";
import "./privacy-policy.css";

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  open,
  onClose,
}) => {
  const [privacyPolicyContent, setPrivacyPolicyContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useTheme();

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/privacy_policy.md")
        .then((response) => {
          if (!response.ok) {
            throw new Error(
              "Não foi possível obter a política de privacidade."
            );
          }
          return response.text();
        })
        .then((content) => {
          setPrivacyPolicyContent(content);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching privacy policy:", error);
          setPrivacyPolicyContent(
            "Não foi possível carregar a política de privacidade."
          );
          setLoading(false);
        });
    }
  }, [open]);

  const formatTextContent = (text: string): React.ReactNode => {
    if (!text) return text;

    const parts: React.ReactNode[] = [];
    let currentText = text;
    let key = 0;

    const tokens: Array<{ type: "text" | "bold" | "italic"; content: string }> =
      [];
    let i = 0;

    while (i < currentText.length) {
      if (currentText.substring(i, i + 2) === "**") {
        const boldEnd = currentText.indexOf("**", i + 2);
        if (boldEnd !== -1) {
          const boldContent = currentText.substring(i + 2, boldEnd);
          tokens.push({ type: "bold", content: boldContent });
          i = boldEnd + 2;
          continue;
        }
      }

      if (currentText[i] === "*" && currentText.substring(i, i + 2) !== "**") {
        const italicEnd = currentText.indexOf("*", i + 1);
        if (italicEnd !== -1) {
          const italicContent = currentText.substring(i + 1, italicEnd);
          tokens.push({ type: "italic", content: italicContent });
          i = italicEnd + 1;
          continue;
        }
      }

      let textEnd = i + 1;
      while (
        textEnd < currentText.length &&
        currentText[textEnd] !== "*" &&
        !(currentText.substring(textEnd, textEnd + 2) === "**")
      ) {
        textEnd++;
      }

      const textContent = currentText.substring(i, textEnd);
      if (textContent) {
        tokens.push({ type: "text", content: textContent });
      }
      i = textEnd;
    }

    return tokens.map((token, index) => {
      switch (token.type) {
        case "bold":
          return (
            <strong key={index} className="font-semibold">
              {token.content}
            </strong>
          );
        case "italic":
          return (
            <em key={index} className="italic">
              {token.content}
            </em>
          );
        default:
          return token.content;
      }
    });
  };

  const formatMarkdown = (content: string): React.ReactNode => {
    if (loading) {
      return (
        <div className="text-center py-8">
          Carregando política de privacidade...
        </div>
      );
    }

    const lines = content.split("\n");
    const processedContent: React.ReactNode[] = [];
    let listItems: string[] = [];
    let currentListLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = i < lines.length - 1 ? lines[i + 1] : "";

      if (line.startsWith("- ")) {
        listItems.push(line.replace("- ", ""));
        currentListLevel = 1;
        continue;
      }

      if (listItems.length > 0 && !line.startsWith("- ")) {
        processedContent.push(
          <ul
            key={`list-${i}`}
            className="list-disc pl-6 mb-4"
            style={{ listStyleType: "disc" }}
          >
            {listItems.map((item, itemIndex) => (
              <li key={itemIndex} className="mb-1 flex items-start">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
                <span>{formatTextContent(item)}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
        currentListLevel = 0;
      }

      if (line.startsWith("# ")) {
        processedContent.push(
          <h1 key={i} className="text-2xl font-bold mt-6 mb-4">
            {formatTextContent(line.replace("# ", ""))}
          </h1>
        );
        continue;
      }

      if (line.startsWith("## ")) {
        processedContent.push(
          <h2 key={i} className="text-xl font-bold mt-6 mb-2">
            {formatTextContent(line.replace("## ", ""))}
          </h2>
        );
        continue;
      }

      if (line.startsWith("### ")) {
        processedContent.push(
          <h3 key={i} className="text-lg font-bold mt-4 mb-2">
            {formatTextContent(line.replace("### ", ""))}
          </h3>
        );
        continue;
      }

      if (line.startsWith("#### ")) {
        processedContent.push(
          <h4
            key={i}
            className="text-base font-bold mt-3 mb-1 text-teal-700 dark:text-teal-400"
          >
            {formatTextContent(line.replace("#### ", ""))}
          </h4>
        );
        continue;
      }

      if (line.trim() === "---") {
        processedContent.push(
          <hr
            key={i}
            className="my-8 border-t border-gray-300 dark:border-gray-600"
          />
        );
        continue;
      }

      if (line.trim() === "") {
        processedContent.push(<br key={i} />);
        continue;
      }

      const formattedLine = formatTextContent(line);
      processedContent.push(
        <p key={i} className="mb-2">
          {formattedLine}
        </p>
      );
    }

    if (listItems.length > 0) {
      processedContent.push(
        <ul
          key="list-final"
          className="list-disc pl-6 mb-4"
          style={{ listStyleType: "disc" }}
        >
          {listItems.map((item, itemIndex) => (
            <li key={itemIndex} className="mb-1 flex items-start">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400 mt-2 mr-2 flex-shrink-0"></span>
              <span>{formatTextContent(item)}</span>
            </li>
          ))}
        </ul>
      );
    }

    return <div>{processedContent}</div>;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className={cn(
          privacyPolicyModalStyles.container,
          "privacy-policy-modal-container"
        )}
      >
        <DialogHeader className={privacyPolicyModalStyles.header}>
          <DialogTitle
            className={cn(
              privacyPolicyModalStyles.title,
              "privacy-policy-modal-title"
            )}
          >
            Política de Privacidade
          </DialogTitle>
          <DialogDescription
            className={cn(
              privacyPolicyModalStyles.description,
              "privacy-policy-modal-description"
            )}
          >
            Consulte nossa política de privacidade e práticas de tratamento de
            dados.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            privacyPolicyModalStyles.content,
            "privacy-policy-modal-content"
          )}
        >
          <div
            className={cn(
              privacyPolicyModalStyles.markdown,
              "privacy-policy-modal-markdown"
            )}
          >
            {formatMarkdown(privacyPolicyContent)}
          </div>
        </div>

        <div className={privacyPolicyModalStyles.footer}>
          <Button
            onClick={onClose}
            className={cn(
              privacyPolicyModalStyles.closeButton,
              "privacy-policy-modal-close-button"
            )}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyModal;
