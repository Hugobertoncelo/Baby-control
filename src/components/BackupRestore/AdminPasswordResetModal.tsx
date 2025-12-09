"use client";

import React from "react";
import { Modal, ModalContent, ModalFooter } from "@/src/components/ui/modal";
import { Button } from "@/src/components/ui/button";
import { AlertCircle, KeyRound } from "lucide-react";

interface AdminPasswordResetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function AdminPasswordResetModal({
  open,
  onOpenChange,
  onConfirm,
}: AdminPasswordResetModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Admin Password Reset"
      description="Important security notice about your Family Manager password"
    >
      <ModalContent>
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="rounded-full bg-amber-100 dark:bg-amber-900/20 p-3">
              <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-500" />
            </div>
          </div>

          <div className="space-y-3 text-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Devido à importação de uma versão mais antiga do banco de dados, a
              senha de administrador do <strong>Family Manager</strong> foi
              redefinida para a senha padrão por motivos de segurança.{" "}
            </p>

            <div className="flex items-center justify-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <KeyRound className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Senha padrão:{" "}
                <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-mono text-blue-700 dark:text-blue-300">
                  administrador
                </code>
              </span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-gray-100">
                  Recomendação de segurança:
                </strong>
                <br />
                Por favor, altere sua senha de administrador o mais rápido
                possível, acessando o Gerenciador Familiar e atualizando-a nas
                configurações.
              </p>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              Você pode acessar o Gerenciador Familiar em{" "}
              <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">
                /family-manager
              </code>
            </p>
          </div>
        </div>
      </ModalContent>

      <ModalFooter>
        <Button onClick={handleConfirm} className="w-full">
          Eu entendo
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default AdminPasswordResetModal;
