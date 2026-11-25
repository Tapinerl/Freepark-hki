import type { LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from "geojson";

// The contribution form remains a local demo; its labels are not API filters.
export type ParkingType = "Street parking" | "Parking lot";
export const PARKING_TYPES = ["unknown", "street", "surface", "multi_storey", "underground", "park_and_ride", "other"] as const;
export type BackendParkingType = typeof PARKING_TYPES[number];
export type ParkingGeometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon;
export type Coordinates = { latitude: number; longitude: number };
export type ParkingSchedule = {
  raw: string;
  supported: boolean;
  timezone: "Europe/Helsinki";
  intervals: [number, number][];
};
export type ParkingRestrictions = {
  maxStayMinutes: number | null;
  parkingDiscRequired: boolean | null;
  openingHours: ParkingSchedule | string | null;
  availability: "always" | "scheduled" | "unknown";
  durations: { key: string; raw: string; status: "parsed" | "unlimited" | "ambiguous" | "unsupported"; minutes: number | null; schedule: ParkingSchedule | null; conditional: boolean }[];
  schedules: { key: string; schedule: ParkingSchedule }[];
  conditionalRules: { key: string; raw: string; value: string; schedule: ParkingSchedule; supported: boolean }[];
  legacyConditions: { key: string; value: string; defaultValue: string | null; schedule: ParkingSchedule | null }[];
  originalExpressions: Record<string, string>;
  vehicleRestrictions: Record<string, string>;
};
export type ParkingSource = {
  name: string;
  attribution: string | null;
  licenseName: string | null;
  licenseUrl: string | null;
  sourceUrl: string | null;
};
export type ParkingSpot = {
  id: string;
  kind: "parking_spot";
  name: string; // Type label: the public API does not return names or addresses.
  parkingType: BackendParkingType;
  geometry: ParkingGeometry;
  displayPosition: Coordinates; // Source vertex used only for camera/callout placement.
  feeStatus: "free";
  accessStatus: "public";
  eligibilityStatus: "eligible";
  publicationStatus: "published";
  verificationStatus: "verified";
  lastVerifiedAt: string;
  distanceMeters: number;
  restrictions: ParkingRestrictions;
  sources: ParkingSource[];
  isFavorite: boolean;
};
export type Pagination = { limit: number; offset: number; total: number };
export type ParkingPage = { scope: "published"; data: ParkingSpot[]; pagination: Pagination };

export function parkingTypeLabel(type: BackendParkingType) {
  const labels: Record<BackendParkingType, string> = {
    unknown: "Parking location", street: "Street parking", surface: "Surface parking area",
    multi_storey: "Multi-storey parking", underground: "Underground parking",
    park_and_ride: "Park and ride", other: "Parking location",
  };
  return labels[type];
}
export function formatDuration(minutes: number | null) {
  if (minutes === null) return "Maximum stay not confirmed";
  return minutes < 60 ? `Max ${minutes} min` : `Max ${minutes / 60} h`;
}
