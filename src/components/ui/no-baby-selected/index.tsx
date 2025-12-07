import React from "react";
import { Baby } from "lucide-react";
import { Label } from "@/src/components/ui/label";
import { useTheme } from "@/src/context/theme";
import { cn } from "@/src/lib/utils";
import { noBabySelectedStyles } from "./no-baby-selected.styles";
import { NoBabySelectedProps } from "./no-baby-selected.types";
import "./no-baby-selected.css";

export const NoBabySelected: React.FC<NoBabySelectedProps> = ({
  title = "Nenhum bebê selecionado",
  description = "Por favor, selecione um bebê no menu suspenso acima..",
  className,
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={cn(
        noBabySelectedStyles.container,
        className,
        "no-baby-selected-container"
      )}
    >
      <div
        className={cn(
          noBabySelectedStyles.iconContainer,
          "no-baby-selected-icon-container"
        )}
      >
        <Baby
          className={cn(noBabySelectedStyles.icon, "no-baby-selected-icon")}
        />
      </div>

      <div className={noBabySelectedStyles.textContainer}>
        <Label
          className={cn(noBabySelectedStyles.title, "no-baby-selected-title")}
        >
          {title}
        </Label>
        <Label
          className={cn(
            noBabySelectedStyles.description,
            "no-baby-selected-description"
          )}
        >
          {description}
        </Label>
      </div>
    </div>
  );
};

export default NoBabySelected;
