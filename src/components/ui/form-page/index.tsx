import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/src/lib/utils";
import { formPageStyles, tabStyles } from "./form-page.styles";
import { useTheme } from "@/src/context/theme";
import "./form-page.css";
import {
  FormPageProps,
  FormPageHeaderProps,
  FormPageContentProps,
  FormPageFooterProps,
  FormPageTab,
} from "./form-page.types";

export function FormPageHeader({
  title,
  description,
  onClose,
  className,
}: FormPageHeaderProps) {
  const { theme } = useTheme();
  return (
    <div className={cn(formPageStyles.header, className, "form-page-header")}>
      <div className={formPageStyles.titleContainer}>
        <h2 className={cn(formPageStyles.title, "form-page-title")}>{title}</h2>
        {description && (
          <p
            className={cn(formPageStyles.description, "form-page-description")}
          >
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export function FormPageContent({ children, className }: FormPageContentProps) {
  const { theme } = useTheme();
  return (
    <div className={cn(formPageStyles.content, className, "form-page-content")}>
      <div className={formPageStyles.formContent}>{children}</div>
    </div>
  );
}

export function FormPageFooter({ children, className }: FormPageFooterProps) {
  const { theme } = useTheme();
  return (
    <div className={cn(formPageStyles.footer, className, "form-page-footer")}>
      {children}
    </div>
  );
}

export function FormPageTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
}: {
  tabs: FormPageTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}) {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        tabStyles.tabContainer,
        className,
        "form-page-tab-container"
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              tabStyles.tabButton,
              "form-page-tab-button relative",
              isActive && tabStyles.tabButtonActive,
              isActive && "form-page-tab-button-active"
            )}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
          >
            {IconComponent && (
              <IconComponent
                className={cn(tabStyles.tabIcon, "form-page-tab-icon")}
              />
            )}
            {tab.imageSrc && (
              <img
                src={tab.imageSrc}
                alt={tab.imageAlt || tab.label}
                className={cn(tabStyles.tabImage, "form-page-tab-image")}
              />
            )}
            <span>{tab.label}</span>
            {tab.notificationCount && tab.notificationCount > 0 && (
              <span
                className={cn(
                  tabStyles.notificationBadge,
                  "form-page-tab-notification-badge"
                )}
                aria-label={`${tab.notificationCount} notificações`}
              >
                {tab.notificationCount > 99 ? "99+" : tab.notificationCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function FormPage({
  isOpen,
  onClose,
  title,
  description,
  children,
  tabs,
  activeTab,
  onTabChange,
  defaultActiveTab,
  className,
}: FormPageProps) {
  const { theme } = useTheme();

  const [mounted, setMounted] = useState(false);

  const [internalActiveTab, setInternalActiveTab] = useState<string>(() => {
    if (tabs && tabs.length > 0) {
      return defaultActiveTab || tabs[0].id;
    }
    return "";
  });

  const isControlled = activeTab !== undefined && onTabChange !== undefined;
  const currentActiveTab = isControlled ? activeTab : internalActiveTab;

  const handleTabChange = (tabId: string) => {
    if (isControlled && onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const activeTabContent = tabs?.find(
    (tab) => tab.id === currentActiveTab
  )?.content;

  const content = (
    <>
      <div
        className={cn(
          formPageStyles.overlay,
          isOpen ? formPageStyles.overlayOpen : formPageStyles.overlayClosed,
          "form-page-overlay"
        )}
        onClick={onClose}
        aria-hidden="true"
        style={{ isolation: "isolate" }}
      />

      <div
        className={cn(
          formPageStyles.container,
          isOpen
            ? formPageStyles.containerOpen
            : formPageStyles.containerClosed,
          className,
          "form-page-container"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Página do formulário"
        style={{ isolation: "isolate" }}
      >
        <FormPageHeader
          title={title}
          description={description}
          onClose={onClose}
        />

        {tabs && tabs.length > 0 && (
          <div className="px-4 pt-2">
            <FormPageTabs
              tabs={tabs}
              activeTab={currentActiveTab}
              onTabChange={handleTabChange}
            />
          </div>
        )}

        <div className={cn(formPageStyles.content, "form-page-content")}>
          {tabs && tabs.length > 0 ? (
            <div
              role="tabpanel"
              id={`tabpanel-${currentActiveTab}`}
              aria-labelledby={`tab-${currentActiveTab}`}
              className="p-2 pb-20"
            >
              {activeTabContent}
            </div>
          ) : (
            <div className={formPageStyles.formContent}>{children}</div>
          )}
        </div>

        {tabs && tabs.length > 0 && children}
      </div>
    </>
  );

  return mounted && typeof document !== "undefined"
    ? createPortal(content, document.body)
    : null;
}

export default FormPage;
