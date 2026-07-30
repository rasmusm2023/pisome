import { Prisma } from "@prisma/client";
import type { ListingPurpose, PropertyType } from "@/lib/types";
import { prisma } from "./db";

export type ListingFilters = {
  purpose?: ListingPurpose;
  city?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minPricePerM2?: number;
  maxPricePerM2?: number;
  minRooms?: number;
  minBathrooms?: number;
  minAreaM2?: number;
  maxAreaM2?: number;
  propertyType?: PropertyType;
  energyCert?: string;
  isNewBuild?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasTerrace?: boolean;
  hasPool?: boolean;
  sort?: "featured" | "price_asc" | "price_desc";
};

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

export async function searchListings(filters: ListingFilters = {}) {
  const where: Prisma.ListingWhereInput = {
    status: "LIVE",
    purpose: filters.purpose ?? "SALE",
  };

  if (filters.city) {
    where.city = { contains: filters.city };
  }
  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q } },
      { neighborhood: { contains: filters.q } },
      { city: { contains: filters.q } },
      { address: { contains: filters.q } },
    ];
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }
  if (filters.minRooms != null) where.rooms = { gte: filters.minRooms };
  if (filters.minBathrooms != null) {
    where.bathrooms = { gte: filters.minBathrooms };
  }
  if (filters.minAreaM2 != null || filters.maxAreaM2 != null) {
    where.areaM2 = {};
    if (filters.minAreaM2 != null) where.areaM2.gte = filters.minAreaM2;
    if (filters.maxAreaM2 != null) where.areaM2.lte = filters.maxAreaM2;
  }
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.energyCert) where.energyCert = filters.energyCert;
  if (filters.isNewBuild) where.isNewBuild = true;
  if (filters.hasParking) where.hasParking = true;
  if (filters.hasElevator) where.hasElevator = true;
  if (filters.hasTerrace) where.hasTerrace = true;
  if (filters.hasPool) where.hasPool = true;

  // SQLite/Prisma can't filter on computed €/m² easily — apply after fetch when set
  const needsPricePerM2 =
    filters.minPricePerM2 != null || filters.maxPricePerM2 != null;

  let orderBy: Prisma.ListingOrderByWithRelationInput[] = [
    { featured: "desc" },
    { packageTier: "desc" },
    { publishedAt: "desc" },
  ];
  if (filters.sort === "price_asc") orderBy = [{ price: "asc" }];
  if (filters.sort === "price_desc") orderBy = [{ price: "desc" }];

  const listings = await prisma.listing.findMany({
    where,
    include: {
      media: { orderBy: { sortOrder: "asc" }, take: 5 },
      organization: true,
      agent: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy,
  });

  if (!needsPricePerM2) return listings;

  return listings.filter((listing) => {
    if (listing.areaM2 <= 0) return false;
    const ppm = listing.price / listing.areaM2;
    if (filters.minPricePerM2 != null && ppm < filters.minPricePerM2) {
      return false;
    }
    if (filters.maxPricePerM2 != null && ppm > filters.maxPricePerM2) {
      return false;
    }
    return true;
  });
}

export async function getFilterCatalog(): Promise<FilterCatalogItem[]> {
  return prisma.listing.findMany({
    where: { status: "LIVE", purpose: "SALE" },
    select: {
      price: true,
      areaM2: true,
      rooms: true,
      bathrooms: true,
      city: true,
      neighborhood: true,
      address: true,
      title: true,
      propertyType: true,
      energyCert: true,
      hasParking: true,
      hasElevator: true,
      hasTerrace: true,
      hasPool: true,
      isNewBuild: true,
    },
  });
}

export function countCatalogMatches(
  catalog: FilterCatalogItem[],
  filters: {
    q?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    minPricePerM2?: number;
    maxPricePerM2?: number;
    minRooms?: number;
    minBathrooms?: number;
    minAreaM2?: number;
    maxAreaM2?: number;
    propertyType?: string;
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

  return catalog.filter((item) => {
    if (city && !item.city.toLowerCase().includes(city)) return false;
    if (q) {
      const hay = `${item.title} ${item.address} ${item.neighborhood} ${item.city}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.minPrice != null && item.price < filters.minPrice) return false;
    if (filters.maxPrice != null && item.price > filters.maxPrice) return false;
    if (filters.minRooms != null && item.rooms < filters.minRooms) return false;
    if (filters.minBathrooms != null && item.bathrooms < filters.minBathrooms) {
      return false;
    }
    if (filters.minAreaM2 != null && item.areaM2 < filters.minAreaM2) {
      return false;
    }
    if (filters.maxAreaM2 != null && item.areaM2 > filters.maxAreaM2) {
      return false;
    }
    if (filters.propertyType && item.propertyType !== filters.propertyType) {
      return false;
    }
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

export async function getListingBySlug(slug: string) {
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      organization: true,
      agent: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (listing && listing.status === "LIVE") {
    await prisma.listing.update({
      where: { id: listing.id },
      data: { views: { increment: 1 } },
    });
  }

  return listing;
}

export async function getPriceContext(listing: {
  id: string;
  city: string;
  neighborhood: string;
  propertyType: string;
  areaM2: number;
  price: number;
}) {
  const comps = await prisma.listing.findMany({
    where: {
      status: "LIVE",
      purpose: "SALE",
      city: listing.city,
      propertyType: listing.propertyType,
      id: { not: listing.id },
    },
    select: { price: true, areaM2: true, neighborhood: true },
    take: 20,
  });

  if (comps.length === 0) {
    return {
      avgPricePerM2: Math.round(listing.price / listing.areaM2),
      sampleSize: 0,
      deltaPercent: 0,
    };
  }

  const avg =
    comps.reduce((sum, c) => sum + c.price / c.areaM2, 0) / comps.length;
  const current = listing.price / listing.areaM2;
  const deltaPercent = Math.round(((current - avg) / avg) * 100);

  return {
    avgPricePerM2: Math.round(avg),
    sampleSize: comps.length,
    deltaPercent,
  };
}

export function listingCardData<
  T extends {
    media: { url: string; alt: string | null }[];
    address: string;
  },
>(listing: T, _locale: string) {
  return {
    ...listing,
    displayTitle: listing.address,
    cover: listing.media[0]?.url ?? "/images/placeholder-home.jpg",
  };
}
