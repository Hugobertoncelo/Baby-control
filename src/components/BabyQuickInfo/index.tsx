"use client";

import React, { useState, useEffect } from "react";
import FormPage, { FormPageFooter } from "@/src/components/ui/form-page";
import { FormPageTab } from "@/src/components/ui/form-page/form-page.types";
import { Button } from "@/src/components/ui/button";
import { Loader2, Bell, Users, BarChart3 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { styles } from "./baby-quick-info.styles";
import { Tab, BabyQuickInfoProps } from "./baby-quick-info.types";
import NotificationsTab from "./NotificationsTab";
import ContactsTab from "./ContactsTab";
import StatsTab from "./StatsTab";
import "./baby-quick-info.css";

const BabyQuickInfo: React.FC<BabyQuickInfoProps> = ({
  isOpen,
  onClose,
  selectedBaby,
  calculateAge,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [lastActivities, setLastActivities] = useState<any>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && selectedBaby) {
      fetchData();
    }
  }, [isOpen, selectedBaby]);

  const fetchData = async () => {
    if (!selectedBaby) return;

    setIsLoading(true);
    setError(null);

    try {
      const authToken = localStorage.getItem("authToken");
      const fetchOptions = authToken
        ? {
            headers: { Authorization: `Bearer ${authToken}` },
          }
        : {};

      const [lastActivitiesRes, upcomingEventsRes, contactsRes, activitiesRes] =
        await Promise.all([
          fetch(
            `/api/baby-last-activities?babyId=${selectedBaby.id}`,
            fetchOptions
          ),
          fetch(
            `/api/baby-upcoming-events?babyId=${selectedBaby.id}&limit=5`,
            fetchOptions
          ),
          fetch(`/api/contact`, fetchOptions),
          fetch(
            `/api/timeline?babyId=${selectedBaby.id}&limit=30`,
            fetchOptions
          ),
        ]);

      if (lastActivitiesRes.ok) {
        const data = await lastActivitiesRes.json();
        setLastActivities(data.success ? data.data : null);
      } else {
        console.error(
          "Failed to fetch last activities:",
          await lastActivitiesRes.text()
        );
      }

      if (upcomingEventsRes.ok) {
        const data = await upcomingEventsRes.json();
        setUpcomingEvents(data.success ? data.data : []);
      } else {
        console.error(
          "Failed to fetch upcoming events:",
          await upcomingEventsRes.text()
        );
      }

      if (contactsRes.ok) {
        const data = await contactsRes.json();
        setContacts(data.success ? data.data : []);
      } else {
        console.error("Failed to fetch contacts:", await contactsRes.text());
      }

      if (activitiesRes.ok) {
        const data = await activitiesRes.json();
        setActivities(data.success ? data.data : []);
      } else {
        console.error(
          "Failed to fetch activities:",
          await activitiesRes.text()
        );
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs: FormPageTab[] = [
    {
      id: "notifications",
      label: "Notificações",
      icon: Bell,
      content: (
        <>
          {isLoading && (
            <div
              className={cn(
                styles.loadingContainer,
                "baby-quick-info-loading-container"
              )}
            >
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p
                className={cn(
                  "mt-2 text-gray-600",
                  "baby-quick-info-loading-text"
                )}
              >
                Carregando...
              </p>
            </div>
          )}

          {error && (
            <div
              className={cn(
                styles.errorContainer,
                "baby-quick-info-error-container"
              )}
            >
              <p className={cn("text-red-500", "baby-quick-info-error-text")}>
                {error}
              </p>
              <Button variant="outline" onClick={fetchData} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !error && selectedBaby && (
            <NotificationsTab
              lastActivities={lastActivities}
              upcomingEvents={upcomingEvents}
              selectedBaby={selectedBaby}
            />
          )}
        </>
      ),
    },
    {
      id: "contacts",
      label: "Contatos",
      icon: Users,
      content: (
        <>
          {isLoading && (
            <div
              className={cn(
                styles.loadingContainer,
                "baby-quick-info-loading-container"
              )}
            >
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p
                className={cn(
                  "mt-2 text-gray-600",
                  "baby-quick-info-loading-text"
                )}
              >
                Carregando...
              </p>
            </div>
          )}

          {error && (
            <div
              className={cn(
                styles.errorContainer,
                "baby-quick-info-error-container"
              )}
            >
              <p className={cn("text-red-500", "baby-quick-info-error-text")}>
                {error}
              </p>
              <Button variant="outline" onClick={fetchData} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !error && selectedBaby && (
            <ContactsTab contacts={contacts} selectedBaby={selectedBaby} />
          )}
        </>
      ),
    },
    {
      id: "stats",
      label: "Estatísticas rápidas",
      icon: BarChart3,
      content: (
        <>
          {isLoading && (
            <div
              className={cn(
                styles.loadingContainer,
                "baby-quick-info-loading-container"
              )}
            >
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <p
                className={cn(
                  "mt-2 text-gray-600",
                  "baby-quick-info-loading-text"
                )}
              >
                Carregando...
              </p>
            </div>
          )}

          {error && (
            <div
              className={cn(
                styles.errorContainer,
                "baby-quick-info-error-container"
              )}
            >
              <p className={cn("text-red-500", "baby-quick-info-error-text")}>
                {error}
              </p>
              <Button variant="outline" onClick={fetchData} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          )}

          {!isLoading && !error && selectedBaby && (
            <StatsTab
              activities={activities}
              selectedBaby={selectedBaby}
              calculateAge={calculateAge}
            />
          )}
        </>
      ),
    },
  ];

  return (
    <FormPage
      isOpen={isOpen}
      onClose={onClose}
      title={
        selectedBaby
          ? `${selectedBaby.firstName} Informações`
          : "Informações sobre o bebê"
      }
      tabs={tabs}
      defaultActiveTab="notifications"
    >
      <FormPageFooter>
        <div
          className={cn(
            styles.footerContainer,
            "baby-quick-info-footer-container"
          )}
        >
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </div>
      </FormPageFooter>
    </FormPage>
  );
};

export default BabyQuickInfo;
