import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { colors } from "@/constants/colors";
export default function ResultToggle({
  mode,
  onChange,
  compact = false,
}: {
  mode: "Map" | "List";
  onChange: (mode: "Map" | "List") => void;
  compact?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 3,
      }}
    >
      {(["Map", "List"] as const).map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          accessibilityLabel={item}
          accessibilityState={{ selected: mode === item }}
          onPress={() => onChange(item)}
          style={{
            flex: 1,
            flexDirection: "row",
            gap: 8,
            minHeight: compact ? 38 : 44,
            borderRadius: 11,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: mode === item ? colors.primary : "white",
          }}
        >
          {!compact && item === "Map" && (
            <SymbolView
              name={{ ios: "map.fill", android: "map", web: "map" }}
              tintColor={mode === item ? "white" : colors.muted}
              size={22}
            />
          )}
          <Text
            style={{
              color: mode === item ? "white" : colors.muted,
              fontWeight: "700",
            }}
          >
            {item}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
