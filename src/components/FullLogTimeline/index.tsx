import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Settings } from "@prisma/client";
import { CardHeader } from "@/src/components/ui/card";
import SleepForm from "@/src/components/forms/SleepForm";
import FeedForm from "@/src/components/forms/FeedForm";
import DiaperForm from "@/src/components/forms/DiaperForm";
import NoteForm from "@/src/components/forms/NoteForm";
import BathForm from "@/src/components/forms/BathForm";
import PumpForm from "@/src/components/forms/PumpForm";
import MilestoneForm from "@/src/components/forms/MilestoneForm";
import MeasurementForm from "@/src/components/forms/MeasurementForm";
import GiveMedicineForm from "@/src/components/forms/GiveMedicineForm";
import {
  ActivityType,
  FilterType,
  FullLogTimelineProps,
} from "./full-log-timeline.types";
import FullLogFilter from "./FullLogFilter";
import FullLogSearchBar from "./FullLogSearchBar";
import FullLogActivityList from "./FullLogActivityList";
import FullLogActivityDetails from "./FullLogActivityDetails";
import {
  getActivityEndpoint,
  getActivityTime,
} from "@/src/components/Timeline/utils";
import { PumpLogResponse, MedicineLogResponse } from "@/app/api/types";
import { cn } from "@/src/lib/utils";
import styles from "./full-log-timeline.styles";
import "./full-log-timeline.css";

const FullLogTimeline: React.FC<FullLogTimelineProps> = ({
  activities,
  onActivityDeleted,
  startDate,
  endDate,
  onDateRangeChange,
}) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<ActivityType | null>(
    null
  );
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);
  const [editModalType, setEditModalType] = useState<
    | "sleep"
    | "feed"
    | "diaper"
    | "note"
    | "bath"
    | "pump"
    | "milestone"
    | "measurement"
    | "medicine"
    | null
  >(null);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      }
    };
    fetchSettings();
  }, []);

  const handleQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setCurrentPage(1);
    onDateRangeChange(start, end);
  };

  const matchesSearch = useCallback(
    (activity: ActivityType, query: string): boolean => {
      if (!query) return true;

      const searchLower = query.toLowerCase();

      if (
        activity.babyId &&
        activity.babyId.toLowerCase().includes(searchLower)
      )
        return true;
      if (
        activity.caretakerName &&
        activity.caretakerName.toLowerCase().includes(searchLower)
      )
        return true;

      const isSleepActivity = (
        act: any
      ): act is {
        duration: number;
        type?: string;
        location?: string;
        quality?: string;
      } => {
        return "duration" in act;
      };

      const isFeedActivity = (
        act: any
      ): act is {
        amount: number;
        type?: string;
        unitAbbr?: string;
        side?: string;
        food?: string;
      } => {
        return "amount" in act;
      };

      const isDiaperActivity = (
        act: any
      ): act is {
        condition: string;
        type?: string;
        color?: string;
      } => {
        return "condition" in act;
      };

      const isNoteActivity = (
        act: any
      ): act is {
        content: string;
        category?: string;
      } => {
        return "content" in act;
      };

      const isBathActivity = (
        act: any
      ): act is {
        soapUsed: boolean;
        notes?: string;
      } => {
        return "soapUsed" in act;
      };

      const isPumpActivity = (
        act: any
      ): act is {
        leftAmount?: number;
        rightAmount?: number;
        totalAmount?: number;
        unit?: string;
        notes?: string;
      } => {
        return "leftAmount" in act || "rightAmount" in act;
      };

      const isMilestoneActivity = (
        act: any
      ): act is {
        title: string;
        category: string;
        description?: string;
      } => {
        return "title" in act && "category" in act;
      };

      const isMeasurementActivity = (
        act: any
      ): act is {
        value: number;
        unit: string;
        type?: string;
        notes?: string;
      } => {
        return "value" in act && "unit" in act;
      };

      const isMedicineActivity = (
        act: any
      ): act is {
        doseAmount: number;
        medicineId: string;
        unitAbbr?: string;
        notes?: string;
        medicine?: { name?: string };
      } => {
        return "doseAmount" in act && "medicineId" in act;
      };

      if (isSleepActivity(activity)) {
        if (activity.type && activity.type.toLowerCase().includes(searchLower))
          return true;
        if (
          activity.location &&
          activity.location.toLowerCase().includes(searchLower)
        )
          return true;
        if (
          activity.quality &&
          activity.quality.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }

      if (isFeedActivity(activity)) {
        if (activity.type && activity.type.toLowerCase().includes(searchLower))
          return true;
        if (activity.amount && activity.amount.toString().includes(searchLower))
          return true;
        if (
          activity.unitAbbr &&
          activity.unitAbbr.toLowerCase().includes(searchLower)
        )
          return true;
        if (activity.side && activity.side.toLowerCase().includes(searchLower))
          return true;
        if (activity.food && activity.food.toLowerCase().includes(searchLower))
          return true;
        return false;
      }

      if (isDiaperActivity(activity)) {
        if (activity.type && activity.type.toLowerCase().includes(searchLower))
          return true;
        if (
          activity.condition &&
          activity.condition.toLowerCase().includes(searchLower)
        )
          return true;
        if (
          activity.color &&
          activity.color.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }

      if (isNoteActivity(activity)) {
        if (
          activity.content &&
          activity.content.toLowerCase().includes(searchLower)
        )
          return true;
        if (
          activity.category &&
          activity.category.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }

      if (isBathActivity(activity)) {
        if (
          activity.notes &&
          activity.notes.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }

      if (isPumpActivity(activity)) {
        if (
          activity.leftAmount &&
          activity.leftAmount.toString().includes(searchLower)
        )
          return true;
        if (
          activity.rightAmount &&
          activity.rightAmount.toString().includes(searchLower)
        )
          return true;
        if (
          activity.totalAmount &&
          activity.totalAmount.toString().includes(searchLower)
        )
          return true;
        if (activity.unit && activity.unit.toLowerCase().includes(searchLower))
          return true;
        if (
          activity.notes &&
          activity.notes.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }

      if (isMilestoneActivity(activity)) {
        if (
          activity.title &&
          activity.title.toLowerCase().includes(searchLower)
        )
          return true;
        if (
          activity.category &&
          activity.category.toLowerCase().includes(searchLower)
        )
          return true;
        if (
          activity.description &&
          activity.description.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }

      if (isMeasurementActivity(activity)) {
        if (activity.type && activity.type.toLowerCase().includes(searchLower))
          return true;
        if (activity.value && activity.value.toString().includes(searchLower))
          return true;
        if (activity.unit && activity.unit.toLowerCase().includes(searchLower))
          return true;
        if (
          activity.notes &&
          activity.notes.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }

      if (isMedicineActivity(activity)) {
        if (
          activity.doseAmount &&
          activity.doseAmount.toString().includes(searchLower)
        )
          return true;
        if (
          activity.unitAbbr &&
          activity.unitAbbr.toLowerCase().includes(searchLower)
        )
          return true;
        if (
          activity.notes &&
          activity.notes.toLowerCase().includes(searchLower)
        )
          return true;
        if (
          activity.medicine &&
          activity.medicine.name &&
          activity.medicine.name.toLowerCase().includes(searchLower)
        )
          return true;
        return false;
      }

      return false;
    },
    []
  );

  const sortedActivities = useMemo(() => {
    const typeFiltered = !activeFilter
      ? activities
      : activities.filter((activity) => {
          switch (activeFilter) {
            case "sleep":
              return "Duração" in activity;
            case "feed":
              return "Quantia" in activity;
            case "diaper":
              return "Condição" in activity;
            case "note":
              return "Notas" in activity;
            case "bath":
              return "Sabonete Usado" in activity;
            case "pump":
              return (
                "Quantidade Esquerda" in activity ||
                "Quantidade Direita" in activity
              );
            case "milestone":
              return "Título" in activity && "Categoria" in activity;
            case "measurement":
              return "Valor" in activity && "Unidade" in activity;
            case "medicine":
              return (
                "Quantidade de Dose" in activity &&
                "Id do Medicamento" in activity
              );
            default:
              return true;
          }
        });

    const searchFiltered = !searchQuery
      ? typeFiltered
      : typeFiltered.filter((activity) => matchesSearch(activity, searchQuery));

    const sorted = [...searchFiltered].sort((a, b) => {
      const timeA = new Date(getActivityTime(a));
      const timeB = new Date(getActivityTime(b));
      return timeB.getTime() - timeA.getTime();
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
  }, [
    activities,
    activeFilter,
    currentPage,
    itemsPerPage,
    searchQuery,
    matchesSearch,
  ]);

  const totalPages = useMemo(() => {
    const typeFiltered = !activeFilter
      ? activities
      : activities.filter((activity) => {
          switch (activeFilter) {
            case "sleep":
              return "Duração" in activity;
            case "feed":
              return "Quantia" in activity;
            case "diaper":
              return "Condição" in activity;
            case "note":
              return "Notas" in activity;
            case "bath":
              return "Sabonete Usado" in activity;
            case "pump":
              return (
                "Quantidade Esquerda" in activity ||
                "Quantidade Direita" in activity
              );
            case "milestone":
              return "Título" in activity && "Categoria" in activity;
            case "measurement":
              return "value" in activity && "Unidade" in activity;
            case "medicine":
              return "doseAmount" in activity && "medicineId" in activity;
            default:
              return true;
          }
        });

    const searchFiltered = !searchQuery
      ? typeFiltered
      : typeFiltered.filter((activity) => matchesSearch(activity, searchQuery));

    return Math.ceil(searchFiltered.length / itemsPerPage);
  }, [activities, activeFilter, itemsPerPage, searchQuery, matchesSearch]);

  const handleDelete = async (activity: ActivityType) => {
    if (!confirm("Tem certeza de que deseja excluir esta atividade?")) return;

    const endpoint = getActivityEndpoint(activity);

    try {
      const authToken = localStorage.getItem("authToken");
      const response = await fetch(`/api/${endpoint}?id=${activity.id}`, {
        method: "DELETE",
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : "",
        },
      });

      if (response.ok) {
        setSelectedActivity(null);
        onActivityDeleted?.();
      }
    } catch (error) {
      console.error("Error deleting activity:", error);
    }
  };

  const handleEdit = (
    activity: ActivityType,
    type:
      | "sleep"
      | "feed"
      | "diaper"
      | "note"
      | "bath"
      | "pump"
      | "milestone"
      | "measurement"
      | "medicine"
  ) => {
    setSelectedActivity(activity);
    setEditModalType(type);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (count: number) => {
    setItemsPerPage(count);
    setCurrentPage(1);
  };

  return (
    <div className={cn(styles.container, "full-log-timeline-container")}>
      <CardHeader className="py-0 bg-gradient-to-r from-teal-600 to-teal-700 border-0 full-log-timeline-header">
        <FullLogFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          startDate={startDate}
          endDate={endDate}
          onDateRangeChange={onDateRangeChange}
          onQuickFilter={handleQuickFilter}
        />
      </CardHeader>

      <FullLogSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <FullLogActivityList
        activities={sortedActivities}
        settings={settings}
        isLoading={isLoading}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalPages={totalPages}
        onActivitySelect={setSelectedActivity}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      <FullLogActivityDetails
        activity={selectedActivity}
        settings={settings}
        isOpen={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {selectedActivity && (
        <>
          <SleepForm
            isOpen={editModalType === "sleep"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            isSleeping={false}
            onSleepToggle={() => {}}
            babyId={selectedActivity.babyId}
            initialTime={
              "startTime" in selectedActivity && selectedActivity.startTime
                ? String(selectedActivity.startTime)
                : getActivityTime(selectedActivity)
            }
            activity={
              "duration" in selectedActivity && "type" in selectedActivity
                ? selectedActivity
                : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
          <FeedForm
            isOpen={editModalType === "feed"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={
              "time" in selectedActivity && selectedActivity.time
                ? String(selectedActivity.time)
                : getActivityTime(selectedActivity)
            }
            activity={
              "amount" in selectedActivity && "type" in selectedActivity
                ? selectedActivity
                : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
          <DiaperForm
            isOpen={editModalType === "diaper"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={
              "time" in selectedActivity && selectedActivity.time
                ? String(selectedActivity.time)
                : getActivityTime(selectedActivity)
            }
            activity={
              "condition" in selectedActivity && "type" in selectedActivity
                ? selectedActivity
                : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
          <NoteForm
            isOpen={editModalType === "note"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={
              "time" in selectedActivity && selectedActivity.time
                ? String(selectedActivity.time)
                : getActivityTime(selectedActivity)
            }
            activity={
              "content" in selectedActivity && "time" in selectedActivity
                ? selectedActivity
                : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
          <BathForm
            isOpen={editModalType === "bath"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={
              "time" in selectedActivity && selectedActivity.time
                ? String(selectedActivity.time)
                : getActivityTime(selectedActivity)
            }
            activity={
              "soapUsed" in selectedActivity ? selectedActivity : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
          <PumpForm
            isOpen={editModalType === "pump"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={
              "startTime" in selectedActivity && selectedActivity.startTime
                ? String(selectedActivity.startTime)
                : getActivityTime(selectedActivity)
            }
            activity={
              "leftAmount" in selectedActivity ||
              "rightAmount" in selectedActivity
                ? (selectedActivity as unknown as PumpLogResponse)
                : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
          <MilestoneForm
            isOpen={editModalType === "milestone"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={
              "date" in selectedActivity && selectedActivity.date
                ? String(selectedActivity.date)
                : getActivityTime(selectedActivity)
            }
            activity={
              "title" in selectedActivity && "category" in selectedActivity
                ? selectedActivity
                : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
          <MeasurementForm
            isOpen={editModalType === "measurement"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={
              "date" in selectedActivity && selectedActivity.date
                ? String(selectedActivity.date)
                : getActivityTime(selectedActivity)
            }
            activity={
              "value" in selectedActivity && "unit" in selectedActivity
                ? selectedActivity
                : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
          <GiveMedicineForm
            isOpen={editModalType === "medicine"}
            onClose={() => {
              setEditModalType(null);
              setSelectedActivity(null);
            }}
            babyId={selectedActivity.babyId}
            initialTime={
              "time" in selectedActivity && selectedActivity.time
                ? String(selectedActivity.time)
                : getActivityTime(selectedActivity)
            }
            activity={
              "doseAmount" in selectedActivity &&
              "medicineId" in selectedActivity
                ? (selectedActivity as unknown as MedicineLogResponse)
                : undefined
            }
            onSuccess={() => {
              setEditModalType(null);
              setSelectedActivity(null);
              onActivityDeleted?.();
            }}
          />
        </>
      )}
    </div>
  );
};

export default FullLogTimeline;
