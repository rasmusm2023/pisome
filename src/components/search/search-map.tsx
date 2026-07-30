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
  images: string[];
  address: string;
  neighborhood: string;
  city: string;
  rooms: number;
  areaM2: number;
  propertyType: string;
  propertyTypeLabel: string;
  publishedAt: string | null;
};

function formatListedAgo(publishedAt: string | null, locale: string) {
  if (!publishedAt) {
    return locale === "en" ? "Just listed" : "Recién publicado";
  }
  const then = new Date(publishedAt).getTime();
  const days = Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
  if (locale === "en") {
    if (days === 0) return "Listed today";
    if (days === 1) return "Listed yesterday";
    if (days < 7) return `Listed ${days} days ago`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? "Listed 1 week ago" : `Listed ${weeks} weeks ago`;
    }
    const months = Math.floor(days / 30);
    return months === 1 ? "Listed 1 month ago" : `Listed ${months} months ago`;
  }
  if (days === 0) return "Publicado hoy";
  if (days === 1) return "Publicado ayer";
  if (days < 7) return `Publicado hace ${days} días`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1
      ? "Publicado hace 1 semana"
      : `Publicado hace ${weeks} semanas`;
  }
  const months = Math.floor(days / 30);
  return months === 1
    ? "Publicado hace 1 mes"
    : `Publicado hace ${months} meses`;
}

function markerColors(listing: MapListing, selected: boolean) {
  if (selected) {
    return { bg: "#2563eb", border: "#1d4ed8", text: "#ffffff" };
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
  onOpen?: (slug: string) => void,
  options?: { animate?: boolean },
) {
  const animate = options?.animate !== false;
  const colors = markerColors(listing, selected);
  const priceLabel = formatPrice(
    listing.price,
    locale === "en" ? "en-GB" : "es-ES",
  );
  const images = listing.images.filter(Boolean);
  const streetName = listing.address;

  const wrap = document.createElement("div");
  wrap.className = [
    "pisome-marker",
    selected ? "is-selected is-expanded" : "",
    animate ? "" : "pisome-marker--no-settle",
  ]
    .filter(Boolean)
    .join(" ");
  wrap.dataset.listingId = listing.id;
  wrap.style.setProperty("--marker-bg", colors.bg);
  wrap.style.setProperty("--marker-border", colors.border);
  wrap.style.setProperty("--marker-text", colors.text);

  if (selected) {
    const card = document.createElement("div");
    card.className = "pisome-marker__card";
    card.setAttribute("role", "link");
    card.setAttribute("aria-label", streetName);
    card.tabIndex = 0;

    const gallery = document.createElement("div");
    gallery.className = "pisome-marker__gallery";

    if (images.length > 0) {
      const img = document.createElement("img");
      img.className = "pisome-marker__img";
      img.alt = streetName;
      img.draggable = false;
      let index = 0;
      img.src = images[0];
      gallery.appendChild(img);

      if (images.length > 1) {
        const prev = document.createElement("button");
        prev.type = "button";
        prev.className = "pisome-marker__nav pisome-marker__nav--prev";
        prev.setAttribute("aria-label", "Previous photo");
        prev.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';

        const next = document.createElement("button");
        next.type = "button";
        next.className = "pisome-marker__nav pisome-marker__nav--next";
        next.setAttribute("aria-label", "Next photo");
        next.innerHTML =
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';

        const counter = document.createElement("span");
        counter.className = "pisome-marker__counter";
        const updateCounter = () => {
          counter.textContent = `${index + 1}/${images.length}`;
        };
        updateCounter();

        const show = (nextIndex: number) => {
          index = (nextIndex + images.length) % images.length;
          img.src = images[index];
          updateCounter();
        };

        prev.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          show(index - 1);
        });
        next.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();
          show(index + 1);
        });

        gallery.append(prev, next, counter);
      }
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "pisome-marker__placeholder";
      placeholder.textContent = "Pisome";
      gallery.appendChild(placeholder);
    }

    const info = document.createElement("div");
    info.className = "pisome-marker__info";

    const title = document.createElement("div");
    title.className = "pisome-marker__title";
    title.textContent = streetName;

    const location = document.createElement("div");
    location.className = "pisome-marker__location";
    location.textContent = `${listing.neighborhood}, ${listing.city}`;

    const meta = document.createElement("div");
    meta.className = "pisome-marker__meta";
    const roomsLabel =
      locale === "en"
        ? `${listing.rooms} bed`
        : `${listing.rooms} hab.`;
    meta.textContent = [
      listing.propertyTypeLabel,
      roomsLabel,
      `${listing.areaM2} m²`,
    ].join(" · ");

    const price = document.createElement("div");
    price.className = "pisome-marker__price";
    price.textContent = priceLabel;

    const listed = document.createElement("div");
    listed.className = "pisome-marker__listed";
    listed.textContent = formatListedAgo(listing.publishedAt, locale);

    info.append(title, location, meta, price, listed);
    card.append(gallery, info);

    const openListing = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
      onOpen?.(listing.slug);
    };
    card.addEventListener("click", openListing);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openListing(e);
    });

    const dot = document.createElement("span");
    dot.className = "pisome-marker__dot pisome-marker__dot--expanded";
    dot.setAttribute("aria-hidden", "true");

    wrap.append(card, dot);
    return wrap;
  }

  // Collapsed: colored dot only
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pisome-marker__dot";
  btn.setAttribute("aria-label", `${streetName} — ${priceLabel}`);
  btn.title = priceLabel;
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onSelect?.(listing.slug);
  });

  wrap.append(btn);
  return wrap;
}

export type MapBounds = {
  west: number;
  east: number;
  south: number;
  north: number;
};

export function isListingInBounds(
  listing: { lat: number; lng: number },
  bounds: MapBounds,
) {
  return (
    listing.lng >= bounds.west &&
    listing.lng <= bounds.east &&
    listing.lat >= bounds.south &&
    listing.lat <= bounds.north
  );
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

function placeMarker(
  map: MapLibreMap,
  listing: MapListing,
  locale: string,
  selected: boolean,
  onSelect: ((slug: string) => void) | undefined,
  onOpen: ((slug: string) => void) | undefined,
  animate: boolean,
) {
  const el = createMarkerElement(
    listing,
    locale,
    selected,
    onSelect,
    onOpen,
    { animate },
  );
  return new maplibregl.Marker({ element: el, anchor: "bottom" })
    .setLngLat([listing.lng, listing.lat])
    .addTo(map);
}

export function SearchMap({
  listings,
  locale,
  onSelect,
  onOpenListing,
  onBoundsChange,
  selectedId,
  hoveredId,
}: {
  listings: MapListing[];
  locale: string;
  onSelect?: (slug: string | null) => void;
  onOpenListing?: (slug: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  selectedId?: string | null;
  hoveredId?: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersByIdRef = useRef<Map<string, Marker>>(new Map());
  const listingsRef = useRef(listings);
  const onSelectRef = useRef(onSelect);
  const onOpenListingRef = useRef(onOpenListing);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const selectedIdRef = useRef(selectedId);
  const prevSelectedIdRef = useRef(selectedId);
  const prevHoveredIdRef = useRef(hoveredId);
  const localeRef = useRef(locale);
  const boundsTimerRef = useRef<number | null>(null);
  listingsRef.current = listings;
  onSelectRef.current = onSelect;
  onOpenListingRef.current = onOpenListing;
  onBoundsChangeRef.current = onBoundsChange;
  selectedIdRef.current = selectedId;
  localeRef.current = locale;

  const listingKey = listings.map((l) => l.id).join(",");

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

    const emitBounds = () => {
      if (boundsTimerRef.current != null) {
        window.clearTimeout(boundsTimerRef.current);
      }
      boundsTimerRef.current = window.setTimeout(() => {
        const b = map.getBounds();
        onBoundsChangeRef.current?.({
          west: b.getWest(),
          east: b.getEast(),
          south: b.getSouth(),
          north: b.getNorth(),
        });
      }, 200);
    };

    const markReady = () => {
      map.resize();
      fitToListings(map, listingsRef.current);
      emitBounds();
    };

    map.once("load", markReady);
    map.once("idle", markReady);

    map.on("moveend", emitBounds);
    map.on("zoomend", emitBounds);

    map.on("click", () => {
      // MapLibre only fires click when press+release without a pan/drag
      if (selectedIdRef.current) onSelectRef.current?.(null);
    });

    const ro = new ResizeObserver(() => {
      map.resize();
    });
    ro.observe(container);

    const t1 = window.setTimeout(() => map.resize(), 50);
    const t2 = window.setTimeout(() => map.resize(), 250);

    mapRef.current = map;

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      if (boundsTimerRef.current != null) {
        window.clearTimeout(boundsTimerRef.current);
      }
      ro.disconnect();
      markersByIdRef.current.forEach((m) => m.remove());
      markersByIdRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Rebuild markers only when the listing set (or locale) changes — not on select.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersByIdRef.current.forEach((m) => m.remove());
    markersByIdRef.current.clear();

    const selected = selectedIdRef.current ?? null;
    const hovered = prevHoveredIdRef.current ?? null;
    const handleSelect = (slug: string) => onSelectRef.current?.(slug);
    const handleOpen = (slug: string) => onOpenListingRef.current?.(slug);

    listings.forEach((listing) => {
      const marker = placeMarker(
        map,
        listing,
        locale,
        listing.id === selected,
        handleSelect,
        handleOpen,
        true,
      );
      if (listing.id === hovered) {
        marker.getElement().classList.add("is-hovered");
      }
      markersByIdRef.current.set(listing.id, marker);
    });

    prevSelectedIdRef.current = selected;
  }, [listingKey, locale, listings]);

  // Selection: only replace the markers whose expanded state changed.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const prev = prevSelectedIdRef.current ?? null;
    const next = selectedId ?? null;
    if (prev === next) return;

    const handleSelect = (slug: string) => onSelectRef.current?.(slug);
    const handleOpen = (slug: string) => onOpenListingRef.current?.(slug);
    const hovered = prevHoveredIdRef.current ?? null;

    const replace = (id: string, selected: boolean) => {
      const listing = listingsRef.current.find((l) => l.id === id);
      const existing = markersByIdRef.current.get(id);
      if (!listing || !existing) return;
      existing.remove();
      const marker = placeMarker(
        map,
        listing,
        localeRef.current,
        selected,
        handleSelect,
        handleOpen,
        false,
      );
      if (id === hovered) {
        marker.getElement().classList.add("is-hovered");
      }
      markersByIdRef.current.set(id, marker);
    };

    if (prev) replace(prev, false);
    if (next) replace(next, true);

    prevSelectedIdRef.current = next;
  }, [selectedId]);

  // List hover: scale the matching collapsed dot only — no expand/rebuild.
  useEffect(() => {
    const prev = prevHoveredIdRef.current ?? null;
    const next = hoveredId ?? null;
    if (prev === next) return;

    if (prev) {
      markersByIdRef.current.get(prev)?.getElement().classList.remove("is-hovered");
    }
    if (next) {
      markersByIdRef.current.get(next)?.getElement().classList.add("is-hovered");
    }

    prevHoveredIdRef.current = next;
  }, [hoveredId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || listings.length === 0) return;

    const run = () => {
      fitToListings(map, listings);
      const b = map.getBounds();
      onBoundsChangeRef.current?.({
        west: b.getWest(),
        east: b.getEast(),
        south: b.getSouth(),
        north: b.getNorth(),
      });
    };
    if (map.loaded()) run();
    else map.once("load", run);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingKey]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-pisome-border bg-[#f8f4f0]">
      <div ref={containerRef} className="pisome-map" />
    </div>
  );
}
