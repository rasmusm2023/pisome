"use client";

import { PISOME_MAP_STYLE_URL } from "@/lib/map-style";
import maplibregl, { type Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";

export function ListingMap({
  lat,
  lng,
  address,
}: {
  lat: number;
  lng: number;
  address: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: PISOME_MAP_STYLE_URL,
      center: [lng, lat],
      zoom: 15,
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

    const el = document.createElement("div");
    el.className = "pisome-marker";
    el.style.setProperty("--marker-bg", "#2563eb");

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pisome-marker__dot pisome-marker__dot--expanded";
    btn.setAttribute("aria-label", address);
    btn.title = address;
    el.appendChild(btn);

    const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
      .setLngLat([lng, lat])
      .addTo(map);

    const resize = () => map.resize();
    map.once("load", resize);
    map.once("idle", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    const t1 = window.setTimeout(resize, 50);
    const t2 = window.setTimeout(resize, 250);

    mapRef.current = map;

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      ro.disconnect();
      marker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, address]);

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-pisome-border bg-[#f8f4f0] sm:h-80">
      <div ref={containerRef} className="pisome-map h-full w-full" />
    </div>
  );
}
