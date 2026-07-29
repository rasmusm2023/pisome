import { PrismaClient } from "@prisma/client";
import type { PackageTier, PropertyType } from "../src/lib/types";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const photos = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1400&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1400&q=80",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cd00?w=1400&q=80",
  "https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=1400&q=80",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=80",
];

type SeedListing = {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  propertyType: PropertyType;
  price: number;
  rooms: number;
  bathrooms: number;
  areaM2: number;
  floor?: number;
  yearBuilt?: number;
  energyCert: "A" | "B" | "C" | "D" | "E";
  hasElevator?: boolean;
  hasParking?: boolean;
  hasTerrace?: boolean;
  hasPool?: boolean;
  isNewBuild?: boolean;
  address: string;
  neighborhood: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
  packageTier?: PackageTier;
  featured?: boolean;
  photoOffset?: number;
};

const listings: SeedListing[] = [
  {
    slug: "atico-luminoso-salamanca-madrid",
    title: "Ático luminoso en Salamanca",
    titleEn: "Bright penthouse in Salamanca",
    description:
      "Ático reformado con terraza privada y vistas abiertas. Cocina abierta, suelos de roble y mucha luz natural. Ideal para quienes buscan tranquilidad en el centro de Madrid.",
    descriptionEn:
      "Renovated penthouse with a private terrace and open views. Open kitchen, oak floors and abundant natural light. Ideal if you want calm in central Madrid.",
    propertyType: "PENTHOUSE",
    price: 895000,
    rooms: 3,
    bathrooms: 2,
    areaM2: 128,
    floor: 6,
    yearBuilt: 1978,
    energyCert: "C",
    hasElevator: true,
    hasTerrace: true,
    address: "Calle de Serrano 84",
    neighborhood: "Salamanca",
    city: "Madrid",
    province: "Madrid",
    lat: 40.4312,
    lng: -3.6871,
    packageTier: "PREMIUM",
    featured: true,
  },
  {
    slug: "piso-moderno-malasana-madrid",
    title: "Piso moderno en Malasaña",
    titleEn: "Modern flat in Malasaña",
    description:
      "Vivienda totalmente renovada cerca de Plaza de España. Espacios diáfanos, balcón y excelentes comunicaciones en metro.",
    descriptionEn:
      "Fully renovated home near Plaza de España. Open-plan spaces, balcony and excellent metro links.",
    propertyType: "APARTMENT",
    price: 475000,
    rooms: 2,
    bathrooms: 1,
    areaM2: 78,
    floor: 3,
    yearBuilt: 1955,
    energyCert: "D",
    hasElevator: true,
    address: "Calle del Pez 12",
    neighborhood: "Malasaña",
    city: "Madrid",
    province: "Madrid",
    lat: 40.4255,
    lng: -3.7048,
    packageTier: "PLUS",
    photoOffset: 1,
  },
  {
    slug: "casa-con-jardin-chamartin-madrid",
    title: "Casa con jardín en Chamartín",
    titleEn: "House with garden in Chamartín",
    description:
      "Chalet adosado con jardín privado, garaje y zona de estar exterior. Perfecto para familias que buscan espacio sin alejarse de la ciudad.",
    descriptionEn:
      "Townhouse with private garden, garage and outdoor living. Perfect for families who want space without leaving the city.",
    propertyType: "TOWNHOUSE",
    price: 1120000,
    rooms: 4,
    bathrooms: 3,
    areaM2: 210,
    yearBuilt: 1998,
    energyCert: "B",
    hasParking: true,
    hasTerrace: true,
    address: "Calle de Colombia 22",
    neighborhood: "Chamartín",
    city: "Madrid",
    province: "Madrid",
    lat: 40.4589,
    lng: -3.6762,
    packageTier: "ESSENTIAL",
    photoOffset: 2,
  },
  {
    slug: "piso-eixample-barcelona",
    title: "Piso señorial en el Eixample",
    titleEn: "Grand flat in the Eixample",
    description:
      "Techos altos, balcones modernistas y distribución clásica actualizada. A pasos del Passeig de Gràcia.",
    descriptionEn:
      "High ceilings, modernist balconies and an updated classic layout. Steps from Passeig de Gràcia.",
    propertyType: "APARTMENT",
    price: 780000,
    rooms: 3,
    bathrooms: 2,
    areaM2: 115,
    floor: 2,
    yearBuilt: 1910,
    energyCert: "E",
    hasElevator: true,
    hasTerrace: true,
    address: "Carrer de Provença 215",
    neighborhood: "Eixample",
    city: "Barcelona",
    province: "Barcelona",
    lat: 41.3937,
    lng: 2.1612,
    packageTier: "PREMIUM",
    featured: true,
    photoOffset: 3,
  },
  {
    slug: "atico-gracia-barcelona",
    title: "Ático con terraza en Gràcia",
    titleEn: "Penthouse with terrace in Gràcia",
    description:
      "Espacio luminoso con gran terraza para disfrutar del clima mediterráneo. Ambiente de barrio con todo a mano.",
    descriptionEn:
      "Bright space with a large terrace for Mediterranean living. Neighbourhood feel with everything nearby.",
    propertyType: "PENTHOUSE",
    price: 650000,
    rooms: 2,
    bathrooms: 2,
    areaM2: 95,
    floor: 5,
    yearBuilt: 2005,
    energyCert: "B",
    hasElevator: true,
    hasTerrace: true,
    address: "Carrer de Verdi 48",
    neighborhood: "Gràcia",
    city: "Barcelona",
    province: "Barcelona",
    lat: 41.4036,
    lng: 2.1571,
    packageTier: "PLUS",
    photoOffset: 4,
  },
  {
    slug: "estudio-born-barcelona",
    title: "Estudio design en El Born",
    titleEn: "Design studio in El Born",
    description:
      "Compacto y bien resuelto, ideal como primera vivienda o inversión en una de las zonas más vibrantes de Barcelona.",
    descriptionEn:
      "Compact and well resolved — ideal as a first home or investment in one of Barcelona's liveliest areas.",
    propertyType: "STUDIO",
    price: 295000,
    rooms: 1,
    bathrooms: 1,
    areaM2: 42,
    floor: 1,
    yearBuilt: 1890,
    energyCert: "D",
    address: "Carrer de l'Argenteria 9",
    neighborhood: "El Born",
    city: "Barcelona",
    province: "Barcelona",
    lat: 41.3839,
    lng: 2.1822,
    photoOffset: 5,
  },
  {
    slug: "villa-marbella-costa-del-sol",
    title: "Villa contemporánea cerca de Marbella",
    titleEn: "Contemporary villa near Marbella",
    description:
      "Villa de diseño con piscina infinita, jardín mediterráneo y cocina de alta gama. Vistas al mar y privacidad absoluta.",
    descriptionEn:
      "Design villa with infinity pool, Mediterranean garden and high-end kitchen. Sea views and total privacy.",
    propertyType: "VILLA",
    price: 2450000,
    rooms: 5,
    bathrooms: 4,
    areaM2: 380,
    yearBuilt: 2019,
    energyCert: "A",
    hasParking: true,
    hasPool: true,
    hasTerrace: true,
    isNewBuild: true,
    address: "Urbanización Sierra Blanca 7",
    neighborhood: "Sierra Blanca",
    city: "Málaga",
    province: "Málaga",
    lat: 36.5125,
    lng: -4.9234,
    packageTier: "PREMIUM",
    featured: true,
    photoOffset: 0,
  },
  {
    slug: "apartamento-playa-malagueta",
    title: "Apartamento frente a La Malagueta",
    titleEn: "Apartment facing La Malagueta",
    description:
      "Segunda línea de playa con terraza soleada. Reformado en 2023 con acabados premium y parking incluido.",
    descriptionEn:
      "Second beach line with a sunny terrace. Renovated in 2023 with premium finishes and parking included.",
    propertyType: "APARTMENT",
    price: 520000,
    rooms: 2,
    bathrooms: 2,
    areaM2: 88,
    floor: 4,
    yearBuilt: 1985,
    energyCert: "C",
    hasElevator: true,
    hasParking: true,
    hasTerrace: true,
    address: "Paseo Marítimo Pablo Ruiz Picasso 18",
    neighborhood: "La Malagueta",
    city: "Málaga",
    province: "Málaga",
    lat: 36.7185,
    lng: -4.4072,
    packageTier: "PLUS",
    photoOffset: 2,
  },
  {
    slug: "casa-campo-ronda-malaga",
    title: "Casa de campo cerca de Ronda",
    titleEn: "Country house near Ronda",
    description:
      "Finca con olivos, porche y espacios para teletrabajar con calma. A 25 minutos de Ronda.",
    descriptionEn:
      "Estate with olive trees, a porch and calm spaces for remote work. 25 minutes from Ronda.",
    propertyType: "HOUSE",
    price: 385000,
    rooms: 3,
    bathrooms: 2,
    areaM2: 160,
    yearBuilt: 2001,
    energyCert: "D",
    hasParking: true,
    hasTerrace: true,
    address: "Camino de los Olivos s/n",
    neighborhood: "Serranía de Ronda",
    city: "Málaga",
    province: "Málaga",
    lat: 36.7421,
    lng: -5.1654,
    photoOffset: 3,
  },
  {
    slug: "piso-ruzafa-valencia",
    title: "Piso con encanto en Ruzafa",
    titleEn: "Charming flat in Ruzafa",
    description:
      "Vivienda renovada en el barrio más creativo de Valencia. Patios interiores, cocina nueva y mucha luz.",
    descriptionEn:
      "Renovated home in Valencia's most creative neighbourhood. Inner courtyards, new kitchen and lots of light.",
    propertyType: "APARTMENT",
    price: 365000,
    rooms: 3,
    bathrooms: 2,
    areaM2: 92,
    floor: 2,
    yearBuilt: 1962,
    energyCert: "C",
    hasElevator: true,
    address: "Carrer de Cadis 14",
    neighborhood: "Ruzafa",
    city: "Valencia",
    province: "Valencia",
    lat: 39.4628,
    lng: -0.3721,
    packageTier: "PLUS",
    featured: true,
    photoOffset: 1,
  },
  {
    slug: "atico-cabanyal-valencia",
    title: "Ático cerca del Cabanyal",
    titleEn: "Penthouse near El Cabanyal",
    description:
      "A pocos minutos de la playa, con terraza amplia y ambiente mediterráneo. Ideal como vivienda o segunda residencia.",
    descriptionEn:
      "Minutes from the beach, with a large terrace and Mediterranean atmosphere. Ideal as a home or second residence.",
    propertyType: "PENTHOUSE",
    price: 420000,
    rooms: 2,
    bathrooms: 2,
    areaM2: 86,
    floor: 4,
    yearBuilt: 2012,
    energyCert: "B",
    hasElevator: true,
    hasTerrace: true,
    isNewBuild: false,
    address: "Carrer de la Reina 55",
    neighborhood: "El Cabanyal",
    city: "Valencia",
    province: "Valencia",
    lat: 39.4665,
    lng: -0.3289,
    packageTier: "ESSENTIAL",
    photoOffset: 4,
  },
  {
    slug: "villa-obra-nueva-valencia-norte",
    title: "Villa de obra nueva al norte de Valencia",
    titleEn: "New-build villa north of Valencia",
    description:
      "Promoción exclusiva con jardín, garaje doble y certificación energética A. Entrega inmediata.",
    descriptionEn:
      "Exclusive development with garden, double garage and energy rating A. Ready to move in.",
    propertyType: "VILLA",
    price: 695000,
    rooms: 4,
    bathrooms: 3,
    areaM2: 220,
    yearBuilt: 2025,
    energyCert: "A",
    hasParking: true,
    hasPool: true,
    hasTerrace: true,
    isNewBuild: true,
    address: "Urbanización Les Palmeres 3",
    neighborhood: "Godella",
    city: "Valencia",
    province: "Valencia",
    lat: 39.5182,
    lng: -0.4156,
    packageTier: "PREMIUM",
    featured: true,
    photoOffset: 6,
  },
];

async function main() {
  console.log("Seeding Pisome…");

  await prisma.inquiry.deleteMany();
  await prisma.savedHome.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.order.deleteMany();
  await prisma.listingMedia.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.packagePlan.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  const org = await prisma.organization.create({
    data: {
      name: "Nordic Homes España",
      slug: "nordic-homes",
      email: "hola@nordichomes.es",
      phone: "+34 910 000 111",
      city: "Madrid",
      description: "Agencia boutique con estándar escandinavo de calidad.",
    },
  });

  const passwordHash = await bcrypt.hash("pisome123", 10);

  const agent = await prisma.user.create({
    data: {
      email: "agent@pisome.es",
      name: "Elena Nordström",
      passwordHash,
      role: "AGENT",
      phone: "+34 600 111 222",
      organizationId: org.id,
    },
  });

  await prisma.user.create({
    data: {
      email: "seeker@pisome.es",
      name: "Alex Seeker",
      passwordHash,
      role: "SEEKER",
    },
  });

  for (const item of listings) {
    const offset = item.photoOffset ?? 0;
    const mediaUrls = Array.from({ length: 5 }, (_, i) => photos[(offset + i) % photos.length]);

    await prisma.listing.create({
      data: {
        slug: item.slug,
        title: item.title,
        titleEn: item.titleEn,
        description: item.description,
        descriptionEn: item.descriptionEn,
        purpose: "SALE",
        propertyType: item.propertyType,
        status: "LIVE",
        packageTier: item.packageTier ?? "ESSENTIAL",
        featured: item.featured ?? false,
        price: item.price,
        rooms: item.rooms,
        bathrooms: item.bathrooms,
        areaM2: item.areaM2,
        floor: item.floor,
        yearBuilt: item.yearBuilt,
        energyCert: item.energyCert,
        hasElevator: item.hasElevator ?? false,
        hasParking: item.hasParking ?? false,
        hasTerrace: item.hasTerrace ?? false,
        hasPool: item.hasPool ?? false,
        isNewBuild: item.isNewBuild ?? false,
        address: item.address,
        neighborhood: item.neighborhood,
        city: item.city,
        province: item.province,
        lat: item.lat,
        lng: item.lng,
        publishedAt: new Date(),
        agentId: agent.id,
        organizationId: org.id,
        attrs: JSON.stringify({ rentalReady: true }),
        media: {
          create: mediaUrls.map((url, i) => ({
            url,
            alt: `${item.title} ${i + 1}`,
            sortOrder: i,
            width: 1400,
            height: 933,
          })),
        },
      },
    });
  }

  const { PACKAGE_PRICES } = await import("../src/lib/packages");
  for (const tier of ["ESSENTIAL", "PLUS", "PREMIUM"] as PackageTier[]) {
    const plan = PACKAGE_PRICES[tier];
    await prisma.packagePlan.create({
      data: {
        tier,
        name: plan.name,
        nameEn: plan.nameEn,
        priceCents: plan.priceCents,
        features: JSON.stringify(plan.features),
        featuresEn: JSON.stringify(plan.featuresEn),
      },
    });
  }

  console.log(`Seeded ${listings.length} listings across Madrid, Barcelona, Málaga, Valencia.`);
  console.log("Demo users: seeker@pisome.es / agent@pisome.es — password: pisome123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
