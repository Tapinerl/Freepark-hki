import { ApiError } from "./client";
import { PARKING_TYPES, ParkingGeometry, ParkingPage, ParkingRestrictions, ParkingSchedule, ParkingSource, ParkingSpot, parkingTypeLabel } from "@/types/parking";
import { geometryDisplayPosition } from "@/lib/parkingGeometry";

// Mirrors Freepark-backend/src/services/parking-search/contract.ts (Phase 5.1).
// Reject incompatible records as a response error; never upgrade unknown values.
function invalid(field: string): never { throw new ApiError(`The parking API returned invalid ${field}. Please retry.`); }
function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return invalid(field);
  return value as Record<string, unknown>;
}
function array(value: unknown, field: string): unknown[] {
  return Array.isArray(value) ? value : invalid(field);
}
function string(value: unknown, field: string): string { return typeof value === "string" ? value : invalid(field); }
function boolean(value: unknown, field: string): boolean { return typeof value === "boolean" ? value : invalid(field); }
function nullableString(value: unknown, field: string) { return value === null ? null : string(value, field); }
function number(value: unknown, field: string, min = 0, max = Infinity): number {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : invalid(field);
}
function integer(value: unknown, field: string, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const result = number(value, field, min, max);
  return Number.isSafeInteger(result) ? result : invalid(field);
}
function oneOf<T extends string>(value: unknown, choices: readonly T[], field: string): T {
  return typeof value === "string" && choices.includes(value as T) ? value as T : invalid(field);
}
function nullableMinutes(value: unknown) { return value === null ? null : integer(value, "maximum stay", 1); }
function schedule(value: unknown): ParkingSchedule {
  const s = object(value, "schedule");
  return {
    raw: string(s.raw, "schedule expression"), supported: boolean(s.supported, "schedule support"),
    timezone: oneOf(s.timezone, ["Europe/Helsinki"], "schedule timezone"),
    intervals: array(s.intervals, "schedule intervals").map((entry) => {
      const pair = array(entry, "schedule interval");
      if (pair.length !== 2) return invalid("schedule interval");
      return [integer(pair[0], "schedule start", 0, 10080), integer(pair[1], "schedule end", 0, 10080)];
    }),
  };
}
function nullableSchedule(value: unknown) { return value === null ? null : schedule(value); }
function expressions(value: unknown): Record<string, string> {
  return Object.fromEntries(Object.entries(object(value, "restriction expressions")).map(([key, entry]) => [key, string(entry, "restriction expression")]));
}
function restrictions(value: unknown): ParkingRestrictions {
  const r = object(value, "restrictions");
  return {
    maxStayMinutes: nullableMinutes(r.maxStayMinutes),
    parkingDiscRequired: r.parkingDiscRequired === null ? null : boolean(r.parkingDiscRequired, "disc requirement"),
    openingHours: r.openingHours === null || typeof r.openingHours === "string" ? r.openingHours : schedule(r.openingHours),
    availability: oneOf(r.availability, ["always", "scheduled", "unknown"], "restriction schedule status"),
    durations: array(r.durations, "durations").map((entry) => {
      const d = object(entry, "duration");
      return { key: string(d.key, "duration key"), raw: string(d.raw, "duration expression"),
        status: oneOf(d.status, ["parsed", "unlimited", "ambiguous", "unsupported"], "duration status"),
        minutes: nullableMinutes(d.minutes), schedule: nullableSchedule(d.schedule), conditional: boolean(d.conditional, "conditional duration") };
    }),
    schedules: array(r.schedules, "schedules").map((entry) => {
      const s = object(entry, "restriction schedule");
      return { key: string(s.key, "schedule key"), schedule: schedule(s.schedule) };
    }),
    conditionalRules: array(r.conditionalRules, "conditional rules").map((entry) => {
      const c = object(entry, "conditional rule");
      return { key: string(c.key, "rule key"), raw: string(c.raw, "rule expression"), value: string(c.value, "rule value"), schedule: schedule(c.schedule), supported: boolean(c.supported, "rule support") };
    }),
    legacyConditions: array(r.legacyConditions, "legacy conditions").map((entry) => {
      const c = object(entry, "legacy condition");
      return { key: string(c.key, "condition key"), value: string(c.value, "condition value"), defaultValue: nullableString(c.defaultValue, "condition default"), schedule: nullableSchedule(c.schedule) };
    }),
    originalExpressions: expressions(r.originalExpressions), vehicleRestrictions: expressions(r.vehicleRestrictions),
  };
}
function position(value: unknown): number[] {
  const p = array(value, "geometry coordinate");
  if (p.length < 2 || p.length > 3) return invalid("geometry coordinate");
  return [number(p[0], "longitude", -180, 180), number(p[1], "latitude", -90, 90),
    ...(p.length === 3 ? [number(p[2], "altitude", -Infinity)] : [])];
}
function positions(value: unknown, min: number) {
  const points = array(value, "geometry coordinates").map(position);
  if (points.length < min) return invalid("geometry coordinates");
  return points;
}
function polygon(value: unknown) {
  const rings = array(value, "polygon rings").map((ring) => {
    const points = positions(ring, 4);
    if (points[0].length !== points.at(-1)!.length || !points[0].every((n, i) => n === points.at(-1)![i])) return invalid("unclosed polygon");
    return points;
  });
  return rings.length ? rings : invalid("polygon rings");
}
export function parseParkingGeometry(value: unknown): ParkingGeometry {
  const g = object(value, "geometry");
  switch (g.type) {
    case "Point": return { type: g.type, coordinates: position(g.coordinates) };
    case "MultiPoint": return { type: g.type, coordinates: positions(g.coordinates, 1) };
    case "LineString": return { type: g.type, coordinates: positions(g.coordinates, 2) };
    case "MultiLineString": {
      const lines = array(g.coordinates, "multiline coordinates").map((line) => positions(line, 2));
      if (!lines.length) return invalid("multiline coordinates");
      return { type: g.type, coordinates: lines };
    }
    case "Polygon": return { type: g.type, coordinates: polygon(g.coordinates) };
    case "MultiPolygon": {
      const polygons = array(g.coordinates, "multipolygon coordinates").map(polygon);
      if (!polygons.length) return invalid("multipolygon coordinates");
      return { type: g.type, coordinates: polygons };
    }
    default: return invalid("geometry type");
  }
}
function publicUrl(value: unknown): string | null {
  if (value === null) return null;
  const text = string(value, "source URL");
  try {
    const url = new URL(text);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) return invalid("source URL");
  } catch { return invalid("source URL"); }
  return text;
}
function source(value: unknown): ParkingSource {
  const s = object(value, "source attribution");
  return { name: string(s.name, "source name"), attribution: nullableString(s.attribution, "attribution"), licenseName: nullableString(s.licenseName, "license"), licenseUrl: publicUrl(s.licenseUrl), sourceUrl: publicUrl(s.sourceUrl) };
}
function parkingSpot(value: unknown): ParkingSpot {
  const s = object(value, "parking location");
  const id = string(s.id, "parking ID");
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return invalid("parking ID");
  const lastVerifiedAt = string(s.lastVerifiedAt, "verification date");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(lastVerifiedAt) || !Number.isFinite(Date.parse(lastVerifiedAt)) || new Date(lastVerifiedAt).toISOString().slice(0, 19) !== lastVerifiedAt.slice(0, 19)) return invalid("verification date");
  const parkingType = oneOf(s.parkingType, PARKING_TYPES, "parking type");
  const geometry = parseParkingGeometry(s.geometry);
  return {
    id, kind: oneOf(s.kind, ["parking_spot"], "record kind"), name: parkingTypeLabel(parkingType), parkingType,
    geometry, displayPosition: geometryDisplayPosition(geometry),
    feeStatus: oneOf(s.feeStatus, ["free"], "fee status"), accessStatus: oneOf(s.accessStatus, ["public"], "access status"),
    eligibilityStatus: oneOf(s.eligibilityStatus, ["eligible"], "eligibility status"), publicationStatus: oneOf(s.publicationStatus, ["published"], "publication status"),
    verificationStatus: oneOf(s.verificationStatus, ["verified"], "verification status"), lastVerifiedAt,
    distanceMeters: number(s.distanceMeters, "distance"), restrictions: restrictions(s.restrictions),
    sources: array(s.sources, "sources").map(source), isFavorite: false,
  };
}
export function normalizeParkingPage(value: unknown): ParkingPage {
  const page = object(value, "parking response");
  const scope = oneOf(page.scope, ["published"], "response scope");
  const p = object(page.pagination, "pagination");
  const pagination = { limit: integer(p.limit, "page limit", 1, 100), offset: integer(p.offset, "page offset", 0, 10000), total: integer(p.total, "total") };
  const data = array(page.data, "parking results").map(parkingSpot);
  if (data.length !== Math.min(pagination.limit, Math.max(0, pagination.total - pagination.offset)) || new Set(data.map((s) => s.id)).size !== data.length) return invalid("page contents");
  return { scope, data, pagination };
}
