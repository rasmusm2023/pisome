/** `[lng, lat]` pair in GeoJSON order. */
export type LngLatPair = [number, number];

function ringWithoutDuplicateClose(ring: LngLatPair[]): LngLatPair[] {
  if (ring.length < 2) return ring;
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] === last[0] && first[1] === last[1]) {
    return ring.slice(0, -1);
  }
  return ring;
}

export function closeRing(vertices: LngLatPair[]): LngLatPair[] {
  const open = ringWithoutDuplicateClose(vertices);
  if (open.length === 0) return [];
  return [...open, open[0]];
}

/** Ray-casting point-in-polygon. `ring` may be open or closed. */
export function isPointInPolygon(
  point: { lat: number; lng: number },
  ring: LngLatPair[],
): boolean {
  const pts = ringWithoutDuplicateClose(ring);
  if (pts.length < 3) return false;

  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    const intersect =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

const AREA_PRECISION = 5;

function roundCoord(value: number) {
  const factor = 10 ** AREA_PRECISION;
  return Math.round(value * factor) / factor;
}

export function serializeDrawnArea(vertices: LngLatPair[]): string {
  return vertices
    .map(([lng, lat]) => `${roundCoord(lng)},${roundCoord(lat)}`)
    .join("_");
}

export function parseDrawnArea(raw?: string | null): LngLatPair[] | null {
  if (!raw) return null;
  const ring: LngLatPair[] = [];
  for (const part of raw.split("_")) {
    const [lngRaw, latRaw] = part.split(",");
    const lng = Number(lngRaw);
    const lat = Number(latRaw);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
    ring.push([lng, lat]);
  }
  return ring.length >= 3 ? ring : null;
}
