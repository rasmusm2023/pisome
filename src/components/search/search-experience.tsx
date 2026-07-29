"use client";

import { ListingCard } from "@/components/listings/listing-card";
import { SearchMap, type MapListing } from "@/components/search/search-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Link, useRouter } from "@/i18n/navigation";
import type { Listing, ListingMedia } from "@prisma/client";
import { Bell, List, Map as MapIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

type ListingResult = Listing & { media: ListingMedia[] };

export function SearchExperience({
  listings,
  initialFilters,
}: {
  listings: ListingResult[];
  initialFilters: Record<string, string | undefined>;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<"split" | "list" | "map">("split");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

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
      })),
    [listings, locale],
  );

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();
    const keys = [
      "q",
      "city",
      "minPrice",
      "maxPrice",
      "minRooms",
      "minAreaM2",
      "propertyType",
      "sort",
    ];
    keys.forEach((key) => {
      const value = String(formData.get(key) ?? "").trim();
      if (value) params.set(key, value);
    });
    if (formData.get("hasParking")) params.set("hasParking", "1");
    if (formData.get("isNewBuild")) params.set("isNewBuild", "1");

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  async function createAlert() {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: initialFilters.city || initialFilters.q || "Pisome alert",
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
    setAlertMsg(res.ok ? "✓" : "!");
    setTimeout(() => setAlertMsg(null), 2000);
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-pisome-navy">
            {t("search.title")}
          </h1>
          <p className="mt-1 text-sm text-pisome-muted">
            {t("search.results", { count: listings.length })}
            {pending ? "…" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={createAlert}>
            <Bell className="h-4 w-4" />
            {alertMsg ?? t("cta.createAlert")}
          </Button>
          <div className="flex rounded-xl border border-pisome-border bg-white p-1">
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view !== "map" ? "bg-pisome-alice text-pisome-navy" : "text-pisome-muted"}`}
              onClick={() => setView(view === "map" ? "split" : "list")}
            >
              <List className="mr-1 inline h-3.5 w-3.5" />
              {t("search.list")}
            </button>
            <button
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${view !== "list" ? "bg-pisome-alice text-pisome-navy" : "text-pisome-muted"}`}
              onClick={() => setView(view === "list" ? "split" : "map")}
            >
              <MapIcon className="mr-1 inline h-3.5 w-3.5" />
              {t("search.map")}
            </button>
          </div>
        </div>
      </div>

      <form
        action={applyFilters}
        className="grid gap-3 rounded-2xl border border-pisome-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-6"
      >
        <Input
          name="q"
          defaultValue={initialFilters.q}
          placeholder={t("search.placeholder")}
          className="lg:col-span-2"
        />
        <Select name="city" defaultValue={initialFilters.city ?? ""}>
          <option value="">{t("search.any")} city</option>
          <option value="Madrid">Madrid</option>
          <option value="Barcelona">Barcelona</option>
          <option value="Málaga">Málaga</option>
          <option value="Valencia">Valencia</option>
        </Select>
        <Input
          name="minPrice"
          type="number"
          placeholder={`${t("search.min")} €`}
          defaultValue={initialFilters.minPrice}
        />
        <Input
          name="maxPrice"
          type="number"
          placeholder={`${t("search.max")} €`}
          defaultValue={initialFilters.maxPrice}
        />
        <Select name="minRooms" defaultValue={initialFilters.minRooms ?? ""}>
          <option value="">{t("search.rooms")}</option>
          <option value="1">1+</option>
          <option value="2">2+</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
        </Select>
        <Select
          name="propertyType"
          defaultValue={initialFilters.propertyType ?? ""}
        >
          <option value="">{t("search.type")}</option>
          {Object.entries({
            APARTMENT: t("propertyTypes.APARTMENT"),
            HOUSE: t("propertyTypes.HOUSE"),
            VILLA: t("propertyTypes.VILLA"),
            PENTHOUSE: t("propertyTypes.PENTHOUSE"),
            STUDIO: t("propertyTypes.STUDIO"),
            TOWNHOUSE: t("propertyTypes.TOWNHOUSE"),
          }).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select name="sort" defaultValue={initialFilters.sort ?? "featured"}>
          <option value="featured">{t("search.sortFeatured")}</option>
          <option value="price_asc">{t("search.sortPriceAsc")}</option>
          <option value="price_desc">{t("search.sortPriceDesc")}</option>
        </Select>
        <label className="flex items-center gap-2 text-sm text-pisome-muted">
          <input
            type="checkbox"
            name="hasParking"
            defaultChecked={initialFilters.hasParking === "1"}
            className="accent-pisome-blue"
          />
          {t("search.parking")}
        </label>
        <label className="flex items-center gap-2 text-sm text-pisome-muted">
          <input
            type="checkbox"
            name="isNewBuild"
            defaultChecked={initialFilters.isNewBuild === "1"}
            className="accent-pisome-blue"
          />
          {t("search.newBuild")}
        </label>
        <Button type="submit" className="sm:col-span-2 lg:col-span-1">
          {t("nav.search")}
        </Button>
      </form>

      <div
        className={`grid gap-4 ${view === "split" ? "lg:grid-cols-[3fr_7fr]" : "grid-cols-1"}`}
      >
        {view !== "map" && (
          <div className="grid grid-cols-1 gap-4">
            {listings.length === 0 && (
              <p className="rounded-2xl border border-dashed border-pisome-border bg-white p-8 text-center text-pisome-muted">
                {t("search.noResults")}
              </p>
            )}
            {listings.map((listing) => (
              <div
                key={listing.id}
                onMouseEnter={() => setSelectedSlug(listing.slug)}
                className={
                  selectedSlug === listing.slug
                    ? "ring-2 ring-pisome-accent rounded-2xl"
                    : ""
                }
              >
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        )}
        {view !== "list" && (
          <div
            className={`flex flex-col gap-3 ${
              view === "map"
                ? "h-[calc(100vh-8rem)]"
                : "h-[calc(100vh-11rem)] lg:sticky lg:top-20"
            }`}
          >
            <div className="min-h-0 flex-1">
              <SearchMap
                listings={mapListings}
                locale={locale}
                selectedId={
                  listings.find((l) => l.slug === selectedSlug)?.id ?? null
                }
                onSelect={(slug) => {
                  setSelectedSlug(slug);
                }}
              />
            </div>
            {selectedSlug && (
              <Link href={`/listings/${selectedSlug}`}>
                <Button variant="accent" className="w-full">
                  {t("cta.viewListing")}
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
