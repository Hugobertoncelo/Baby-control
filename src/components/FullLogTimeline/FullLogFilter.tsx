import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import {
  Moon,
  Icon,
  Edit,
  Bath,
  ChevronDown,
  Calendar as CalendarIcon,
  LampWallDown,
  Trophy,
  Ruler,
  PillBottle,
} from "lucide-react";
import { diaper, bottleBaby } from "@lucide/lab";
import { FilterType, FullLogFilterProps } from "./full-log-timeline.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/src/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Calendar } from "@/src/components/ui/calendar";

const FullLogFilter: React.FC<FullLogFilterProps> = ({
  activeFilter,
  onFilterChange,
  startDate,
  endDate,
  onDateRangeChange,
  onQuickFilter,
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);

  const filterOptions = [
    { type: "sleep", icon: <Moon className="h-4 w-4" />, label: "Dormir" },
    {
      type: "feed",
      icon: <Icon iconNode={bottleBaby} className="h-4 w-4" />,
      label: "Alimentar",
    },
    {
      type: "diaper",
      icon: <Icon iconNode={diaper} className="h-4 w-4" />,
      label: "Fralda",
    },
    { type: "bath", icon: <Bath className="h-4 w-4" />, label: "Banho" },
    { type: "note", icon: <Edit className="h-4 w-4" />, label: "Observação" },
    {
      type: "pump",
      icon: <LampWallDown className="h-4 w-4" />,
      label: "Bomba",
    },
    {
      type: "milestone",
      icon: <Trophy className="h-4 w-4" />,
      label: "Marco",
    },
    {
      type: "measurement",
      icon: <Ruler className="h-4 w-4" />,
      label: "Medição",
    },
    {
      type: "medicine",
      icon: <PillBottle className="h-4 w-4" />,
      label: "Medicamento",
    },
  ] as const;

  const formatDateRange = () => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("pt-BR", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="flex flex-wrap justify-between py-3 items-center text-sm font-medium">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:mb-0">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-sm font-medium text-white hover:bg-transparent hover:text-white/90"
            >
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-auto" align="start">
            <Calendar
              mode="range"
              rangeFrom={startDate}
              rangeTo={endDate}
              onRangeChange={(from, to) => {
                const newStartDate = from ? new Date(from) : null;
                if (newStartDate) newStartDate.setHours(0, 0, 0, 0);

                const newEndDate = to ? new Date(to) : null;
                if (newEndDate) newEndDate.setHours(23, 59, 59, 999);

                if (newStartDate && !newEndDate) {
                  onDateRangeChange(newStartDate, newStartDate);
                } else if (newStartDate && newEndDate) {
                  onDateRangeChange(newStartDate, newEndDate);

                  setTimeout(() => {
                    setCalendarOpen(false);
                  }, 500);
                } else if (!newStartDate && !newEndDate) {
                  onDateRangeChange(startDate, endDate);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuickFilter(2)}
            className="h-7 px-2 text-white hover:bg-transparent hover:text-white/90"
          >
            2 Dias
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuickFilter(7)}
            className="h-7 px-2 text-white hover:bg-transparent hover:text-white/90"
          >
            7 Dias
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuickFilter(30)}
            className="h-7 px-2 text-white hover:bg-transparent hover:text-white/90"
          >
            30 Dias
          </Button>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 h-7 text-sm font-medium text-white hover:bg-transparent hover:text-white/90 p-0"
          >
            Filtros <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {filterOptions.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.type}
              checked={activeFilter === option.type}
              onCheckedChange={() =>
                onFilterChange(
                  activeFilter === option.type
                    ? null
                    : (option.type as FilterType)
                )
              }
              className="flex items-center gap-2"
            >
              <span className="flex items-center justify-center w-6">
                {option.icon}
              </span>
              <span>{option.label}</span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default FullLogFilter;
