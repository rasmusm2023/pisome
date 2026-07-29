import type { PackageTier } from "@/lib/types";

export const PACKAGE_PRICES: Record<
  PackageTier,
  { priceCents: number; name: string; nameEn: string; features: string[]; featuresEn: string[] }
> = {
  ESSENTIAL: {
    priceCents: 4900,
    name: "Essential",
    nameEn: "Essential",
    features: [
      "Anuncio activo 30 días",
      "Hasta 20 fotos",
      "Bandeja de consultas",
      "Posición estándar en búsqueda",
    ],
    featuresEn: [
      "Live listing for 30 days",
      "Up to 20 photos",
      "Inquiry inbox",
      "Standard search placement",
    ],
  },
  PLUS: {
    priceCents: 9900,
    name: "Plus",
    nameEn: "Plus",
    features: [
      "Todo Essential",
      "Insignia Plus",
      "Resaltado en resultados",
      "Hasta 40 fotos + vídeo",
      "Analítica básica",
    ],
    featuresEn: [
      "Everything in Essential",
      "Plus badge",
      "Highlighted in results",
      "Up to 40 photos + video",
      "Basic analytics",
    ],
  },
  PREMIUM: {
    priceCents: 19900,
    name: "Premium",
    nameEn: "Premium",
    features: [
      "Todo Plus",
      "Prioridad en mapa y búsqueda",
      "Analítica avanzada",
      "Soporte prioritario",
      "Homepage rotativa",
    ],
    featuresEn: [
      "Everything in Plus",
      "Top of map and search",
      "Advanced analytics",
      "Priority support",
      "Homepage rotation",
    ],
  },
};
