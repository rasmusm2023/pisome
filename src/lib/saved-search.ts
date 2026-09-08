import { parseDrawnArea, serializeDrawnArea, type LngLatPair } from "@/lib/geo";

export function searchHrefFromSavedSearch(search: {
  city: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  minRooms: number | null;
  propertyType: string | null;
  drawnArea: string | null;
}) {
  const params = new URLSearchParams();
  if (search.city) params.set("locations", search.city);
  if (search.minPrice != null) params.set("minPrice", String(search.minPrice));
  if (search.maxPrice != null) params.set("maxPrice", String(search.maxPrice));
  if (search.minRooms != null) params.set("minRooms", String(search.minRooms));
  if (search.propertyType) params.set("propertyType", search.propertyType);
  const area = parseDrawnArea(search.drawnArea);
  if (area) params.set("area", serializeDrawnArea(area));
  const qs = params.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function withDrawnAreaParam(
  params: URLSearchParams,
  area: LngLatPair[] | null,
) {
  const next = new URLSearchParams(params);
  if (area && area.length >= 3) {
    next.set("area", serializeDrawnArea(area));
  } else {
    next.delete("area");
  }
  return next;
}
