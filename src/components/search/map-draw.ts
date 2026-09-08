import type { LngLatPair } from "@/lib/geo";
import { closeRing } from "@/lib/geo";
import type { Map as MapLibreMap } from "maplibre-gl";
import maplibregl from "maplibre-gl";

export const DRAW_SOURCE_ID = "pisome-draw-area";
export const DRAW_FILL_LAYER_ID = "pisome-draw-area-fill";
export const DRAW_LINE_LAYER_ID = "pisome-draw-area-line";
export const DRAW_PREVIEW_LAYER_ID = "pisome-draw-area-preview";
export const DRAW_VERTEX_HALO_LAYER_ID = "pisome-draw-area-vertex-halo";
export const DRAW_VERTEX_LAYER_ID = "pisome-draw-area-vertices";
export const CLOSE_VERTEX_PX = 16;
export const VERTEX_DRAG_PX = 4;
export const VERTEX_HIT_PX = 18;

const FILL = "rgba(37, 99, 235, 0.16)";
const BORDER = "rgba(37, 99, 235, 0.85)";
const PREVIEW = "rgba(37, 99, 235, 0.55)";

export function pixelDistance(
  map: MapLibreMap,
  a: LngLatPair,
  b: LngLatPair,
): number {
  const pa = map.project({ lng: a[0], lat: a[1] });
  const pb = map.project({ lng: b[0], lat: b[1] });
  const dx = pa.x - pb.x;
  const dy = pa.y - pb.y;
  return Math.hypot(dx, dy);
}

export function isCloseToOrigin(
  map: MapLibreMap,
  vertices: LngLatPair[],
  point: LngLatPair,
): boolean {
  if (vertices.length < 3) return false;
  return pixelDistance(map, vertices[0], point) <= CLOSE_VERTEX_PX;
}

export function vertexIndexAtPointer(
  map: MapLibreMap,
  vertices: LngLatPair[],
  clientX: number,
  clientY: number,
  radiusPx = VERTEX_HIT_PX,
): number | null {
  if (vertices.length === 0) return null;
  const rect = map.getCanvas().getBoundingClientRect();
  if (
    clientX < rect.left ||
    clientX > rect.right ||
    clientY < rect.top ||
    clientY > rect.bottom
  ) {
    return null;
  }
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let best: number | null = null;
  let bestDist = radiusPx;
  vertices.forEach((pair, index) => {
    const projected = map.project({ lng: pair[0], lat: pair[1] });
    const dist = Math.hypot(projected.x - x, projected.y - y);
    if (dist <= bestDist) {
      bestDist = dist;
      best = index;
    }
  });
  return best;
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

export function drawCollection(
  vertices: LngLatPair[],
  closed: boolean,
  cursor: LngLatPair | null,
  hoveredIndex: number | null = null,
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];

  if (vertices.length === 0) return emptyCollection();

  if (closed && vertices.length >= 3) {
    const ring = closeRing(vertices);
    features.push({
      type: "Feature",
      properties: { kind: "fill" },
      geometry: { type: "Polygon", coordinates: [ring] },
    });
    features.push({
      type: "Feature",
      properties: { kind: "line" },
      geometry: { type: "LineString", coordinates: ring },
    });
  } else {
    if (vertices.length >= 2) {
      features.push({
        type: "Feature",
        properties: { kind: "line" },
        geometry: { type: "LineString", coordinates: vertices },
      });
    }

    if (cursor) {
      const last = vertices[vertices.length - 1];
      features.push({
        type: "Feature",
        properties: { kind: "preview" },
        geometry: {
          type: "LineString",
          coordinates: [last, cursor],
        },
      });
      if (vertices.length >= 3) {
        features.push({
          type: "Feature",
          properties: { kind: "preview" },
          geometry: {
            type: "LineString",
            coordinates: [cursor, vertices[0]],
          },
        });
      }
    } else if (vertices.length >= 3) {
      features.push({
        type: "Feature",
        properties: { kind: "preview" },
        geometry: {
          type: "LineString",
          coordinates: [vertices[vertices.length - 1], vertices[0]],
        },
      });
    }
  }

  const closableOrigin = !closed && vertices.length >= 3;
  vertices.forEach((pair, index) => {
    const hot = hoveredIndex === index ? 1 : 0;
    const origin = index === 0 ? 1 : 0;
    features.push({
      type: "Feature",
      properties: {
        kind: "vertex-halo",
        hot,
      },
      geometry: { type: "Point", coordinates: pair },
    });
    features.push({
      type: "Feature",
      properties: {
        kind: "vertex",
        origin,
        closable: origin && closableOrigin ? 1 : 0,
        hot,
      },
      geometry: { type: "Point", coordinates: pair },
    });
  });

  return { type: "FeatureCollection", features };
}

export function ensureDrawLayers(map: MapLibreMap) {
  if (!map.isStyleLoaded()) return;
  if (!map.getSource(DRAW_SOURCE_ID)) {
    map.addSource(DRAW_SOURCE_ID, {
      type: "geojson",
      data: emptyCollection(),
    });
  }
  if (!map.getLayer(DRAW_FILL_LAYER_ID)) {
    map.addLayer({
      id: DRAW_FILL_LAYER_ID,
      type: "fill",
      source: DRAW_SOURCE_ID,
      filter: ["==", ["get", "kind"], "fill"],
      paint: {
        "fill-color": FILL,
        "fill-opacity": 1,
      },
    });
  }
  if (!map.getLayer(DRAW_LINE_LAYER_ID)) {
    map.addLayer({
      id: DRAW_LINE_LAYER_ID,
      type: "line",
      source: DRAW_SOURCE_ID,
      filter: ["==", ["get", "kind"], "line"],
      paint: {
        "line-color": BORDER,
        "line-width": 2.5,
        "line-opacity": 1,
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
    });
  }
  if (!map.getLayer(DRAW_PREVIEW_LAYER_ID)) {
    map.addLayer({
      id: DRAW_PREVIEW_LAYER_ID,
      type: "line",
      source: DRAW_SOURCE_ID,
      filter: ["==", ["get", "kind"], "preview"],
      paint: {
        "line-color": PREVIEW,
        "line-width": 2,
        "line-dasharray": [2.2, 1.6],
        "line-opacity": 1,
      },
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
    });
  }
  if (!map.getLayer(DRAW_VERTEX_HALO_LAYER_ID)) {
    map.addLayer({
      id: DRAW_VERTEX_HALO_LAYER_ID,
      type: "circle",
      source: DRAW_SOURCE_ID,
      filter: ["==", ["get", "kind"], "vertex-halo"],
      paint: {
        "circle-radius": ["case", ["==", ["get", "hot"], 1], 18, 14],
        "circle-color": "rgba(37, 99, 235, 0.22)",
        "circle-stroke-width": 0,
      },
    });
  }
  if (!map.getLayer(DRAW_VERTEX_LAYER_ID)) {
    map.addLayer({
      id: DRAW_VERTEX_LAYER_ID,
      type: "circle",
      source: DRAW_SOURCE_ID,
      filter: ["==", ["get", "kind"], "vertex"],
      paint: {
        "circle-radius": ["case", ["==", ["get", "hot"], 1], 13, 10],
        "circle-color": "#ffffff",
        "circle-stroke-width": ["case", ["==", ["get", "hot"], 1], 4, 3],
        "circle-stroke-color": BORDER,
        "circle-opacity": 1,
        "circle-stroke-opacity": 1,
      },
    });
  }
}

export function setDrawData(
  map: MapLibreMap,
  vertices: LngLatPair[],
  closed: boolean,
  cursor: LngLatPair | null,
  hoveredIndex: number | null = null,
) {
  ensureDrawLayers(map);
  const source = map.getSource(DRAW_SOURCE_ID) as
    | maplibregl.GeoJSONSource
    | undefined;
  source?.setData(drawCollection(vertices, closed, cursor, hoveredIndex));
}

export function setDrawCursor(map: MapLibreMap, drawing: boolean) {
  const canvas = map.getCanvas();
  const container = map.getCanvasContainer();
  if (drawing) {
    canvas.classList.add("is-drawing");
    container.classList.add("is-drawing");
    map.doubleClickZoom.disable();
  } else {
    canvas.classList.remove("is-drawing");
    container.classList.remove("is-drawing");
    map.doubleClickZoom.enable();
  }
}
