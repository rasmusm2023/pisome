import { SearchExperience } from "@/components/search/search-experience";
import { searchListings } from "@/lib/listings";
import type { PropertyType } from "@/lib/types";
import { setRequestLocale } from "next-intl/server";

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const get = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const listings = await searchListings({
    purpose: "SALE",
    q: get("q"),
    city: get("city"),
    minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
    maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
    minRooms: get("minRooms") ? Number(get("minRooms")) : undefined,
    minAreaM2: get("minAreaM2") ? Number(get("minAreaM2")) : undefined,
    propertyType: get("propertyType") as PropertyType | undefined,
    hasParking: get("hasParking") === "1",
    isNewBuild: get("isNewBuild") === "1",
    sort: (get("sort") as "featured" | "price_asc" | "price_desc") ?? "featured",
  });

  return (
    <SearchExperience
      listings={listings}
      initialFilters={{
        q: get("q"),
        city: get("city"),
        minPrice: get("minPrice"),
        maxPrice: get("maxPrice"),
        minRooms: get("minRooms"),
        propertyType: get("propertyType"),
        sort: get("sort"),
        hasParking: get("hasParking"),
        isNewBuild: get("isNewBuild"),
      }}
    />
  );
}
