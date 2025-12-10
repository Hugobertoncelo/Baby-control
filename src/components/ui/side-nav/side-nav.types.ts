import { ReactNode } from "react";

export interface SideNavProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onNavigate: (path: string) => void;
  onSettingsClick: () => void;
  onLogout: () => void;
  isAdmin: boolean;
  className?: string;
  nonModal?: boolean;
  familySlug?: string;
  familyName?: string;
}

export interface SideNavTriggerProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
  children: ReactNode;
}

export interface SideNavItemProps {
  path: string;
  label: string;
  icon?: ReactNode;
  isActive: boolean;
  onClick: (path: string) => void;
  className?: string;
}
