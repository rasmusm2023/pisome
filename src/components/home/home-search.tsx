"use client";

import { LocationSearchInput } from "@/components/search/location-search-input";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import type { FilterCatalogItem } from "@/lib/filter-catalog";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormEvent, useState } from "react";

const TYPE_CHIPS = ["APARTMENT", "HOUSE", "VILLA", "PENTHOUSE"] as const;

export function HomeSearch({ catalog }: { catalog: FilterCatalogItem[] }) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [purpose, setPurpose] = useState<"buy" | "rent">("buy");

  function go(raw: string) {
    const value = raw.trim();
    const params = new URLSearchParams();
    if (value) params.set("locations", value);
    router.push(params.size ? `/search?${params.toString()}` : "/search");
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (purpose === "rent") return;
    go(query);
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl">
      <div className="mb-4 inline-flex rounded-full bg-white/15 p-1 ring-1 ring-white/25 backdrop-blur-md">
        <button
          type="button"
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition",
            purpose === "buy"
              ? "bg-white text-pisome-navy shadow-sm"
              : "text-white/80 hover:text-white",
          )}
          onClick={() => setPurpose("buy")}
        >
          {t("nav.buy")}
        </button>
        <button
          type="button"
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition",
            purpose === "rent"
              ? "bg-white text-pisome-navy shadow-sm"
              : "text-white/80 hover:text-white",
          )}
          onClick={() => setPurpose("rent")}
        >
          {t("nav.rent")}
        </button>
      </div>

      {purpose === "rent" ? (
        <div className="rounded-2xl bg-white/95 px-5 py-4 text-sm font-medium text-pisome-navy shadow-2xl shadow-black/20">
          {t("home.rentSoon")}
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/25 sm:flex-row sm:items-center">
            <LocationSearchInput
              className="min-w-0 flex-1"
              fieldClassName="min-h-12 border-0 bg-transparent px-3 shadow-none ring-0 focus-within:border-transparent focus-within:ring-0"
              catalog={catalog}
              value={query}
              onChange={setQuery}
              onSelectSuggestion={(suggestion) => go(suggestion.label)}
              placeholder={t("search.placeholder")}
              cityLabel={t("search.suggestionCity")}
              neighborhoodLabel={t("search.suggestionNeighborhood")}
              streetLabel={t("search.suggestionStreet")}
              lang={locale}
            />
            <Button type="submit" size="lg" className="h-12 shrink-0 sm:min-w-40">
              <Search className="h-4 w-4" />
              {t("home.showHomes")}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {TYPE_CHIPS.map((type) => (
              <Link
                key={type}
                href={`/search?propertyTypes=${type}`}
                className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm transition hover:bg-white/25"
              >
                {t(`propertyTypes.${type}`)}
              </Link>
            ))}
            <Link
              href="/search"
              className="rounded-full px-3 py-1 text-xs font-semibold text-white/80 underline-offset-2 hover:text-white hover:underline"
            >
              {t("home.browseAll")}
            </Link>
          </div>
        </>
      )}
    </form>
  );
}
