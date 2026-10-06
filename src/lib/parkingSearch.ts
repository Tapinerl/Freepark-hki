import { ParkingSpot } from "@/types/parking";
import { withinHelsinkiBounds } from "./locationSearch";
import { matchesDuration } from "./durationFilters";
export type Coordinates = { latitude: number; longitude: number };
export function distanceKm(a: Coordinates, b: Coordinates) {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const lat = radians(b.latitude - a.latitude);
  const lon = radians(b.longitude - a.longitude);
  const value =
    Math.sin(lat / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(lon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}
export function destinationZoom(destination: Coordinates, spots: ParkingSpot[], width: number, height: number) {
  const mercatorY = (latitude: number) => {
    const sine = Math.sin(latitude * Math.PI / 180);
    return 0.5 - Math.log((1 + sine) / (1 - sine)) / (4 * Math.PI);
  };
  let dx = 0;
  let dy = 0;
  // Symmetric extents keep the destination centered and reveal nearby options.
  for (const spot of [...spots].sort((a, b) => distanceKm(destination, a) - distanceKm(destination, b)).slice(0, 3)) {
    dx = Math.max(dx, Math.abs(spot.longitude - destination.longitude) / 360);
    dy = Math.max(dy, Math.abs(mercatorY(spot.latitude) - mercatorY(destination.latitude)));
  }
  const horizontal = dx ? Math.log2(Math.max(40, width - 80) / (1024 * dx)) : 14.5;
  const vertical = dy ? Math.log2(Math.max(40, height - 80) / (1024 * dy)) : 14.5;
  return Math.max(8, Math.min(14.5, horizontal, vertical));
}
export function nearbySpots(
  spots: ParkingSpot[],
  options: {
    query: string;
    durations: number[];
    coordinates: Coordinates | null;
  },
) {
  const { query, durations, coordinates } = options;
  const matches = spots.filter(
    (spot) =>
      withinHelsinkiBounds(spot) && matchesDuration(spot.maxDurationMinutes, durations) &&
      (coordinates
        ? true
        : `${spot.name} ${spot.address} ${spot.neighborhood}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())),
  );
  if (!coordinates) return matches;
  if (!withinHelsinkiBounds(coordinates)) return [];
  matches.sort((a, b) => distanceKm(coordinates, a) - distanceKm(coordinates, b));
  // Expand beyond 5 km when necessary to include the closest eligible spot.
  const radius = Math.max(5, matches[0] ? distanceKm(coordinates, matches[0]) * 1.15 : 5);
  return matches.filter((spot) => distanceKm(coordinates, spot) <= radius);
}
