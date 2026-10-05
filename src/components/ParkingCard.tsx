import { Pressable, StyleSheet, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { router } from "expo-router";
import { ParkingSpot, formatDuration } from "@/types/parking";
import { colors } from "@/constants/colors";
import { useParkingSpots } from "@/hooks/useParkingSpots";
import { ui } from "./ui";

export default function ParkingCard({ spot, variant = "default" }: { spot: ParkingSpot; variant?: "default" | "results" }) {
  const resultCard = variant === "results";
  const { toggleFavorite } = useParkingSpots();
  function openDetail() {
    router.push({ pathname: "/parking/[id]", params: { id: spot.id } });
  }
  return (
    <View style={[ui.card, { padding: 16 }, resultCard && styles.resultCard]}>
      <View style={ui.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View ${spot.name}`}
          onPress={openDetail}
          style={[ui.row, { flex: 1, minHeight: 48 }]}
        >
          <View
            style={{
              width: 44,
              height: 44,
              backgroundColor: colors.primary,
              borderRadius: 22,
              borderBottomRightRadius: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "700", color: "white" }}>
              P
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ui.heading}>{spot.name}</Text>
            <Text style={[ui.subtitle, { fontSize: 13 }]}>
              {spot.neighborhood}
            </Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            spot.isFavorite ? `Unsave ${spot.name}` : `Save ${spot.name}`
          }
          accessibilityState={{ selected: spot.isFavorite }}
          onPress={() => toggleFavorite(spot.id)}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {resultCard ? <SymbolView
            name={{ ios: spot.isFavorite ? "bookmark.fill" : "bookmark", android: spot.isFavorite ? "bookmark" : "bookmark_border", web: spot.isFavorite ? "bookmark" : "bookmark_border" }}
            tintColor={colors.primary}
            size={20}
          /> : <Text style={{ fontSize: 28, color: colors.primary }}>
            {spot.isFavorite ? "★" : "☆"}
          </Text>}
        </Pressable>
      </View>
      {resultCard ? <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Parking conditions for ${spot.name}`}
        onPress={openDetail}
        style={styles.conditions}
      >
        <View style={[styles.pill, styles.availability]}>
          <SymbolView name={{ ios: "clock", android: "schedule", web: "schedule" }} tintColor="white" size={15} />
          <Text style={[styles.pillText, { color: "white" }]}>{spot.availability}</Text>
        </View>
        <View style={[styles.pill, styles.duration]}>
          <SymbolView name={{ ios: "timer", android: "timer", web: "timer" }} tintColor={colors.text} size={15} />
          <Text style={styles.pillText}>{formatDuration(spot.maxDurationMinutes)}</Text>
        </View>
        <View style={styles.chevron}>
          <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} tintColor={colors.text} size={18} />
        </View>
      </Pressable> : <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Parking conditions for ${spot.name}`}
        onPress={openDetail}
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          minHeight: 44,
        }}
      >
        <Text
          style={{
            backgroundColor: colors.primary,
            color: "white",
            padding: 10,
            borderRadius: 20,
            fontSize: 12,
          }}
        >
          {spot.availability}
        </Text>
        <Text
          style={{
            borderColor: colors.primary,
            borderWidth: 1,
            color: colors.text,
            padding: 10,
            borderRadius: 20,
            fontSize: 12,
          }}
        >
          {formatDuration(spot.maxDurationMinutes)}
        </Text>
      </Pressable>}
    </View>
  );
}

const styles = StyleSheet.create({
  resultCard: { borderWidth: 0, borderRadius: 14, gap: 10, boxShadow: "0px 3px 8px #18212D0D" },
  conditions: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, minHeight: 40 },
  pill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 24 },
  availability: { backgroundColor: colors.primary },
  duration: { borderColor: colors.primary, borderWidth: 1.5 },
  pillText: { fontSize: 13, color: colors.text },
  chevron: { marginLeft: "auto" },
});
