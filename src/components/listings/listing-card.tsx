"use client";

import { Badge } from "@/components/ui/badge";
import { Link } from "@/i18n/navigation";
import { cn, formatPrice, formatPricePerM2 } from "@/lib/utils";
import type { Listing, ListingMedia } from "@prisma/client";
import type { PackageTier } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

type ListingCardListing = Listing & {
  media: ListingMedia[];
};

export function ListingCard({
  listing,
  layout = "row",
}: {
  listing: ListingCardListing;
  /** @deprecated Cards are always image-left; kept for call-site compatibility */
  layout?: "stack" | "row";
}) {
  const t = useTranslations();
  const locale = useLocale();
  const name = listing.address;
  const cover =
    listing.media[0]?.url ??
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80";
  const numberLocale = locale === "en" ? "en-GB" : "es-ES";
  const isWide = layout === "row";

  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="group flex items-start overflow-hidden rounded-2xl bg-white transition duration-300 hover:shadow-lg hover:shadow-pisome-navy/8"
    >
      <div
        className={cn(
          "relative aspect-[16/10] w-[44%] shrink-0 overflow-hidden",
          isWide && "w-[42%] lg:w-[40%]",
        )}
      >
        <Image
          src={cover}
          alt={listing.media[0]?.alt ?? name}
          fill
          className="object-cover"
          sizes={
            isWide
              ? "(max-width: 640px) 42vw, (max-width: 1024px) 40vw, 24vw"
              : "(max-width: 1024px) 40vw, 18vw"
          }
        />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
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
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col justify-center space-y-1",
          isWide ? "px-4 py-3 sm:px-5 sm:py-3.5" : "px-3 py-2.5 sm:px-4",
        )}
      >
        <h3
          className={cn(
            "line-clamp-2 font-display font-semibold text-pisome-navy",
            isWide ? "text-lg sm:text-xl" : "text-base sm:text-lg",
          )}
        >
          {name}
        </h3>
        <p
          className={cn(
            "font-medium text-pisome-navy",
            isWide ? "text-base" : "text-sm",
          )}
        >
          {formatPrice(listing.price, numberLocale)}
        </p>
        <p className={cn("text-pisome-muted", isWide ? "text-base" : "text-sm")}>
          {listing.neighborhood}, {listing.city}
        </p>
        <div
          className={cn(
            "flex flex-wrap gap-3 text-pisome-muted",
            isWide ? "pt-0.5 text-sm" : "text-xs",
          )}
        >
          <span>{t("listing.rooms", { count: listing.rooms })}</span>
          <span>{t("listing.baths", { count: listing.bathrooms })}</span>
          <span>{t("listing.area", { count: listing.areaM2 })}</span>
          <span>
            {formatPricePerM2(listing.price, listing.areaM2, numberLocale)}
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
