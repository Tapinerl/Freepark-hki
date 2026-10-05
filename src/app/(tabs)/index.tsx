import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import * as Location from "expo-location";
import Screen from "@/components/Screen";
import SearchBar from "@/components/SearchBar";
import { DurationFilter } from "@/components/FilterSheet";
import ParkingIllustration from "@/components/ParkingIllustration";
import ParkingResults from "@/components/ParkingResults";
import ResultToggle from "@/components/ResultToggle";
import { Button, ui } from "@/components/ui";
import { colors } from "@/constants/colors";
import { useParkingSpots } from "@/hooks/useParkingSpots";
import { nearbySpots, Coordinates } from "@/lib/parkingSearch";

export default function MapScreen() {
  const { spots } = useParkingSpots();
  const [query, setQuery] = useState("");
  const [durations, setDurations] = useState<number[]>([60]);
  const [mode, setMode] = useState<"Map" | "List">("Map");
  const [stage, setStage] = useState<"home" | "loading" | "results">("home");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const locationRequest = useRef(0);

  useFocusEffect(
    useCallback(() => {
      return () => {
        locationRequest.current += 1;
        setLocating(false);
      };
    }, []),
  );
  useEffect(() => {
    if (stage !== "loading") return;
    // Brief preview transition while the app still uses synchronous mock data.
    const timer = setTimeout(() => setStage("results"), 1400);
    return () => clearTimeout(timer);
  }, [stage]);

  async function useMyLocation() {
    const request = ++locationRequest.current;
    setLocating(true);
    setError("");
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (request !== locationRequest.current) return;
      if (!permission.granted) {
        setError(
          "Location access is off. Allow access in your browser or phone settings, or enter a destination.",
        );
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (request !== locationRequest.current) return;
      setCoordinates(position.coords);
      setQuery("My location");
    } catch {
      if (request === locationRequest.current)
        setError(
          "We couldn’t find your location. Please enter a destination instead.",
        );
    } finally {
      if (request === locationRequest.current) setLocating(false);
    }
  }
  function changeQuery(value: string) {
    locationRequest.current += 1;
    setLocating(false);
    setQuery(value);
    setCoordinates(null);
    setError("");
  }
  function search() {
    if (locating) return;
    if (!query.trim()) {
      setError("Enter a destination or use your location to search.");
      return;
    }
    setError("");
    Keyboard.dismiss();
    setStage("loading");
  }
  const filtered = nearbySpots(spots, { query, durations, coordinates });
  if (stage === "loading")
    return (
      <Screen fit>
        <View style={styles.loading}>
          <Text
            style={[
              ui.subtitle,
              { color: colors.primary, textAlign: "center" },
            ]}
          >
            Next stop:{"\n"}
            <Text style={ui.heading}>Parkki</Text>
          </Text>
          <ParkingIllustration />
          <ActivityIndicator
            size="large"
            color={colors.primary}
            accessibilityLabel="Finding parking spots"
          />
          <Text style={ui.title}>Almost parked!</Text>
          <Text style={[ui.subtitle, { textAlign: "center" }]}>
            We’re getting Helsinki’s parking map ready for you.
          </Text>
          <Button
            title="Cancel search"
            secondary
            onPress={() => setStage("home")}
          />
        </View>
      </Screen>
    );
  if (stage === "results")
    return (
      <ParkingResults
        spots={filtered}
        query={query}
        durations={durations}
        mode={mode}
        onModeChange={setMode}
        onQueryChange={changeQuery}
        onDurationsChange={setDurations}
        onUseLocation={useMyLocation}
        locating={locating}
        error={error}
      />
    );

  return (
    <Screen fit contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.topRow}>
          <Text style={styles.title}>Find free parking spots in Helsinki</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Saved Spots"
            onPress={() => router.push("/saved")}
            style={styles.savedButton}
          >
            <SymbolView
              name={{ ios: "star", android: "star", web: "star" }}
              tintColor="#F59A00"
              size={22}
            />
          </Pressable>
        </View>
        <Text style={styles.description}>
          Enter a location and choose how long{"\n"}you need to park.
        </Text>
        <Image
          source={require("../../../assets/images/parking-illustration.png")}
          contentFit="contain"
          style={styles.illustration}
          accessibilityLabel="Blue car beside a parking sign"
        />
      </View>
      <View style={styles.locationCard}>
        <Text style={ui.label}>Location</Text>
        <SearchBar
          value={query}
          onChangeText={changeQuery}
        />
        <Text style={styles.orText}>OR</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            locating ? "Finding your location" : "Use my location"
          }
          accessibilityState={{ disabled: locating }}
          disabled={locating}
          onPress={useMyLocation}
          style={styles.locationButton}
        >
          {locating ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <SymbolView
              name={{
                ios: "mappin.and.ellipse",
                android: "location_on",
                web: "location_on",
              }}
              tintColor={colors.primary}
              size={22}
            />
          )}
          <Text
            style={{ color: colors.primary, fontSize: 16, fontWeight: "700" }}
          >
            {locating ? "Finding your location…" : "Use my location"}
          </Text>
        </Pressable>


        {Boolean(error) && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.muted, fontSize: 13 }}
          >
            {error}
          </Text>
        )}
      </View>
      <View style={styles.durationCard}>
        <DurationFilter compact value={durations} onChange={setDurations} />
      </View>
      <View style={styles.resultOptions}>
        <Text style={ui.label}>Show Results as</Text>
        <ResultToggle mode={mode} onChange={setMode} />
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={search}
        style={({ pressed }) => [styles.searchButton, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.searchButtonText}>Search for free parking spots</Text>
      </Pressable>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 12, gap: 10 },
  resultOptions: { gap: 8 },
  topRow: { zIndex: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  savedButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 22,
    width: 44,
    height: 44,
    boxShadow: "0px 5px 14px #18212D12",
  },
  hero: { flexGrow: 1, flexBasis: 0, minHeight: 140, gap: 6, position: "relative" },
  title: {
    flex: 1,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "800",
    color: colors.text,
  },
  description: { zIndex: 1, fontSize: 14, lineHeight: 19, color: colors.muted },
  illustration: {
    position: "absolute",
    bottom: -30,
    right: 10,
    width: "90%",
    aspectRatio: 800 / 532,
    pointerEvents: "none",
  },
  searchButton: {
    minHeight: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  searchButtonText: { color: "white", fontSize: 18, fontWeight: "800", textAlign: "center" },
  orText: { fontSize: 11, lineHeight: 14, color: colors.muted, textAlign: "center", fontWeight: "600" },
  locationCard: {
    zIndex: 1,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 10,
    gap: 8,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 60,
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 10,
  },
  durationCard: { backgroundColor: "white", padding: 10, borderRadius: 16 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});
