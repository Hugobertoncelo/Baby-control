import React, { useState, useEffect } from "react";
import {
  ContactFormProps,
  ContactFormData,
  ContactFormErrors,
} from "./contact-form.types";
import { contactFormStyles as styles } from "./contact-form.styles";
import {
  AlertCircle,
  Loader2,
  Trash2,
  Mail,
  Phone,
  User,
  Briefcase,
} from "lucide-react";
import {
  FormPage,
  FormPageContent,
  FormPageFooter,
} from "@/src/components/ui/form-page";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useToast } from "@/src/components/ui/toast";
import { handleExpirationError } from "@/src/lib/expiration-error-handler";

const ContactForm: React.FC<ContactFormProps> = ({
  isOpen,
  onClose,
  contact,
  onSave,
  onDelete,
  isLoading: externalIsLoading = false,
}) => {
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(externalIsLoading);

  useEffect(() => {
    setIsLoading(externalIsLoading);
  }, [externalIsLoading]);

  const [formData, setFormData] = useState<ContactFormData>(() => {
    if (contact) {
      return {
        id: contact.id,
        name: contact.name,
        role: contact.role,
        phone: contact.phone || undefined,
        email: contact.email || undefined,
      };
    }

    return {
      name: "",
      role: "",
      phone: undefined,
      email: undefined,
    };
  });

  useEffect(() => {
    if (contact && isOpen && !isLoading) {
      setFormData({
        id: contact.id,
        name: contact.name,
        role: contact.role,
        phone: contact.phone || undefined,
        email: contact.email || undefined,
      });
    } else if (!isOpen && !isLoading) {
      setFormData({
        name: "",
        role: "",
        phone: undefined,
        email: undefined,
      });
    }
    if (!isLoading) {
      setErrors({});
    }
  }, [contact?.id, isOpen, isLoading]);

  const [errors, setErrors] = useState<ContactFormErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof ContactFormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ContactFormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nome é obrigatório";
    }

    if (!formData.role.trim()) {
      newErrors.role = "Cargo é obrigatório";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Por favor, insira um endereço de e-mail válido";
    }

    if (formData.phone && !/^[0-9+\-() ]{7,}$/.test(formData.phone)) {
      newErrors.phone = "Por favor, insira um número de telefone válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const authToken = localStorage.getItem("authToken");

      if (!authToken) {
        console.error("Token de autenticação não encontrado");
        return;
      }

      const isUpdate = !!formData.id;

      const url = isUpdate ? `/api/contact?id=${formData.id}` : "/api/contact";

      const method = isUpdate ? "PUT" : "POST";

      const payload = {
        name: formData.name,
        role: formData.role,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError, errorData } = await handleExpirationError(
            response,
            showToast,
            "gerenciar contatos"
          );
          if (isExpirationError) {
            return;
          }
          if (errorData) {
            showToast({
              variant: "error",
              title: "Erro",
              message: errorData.error || "Falha ao salvar contato",
              duration: 5000,
            });
            throw new Error(errorData.error || "Falha ao salvar contato");
          }
        }

        const errorData = await response.json();
        showToast({
          variant: "error",
          title: "Erro",
          message: errorData.error || "Falha ao salvar contato",
          duration: 5000,
        });
        throw new Error(errorData.error || "Falha ao salvar contato");
      }

      const result = await response.json();

      if (result.success) {
        onSave(result.data);

        setFormData({
          name: "",
          role: "",
          phone: undefined,
          email: undefined,
        });

        onClose();
      } else {
        showToast({
          variant: "error",
          title: "Erro",
          message: result.error || "Falha ao salvar contato",
          duration: 5000,
        });
        throw new Error(result.error || "Falha ao salvar contato");
      }
    } catch (error) {
      console.error("Erro ao salvar contato:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contact?.id || !onDelete) {
      return;
    }

    setIsLoading(true);

    try {
      const authToken = localStorage.getItem("authToken");

      if (!authToken) {
        console.error("Token de autenticação não encontrado");
        return;
      }

      const response = await fetch(`/api/contact?id=${contact.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 403) {
          const { isExpirationError, errorData } = await handleExpirationError(
            response,
            showToast,
            "gerenciar contatos"
          );
          if (isExpirationError) {
            return;
          }
          if (errorData) {
            showToast({
              variant: "error",
              title: "Erro",
              message: errorData.error || "Falha ao excluir contato",
              duration: 5000,
            });
            throw new Error(errorData.error || "Falha ao excluir contato");
          }
        }

        const errorData = await response.json();
        showToast({
          variant: "error",
          title: "Erro",
          message: errorData.error || "Falha ao excluir contato",
          duration: 5000,
        });
        throw new Error(errorData.error || "Falha ao excluir contato");
      }

      if (response.status === 204) {
        onDelete(contact.id);

        setFormData({
          name: "",
          role: "",
          phone: undefined,
          email: undefined,
        });

        onClose();
      } else {
        const result = await response.json();

        if (result.success) {
          onDelete(contact.id);

          setFormData({
            name: "",
            role: "",
            phone: undefined,
            email: undefined,
          });

          onClose();
        } else {
          showToast({
            variant: "error",
            title: "Erro",
            message: result.error || "Falha ao excluir contato",
            duration: 5000,
          });
          throw new Error(result.error || "Falha ao excluir contato");
        }
      }
    } catch (error) {
      console.error("Erro ao excluir contato:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={contact ? "Editar Contato" : "Adicionar Contato"}
      description={
        contact
          ? "Atualizar detalhes do contato"
          : "Adicionar um novo contato à sua lista"
      }
      className="contact-form-container"
    >
      <div className="h-full flex flex-col">
        <FormPageContent className="overflow-y-auto">
          <div className="space-y-6">
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Detalhes do Contato</h3>

              <div className={styles.fieldGroup}>
                <label htmlFor="name" className="form-label">
                  Nome
                  <span className={styles.fieldRequired}>*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-9"
                    placeholder="Digite o nome do contato"
                  />
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.name && (
                  <div className={styles.fieldError}>
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.name}
                  </div>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="role" className="form-label">
                  Cargo
                  <span className={styles.fieldRequired}>*</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full pl-9"
                    placeholder="Digite o cargo do contato (ex.: Médico, Família)"
                  />
                  <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.role && (
                  <div className={styles.fieldError}>
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.role}
                  </div>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="phone" className="form-label">
                  Número de Telefone
                </label>
                <div className="relative">
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleChange}
                    className="w-full pl-9"
                    placeholder="Digite o número de telefone (opcional)"
                  />
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.phone && (
                  <div className={styles.fieldError}>
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.phone}
                  </div>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="email" className="form-label">
                  Endereço de E-mail
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleChange}
                    className="w-full pl-9"
                    placeholder="Digite o endereço de e-mail (opcional)"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                </div>
                {errors.email && (
                  <div className={styles.fieldError}>
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {errors.email}
                  </div>
                )}
              </div>
            </div>
          </div>
        </FormPageContent>

        <FormPageFooter>
          <div className="flex justify-between w-full">
            {contact && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Excluir
              </Button>
            )}

            <div className="flex space-x-2 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancelar
              </Button>

              <Button type="button" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Contato"
                )}
              </Button>
            </div>
          </div>
        </FormPageFooter>
      </div>
    </FormPage>
  );
};

export default ContactForm;
