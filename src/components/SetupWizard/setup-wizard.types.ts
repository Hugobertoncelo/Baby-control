import type { Dispatch, SetStateAction } from "react";
import { Gender } from "@prisma/client";

export interface SetupWizardProps {
  onComplete: (family: { id: string; name: string; slug: string }) => void;
  token?: string;
  initialSetup?: boolean;
}

export interface FamilySetupStageProps {
  familyName: string;
  setFamilyName: (value: string) => void;
  familySlug: string;
  setFamilySlug: (value: string) => void;
  token?: string;
  initialSetup?: boolean;
}

export type CaretakerData = {
  loginId: string;
  name: string;
  type: string;
  role: "ADMIN" | "USER";
  securityPin: string;
};

export interface SecuritySetupStageProps {
  useSystemPin: boolean;
  setUseSystemPin: (value: boolean) => void;
  systemPin: string;
  setSystemPin: (value: string) => void;
  confirmSystemPin: string;
  setConfirmSystemPin: (value: string) => void;
  caretakers: CaretakerData[];
  setCaretakers: (caretakers: CaretakerData[]) => void;
  newCaretaker: CaretakerData;
  setNewCaretaker: Dispatch<SetStateAction<CaretakerData>>;
  addCaretaker: () => void;
  removeCaretaker: (index: number) => void;
}

export interface BabySetupStageProps {
  babyFirstName: string;
  setBabyFirstName: (value: string) => void;
  babyLastName: string;
  setBabyLastName: (value: string) => void;
  babyBirthDate: Date | null;
  setBabyBirthDate: (value: Date | null) => void;
  babyGender: Gender | "";
  setBabyGender: (value: Gender | "") => void;
  feedWarningTime: string;
  setFeedWarningTime: (value: string) => void;
  diaperWarningTime: string;
  setDiaperWarningTime: (value: string) => void;
}
