"use client";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { formatPrice } from "@/lib/utils";
import type { Listing, ListingMedia } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

export function HomeListingTile({
  listing,
  priority = false,
}: {
  listing: Listing & { media: ListingMedia[] };
  priority?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const cover =
    listing.media[0]?.url ??
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";
  const numberLocale = locale === "en" ? "en-GB" : "es-ES";

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-sm shadow-pisome-navy/5 ring-1 ring-pisome-border/80 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-pisome-navy/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={cover}
          alt={listing.media[0]?.alt ?? listing.address}
          fill
          priority={priority}
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
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
      <div className="space-y-0.5 px-3.5 py-3">
        <p className="font-display text-lg font-semibold text-pisome-navy">
          {formatPrice(listing.price, numberLocale)}
        </p>
        <p className="truncate text-sm font-medium text-pisome-navy">
          {listing.address}
        </p>
        <p className="truncate text-sm text-pisome-muted">
          {listing.neighborhood}, {listing.city}
        </p>
        <p className="pt-1 text-xs text-pisome-muted">
          {t("listing.rooms", { count: listing.rooms })} ·{" "}
          {t("listing.area", { count: listing.areaM2 })}
        </p>
      </div>
    </Link>
  );
}
