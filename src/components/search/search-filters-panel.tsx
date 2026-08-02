"use client";

import { LocationSearchInput } from "@/components/search/location-search-input";
import { RangeSlider } from "@/components/search/range-slider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  countCatalogMatches,
  type FilterCatalogItem,
} from "@/lib/filter-catalog";
import { cn, formatPrice } from "@/lib/utils";
import {
  ArrowRight,
  Building2,
  DoorOpen,
  Home,
  Landmark,
  Layers,
  TreePine,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

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

  return {
    q: initial.q ?? "",
    city: initial.city ?? "",
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
  if (draft.q.trim()) params.set("q", draft.q.trim());
  if (draft.city) params.set("city", draft.city);
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

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium transition",
        active
          ? "border-pisome-blue bg-pisome-alice text-pisome-blue-dark"
          : "border-pisome-border bg-white text-pisome-navy hover:border-pisome-blue/40",
      )}
    >
      {children}
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

  useEffect(() => {
    if (open) setDraft(filtersFromInitial(initialFilters));
  }, [open, initialFilters]);

  const previewCount = useMemo(() => {
    return countCatalogMatches(catalog, {
      q: draft.q || undefined,
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
        "absolute inset-0 z-20 flex flex-col overflow-hidden rounded-2xl border border-pisome-border bg-white shadow-xl shadow-pisome-navy/10 transition-transform duration-300 ease-out",
        open
          ? "translate-x-0"
          : "pointer-events-none -translate-x-[calc(100%+1rem)]",
      )}
      aria-hidden={!open}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-pisome-border px-4 py-3">
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
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
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
              onChange={(q) => patch({ q, city: "" })}
              onSelectSuggestion={(suggestion) => {
                if (suggestion.kind === "city") {
                  patch({
                    q: suggestion.value,
                    city: suggestion.city ?? suggestion.value,
                  });
                } else {
                  patch({
                    q: suggestion.value,
                    city: suggestion.city ?? "",
                  });
                }
              }}
            />
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
            <div className="flex flex-wrap gap-2">
              <Chip active={!draft.rooms.length} onClick={() => patch({ rooms: [] })}>
                {t("search.any")}
              </Chip>
              {["1", "2", "3", "4"].map((n) => (
                <Chip
                  key={n}
                  active={draft.rooms.includes(n)}
                  onClick={() => patch({ rooms: toggleValue(draft.rooms, n) })}
                >
                  {n === "4" ? "4+" : n}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-pisome-muted">
              {t("search.bathrooms")}
            </p>
            <div className="flex flex-wrap gap-2">
              <Chip
                active={!draft.bathrooms.length}
                onClick={() => patch({ bathrooms: [] })}
              >
                {t("search.any")}
              </Chip>
              {["1", "2", "3"].map((n) => (
                <Chip
                  key={n}
                  active={draft.bathrooms.includes(n)}
                  onClick={() =>
                    patch({ bathrooms: toggleValue(draft.bathrooms, n) })
                  }
                >
                  {n === "3" ? "3+" : n}
                </Chip>
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
                      "flex min-h-[5.25rem] flex-col items-center justify-center gap-2 rounded-2xl border px-2 py-3 text-center transition",
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
            <div className="space-y-2.5">
              {(
                [
                  ["hasParking", "parking"],
                  ["hasElevator", "elevator"],
                  ["hasTerrace", "terrace"],
                  ["hasPool", "pool"],
                  ["isNewBuild", "newBuild"],
                ] as const
              ).map(([key, labelKey]) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 text-sm text-pisome-navy"
                >
                  <input
                    type="checkbox"
                    checked={draft[key]}
                    onChange={(e) => patch({ [key]: e.target.checked })}
                    className="h-4 w-4 accent-pisome-blue"
                  />
                  {t(`search.${labelKey}`)}
                </label>
              ))}
            </div>
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

        <div className="flex shrink-0 gap-2 border-t border-pisome-border p-4">
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
