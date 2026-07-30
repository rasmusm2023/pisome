import { SearchExperience } from "@/components/search/search-experience";
import { getFilterCatalog, searchListings } from "@/lib/listings";
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

  const [listings, catalog] = await Promise.all([
    searchListings({
      purpose: "SALE",
      q: get("q"),
      city: get("city"),
      minPrice: get("minPrice") ? Number(get("minPrice")) : undefined,
      maxPrice: get("maxPrice") ? Number(get("maxPrice")) : undefined,
      minPricePerM2: get("minPricePerM2")
        ? Number(get("minPricePerM2"))
        : undefined,
      maxPricePerM2: get("maxPricePerM2")
        ? Number(get("maxPricePerM2"))
        : undefined,
      minRooms: get("minRooms") ? Number(get("minRooms")) : undefined,
      minBathrooms: get("minBathrooms")
        ? Number(get("minBathrooms"))
        : undefined,
      minAreaM2: get("minAreaM2") ? Number(get("minAreaM2")) : undefined,
      maxAreaM2: get("maxAreaM2") ? Number(get("maxAreaM2")) : undefined,
      propertyType: get("propertyType") as PropertyType | undefined,
      energyCert: get("energyCert"),
      hasParking: get("hasParking") === "1",
      hasElevator: get("hasElevator") === "1",
      hasTerrace: get("hasTerrace") === "1",
      hasPool: get("hasPool") === "1",
      isNewBuild: get("isNewBuild") === "1",
      sort: (get("sort") as "featured" | "price_asc" | "price_desc") ?? "featured",
    }),
    getFilterCatalog(),
  ]);

  return (
    <SearchExperience
      listings={listings}
      catalog={catalog}
      initialFilters={{
        q: get("q"),
        city: get("city"),
        minPrice: get("minPrice"),
        maxPrice: get("maxPrice"),
        minPricePerM2: get("minPricePerM2"),
        maxPricePerM2: get("maxPricePerM2"),
        minRooms: get("minRooms"),
        minBathrooms: get("minBathrooms"),
        minAreaM2: get("minAreaM2"),
        maxAreaM2: get("maxAreaM2"),
        propertyType: get("propertyType"),
        energyCert: get("energyCert"),
        sort: get("sort"),
        hasParking: get("hasParking"),
        hasElevator: get("hasElevator"),
        hasTerrace: get("hasTerrace"),
        hasPool: get("hasPool"),
        isNewBuild: get("isNewBuild"),
      }}
    />
  );
}
