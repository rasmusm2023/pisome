import { SearchExperience } from "@/components/search/search-experience";
import {
  getFilterCatalog,
  searchListings,
  type ListingSort,
} from "@/lib/listings";
import type { PropertyType } from "@/lib/types";
import { setRequestLocale } from "next-intl/server";

function parseCsv(value?: string) {
  return value
    ? value
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean)
    : [];
}

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

  const rooms = parseCsv(get("rooms")).map(Number).filter((n) => !Number.isNaN(n));
  const bathrooms = parseCsv(get("bathrooms"))
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  const propertyTypes = parseCsv(get("propertyTypes")) as PropertyType[];
  const legacyType = get("propertyType") as PropertyType | undefined;

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
      rooms: rooms.length ? rooms : undefined,
      bathrooms: bathrooms.length ? bathrooms : undefined,
      minRooms:
        !rooms.length && get("minRooms")
          ? Number(get("minRooms"))
          : undefined,
      minBathrooms:
        !bathrooms.length && get("minBathrooms")
          ? Number(get("minBathrooms"))
          : undefined,
      minAreaM2: get("minAreaM2") ? Number(get("minAreaM2")) : undefined,
      maxAreaM2: get("maxAreaM2") ? Number(get("maxAreaM2")) : undefined,
      propertyTypes: propertyTypes.length
        ? propertyTypes
        : legacyType
          ? [legacyType]
          : undefined,
      energyCert: get("energyCert"),
      hasParking: get("hasParking") === "1",
      hasElevator: get("hasElevator") === "1",
      hasTerrace: get("hasTerrace") === "1",
      hasPool: get("hasPool") === "1",
      isNewBuild: get("isNewBuild") === "1",
      sort: (get("sort") as ListingSort) ?? "featured",
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
        rooms: get("rooms"),
        bathrooms: get("bathrooms"),
        minRooms: get("minRooms"),
        minBathrooms: get("minBathrooms"),
        minAreaM2: get("minAreaM2"),
        maxAreaM2: get("maxAreaM2"),
        propertyTypes: get("propertyTypes"),
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
