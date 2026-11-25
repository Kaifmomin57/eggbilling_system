"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  className?: string;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  label,
  unit,
  className,
}: StepperProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value.toString());

  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      onChange(clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex items-center rounded-2xl border-2 border-brand-ocean/30 bg-card p-1 shadow-xs hover:border-brand-teal/50 transition-colors">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          aria-label="Decrease"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-ice/40 text-brand-dark transition-all hover:bg-brand-ice active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Minus className="h-5 w-5 stroke-[2.5]" />
        </button>

        <div className="flex-1 text-center">
          {isEditing ? (
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={handleInputBlur}
              onKeyDown={(e) => e.key === "Enter" && handleInputBlur()}
              autoFocus
              className="w-full text-center text-xl font-bold text-brand-dark bg-transparent outline-none tabular-nums"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="w-full py-1 text-center font-bold text-brand-dark hover:text-brand-teal transition-colors"
            >
              <span className="text-xl tabular-nums">{value}</span>
              {unit && (
                <span className="ml-1 text-xs font-semibold text-brand-muted">
                  {unit}
                </span>
              )}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          aria-label="Increase"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-ice/40 text-brand-dark transition-all hover:bg-brand-ice active:scale-90 disabled:opacity-30 disabled:pointer-events-none"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
