import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ParkingProvider } from "@/hooks/useParkingSpots";
import { colors } from "@/constants/colors";

export default function RootLayout() {
  return (
    <ParkingProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          contentStyle: { backgroundColor: colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="parking/[id]"
          options={{ title: "Parking details" }}
        />
        <Stack.Screen name="login" options={{ title: "Log in" }} />
        <Stack.Screen name="signup" options={{ title: "Create account" }} />
        <Stack.Screen name="saved" options={{ title: "Saved Spots" }} />
      </Stack>
    </ParkingProvider>
  );
}
