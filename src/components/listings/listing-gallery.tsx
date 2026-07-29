"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";

export function ListingGallery({
  media,
}: {
  media: { url: string; alt: string | null; isFloorPlan: boolean }[];
}) {
  const photos = media.filter((m) => !m.isFloorPlan);
  const [active, setActive] = useState(0);
  const current = photos[active] ?? photos[0];

  if (!current) {
    return (
      <div className="aspect-[16/10] w-full rounded-2xl bg-pisome-sky" />
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-pisome-navy">
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt ?? ""}
          fill
          priority
          className="animate-gallery-fade object-cover"
          sizes="100vw"
        />
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={photo.url + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition",
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
                sizes="96px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
