import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/constants/colors";
export default function ParkingIllustration() {
  return (
    <View
      style={styles.scene}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={styles.circle} />
      <View style={styles.post} />
      <View style={styles.sign}>
        <Text style={styles.letter}>P</Text>
      </View>
      <View style={styles.car}>
        <View style={styles.roof} />
        <View style={styles.windowLeft} />
        <View style={styles.windowRight} />
        <View style={styles.body} />
        <View style={[styles.wheel, { left: 12 }]}>
          <View style={styles.hub} />
        </View>
        <View style={[styles.wheel, { right: 12 }]}>
          <View style={styles.hub} />
        </View>
      </View>
      <View style={styles.road} />
    </View>
  );
}
const styles = StyleSheet.create({
  scene: { height: 130, width: "100%", minWidth: 250, position: "relative" },
  circle: {
    position: "absolute",
    right: 34,
    bottom: -10,
    width: 185,
    height: 165,
    borderRadius: 100,
    backgroundColor: "#E5F3FE",
  },
  car: {
    position: "absolute",
    width: 118,
    height: 70,
    right: 44,
    bottom: 16,
    zIndex: 1,
  },
  roof: {
    position: "absolute",
    width: 82,
    height: 0,
    borderBottomWidth: 32,
    borderBottomColor: colors.primary,
    borderLeftWidth: 18,
    borderLeftColor: "transparent",
    borderRightWidth: 18,
    borderRightColor: "transparent",
    top: 5,
    left: 18,
  },
  windowLeft: {
    position: "absolute",
    top: 11,
    left: 29,
    width: 25,
    height: 22,
    backgroundColor: "white",
    transform: [{ skewX: "-28deg" }],
  },
  windowRight: {
    position: "absolute",
    top: 11,
    left: 61,
    width: 21,
    height: 22,
    backgroundColor: "white",
    transform: [{ skewX: "28deg" }],
  },
  body: {
    position: "absolute",
    bottom: 14,
    width: 118,
    height: 30,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 14,
  },
  wheel: {
    position: "absolute",
    bottom: 0,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#30353D",
    alignItems: "center",
    justifyContent: "center",
  },
  hub: { width: 12, height: 12, borderRadius: 6, backgroundColor: "white" },
  post: {
    position: "absolute",
    width: 4,
    height: 62,
    backgroundColor: "#B6D2F5",
    right: 12,
    bottom: 15,
  },
  sign: {
    position: "absolute",
    right: -10,
    bottom: 70,
    backgroundColor: colors.primary,
    borderRadius: 26,
    borderBottomLeftRadius: 7,
    width: 50,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  letter: { color: "white", fontWeight: "800", fontSize: 30 },
  road: {
    height: 7,
    borderRadius: 4,
    backgroundColor: "#D5D8DE",
    position: "absolute",
    bottom: 9,
    left: 40,
    right: 0,
  },
});
