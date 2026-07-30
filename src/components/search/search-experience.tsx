"use client";

import { ListingCard } from "@/components/listings/listing-card";
import { rememberSearchPath } from "@/components/listings/listing-toolbar";
import {
  hasAppliedFilters,
  SearchFiltersPanel,
} from "@/components/search/search-filters-panel";
import { SearchMap, type MapBounds, type MapListing, isListingInBounds } from "@/components/search/search-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FilterCatalogItem } from "@/lib/listings";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { Listing, ListingMedia } from "@prisma/client";
import {
  Bookmark,
  List,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";

type ListingResult = Listing & { media: ListingMedia[] };

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

  function onMainSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    Object.entries(initialFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    const q = String(formData.get("q") ?? "").trim();
    if (q) params.set("q", q);
    else params.delete("q");
    navigateSearch(params);
  }

  async function saveSearch() {
    if (!canSaveSearch) return;
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:
          initialFilters.q ||
          initialFilters.city ||
          t("search.saveSearchDefault"),
        city: initialFilters.city,
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

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-pisome-navy">
            {t("search.title")}
          </h1>
        </div>
        <div className="flex rounded-xl border border-pisome-border bg-white p-1">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view !== "map" ? "bg-pisome-alice text-pisome-navy" : "text-pisome-muted"}`}
            onClick={() => setView(view === "map" ? "split" : "list")}
          >
            <List className="mr-1 inline h-3.5 w-3.5" />
            {t("search.list")}
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view !== "list" ? "bg-pisome-alice text-pisome-navy" : "text-pisome-muted"}`}
            onClick={() => setView(view === "list" ? "split" : "map")}
          >
            <MapIcon className="mr-1 inline h-3.5 w-3.5" />
            {t("search.map")}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-4 transition-[grid-template-columns] duration-300 ease-out",
          view === "map" ? "grid-cols-1" : "lg:grid-cols-[2fr_3fr]",
        )}
      >
        {view !== "map" && (
          <div
            className={cn(
              "relative flex min-w-0 flex-col gap-3 overflow-hidden lg:sticky lg:top-20 lg:h-[calc(100vh-11rem)]",
            )}
          >
            <form onSubmit={onMainSearch} className="relative shrink-0">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pisome-muted"
                aria-hidden
              />
              <Input
                name="q"
                defaultValue={initialFilters.q}
                placeholder={t("search.placeholder")}
                className="pl-10"
                aria-label={t("search.placeholder")}
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

            {view === "split" && (
              <div className="pisome-scroll-hidden min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-1">
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
            )}

            <SearchFiltersPanel
              open={filtersOpen}
              initialFilters={initialFilters}
              catalog={catalog}
              locale={locale}
              hasActiveFilters={filtersActive}
              onClose={() => setFiltersOpen(false)}
              onApply={(params) => {
                setFiltersOpen(false);
                navigateSearch(params);
              }}
              onClear={() => {
                setFiltersOpen(false);
                navigateSearch(new URLSearchParams());
              }}
            />
          </div>
        )}

        <div
          className={cn(
            "flex min-w-0 flex-col gap-3 transition-opacity duration-300 ease-out",
            view === "map"
              ? "h-[calc(100vh-8rem)]"
              : "h-[calc(100vh-11rem)] lg:sticky lg:top-20",
          )}
        >
          {view === "list" ? (
            <div
              key="list-pane"
              className="pisome-scroll-hidden min-h-0 flex-1 animate-[fade-up_0.35s_ease-out] overflow-y-auto overflow-x-hidden px-1.5 py-1"
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
          ) : (
            <div
              key="map-pane"
              className="min-h-0 flex-1 animate-[fade-up_0.35s_ease-out]"
            >
              <SearchMap
                listings={mapListings}
                locale={locale}
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
          )}
        </div>
      </div>
    </div>
  );
}
