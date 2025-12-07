import React from "react";
import { Phone, Mail, MapPin } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { styles } from "./baby-quick-info.styles";
import { ContactsTabProps } from "./baby-quick-info.types";

const ContactsTab: React.FC<ContactsTabProps> = ({
  contacts,
  selectedBaby,
}) => {
  return (
    <div
      className={cn(
        styles.contactsContainer,
        "baby-quick-info-contacts-container"
      )}
    >
      <h3 className={cn(styles.sectionTitle, "baby-quick-info-section-title")}>
        {selectedBaby.firstName} Contatos
      </h3>

      {contacts && contacts.length > 0 ? (
        <div>
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={cn(styles.contactItem, "baby-quick-info-contact-item")}
            >
              <div
                className={cn(
                  styles.contactInfo,
                  "baby-quick-info-contact-info"
                )}
              >
                <div
                  className={cn(
                    styles.contactName,
                    "baby-quick-info-contact-name"
                  )}
                >
                  {contact.name}
                </div>
                <div
                  className={cn(
                    styles.contactRole,
                    "baby-quick-info-contact-role"
                  )}
                >
                  {contact.role}
                </div>

                <div
                  className={cn(
                    styles.contactDetails,
                    "baby-quick-info-contact-details"
                  )}
                >
                  {contact.phone && (
                    <div
                      className={cn(
                        styles.contactDetail,
                        "baby-quick-info-contact-detail"
                      )}
                    >
                      <Phone
                        className={cn(
                          styles.contactIcon,
                          "baby-quick-info-contact-icon"
                        )}
                      />
                      <a
                        href={`tel:${contact.phone.replace(/\D/g, "")}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        aria-label={`Call ${contact.name}`}
                      >
                        {contact.phone}
                      </a>
                    </div>
                  )}

                  {contact.email && (
                    <div
                      className={cn(
                        styles.contactDetail,
                        "baby-quick-info-contact-detail"
                      )}
                    >
                      <Mail
                        className={cn(
                          styles.contactIcon,
                          "baby-quick-info-contact-icon"
                        )}
                      />
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        aria-label={`Email ${contact.name}`}
                      >
                        {contact.email}
                      </a>
                    </div>
                  )}

                  {contact.address && (
                    <div
                      className={cn(
                        styles.contactDetail,
                        "baby-quick-info-contact-detail"
                      )}
                    >
                      <MapPin
                        className={cn(
                          styles.contactIcon,
                          "baby-quick-info-contact-icon"
                        )}
                      />
                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          contact.address
                        )}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View ${contact.name}'s address on map`}
                      >
                        {contact.address}
                      </a>
                    </div>
                  )}
                </div>

                {contact.notes && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    {contact.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className={cn(styles.emptyMessage, "baby-quick-info-empty-message")}
        >
          Nenhum contato disponível. Os contatos podem ser adicionados no
          formulário de Evento do Calendário ou nas Configurações.
        </div>
      )}
    </div>
  );
};

export default ContactsTab;
