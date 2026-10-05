import { createContext, useContext, useState, ReactNode } from "react";
import { mockParkingSpots } from "@/data/mockParkingSpots";
import { ParkingSpot } from "@/types/parking";

const ParkingContext = createContext<{
  spots: ParkingSpot[];
  toggleFavorite: (id: string) => void;
} | null>(null);
export function ParkingProvider({ children }: { children: ReactNode }) {
  const [spots, setSpots] = useState(mockParkingSpots);
  function toggleFavorite(id: string) {
    setSpots((current) =>
      current.map((spot) =>
        spot.id === id ? { ...spot, isFavorite: !spot.isFavorite } : spot,
      ),
    );
  }
  return (
    <ParkingContext.Provider value={{ spots, toggleFavorite }}>
      {children}
    </ParkingContext.Provider>
  );
}
// Replace the mock source with Supabase queries when the backend is ready.
export function useParkingSpots() {
  const value = useContext(ParkingContext);
  if (!value)
    throw new Error("useParkingSpots must be used inside ParkingProvider");
  return value;
}
