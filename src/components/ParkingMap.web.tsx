import { StyleSheet, Text, View } from "react-native";
import type { ParkingMapProps } from "./ParkingMap";

// Mapbox's native SDK is unavailable in browser previews.
export default function ParkingMap(_props: ParkingMapProps) {
  return <View style={styles.map}><Text style={styles.notice}>Open the iOS or Android development build to view the map.</Text></View>;
}
const styles = StyleSheet.create({
  map: { flex: 1, backgroundColor: "#F3F4F6" },
  notice: { marginTop: 100, marginHorizontal: 24, color: "#5D6670", textAlign: "center" },
});
