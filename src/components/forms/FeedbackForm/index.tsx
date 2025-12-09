"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { useTheme } from "@/src/context/theme";
import "./feedback-form.css";

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function FeedbackForm({
  isOpen,
  onClose,
  onSuccess,
}: FeedbackFormProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitterInfo, setSubmitterInfo] = useState({
    name: "",
    email: "",
  });
  const [family, setFamily] = useState<{ id: string; name: string } | null>(
    null
  );
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const getSubmitterInfo = async () => {
      try {
        const authToken = localStorage.getItem("authToken");
        if (!authToken) return;

        const payload = authToken.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));

        if (decodedPayload.isAccountAuth) {
          setSubmitterInfo({
            name: decodedPayload.accountEmail
              ? decodedPayload.accountEmail.split("@")[0]
              : "Usuário da conta",
            email: decodedPayload.accountEmail || "",
          });
        } else {
          setSubmitterInfo({
            name: decodedPayload.name || "Usuário",
            email: "",
          });
        }

        if (decodedPayload.familyId && decodedPayload.familySlug) {
          try {
            const familyResponse = await fetch(
              `/api/family/by-slug/${decodedPayload.familySlug}`,
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );

            if (familyResponse.ok) {
              const familyData = await familyResponse.json();
              if (familyData.success && familyData.data) {
                setFamily({
                  id: familyData.data.id,
                  name: familyData.data.name,
                });
              }
            }
          } catch (familyError) {
            console.log("Could not fetch family info:", familyError);
          }
        }
      } catch (error) {
        console.error("Error parsing auth token:", error);
        setSubmitterInfo({
          name: "User",
          email: "",
        });
      }
    };

    if (isOpen) {
      getSubmitterInfo();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        subject: "",
        message: "",
      });
    }
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim() || !formData.message.trim()) {
      alert("Por favor, preencha os campos de assunto e mensagem.");
      return;
    }

    setLoading(true);

    try {
      const authToken = localStorage.getItem("authToken");

      const payload = {
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        familyId: family?.id || null,
        submitterName: submitterInfo.name,
        submitterEmail: submitterInfo.email || null,
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccessToast(true);

        setTimeout(() => {
          onClose();
          if (onSuccess) onSuccess();
        }, 3000);
      } else {
        console.error("Error submitting feedback:", data.error);
        alert(`Erro: ${data.error || "Não foi possível enviar o feedback."}`);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title="Enviar comentários"
      description="Ajude-nos a melhorar compartilhando suas ideias e sugestões."
    >
      <FormPageContent>
        {showSuccessToast && (
          <div className="mb-4 p-4 rounded-lg feedback-success-toast">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 feedback-success-toast-icon"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium feedback-success-toast-title">
                  Obrigado pelo seu feedback!
                </p>
                <p className="text-sm mt-1 feedback-success-toast-message">
                  Agradecemos sua contribuição e analisaremos sua mensagem.
                  {submitterInfo.email &&
                    "Um e-mail de confirmação foi enviado para você."}
                </p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="feedback-form-info">
              <div className="text-sm text-gray-600 feedback-form-submitter-info">
                <p>
                  <strong>De:</strong> {submitterInfo.name}
                </p>
                {submitterInfo.email && (
                  <p>
                    <strong>Email:</strong> {submitterInfo.email}
                  </p>
                )}
                {family && (
                  <p>
                    <strong>Família:</strong> {family.name}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="subject" className="form-label">
                Assunto <span className="text-red-500">*</span>
              </label>
              <Input
                id="subject"
                name="subject"
                type="text"
                placeholder="Breve descrição do seu feedback"
                value={formData.subject}
                onChange={handleInputChange}
                required
                disabled={loading}
                className="feedback-form-input"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="message" className="form-label">
                Mensagem <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="Por favor, compartilhe seus comentários detalhados, sugestões ou relate quaisquer problemas que você tenha encontrado..."
                value={formData.message}
                onChange={handleInputChange}
                required
                disabled={loading}
                rows={6}
                className="feedback-form-textarea"
              />
            </div>

            <div className="feedback-form-help-text">
              <p className="text-sm text-gray-500">
                Seu feedback nos ajuda a melhorar o aplicativo. Por favor, seja
                o mais específico possível sobre quaisquer problemas ou
                sugestões que você tenha.
              </p>
            </div>
          </div>
        </form>
      </FormPageContent>

      <FormPageFooter>
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              loading || !formData.subject.trim() || !formData.message.trim()
            }
            variant="success"
          >
            {loading ? "Enviando..." : "Enviar comentários"}
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
}
