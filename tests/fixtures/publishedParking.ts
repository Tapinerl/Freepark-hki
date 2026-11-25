// Synthetic test-only data. Never imported by src/ or selected at runtime.
import type { ParkingGeometry } from "@/types/parking";
export const POINT: ParkingGeometry = { type: "Point", coordinates: [25.031, 60.191] };
export const LINE: ParkingGeometry = { type: "LineString", coordinates: [[25.03, 60.19], [25.032, 60.192]] };
export const POLYGON: ParkingGeometry = { type: "Polygon", coordinates: [[[25.03, 60.19], [25.032, 60.19], [25.032, 60.192], [25.03, 60.19]]] };
export function publishedRecord(index = 1, geometry: ParkingGeometry = POINT) {
  return {
    id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    kind: "parking_spot", parkingType: "surface", geometry,
    feeStatus: "free", accessStatus: "public", eligibilityStatus: "eligible",
    publicationStatus: "published", verificationStatus: "verified", lastVerifiedAt: "2026-11-23T10:00:00.000Z",
    distanceMeters: index * 25,
    restrictions: {
      maxStayMinutes: 120, parkingDiscRequired: true, openingHours: null, availability: "unknown",
      durations: [], schedules: [], conditionalRules: [], legacyConditions: [],
      originalExpressions: { maxstay: "2 hours" }, vehicleRestrictions: { maxheight: "2.1" },
    },
    sources: [{ name: "Synthetic source", attribution: "Test fixture attribution", licenseName: "Test license", licenseUrl: "https://example.com/license", sourceUrl: "https://example.com/fixture" }],
  };
}
export function publishedPage(data: unknown[] = [], limit = 50, offset = 0, total = data.length) {
  return { scope: "published", data, pagination: { limit, offset, total } };
}
