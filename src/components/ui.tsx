import { ReactNode } from "react";
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
} from "react-native";
import { colors } from "@/constants/colors";

export function Button({
  title,
  onPress,
  secondary = false,
  compact = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        ui.button,
        compact && { minHeight: 44, padding: 10 },
        secondary && ui.secondaryButton,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[ui.buttonText, secondary && { color: colors.primary }]}>
        {title}
      </Text>
    </Pressable>
  );
}
export function Card({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  return <View style={[ui.card, compact && { padding: 12, gap: 8 }]}>{children}</View>;
}
export function Field({ label, compact = false, ...props }: TextInputProps & { label: string; compact?: boolean }) {
  return (
    <View style={{ gap: compact ? 4 : 8 }}>
      <Text style={ui.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[
          ui.input,
          props.multiline && { minHeight: 110, textAlignVertical: "top" },
          compact && { minHeight: props.multiline ? 64 : 44, padding: 10 },
          props.style,
        ]}
      />
    </View>
  );
}
export const ui = StyleSheet.create({
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.muted },
  heading: { fontSize: 18, fontWeight: "700", color: colors.text },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    minHeight: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
  },
  secondaryButton: { backgroundColor: colors.primaryLight },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 14,
    minHeight: 52,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
});
