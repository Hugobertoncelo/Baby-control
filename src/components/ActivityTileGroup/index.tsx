import React, { useState, useEffect } from "react";
import { ActivityTile } from "@/src/components/ui/activity-tile";
import { StatusBubble } from "@/src/components/ui/status-bubble";
import {
  SleepLogResponse,
  FeedLogResponse,
  DiaperLogResponse,
  NoteResponse,
  BathLogResponse,
  PumpLogResponse,
  MeasurementResponse,
  MilestoneResponse,
  MedicineLogResponse,
  ActivitySettings,
} from "@/app/api/types";
import { ArrowDownUp } from "lucide-react";
import { useTheme } from "@/src/context/theme";
import "./activity-tile-group.css";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/src/components/ui/dropdown-menu";

interface ActivityTileGroupProps {
  selectedBaby: {
    id: string;
    feedWarningTime?: string | number;
    diaperWarningTime?: string | number;
  } | null;
  sleepingBabies: Set<string>;
  sleepStartTime: Record<string, Date>;
  lastSleepEndTime: Record<string, Date>;
  lastFeedTime: Record<string, Date>;
  lastDiaperTime: Record<string, Date>;
  updateUnlockTimer: () => void;
  onSleepClick: () => void;
  onFeedClick: () => void;
  onDiaperClick: () => void;
  onNoteClick: () => void;
  onBathClick: () => void;
  onPumpClick: () => void;
  onMeasurementClick: () => void;
  onMilestoneClick: () => void;
  onMedicineClick: () => void;
}

type ActivityType =
  | "sleep"
  | "feed"
  | "diaper"
  | "note"
  | "bath"
  | "pump"
  | "measurement"
  | "milestone"
  | "medicine";

export function ActivityTileGroup({
  selectedBaby,
  sleepingBabies,
  sleepStartTime,
  lastSleepEndTime,
  lastFeedTime,
  lastDiaperTime,
  updateUnlockTimer,
  onSleepClick,
  onFeedClick,
  onDiaperClick,
  onNoteClick,
  onBathClick,
  onPumpClick,
  onMeasurementClick,
  onMilestoneClick,
  onMedicineClick = () => {
    console.log("Medicine click handler not provided");
    const medicineForm = document.getElementById("medicine-form");
    if (medicineForm) {
      (medicineForm as HTMLElement).click();
    }
  },
}: ActivityTileGroupProps) {
  const { theme } = useTheme();

  const calculateDurationMinutes = (
    startTime: string,
    endTime: string
  ): number => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    return Math.floor((end - start) / (1000 * 60));
  };

  if (!selectedBaby?.id) return null;

  const allActivityTypes: ActivityType[] = [
    "sleep",
    "feed",
    "diaper",
    "note",
    "bath",
    "pump",
    "measurement",
    "milestone",
    "medicine",
  ];

  const [visibleActivities, setVisibleActivities] = useState<Set<ActivityType>>(
    () => new Set(allActivityTypes)
  );

  const [activityOrder, setActivityOrder] = useState<ActivityType[]>([
    ...allActivityTypes,
  ]);

  const [draggedActivity, setDraggedActivity] = useState<ActivityType | null>(
    null
  );
  const touchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [caretakerId, setCaretakerId] = useState<string | null>(null);

  useEffect(() => {
    const storedCaretakerId = localStorage.getItem("caretakerId");
    setCaretakerId(storedCaretakerId);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "caretakerId" && e.newValue !== caretakerId) {
        console.log(
          `Caretaker ID changed in localStorage: ${caretakerId} -> ${e.newValue}`
        );
        setCaretakerId(e.newValue);
        setSettingsLoaded(false);
        setSettingsModified(false);
      }
    };

    const handleCaretakerChange = (e: CustomEvent) => {
      const newCaretakerId = e.detail?.caretakerId;
      if (newCaretakerId !== caretakerId) {
        console.log(
          `Caretaker ID changed via event: ${caretakerId} -> ${newCaretakerId}`
        );
        setCaretakerId(newCaretakerId);
        setSettingsLoaded(false);
        setSettingsModified(false);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "caretakerChanged",
      handleCaretakerChange as EventListener
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "caretakerChanged",
        handleCaretakerChange as EventListener
      );
    };
  }, [caretakerId]);

  useEffect(() => {
    const loadActivitySettings = async () => {
      if (!caretakerId) {
        setDefaultSettings();
        return;
      }

      try {
        console.log(
          `Loading activity settings for caretakerId: ${caretakerId}`
        );

        const authToken = localStorage.getItem("authToken");
        const response = await fetch(
          `/api/activity-settings?caretakerId=${caretakerId}`,
          {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
          }
        );

        if (response.status === 401) {
          setDefaultSettings();
          return;
        }

        if (response.ok) {
          const data = await response.json();

          if (data.success && data.data) {
            console.log(`Successfully loaded settings:`, data.data);

            const loadedOrder = [...data.data.order] as ActivityType[];
            if (!loadedOrder.includes("measurement")) {
              loadedOrder.push("measurement");
            }
            if (!loadedOrder.includes("milestone")) {
              loadedOrder.push("milestone");
            }

            const loadedVisible = new Set(data.data.visible as ActivityType[]);

            const originalOrder = [...loadedOrder];
            const originalVisible = new Set(loadedVisible);

            setActivityOrder(loadedOrder);
            setVisibleActivities(loadedVisible);

            setTimeout(() => {
              setSettingsLoaded(true);

              originalOrderRef.current = originalOrder;
              originalVisibleRef.current = Array.from(
                originalVisible
              ) as ActivityType[];

              setSettingsModified(false);
            }, 0);
          } else {
            console.error(
              "Failed to load settings:",
              data.error || "Unknown error"
            );
            setDefaultSettings();
          }
        } else {
          console.error(
            "Failed to load settings, server returned:",
            response.status
          );
          setDefaultSettings();
        }
      } catch (error) {
        console.error("Error loading activity settings:", error);
        setDefaultSettings();
      }
    };

    if (!settingsLoaded) {
      loadActivitySettings();
    }
  }, [caretakerId, settingsLoaded]);

  const setDefaultSettings = () => {
    const allActivityTypes: ActivityType[] = [
      "sleep",
      "feed",
      "diaper",
      "note",
      "bath",
      "pump",
      "measurement",
      "milestone",
      "medicine",
    ];

    setActivityOrder([...allActivityTypes]);
    setVisibleActivities(new Set(allActivityTypes));

    setTimeout(() => {
      setSettingsLoaded(true);
      setSettingsModified(false);

      originalOrderRef.current = [...allActivityTypes];
      originalVisibleRef.current = [...allActivityTypes];
    }, 0);
  };

  const originalOrderRef = React.useRef<ActivityType[]>([
    "sleep",
    "feed",
    "diaper",
    "note",
    "bath",
    "pump",
    "measurement",
    "milestone",
    "medicine",
  ]);
  const originalVisibleRef = React.useRef<string[]>([
    "sleep",
    "feed",
    "diaper",
    "note",
    "bath",
    "pump",
    "measurement",
    "milestone",
    "medicine",
  ]);

  const [settingsModified, setSettingsModified] = useState(false);

  useEffect(() => {
    if (settingsLoaded) {
      const currentOrder = [...activityOrder];
      const currentVisible = Array.from(visibleActivities);

      const orderChanged =
        currentOrder.length !== originalOrderRef.current.length ||
        currentOrder.some(
          (activity, index) => activity !== originalOrderRef.current[index]
        );

      const visibleChanged =
        currentVisible.length !== originalVisibleRef.current.length ||
        !currentVisible.every((activity) =>
          originalVisibleRef.current.includes(activity)
        );

      if (orderChanged || visibleChanged) {
        console.log("Settings modified by user action");
        setSettingsModified(true);
      }
    }
  }, [activityOrder, visibleActivities, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded || !settingsModified) {
      return;
    }

    if (caretakerId === null) {
      console.log("Not saving settings: caretakerId is null");
      return;
    }

    console.log(`Saving activity settings for caretakerId: ${caretakerId}`);

    const saveActivitySettings = async () => {
      try {
        const settings: ActivitySettings = {
          order: [...activityOrder],
          visible: Array.from(visibleActivities),
          caretakerId: caretakerId,
        };

        console.log(`Saving settings:`, settings);

        const authToken = localStorage.getItem("authToken");
        const response = await fetch("/api/activity-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authToken && { Authorization: `Bearer ${authToken}` }),
          },
          body: JSON.stringify(settings),
        });

        if (!response.ok) {
          console.error(
            "Failed to save activity settings:",
            await response.text()
          );
        } else {
          originalOrderRef.current = [...activityOrder];
          originalVisibleRef.current = Array.from(visibleActivities);
        }
      } catch (error) {
        console.error("Error saving activity settings:", error);
      }
    };

    const timeoutId = setTimeout(saveActivitySettings, 500);

    return () => clearTimeout(timeoutId);
  }, [
    activityOrder,
    visibleActivities,
    settingsLoaded,
    settingsModified,
    caretakerId,
  ]);

  const toggleActivity = (activity: ActivityType) => {
    const newVisibleActivities = new Set(visibleActivities);
    if (newVisibleActivities.has(activity)) {
      newVisibleActivities.delete(activity);
    } else {
      newVisibleActivities.add(activity);
    }
    setVisibleActivities(newVisibleActivities);
  };

  const moveActivityUp = (activity: ActivityType) => {
    const index = activityOrder.indexOf(activity);
    if (index > 0) {
      const newOrder = [...activityOrder];
      [newOrder[index - 1], newOrder[index]] = [
        newOrder[index],
        newOrder[index - 1],
      ];
      setActivityOrder(newOrder);
    }
  };

  const moveActivityDown = (activity: ActivityType) => {
    const index = activityOrder.indexOf(activity);
    if (index < activityOrder.length - 1) {
      const newOrder = [...activityOrder];
      [newOrder[index], newOrder[index + 1]] = [
        newOrder[index + 1],
        newOrder[index],
      ];
      setActivityOrder(newOrder);
    }
  };

  const activityDisplayNames: Record<ActivityType, string> = {
    sleep: "Sleep",
    feed: "Feed",
    diaper: "Diaper",
    note: "Note",
    bath: "Bath",
    pump: "Pump",
    measurement: "Measurement",
    milestone: "Milestone",
    medicine: "Medicine",
  };

  const renderActivityTile = (activity: ActivityType) => {
    if (!visibleActivities.has(activity)) return null;

    switch (activity) {
      case "sleep":
        return (
          <div
            key="sleep"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  type: "NAP",
                  id: "sleep-button",
                  babyId: selectedBaby.id,
                  startTime: sleepStartTime[selectedBaby.id]
                    ? sleepStartTime[selectedBaby.id].toISOString()
                    : new Date().toISOString(),
                  endTime: sleepingBabies.has(selectedBaby.id)
                    ? null
                    : new Date().toISOString(),
                  duration: sleepingBabies.has(selectedBaby.id) ? null : 0,
                  location: null,
                  quality: null,
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as SleepLogResponse
              }
              title={
                selectedBaby?.id && sleepingBabies.has(selectedBaby.id)
                  ? "End Sleep"
                  : "Dormir"
              }
              variant="sleep"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onSleepClick();
              }}
            />
            {selectedBaby?.id &&
              (sleepingBabies.has(selectedBaby.id) ? (
                <StatusBubble
                  status="sleeping"
                  className="overflow-visible z-40"
                  durationInMinutes={0}
                  startTime={sleepStartTime[selectedBaby.id]?.toISOString()}
                />
              ) : (
                !sleepStartTime[selectedBaby.id] &&
                lastSleepEndTime[selectedBaby.id] && (
                  <StatusBubble
                    status="awake"
                    className="overflow-visible z-40"
                    durationInMinutes={calculateDurationMinutes(
                      lastSleepEndTime[selectedBaby.id].toISOString(),
                      new Date().toISOString()
                    )}
                    startTime={lastSleepEndTime[selectedBaby.id].toISOString()}
                    activityType="sleep"
                  />
                )
              ))}
          </div>
        );
      case "feed":
        return (
          <div
            key="feed"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  type: "BOTTLE",
                  id: "feed-button",
                  babyId: selectedBaby.id,
                  time: new Date().toISOString(),
                  amount: null,
                  side: null,
                  food: null,
                  unitAbbr: null,
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as FeedLogResponse
              }
              title="Alimentar"
              variant="feed"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onFeedClick();
              }}
            />
            {selectedBaby?.id && lastFeedTime[selectedBaby.id] && (
              <StatusBubble
                status="feed"
                className="overflow-visible z-40"
                durationInMinutes={0}
                startTime={lastFeedTime[selectedBaby.id].toISOString()}
                warningTime={selectedBaby.feedWarningTime as string}
                activityType="feed"
              />
            )}
          </div>
        );
      case "diaper":
        return (
          <div
            key="diaper"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  type: "WET",
                  id: "diaper-button",
                  babyId: selectedBaby.id,
                  time: new Date().toISOString(),
                  condition: null,
                  color: null,
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as DiaperLogResponse
              }
              title="Fralda"
              variant="diaper"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onDiaperClick();
              }}
            />
            {selectedBaby?.id && lastDiaperTime[selectedBaby.id] && (
              <StatusBubble
                status="diaper"
                className="overflow-visible z-40"
                durationInMinutes={0}
                startTime={lastDiaperTime[selectedBaby.id].toISOString()}
                warningTime={selectedBaby.diaperWarningTime as string}
                activityType="diaper"
              />
            )}
          </div>
        );
      case "note":
        return (
          <div
            key="note"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  id: "note-button",
                  babyId: selectedBaby.id,
                  time: new Date().toISOString(),
                  content: "",
                  category: "Note",
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as NoteResponse
              }
              title="Observação"
              variant="note"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onNoteClick();
              }}
            />
          </div>
        );
      case "bath":
        return (
          <div
            key="bath"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  id: "bath-button",
                  babyId: selectedBaby.id,
                  time: new Date().toISOString(),
                  soapUsed: false,
                  shampooUsed: false,
                  waterTemperature: null,
                  duration: null,
                  notes: "",
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as BathLogResponse
              }
              title="Banho"
              variant="bath"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onBathClick();
              }}
            />
          </div>
        );
      case "pump":
        return (
          <div
            key="pump"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  id: "pump-button",
                  babyId: selectedBaby.id,
                  startTime: new Date().toISOString(),
                  endTime: null,
                  duration: null,
                  leftAmount: null,
                  rightAmount: null,
                  totalAmount: null,
                  unitAbbr: null,
                  notes: "",
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as PumpLogResponse
              }
              title="Bombear"
              variant="pump"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onPumpClick();
              }}
            />
          </div>
        );
      case "measurement":
        return (
          <div
            key="measurement"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  id: "measurement-button",
                  babyId: selectedBaby.id,
                  date: new Date().toISOString(),
                  type: "WEIGHT",
                  value: 0,
                  unit: "lb",
                  notes: "",
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as MeasurementResponse
              }
              title="Medição"
              variant="measurement"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onMeasurementClick();
              }}
            />
          </div>
        );
      case "milestone":
        return (
          <div
            key="milestone"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  id: "milestone-button",
                  babyId: selectedBaby.id,
                  date: new Date().toISOString(),
                  title: "New Milestone",
                  description: "",
                  category: "MOTOR",
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as MilestoneResponse
              }
              title="Marco"
              variant="milestone"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onMilestoneClick();
              }}
            />
          </div>
        );
      case "medicine":
        return (
          <div
            key="medicine"
            className="relative w-[82px] h-24 flex-shrink-0 snap-center"
          >
            <ActivityTile
              activity={
                {
                  id: "medicine-button",
                  babyId: selectedBaby.id,
                  time: new Date().toISOString(),
                  doseAmount: 0,
                  medicineId: "",
                  medicine: {
                    id: "",
                    name: "Medicine",
                    typicalDoseSize: 0,
                    unitAbbr: "",
                    doseMinTime: "00:30",
                    active: true,
                  },
                  unitAbbr: "",
                  notes: "",
                  caretakerId: null,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  deletedAt: null,
                } as unknown as MedicineLogResponse
              }
              title="Medicamento"
              variant="medicine"
              isButton={true}
              onClick={() => {
                updateUnlockTimer();
                onMedicineClick();
              }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="activity-tile-group">
      <div className="flex overflow-x-auto border-0 no-scrollbar snap-x snap-mandatory relative p-2 gap-1">
        {activityOrder.map((activity) => renderActivityTile(activity))}

        <div className="relative w-[82px] h-24 flex-shrink-0 snap-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full h-full bg-transparent border-0 cursor-pointer p-0 m-0">
                <ActivityTile
                  activity={
                    {
                      id: "configure-button",
                      babyId: selectedBaby.id,
                      time: new Date().toISOString(),
                      content: "",
                      category: "Configure",
                      caretakerId: null,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      deletedAt: null,
                    } as unknown as NoteResponse
                  }
                  title="Configuração"
                  variant="default"
                  isButton={true}
                  icon={
                    <img
                      src="/config-128.png"
                      alt="Configure"
                      width={67}
                      height={67}
                      className="object-contain"
                    />
                  }
                />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="max-h-[80vh] overflow-y-auto p-1"
              avoidCollisions={true}
              collisionPadding={10}
            >
              {activityOrder.map((activity, index) => (
                <div
                  key={`order-${activity}`}
                  className={`flex items-center px-2 py-2 hover:bg-gray-50 hover-background rounded-md my-1 ${
                    draggedActivity === activity
                      ? "opacity-50 bg-gray-100 draggable-background"
                      : ""
                  } ${
                    draggedActivity && draggedActivity !== activity
                      ? "hover:bg-emerald-50 hover-emerald"
                      : ""
                  } activity-dropdown-item`}
                  draggable="true"
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", activity);
                    setDraggedActivity(activity);

                    const element = e.currentTarget as HTMLElement;
                    setTimeout(() => {
                      if (element) {
                        element.classList.add(
                          "opacity-50",
                          "bg-gray-100",
                          "draggable-background"
                        );
                      }
                    }, 0);
                  }}
                  onDragEnd={(e) => {
                    setDraggedActivity(null);
                    setDraggedActivity(null);
                    document
                      .querySelectorAll('[draggable="true"]')
                      .forEach((el) => {
                        el.classList.remove(
                          "bg-emerald-50",
                          "draggable-highlight",
                          "opacity-50",
                          "bg-gray-100",
                          "draggable-background"
                        );
                      });
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = "move";
                    if (draggedActivity && draggedActivity !== activity) {
                      e.currentTarget.classList.add(
                        "bg-emerald-50",
                        "draggable-highlight"
                      );
                    }
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "bg-emerald-50",
                      "draggable-highlight"
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.currentTarget.classList.remove(
                      "bg-emerald-50",
                      "draggable-highlight"
                    );

                    const droppedActivity = e.dataTransfer.getData(
                      "text/plain"
                    ) as ActivityType;

                    if (droppedActivity && droppedActivity !== activity) {
                      const newOrder = [...activityOrder];
                      const draggedIndex = newOrder.indexOf(droppedActivity);
                      const targetIndex = newOrder.indexOf(activity);

                      newOrder.splice(draggedIndex, 1);
                      newOrder.splice(targetIndex, 0, droppedActivity);

                      setActivityOrder(newOrder);
                    }
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    const targetElement = e.currentTarget as HTMLElement;
                    targetElement.setAttribute(
                      "data-touch-start-x",
                      touch.clientX.toString()
                    );
                    targetElement.setAttribute(
                      "data-touch-start-y",
                      touch.clientY.toString()
                    );

                    if (touchTimeoutRef.current) {
                      clearTimeout(touchTimeoutRef.current);
                    }

                    touchTimeoutRef.current = setTimeout(() => {
                      setDraggedActivity(activity);
                      touchTimeoutRef.current = null;
                    }, 150);
                  }}
                  onTouchMove={(e) => {
                    if (!draggedActivity) return;

                    const touch = e.touches[0];
                    const elementsAtTouch = document.elementsFromPoint(
                      touch.clientX,
                      touch.clientY
                    );

                    const touchedElement = elementsAtTouch.find(
                      (el) =>
                        el.getAttribute("draggable") === "true" &&
                        el.getAttribute("data-key") &&
                        el.getAttribute("data-key") !==
                          `order-${draggedActivity}`
                    ) as HTMLElement | undefined;

                    document
                      .querySelectorAll('[draggable="true"]')
                      .forEach((el) => {
                        if (el !== e.currentTarget) {
                          el.classList.remove(
                            "bg-emerald-50",
                            "draggable-highlight"
                          );
                        }
                      });

                    if (touchedElement) {
                      touchedElement.classList.add(
                        "bg-emerald-50",
                        "draggable-highlight"
                      );
                    }
                  }}
                  onTouchEnd={(e) => {
                    if (touchTimeoutRef.current) {
                      clearTimeout(touchTimeoutRef.current);
                      touchTimeoutRef.current = null;
                    }

                    if (!draggedActivity || draggedActivity !== activity) {
                      document
                        .querySelectorAll('[draggable="true"]')
                        .forEach((el) => {
                          el.classList.remove(
                            "bg-emerald-50",
                            "draggable-highlight",
                            "opacity-50",
                            "bg-gray-100",
                            "draggable-background"
                          );
                        });
                      if (draggedActivity === activity)
                        setDraggedActivity(null);
                      return;
                    }

                    const touch = e.changedTouches[0];
                    const elementsAtTouch = document.elementsFromPoint(
                      touch.clientX,
                      touch.clientY
                    );

                    const touchedElement = elementsAtTouch.find(
                      (el) =>
                        el.getAttribute("draggable") === "true" &&
                        el.getAttribute("data-key") &&
                        el.getAttribute("data-key") !==
                          `order-${draggedActivity}`
                    ) as HTMLElement | undefined;

                    if (touchedElement) {
                      const key = touchedElement.getAttribute("data-key");
                      if (key && key.startsWith("order-")) {
                        const touchedActivity = key.replace(
                          "order-",
                          ""
                        ) as ActivityType;

                        if (touchedActivity !== draggedActivity) {
                          const newOrder = [...activityOrder];
                          const draggedIndex =
                            newOrder.indexOf(draggedActivity);
                          const targetIndex = newOrder.indexOf(touchedActivity);

                          newOrder.splice(draggedIndex, 1);
                          newOrder.splice(targetIndex, 0, draggedActivity);

                          setActivityOrder(newOrder);
                        }
                      }
                    }

                    document
                      .querySelectorAll('[draggable="true"]')
                      .forEach((el) => {
                        el.classList.remove(
                          "bg-emerald-50",
                          "draggable-highlight",
                          "opacity-50",
                          "bg-gray-100",
                          "draggable-background"
                        );
                      });

                    setDraggedActivity(null);
                  }}
                  onTouchCancel={(e) => {
                    if (touchTimeoutRef.current) {
                      clearTimeout(touchTimeoutRef.current);
                      touchTimeoutRef.current = null;
                    }

                    document
                      .querySelectorAll('[draggable="true"]')
                      .forEach((el) => {
                        el.classList.remove(
                          "bg-emerald-50",
                          "draggable-highlight",
                          "opacity-50",
                          "bg-gray-100",
                          "draggable-background"
                        );
                      });

                    setDraggedActivity(null);
                  }}
                  data-key={`order-${activity}`}
                >
                  <button
                    className="p-1 rounded-full hover:bg-gray-100 hover-background cursor-grab active:cursor-grabbing mr-2 activity-dropdown-item-drag-button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                    }}
                    aria-label={`Drag to reorder ${activityDisplayNames[activity]}`}
                    title="Drag to reorder"
                  >
                    <ArrowDownUp className="h-4 w-4 text-gray-500 icon-text" />
                  </button>
                  <DropdownMenuCheckboxItem
                    checked={visibleActivities.has(activity)}
                    onCheckedChange={() => toggleActivity(activity)}
                    className="flex-grow"
                  >
                    {activityDisplayNames[activity]}
                  </DropdownMenuCheckboxItem>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
