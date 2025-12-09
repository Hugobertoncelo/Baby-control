import React from "react";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { Calendar as CalendarComponent } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import { styles } from "./setup-wizard.styles";
import { BabySetupStageProps } from "./setup-wizard.types";
import { Gender } from "@prisma/client";

const BabySetupStage: React.FC<BabySetupStageProps> = ({
  babyFirstName,
  setBabyFirstName,
  babyLastName,
  setBabyLastName,
  babyBirthDate,
  setBabyBirthDate,
  babyGender,
  setBabyGender,
  feedWarningTime,
  setFeedWarningTime,
  diaperWarningTime,
  setDiaperWarningTime,
}) => {
  return (
    <div className={cn(styles.stageContainer, "setup-wizard-stage-container")}>
      <h2 className={cn(styles.stageTitle, "setup-wizard-stage-title")}>
        Adicione seu Bebê
      </h2>
      <p
        className={cn(
          styles.stageDescription,
          "setup-wizard-stage-description"
        )}
      >
        Agora vamos adicionar informações sobre o seu pequeno.
      </p>

      <div className={cn(styles.babyFormGrid, "setup-wizard-baby-form-grid")}>
        <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
          <label
            className={cn(styles.formLabel, "setup-wizard-form-label")}
            htmlFor="babyFirstName"
          >
            Primeiro nome
          </label>
          <Input
            id="babyFirstName"
            value={babyFirstName}
            onChange={(e) => setBabyFirstName(e.target.value)}
            placeholder="First name"
            className={cn(styles.formInput, "setup-wizard-form-input")}
          />
        </div>
        <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
          <label
            className={cn(styles.formLabel, "setup-wizard-form-label")}
            htmlFor="babyLastName"
          >
            Sobrenome
          </label>
          <Input
            id="babyLastName"
            value={babyLastName}
            onChange={(e) => setBabyLastName(e.target.value)}
            placeholder="Sobrenome"
            className={cn(styles.formInput, "setup-wizard-form-input")}
          />
        </div>
      </div>

      <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
        <label
          className={cn(styles.formLabel, "setup-wizard-form-label")}
          htmlFor="babyBirthDate"
        >
          Data de nascimento
        </label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="babyBirthDate"
              variant="input"
              className={cn(
                styles.datePickerButton,
                "setup-wizard-date-picker-button",
                !babyBirthDate && styles.datePickerPlaceholder,
                !babyBirthDate && "setup-wizard-date-picker-placeholder"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {babyBirthDate
                ? format(babyBirthDate, "PPP")
                : "Selecione a data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={babyBirthDate}
              onSelect={setBabyBirthDate}
              maxDate={new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
        <label
          className={cn(styles.formLabel, "setup-wizard-form-label")}
          htmlFor="babyGender"
        >
          Gênero
        </label>
        <Select
          value={babyGender}
          onValueChange={(value) => setBabyGender(value as Gender)}
        >
          <SelectTrigger
            id="babyGender"
            className={cn(styles.formSelect, "setup-wizard-form-select")}
          >
            <SelectValue placeholder="Selecione o sexo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MALE">Masculino</SelectItem>
            <SelectItem value="FEMALE">Feminino</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className={cn(styles.formGroup, "setup-wizard-form-group", "mt-4")}>
        <p
          className={cn(
            styles.formHelperText,
            "setup-wizard-form-helper-text",
            "text-sm",
            "mb-2"
          )}
        >
          Defina os limites de tempo em que as bolhas do contador mudarão de
          verde para vermelho, indicando quando uma nova alimentação ou troca de
          fralda pode ser necessária.
        </p>

        <div className={cn(styles.babyFormGrid, "setup-wizard-baby-form-grid")}>
          <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
            <label
              className={cn(styles.formLabel, "setup-wizard-form-label")}
              htmlFor="feedWarningTime"
            >
              Tempo de aviso de feed
            </label>
            <Input
              id="feedWarningTime"
              type="text"
              pattern="[0-9]{2}:[0-9]{2}"
              value={feedWarningTime}
              onChange={(e) => setFeedWarningTime(e.target.value)}
              placeholder="02:00"
              className={cn(styles.formInput, "setup-wizard-form-input")}
            />
            <p
              className={cn(
                styles.formHelperText,
                "setup-wizard-form-helper-text"
              )}
            >
              Formato: hh:mm
            </p>
          </div>
          <div className={cn(styles.formGroup, "setup-wizard-form-group")}>
            <label
              className={cn(styles.formLabel, "setup-wizard-form-label")}
              htmlFor="diaperWarningTime"
            >
              Tempo de aviso de fralda
            </label>
            <Input
              id="diaperWarningTime"
              type="text"
              pattern="[0-9]{2}:[0-9]{2}"
              value={diaperWarningTime}
              onChange={(e) => setDiaperWarningTime(e.target.value)}
              placeholder="03:00"
              className={cn(styles.formInput, "setup-wizard-form-input")}
            />
            <p
              className={cn(
                styles.formHelperText,
                "setup-wizard-form-helper-text"
              )}
            >
              Formato: hh:mm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BabySetupStage;
