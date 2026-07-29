"use client";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatPrice, formatPricePerM2 } from "@/lib/utils";
import type { Listing, ListingMedia } from "@prisma/client";
import type { PackageTier } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

type ListingCardListing = Listing & {
  media: ListingMedia[];
};

export function ListingCard({ listing }: { listing: ListingCardListing }) {
  const t = useTranslations();
  const locale = useLocale();
  const title =
    locale === "en" && listing.titleEn ? listing.titleEn : listing.title;
  const cover = listing.media[0]?.url ?? "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pisome-navy/8"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={cover}
          alt={listing.media[0]?.alt ?? title}
          fill
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {listing.featured && (
            <Badge variant="featured">{t("listing.featured")}</Badge>
          )}
          {listing.packageTier === "PLUS" && (
            <Badge variant="plus">{t("listing.plus")}</Badge>
          )}
          {listing.packageTier === "PREMIUM" && (
            <Badge variant="premium">{t("listing.premium")}</Badge>
          )}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <p className="font-display text-xl font-semibold text-pisome-navy">
          {formatPrice(listing.price, locale === "en" ? "en-GB" : "es-ES")}
        </p>
        <h3 className="line-clamp-1 text-sm font-medium text-pisome-navy">
          {title}
        </h3>
        <p className="text-sm text-pisome-muted">
          {listing.neighborhood}, {listing.city}
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-pisome-muted">
          <span>{t("listing.rooms", { count: listing.rooms })}</span>
          <span>{t("listing.baths", { count: listing.bathrooms })}</span>
          <span>{t("listing.area", { count: listing.areaM2 })}</span>
          <span>
            {formatPricePerM2(
              listing.price,
              listing.areaM2,
              locale === "en" ? "en-GB" : "es-ES",
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function packageBadgeVariant(tier: PackageTier) {
  if (tier === "PREMIUM") return "premium" as const;
  if (tier === "PLUS") return "plus" as const;
  return "default" as const;
}
