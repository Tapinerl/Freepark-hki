import { Pressable, Text, TextInput, View, StyleProp, ViewStyle } from "react-native";
import { colors } from "@/constants/colors";
import { ui } from "./ui";
export default function SearchBar({
  value,
  onChangeText,
  compact = false,
  onFocus,
  onSubmitEditing,
  style,
}: {
  value: string;
  onChangeText: (text: string) => void;
  compact?: boolean;
  onFocus?: () => void;
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        ui.row,
        ui.input,
        { backgroundColor: "#F2F2F7", borderColor: colors.primary, borderWidth: 1.5, paddingVertical: 8, minHeight: 50 },
        compact && { height: 48, minHeight: 48, paddingHorizontal: 10, paddingVertical: 0, gap: 6 },
        style,
      ]}
    >
      <Text
        style={{ color: colors.primary, fontSize: 24 }}
        accessibilityElementsHidden
      >
        ⌕
      </Text>
      <TextInput
        accessibilityLabel="Search a destination"
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onSubmitEditing={onSubmitEditing}
        placeholder="Search a destination"
        placeholderTextColor={colors.muted}
        returnKeyType="search"
        style={{ flex: 1, fontSize: 16, color: colors.text, minHeight: 28 }}
      />
      {value.length > 0 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          onPress={() => onChangeText("")}
          style={{
            minWidth: 44,
            minHeight: 44,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 24 }}>×</Text>
        </Pressable>
      )}
    </View>
  );
}
