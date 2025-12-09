import React from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Plus, Minus } from "lucide-react";

interface BottleFeedFormProps {
  amount: string;
  unit: string;
  loading: boolean;
  onAmountChange: (amount: string) => void;
  onUnitChange: (unit: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

export default function BottleFeedForm({
  amount,
  unit,
  loading,
  onAmountChange,
  onUnitChange,
  onIncrement,
  onDecrement,
}: BottleFeedFormProps) {
  return (
    <div>
      <label className="form-label mb-6">
        Quantia ({unit === "ML" ? "ml" : "L"})
      </label>
      <div className="flex items-center justify-center mb-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onDecrement}
          disabled={loading}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 border-0 rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <Minus className="h-5 w-5 text-white" />
        </Button>
        <Input
          type="text"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="w-24 mx-3 text-center"
          placeholder="Quantia"
          inputMode="decimal"
          disabled={loading}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onIncrement}
          disabled={loading}
          className="bg-gradient-to-r from-teal-600 to-emerald-600 border-0 rounded-full h-14 w-14 flex items-center justify-center shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <Plus className="h-5 w-5 text-white" />
        </Button>
      </div>
      <div className="mt-2 flex space-x-2">
        <Button
          type="button"
          variant={unit === "L" ? "default" : "outline"}
          className="w-full"
          onClick={() => onUnitChange("L")}
          disabled={loading}
        >
          L
        </Button>
        <Button
          type="button"
          variant={unit === "ML" ? "default" : "outline"}
          className="w-full"
          onClick={() => onUnitChange("ML")}
          disabled={loading}
        >
          ml
        </Button>
      </div>
    </div>
  );
}
