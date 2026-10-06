import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { getCurrentLocation } from "@/lib/currentLocation";
import Screen from "@/components/Screen";
import LocationSearch from "@/components/LocationSearch";
import { Destination, withinHelsinkiBounds } from "@/lib/locationSearch";
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
  const [durations, setDurations] = useState<number[]>([30, 60]);
  const [mode, setMode] = useState<"Map" | "List">("Map");
  const [stage, setStage] = useState<"home" | "loading" | "results">("home");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [searchLocation, setSearchLocation] = useState<Coordinates | null>(null);
  const [searchUsesUserLocation, setSearchUsesUserLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
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
    if (locating) return;
    Keyboard.dismiss();
    const request = ++locationRequest.current;
    setLocating(true);
    setError("");
    try {
      const position = await getCurrentLocation();
      if (request !== locationRequest.current) return;
      if (!withinHelsinkiBounds(position.coords)) {
        setError("Free parking search is currently available only in Helsinki.");
        return;
      }
      setCoordinates(position.coords);
      if (stage === "results") {
        setSearchLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setSearchUsesUserLocation(true);
      }
      setUserLocation(position.coords);
      setQuery("My location");
    } catch (error) {
      if (request === locationRequest.current)
        setError(
          error instanceof Error ? error.message : "We couldn’t find your location. Please try again.",
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
    if (!value.trim()) {
      setSearchLocation(null);
      setSearchUsesUserLocation(false);
      setUserLocation(null);
    }
    setError("");
  }
  function selectDestination(destination: Destination) {
    locationRequest.current += 1;
    setLocating(false);
    setQuery(destination.label);
    setCoordinates(destination);
    setError("");
    Keyboard.dismiss();
  }
  function search() {
    if (locating) return;
    if (!query.trim()) {
      setError("Enter a destination or use your location to search.");
      return;
    }
    if (!coordinates || !withinHelsinkiBounds(coordinates)) {
      setError("Choose a Helsinki location from the suggestions before searching.");
      return;
    }
    setSearchLocation({ ...coordinates });
    setSearchUsesUserLocation(coordinates === userLocation);
    setError("");
    Keyboard.dismiss();
    if (stage !== "results") setStage("loading");
  }
  const filtered = useMemo(() => nearbySpots(spots, { query: "", durations, coordinates: searchLocation }), [spots, durations, searchLocation]);
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
        initialLocation={searchLocation}
        searchUsesUserLocation={searchUsesUserLocation}
        destinationSelected={!!coordinates}
        onSelectDestination={selectDestination}
        onSearch={search}
        userLocation={userLocation}
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
        <LocationSearch value={query} onChangeText={changeQuery} selected={!!coordinates} onSelect={selectDestination} onSubmitEditing={search} />
        <Text style={{ color: colors.muted, fontSize: 12 }}>Helsinki locations only for now</Text>
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
        style={({ pressed }) => [styles.searchButton, pressed && { opacity: 0.75 }]}
      >
        <Text style={styles.searchButtonText}>Search for free parking spots</Text>
      </Pressable>
    </Screen>
  );
}
const styles = StyleSheet.create({
  content: { padding: 16, paddingHorizontal: 20, paddingBottom: 38, gap: 10 },
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
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    boxShadow: "0px 8px 16px #0055B829",
  },
  searchButtonText: { color: "white", fontSize: 16, fontWeight: "800", textAlign: "center" },
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
