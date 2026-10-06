import { Modal, Pressable, Text, View } from "react-native";
import { Dispatch, SetStateAction } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { Button, ui } from "./ui";
import { DURATION_OPTIONS, toggleDuration } from "@/lib/durationFilters";

export function DurationFilter({
  value,
  onChange,
  compact = false,
}: {
  value: number[];
  onChange: Dispatch<SetStateAction<number[]>>;
  compact?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={ui.label}>Parking for</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {DURATION_OPTIONS.map((item) => (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            aria-pressed={value.includes(item.value)}
            accessibilityState={{ selected: value.includes(item.value) }}
            onPress={() =>
              onChange((current) => toggleDuration(current, item.value))
            }
            style={{
              width: "31%",
              flexGrow: 1,
              minHeight: compact ? 44 : 48,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colors.primary,
              backgroundColor: value.includes(item.value)
                ? colors.primary
                : colors.surface,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: value.includes(item.value) ? "white" : colors.text,
                fontSize: 14,
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export default function FilterSheet({
  visible,
  onClose,
  verifiedOnly,
  onVerifiedChange,
}: {
  visible: boolean;
  onClose: () => void;
  verifiedOnly: boolean;
  onVerifiedChange: (value: boolean) => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "#00000055",
          justifyContent: "flex-end",
        }}
      >
        <SafeAreaView
          edges={["bottom"]}
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            gap: 20,
          }}
        >
          <Text style={ui.heading}>Parking preferences</Text>
          <Text style={ui.subtitle}>
            Availability is illustrative. Check posted parking signs.
          </Text>
          <Button
            title={
              verifiedOnly
                ? "✓ Verified examples only"
                : "Show verified examples only"
            }
            secondary
            onPress={() => onVerifiedChange(!verifiedOnly)}
          />
          <Button title="Apply filters" onPress={onClose} />
          <Button
            title="Reset filters"
            secondary
            onPress={() => {
              onVerifiedChange(false);
              onClose();
            }}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}
