"use client";

import { cn } from "@/lib/utils";

type RangeSliderProps = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  formatValue: (value: number) => string;
  minLabel: string;
  maxLabel: string;
};

export function RangeSlider({
  id,
  label,
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
  formatValue,
  minLabel,
  maxLabel,
}: RangeSliderProps) {
  const span = max - min || 1;
  const left = ((valueMin - min) / span) * 100;
  const right = ((valueMax - min) / span) * 100;

  function updateMin(next: number) {
    onChange(Math.min(next, valueMax), valueMax);
  }

  function updateMax(next: number) {
    onChange(valueMin, Math.max(next, valueMin));
  }

  return (
    <div className="space-y-3" role="group" aria-labelledby={`${id}-label`}>
      <div className="flex items-end justify-between gap-3">
        <p
          id={`${id}-label`}
          className="text-xs font-semibold uppercase tracking-wide text-pisome-muted"
        >
          {label}
        </p>
        <p className="text-sm font-medium tabular-nums text-pisome-navy">
          {formatValue(valueMin)} – {formatValue(valueMax)}
        </p>
      </div>

      <div className="relative h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-pisome-alice" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-pisome-blue"
          style={{ left: `${left}%`, right: `${100 - right}%` }}
        />
        <input
          type="range"
          id={`${id}-min`}
          min={min}
          max={max}
          step={step}
          value={valueMin}
          aria-label={minLabel}
          aria-valuemin={min}
          aria-valuemax={valueMax}
          aria-valuenow={valueMin}
          aria-valuetext={formatValue(valueMin)}
          onChange={(e) => updateMin(Number(e.target.value))}
          className={cn(
            "pisome-range absolute inset-0 z-[1] m-0 h-8 w-full appearance-none bg-transparent",
            valueMin > max - (max - min) * 0.5 && "z-[3]",
          )}
        />
        <input
          type="range"
          id={`${id}-max`}
          min={min}
          max={max}
          step={step}
          value={valueMax}
          aria-label={maxLabel}
          aria-valuemin={valueMin}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={formatValue(valueMax)}
          onChange={(e) => updateMax(Number(e.target.value))}
          className="pisome-range absolute inset-0 z-[2] m-0 h-8 w-full appearance-none bg-transparent"
        />
      </div>
    </div>
  );
}
