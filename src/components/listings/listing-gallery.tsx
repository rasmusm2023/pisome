"use client";

import { cn, formatPrice, formatPricePerM2 } from "@/lib/utils";
import { Bath, BedDouble, ChevronLeft, ChevronRight, Maximize } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";

export function ListingGallery({
  media,
  address,
  price,
  neighborhood,
  city,
  rooms,
  bathrooms,
  areaM2,
}: {
  media: { url: string; alt: string | null; isFloorPlan: boolean }[];
  address: string;
  price: number;
  neighborhood: string;
  city: string;
  rooms: number;
  bathrooms: number;
  areaM2: number;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const numberLocale = locale === "en" ? "en-GB" : "es-ES";
  const photos = media.filter((m) => !m.isFloorPlan);
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const current = photos[active] ?? photos[0];

  const go = useCallback(
    (delta: number) => {
      if (photos.length < 2) return;
      setActive((i) => (i + delta + photos.length) % photos.length);
    },
    [photos.length],
  );

  if (!current) {
    return (
      <div className="aspect-[16/10] w-full rounded-2xl bg-pisome-sky" />
    );
  }

  const thumbs = photos.length > 1 && (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:h-full sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:pb-0">
      {photos.map((photo, i) => (
        <button
          key={photo.url + i}
          type="button"
          onClick={() => setActive(i)}
          className={cn(
            "relative h-24 w-36 shrink-0 overflow-hidden rounded-lg border-2 transition",
            i === active
              ? "border-pisome-blue"
              : "border-transparent opacity-80 hover:opacity-100",
          )}
        >
          <Image
            src={photo.url}
            alt={photo.alt ?? ""}
            fill
            className="object-cover"
            sizes="144px"
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="pb-20 sm:pb-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <div
            className="relative aspect-[16/10] touch-pan-y overflow-hidden rounded-2xl bg-pisome-navy"
            onTouchStart={(e) => {
              touchStartX.current = e.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              const end = e.changedTouches[0]?.clientX;
              touchStartX.current = null;
              if (start == null || end == null) return;
              const delta = end - start;
              if (Math.abs(delta) < 40) return;
              go(delta < 0 ? 1 : -1);
            }}
          >
            <Image
              key={current.url}
              src={current.url}
              alt={current.alt ?? ""}
              fill
              priority
              draggable={false}
              className="animate-gallery-fade object-cover select-none"
              sizes="(max-width: 640px) 100vw, 75vw"
            />

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label={t("listing.prevPhoto")}
                  className="absolute left-3 top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white/90 backdrop-blur-[2px] transition hover:bg-black/40 hover:text-white"
                >
                  <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label={t("listing.nextPhoto")}
                  className="absolute right-3 top-1/2 z-[1] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/25 text-white/90 backdrop-blur-[2px] transition hover:bg-black/40 hover:text-white"
                >
                  <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
                </button>
              </>
            )}
          </div>

          <div className="absolute bottom-0 left-3 z-10 w-[calc(50%-0.75rem)] translate-y-1/2 sm:left-5 sm:w-1/2">
            <div className="rounded-2xl border border-pisome-border/80 bg-white/95 p-4 shadow-xl shadow-pisome-navy/15 backdrop-blur-sm sm:p-5">
              <p className="font-display text-2xl font-semibold text-pisome-navy sm:text-3xl">
                {formatPrice(price, numberLocale)}
              </p>
              <h1 className="mt-1 font-display text-lg font-semibold text-pisome-navy sm:text-xl">
                {address}
              </h1>
              <p className="mt-0.5 text-sm text-pisome-muted">
                {neighborhood}, {city}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-pisome-navy">
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-4 w-4 text-pisome-blue" />
                  {t("listing.rooms", { count: rooms })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Bath className="h-4 w-4 text-pisome-blue" />
                  {t("listing.baths", { count: bathrooms })}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Maximize className="h-4 w-4 text-pisome-blue" />
                  {t("listing.area", { count: areaM2 })}
                </span>
                <span className="text-pisome-muted">
                  {formatPricePerM2(price, areaM2, numberLocale)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {thumbs && (
          <div className="sm:w-36 sm:shrink-0 sm:self-stretch">{thumbs}</div>
        )}
      </div>
    </div>
  );
}
