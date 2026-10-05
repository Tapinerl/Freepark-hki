import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";

export default function Screen({
  children,
  contentStyle,
  fit = false,
}: {
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  fit?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          alwaysBounceVertical={!fit}
          showsVerticalScrollIndicator={!fit}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, fit && styles.fit, contentStyle]}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  fit: { flexGrow: 1, padding: 16, paddingBottom: 12, gap: 10 },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    paddingBottom: 40,
  },
});
