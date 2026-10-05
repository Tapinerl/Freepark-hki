import { Text, View } from "react-native";
import { router } from "expo-router";
import Screen from "@/components/Screen";
import { Button, Card, ui } from "@/components/ui";
import { useParkingSpots } from "@/hooks/useParkingSpots";

export default function ProfileScreen() {
  const { spots } = useParkingSpots();
  const saved = spots.filter((spot) => spot.isFavorite);
  return (
    <Screen fit>
      <Text style={[ui.title, { fontSize: 24, lineHeight: 28 }]}>Account & settings</Text>
      <Card compact>
        <Text style={ui.label}>Account</Text>
        <Text style={ui.heading}>Welcome to FreePark</Text>
        <Text style={[ui.subtitle, { fontSize: 14, lineHeight: 20 }]}>
          Your Helsinki parking companion. You’re exploring in demo mode.
        </Text>
        <View style={ui.row}>
          <View style={{ flex: 1 }}>
            <Button compact title="Log in" onPress={() => router.push("/login")} />
          </View>
          <View style={{ flex: 1 }}>
            <Button compact title="Create account" secondary onPress={() => router.push("/signup")} />
          </View>
        </View>
      </Card>
      <Card compact>
        <Text style={ui.heading}>Saved parking spots ({saved.length})</Text>
        <Text style={[ui.subtitle, { fontSize: 14, lineHeight: 20 }]}>
          {saved.length ? "Your favorite spots, ready for your next trip." : "Tap the star on any spot to save it here."}
        </Text>
        <Button compact title="View saved spots" secondary onPress={() => router.push("/saved")} />
      </Card>
      <Card compact>
        <Text style={ui.heading}>My submitted spots</Text>
        <Text style={[ui.subtitle, { fontSize: 14, lineHeight: 20 }]}>
          No submissions yet. Share a spot from the Add tab for moderator review.
        </Text>
      </Card>
      <Card compact>
        <Text style={ui.heading}>Settings</Text>
        <Text style={[ui.subtitle, { fontSize: 14, lineHeight: 20 }]}>Theme: Light / Units: Meters / Language: English</Text>
        <Text style={{ fontSize: 12, lineHeight: 18 }}>
          Preferences will become editable in a future version.
        </Text>
      </Card>
      <Text style={[ui.subtitle, { fontSize: 12, lineHeight: 18 }]}>
        Favorites are stored in memory and reset when the app restarts.
      </Text>
    </Screen>
  );
}
