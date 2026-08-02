"use client";

import { Input } from "@/components/ui/input";
import type { FilterCatalogItem } from "@/lib/filter-catalog";
import { cn } from "@/lib/utils";
import { MapPin, Search } from "lucide-react";
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
}) {
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<LocationSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const blurTimer = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const local = useMemo(
    () => buildCatalogSuggestions(catalog, value),
    [catalog, value],
  );

  const suggestions = useMemo(
    () => mergeSuggestions(local, remote),
    [local, remote],
  );

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

  return (
    <div className={cn("relative", className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-pisome-muted"
        aria-hidden
      />
      <Input
        id={id}
        value={value}
        autoComplete="off"
        placeholder={placeholder}
        className="pl-10"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          blurTimer.current = window.setTimeout(() => setOpen(false), 120);
        }}
      />
      {open && (suggestions.length > 0 || loading) && (
        <ul
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-xl border border-pisome-border bg-white shadow-lg shadow-pisome-navy/10"
          role="listbox"
        >
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.kind}-${suggestion.label}`}>
              <button
                type="button"
                className="flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition hover:bg-pisome-alice"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (blurTimer.current != null) {
                    window.clearTimeout(blurTimer.current);
                  }
                  onChange(suggestion.value);
                  onSelectSuggestion?.(suggestion);
                  setOpen(false);
                }}
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
