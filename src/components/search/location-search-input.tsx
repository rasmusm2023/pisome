"use client";

import type { FilterCatalogItem } from "@/lib/filter-catalog";
import { cn } from "@/lib/utils";
import { MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type LocationSuggestion = {
  label: string;
  kind: "city" | "neighborhood" | "street";
  value: string;
  city?: string;
};

export function buildCatalogSuggestions(
  catalog: FilterCatalogItem[],
  query: string,
  limit = 6,
): LocationSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const cities = new Map<string, LocationSuggestion>();
  const neighborhoods = new Map<string, LocationSuggestion>();
  const streets = new Map<string, LocationSuggestion>();

  for (const item of catalog) {
    if (item.city.toLowerCase().includes(q)) {
      cities.set(item.city, {
        label: item.city,
        kind: "city",
        value: item.city,
        city: item.city,
      });
    }
    if (item.neighborhood.toLowerCase().includes(q)) {
      const key = `${item.neighborhood}|${item.city}`;
      neighborhoods.set(key, {
        label: `${item.neighborhood}, ${item.city}`,
        kind: "neighborhood",
        value: item.neighborhood,
        city: item.city,
      });
    }
    if (item.address.toLowerCase().includes(q)) {
      streets.set(item.address, {
        label: item.address,
        kind: "street",
        value: item.address,
        city: item.city,
      });
    }
  }

  return [
    ...cities.values(),
    ...neighborhoods.values(),
    ...streets.values(),
  ]
    .sort((a, b) => {
      const score = (s: LocationSuggestion) => {
        const l = s.label.toLowerCase();
        if (l.startsWith(q)) return 0;
        if (l.split(/[\s,]+/).some((part) => part.startsWith(q))) return 1;
        return 2;
      };
      const kindOrder = { city: 0, neighborhood: 1, street: 2 } as const;
      return score(a) - score(b) || kindOrder[a.kind] - kindOrder[b.kind];
    })
    .slice(0, limit);
}

function mergeSuggestions(
  local: LocationSuggestion[],
  remote: LocationSuggestion[],
  limit = 8,
) {
  const seen = new Set<string>();
  const out: LocationSuggestion[] = [];
  for (const s of [...local, ...remote]) {
    const key = `${s.kind}:${s.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function tagKey(value: string) {
  return value.trim().toLowerCase();
}

export function LocationSearchInput({
  id,
  value,
  onChange,
  onSelectSuggestion,
  catalog,
  placeholder,
  cityLabel,
  neighborhoodLabel,
  streetLabel,
  lang = "es",
  className,
  tags,
  onAddTag,
  onRemoveTag,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion?: (suggestion: LocationSuggestion) => void;
  catalog: FilterCatalogItem[];
  placeholder: string;
  cityLabel: string;
  neighborhoodLabel: string;
  streetLabel: string;
  lang?: string;
  className?: string;
  /** When set, Enter / suggestion adds removable location tags. */
  tags?: string[];
  onAddTag?: (tag: string) => void;
  onRemoveTag?: (tag: string) => void;
}) {
  const multi = tags != null;
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimer = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const local = useMemo(
    () => buildCatalogSuggestions(catalog, value),
    [catalog, value],
  );

  const suggestions = useMemo(
    () => mergeSuggestions(local, remote),
    [local, remote],
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    if (activeIndex < 0) return;
    if (activeIndex >= suggestions.length) {
      setActiveIndex(suggestions.length > 0 ? suggestions.length - 1 : -1);
    }
  }, [activeIndex, suggestions.length]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-suggestion-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setRemote([]);
      setLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/locations/suggest?q=${encodeURIComponent(q)}&lang=${lang}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setRemote([]);
          return;
        }
        const data = (await res.json()) as {
          suggestions?: LocationSuggestion[];
        };
        setRemote(data.suggestions ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setRemote([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);

    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [value, lang]);

  const kindLabel = (kind: LocationSuggestion["kind"]) => {
    if (kind === "city") return cityLabel;
    if (kind === "neighborhood") return neighborhoodLabel;
    return streetLabel;
  };

  function clearBlurTimer() {
    if (blurTimer.current != null) {
      window.clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }

  function tryAddTag(raw: string) {
    const tag = normalizeTag(raw);
    if (!tag || !onAddTag) return false;
    const exists = (tags ?? []).some((t) => tagKey(t) === tagKey(tag));
    if (exists) {
      onChange("");
      setOpen(false);
      setActiveIndex(-1);
      return true;
    }
    onAddTag(tag);
    onChange("");
    setOpen(false);
    setActiveIndex(-1);
    return true;
  }

  function commitSuggestion(suggestion: LocationSuggestion) {
    clearBlurTimer();
    if (multi && onAddTag) {
      tryAddTag(suggestion.label);
      return;
    }
    onChange(suggestion.value);
    onSelectSuggestion?.(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const hasSuggestions = suggestions.length > 0;

    if (e.key === "ArrowDown") {
      if (!hasSuggestions) return;
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => {
        if (prev < 0) return 0;
        return Math.min(prev + 1, suggestions.length - 1);
      });
      return;
    }

    if (e.key === "ArrowUp") {
      if (!hasSuggestions) return;
      e.preventDefault();
      setOpen(true);
      setActiveIndex((prev) => {
        if (prev <= 0) return -1;
        return prev - 1;
      });
      return;
    }

    if (e.key === "Escape") {
      if (!open && activeIndex < 0) return;
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        commitSuggestion(suggestions[activeIndex]);
        return;
      }
      if (!multi) return;
      e.preventDefault();
      if (value.trim()) tryAddTag(value);
      return;
    }

    if (!multi) return;

    if (e.key === "Backspace" && value === "" && tags && tags.length > 0) {
      e.preventDefault();
      onRemoveTag?.(tags[tags.length - 1]);
    }
  }

  const showPlaceholder = !multi || (tags?.length ?? 0) === 0;
  const listboxId = id ? `${id}-suggestions` : "location-suggestions";
  const activeOptionId =
    activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

  return (
    <div className={cn("relative", className)}>
      <div
        className="flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-xl border border-pisome-border bg-white px-2.5 py-1.5 transition focus-within:border-pisome-blue focus-within:ring-2 focus-within:ring-pisome-blue/15"
        onClick={() => inputRef.current?.focus()}
      >
        {multi &&
          tags?.map((tag) => (
            <span
              key={tagKey(tag)}
              className="inline-flex max-w-full items-center gap-1 rounded-lg bg-pisome-alice px-2 py-1 text-xs font-semibold text-pisome-navy"
            >
              <button
                type="button"
                className="rounded p-0.5 text-pisome-muted transition hover:bg-white hover:text-pisome-navy"
                aria-label={`Remove ${tag}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveTag?.(tag);
                }}
              >
                <X className="h-3 w-3" strokeWidth={2.5} />
              </button>
              <span className="truncate">{tag}</span>
            </span>
          ))}

        <MapPin
          className={cn(
            "h-4 w-4 shrink-0",
            multi ? "text-pisome-blue" : "text-pisome-muted",
          )}
          aria-hidden
        />

        <input
          ref={inputRef}
          id={id}
          value={value}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && (suggestions.length > 0 || loading)}
          aria-controls={listboxId}
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          placeholder={showPlaceholder ? placeholder : ""}
          className="min-w-28 flex-1 border-0 bg-transparent py-1.5 text-sm text-pisome-navy outline-none placeholder:text-pisome-muted/70"
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => {
              setOpen(false);
              setActiveIndex(-1);
            }, 120);
          }}
          onKeyDown={onInputKeyDown}
        />
      </div>

      {open && (suggestions.length > 0 || loading) && (
        <ul
          ref={listRef}
          id={listboxId}
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-72 overflow-auto rounded-xl border border-pisome-border bg-white shadow-lg shadow-pisome-navy/10"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.kind}-${suggestion.label}`}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              data-suggestion-index={index}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition",
                  index === activeIndex
                    ? "bg-pisome-alice"
                    : "hover:bg-pisome-alice",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSuggestion(suggestion)}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pisome-blue" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-pisome-navy">
                    {suggestion.label}
                  </span>
                  <span className="block text-xs text-pisome-muted">
                    {kindLabel(suggestion.kind)}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {loading && suggestions.length === 0 && (
            <li className="px-3.5 py-2.5 text-sm text-pisome-muted">…</li>
          )}
        </ul>
      )}
    </div>
  );
}
