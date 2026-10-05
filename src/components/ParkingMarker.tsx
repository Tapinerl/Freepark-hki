import { Pressable, Text } from "react-native";
import { colors } from "@/constants/colors";
export default function ParkingMarker({
  onPress,
  label,
}: {
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 48,
        height: 48,
        backgroundColor: colors.primary,
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
