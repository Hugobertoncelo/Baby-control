"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MedicineFormProps } from "./medicine-form.types";
import { Activity, Settings } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { FormPage, FormPageFooter } from "@/src/components/ui/form-page";
import { FormPageTab } from "@/src/components/ui/form-page/form-page.types";
import ActiveDosesTab from "./ActiveDosesTab";
import ManageMedicinesTab from "./ManageMedicinesTab";
import GiveMedicineForm from "../GiveMedicineForm";
import "./medicine-form.css";

const MedicineForm: React.FC<MedicineFormProps> = ({
  isOpen,
  onClose,
  babyId,
  initialTime,
  onSuccess,
  activity,
}) => {
  const [activeTab, setActiveTab] = useState<string>("active-doses");
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [showGiveMedicineForm, setShowGiveMedicineForm] = useState(false);

  const refreshData = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleOpenGiveMedicine = useCallback(() => {
    setShowGiveMedicineForm(true);
  }, []);

  const handleGiveMedicineSuccess = useCallback(() => {
    setShowGiveMedicineForm(false);
    refreshData();

    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess, refreshData]);

  useEffect(() => {
    if (isOpen) {
      if (activity) {
        setShowGiveMedicineForm(true);
      } else {
        setActiveTab("active-doses");
      }
    }
  }, [isOpen, activity]);

  const tabs: FormPageTab[] = [
    {
      id: "active-doses",
      label: "Doses",
      icon: Activity,
      content: (
        <ActiveDosesTab
          babyId={babyId}
          refreshData={refreshData}
          onGiveMedicine={handleOpenGiveMedicine}
          refreshTrigger={refreshTrigger}
        />
      ),
    },
    {
      id: "manage-medicines",
      label: "Medicamentos",
      icon: Settings,
      content: <ManageMedicinesTab refreshData={refreshData} />,
    },
  ];

  return (
    <>
      <FormPage
        isOpen={isOpen}
        onClose={onClose}
        title="Rastreador de Medicamentos"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <FormPageFooter>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </FormPageFooter>
      </FormPage>

      <GiveMedicineForm
        isOpen={showGiveMedicineForm}
        onClose={() => setShowGiveMedicineForm(false)}
        babyId={babyId}
        initialTime={initialTime}
        onSuccess={handleGiveMedicineSuccess}
        refreshData={refreshData}
        activity={activity}
      />
    </>
  );
};

export default MedicineForm;
