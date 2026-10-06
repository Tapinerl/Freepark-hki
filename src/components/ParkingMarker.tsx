import { Pressable, Text } from "react-native";
export default function ParkingMarker({
  onPress,
  label,
  selected = false,
  dimmed = false,
}: {
  onPress: () => void;
  label: string;
  selected?: boolean;
  dimmed?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={(event) => {
        event.stopPropagation();
        onPress();
      }}
      style={{
        width: 48,
        height: 48,
        backgroundColor: selected ? "#1E6EF4" : "#0055B8",
        opacity: dimmed ? 0.55 : 1,
        transform: [{ scale: selected ? 1.1 : 1 }],
        borderRadius: 24,
        borderBottomLeftRadius: 7,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 3,
        borderColor: "white",
      }}
    >
      <Text style={{ color: "white", fontSize: 25, fontWeight: "800" }}>P</Text>
    </Pressable>
  );
}
