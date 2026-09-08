"use client";

import { LocationSearchInput } from "@/components/search/location-search-input";
import { RangeSlider } from "@/components/search/range-slider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  countCatalogMatches,
  type FilterCatalogItem,
} from "@/lib/filter-catalog";
import { suggestKeywords } from "@/lib/keyword-catalog";
import { cn, formatPrice } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  CircleParking,
  DoorOpen,
  Home,
  Landmark,
  Layers,
  Search,
  Sparkles,
  Sun,
  TreePine,
  Waves,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";

const PROPERTY_TYPE_OPTIONS: {
  type: string;
  icon: LucideIcon;
}[] = [
  { type: "APARTMENT", icon: Building2 },
  { type: "HOUSE", icon: Home },
  { type: "VILLA", icon: TreePine },
  { type: "PENTHOUSE", icon: Layers },
  { type: "STUDIO", icon: DoorOpen },
  { type: "TOWNHOUSE", icon: Landmark },
];

const FEATURE_OPTIONS: {
  key: "hasParking" | "hasElevator" | "hasTerrace" | "hasPool" | "isNewBuild";
  labelKey: "parking" | "elevator" | "terrace" | "pool" | "newBuild";
  icon: LucideIcon;
}[] = [
  { key: "hasParking", labelKey: "parking", icon: CircleParking },
  { key: "hasElevator", labelKey: "elevator", icon: ArrowUpDown },
  { key: "hasTerrace", labelKey: "terrace", icon: Sun },
  { key: "hasPool", labelKey: "pool", icon: Waves },
  { key: "isNewBuild", labelKey: "newBuild", icon: Sparkles },
];

const FEATURES_VISIBLE_INITIAL = 3;

export const FILTER_BOUNDS = {
  price: { min: 0, max: 5_000_000, step: 25_000 },
  pricePerM2: { min: 0, max: 15_000, step: 50 },
  area: { min: 0, max: 500, step: 5 },
} as const;

function parseCsv(value?: string) {
  return value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}

export type DraftFilters = {
  q: string;
  city: string;
  locations: string[];
  keywords: string[];
  minPrice: number;
  maxPrice: number;
  minPricePerM2: number;
  maxPricePerM2: number;
  minAreaM2: number;
  maxAreaM2: number;
  rooms: string[];
  bathrooms: string[];
  propertyTypes: string[];
  energyCert: string;
  sort: string;
  hasParking: boolean;
  hasElevator: boolean;
  hasTerrace: boolean;
  hasPool: boolean;
  isNewBuild: boolean;
};

export function filtersFromInitial(
  initial: Record<string, string | undefined>,
): DraftFilters {
  const rooms = parseCsv(initial.rooms);
  const bathrooms = parseCsv(initial.bathrooms);
  const propertyTypes = parseCsv(initial.propertyTypes);
  // Back-compat with older single-value params
  if (!rooms.length && initial.minRooms) rooms.push(initial.minRooms);
  if (!bathrooms.length && initial.minBathrooms) {
    bathrooms.push(initial.minBathrooms);
  }
  if (!propertyTypes.length && initial.propertyType) {
    propertyTypes.push(initial.propertyType);
  }

  const locations = initial.locations
    ? initial.locations.split("|").map((v) => v.trim()).filter(Boolean)
    : initial.q
      ? [initial.q.trim()].filter(Boolean)
      : [];
  const keywords = initial.keywords
    ? initial.keywords.split("|").map((v) => v.trim()).filter(Boolean)
    : [];

  return {
    q: "",
    city: initial.city ?? "",
    locations,
    keywords,
    minPrice: initial.minPrice
      ? Number(initial.minPrice)
      : FILTER_BOUNDS.price.min,
    maxPrice: initial.maxPrice
      ? Number(initial.maxPrice)
      : FILTER_BOUNDS.price.max,
    minPricePerM2: initial.minPricePerM2
      ? Number(initial.minPricePerM2)
      : FILTER_BOUNDS.pricePerM2.min,
    maxPricePerM2: initial.maxPricePerM2
      ? Number(initial.maxPricePerM2)
      : FILTER_BOUNDS.pricePerM2.max,
    minAreaM2: initial.minAreaM2
      ? Number(initial.minAreaM2)
      : FILTER_BOUNDS.area.min,
    maxAreaM2: initial.maxAreaM2
      ? Number(initial.maxAreaM2)
      : FILTER_BOUNDS.area.max,
    rooms,
    bathrooms,
    propertyTypes,
    energyCert: initial.energyCert ?? "",
    sort: initial.sort ?? "featured",
    hasParking: initial.hasParking === "1",
    hasElevator: initial.hasElevator === "1",
    hasTerrace: initial.hasTerrace === "1",
    hasPool: initial.hasPool === "1",
    isNewBuild: initial.isNewBuild === "1",
  };
}

export function draftToSearchParams(draft: DraftFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (draft.locations.length) params.set("locations", draft.locations.join("|"));
  if (draft.city) params.set("city", draft.city);
  if (draft.keywords.length) params.set("keywords", draft.keywords.join("|"));
  if (draft.minPrice > FILTER_BOUNDS.price.min) {
    params.set("minPrice", String(draft.minPrice));
  }
  if (draft.maxPrice < FILTER_BOUNDS.price.max) {
    params.set("maxPrice", String(draft.maxPrice));
  }
  if (draft.minPricePerM2 > FILTER_BOUNDS.pricePerM2.min) {
    params.set("minPricePerM2", String(draft.minPricePerM2));
  }
  if (draft.maxPricePerM2 < FILTER_BOUNDS.pricePerM2.max) {
    params.set("maxPricePerM2", String(draft.maxPricePerM2));
  }
  if (draft.minAreaM2 > FILTER_BOUNDS.area.min) {
    params.set("minAreaM2", String(draft.minAreaM2));
  }
  if (draft.maxAreaM2 < FILTER_BOUNDS.area.max) {
    params.set("maxAreaM2", String(draft.maxAreaM2));
  }
  if (draft.rooms.length) params.set("rooms", draft.rooms.join(","));
  if (draft.bathrooms.length) params.set("bathrooms", draft.bathrooms.join(","));
  if (draft.propertyTypes.length) {
    params.set("propertyTypes", draft.propertyTypes.join(","));
  }
  if (draft.energyCert) params.set("energyCert", draft.energyCert);
  if (draft.sort && draft.sort !== "featured") params.set("sort", draft.sort);
  if (draft.hasParking) params.set("hasParking", "1");
  if (draft.hasElevator) params.set("hasElevator", "1");
  if (draft.hasTerrace) params.set("hasTerrace", "1");
  if (draft.hasPool) params.set("hasPool", "1");
  if (draft.isNewBuild) params.set("isNewBuild", "1");
  return params;
}

export function hasAppliedFilters(
  initial: Record<string, string | undefined>,
) {
  return Object.entries(initial).some(([key, value]) => {
    if (!value) return false;
    if (key === "sort" && value === "featured") return false;
    return true;
  });
}

function KeywordTagInput({
  id,
  tags,
  placeholder,
  lang = "es",
  onAdd,
  onRemove,
}: {
  id?: string;
  tags: string[];
  placeholder: string;
  lang?: string;
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const blurTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const suggestions = useMemo(
    () => suggestKeywords(value, lang, tags),
    [value, lang, tags],
  );

  useEffect(() => {
    setActiveIndex(suggestions.length > 0 && open ? 0 : -1);
  }, [suggestions.length, open]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-suggestion-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function clearBlurTimer() {
    if (blurTimer.current != null) {
      window.clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
  }

  function commit(tag: string) {
    const next = tag.trim();
    if (!next) return;
    onAdd(next);
    setValue("");
    setOpen(false);
    setActiveIndex(-1);
  }

  function commitSuggestion(suggestion: { value: string; label: string }) {
    clearBlurTimer();
    commit(suggestion.label);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        commitSuggestion(suggestions[activeIndex]);
        return;
      }
      if (value.trim()) commit(value);
      return;
    }

    if (e.key === "Backspace" && !value && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  const listboxId = id ? `${id}-suggestions` : "keyword-suggestions";

  return (
    <div className="relative">
      <div
        className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-pisome-border bg-white px-3 py-2 focus-within:border-pisome-blue focus-within:ring-2 focus-within:ring-pisome-blue/20"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-lg bg-pisome-alice px-2 py-0.5 text-sm font-medium text-pisome-blue-dark"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(tag);
              }}
              className="ml-0.5 rounded text-pisome-blue/60 hover:text-pisome-blue-dark"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = window.setTimeout(() => {
              setOpen(false);
              setActiveIndex(-1);
            }, 120);
          }}
          onKeyDown={onKeyDown}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-28 flex-1 bg-transparent text-sm text-pisome-navy placeholder:text-pisome-muted/60 outline-none"
        />
      </div>

      {open && suggestions.length > 0 && (
        <ul
          ref={listRef}
          id={listboxId}
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-64 overflow-auto rounded-xl border border-pisome-border bg-white shadow-lg shadow-pisome-navy/10"
          role="listbox"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.value}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
              data-suggestion-index={index}
            >
              <button
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium text-pisome-navy transition",
                  index === activeIndex
                    ? "bg-pisome-alice"
                    : "hover:bg-pisome-alice",
                )}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commitSuggestion(suggestion)}
              >
                <Search className="h-4 w-4 shrink-0 text-pisome-blue" />
                <span className="truncate">{suggestion.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterTile({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-14 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-2 text-center transition",
        active
          ? "border-pisome-blue bg-pisome-blue text-white shadow-sm shadow-pisome-blue/25"
          : "border-pisome-border bg-white text-pisome-navy hover:border-pisome-blue/45 hover:bg-pisome-alice",
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "h-5 w-5 shrink-0",
            active ? "text-white" : "text-pisome-blue",
          )}
          strokeWidth={1.75}
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "font-semibold leading-tight",
          Icon ? "text-xs" : "text-sm",
        )}
      >
        {children}
      </span>
    </button>
  );
}

export function SearchFiltersPanel({
  open,
  initialFilters,
  catalog,
  locale,
  hasActiveFilters,
  onClose,
  onApply,
  onClear,
}: {
  open: boolean;
  initialFilters: Record<string, string | undefined>;
  catalog: FilterCatalogItem[];
  locale: string;
  hasActiveFilters: boolean;
  onClose: () => void;
  onApply: (params: URLSearchParams) => void;
  onClear: () => void;
}) {
  const t = useTranslations();
  const numberLocale = locale === "en" ? "en-GB" : "es-ES";
  const [draft, setDraft] = useState(() => filtersFromInitial(initialFilters));
  const [featuresExpanded, setFeaturesExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;
    const next = filtersFromInitial(initialFilters);
    setDraft(next);
    const hasHiddenSelection = FEATURE_OPTIONS.slice(FEATURES_VISIBLE_INITIAL).some(
      ({ key }) => next[key],
    );
    setFeaturesExpanded(hasHiddenSelection);
  }, [open, initialFilters]);

  const previewCount = useMemo(() => {
    return countCatalogMatches(catalog, {
      locations: draft.locations.length ? draft.locations : undefined,
      city: draft.city || undefined,
      minPrice:
        draft.minPrice > FILTER_BOUNDS.price.min ? draft.minPrice : undefined,
      maxPrice:
        draft.maxPrice < FILTER_BOUNDS.price.max ? draft.maxPrice : undefined,
      minPricePerM2:
        draft.minPricePerM2 > FILTER_BOUNDS.pricePerM2.min
          ? draft.minPricePerM2
          : undefined,
      maxPricePerM2:
        draft.maxPricePerM2 < FILTER_BOUNDS.pricePerM2.max
          ? draft.maxPricePerM2
          : undefined,
      minAreaM2:
        draft.minAreaM2 > FILTER_BOUNDS.area.min ? draft.minAreaM2 : undefined,
      maxAreaM2:
        draft.maxAreaM2 < FILTER_BOUNDS.area.max ? draft.maxAreaM2 : undefined,
      rooms: draft.rooms.map(Number),
      bathrooms: draft.bathrooms.map(Number),
      propertyTypes: draft.propertyTypes,
      energyCert: draft.energyCert || undefined,
      hasParking: draft.hasParking || undefined,
      hasElevator: draft.hasElevator || undefined,
      hasTerrace: draft.hasTerrace || undefined,
      hasPool: draft.hasPool || undefined,
      isNewBuild: draft.isNewBuild || undefined,
    });
  }, [catalog, draft]);

  function patch(partial: Partial<DraftFilters>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col overflow-hidden border border-pisome-border bg-white shadow-xl shadow-pisome-navy/10 transition-transform duration-300 ease-out",
        open
          ? "translate-x-0"
          : "pointer-events-none -translate-x-[calc(100%+1rem)]",
      )}
      aria-hidden={!open}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-pisome-border px-8 py-3">
        <h2 className="font-display text-lg font-semibold text-pisome-navy">
          {t("search.searchFilters")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-pisome-muted transition hover:bg-pisome-alice hover:text-pisome-navy"
          aria-label={t("search.closeFilters")}
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-5 overflow-y-auto px-8 py-4">
          <div className="space-y-1.5">
            <label
              htmlFor="filter-q"
              className="text-xs font-semibold uppercase tracking-wide text-pisome-muted"
            >
              {t("search.location")}
            </label>
            <LocationSearchInput
              id="filter-q"
              value={draft.q}
              catalog={catalog}
              lang={locale}
              placeholder={t("search.placeholder")}
              cityLabel={t("search.suggestionCity")}
              neighborhoodLabel={t("search.suggestionNeighborhood")}
              streetLabel={t("search.suggestionStreet")}
              onChange={(q) => patch({ q })}
              tags={draft.locations}
              onAddTag={(tag) => {
                const exists = draft.locations.some(
                  (l) => l.toLowerCase() === tag.toLowerCase(),
                );
                if (exists) return;
                patch({ q: "", locations: [...draft.locations, tag] });
              }}
              onRemoveTag={(tag) => {
                patch({
                  locations: draft.locations.filter(
                    (l) => l.toLowerCase() !== tag.toLowerCase(),
                  ),
                });
              }}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filter-keywords"
              className="text-xs font-semibold uppercase tracking-wide text-pisome-muted"
            >
              {t("search.keywords")}
            </label>
            <KeywordTagInput
              id="filter-keywords"
              tags={draft.keywords}
              lang={locale}
              placeholder={t("search.keywordsPlaceholder")}
              onAdd={(kw) => {
                const exists = draft.keywords.some(
                  (k) => k.toLowerCase() === kw.toLowerCase(),
                );
                if (exists) return;
                patch({ keywords: [...draft.keywords, kw] });
              }}
              onRemove={(kw) => {
                patch({
                  keywords: draft.keywords.filter(
                    (k) => k.toLowerCase() !== kw.toLowerCase(),
                  ),
                });
              }}
            />
            <p className="text-xs text-pisome-muted">{t("search.keywordsHint")}</p>
          </div>

          <RangeSlider
            id="filter-price"
            label={t("search.price")}
            min={FILTER_BOUNDS.price.min}
            max={FILTER_BOUNDS.price.max}
            step={FILTER_BOUNDS.price.step}
            valueMin={draft.minPrice}
            valueMax={draft.maxPrice}
            onChange={(minPrice, maxPrice) => patch({ minPrice, maxPrice })}
            formatValue={(v) => formatPrice(v, numberLocale)}
            minLabel={t("search.minPrice")}
            maxLabel={t("search.maxPrice")}
          />

          <RangeSlider
            id="filter-ppm"
            label={t("search.pricePerM2")}
            min={FILTER_BOUNDS.pricePerM2.min}
            max={FILTER_BOUNDS.pricePerM2.max}
            step={FILTER_BOUNDS.pricePerM2.step}
            valueMin={draft.minPricePerM2}
            valueMax={draft.maxPricePerM2}
            onChange={(minPricePerM2, maxPricePerM2) =>
              patch({ minPricePerM2, maxPricePerM2 })
            }
            formatValue={(v) =>
              `${new Intl.NumberFormat(numberLocale, {
                maximumFractionDigits: 0,
              }).format(v)} €/m²`
            }
            minLabel={t("search.minPricePerM2")}
            maxLabel={t("search.maxPricePerM2")}
          />

          <RangeSlider
            id="filter-area"
            label={t("search.area")}
            min={FILTER_BOUNDS.area.min}
            max={FILTER_BOUNDS.area.max}
            step={FILTER_BOUNDS.area.step}
            valueMin={draft.minAreaM2}
            valueMax={draft.maxAreaM2}
            onChange={(minAreaM2, maxAreaM2) => patch({ minAreaM2, maxAreaM2 })}
            formatValue={(v) => `${v} m²`}
            minLabel={t("search.minArea")}
            maxLabel={t("search.maxArea")}
          />

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
              {t("search.rooms")}
            </p>
            <div className="grid grid-cols-5 gap-2">
              <FilterTile active={!draft.rooms.length} onClick={() => patch({ rooms: [] })}>
                {t("search.any")}
              </FilterTile>
              {["1", "2", "3", "4"].map((n) => (
                <FilterTile
                  key={n}
                  active={draft.rooms.includes(n)}
                  onClick={() => patch({ rooms: toggleValue(draft.rooms, n) })}
                >
                  {n === "4" ? "4+" : n}
                </FilterTile>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
              {t("search.bathrooms")}
            </p>
            <div className="grid grid-cols-4 gap-2">
              <FilterTile
                active={!draft.bathrooms.length}
                onClick={() => patch({ bathrooms: [] })}
              >
                {t("search.any")}
              </FilterTile>
              {["1", "2", "3"].map((n) => (
                <FilterTile
                  key={n}
                  active={draft.bathrooms.includes(n)}
                  onClick={() =>
                    patch({ bathrooms: toggleValue(draft.bathrooms, n) })
                  }
                >
                  {n === "3" ? "3+" : n}
                </FilterTile>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
              {t("search.type")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_TYPE_OPTIONS.map(({ type, icon: Icon }) => {
                const active = draft.propertyTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      patch({
                        propertyTypes: toggleValue(draft.propertyTypes, type),
                      })
                    }
                    className={cn(
                      "flex min-h-21 flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition",
                      active
                        ? "border-pisome-blue bg-pisome-blue text-white shadow-sm shadow-pisome-blue/25"
                        : "border-pisome-border bg-white text-pisome-navy hover:border-pisome-blue/45 hover:bg-pisome-alice",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-6 w-6 shrink-0",
                        active ? "text-white" : "text-pisome-blue",
                      )}
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="text-xs font-semibold leading-tight">
                      {t(`propertyTypes.${type}`)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
              {t("search.features")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(featuresExpanded
                ? FEATURE_OPTIONS
                : FEATURE_OPTIONS.slice(0, FEATURES_VISIBLE_INITIAL)
              ).map(({ key, labelKey, icon }) => (
                <FilterTile
                  key={key}
                  icon={icon}
                  active={draft[key]}
                  onClick={() => patch({ [key]: !draft[key] })}
                >
                  {t(`search.${labelKey}`)}
                </FilterTile>
              ))}
            </div>
            {FEATURE_OPTIONS.length > FEATURES_VISIBLE_INITIAL && (
              <button
                type="button"
                onClick={() => setFeaturesExpanded((v) => !v)}
                className="text-sm font-semibold text-pisome-blue transition hover:text-pisome-blue-dark"
              >
                {featuresExpanded
                  ? t("search.showLessFeatures")
                  : t("search.showMoreFeatures")}
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filter-energy"
              className="text-xs font-semibold uppercase tracking-wide text-pisome-muted"
            >
              {t("search.energy")}
            </label>
            <Select
              id="filter-energy"
              value={draft.energyCert}
              onChange={(e) => patch({ energyCert: e.target.value })}
            >
              <option value="">{t("search.any")}</option>
              {["A", "B", "C", "D", "E", "F", "G"].map((cert) => (
                <option key={cert} value={cert}>
                  {cert}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="filter-sort"
              className="text-xs font-semibold uppercase tracking-wide text-pisome-muted"
            >
              {t("search.sort")}
            </label>
            <Select
              id="filter-sort"
              value={draft.sort}
              onChange={(e) => patch({ sort: e.target.value })}
            >
              <option value="featured">{t("search.sortFeatured")}</option>
              <option value="newest">{t("search.sortNewest")}</option>
              <option value="oldest">{t("search.sortOldest")}</option>
              <option value="price_asc">{t("search.sortPriceAsc")}</option>
              <option value="price_desc">{t("search.sortPriceDesc")}</option>
              <option value="area_asc">{t("search.sortAreaAsc")}</option>
              <option value="area_desc">{t("search.sortAreaDesc")}</option>
              <option value="ppm_asc">{t("search.sortPpmAsc")}</option>
              <option value="ppm_desc">{t("search.sortPpmDesc")}</option>
            </Select>
          </div>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-pisome-border px-8 py-4">
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={onClear}
            >
              {t("search.clearFilters")}
            </Button>
          )}
          <Button
            type="button"
            className="min-w-0 flex-1"
            onClick={() => onApply(draftToSearchParams(draft))}
          >
            <span className="truncate">
              {t("search.showHomes", { count: previewCount })}
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  );
}
