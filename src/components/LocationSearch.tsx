import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import SearchBar from "./SearchBar";
import { Destination, searchLocations } from "@/lib/locationSearch";
import { colors } from "@/constants/colors";

export default function LocationSearch({ value, onChangeText, onSelect, selected, compact = false, onSubmitEditing }: {
  value: string; onChangeText: (value: string) => void; onSelect: (destination: Destination) => void;
  selected: boolean; compact?: boolean; onSubmitEditing?: () => void;
}) {
  const [results, setResults] = useState<Destination[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (selected || value.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const matches = await searchLocations(value, controller.signal);
        if (controller.signal.aborted) return;
        setResults(matches);
        setStatus(matches.length ? "" : "No Helsinki locations found. Try an address or neighborhood.");
      } catch (error) {
        if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : "Please try again.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value, selected]);
  const show = !selected && value.trim().length >= 3;
  return <View style={{ gap: 4 }}>
    <SearchBar value={value} compact={compact} onSubmitEditing={onSubmitEditing} onChangeText={(text) => {
      setResults([]); setStatus(""); setLoading(false); onChangeText(text);
    }} />
    {show && <View style={{ backgroundColor: "white", borderRadius: 12, borderWidth: 1, borderColor: colors.primaryLight, overflow: "hidden" }}>
      {loading && <ActivityIndicator style={{ padding: 10 }} color={colors.primary} accessibilityLabel="Finding Helsinki locations" />}
      {results.map((destination) => <Pressable key={destination.id} accessibilityRole="button" accessibilityLabel={`Choose ${destination.label}`} onPress={() => onSelect(destination)} style={({ pressed }) => ({ padding: 12, minHeight: 48, backgroundColor: pressed ? colors.primaryLight : "white" })}>
        <Text style={{ color: colors.text, fontSize: 14 }}>{destination.label}</Text>
      </Pressable>)}
      {!!status && <Text accessibilityLiveRegion="polite" style={{ color: colors.muted, padding: 12, fontSize: 13 }}>{status}</Text>}
    </View>}
  </View>;
}
