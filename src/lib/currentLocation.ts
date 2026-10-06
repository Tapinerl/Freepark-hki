import * as Location from "expo-location";

export async function getCurrentLocation(): Promise<Location.LocationObject> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) {
    throw new Error("Allow location access in your phone or browser settings, then tap Use my location again.");
  }
  if (!(await Location.hasServicesEnabledAsync())) {
    throw new Error("Turn on your device's location services, then tap Use my location again.");
  }
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    // Request a fresh fix on every press, rather than a cached last-known point.
    return await Promise.race([
      Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: true,
      }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Finding your location took too long. Check your GPS signal and try again.")), 20000);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
