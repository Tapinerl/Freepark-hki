export type ParkingType = "Street parking" | "Parking lot";
export type ParkingSpot = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  parkingType: ParkingType;
  maxDurationMinutes: number | null;
  description: string;
  isVerified: boolean;
  isFavorite: boolean;
  neighborhood: string;
  availability: string;
};
export function formatDuration(minutes: number | null) {
  if (minutes === null) return "No max stay listed";
  return minutes < 60 ? `Max ${minutes} min` : `Max ${minutes / 60} h`;
}
