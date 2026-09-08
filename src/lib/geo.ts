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
