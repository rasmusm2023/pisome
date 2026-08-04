"use client";

import { ListingCard } from "@/components/listings/listing-card";
import { rememberSearchPath } from "@/components/listings/listing-toolbar";
import { LocationSearchInput } from "@/components/search/location-search-input";
import {
  hasAppliedFilters,
  SearchFiltersPanel,
} from "@/components/search/search-filters-panel";
import { SearchMap, type MapBounds, type MapListing, isListingInBounds } from "@/components/search/search-map";
import { Button } from "@/components/ui/button";
import type { FilterCatalogItem } from "@/lib/filter-catalog";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Listing, ListingMedia } from "@prisma/client";
import {
  Bookmark,
  List,
  Map as MapIcon,
  SlidersHorizontal,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";

type ListingResult = Listing & { media: ListingMedia[] };

function parseLocationsParam(value?: string) {
  if (!value) return [];
  return value
    .split("|")
    .map((v) => v.trim())
    .filter(Boolean);
}

function locationsFromFilters(filters: Record<string, string | undefined>) {
  const fromParam = parseLocationsParam(filters.locations);
  if (fromParam.length) return fromParam;
  if (filters.q?.trim()) return [filters.q.trim()];
  return [];
}

function ListingResults({
  listings,
  layout,
  hoveredSlug,
  selectedSlug,
  onHover,
  emptyLabel,
}: {
  listings: ListingResult[];
  layout: "stack" | "row";
  hoveredSlug: string | null;
  selectedSlug: string | null;
  onHover: (slug: string | null) => void;
  emptyLabel: string;
}) {
  const listingKey = listings.map((l) => l.id).join(",");
  const [shown, setShown] = useState(listings);
  const [dimmed, setDimmed] = useState(false);
  const keyRef = useRef(listingKey);

  useEffect(() => {
    if (listingKey === keyRef.current) {
      setShown(listings);
      return;
    }
    keyRef.current = listingKey;
    setDimmed(true);
    const timer = window.setTimeout(() => {
      setShown(listings);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setDimmed(false));
      });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [listingKey, listings]);

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 pb-2 transition-opacity duration-300 ease-out",
        layout === "row" && "gap-3",
        dimmed ? "opacity-[0.55]" : "opacity-100",
      )}
    >
      {shown.length === 0 && (
        <p className="rounded-2xl border border-dashed border-pisome-border bg-white p-8 text-center text-pisome-muted">
          {emptyLabel}
        </p>
      )}
      {shown.map((listing) => (
        <div
          key={listing.id}
          onMouseEnter={() => onHover(listing.slug)}
          onMouseLeave={() => onHover(null)}
          className={cn(
            "transition-opacity duration-300 ease-out",
            hoveredSlug === listing.slug || selectedSlug === listing.slug
              ? "ring-2 ring-pisome-blue rounded-2xl"
              : "",
          )}
        >
          <ListingCard listing={listing} layout={layout} />
        </div>
      ))}
    </div>
  );
}

function ViewToggle({
  view,
  onChange,
  listLabel,
  mapLabel,
}: {
  view: "split" | "list" | "map";
  onChange: (view: "split" | "list" | "map") => void;
  listLabel: string;
  mapLabel: string;
}) {
  const listOn = view !== "map";
  const mapOn = view !== "list";

  return (
    <div
      className="flex shrink-0 overflow-hidden rounded-xl border border-pisome-border bg-white shadow-sm shadow-pisome-navy/5"
      role="group"
      aria-label="View"
    >
      <button
        type="button"
        aria-pressed={listOn}
        className={cn(
          "inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition-colors",
          listOn
            ? "bg-pisome-blue text-white"
            : "bg-white text-pisome-muted hover:bg-pisome-alice hover:text-pisome-navy",
        )}
        onClick={() => onChange(view === "map" ? "split" : "list")}
      >
        <List className="h-3.5 w-3.5" aria-hidden />
        {listLabel}
      </button>
      <button
        type="button"
        aria-pressed={mapOn}
        className={cn(
          "inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold transition-colors",
          mapOn
            ? "bg-pisome-blue text-white"
            : "bg-white text-pisome-muted hover:bg-pisome-alice hover:text-pisome-navy",
          listOn !== mapOn && "border-l border-pisome-border",
        )}
        onClick={() => onChange(view === "list" ? "split" : "map")}
      >
        <MapIcon className="h-3.5 w-3.5" aria-hidden />
        {mapLabel}
      </button>
    </div>
  );
}

export function SearchExperience({
  listings,
  catalog,
  initialFilters,
}: {
  listings: ListingResult[];
  catalog: FilterCatalogItem[];
  initialFilters: Record<string, string | undefined>;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"split" | "list" | "map">("split");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const [mainQuery, setMainQuery] = useState("");
  const [locations, setLocations] = useState(() =>
    locationsFromFilters(initialFilters),
  );

  useEffect(() => {
    setLocations(locationsFromFilters(initialFilters));
    setMainQuery("");
  }, [initialFilters.locations, initialFilters.q]);

  useEffect(() => {
    const qs = searchParams.toString();
    rememberSearchPath(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, searchParams]);

  const filtersActive = useMemo(
    () => hasAppliedFilters(initialFilters),
    [initialFilters],
  );

  const canSaveSearch = filtersActive;

  const listingKey = listings.map((l) => l.id).join(",");
  useEffect(() => {
    // New filter results — wait for map fit before viewport-filtering the list
    setMapBounds(null);
  }, [listingKey]);

  const mapListings: MapListing[] = useMemo(
    () =>
      listings.map((l) => ({
        id: l.id,
        slug: l.slug,
        title: locale === "en" && l.titleEn ? l.titleEn : l.title,
        price: l.price,
        lat: l.lat,
        lng: l.lng,
        packageTier: l.packageTier,
        featured: l.featured,
        images: l.media
          .filter((m) => !m.isFloorPlan)
          .map((m) => m.url)
          .filter(Boolean),
        address: l.address,
        neighborhood: l.neighborhood,
        city: l.city,
        rooms: l.rooms,
        areaM2: l.areaM2,
        propertyType: l.propertyType,
        propertyTypeLabel: t(`propertyTypes.${l.propertyType}`),
        publishedAt: l.publishedAt
          ? new Date(l.publishedAt).toISOString()
          : null,
      })),
    [listings, locale, t],
  );

  const visibleListings = useMemo(() => {
    if (view === "list" || !mapBounds) return listings;
    return listings.filter((listing) => isListingInBounds(listing, mapBounds));
  }, [listings, mapBounds, view]);

  useEffect(() => {
    if (!selectedSlug) return;
    if (!visibleListings.some((l) => l.slug === selectedSlug)) {
      setSelectedSlug(null);
    }
  }, [visibleListings, selectedSlug]);

  function navigateSearch(params: URLSearchParams) {
    startTransition(() => {
      const qs = params.toString();
      router.push(qs ? `/search?${qs}` : "/search");
    });
  }

  function buildParamsWithLocations(nextLocations: string[]) {
    const params = new URLSearchParams();
    Object.entries(initialFilters).forEach(([key, value]) => {
      if (
        value &&
        key !== "q" &&
        key !== "city" &&
        key !== "locations"
      ) {
        params.set(key, value);
      }
    });
    if (nextLocations.length) {
      params.set("locations", nextLocations.join("|"));
    }
    return params;
  }

  function applyLocations(nextLocations: string[]) {
    setLocations(nextLocations);
    navigateSearch(buildParamsWithLocations(nextLocations));
  }

  function onMainSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const typed = mainQuery.trim();
    if (typed) {
      const exists = locations.some(
        (l) => l.toLowerCase() === typed.toLowerCase(),
      );
      const next = exists ? locations : [...locations, typed];
      setMainQuery("");
      applyLocations(next);
      return;
    }
    applyLocations(locations);
  }

  async function saveSearch() {
    if (!canSaveSearch) return;
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:
          locations[0] ||
          initialFilters.q ||
          initialFilters.city ||
          t("search.saveSearchDefault"),
        city: initialFilters.city || locations[0],
        minPrice: initialFilters.minPrice
          ? Number(initialFilters.minPrice)
          : undefined,
        maxPrice: initialFilters.maxPrice
          ? Number(initialFilters.maxPrice)
          : undefined,
        minRooms: initialFilters.minRooms
          ? Number(initialFilters.minRooms)
          : undefined,
        propertyType: initialFilters.propertyType,
      }),
    });
    if (res.status === 401) {
      router.push("/auth/signin");
      return;
    }
    setSaveMsg(res.ok ? t("search.saveSearchDone") : t("search.saveSearchError"));
    setTimeout(() => setSaveMsg(null), 2500);
  }

  const titleAndToggle = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <h1 className="font-display text-3xl font-semibold text-pisome-navy">
        {t("search.title")}
      </h1>
      <ViewToggle
        view={view}
        onChange={setView}
        listLabel={t("search.list")}
        mapLabel={t("search.map")}
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <div
        className={cn(
          "pisome-search-layout grid",
          view === "map"
            ? "grid-cols-1 gap-0 lg:grid-cols-[0fr_minmax(0,1fr)]"
            : "grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]",
        )}
      >
        <div
          className={cn(
            "pisome-search-pane min-w-0 overflow-hidden",
            view === "map" && "pisome-search-pane-exit max-lg:hidden",
          )}
          aria-hidden={view === "map"}
        >
          <div
            className={cn(
              "relative flex min-w-0 flex-col gap-3 lg:sticky lg:top-20 lg:h-[calc(100vh-11rem)]",
              // Preserve width while the desktop grid column collapses.
              view === "map" ? "lg:w-[min(100%,24rem)]" : "w-full",
            )}
          >
            {titleAndToggle}

            <form onSubmit={onMainSearch} className="relative z-10 shrink-0">
              <LocationSearchInput
                value={mainQuery}
                tags={locations}
                catalog={catalog}
                lang={locale}
                placeholder={t("search.placeholder")}
                cityLabel={t("search.suggestionCity")}
                neighborhoodLabel={t("search.suggestionNeighborhood")}
                streetLabel={t("search.suggestionStreet")}
                onChange={setMainQuery}
                onAddTag={(tag) => {
                  const exists = locations.some(
                    (l) => l.toLowerCase() === tag.toLowerCase(),
                  );
                  if (exists) return;
                  applyLocations([...locations, tag]);
                }}
                onRemoveTag={(tag) => {
                  applyLocations(
                    locations.filter(
                      (l) => l.toLowerCase() !== tag.toLowerCase(),
                    ),
                  );
                }}
              />
            </form>

            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" />
                <span className="truncate">{t("search.searchFilters")}</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-w-0 flex-1"
                onClick={saveSearch}
                disabled={!canSaveSearch}
                title={
                  canSaveSearch ? undefined : t("search.saveSearchDisabled")
                }
              >
                <Bookmark className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {saveMsg ?? t("search.saveSearch")}
                </span>
              </Button>
            </div>

            <p className="shrink-0 text-sm text-pisome-muted">
              {t("search.results", { count: visibleListings.length })}
              {pending ? "…" : ""}
            </p>

            <div
              className={cn(
                "pisome-scroll-hidden min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-1 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                view === "split"
                  ? "opacity-100"
                  : "pointer-events-none h-0 grow-0 opacity-0",
              )}
            >
              <ListingResults
                listings={visibleListings}
                layout="stack"
                hoveredSlug={hoveredSlug}
                selectedSlug={selectedSlug}
                onHover={setHoveredSlug}
                emptyLabel={
                  listings.length > 0
                    ? t("search.noResultsInMap")
                    : t("search.noResults")
                }
              />
            </div>

            <SearchFiltersPanel
              open={filtersOpen}
              initialFilters={initialFilters}
              catalog={catalog}
              locale={locale}
              hasActiveFilters={filtersActive}
              onClose={() => setFiltersOpen(false)}
              onApply={(params) => {
                setFiltersOpen(false);
                // Keep multi-location tags unless the panel set its own location.
                if (!params.get("q") && locations.length) {
                  params.set("locations", locations.join("|"));
                } else {
                  params.delete("locations");
                }
                navigateSearch(params);
              }}
              onClear={() => {
                setFiltersOpen(false);
                setLocations([]);
                navigateSearch(new URLSearchParams());
              }}
            />
          </div>
        </div>

        <div
          className={cn(
            "relative flex min-w-0 flex-col gap-3 transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            view === "map"
              ? "h-[calc(100vh-8rem)]"
              : "h-[calc(100vh-11rem)] lg:sticky lg:top-20",
          )}
        >
          {view === "map" && (
            <div className="pointer-events-none absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
              <div className="pointer-events-auto animate-[fade-up_0.35s_ease-out]">
                <ViewToggle
                  view={view}
                  onChange={setView}
                  listLabel={t("search.list")}
                  mapLabel={t("search.map")}
                />
              </div>
            </div>
          )}

          <div className="pisome-search-stage relative min-h-0 flex-1">
            <div
              className={cn(
                "absolute inset-0",
                view === "list"
                  ? "pointer-events-none z-0 translate-y-1 opacity-0"
                  : "z-10 translate-y-0 opacity-100",
              )}
              aria-hidden={view === "list"}
            >
              <SearchMap
                listings={mapListings}
                locale={locale}
                selectedLocations={locations}
                selectedId={
                  visibleListings.find((l) => l.slug === selectedSlug)?.id ??
                  null
                }
                hoveredId={
                  listings.find((l) => l.slug === hoveredSlug)?.id ?? null
                }
                onSelect={(slug) => {
                  setSelectedSlug(slug);
                }}
                onOpenListing={(slug) => {
                  router.push(`/listings/${slug}`);
                }}
                onBoundsChange={(bounds) => {
                  startTransition(() => setMapBounds(bounds));
                }}
              />
            </div>

            <div
              className={cn(
                "pisome-scroll-hidden absolute inset-0 overflow-y-auto overflow-x-hidden px-1.5 py-1",
                view === "list"
                  ? "z-10 translate-y-0 opacity-100"
                  : "pointer-events-none z-0 translate-y-1 opacity-0",
              )}
              aria-hidden={view !== "list"}
            >
              <ListingResults
                listings={listings}
                layout="row"
                hoveredSlug={hoveredSlug}
                selectedSlug={selectedSlug}
                onHover={setHoveredSlug}
                emptyLabel={t("search.noResults")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
