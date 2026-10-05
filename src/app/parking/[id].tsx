import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Screen from "@/components/Screen";
import EmptyState from "@/components/EmptyState";
import { Button, Card, ui } from "@/components/ui";
import { useParkingSpots } from "@/hooks/useParkingSpots";
import { formatDuration } from "@/types/parking";
import { colors } from "@/constants/colors";

export default function ParkingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { spots, toggleFavorite } = useParkingSpots();
  const spot = spots.find((item) => item.id === id);
  if (!spot)
    return (
      <Screen>
        <EmptyState
          title="Spot not found"
          description="This example parking spot is unavailable."
        />
        <Button title="Back to map" onPress={() => router.replace("/")} />
      </Screen>
    );
  return (
    <Screen>
      <Text style={{ fontSize: 48, color: colors.primary, fontWeight: "800" }}>
        P
      </Text>
      <Text style={ui.title}>{spot.name}</Text>
      <Text style={ui.subtitle}>{spot.address}</Text>
      <Card>
        <Text style={ui.label}>Parking conditions</Text>
        <Text style={ui.heading}>{spot.parkingType}</Text>
        <Text style={ui.subtitle}>
          {formatDuration(spot.maxDurationMinutes)}
        </Text>
        <Text style={ui.subtitle}>{spot.availability}</Text>
        <Text style={{ color: colors.primary, fontWeight: "600" }}>
          {spot.isVerified
            ? "✓ Verified example"
            : "Awaiting verification · example"}
        </Text>
      </Card>
      <Card>
        <Text style={ui.heading}>About this spot</Text>
        <Text style={ui.subtitle}>{spot.description}</Text>
      </Card>
      <Button
        title={
          spot.isFavorite ? "★ Remove from saved spots" : "☆ Save parking spot"
        }
        onPress={() => toggleFavorite(spot.id)}
      />
      <Text style={ui.subtitle}>
        Demo data. Saved spots are kept for this session only.
      </Text>
      <Button
        title="Back to map"
        secondary
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace("/")
        }
      />
    </Screen>
  );
}
