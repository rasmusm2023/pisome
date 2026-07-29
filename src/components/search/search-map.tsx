"use client";

import { PISOME_MAP_STYLE_URL } from "@/lib/map-style";
import { formatPrice } from "@/lib/utils";
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
} from "maplibre-gl";
import { useEffect, useRef } from "react";

export type MapListing = {
  id: string;
  slug: string;
  title: string;
  price: number;
  lat: number;
  lng: number;
  packageTier: string;
  featured: boolean;
};

function markerColors(listing: MapListing, selected: boolean) {
  if (selected) {
    return { bg: "#0d9488", border: "#0f766e", text: "#ffffff" };
  }
  if (listing.packageTier === "PREMIUM" || listing.featured) {
    return { bg: "#0b1f3a", border: "#163a66", text: "#ffffff" };
  }
  if (listing.packageTier === "PLUS") {
    return { bg: "#1d4ed8", border: "#1e40af", text: "#ffffff" };
  }
  return { bg: "#2563eb", border: "#1d4ed8", text: "#ffffff" };
}

function createMarkerElement(
  listing: MapListing,
  locale: string,
  selected: boolean,
  onSelect?: (slug: string) => void,
) {
  const colors = markerColors(listing, selected);
  const wrap = document.createElement("div");
  wrap.className = `pisome-marker${selected ? " is-selected" : ""}`;
  wrap.style.setProperty("--marker-bg", colors.bg);
  wrap.style.setProperty("--marker-border", colors.border);
  wrap.style.setProperty("--marker-text", colors.text);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pisome-marker__pill";
  btn.setAttribute("aria-label", listing.title);
  btn.textContent = formatPrice(
    listing.price,
    locale === "en" ? "en-GB" : "es-ES",
  );
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onSelect?.(listing.slug);
  });

  const tip = document.createElement("span");
  tip.className = "pisome-marker__tip";
  tip.setAttribute("aria-hidden", "true");

  wrap.append(btn, tip);
  return wrap;
}

function fitToListings(map: MapLibreMap, listings: MapListing[]) {
  if (listings.length === 0) return;

  if (listings.length === 1) {
    map.jumpTo({
      center: [listings[0].lng, listings[0].lat],
      zoom: 14,
    });
    return;
  }

  const bounds = new maplibregl.LngLatBounds();
  listings.forEach((l) => bounds.extend([l.lng, l.lat]));
  map.fitBounds(bounds, {
    padding: 48,
    maxZoom: 14,
    duration: 0,
  });
}

export function SearchMap({
  listings,
  locale,
  onSelect,
  selectedId,
}: {
  listings: MapListing[];
  locale: string;
  onSelect?: (slug: string) => void;
  selectedId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const listingsRef = useRef(listings);
  const onSelectRef = useRef(onSelect);
  listingsRef.current = listings;
  onSelectRef.current = onSelect;

  // Create map once
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: PISOME_MAP_STYLE_URL,
      center: [-3.7, 40.4],
      zoom: 5.6,
      minZoom: 4,
      maxZoom: 18,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(
      new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" }),
      "bottom-left",
    );

    const markReady = () => {
      map.resize();
      fitToListings(map, listingsRef.current);
    };

    map.once("load", markReady);
    map.once("idle", markReady);

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(container);

    // Extra resize after layout settles (flex/grid)
    const t1 = window.setTimeout(() => map.resize(), 50);
    const t2 = window.setTimeout(() => map.resize(), 250);

    mapRef.current = map;

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const ordered = [
      ...listings.filter((l) => l.id !== selectedId),
      ...listings.filter((l) => l.id === selectedId),
    ];

    ordered.forEach((listing) => {
      const el = createMarkerElement(
        listing,
        locale,
        listing.id === selectedId,
        (slug) => onSelectRef.current?.(slug),
      );

      markersRef.current.push(
        new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([listing.lng, listing.lat])
          .addTo(map),
      );
    });
  }, [listings, locale, selectedId]);

  // Fit when listing set changes
  const listingKey = listings.map((l) => l.id).join(",");
  useEffect(() => {
    const map = mapRef.current;
    if (!map || listings.length === 0) return;

    const run = () => fitToListings(map, listings);
    if (map.loaded()) run();
    else map.once("load", run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingKey]);

  // Ease to selection
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const listing = listings.find((l) => l.id === selectedId);
    if (!listing) return;

    map.easeTo({
      center: [listing.lng, listing.lat],
      zoom: Math.max(map.getZoom(), 12),
      duration: 400,
    });
  }, [selectedId, listings]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-pisome-border bg-[#f8f4f0]">
      <div ref={containerRef} className="pisome-map" />
    </div>
  );
}
