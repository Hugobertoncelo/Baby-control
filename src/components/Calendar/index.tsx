import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  ChevronUp,
  ChevronDown,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Calendar as UICalendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn } from "@/src/lib/utils";
import CalendarDayView from "@/src/components/CalendarDayView";
import { CalendarProps, CalendarState } from "./calendar.types";
import "./calendar.css";

export function Calendar({
  selectedBabyId,
  userTimezone,
  onDateSelect,
}: CalendarProps) {
  const [state, setState] = useState<CalendarState>({
    currentDate: new Date(),
    selectedDate: null,
    calendarDays: [],
    events: [],
  });
  const [eventScrollState, setEventScrollState] = useState<{
    [key: string]: number;
  }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { currentDate, selectedDate, calendarDays, events } = state;

  const updateState = (updates: Partial<CalendarState>) => {
    setState((prevState) => ({ ...prevState, ...updates }));
  };

  const getDaysInMonth = (
    year: number,
    month: number
  ): { days: Date[]; rowCount: number } => {
    const date = new Date(year, month, 1);
    const days: Date[] = [];

    const firstDayOfMonth = date.getDay();

    const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, lastDayOfPrevMonth - i));
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const lastDayOfMonth = new Date(year, month, daysInMonth).getDay();
    const daysToAdd = 6 - lastDayOfMonth;
    for (let i = 1; i <= daysToAdd; i++) {
      days.push(new Date(year, month + 1, i));
    }

    const rowCount = Math.ceil(days.length / 7);

    return { days, rowCount };
  };

  const [calendarRowCount, setCalendarRowCount] = useState(6);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const { days, rowCount } = getDaysInMonth(year, month);
    updateState({ calendarDays: days });
    setCalendarRowCount(rowCount);
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log(
        `Fetching events for date range: ${startDate.toISOString()} to ${endDate.toISOString()}`
      );
      console.log(`Selected baby ID: ${selectedBabyId}`);

      const queryParams = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedBabyId) {
        queryParams.append("babyId", selectedBabyId);
      }

      const authToken = localStorage.getItem("authToken");
      const eventsResponse = await fetch(
        `/api/calendar-event?${queryParams.toString()}`,
        {
          headers: authToken
            ? {
                Authorization: `Bearer ${authToken}`,
              }
            : {},
        }
      );
      const eventsData = await eventsResponse.json();

      console.log(
        "API Response:",
        eventsResponse.status,
        eventsResponse.statusText
      );
      console.log("Fetched events data:", eventsData);

      if (eventsData.success && eventsData.data && eventsData.data.length > 0) {
        console.log(`Found ${eventsData.data.length} events for the month`);
        eventsData.data.forEach((event: any, index: number) => {
          console.log(`Event ${index + 1}:`, {
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            date: new Date(event.startTime).toLocaleString(),
            day: new Date(event.startTime).getDate(),
            month: new Date(event.startTime).getMonth(),
            year: new Date(event.startTime).getFullYear(),
          });
        });
      } else {
      }

      updateState({
        events: eventsData.success ? eventsData.data : [],
      });
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchEventsRef = React.useRef(fetchEvents);

  React.useEffect(() => {
    fetchEventsRef.current = fetchEvents;
  }, [fetchEvents]);

  useEffect(() => {
    fetchEvents();
  }, [currentDate, userTimezone, selectedBabyId]);

  const goToPreviousMonth = () => {
    updateState({
      currentDate: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      ),
    });
  };

  const goToNextMonth = () => {
    updateState({
      currentDate: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      ),
    });
  };

  const goToCurrentMonth = () => {
    updateState({
      currentDate: new Date(),
    });
  };

  const handleDatePickerSelect = (date: Date) => {
    updateState({
      currentDate: new Date(date.getFullYear(), date.getMonth(), 1),
    });
    setShowDatePicker(false);
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date): boolean => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isSameUTCDay = (
    eventDateStr: string | Date,
    localDate: Date
  ): boolean => {
    try {
      if (!(localDate instanceof Date) || isNaN(localDate.getTime())) {
        console.error("Invalid localDate provided to isSameUTCDay:", localDate);
        return false;
      }

      const eventDate = new Date(eventDateStr);
      if (isNaN(eventDate.getTime())) {
        console.warn(`Invalid date string in isSameUTCDay: ${eventDateStr}`);
        return false;
      }

      const result =
        eventDate.getFullYear() === localDate.getFullYear() &&
        eventDate.getMonth() === localDate.getMonth() &&
        eventDate.getDate() === localDate.getDate();

      return result;
    } catch (error) {
      console.error("Error in isSameUTCDay:", error, {
        eventDateStr,
        localDate,
      });
      return false;
    }
  };

  const getEventsForDay = (date: Date): any[] => {
    if (!events || events.length === 0) {
      return [];
    }

    if (!events || events.length === 0) {
      return [];
    }

    return events.filter((event: any) => {
      if (!event.startTime) {
        console.warn(`Event missing startTime: ${event.id}`);
        return false;
      }
      return isSameUTCDay(event.startTime, date);
    });
  };

  const handleDayClick = (date: Date) => {
    updateState({ selectedDate: date });

    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  const handleEventScroll = (
    e: React.MouseEvent,
    date: Date,
    direction: "up" | "down"
  ) => {
    e.stopPropagation();
    const dateKey = date.toISOString().split("T")[0];
    const dayEvents = getEventsForDay(date);
    const maxVisible = 3;
    const currentOffset = eventScrollState[dateKey] || 0;

    let newOffset = currentOffset;
    if (direction === "up" && currentOffset > 0) {
      newOffset = currentOffset - 1;
    } else if (
      direction === "down" &&
      currentOffset < dayEvents.length - maxVisible
    ) {
      newOffset = currentOffset + 1;
    }

    setEventScrollState((prevState) => ({
      ...prevState,
      [dateKey]: newOffset,
    }));
  };

  const handleAddEvent = (date: Date) => {
    updateState({
      selectedDate: date,
    });

    fetchEventsRef.current();
  };

  const getDayClass = (date: Date): string => {
    const baseClass =
      "flex flex-col h-full min-h-[120px] p-1 border border-gray-200 cursor-pointer main-calendar-day";
    let className = baseClass;

    if (isToday(date)) {
      className = cn(
        className,
        "bg-teal-50 border-teal-300 main-calendar-day-today"
      );
    } else if (!isCurrentMonth(date)) {
      className = cn(
        className,
        "bg-gray-50 text-gray-400 main-calendar-day-other-month"
      );
    } else {
      className = cn(className, "main-calendar-day-current-month");
    }

    if (
      selectedDate &&
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    ) {
      className = cn(
        className,
        "ring-2 ring-teal-500 ring-inset main-calendar-day-selected"
      );
    }

    return className;
  };

  const renderDayEvents = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    if (dayEvents.length === 0) return null;

    const dateKey = date.toISOString().split("T")[0];
    const scrollOffset = eventScrollState[dateKey] || 0;
    const maxVisibleEvents = 3;

    const visibleEvents = dayEvents.slice(
      scrollOffset,
      scrollOffset + maxVisibleEvents
    );

    const showUpArrow = scrollOffset > 0;
    const showDownArrow = scrollOffset + maxVisibleEvents < dayEvents.length;

    return (
      <div className="flex flex-col flex-grow overflow-hidden relative mt-1">
        {showUpArrow && (
          <div className="text-center h-4">
            <ChevronUp
              className="h-4 w-4 mx-auto text-gray-400 cursor-pointer"
              onClick={(e) => handleEventScroll(e, date, "up")}
            />
          </div>
        )}
        <div className="flex-grow space-y-1 my-1">
          {visibleEvents.map((event) => {
            const eventStyle: React.CSSProperties = {};
            let textColorClass = "text-white";
            let bgColorClass = "";

            if (event.color) {
              eventStyle.backgroundColor = event.color;
            } else {
              switch (event.type) {
                case "APPOINTMENT":
                  bgColorClass = "bg-blue-500";
                  break;
                case "CARETAKER_SCHEDULE":
                  bgColorClass = "bg-green-500";
                  break;
                case "REMINDER":
                  bgColorClass = "bg-yellow-500";
                  textColorClass = "text-black";
                  break;
                case "CUSTOM":
                  bgColorClass = "bg-purple-500";
                  break;
                default:
                  bgColorClass = "bg-gray-500";
              }
            }

            return (
              <div
                key={event.id}
                className={`w-full text-xs rounded-sm px-1 truncate ${bgColorClass} ${textColorClass}`}
                style={eventStyle}
                title={event.title}
              >
                {event.title}
              </div>
            );
          })}
        </div>
        {showDownArrow && (
          <div className="text-center h-4">
            <ChevronDown
              className="h-4 w-4 mx-auto text-gray-400 cursor-pointer"
              onClick={(e) => handleEventScroll(e, date, "down")}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full main-calendar-container">
      <div className="flex items-center justify-between p-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white border-t border-gray-200 main-calendar-header">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPreviousMonth}
          className="text-white hover:bg-teal-500/20"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex flex-col items-center">
          <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
            <PopoverTrigger asChild>
              <button className="date-picker-trigger flex items-center gap-2 text-lg font-semibold hover:bg-teal-500/20 px-3 py-1 rounded transition-colors">
                <CalendarIcon className="h-4 w-4" />
                {formatMonthYear(currentDate)}
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 date-picker-popover"
              align="center"
              sideOffset={4}
            >
              <UICalendar
                mode="single"
                selected={currentDate}
                onSelect={handleDatePickerSelect}
                variant="date-time-picker"
                className="mx-auto"
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToCurrentMonth}
            className="text-xs text-white/80 hover:text-white hover:bg-teal-500/20 py-0 h-6"
          >
            Hoje
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextMonth}
          className="text-white hover:bg-teal-500/20"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden bg-white main-calendar-content">
        <Card className="flex-1 overflow-hidden border-0 rounded-t-none main-calendar-grid flex md:flex-col">
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 text-center bg-gray-100 border-b border-gray-200 main-calendar-weekdays">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                (day, index) => (
                  <div
                    key={index}
                    className="py-2 text-xs font-medium text-gray-500 main-calendar-weekday"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            <div
              className="grid grid-cols-7 h-[calc(100%-32px)] main-calendar-days"
              style={
                {
                  "--calendar-row-count": calendarRowCount,
                } as React.CSSProperties
              }
            >
              {calendarDays.map((date, index) => (
                <div
                  key={index}
                  className={`${getDayClass(date)} cursor-pointer`}
                  onClick={() => handleDayClick(date)}
                >
                  <span
                    className={`text-xs ${
                      isToday(date)
                        ? "font-bold text-teal-700 main-calendar-today-text"
                        : ""
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {renderDayEvents(date)}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <CalendarDayView
          date={selectedDate || new Date()}
          events={selectedDate ? getEventsForDay(selectedDate) : []}
          onAddEvent={handleAddEvent}
          className="calendar-day-view-slide-in"
          onClose={() => updateState({ selectedDate: null })}
          isOpen={selectedDate !== null}
        />
      </div>

      {!selectedDate && (
        <div className="md:hidden fixed bottom-4 right-4">
          <Button
            onClick={() => handleAddEvent(new Date())}
            className="rounded-full w-12 h-12 shadow-lg"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
