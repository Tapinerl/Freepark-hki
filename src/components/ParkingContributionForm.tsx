import { useState } from "react";
import { Text, View } from "react-native";
import Screen from "@/components/Screen";
import { Image } from "expo-image";
import { ImagePickerAsset } from "expo-image-picker";
import { Button, Card, Field, ui } from "@/components/ui";
import { ParkingType } from "@/types/parking";
import { colors } from "@/constants/colors";

export default function ParkingContributionForm({ photo, onChangePhoto }: { photo: ImagePickerAsset; onChangePhoto: () => void }) {
  const [address, setAddress] = useState("");
  const [parkingType, setParkingType] = useState<ParkingType>("Street parking");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [feedback, setFeedback] = useState("");
  function submit() {
    if (!address.trim() || !description.trim()) {
      setFeedback("Please add an address and a description.");
      return;
    }
    if (
      duration &&
      (!/^\d+$/.test(duration) ||
        Number(duration) < 1 ||
        !Number.isSafeInteger(Number(duration)))
    ) {
      setFeedback(
        "Enter a positive whole number of minutes, or leave the duration empty.",
      );
      return;
    }
    setFeedback(
      "Demo submission complete. Nothing was uploaded or saved. In the full app, your spot will be reviewed before it appears on the map.",
    );
  }
  return (
    <Screen fit>
      <Text style={[ui.title, { fontSize: 24, lineHeight: 28 }]}>Describe your parking spot</Text>
      <Image source={{ uri: photo.uri }} style={{ width: "100%", height: 180, borderRadius: 16 }} contentFit="cover" accessibilityLabel="Selected parking spot photo" />
      <Button compact title="Change photo" secondary onPress={onChangePhoto} />
      <Card compact>
        <Field
          compact
          label="Address / location"
          value={address}
          onChangeText={setAddress}
          placeholder="e.g. Siltasaarenkatu 3, Helsinki"
        />
        <View style={[ui.row, { alignItems: "flex-start" }]}>
          <View style={{ flex: 1 }}>
            <Field compact label="Max stay (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" placeholder="No limit" />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={ui.label}>Parking type</Text>
            <Button compact title={parkingType} secondary onPress={() => setParkingType(parkingType === "Street parking" ? "Parking lot" : "Street parking")} />
          </View>
        </View>
        <Field
          compact
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Parking signs, nearby landmarks, and access notes"
        />
      </Card>
      <Button compact title="Preview demo submission" onPress={submit} />
      {Boolean(feedback) && (
        <Text accessibilityLiveRegion="polite" style={ui.subtitle}>
          {feedback}
        </Text>
      )}
      <Text style={{ fontSize: 12, color: colors.muted }}>
        This demo keeps your photo and details on this device. Nothing is uploaded.
      </Text>
    </Screen>
  );
}
