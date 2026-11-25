import type { Coordinates } from "./parkingSearch";

// Bounds include Helsinki's eastern districts; municipality context below
// excludes neighboring cities that share this rectangular map extent.
export const HELSINKI_BOUNDS = { sw: [24.80, 60.06], ne: [25.34, 60.31] };
export function withinHelsinkiBounds(point: Coordinates) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude) &&
    point.longitude >= HELSINKI_BOUNDS.sw[0] && point.longitude <= HELSINKI_BOUNDS.ne[0] &&
    point.latitude >= HELSINKI_BOUNDS.sw[1] && point.latitude <= HELSINKI_BOUNDS.ne[1];
}
export type Destination = Coordinates & { id: string; label: string };
type Feature = {
  id?: string;
  geometry?: { coordinates?: number[] };
  properties?: {
    mapbox_id?: string; name?: string; full_address?: string; place_formatted?: string;
    context?: { country?: { country_code?: string }; place?: { name?: string } };
  };
};
export async function searchLocations(query: string, signal: AbortSignal): Promise<Destination[]> {
  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error("Location suggestions need the Mapbox access token.");
  }
  const params = new URLSearchParams({
    q: query.trim(), access_token: token, country: "fi", language: "fi",
    proximity: "24.9384,60.1699", bbox: [...HELSINKI_BOUNDS.sw, ...HELSINKI_BOUNDS.ne].join(","),
    types: "address,street,neighborhood,locality,place", autocomplete: "true", limit: "10",
  });
  const response = await fetch(`https://api.mapbox.com/search/geocode/v6/forward?${params}`, { signal });
  if (!response.ok) throw new Error("Location suggestions are unavailable. Please try again.");
  const data: { features?: Feature[] } = await response.json();
  const remote = (data.features ?? []).flatMap((feature) => {
    const properties = feature.properties;
    const [longitude, latitude] = feature.geometry?.coordinates ?? [];
    const city = properties?.context?.place?.name?.toLowerCase();
    const isHelsinki = city === "helsinki" || city === "helsingfors" ||
      (!city && ["helsinki", "helsingfors"].includes(properties?.name?.toLowerCase() ?? ""));
    const point = { latitude, longitude };
    if (properties?.context?.country?.country_code?.toLowerCase() !== "fi" || !isHelsinki || !withinHelsinkiBounds(point)) return [];
    const label = properties.full_address ?? [properties.name, properties.place_formatted].filter(Boolean).join(", ");
    return label ? [{ ...point, id: properties.mapbox_id ?? feature.id ?? label, label }] : [];
  });
  return remote.slice(0, 5);
}
