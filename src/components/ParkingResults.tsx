import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import ParkingCard from "./ParkingCard";
import EmptyState from "./EmptyState";
import ResultToggle from "./ResultToggle";
import SearchBar from "./SearchBar";
import { DurationFilter } from "./FilterSheet";
import { colors } from "@/constants/colors";
import { ParkingSpot } from "@/types/parking";

export default function ParkingResults({
  spots,
  query,
  durations,
  mode,
  onModeChange,
  onQueryChange,
  onDurationsChange,
  onUseLocation,
  locating,
  error,
}: {
  spots: ParkingSpot[];
  query: string;
  durations: number[];
  mode: "Map" | "List";
  onModeChange: (mode: "Map" | "List") => void;
  onQueryChange: (query: string) => void;
  onDurationsChange: Dispatch<SetStateAction<number[]>>;
  onUseLocation: () => void;
  locating: boolean;
  error: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [filterHeight, setFilterHeight] = useState(140);
  const [translation] = useState(() => new Animated.Value(0));
  const dragStart = useRef(0);
  const dragging = useRef(false);
  const expandedTarget = useRef(true);

  const settlePanel = useCallback((nextExpanded: boolean) => {
    expandedTarget.current = nextExpanded;
    setExpanded(nextExpanded);
    translation.stopAnimation();
    Animated.timing(translation, {
      toValue: nextExpanded ? 0 : filterHeight,
      duration: 140,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
      isInteraction: false,
    }).start();
  }, [filterHeight, translation]);

  useEffect(() => {
    // Resizing and larger text can change the filters' natural height.
    if (!expandedTarget.current) translation.setValue(filterHeight);
  }, [filterHeight, translation]);

  const startDrag = useCallback(() => {
    dragging.current = true;
    Keyboard.dismiss();
    translation.stopAnimation((offset) => { dragStart.current = offset; });
  }, [translation]);
  const moveDrag = useCallback((_: unknown, gesture: { dy: number }) => {
    translation.setValue(Math.max(0, Math.min(filterHeight, dragStart.current + gesture.dy)));
  }, [filterHeight, translation]);
  const finishDrag = useCallback((_: unknown, gesture: { dy: number; vy: number }) => {
    const offset = Math.max(0, Math.min(filterHeight, dragStart.current + gesture.dy));
    const nextExpanded = Math.abs(gesture.vy) > 0.3
      ? gesture.vy < 0
      : offset < filterHeight / 2;
    settlePanel(nextExpanded);
  }, [filterHeight, settlePanel]);
  const cancelDrag = useCallback(() => settlePanel(expandedTarget.current), [settlePanel]);
  const togglePanel = useCallback(() => {
    if (dragging.current) return;
    Keyboard.dismiss();
    settlePanel(!expandedTarget.current);
  }, [settlePanel]);

  // PanResponder registers these callbacks; refs are read only when a gesture runs.
  // eslint-disable-next-line react-hooks/refs
  const handleGesture = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) => Math.abs(gesture.dy) > 4 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: startDrag,
    onPanResponderMove: moveDrag,
    onPanResponderRelease: finishDrag,
    onPanResponderTerminate: cancelDrag,
    onPanResponderTerminationRequest: () => false,
  }), [startDrag, moveDrag, finishDrag, cancelDrag]);

  const searchControls = (
    <>
            <View style={styles.searchRow}>
              <SearchBar compact style={styles.searchField} value={query} onChangeText={onQueryChange} onSubmitEditing={Keyboard.dismiss} onFocus={() => { if (mode === "Map") settlePanel(true); }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={locating ? "Finding your location" : "Use my location"}
                accessibilityState={{ disabled: locating, busy: locating }}
                disabled={locating}
                onPress={() => {
                  Keyboard.dismiss();
                  onUseLocation();
                }}
                style={({ pressed }) => [styles.locationButton, (pressed || locating) && { opacity: 0.7 }]}
              >
                {locating ? <ActivityIndicator color="white" /> : (
                  <SymbolView name={{ ios: "mappin.and.ellipse", android: "location_on", web: "location_on" }} tintColor="white" size={24} />
                )}
              </Pressable>
            </View>
            {Boolean(error) && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
    </>
  );

  return (
    <SafeAreaView style={[styles.screen, mode === "List" && styles.listScreen]} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={styles.viewport} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.topControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Saved parking spots"
            onPress={() => router.push("/saved")}
            style={styles.savedButton}
          >
            <SymbolView name={{ ios: "star", android: "star", web: "star" }} tintColor="#F59A00" size={24} />
            <Text style={styles.savedText}>Saved</Text>
          </Pressable>
          <View style={styles.toggle}>
            <ResultToggle compact mode={mode} onChange={onModeChange} />
          </View>
          <View style={styles.balanceSpace} />
        </View>

        {mode === "Map" ? (
          <View style={styles.map} accessibilityLabel="Map area. Map will be added later." />
        ) : (
          <View style={styles.listMode}>
            <View style={styles.listSearch}>
              {searchControls}
              <View style={styles.filters}>
                <DurationFilter value={durations} onChange={onDurationsChange} />
              </View>
            </View>
            <FlatList
              style={styles.list}
              data={spots}
              keyExtractor={(spot) => spot.id}
              renderItem={({ item }) => <ParkingCard spot={item} variant="results" />}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
              ListEmptyComponent={<EmptyState title="No spots found" description="Try another destination or change your parking duration above." />}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            />
          </View>
        )}

        {mode === "Map" && <Animated.View style={[styles.panel, { transform: [{ translateY: translation }] }]}>
          <View {...handleGesture.panHandlers}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Collapse search options" : "Expand search options"}
            accessibilityState={{ expanded }}
            onPressIn={() => { dragging.current = false; }}
            onPress={togglePanel}
            style={styles.handleButton}
          >
            <View style={styles.handle} />
          </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={styles.panelScroll} contentContainerStyle={styles.panelContent}>
            {searchControls}
            <View
              pointerEvents={expanded ? "auto" : "none"}
              accessibilityElementsHidden={!expanded}
              importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
            >
              <View style={styles.filters} onLayout={(event) => setFilterHeight(event.nativeEvent.layout.height)}>
                <DurationFilter value={durations} onChange={onDurationsChange} />
              </View>
            </View>
          </ScrollView>
        </Animated.View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#D9D9D9" },
  listScreen: { backgroundColor: colors.background },
  listMode: { flex: 1 },
  listSearch: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, maxWidth: 600, width: "100%", alignSelf: "center" },
  viewport: { flex: 1, overflow: "hidden" },
  topControls: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 12, paddingBottom: 10, gap: 12, zIndex: 1 },
  savedButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "white", borderRadius: 24, minHeight: 44, paddingHorizontal: 12, boxShadow: "0px 5px 14px #18212D18" },
  savedText: { fontSize: 14, color: colors.text },
  toggle: { width: 148 },
  balanceSpace: { flex: 1, maxWidth: 96 },
  map: { flex: 1 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, maxWidth: 600, width: "100%", alignSelf: "center" },
  panel: { position: "absolute", bottom: 0, width: "100%", maxWidth: 600, maxHeight: "70%", alignSelf: "center", backgroundColor: colors.background, borderTopLeftRadius: 26, borderTopRightRadius: 26, boxShadow: "0px -4px 16px #18212D12", overflow: "hidden" },
  handleButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  handle: { width: 52, height: 6, borderRadius: 3, backgroundColor: "#C5C5C5" },
  panelScroll: { flexShrink: 1 },
  panelContent: { paddingHorizontal: 24, paddingBottom: 20 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  searchField: { flex: 1, minWidth: 0 },
  locationButton: { width: 52, height: 48, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, boxShadow: "0px 3px 8px #18212D12" },
  filters: { paddingTop: 12 },
  error: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 8 },
});
