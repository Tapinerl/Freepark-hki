import { Text } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/Screen";
import ParkingCard from "@/components/ParkingCard";
import EmptyState from "@/components/EmptyState";
import { Button, ui } from "@/components/ui";
import { useParkingSpots } from "@/hooks/useParkingSpots";
export default function SavedSpotsScreen() {
  const { spots } = useParkingSpots();
  const saved = spots.filter((spot) => spot.isFavorite);
  return (
    <Screen>
      <Text style={ui.title}>Saved Spots</Text>
      {saved.length ? (
        saved.map((spot) => <ParkingCard key={spot.id} spot={spot} />)
      ) : (
        <EmptyState
          title="No saved spots yet"
          description="Tap the star on a parking spot to save it here."
        />
      )}
      <Button
        title="‹ Back to starting screen"
        secondary
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      />
      <Text style={[ui.subtitle, { fontSize: 12 }]}>
        Saved spots are kept for this session.
      </Text>
    </Screen>
  );
}
