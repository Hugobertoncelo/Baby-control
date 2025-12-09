import React, { useState } from "react";
import { cn } from "@/src/lib/utils";
import { Contact } from "@/src/components/CalendarEvent/calendar-event.types";
import { Check, X, Plus, Phone, Mail, Edit, User } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import ContactForm from "@/src/components/forms/ContactForm";

interface ContactSelectorProps {
  contacts: Contact[];
  selectedContactIds: string[];
  onContactsChange: (contactIds: string[]) => void;
  onAddNewContact?: (contact: Contact) => void;
  onEditContact?: (contact: Contact) => void;
  onDeleteContact?: (contactId: string) => void;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
  contacts,
  selectedContactIds,
  onContactsChange,
  onAddNewContact,
  onEditContact,
  onDeleteContact,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(false);

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedContacts = contacts.filter((contact) =>
    selectedContactIds.includes(contact.id)
  );

  const toggleContact = (contactId: string) => {
    if (selectedContactIds.includes(contactId)) {
      onContactsChange(selectedContactIds.filter((id) => id !== contactId));
    } else {
      onContactsChange([...selectedContactIds, contactId]);
    }
  };

  const removeContact = (contactId: string) => {
    onContactsChange(selectedContactIds.filter((id) => id !== contactId));
  };

  const contactsByRole = filteredContacts.reduce<Record<string, Contact[]>>(
    (acc, contact) => {
      if (!acc[contact.role]) {
        acc[contact.role] = [];
      }
      acc[contact.role].push(contact);
      return acc;
    },
    {}
  );

  const handleSaveContact = async (contactData: any) => {
    setIsLoading(true);

    try {
      const isNewContact = !selectedContact?.id;

      if (isNewContact && onAddNewContact) {
        onAddNewContact(contactData);

        if (contactData.id) {
          onContactsChange([...selectedContactIds, contactData.id]);
        }
      } else if (!isNewContact && onEditContact) {
        onEditContact(contactData);
      }

      setShowContactForm(false);
      setSelectedContact(undefined);
    } catch (error) {
      console.error("Error handling saved contact:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (onDeleteContact) {
      setIsLoading(true);

      try {
        onDeleteContact(contactId);

        if (selectedContactIds.includes(contactId)) {
          onContactsChange(selectedContactIds.filter((id) => id !== contactId));
        }

        setShowContactForm(false);
        setSelectedContact(undefined);
      } catch (error) {
        console.error("Error handling contact deletion:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="text"
          placeholder="Pesquisar contatos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="contact-selector-clear-button absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="contact-selector-list max-h-40 overflow-y-auto rounded-md border border-gray-300 bg-white p-1 calendar-event-form-multi-select">
        {Object.entries(contactsByRole).map(([role, roleContacts]) => (
          <div key={role} className="mb-2 last:mb-0">
            <div className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {role}
            </div>
            {roleContacts.map((contact) => (
              <div
                key={contact.id}
                className={cn(
                  "contact-selector-item flex items-center px-2 py-1 rounded-md hover:bg-gray-100",
                  selectedContactIds.includes(contact.id) &&
                    "contact-selector-item-selected bg-teal-50",
                  "cursor-pointer flex justify-between"
                )}
              >
                <div
                  className="flex-1 flex items-start"
                  onClick={() => toggleContact(contact.id)}
                >
                  <div className="flex-shrink-0 w-4 mt-1">
                    {selectedContactIds.includes(contact.id) && (
                      <Check className="contact-selector-check-icon h-4 w-4 text-teal-600" />
                    )}
                  </div>
                  <div className="ml-2 text-sm text-gray-700 contact-selector-contact-info">
                    <div className="font-medium">{contact.name}</div>
                    <div className="contact-selector-contact-details text-xs text-gray-500 flex flex-wrap gap-2">
                      {contact.phone && (
                        <span className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {contact.phone}
                        </span>
                      )}
                      {contact.email && (
                        <span className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {onEditContact && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContact(contact);
                      setShowContactForm(true);
                    }}
                    className="contact-selector-edit-button p-1 text-gray-400 hover:text-gray-600"
                    aria-label={`Edit ${contact.name}`}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="contact-selector-empty-state p-2 text-sm text-gray-500 text-center">
            {searchTerm
              ? "Nenhum contato encontrado"
              : "Nenhum contato disponível"}
          </div>
        )}

        <ContactForm
          isOpen={showContactForm}
          onClose={() => {
            setShowContactForm(false);
            setSelectedContact(undefined);
          }}
          contact={selectedContact}
          onSave={handleSaveContact}
          onDelete={handleDeleteContact}
          isLoading={isLoading}
        />
      </div>

      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedContacts.map((contact) => (
            <div
              key={contact.id}
              className="contact-selector-selected-tag flex items-center rounded-full bg-teal-100 px-2 py-1 text-xs text-teal-800"
            >
              <User className="contact-selector-selected-tag-icon h-3 w-3 mr-1 text-teal-600" />
              <span>{contact.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeContact(contact.id);
                }}
                className="contact-selector-remove-tag-button ml-1 h-3 w-3 text-teal-600 hover:text-teal-800"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {onAddNewContact && (
        <div className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedContact(undefined);
              setShowContactForm(true);
            }}
            className="w-full"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Adicionar novo contato
          </Button>
        </div>
      )}
    </div>
  );
};

export default ContactSelector;
