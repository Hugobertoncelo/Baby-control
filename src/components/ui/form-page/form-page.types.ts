import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export interface FormPageTab {
  id: string;

  label: string;

  icon?: LucideIcon;

  imageSrc?: string;

  imageAlt?: string;

  notificationCount?: number;

  content: ReactNode;
}

export interface FormPageProps {
  isOpen: boolean;

  onClose: () => void;

  title: string;

  description?: string;

  children?: ReactNode;

  tabs?: FormPageTab[];

  activeTab?: string;

  onTabChange?: (tabId: string) => void;

  defaultActiveTab?: string;

  className?: string;
}

export interface FormPageHeaderProps {
  title: string;

  description?: string;

  onClose?: () => void;

  className?: string;
}

export interface FormPageContentProps {
  children: ReactNode;

  className?: string;
}

export interface FormPageFooterProps {
  children: ReactNode;

  className?: string;
}
