import { NextResponse } from "next/server";

export type GeoSuggestion = {
  label: string;
  kind: "city" | "neighborhood" | "street";
  value: string;
  city?: string;
};

type PhotonFeature = {
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    district?: string;
    locality?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    type?: string;
    osm_key?: string;
    osm_value?: string;
  };
};

type NominatimResult = {
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
  addresstype?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    quarter?: string;
    road?: string;
    pedestrian?: string;
    state?: string;
  };
};

const CITY_VALUES = new Set([
  "city",
  "town",
  "village",
  "municipality",
  "hamlet",
  "locality",
]);
const NEIGHBORHOOD_VALUES = new Set([
  "suburb",
  "neighbourhood",
  "neighborhood",
  "quarter",
  "district",
  "borough",
  "city_district",
]);

function mapPhotonFeature(feature: PhotonFeature): GeoSuggestion | null {
  const p = feature.properties;
  if (!p) return null;
  if ((p.countrycode ?? "").toUpperCase() !== "ES") return null;

  const name = (p.name ?? "").trim();
  if (!name) return null;

  const osmValue = (p.osm_value ?? "").toLowerCase();
  const type = (p.type ?? "").toLowerCase();
  const city =
    p.city?.trim() ||
    p.locality?.trim() ||
    p.county?.trim() ||
    undefined;

  if (
    CITY_VALUES.has(osmValue) ||
    CITY_VALUES.has(type) ||
    type === "city" ||
    type === "locality"
  ) {
    const region = p.state?.trim();
    return {
      kind: "city",
      value: name,
      city: name,
      label: region && region !== name ? `${name}, ${region}` : name,
    };
  }

  if (
    NEIGHBORHOOD_VALUES.has(osmValue) ||
    NEIGHBORHOOD_VALUES.has(type) ||
    type === "district"
  ) {
    return {
      kind: "neighborhood",
      value: name,
      city,
      label: city ? `${name}, ${city}` : name,
    };
  }

  if (
    p.osm_key === "highway" ||
    type === "street" ||
    osmValue === "residential" ||
    osmValue === "pedestrian" ||
    osmValue === "living_street" ||
    Boolean(p.street)
  ) {
    const street = name || p.street?.trim();
    if (!street) return null;
    return {
      kind: "street",
      value: street,
      city,
      label: city ? `${street}, ${city}` : street,
    };
  }

  const placeCity = city ?? name;
  return {
    kind: city && city !== name ? "neighborhood" : "city",
    value: name,
    city: placeCity,
    label: city && city !== name ? `${name}, ${city}` : name,
  };
}

function mapNominatim(result: NominatimResult): GeoSuggestion | null {
  const address = result.address ?? {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    undefined;
  const neighborhood =
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.quarter ||
    undefined;
  const street = address.road || address.pedestrian || undefined;
  const type = (result.addresstype ?? result.type ?? "").toLowerCase();
  const cls = (result.class ?? "").toLowerCase();
  const name = (result.name ?? "").trim();

  if (cls === "highway" || type === "road" || street) {
    const value = street || name;
    if (!value) return null;
    return {
      kind: "street",
      value,
      city,
      label: city ? `${value}, ${city}` : value,
    };
  }

  if (NEIGHBORHOOD_VALUES.has(type) || (neighborhood && type !== "city")) {
    const value = name || neighborhood;
    if (!value) return null;
    return {
      kind: "neighborhood",
      value,
      city,
      label: city ? `${value}, ${city}` : value,
    };
  }

  if (
    CITY_VALUES.has(type) ||
    type === "administrative" ||
    Boolean(city) ||
    Boolean(name)
  ) {
    const value = name || city;
    if (!value) return null;
    const region = address.state?.trim();
    return {
      kind: "city",
      value,
      city: value,
      label: region && region !== value ? `${value}, ${region}` : value,
    };
  }

  return null;
}

function dedupe(suggestions: GeoSuggestion[], limit: number) {
  const seen = new Set<string>();
  const out: GeoSuggestion[] = [];
  for (const s of suggestions) {
    const key = `${s.kind}:${s.label.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

async function suggestFromPhoton(q: string): Promise<GeoSuggestion[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  // Over-fetch: many hits are outside Spain and get filtered out.
  url.searchParams.set("limit", "40");
  url.searchParams.set("lang", "default");
  url.searchParams.set("lat", "40.4168");
  url.searchParams.set("lon", "-3.7038");
  url.searchParams.set("zoom", "5");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Pisome/1.0 (https://pisome.es; location-suggest)",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as { features?: PhotonFeature[] };
  return dedupe(
    (data.features ?? [])
      .map(mapPhotonFeature)
      .filter((s): s is GeoSuggestion => Boolean(s)),
    8,
  );
}

async function suggestFromNominatim(q: string): Promise<GeoSuggestion[]> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "es");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": "Pisome/1.0 (https://pisome.es; location-suggest)",
    },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as NominatimResult[];
  return dedupe(
    data.map(mapNominatim).filter((s): s is GeoSuggestion => Boolean(s)),
    8,
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ suggestions: [] as GeoSuggestion[] });
  }

  try {
    let suggestions = await suggestFromPhoton(q);
    if (suggestions.length < 3) {
      const extra = await suggestFromNominatim(q);
      suggestions = dedupe([...suggestions, ...extra], 8);
    }

    return NextResponse.json(
      { suggestions },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { suggestions: [] as GeoSuggestion[] },
      { status: 502 },
    );
  }
}
