"use client";

import { cn } from "@/lib/utils";
import { Check, Pentagon, Pencil, RotateCcw, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

type CursorPos = { x: number; y: number };

export function DrawAreaControls({
  drawing,
  canSave,
  canReset,
  hasSavedArea,
  toolbarClassName,
  onToggle,
  onReset,
  onSave,
  onRemove,
}: {
  drawing: boolean;
  canSave: boolean;
  canReset: boolean;
  hasSavedArea: boolean;
  toolbarClassName?: string;
  onToggle: () => void;
  onReset: () => void;
  onSave: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState<CursorPos | null>(null);

  useEffect(() => {
    if (!drawing) {
      setCursor(null);
      return;
    }
    const wrap = wrapRef.current?.closest(".pisome-map-shell");
    if (!wrap) return;

    const onMove = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const shellOverVertex = wrap.querySelector(".is-over-vertex");
      if (
        target?.closest("[data-draw-toolbar], .pisome-draw-vertex") ||
        (target instanceof Element &&
          target.closest(".is-over-vertex, .is-dragging-vertex")) ||
        shellOverVertex
      ) {
        setCursor(null);
        return;
      }
      const rect = wrap.getBoundingClientRect();
      setCursor({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    };
    const onLeave = () => setCursor(null);

    wrap.addEventListener("pointermove", onMove);
    wrap.addEventListener("pointerleave", onLeave);
    return () => {
      wrap.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, [drawing]);

  const btnBase =
    "pointer-events-auto inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-sm shadow-pisome-navy/10 transition-colors disabled:pointer-events-none disabled:opacity-45";

  return (
    <div ref={wrapRef} className="pointer-events-none absolute inset-0 z-20">
      {drawing && cursor && (
        <Pencil
          aria-hidden
          className="pointer-events-none absolute z-30 h-5 w-5 text-pisome-navy"
          strokeWidth={2.25}
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: "translate(-3px, -18px) rotate(-28deg)",
            filter:
              "drop-shadow(0 0 1px #fff) drop-shadow(0 1px 2px rgba(11,31,58,0.35))",
          }}
        />
      )}

      <div
        data-draw-toolbar
        className={cn(
          "absolute flex flex-col items-start gap-2",
          toolbarClassName ?? "left-3 top-3 sm:left-4 sm:top-4",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={drawing}
            className={cn(
              btnBase,
              drawing
                ? "border-pisome-navy bg-pisome-navy text-white shadow-md shadow-pisome-navy/30 ring-2 ring-white ring-offset-2 ring-offset-black/10 hover:bg-pisome-navy/90"
                : "border-pisome-border bg-white text-pisome-navy hover:bg-pisome-alice",
            )}
            onClick={onToggle}
          >
            <Pentagon className="h-3.5 w-3.5" aria-hidden />
            {t("search.drawArea")}
          </button>

          {hasSavedArea && (
            <button
              type="button"
              className={cn(
                btnBase,
                "border-pisome-border bg-white text-pisome-navy hover:border-red-200 hover:bg-red-50 hover:text-red-700",
              )}
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
              {t("search.removeDrawArea")}
            </button>
          )}
        </div>

        {drawing && (
          <div className="flex flex-col items-start gap-2 animate-[fade-up_0.2s_ease-out]">
            <button
              type="button"
              className={cn(
                btnBase,
                "border-pisome-border bg-white text-pisome-navy hover:bg-pisome-alice",
              )}
              disabled={!canReset}
              onClick={onReset}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              {t("search.resetDrawArea")}
            </button>
            <button
              type="button"
              className={cn(
                btnBase,
                "border-pisome-border bg-white text-pisome-navy hover:bg-pisome-alice",
              )}
              disabled={!canSave}
              onClick={onSave}
            >
              <Check className="h-3.5 w-3.5" aria-hidden />
              {t("search.saveDrawArea")}
            </button>
          </div>
        )}
      </div>

      {drawing && (
        <div className="absolute inset-x-3 bottom-8 flex justify-center sm:inset-x-4">
          <p className="rounded-xl border border-pisome-border bg-white/95 px-3 py-1.5 text-center text-[11px] font-semibold text-pisome-navy shadow-sm shadow-pisome-navy/5">
            {t("search.drawAreaHint")}
          </p>
        </div>
      )}
    </div>
  );
}
