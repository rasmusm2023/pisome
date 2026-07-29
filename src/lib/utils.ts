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
  { slug: "madrid", name: "Madrid", nameEn: "Madrid", lat: 40.4168, lng: -3.7038 },
  { slug: "barcelona", name: "Barcelona", nameEn: "Barcelona", lat: 41.3874, lng: 2.1686 },
  { slug: "malaga", name: "Málaga", nameEn: "Malaga", lat: 36.7213, lng: -4.4214 },
  { slug: "valencia", name: "Valencia", nameEn: "Valencia", lat: 39.4699, lng: -0.3763 },
] as const;

export const MIN_PHOTOS = 5;
