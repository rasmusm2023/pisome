import "server-only";

import { Prisma } from "@prisma/client";
import type { ListingPurpose, PropertyType } from "@/lib/types";
import type { FilterCatalogItem } from "@/lib/filter-catalog";
import { prisma } from "./db";

export type { FilterCatalogItem } from "@/lib/filter-catalog";
export type ListingSort =
  | "featured"
  | "price_asc"
  | "price_desc"
  | "newest"
  | "oldest"
  | "area_asc"
  | "area_desc"
  | "ppm_asc"
  | "ppm_desc";

export type ListingFilters = {
  purpose?: ListingPurpose;
  city?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minPricePerM2?: number;
  maxPricePerM2?: number;
  /** Exact room counts; "4" means 4+ */
  rooms?: number[];
  /** Exact bathroom counts; "3" means 3+ */
  bathrooms?: number[];
  minRooms?: number;
  minBathrooms?: number;
  minAreaM2?: number;
  maxAreaM2?: number;
  propertyType?: PropertyType;
  propertyTypes?: PropertyType[];
  energyCert?: string;
  isNewBuild?: boolean;
  hasParking?: boolean;
  hasElevator?: boolean;
  hasTerrace?: boolean;
  hasPool?: boolean;
  sort?: ListingSort;
};

export async function searchListings(filters: ListingFilters = {}) {
  const where: Prisma.ListingWhereInput = {
    status: "LIVE",
    purpose: filters.purpose ?? "SALE",
  };
  const and: Prisma.ListingWhereInput[] = [];

  if (filters.city) {
    where.city = { contains: filters.city };
  }
  if (filters.q) {
    and.push({
      OR: [
        { title: { contains: filters.q } },
        { neighborhood: { contains: filters.q } },
        { city: { contains: filters.q } },
        { address: { contains: filters.q } },
      ],
    });
  }
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }

  const rooms = filters.rooms?.length
    ? filters.rooms
    : filters.minRooms != null
      ? null
      : undefined;
  if (rooms && rooms.length > 0) {
    const exact = rooms.filter((r) => r < 4);
    const hasFourPlus = rooms.some((r) => r >= 4);
    const roomOr: Prisma.ListingWhereInput[] = [];
    if (exact.length) roomOr.push({ rooms: { in: exact } });
    if (hasFourPlus) roomOr.push({ rooms: { gte: 4 } });
    if (roomOr.length) and.push({ OR: roomOr });
  } else if (filters.minRooms != null) {
    where.rooms = { gte: filters.minRooms };
  }

  const bathrooms = filters.bathrooms?.length
    ? filters.bathrooms
    : filters.minBathrooms != null
      ? null
      : undefined;
  if (bathrooms && bathrooms.length > 0) {
    const exact = bathrooms.filter((b) => b < 3);
    const hasThreePlus = bathrooms.some((b) => b >= 3);
    const bathOr: Prisma.ListingWhereInput[] = [];
    if (exact.length) bathOr.push({ bathrooms: { in: exact } });
    if (hasThreePlus) bathOr.push({ bathrooms: { gte: 3 } });
    if (bathOr.length) and.push({ OR: bathOr });
  } else if (filters.minBathrooms != null) {
    where.bathrooms = { gte: filters.minBathrooms };
  }

  if (filters.minAreaM2 != null || filters.maxAreaM2 != null) {
    where.areaM2 = {};
    if (filters.minAreaM2 != null) where.areaM2.gte = filters.minAreaM2;
    if (filters.maxAreaM2 != null) where.areaM2.lte = filters.maxAreaM2;
  }

  const types = filters.propertyTypes?.length
    ? filters.propertyTypes
    : filters.propertyType
      ? [filters.propertyType]
      : [];
  if (types.length === 1) where.propertyType = types[0];
  else if (types.length > 1) where.propertyType = { in: types };

  if (filters.energyCert) where.energyCert = filters.energyCert;
  if (filters.isNewBuild) where.isNewBuild = true;
  if (filters.hasParking) where.hasParking = true;
  if (filters.hasElevator) where.hasElevator = true;
  if (filters.hasTerrace) where.hasTerrace = true;
  if (filters.hasPool) where.hasPool = true;
  if (and.length) where.AND = and;

  const needsPricePerM2 =
    filters.minPricePerM2 != null ||
    filters.maxPricePerM2 != null ||
    filters.sort === "ppm_asc" ||
    filters.sort === "ppm_desc";

  let orderBy: Prisma.ListingOrderByWithRelationInput[] = [
    { featured: "desc" },
    { packageTier: "desc" },
    { publishedAt: "desc" },
  ];
  if (filters.sort === "price_asc") orderBy = [{ price: "asc" }];
  if (filters.sort === "price_desc") orderBy = [{ price: "desc" }];
  if (filters.sort === "newest") orderBy = [{ publishedAt: "desc" }];
  if (filters.sort === "oldest") orderBy = [{ publishedAt: "asc" }];
  if (filters.sort === "area_asc") orderBy = [{ areaM2: "asc" }];
  if (filters.sort === "area_desc") orderBy = [{ areaM2: "desc" }];

  let listings = await prisma.listing.findMany({
    where,
    include: {
      media: { orderBy: { sortOrder: "asc" }, take: 5 },
      organization: true,
      agent: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy,
  });

  if (filters.minPricePerM2 != null || filters.maxPricePerM2 != null) {
    listings = listings.filter((listing) => {
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

  if (filters.sort === "ppm_asc" || filters.sort === "ppm_desc") {
    const dir = filters.sort === "ppm_asc" ? 1 : -1;
    listings = [...listings].sort((a, b) => {
      const ap = a.areaM2 > 0 ? a.price / a.areaM2 : 0;
      const bp = b.areaM2 > 0 ? b.price / b.areaM2 : 0;
      return (ap - bp) * dir;
    });
  } else if (needsPricePerM2 && !filters.sort?.startsWith("ppm")) {
    /* already filtered above when needed */
  }

  return listings;
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
