"use client";

import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

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

function parseTypedValue(raw: string): number | null {
  const cleaned = raw.replace(/[^\d.,]/g).trim();
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  let normalized = cleaned;
  if (lastComma >= 0 && lastDot >= 0) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (lastComma >= 0) {
    const parts = cleaned.split(",");
    normalized =
      parts.length === 2 && parts[1]!.length <= 2
        ? `${parts[0]}.${parts[1]}`
        : cleaned.replace(/,/g, "");
  } else if (lastDot >= 0) {
    const parts = cleaned.split(".");
    normalized =
      parts.length === 2 && parts[1]!.length <= 2
        ? cleaned
        : cleaned.replace(/\./g, "");
  }

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function EditableValue({
  id,
  value,
  formatted,
  align,
  ariaLabel,
  onCommit,
}: {
  id: string;
  value: number;
  formatted: string;
  align: "left" | "right";
  ariaLabel: string;
  onCommit: (next: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(String(value));
  }, [value, editing]);

  useEffect(() => {
    if (!editing) return;
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, [editing]);

  function commit() {
    const parsed = parseTypedValue(draft);
    setEditing(false);
    if (parsed == null) {
      setDraft(String(value));
      return;
    }
    onCommit(parsed);
  }

  function cancel() {
    setDraft(String(value));
    setEditing(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={onKeyDown}
        className={cn(
          "w-[7.5rem] rounded-md border border-pisome-blue bg-white px-2 py-0.5 text-sm font-medium tabular-nums text-pisome-navy outline-none ring-2 ring-pisome-blue/25",
          align === "right" && "ml-auto text-right",
          align === "left" && "text-left",
        )}
      />
    );
  }

  return (
    <button
      type="button"
      id={id}
      aria-label={ariaLabel}
      title={ariaLabel}
      onDoubleClick={() => {
        setDraft(String(value));
        setEditing(true);
      }}
      className={cn(
        "rounded-md px-1 py-0.5 text-sm font-medium tabular-nums text-pisome-navy transition hover:bg-pisome-alice",
        align === "left" ? "text-left" : "ml-auto text-right",
      )}
    >
      {formatted}
    </button>
  );
}

const THUMB_HIT_PX = 18;

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
  const trackRef = useRef<HTMLDivElement>(null);
  const activeHandle = useRef<"min" | "max" | null>(null);
  const valuesRef = useRef({ valueMin, valueMax });
  valuesRef.current = { valueMin, valueMax };

  const span = max - min || 1;
  const left = ((valueMin - min) / span) * 100;
  const right = ((valueMax - min) / span) * 100;

  function snap(raw: number) {
    const snapped = Math.round(raw / step) * step;
    return Math.min(max, Math.max(min, snapped));
  }

  function valueFromClientX(clientX: number) {
    const track = trackRef.current;
    if (!track) return min;
    const rect = track.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return snap(min + pct * span);
  }

  /** Prefer the nearest thumb when within hit radius; otherwise left/right half. */
  function pickHandle(clientX: number): "min" | "max" {
    const track = trackRef.current;
    if (!track) return "min";
    const rect = track.getBoundingClientRect();
    const { valueMin: vmin, valueMax: vmax } = valuesRef.current;
    const x = clientX - rect.left;
    const minX = ((vmin - min) / span) * rect.width;
    const maxX = ((vmax - min) / span) * rect.width;
    const distMin = Math.abs(x - minX);
    const distMax = Math.abs(x - maxX);

    if (distMin <= THUMB_HIT_PX || distMax <= THUMB_HIT_PX) {
      return distMin <= distMax ? "min" : "max";
    }

    const pct = x / rect.width;
    return pct <= 0.5 ? "min" : "max";
  }

  const applyHandle = useCallback(
    (handle: "min" | "max", clientX: number) => {
      const next = valueFromClientX(clientX);
      const { valueMin: vmin, valueMax: vmax } = valuesRef.current;
      if (handle === "min") onChange(Math.min(next, vmax), vmax);
      else onChange(vmin, Math.max(next, vmin));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange, min, max, step, span],
  );

  function onTrackPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const track = trackRef.current;
    if (!track) return;
    // Once a handle is chosen, keep it for the whole drag (ignore half flips).
    const handle = pickHandle(e.clientX);
    activeHandle.current = handle;
    track.setPointerCapture(e.pointerId);
    applyHandle(handle, e.clientX);
    e.preventDefault();
  }

  function onTrackPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeHandle.current) return;
    applyHandle(activeHandle.current, e.clientX);
  }

  function onTrackPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!activeHandle.current) return;
    activeHandle.current = null;
    try {
      trackRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  function commitMin(raw: number) {
    const next = Math.min(snap(raw), valueMax);
    onChange(next, valueMax);
  }

  function commitMax(raw: number) {
    const next = Math.max(snap(raw), valueMin);
    onChange(valueMin, next);
  }

  return (
    <div className="space-y-2" role="group" aria-labelledby={`${id}-label`}>
      <p
        id={`${id}-label`}
        className="text-xs font-semibold uppercase tracking-wide text-pisome-muted"
      >
        {label}
      </p>

      <div
        ref={trackRef}
        className="relative h-8 cursor-pointer touch-none select-none"
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onPointerUp={onTrackPointerUp}
        onPointerCancel={onTrackPointerUp}
      >
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-pisome-alice" />
        <div
          className="pointer-events-none absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-pisome-blue"
          style={{ left: `${left}%`, right: `${100 - right}%` }}
        />
        {/* Visual thumbs only — dragging is owned by the track so a grabbed
            handle keeps control across the whole bar (not left/right half). */}
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 z-[1] h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pisome-blue shadow-[0_1px_4px_rgba(11,31,58,0.25)]"
          style={{ left: `${left}%` }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 z-[1] h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-pisome-blue shadow-[0_1px_4px_rgba(11,31,58,0.25)]"
          style={{ left: `${right}%` }}
        />
        <input
          type="range"
          id={`${id}-min`}
          min={min}
          max={max}
          step={step}
          value={valueMin}
          tabIndex={-1}
          aria-label={minLabel}
          aria-valuemin={min}
          aria-valuemax={valueMax}
          aria-valuenow={valueMin}
          aria-valuetext={formatValue(valueMin)}
          onChange={(e) =>
            onChange(Math.min(Number(e.target.value), valueMax), valueMax)
          }
          className="pointer-events-none absolute inset-0 m-0 h-8 w-full appearance-none opacity-0"
        />
        <input
          type="range"
          id={`${id}-max`}
          min={min}
          max={max}
          step={step}
          value={valueMax}
          tabIndex={-1}
          aria-label={maxLabel}
          aria-valuemin={valueMin}
          aria-valuemax={max}
          aria-valuenow={valueMax}
          aria-valuetext={formatValue(valueMax)}
          onChange={(e) =>
            onChange(valueMin, Math.max(Number(e.target.value), valueMin))
          }
          className="pointer-events-none absolute inset-0 m-0 h-8 w-full appearance-none opacity-0"
        />
      </div>

      <div className="flex items-start justify-between gap-3">
        <EditableValue
          id={`${id}-min-value`}
          value={valueMin}
          formatted={formatValue(valueMin)}
          align="left"
          ariaLabel={minLabel}
          onCommit={commitMin}
        />
        <EditableValue
          id={`${id}-max-value`}
          value={valueMax}
          formatted={formatValue(valueMax)}
          align="right"
          ariaLabel={maxLabel}
          onCommit={commitMax}
        />
      </div>
    </div>
  );
}
