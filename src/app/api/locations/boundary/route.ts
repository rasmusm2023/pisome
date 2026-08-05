import { NextResponse } from "next/server";

type NominatimBoundaryResult = {
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
  addresstype?: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
  geojson?: GeoJSON.Geometry;
};

type AreaFeature = {
  type: "Feature";
  properties: {
    name: string;
    query: string;
  };
  geometry: GeoJSON.Geometry;
};

const PREFERRED_TYPES = new Set([
  "city",
  "town",
  "village",
  "municipality",
  "suburb",
  "neighbourhood",
  "neighborhood",
  "quarter",
  "district",
  "borough",
  "city_district",
  "administrative",
]);

function bboxToPolygon(
  bbox: [string, string, string, string],
): GeoJSON.Polygon {
  const south = Number(bbox[0]);
  const north = Number(bbox[1]);
  const west = Number(bbox[2]);
  const east = Number(bbox[3]);
  return {
    type: "Polygon",
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  };
}

function isAreaGeometry(geometry?: GeoJSON.Geometry | null) {
  return geometry?.type === "Polygon" || geometry?.type === "MultiPolygon";
}

function scoreResult(result: NominatimBoundaryResult) {
  let score = result.importance ?? 0;
  const kind = (result.addresstype ?? result.type ?? "").toLowerCase();
  if (PREFERRED_TYPES.has(kind)) score += 1;
  if (isAreaGeometry(result.geojson)) score += 2;
  return score;
}

function toFeature(
  query: string,
  result: NominatimBoundaryResult,
): AreaFeature | null {
  const geometry = isAreaGeometry(result.geojson)
    ? result.geojson!
    : result.boundingbox
      ? bboxToPolygon(result.boundingbox)
      : null;
  if (!geometry) return null;

  return {
    type: "Feature",
    properties: {
      name: result.name ?? result.display_name ?? query,
      query,
    },
    geometry,
  };
}

async function fetchBoundary(query: string): Promise<AreaFeature | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${query}, Spain`);
  url.searchParams.set("countrycodes", "es");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("polygon_geojson", "1");
  url.searchParams.set("polygon_threshold", "0.002");
  url.searchParams.set("limit", "5");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Pisome/1.0 (https://pisome.es; location-boundary)",
    },
    next: { revalidate: 86_400 },
  });
  if (!res.ok) return null;

  const data = (await res.json()) as NominatimBoundaryResult[];
  if (!Array.isArray(data) || data.length === 0) return null;

  const ranked = [...data].sort((a, b) => scoreResult(b) - scoreResult(a));
  for (const result of ranked) {
    const feature = toFeature(query, result);
    if (feature) return feature;
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("q") ?? "").trim();
  if (raw.length < 2) {
    return NextResponse.json({ feature: null });
  }

  // Cap query length to keep Nominatim usage reasonable.
  const q = raw.slice(0, 120);

  try {
    const feature = await fetchBoundary(q);
    return NextResponse.json(
      { feature },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return NextResponse.json({ feature: null }, { status: 502 });
  }
}
