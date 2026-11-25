import { ApiError, requestParkingJson } from "./client";
import { normalizeParkingPage } from "./parkingAdapter";
import { BackendParkingType, Coordinates, PARKING_TYPES, ParkingPage } from "@/types/parking";

export const DEFAULT_RADIUS_METERS = 500;
export const MIN_RADIUS_METERS = 50;
export const MAX_RADIUS_METERS = 5000;
export type ParkingQuery = Coordinates & { radius?: number; parkingType?: BackendParkingType; limit?: number; offset?: number };

export function parkingQueryParams(query: ParkingQuery) {
  const { latitude, longitude, radius = DEFAULT_RADIUS_METERS, limit = 50, offset = 0, parkingType } = query;
  for (const [label, value, min, max] of [
    ["Latitude", latitude, -90, 90], ["Longitude", longitude, -180, 180],
    ["Radius", radius, MIN_RADIUS_METERS, MAX_RADIUS_METERS],
    ["Limit", limit, 1, 100], ["Offset", offset, 0, 10000],
  ] as const) {
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new ApiError(`${label} must be between ${min} and ${max}.`);
  }
  if (!Number.isInteger(limit) || !Number.isInteger(offset)) throw new ApiError("Limit and offset must be integers.");
  if (parkingType !== undefined && !PARKING_TYPES.includes(parkingType)) throw new ApiError("Unsupported parking type.");
  const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude), radius: String(radius), limit: String(limit), offset: String(offset) });
  if (parkingType !== undefined) params.set("parkingType", parkingType);
  return params;
}
export async function fetchPublishedParking(query: ParkingQuery, signal?: AbortSignal): Promise<ParkingPage> {
  const params = parkingQueryParams(query);
  const page = normalizeParkingPage(await requestParkingJson(params, signal));
  if (page.pagination.limit !== Number(params.get("limit")) || page.pagination.offset !== Number(params.get("offset"))) {
    throw new ApiError("The parking API returned an unexpected page.");
  }
  return page;
}
