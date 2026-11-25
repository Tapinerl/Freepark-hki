import { ParkingSpot, formatDuration } from "@/types/parking";

export function parkingConditionLines(spot: ParkingSpot): string[] {
  const r = spot.restrictions;
  const lines = [formatDuration(r.maxStayMinutes)];
  if (r.parkingDiscRequired !== null) lines.push(r.parkingDiscRequired ? "Parking disc required" : "Parking disc not required");
  if (r.openingHours) lines.push(`Opening hours: ${typeof r.openingHours === "string" ? r.openingHours : r.openingHours.raw}`);
  if (r.availability === "scheduled") lines.push("Scheduled restrictions apply");
  const expressions = new Set([
    ...Object.entries(r.originalExpressions).map(([key, value]) => `${key}: ${value}`),
    ...Object.entries(r.vehicleRestrictions).map(([key, value]) => `${key}: ${value}`),
    ...r.conditionalRules.map((rule) => `${rule.key}: ${rule.raw}`),
    ...r.legacyConditions.map((rule) => `${rule.key}: ${rule.value}`),
    ...r.durations.map((rule) => `${rule.key}: ${rule.raw}`),
    ...r.schedules.map((rule) => `${rule.key}: ${rule.schedule.raw}`),
  ]);
  return [...lines, ...expressions];
}
export function sourceAttributionLines(spot: ParkingSpot) {
  return spot.sources.map((source) => [source.name, source.attribution, source.licenseName].filter(Boolean).join(" · "));
}
export function verificationLabel(spot: ParkingSpot) {
  return `Last verified: ${spot.lastVerifiedAt.slice(0, 10)}`;
}
