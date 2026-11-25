import type { FeatureCollection } from "geojson";
import type { Coordinates, ParkingGeometry, ParkingSpot } from "@/types/parking";

// A real source vertex is always on the feature, including concave polygons
// with holes. A centroid/bounding-box center could lie outside legal parking.
// This is an anchor for display only, never an entrance or a parking space.
export function geometryDisplayPosition(geometry: ParkingGeometry): Coordinates {
  let position: number[];
  switch (geometry.type) {
    case "Point": position = geometry.coordinates; break;
    case "MultiPoint": case "LineString": position = geometry.coordinates[0]; break;
    case "MultiLineString": case "Polygon": position = geometry.coordinates[0][0]; break;
    case "MultiPolygon": position = geometry.coordinates[0][0][0]; break;
  }
  return { longitude: position[0], latitude: position[1] };
}
export function parkingFeatureCollection(spots: ParkingSpot[], selectedId: string | null): FeatureCollection<ParkingGeometry> {
  return { type: "FeatureCollection", features: spots.map((spot) => ({
    type: "Feature", id: spot.id, geometry: spot.geometry,
    properties: { locationId: spot.id, selected: spot.id === selectedId },
  })) };
}
export function selectedFeatureId(features: { properties?: { [name: string]: unknown } | null }[], spots: ParkingSpot[]) {
  const id = features[0]?.properties?.locationId;
  return typeof id === "string" && spots.some((spot) => spot.id === id) ? id : null;
}
