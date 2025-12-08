export interface AccountManagerProps {
  isOpen: boolean;
  onClose: () => void;
}
export interface AccountStatus {
  accountId: string;
  email: string;
  firstName: string;
  lastName?: string;
  verified: boolean;
  hasFamily: boolean;
  familySlug?: string;
  familyName?: string;
  betaparticipant: boolean;
  closed: boolean;
  closedAt?: string;
  planType?: string;
  planExpires?: string;
  trialEnds?: string;
  subscriptionActive: boolean;
  subscriptionId?: string;
  accountStatus:
    | "active"
    | "inactive"
    | "trial"
    | "expired"
    | "closed"
    | "no_family";
}

export interface FamilyData {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface AccountSettingsTabProps {
  accountStatus: AccountStatus;

  familyData: FamilyData | null;

  onDataRefresh: () => void;
}

export interface FamilyPeopleTabProps {
  familyData: FamilyData;

  onDataRefresh: () => void;
}
export interface BabyData {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  gender?: string;
  inactive: boolean;
  feedWarningTime: string;
  diaperWarningTime: string;
  age?: string;
}

export interface CaretakerData {
  id: string;
  loginId: string;
  name: string;
  type?: string;
  role: string;
  inactive: boolean;
  securityPin?: string;
}
export interface ContactData {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}
