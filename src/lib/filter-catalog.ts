export type FilterCatalogItem = {
  price: number;
  areaM2: number;
  rooms: number;
  bathrooms: number;
  city: string;
  neighborhood: string;
  address: string;
  title: string;
  propertyType: string;
  energyCert: string;
  hasParking: boolean;
  hasElevator: boolean;
  hasTerrace: boolean;
  hasPool: boolean;
  isNewBuild: boolean;
};

/** Client-safe catalog matching — no Prisma / Node APIs. */
export function countCatalogMatches(
  catalog: FilterCatalogItem[],
  filters: {
    q?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minPricePerM2?: number;
    maxPricePerM2?: number;
    rooms?: number[];
    bathrooms?: number[];
    minRooms?: number;
    minBathrooms?: number;
    minAreaM2?: number;
    maxAreaM2?: number;
    propertyType?: string;
    propertyTypes?: string[];
    energyCert?: string;
    isNewBuild?: boolean;
    hasParking?: boolean;
    hasElevator?: boolean;
    hasTerrace?: boolean;
    hasPool?: boolean;
  },
) {
  const q = filters.q?.trim().toLowerCase();
  const city = filters.city?.trim().toLowerCase();
  const types = filters.propertyTypes?.length
    ? filters.propertyTypes
    : filters.propertyType
      ? [filters.propertyType]
      : [];

  return catalog.filter((item) => {
    if (city && !item.city.toLowerCase().includes(city)) return false;
    if (q) {
      const hay =
        `${item.title} ${item.address} ${item.neighborhood} ${item.city}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.minPrice != null && item.price < filters.minPrice) return false;
    if (filters.maxPrice != null && item.price > filters.maxPrice) return false;

    if (filters.rooms?.length) {
      const ok = filters.rooms.some((r) =>
        r >= 4 ? item.rooms >= 4 : item.rooms === r,
      );
      if (!ok) return false;
    } else if (filters.minRooms != null && item.rooms < filters.minRooms) {
      return false;
    }

    if (filters.bathrooms?.length) {
      const ok = filters.bathrooms.some((b) =>
        b >= 3 ? item.bathrooms >= 3 : item.bathrooms === b,
      );
      if (!ok) return false;
    } else if (
      filters.minBathrooms != null &&
      item.bathrooms < filters.minBathrooms
    ) {
      return false;
    }

    if (filters.minAreaM2 != null && item.areaM2 < filters.minAreaM2) {
      return false;
    }
    if (filters.maxAreaM2 != null && item.areaM2 > filters.maxAreaM2) {
      return false;
    }
    if (types.length && !types.includes(item.propertyType)) return false;
    if (filters.energyCert && item.energyCert !== filters.energyCert) {
      return false;
    }
    if (filters.isNewBuild && !item.isNewBuild) return false;
    if (filters.hasParking && !item.hasParking) return false;
    if (filters.hasElevator && !item.hasElevator) return false;
    if (filters.hasTerrace && !item.hasTerrace) return false;
    if (filters.hasPool && !item.hasPool) return false;

    if (item.areaM2 > 0) {
      const ppm = item.price / item.areaM2;
      if (filters.minPricePerM2 != null && ppm < filters.minPricePerM2) {
        return false;
      }
      if (filters.maxPricePerM2 != null && ppm > filters.maxPricePerM2) {
        return false;
      }
    } else if (
      filters.minPricePerM2 != null ||
      filters.maxPricePerM2 != null
    ) {
      return false;
    }

    return true;
  }).length;
}
