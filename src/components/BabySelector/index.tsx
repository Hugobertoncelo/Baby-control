"use client";

import React from "react";
import { Moon, ChevronDown } from "lucide-react";
import { BabySelectorProps } from "./baby-selector.types";
import {
  babySelectorContainer,
  babySelectorContent,
  babySelectorNameContainer,
  babySelectorName,
  babySelectorAge,
  babySelectorDropdownButton,
  babySelectorDropdownItem,
} from "./baby-selector.styles";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

export const BabySelector: React.FC<BabySelectorProps> = ({
  selectedBaby,
  onBabySelect,
  babies,
  sleepingBabies,
  calculateAge,
  onOpenQuickStats,
}) => {
  return (
    <div className={babySelectorContainer(selectedBaby?.gender)}>
      <div className={babySelectorContent()} onClick={onOpenQuickStats}>
        <div className={babySelectorNameContainer()}>
          <span className={babySelectorName()}>
            {selectedBaby ? selectedBaby.firstName : "Selecione bebê"}
          </span>
          {selectedBaby && sleepingBabies.has(selectedBaby.id) && (
            <Moon className="h-3 w-3" />
          )}
        </div>
        {selectedBaby && (
          <span className={babySelectorAge()}>
            {calculateAge(selectedBaby.birthDate)}
          </span>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={babySelectorDropdownButton()}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup
            value={selectedBaby?.id || ""}
            onValueChange={(id) => {
              if (id) {
                const baby = babies.find((b) => b.id === id);
                if (baby) {
                  onBabySelect(baby);
                }
              }
            }}
          >
            {babies.map((baby) => (
              <DropdownMenuRadioItem
                key={baby.id}
                value={baby.id}
                className={babySelectorDropdownItem(baby.gender)}
              >
                <div className="flex flex-col">
                  <span>
                    {baby.firstName}
                    {baby.inactive ? " (Inactive)" : ""}
                  </span>
                  <span className="text-xs opacity-80">
                    {calculateAge(baby.birthDate)}
                  </span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BabySelector;
