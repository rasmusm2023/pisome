import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatPrice(amount: number, locale = "es-ES", currency = "EUR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPricePerM2(price: number, areaM2: number, locale = "es-ES") {
  if (!areaM2) return "—";
  return `${formatPrice(Math.round(price / areaM2), locale)}/m²`;
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const LAUNCH_CITIES = [
  {
    slug: "madrid",
    name: "Madrid",
    nameEn: "Madrid",
    lat: 40.4168,
    lng: -3.7038,
    image:
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1400&q=80",
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    nameEn: "Barcelona",
    lat: 41.3874,
    lng: 2.1686,
    image:
      "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1400&q=80",
  },
  {
    slug: "malaga",
    name: "Málaga",
    nameEn: "Malaga",
    lat: 36.7213,
    lng: -4.4214,
    image:
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1400&q=80",
  },
  {
    slug: "valencia",
    name: "Valencia",
    nameEn: "Valencia",
    lat: 39.4699,
    lng: -0.3763,
    image:
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1400&q=80",
  },
] as const;

export const MIN_PHOTOS = 5;
