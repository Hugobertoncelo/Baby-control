import { useState, useCallback } from "react";

interface UseEmailValidationReturn {
  email: string;
  error: string;
  isValid: boolean;
  setEmail: (email: string) => void;
  validateEmail: () => boolean;
  clearError: () => void;
}

export const useEmailValidation = (): UseEmailValidationReturn => {
  const [email, setEmailState] = useState("");
  const [error, setError] = useState("");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setEmail = useCallback(
    (newEmail: string) => {
      setEmailState(newEmail);
      if (error) {
        setError("");
      }
    },
    [error]
  );

  const validateEmail = useCallback(() => {
    if (!email.trim()) {
      setError("O endereço de e-mail é obrigatório");
      return false;
    }

    if (!emailRegex.test(email.trim())) {
      setError("Por favor, insira um endereço de e-mail válido.");
      return false;
    }

    setError("");
    return true;
  }, [email]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const isValid = email.trim() !== "" && emailRegex.test(email.trim());

  return {
    email,
    error,
    isValid,
    setEmail,
    validateEmail,
    clearError,
  };
};
