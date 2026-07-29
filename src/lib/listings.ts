import { Prisma } from "@prisma/client";
import type { ListingPurpose, PropertyType } from "@/lib/types";
import { prisma } from "./db";

export type ListingFilters = {
  purpose?: ListingPurpose;
  city?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  minAreaM2?: number;
  propertyType?: PropertyType;
  energyCert?: string;
  isNewBuild?: boolean;
  hasParking?: boolean;
  sort?: "featured" | "price_asc" | "price_desc";
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
  if (filters.minAreaM2 != null) where.areaM2 = { gte: filters.minAreaM2 };
  if (filters.propertyType) where.propertyType = filters.propertyType;
  if (filters.energyCert) where.energyCert = filters.energyCert;
  if (filters.isNewBuild) where.isNewBuild = true;
  if (filters.hasParking) where.hasParking = true;

  let orderBy: Prisma.ListingOrderByWithRelationInput[] = [
    { featured: "desc" },
    { packageTier: "desc" },
    { publishedAt: "desc" },
  ];
  if (filters.sort === "price_asc") orderBy = [{ price: "asc" }];
  if (filters.sort === "price_desc") orderBy = [{ price: "desc" }];

  return prisma.listing.findMany({
    where,
    include: {
      media: { orderBy: { sortOrder: "asc" }, take: 5 },
      organization: true,
      agent: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy,
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
    title: string;
    titleEn: string | null;
  },
>(listing: T, locale: string) {
  return {
    ...listing,
    displayTitle: locale === "en" && listing.titleEn ? listing.titleEn : listing.title,
    cover: listing.media[0]?.url ?? "/images/placeholder-home.jpg",
  };
}
