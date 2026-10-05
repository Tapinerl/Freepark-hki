import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import * as ImagePicker from "expo-image-picker";
import Screen from "@/components/Screen";
import ParkingContributionForm from "@/components/ParkingContributionForm";
import { Button } from "@/components/ui";
import { colors } from "@/constants/colors";

const steps = [
  {
    title: "Upload a photo",
    description: "Go to the parking spot and take a clear photo of the space, signs, and surroundings.",
    icon: { ios: "camera", android: "photo_camera", web: "photo_camera" },
  },
  {
    title: "Describe the spot and insert location",
    description: "Add the address, nearby landmarks, and any access notes so others can find it easily.",
    icon: { ios: "mappin.and.ellipse", android: "location_on", web: "location_on" },
  },
  {
    title: "Upload it for review",
    description: "Submit your contribution and our team will review it before it appears on the map.",
    icon: { ios: "square.and.arrow.up", android: "upload", web: "upload" },
  },
] as const;

export default function AddScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 900;
  const shortScreen = height < 750;
  const [showSources, setShowSources] = useState(false);
  const [photo, setPhoto] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (Platform.OS !== "android") return;
    let active = true;
    // Recover the selected photo if Android recreated the app during the picker.
    ImagePicker.getPendingResultAsync().then((result) => {
      if (active && result && "canceled" in result && !result.canceled && result.assets[0]) {
        setPhoto(result.assets[0]);
      }
    }).catch(() => {
      if (active) setFeedback("Could not recover your photo. Please select it again.");
    });
    return () => { active = false; };
  }, []);

  async function choosePhoto(source: "library" | "camera") {
    if (busy) return;
    setFeedback("");
    // Web pickers must launch directly from the user's press. The browser grants
    // access to the selected file, and does not reliably report cancellation.
    if (Platform.OS !== "web") setBusy(true);
    try {
      if (Platform.OS !== "web") {
        const permission = source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setFeedback(source === "camera"
            ? "Camera access is off. Allow it in your phone settings, or choose a photo from your library."
            : "Photo access is off. Allow it in your phone settings, or take a photo with your camera.");
          setShowSources(false);
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.85, allowsMultipleSelection: false };
      const selection = source === "camera"
        ? ImagePicker.launchCameraAsync(options)
        : ImagePicker.launchImageLibraryAsync(options);
      setShowSources(false);
      const result = await selection;
      if (!result.canceled && result.assets[0]) setPhoto(result.assets[0]);
    } catch {
      setShowSources(false);
      setFeedback("Could not open your photos or camera. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {photo ? (
        <ParkingContributionForm photo={photo} onChangePhoto={() => setShowSources(true)} />
      ) : (
        <Screen fit contentStyle={[styles.content, compact && styles.compactContent, shortScreen && styles.shortContent]}>
          <View style={styles.header}>
            <Text style={[styles.title, compact && styles.compactTitle, shortScreen && { fontSize: 22, lineHeight: 26 }]}>Found a new parking spot?</Text>
            <Text style={[styles.subtitle, shortScreen && { fontSize: 14, lineHeight: 20 }]}>Add it to the app in three steps.</Text>
          </View>
          <View style={[styles.steps, compact && { gap: 12 }, shortScreen && { gap: 10 }]}>
            {steps.map((step) => (
              <View key={step.title} style={[styles.stepCard, compact && styles.compactCard, shortScreen && { padding: 10, gap: 10 }]}>
                <View style={[styles.iconBox, compact && styles.compactIcon, shortScreen && { width: 40, height: 40 }]}>
                  <SymbolView name={step.icon} tintColor="#53575A" size={32} />
                </View>
                <View style={styles.stepCopy}>
                  <Text style={[styles.stepTitle, compact && { fontSize: 16, lineHeight: 20 }, shortScreen && { fontSize: 15, lineHeight: 18 }]}>{step.title}</Text>
                  <Text style={[styles.stepDescription, compact && { lineHeight: 18 }, shortScreen && styles.shortDescription]}>{step.description}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={[styles.nextCard, compact && { padding: 14 }, shortScreen && { padding: 10 }]}>
            <Text style={styles.nextTitle}>What happens next?</Text>
            <Text style={[styles.stepDescription, shortScreen && styles.shortDescription]}>A new free parking spot is added after your contribution is reviewed.</Text>
          </View>
          <View style={styles.action}>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => setShowSources(true)} style={({ pressed }) => [styles.startButton, pressed && { opacity: 0.75 }]}>
              {busy ? <ActivityIndicator color="white" /> : <Text style={styles.startText}>Start by uploading a photo</Text>}
            </Pressable>
            <Text style={styles.helper}>You can edit details before submitting.</Text>
          </View>
          {Boolean(feedback) && <Text accessibilityLiveRegion="polite" style={styles.feedback}>{feedback}</Text>}
        </Screen>
      )}
      <Modal transparent animationType="fade" visible={showSources} onRequestClose={() => { if (!busy) setShowSources(false); }}>
        <View style={styles.overlay}>
          <SafeAreaView edges={["bottom"]} style={styles.sourceSheet}>
            <Text style={styles.sourceTitle}>Add a parking photo</Text>
            <Text style={styles.stepDescription}>Choose an existing photo or take one now.</Text>
            {busy ? <ActivityIndicator color={colors.primary} accessibilityLabel="Opening photos or camera" /> : (
              <>
                <Button title="Choose from photo library" onPress={() => { void choosePhoto("library"); }} />
                <Button title="Take a photo" secondary onPress={() => { void choosePhoto("camera"); }} />
                <Button title="Cancel" secondary onPress={() => setShowSources(false)} />
              </>
            )}
          </SafeAreaView>
        </View>
      </Modal>
      {photo && Boolean(feedback) && <Modal transparent visible animationType="fade" onRequestClose={() => setFeedback("")}>
        <View style={styles.overlay}>
          <SafeAreaView edges={["bottom"]} style={styles.sourceSheet}>
            <Text style={styles.stepDescription}>{feedback}</Text>
            <Button title="OK" onPress={() => setFeedback("")} />
          </SafeAreaView>
        </View>
      </Modal>}
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 24, paddingTop: 32, paddingBottom: 20, gap: 20 },
  compactContent: { padding: 20, paddingTop: 20, gap: 14 },
  shortContent: { paddingTop: 16, paddingBottom: 12, gap: 10 },
  shortDescription: { fontSize: 12, lineHeight: 16 },
  header: { gap: 8 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: "800", color: colors.text },
  compactTitle: { fontSize: 24, lineHeight: 28 },
  subtitle: { fontSize: 16, lineHeight: 24, color: colors.muted },
  steps: { gap: 16 },
  stepCard: { flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: "#D5E5EF", borderWidth: 1, borderColor: "#AFD8FF", borderRadius: 16, padding: 16 },
  compactCard: { padding: 12, gap: 12 },
  iconBox: { width: 56, height: 56, borderRadius: 16, backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  compactIcon: { width: 48, height: 48, borderRadius: 14 },
  stepCopy: { flex: 1, gap: 6 },
  stepTitle: { fontSize: 17, lineHeight: 22, fontWeight: "800", color: colors.primary },
  stepDescription: { fontSize: 13, lineHeight: 20, color: "#404C59" },
  nextCard: { padding: 16, gap: 8, backgroundColor: "#E5F3FE", borderWidth: 1, borderColor: "#AFD8FF", borderRadius: 16 },
  nextTitle: { fontSize: 15, lineHeight: 20, fontWeight: "800", color: colors.primary },
  action: { gap: 12 },
  startButton: { minHeight: 56, padding: 16, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", boxShadow: "0px 8px 16px #0055B829" },
  startText: { fontSize: 16, fontWeight: "800", color: "white", textAlign: "center" },
  helper: { fontSize: 12, lineHeight: 18, color: colors.muted, textAlign: "center" },
  feedback: { fontSize: 13, lineHeight: 19, color: colors.muted },
  overlay: { flex: 1, backgroundColor: "#00000055", justifyContent: "flex-end" },
  sourceSheet: { backgroundColor: colors.background, padding: 24, gap: 14, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sourceTitle: { fontSize: 22, fontWeight: "800", color: colors.text },
});
