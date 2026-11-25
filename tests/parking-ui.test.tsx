import { useState } from "react";
import type { ReactNode } from "react";
import { Text, Pressable } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { ParkingProvider, useParkingSpots } from "@/hooks/useParkingSpots";
import ParkingResults from "@/components/ParkingResults";
import ParkingCard from "@/components/ParkingCard";
import { normalizeParkingPage } from "@/api/parkingAdapter";
import { parkingFeatureCollection } from "@/lib/parkingGeometry";
import { POINT, LINE, POLYGON, publishedPage, publishedRecord } from "./fixtures/publishedParking";

jest.mock("@rnmapbox/maps", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  const stub = (name: string) => function MockMapComponent(props: { children?: ReactNode; id?: string; [key: string]: unknown }) {
    return React.createElement(View, { ...props, testID: props.id ?? name, style: undefined }, props.children);
  };
  const MockCamera = React.forwardRef((_, ref) => {
    React.useImperativeHandle(ref, () => ({ setCamera: jest.fn() }));
    return null;
  });
  return { __esModule: true, default: { setAccessToken: jest.fn() }, Camera: MockCamera,
    MapView: stub("map"), MarkerView: stub("marker"), ShapeSource: stub("shape"),
    FillLayer: stub("fill"), CircleLayer: stub("circle"), LineLayer: stub("line"), BackgroundLayer: stub("background") };
});

const center = { latitude: 60.19, longitude: 25.03 };
const fetchMock = jest.fn();
beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3001";
  global.fetch = fetchMock; fetchMock.mockReset();
  jest.clearAllMocks();
});
function Harness() {
  const parking = useParkingSpots();
  const [mode, setMode] = useState<"Map" | "List">("Map");
  const [durations, setDurations] = useState([30, 60, 120]);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Run test search" onPress={() => void parking.search(center)}><Text>Search</Text></Pressable>
    <ParkingResults spots={parking.spots} status={parking.status} parkingError={parking.error} pageError={parking.pageError}
      pagination={parking.pagination} loadedCount={parking.spots.length} loadingMore={parking.loadingMore} onRetry={parking.retry} onLoadMore={parking.loadMore} onCancelSearch={parking.cancel}
      query="Selected Helsinki destination" destinationSelected onSelectDestination={() => {}} onSearch={() => void parking.search(center)}
      durations={durations} onDurationsChange={setDurations} mode={mode} onModeChange={setMode} onQueryChange={() => {}}
      onUseLocation={() => {}} locating={false} error="" initialLocation={center} searchUsesUserLocation={false} />
  </>;
}
function resolved(body: unknown) { fetchMock.mockResolvedValue({ ok: true, json: async () => body }); }
async function search() { await fireEvent.press(screen.getByRole("button", { name: "Run test search" })); }

test("loading, empty coverage and retry errors are distinct in both views while the map stays usable", async () => {
  let resolve!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  await render(<ParkingProvider><Harness /></ParkingProvider>);
  await search();
  expect(screen.getByText("Searching for verified parking locations…")).toBeTruthy();
  expect(screen.queryByText("No verified free parking found in this area yet.")).toBeNull();
  expect(screen.getByTestId("map")).toBeTruthy();
  await act(async () => { resolve({ ok: true, json: async () => publishedPage() }); });
  expect(screen.getByText("No verified free parking found in this area yet.")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "List" }));
  expect(screen.getByText("FreePark is still expanding verified coverage.")).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  fetchMock.mockRejectedValueOnce(new Error("offline"));
  await search();
  expect(screen.getByRole("button", { name: "Retry parking search" })).toBeTruthy();
  expect(screen.queryByText("No verified free parking found in this area yet.")).toBeNull();
  resolved(publishedPage());
  await fireEvent.press(screen.getByRole("button", { name: "Retry parking search" }));
  expect(screen.getByText("No verified free parking found in this area yet.")).toBeTruthy();
});
test("Map and List share results without refetching, select by stable ID, and retain selection across toggles", async () => {
  resolved(publishedPage([publishedRecord(1, POINT), publishedRecord(2, LINE), publishedRecord(3, POLYGON)]));
  await render(<ParkingProvider><Harness /></ParkingProvider>);
  await search();
  const features = screen.getByTestId("published-parking").props.shape.features;
  expect(features.map((f: { geometry: { type: string } }) => f.geometry.type)).toEqual(["Point", "LineString", "Polygon"]);
  await fireEvent(screen.getByTestId("published-parking"), "press", { features: [features[2]] });
  expect(screen.getByTestId("published-parking").props.shape.features[2].properties.selected).toBe(true);
  expect(screen.getByText("Parking disc required")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button", { name: "List" }));
  expect(screen.getAllByRole("button", { name: "Show on map Surface parking area" })).toHaveLength(3);
  await fireEvent.press(screen.getAllByRole("button", { name: "Show on map Surface parking area" })[1]);
  expect(screen.getByRole("button", { name: "Map" }).props.accessibilityState.selected).toBe(true);
  expect(screen.getByTestId("published-parking").props.shape.features[1].properties.selected).toBe(true);
  await fireEvent.press(screen.getByRole("button", { name: "List" }));
  await fireEvent.press(screen.getByRole("button", { name: "Map" }));
  expect(screen.getByTestId("published-parking").props.shape.features[1].properties.selected).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  await fireEvent.press(screen.getByRole("button", { name: "View Surface parking area" }));
  expect(router.push).toHaveBeenCalledWith({ pathname: "/parking/[id]", params: { id: publishedRecord(2).id } });
});
test("cards show actual restrictions and attribution, with unknown maximum stay left unconfirmed", async () => {
  const record = publishedRecord();
  const spot = normalizeParkingPage(publishedPage([record])).data[0];
  spot.restrictions.maxStayMinutes = null;
  await render(<ParkingProvider><ParkingCard spot={spot} /></ParkingProvider>);
  expect(screen.getByText("Maximum stay not confirmed")).toBeTruthy();
  expect(screen.getByText("Parking disc required")).toBeTruthy();
  expect(screen.getByText("maxheight: 2.1")).toBeTruthy();
  expect(screen.getByText(/Test fixture attribution/)).toBeTruthy();
  expect(screen.getByText("Last verified: 2026-11-23")).toBeTruthy();
  expect(screen.queryByText(/available spaces|24 h free|Verified example|No limit/i)).toBeNull();
});
test("source geometry is unchanged and a display anchor is a source vertex, not a generated parking position", () => {
  const spots = normalizeParkingPage(publishedPage([publishedRecord(1, LINE), publishedRecord(2, POLYGON)])).data;
  const features = parkingFeatureCollection(spots, spots[1].id);
  expect(features.features[0].geometry).toEqual(LINE);
  expect(features.features[1].geometry).toEqual(POLYGON);
  expect(spots[1].displayPosition).toEqual({ latitude: 60.19, longitude: 25.03 });
});
