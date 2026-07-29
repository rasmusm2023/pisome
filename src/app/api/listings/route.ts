import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MIN_PHOTOS, slugify } from "@/lib/utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const listingSchema = z.object({
  title: z.string().min(3),
  titleEn: z.string().optional(),
  description: z.string().min(20),
  descriptionEn: z.string().optional(),
  propertyType: z.enum([
    "APARTMENT",
    "HOUSE",
    "VILLA",
    "PENTHOUSE",
    "STUDIO",
    "TOWNHOUSE",
    "LAND",
    "OTHER",
  ]),
  price: z.number().int().positive(),
  rooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  areaM2: z.number().int().positive(),
  floor: z.number().int().optional(),
  yearBuilt: z.number().int().optional(),
  energyCert: z.enum(["A", "B", "C", "D", "E", "F", "G", "PENDING"]).optional(),
  hasElevator: z.boolean().optional(),
  hasParking: z.boolean().optional(),
  hasTerrace: z.boolean().optional(),
  hasPool: z.boolean().optional(),
  isNewBuild: z.boolean().optional(),
  address: z.string().min(3),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  province: z.string().min(2),
  postalCode: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  mediaUrls: z.array(z.string().url()).min(1),
  publish: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const listings = await prisma.listing.findMany({
    where: { agentId: session.user.id },
    include: {
      media: { orderBy: { sortOrder: "asc" }, take: 1 },
      _count: { select: { inquiries: true, savedHomes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(listings);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "AGENT" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = listingSchema.parse(await req.json());
  const publish = Boolean(body.publish);
  if (publish && body.mediaUrls.length < MIN_PHOTOS) {
    return NextResponse.json(
      { error: `Need at least ${MIN_PHOTOS} photos to publish` },
      { status: 400 },
    );
  }

  const baseSlug = slugify(`${body.title}-${body.city}`);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const listing = await prisma.listing.create({
    data: {
      slug,
      title: body.title,
      titleEn: body.titleEn,
      description: body.description,
      descriptionEn: body.descriptionEn,
      purpose: "SALE",
      propertyType: body.propertyType,
      status: publish ? "LIVE" : "DRAFT",
      price: body.price,
      rooms: body.rooms,
      bathrooms: body.bathrooms,
      areaM2: body.areaM2,
      floor: body.floor,
      yearBuilt: body.yearBuilt,
      energyCert: body.energyCert ?? "PENDING",
      hasElevator: body.hasElevator ?? false,
      hasParking: body.hasParking ?? false,
      hasTerrace: body.hasTerrace ?? false,
      hasPool: body.hasPool ?? false,
      isNewBuild: body.isNewBuild ?? false,
      address: body.address,
      neighborhood: body.neighborhood,
      city: body.city,
      province: body.province,
      postalCode: body.postalCode,
      lat: body.lat,
      lng: body.lng,
      publishedAt: publish ? new Date() : null,
      agentId: session.user.id,
      organizationId: session.user.organizationId,
      media: {
        create: body.mediaUrls.map((url, i) => ({
          url,
          sortOrder: i,
          alt: `${body.title} ${i + 1}`,
        })),
      },
    },
    include: { media: true },
  });

  return NextResponse.json(listing, { status: 201 });
}
