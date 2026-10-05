import { Text, View } from "react-native";
import { router } from "expo-router";
import { colors } from "@/constants/colors";
import { ParkingSpot } from "@/types/parking";
import ParkingMarker from "./ParkingMarker";

export default function ParkingMap({ spots, fit = false }: { spots: ParkingSpot[]; fit?: boolean }) {
  return (
    <View
      style={{
        height: fit ? undefined : 300,
        flex: fit ? 1 : undefined,
        minHeight: fit ? 200 : undefined,
        backgroundColor: colors.map,
        borderRadius: 24,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          position: "absolute",
          right: -30,
          top: -40,
          width: 115,
          height: 420,
          backgroundColor: "#D3E8E9",
          transform: [{ rotate: "22deg" }],
        }}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            top: 40 + i * 55,
            left: -40,
            width: 650,
            height: 9,
            backgroundColor: colors.road,
            transform: [{ rotate: "-25deg" }],
          }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: 45 + i * 105,
            top: -50,
            width: 8,
            height: 450,
            backgroundColor: colors.road,
            transform: [{ rotate: "20deg" }],
          }}
        />
      ))}
      <Text
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          backgroundColor: "white",
          padding: 8,
          borderRadius: 10,
          color: colors.muted,
          fontSize: 12,
        }}
      >
        Illustrative map · Helsinki
      </Text>
      {spots.map((spot, i) => (
        <View
          key={spot.id}
          style={{
            position: "absolute",
            left: `${12 + (i % 3) * 29}%`,
            top: fit ? `${25 + Math.floor(i / 3) * (45 / Math.max(1, Math.ceil(spots.length / 3) - 1))}%` : 70 + Math.floor(i / 3) * 100,
          }}
        >
          <ParkingMarker
            label={`View ${spot.name}`}
            onPress={() =>
              router.push({
                pathname: "/parking/[id]",
                params: { id: spot.id },
              })
            }
          />
        </View>
      ))}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          left: 18,
          backgroundColor: "white",
          borderRadius: 10,
          padding: 8,
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          Mock spots • No live location
        </Text>
      </View>
    </View>
  );
}
