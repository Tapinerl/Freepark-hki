import { ParkingSpot } from "@/types/parking";
export type Coordinates = { latitude: number; longitude: number };
function distanceKm(a: Coordinates, b: Coordinates) {
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
      // Selected durations are alternatives: matching any one is enough.
      // No selection leaves the duration unrestricted.
      (durations.length === 0 ||
        spot.maxDurationMinutes === null ||
        durations.some(
          (duration) => (spot.maxDurationMinutes ?? Infinity) >= duration,
        )) &&
      (coordinates
        ? distanceKm(coordinates, spot) <= 5
        : `${spot.name} ${spot.address} ${spot.neighborhood}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())),
  );
  return coordinates
    ? matches.sort(
        (a, b) => distanceKm(coordinates, a) - distanceKm(coordinates, b),
      )
    : matches;
}
