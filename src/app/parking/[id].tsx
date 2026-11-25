import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import Screen from "@/components/Screen";
import EmptyState from "@/components/EmptyState";
import { Button, Card, ui } from "@/components/ui";
import { useParkingSpots } from "@/hooks/useParkingSpots";
import { parkingTypeLabel } from "@/types/parking";
import { parkingConditionLines, sourceAttributionLines, verificationLabel } from "@/lib/parkingPresentation";
import { colors } from "@/constants/colors";

export default function ParkingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getSpot, toggleFavorite } = useParkingSpots();
  const spot = getSpot(id);
  if (!spot)
    return (
      <Screen>
        <EmptyState
          title="Spot not found"
          description="This location is not in your current results or saved locations. Search again to load published parking. Older placeholder records cannot be restored."
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
      <Text style={ui.subtitle}>{spot.geometry.type} · {Math.round(spot.distanceMeters)} m from search point</Text>
      <Card>
        <Text style={ui.label}>Parking conditions</Text>
        <Text style={ui.heading}>{parkingTypeLabel(spot.parkingType)}</Text>
        <Text style={ui.subtitle}>Free parking · public access</Text>
        {parkingConditionLines(spot).map((line) => <Text key={line} style={ui.subtitle}>{line}</Text>)}
        <Text style={{ color: colors.primary, fontWeight: "600" }}>
          {verificationLabel(spot)}
        </Text>
        <Text style={ui.subtitle}>Check posted signs and temporary restrictions on arrival. Verification does not guarantee that restrictions remain unchanged.</Text>
      </Card>
      <Card>
        <Text style={ui.heading}>Sources</Text>
        {sourceAttributionLines(spot).map((line, index) => <Text key={`${index}-${line}`} style={ui.subtitle}>{line}</Text>)}
        {!spot.sources.length && <Text style={ui.subtitle}>Source attribution not provided.</Text>}
        {spot.sources.map((source, index) => <Text key={index} style={ui.subtitle}>{[source.sourceUrl, source.licenseUrl].filter(Boolean).join("\n")}</Text>)}
      </Card>
      <Button
        title={
          spot.isFavorite ? "★ Remove from saved spots" : "☆ Save parking spot"
        }
        onPress={() => toggleFavorite(spot.id)}
      />
      <Text style={ui.subtitle}>
        Saved locations are kept for this session only and may contain older conditions. Search again to refresh them.
      </Text>
    </Screen>
  );
}
