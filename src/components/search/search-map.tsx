"use client";

import { PISOME_MAP_STYLE_URL } from "@/lib/map-style";
import { formatPrice } from "@/lib/utils";
import maplibregl, {
  type Map as MapLibreMap,
  type Marker,
} from "maplibre-gl";
import { useEffect, useRef } from "react";
import Supercluster from "supercluster";

const AREAS_SOURCE_ID = "pisome-selected-areas";
const AREAS_FILL_LAYER_ID = "pisome-selected-areas-fill";
const AREAS_LINE_LAYER_ID = "pisome-selected-areas-line";
const AREA_FILL = "rgba(37, 99, 235, 0.14)";
const AREA_BORDER = "rgba(37, 99, 235, 0.72)";

type AreaFeature = {
  type: "Feature";
  properties: { name: string; query: string };
  geometry: GeoJSON.Geometry;
};

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

type ListingPointProps = {
  listingId: string;
};

type ClusterFeature = Supercluster.ClusterFeature<ListingPointProps>;
type PointFeature = Supercluster.PointFeature<ListingPointProps>;

const CLUSTER_RADIUS_PX = 56;
const CLUSTER_MAX_ZOOM = 16;

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

function clusterDotSize(count: number) {
  if (count >= 100) return 52;
  if (count >= 25) return 44;
  if (count >= 10) return 38;
  return 32;
}

function createClusterElement(count: number, onExpand: () => void) {
  const wrap = document.createElement("div");
  wrap.className = "pisome-marker pisome-marker--cluster";
  wrap.style.setProperty("--marker-bg", "#2563eb");
  wrap.style.setProperty("--marker-border", "#1d4ed8");
  wrap.style.setProperty("--marker-text", "#ffffff");

  const size = clusterDotSize(count);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "pisome-marker__cluster";
  btn.style.width = `${size}px`;
  btn.style.height = `${size}px`;
  btn.style.fontSize = count >= 100 ? "14px" : count >= 10 ? "13px" : "12px";
  btn.textContent = String(count);
  btn.setAttribute(
    "aria-label",
    count === 1 ? "1 listing" : `${count} listings`,
  );
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    onExpand();
  });

  wrap.append(btn);
  return wrap;
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

function placeListingMarker(
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

function listingsToFeatures(
  listings: MapListing[],
): PointFeature[] {
  return listings.map((listing) => ({
    type: "Feature",
    properties: { listingId: listing.id },
    geometry: {
      type: "Point",
      coordinates: [listing.lng, listing.lat],
    },
  }));
}

function buildClusterIndex(
  listings: MapListing[],
  excludeId?: string | null,
) {
  const index = new Supercluster<ListingPointProps>({
    radius: CLUSTER_RADIUS_PX,
    maxZoom: CLUSTER_MAX_ZOOM,
    minPoints: 2,
  });
  const points = excludeId
    ? listings.filter((l) => l.id !== excludeId)
    : listings;
  index.load(listingsToFeatures(points));
  return index;
}

function emptyAreasCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function ensureAreasLayers(map: MapLibreMap) {
  if (!map.getSource(AREAS_SOURCE_ID)) {
    map.addSource(AREAS_SOURCE_ID, {
      type: "geojson",
      data: emptyAreasCollection(),
    });
  }
  if (!map.getLayer(AREAS_FILL_LAYER_ID)) {
    map.addLayer({
      id: AREAS_FILL_LAYER_ID,
      type: "fill",
      source: AREAS_SOURCE_ID,
      paint: {
        "fill-color": AREA_FILL,
        "fill-opacity": 1,
      },
    });
  }
  if (!map.getLayer(AREAS_LINE_LAYER_ID)) {
    map.addLayer({
      id: AREAS_LINE_LAYER_ID,
      type: "line",
      source: AREAS_SOURCE_ID,
      paint: {
        "line-color": AREA_BORDER,
        "line-width": 2.25,
        "line-opacity": 1,
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
    });
  }
}

function setAreasData(map: MapLibreMap, features: AreaFeature[]) {
  ensureAreasLayers(map);
  const source = map.getSource(AREAS_SOURCE_ID) as
    | maplibregl.GeoJSONSource
    | undefined;
  source?.setData({
    type: "FeatureCollection",
    features,
  });
}

function fitToAreas(map: MapLibreMap, features: AreaFeature[]) {
  if (features.length === 0) return;

  const bounds = new maplibregl.LngLatBounds();
  let hasCoord = false;

  const extendCoords = (coords: unknown) => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number" && typeof coords[1] === "number") {
      bounds.extend([coords[0] as number, coords[1] as number]);
      hasCoord = true;
      return;
    }
    for (const child of coords) extendCoords(child);
  };

  for (const feature of features) {
    const geometry = feature.geometry;
    if (geometry.type === "GeometryCollection") {
      for (const child of geometry.geometries) {
        if ("coordinates" in child) extendCoords(child.coordinates);
      }
    } else if ("coordinates" in geometry) {
      extendCoords(geometry.coordinates);
    }
  }

  if (!hasCoord) return;
  map.fitBounds(bounds, {
    padding: 56,
    maxZoom: 12,
    duration: 500,
  });
}

async function fetchAreaFeature(
  query: string,
  signal?: AbortSignal,
): Promise<AreaFeature | null> {
  const res = await fetch(
    `/api/locations/boundary?q=${encodeURIComponent(query)}`,
    { signal },
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { feature?: AreaFeature | null };
  return data.feature ?? null;
}

export function SearchMap({
  listings,
  locale,
  onSelect,
  onOpenListing,
  onBoundsChange,
  selectedId,
  hoveredId,
  selectedLocations = [],
}: {
  listings: MapListing[];
  locale: string;
  onSelect?: (slug: string | null) => void;
  onOpenListing?: (slug: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  selectedId?: string | null;
  hoveredId?: string | null;
  selectedLocations?: string[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersByKeyRef = useRef<Map<string, Marker>>(new Map());
  const clusterIndexRef = useRef<Supercluster<ListingPointProps> | null>(null);
  const listingsByIdRef = useRef<Map<string, MapListing>>(new Map());
  const areaCacheRef = useRef<Map<string, AreaFeature | null>>(new Map());
  const areasFeaturesRef = useRef<AreaFeature[]>([]);
  const listingsRef = useRef(listings);
  const onSelectRef = useRef(onSelect);
  const onOpenListingRef = useRef(onOpenListing);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const selectedIdRef = useRef(selectedId);
  const prevSelectedIdRef = useRef(selectedId);
  const prevHoveredIdRef = useRef(hoveredId);
  const localeRef = useRef(locale);
  const boundsTimerRef = useRef<number | null>(null);
  const refreshMarkersRef = useRef<(opts?: { animate?: boolean }) => void>(
    () => {},
  );

  listingsRef.current = listings;
  onSelectRef.current = onSelect;
  onOpenListingRef.current = onOpenListing;
  onBoundsChangeRef.current = onBoundsChange;
  selectedIdRef.current = selectedId;
  localeRef.current = locale;

  const listingKey = listings.map((l) => l.id).join(",");
  const locationsKey = selectedLocations.join("|");

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

    const refreshMarkers = (opts?: { animate?: boolean }) => {
      const index = clusterIndexRef.current;
      if (!index) return;

      const animate = opts?.animate !== false;
      const selected = selectedIdRef.current ?? null;
      const hovered = prevHoveredIdRef.current ?? null;
      const handleSelect = (slug: string) => onSelectRef.current?.(slug);
      const handleOpen = (slug: string) => onOpenListingRef.current?.(slug);

      const bounds = map.getBounds();
      const zoom = Math.max(0, Math.floor(map.getZoom()));
      const pad = 0.05;
      const bbox: [number, number, number, number] = [
        bounds.getWest() - pad,
        bounds.getSouth() - pad,
        bounds.getEast() + pad,
        bounds.getNorth() + pad,
      ];

      const features = index.getClusters(bbox, zoom);
      const nextKeys = new Set<string>();

      const expandCluster = (clusterId: number, lng: number, lat: number) => {
        const expansionZoom = Math.min(
          index.getClusterExpansionZoom(clusterId),
          map.getMaxZoom(),
        );
        map.easeTo({
          center: [lng, lat],
          zoom: expansionZoom,
          duration: 400,
        });
      };

      for (const feature of features) {
        const [lng, lat] = feature.geometry.coordinates;
        const props = feature.properties;

        if ("cluster" in props && props.cluster) {
          const cluster = feature as ClusterFeature;
          const clusterId = cluster.properties.cluster_id;
          const count = cluster.properties.point_count;
          const key = `cluster:${clusterId}`;
          nextKeys.add(key);

          const existing = markersByKeyRef.current.get(key);
          if (existing) {
            existing.setLngLat([lng, lat]);
            continue;
          }

          const el = createClusterElement(count, () =>
            expandCluster(clusterId, lng, lat),
          );
          const marker = new maplibregl.Marker({
            element: el,
            anchor: "center",
          })
            .setLngLat([lng, lat])
            .addTo(map);
          markersByKeyRef.current.set(key, marker);
          continue;
        }

        const listingId = (props as ListingPointProps).listingId;
        const listing = listingsByIdRef.current.get(listingId);
        if (!listing) continue;

        const key = `listing:${listingId}`;
        nextKeys.add(key);

        const existing = markersByKeyRef.current.get(key);
        if (existing) {
          existing.setLngLat([listing.lng, listing.lat]);
          if (listingId === hovered) {
            existing.getElement().classList.add("is-hovered");
          } else {
            existing.getElement().classList.remove("is-hovered");
          }
          continue;
        }

        const marker = placeListingMarker(
          map,
          listing,
          localeRef.current,
          false,
          handleSelect,
          handleOpen,
          animate,
        );
        if (listingId === hovered) {
          marker.getElement().classList.add("is-hovered");
        }
        markersByKeyRef.current.set(key, marker);
      }

      if (selected) {
        const listing = listingsByIdRef.current.get(selected);
        if (listing) {
          const key = `listing:${selected}`;
          nextKeys.add(key);
          const existing = markersByKeyRef.current.get(key);
          const isExpanded = existing
            ?.getElement()
            .classList.contains("is-expanded");

          if (!existing || !isExpanded) {
            existing?.remove();
            const marker = placeListingMarker(
              map,
              listing,
              localeRef.current,
              true,
              handleSelect,
              handleOpen,
              animate && !existing,
            );
            if (selected === hovered) {
              marker.getElement().classList.add("is-hovered");
            }
            markersByKeyRef.current.set(key, marker);
          } else {
            existing.setLngLat([listing.lng, listing.lat]);
          }
        }
      }

      for (const [key, marker] of markersByKeyRef.current) {
        if (!nextKeys.has(key)) {
          marker.remove();
          markersByKeyRef.current.delete(key);
        }
      }
    };

    refreshMarkersRef.current = refreshMarkers;

    const markReady = () => {
      map.resize();
      ensureAreasLayers(map);
      fitToListings(map, listingsRef.current);
      refreshMarkers({ animate: true });
      emitBounds();
    };

    map.once("load", markReady);
    map.once("idle", markReady);

    map.on("styledata", () => {
      if (!map.isStyleLoaded()) return;
      ensureAreasLayers(map);
      const source = map.getSource(AREAS_SOURCE_ID) as
        | maplibregl.GeoJSONSource
        | undefined;
      source?.setData({
        type: "FeatureCollection",
        features: areasFeaturesRef.current,
      });
    });

    map.on("moveend", () => {
      refreshMarkers({ animate: false });
      emitBounds();
    });
    map.on("zoomend", () => {
      refreshMarkers({ animate: false });
      emitBounds();
    });

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
      markersByKeyRef.current.forEach((m) => m.remove());
      markersByKeyRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Rebuild cluster index when listing set or selection changes, then refresh.
  useEffect(() => {
    const byId = new Map<string, MapListing>();
    listings.forEach((l) => byId.set(l.id, l));
    listingsByIdRef.current = byId;
    // Keep the selected listing out of clusters so its card can expand alone.
    clusterIndexRef.current = buildClusterIndex(listings, selectedId);

    const map = mapRef.current;
    if (!map) return;

    markersByKeyRef.current.forEach((m) => m.remove());
    markersByKeyRef.current.clear();
    refreshMarkersRef.current({ animate: prevSelectedIdRef.current === selectedId });
    prevSelectedIdRef.current = selectedId ?? null;
  }, [listingKey, locale, listings, selectedId]);

  // List hover: scale the matching collapsed dot only — no expand/rebuild.
  useEffect(() => {
    const prev = prevHoveredIdRef.current ?? null;
    const next = hoveredId ?? null;
    if (prev === next) return;

    if (prev) {
      markersByKeyRef.current
        .get(`listing:${prev}`)
        ?.getElement()
        .classList.remove("is-hovered");
    }
    if (next) {
      markersByKeyRef.current
        .get(`listing:${next}`)
        ?.getElement()
        .classList.add("is-hovered");
    }

    prevHoveredIdRef.current = next;
  }, [hoveredId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || listings.length === 0) return;
    // When location areas are selected, that effect owns the camera.
    if (selectedLocations.length > 0) return;

    const run = () => {
      fitToListings(map, listings);
      refreshMarkersRef.current({ animate: true });
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

  // Draw translucent area highlights for selected search locations.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const controller = new AbortController();
    let cancelled = false;

    const applyFeatures = (features: AreaFeature[], fit: boolean) => {
      areasFeaturesRef.current = features;
      const apply = () => {
        setAreasData(map, features);
        if (fit && features.length > 0) {
          fitToAreas(map, features);
          window.setTimeout(() => {
            const b = map.getBounds();
            onBoundsChangeRef.current?.({
              west: b.getWest(),
              east: b.getEast(),
              south: b.getSouth(),
              north: b.getNorth(),
            });
            refreshMarkersRef.current({ animate: false });
          }, 520);
        }
      };
      if (map.isStyleLoaded()) apply();
      else map.once("load", apply);
    };

    const run = async () => {
      const queries = selectedLocations
        .map((q) => q.trim())
        .filter(Boolean);

      if (queries.length === 0) {
        applyFeatures([], false);
        return;
      }

      const results = await Promise.all(
        queries.map(async (query) => {
          const cacheKey = query.toLowerCase();
          if (areaCacheRef.current.has(cacheKey)) {
            return areaCacheRef.current.get(cacheKey) ?? null;
          }
          try {
            const feature = await fetchAreaFeature(query, controller.signal);
            areaCacheRef.current.set(cacheKey, feature);
            return feature;
          } catch (err) {
            if ((err as Error).name !== "AbortError") {
              areaCacheRef.current.set(cacheKey, null);
            }
            return null;
          }
        }),
      );

      if (cancelled) return;
      applyFeatures(
        results.filter((f): f is AreaFeature => Boolean(f)),
        true,
      );
    };

    void run();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locationsKey, selectedLocations]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-pisome-border bg-[#f8f4f0]">
      <div ref={containerRef} className="pisome-map" />
    </div>
  );
}
