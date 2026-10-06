import { memo, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Mapbox, { BackgroundLayer, Camera, FillLayer, MapView, MarkerView } from "@rnmapbox/maps";
import { ParkingSpot } from "@/types/parking";
import { Coordinates, destinationZoom } from "@/lib/parkingSearch";
import { HELSINKI_BOUNDS } from "@/lib/locationSearch";
import ParkingMarker from "./ParkingMarker";
import ParkingCard from "./ParkingCard";

export type ParkingMapProps = {
  parkingSpots: ParkingSpot[];
  selectedSpotId: string | null;
  onSelectSpot: (id: string) => void;
  onDismissSpot: () => void;
  popupSpot?: ParkingSpot;
  popupProgress: Animated.Value;
  topInset: number;
  bottomInset: number;
  initialLocation?: Coordinates | null;
  searchUsesUserLocation?: boolean;
  userLocation?: Coordinates | null;
};
const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
const customStyle = process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL?.trim();
const fallbackStyle = "mapbox://styles/mapbox/light-v11";
const helsinki = { latitude: 60.1699, longitude: 24.9384 };
if (token) Mapbox.setAccessToken(token);

function ParkingMap({ parkingSpots, selectedSpotId, onSelectSpot, onDismissSpot, popupSpot, popupProgress, topInset, bottomInset, initialLocation, userLocation, searchUsesUserLocation }: ParkingMapProps) {
  const camera = useRef<Camera>(null);
  const { width } = useWindowDimensions();
  const [mapHeight, setMapHeight] = useState(0);
  const [popupHeight, setPopupHeight] = useState(180);
  const selectedSpot = parkingSpots.find((spot) => spot.id === selectedSpotId);
  const selectedLongitude = selectedSpot?.longitude;
  const selectedLatitude = selectedSpot?.latitude;
  const [styleFailed, setStyleFailed] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const target = initialLocation ?? helsinki;
  const [initialCamera] = useState(() => ({ centerCoordinate: [target.longitude, target.latitude], zoomLevel: 14.5 }));
  useEffect(() => {
    if (!mapReady || !mapHeight || selectedSpotId) return;
    const paddingTop = Math.min(topInset, mapHeight / 3);
    const paddingBottom = Math.min(bottomInset, Math.max(0, mapHeight - paddingTop - 100));
    if (!initialLocation) {
      const padding = { paddingTop: paddingTop + 40, paddingBottom: paddingBottom + 40, paddingLeft: 40, paddingRight: 40 };
      // Reset to the full set of spots allowed by the active duration filters.
      if (parkingSpots.length > 1) {
        camera.current?.setCamera({
          bounds: {
            ne: [Math.max(...parkingSpots.map((spot) => spot.longitude)) + 0.002, Math.max(...parkingSpots.map((spot) => spot.latitude)) + 0.001],
            sw: [Math.min(...parkingSpots.map((spot) => spot.longitude)) - 0.002, Math.min(...parkingSpots.map((spot) => spot.latitude)) - 0.001],
          },
          padding, heading: 0, pitch: 0, animationMode: "easeTo", animationDuration: 700,
        });
      } else {
        const center = parkingSpots[0] ?? helsinki;
        camera.current?.setCamera({ centerCoordinate: [center.longitude, center.latitude], zoomLevel: parkingSpots.length ? 14.5 : 12, padding, heading: 0, pitch: 0, animationMode: "easeTo", animationDuration: 700 });
      }
      return;
    }
    camera.current?.setCamera({ centerCoordinate: [initialLocation.longitude, initialLocation.latitude], zoomLevel: destinationZoom(initialLocation, parkingSpots, width, mapHeight - paddingTop - paddingBottom), padding: { paddingTop, paddingBottom, paddingLeft: 0, paddingRight: 0 }, animationMode: "easeTo", animationDuration: 700 });
  }, [initialLocation, parkingSpots, width, mapHeight, topInset, bottomInset, mapReady, selectedSpotId]);
  useEffect(() => {
    if (selectedLongitude === undefined || selectedLatitude === undefined || !mapHeight) return;
    // Reserve room beneath the pin for its callout and the visible search panel.
    const paddingTop = Math.min(topInset, mapHeight / 3);
    const paddingBottom = Math.min(bottomInset + popupHeight + 12, Math.max(0, mapHeight - paddingTop - 80));
    camera.current?.setCamera({
      centerCoordinate: [selectedLongitude, selectedLatitude],
      padding: { paddingTop, paddingBottom, paddingLeft: 20, paddingRight: 20 },
      animationMode: "easeTo", animationDuration: 500,
    });
  }, [selectedSpotId, selectedLongitude, selectedLatitude, topInset, bottomInset, popupHeight, mapHeight]);
  if (!token) return <View style={styles.background}><Text style={styles.notice}>Set EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN to enable the map.</Text></View>;
  return (
    <MapView onDidFinishLoadingMap={() => setMapReady(true)} style={styles.background} onLayout={(event) => setMapHeight(event.nativeEvent.layout.height)} styleURL={!styleFailed && customStyle ? customStyle : fallbackStyle} onPress={onDismissSpot} onMapLoadingError={() => setStyleFailed(true)} compassEnabled={false} scaleBarEnabled={false} logoPosition={{ top: 80, left: 8 }} attributionPosition={{ top: 80, right: 8 }}>
      <Camera ref={camera} defaultSettings={initialCamera} maxBounds={HELSINKI_BOUNDS} minZoomLevel={8} />
      <BackgroundLayer id="land" existing style={{ backgroundColor: "#F2F1ED" }} />
      <FillLayer id="water" existing style={{ fillColor: "#C7DDE5" }} />
      <FillLayer id="national-park" existing style={{ fillColor: "#CCDCC8" }} />
      <FillLayer id="landuse" existing style={{ fillColor: [
        "match", ["get", "class"],
        ["park", "grass", "wood", "scrub", "cemetery", "pitch"], "#D3DFCD",
        "#E8E3D9",
      ] }} />
      <FillLayer id="building" existing style={{ fillColor: "#DEDAD4" }} />
      {/* A map style layer shades the basemap beneath native marker views. */}
      <BackgroundLayer id="parking-focus-tint" style={{ backgroundColor: "#121B26", backgroundOpacity: selectedSpotId ? 0.22 : 0.04, backgroundOpacityTransition: { duration: 220, delay: 0 } }} />
      {parkingSpots.map((spot) => (
        <MarkerView key={spot.id} coordinate={[spot.longitude, spot.latitude]} allowOverlap isSelected={selectedSpotId === spot.id}>
          <ParkingMarker label={`Select ${spot.name}`} selected={selectedSpotId === spot.id} dimmed={Boolean(selectedSpotId) && selectedSpotId !== spot.id} onPress={() => onSelectSpot(spot.id)} />
        </MarkerView>
      ))}
      {initialLocation && !searchUsesUserLocation && <MarkerView coordinate={[initialLocation.longitude, initialLocation.latitude]} allowOverlap>
        <View pointerEvents="none" accessibilityLabel="Searched destination" style={{ alignItems: "center" }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#D63638", borderWidth: 3, borderColor: "white", alignItems: "center", justifyContent: "center" }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "white" }} /></View>
          <View style={{ width: 3, height: 12, backgroundColor: "#D63638" }} />
        </View>
      </MarkerView>}
      {userLocation && <MarkerView coordinate={[userLocation.longitude, userLocation.latitude]} allowOverlap>
        <View pointerEvents="none" accessibilityLabel="Your current location" style={styles.locationHalo}><View style={styles.locationDot} /></View>
      </MarkerView>}
      {popupSpot && <MarkerView key={`popup-${popupSpot.id}`} coordinate={[popupSpot.longitude, popupSpot.latitude]} anchor={{ x: 0.5, y: 0 }} allowOverlap isSelected={Boolean(selectedSpotId)}>
        <View onLayout={(event) => setPopupHeight(event.nativeEvent.layout.height)} style={{ width: Math.min(340, width - 40), paddingTop: 36 }} pointerEvents={selectedSpotId ? "auto" : "none"} accessibilityElementsHidden={!selectedSpotId} importantForAccessibility={selectedSpotId ? "auto" : "no-hide-descendants"} onTouchEnd={(event) => event.stopPropagation()}>
          <Animated.View style={{ opacity: popupProgress, transform: [{ translateY: popupProgress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
            <View style={styles.calloutArrow} />
            <ParkingCard spot={popupSpot} variant="results" />
          </Animated.View>
        </View>
      </MarkerView>}
    </MapView>
  );
}
export default memo(ParkingMap);
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#F3F4F6" },
  notice: { marginTop: 100, marginHorizontal: 24, color: "#5D6670", textAlign: "center" },
  calloutArrow: { alignSelf: "center", width: 16, height: 16, marginBottom: -8, backgroundColor: "white", transform: [{ rotate: "45deg" }] },
  locationHalo: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#1E6EF433", alignItems: "center", justifyContent: "center" },
  locationDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: "#1E6EF4", borderWidth: 2, borderColor: "white" },
});
