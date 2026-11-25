import { act, renderHook } from "@testing-library/react-native";
import { ParkingProvider, useParkingSpots } from "@/hooks/useParkingSpots";
import { filterParkingSpots } from "@/lib/parkingSearch";
import { normalizeParkingPage } from "@/api/parkingAdapter";
import { publishedPage, publishedRecord } from "./fixtures/publishedParking";

const fetchMock = jest.fn();
const center = { latitude: 60.19, longitude: 25.03 };
function response(body: unknown) { return { ok: true, json: async () => body }; }
beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3001";
  global.fetch = fetchMock; fetchMock.mockReset();
});

test("starts with real data mode and no seeded favorites, then distinguishes empty success from failure", async () => {
  const { result } = await renderHook(useParkingSpots, { wrapper: ParkingProvider });
  expect(result.current.spots).toEqual([]);
  expect(result.current.savedSpots).toEqual([]);
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(response(publishedPage()));
  await act(async () => { await result.current.search(center); });
  expect(result.current.status).toBe("success");
  expect(result.current.pagination?.total).toBe(0);
  fetchMock.mockRejectedValueOnce(new Error("offline"));
  await act(async () => { await result.current.search(center); });
  expect(result.current.status).toBe("error");
  expect(result.current.spots).toEqual([]);
  expect(result.current.error).toMatch(/couldn't be loaded/);
});
test("a new search aborts the old one and late responses cannot overwrite newer results", async () => {
  const resolvers: ((value: unknown) => void)[] = [];
  fetchMock.mockImplementation(() => new Promise((resolve) => resolvers.push(resolve)));
  const { result } = await renderHook(useParkingSpots, { wrapper: ParkingProvider });
  let first!: Promise<void>;
  let second!: Promise<void>;
  await act(async () => { first = result.current.search(center); });
  expect(result.current.status).toBe("loading");
  await act(async () => { second = result.current.search({ latitude: 60.2, longitude: 25.1 }); });
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  await act(async () => { resolvers[1](response(publishedPage([publishedRecord(2)]))); await second; });
  await act(async () => { resolvers[0](response(publishedPage([publishedRecord(1)]))); await first; });
  expect(result.current.spots.map((s) => s.id)).toEqual([publishedRecord(2).id]);
  expect(result.current.status).toBe("success");
});
test("cancellation clears live results and unmount aborts the active request", async () => {
  fetchMock.mockImplementation((_, options) => new Promise((_, reject) => {
    options.signal.addEventListener("abort", () => reject(Object.assign(new Error("cancelled"), { name: "AbortError" })));
  }));
  const { result, unmount } = await renderHook(useParkingSpots, { wrapper: ParkingProvider });
  await act(async () => { void result.current.search(center); });
  await act(async () => { result.current.cancel(); });
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  expect(result.current.status).toBe("idle");
  await act(async () => { void result.current.search(center); });
  await unmount();
  expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
});
test("explicit paging appends results once; duplicate calls do not launch duplicate requests", async () => {
  fetchMock.mockResolvedValueOnce(response(publishedPage([publishedRecord()], 1, 0, 2)));
  const { result } = await renderHook(useParkingSpots, { wrapper: ParkingProvider });
  await act(async () => { await result.current.search({ ...center, limit: 1 }); });
  let resolve!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  await act(async () => { result.current.loadMore(); result.current.loadMore(); });
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(result.current.loadingMore).toBe(true);
  await act(async () => { resolve(response(publishedPage([publishedRecord(2)], 1, 1, 2))); });
  expect(result.current.spots).toHaveLength(2);
  expect(result.current.loadingMore).toBe(false);
  await act(async () => { result.current.loadMore(); });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
test("page failures retain loaded results and have an explicit retry", async () => {
  fetchMock.mockResolvedValueOnce(response(publishedPage([publishedRecord()], 1, 0, 2)));
  const { result } = await renderHook(useParkingSpots, { wrapper: ParkingProvider });
  await act(async () => { await result.current.search({ ...center, limit: 1 }); });
  fetchMock.mockRejectedValueOnce(new Error("offline"));
  await act(async () => { result.current.loadMore(); });
  expect(result.current.spots).toHaveLength(1);
  expect(result.current.pageError).toMatch(/couldn't be loaded/);
  fetchMock.mockResolvedValueOnce(response(publishedPage([publishedRecord(2)], 1, 1, 2)));
  await act(async () => { result.current.loadMore(); });
  expect(result.current.spots).toHaveLength(2);
  expect(result.current.pageError).toBe("");
});
test("stale pages cannot append to a new destination", async () => {
  fetchMock.mockResolvedValueOnce(response(publishedPage([publishedRecord()], 1, 0, 2)));
  const { result } = await renderHook(useParkingSpots, { wrapper: ParkingProvider });
  await act(async () => { await result.current.search({ ...center, limit: 1 }); });
  let resolve!: (value: unknown) => void;
  fetchMock.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  await act(async () => { result.current.loadMore(); });
  fetchMock.mockResolvedValueOnce(response(publishedPage([publishedRecord(3)])));
  await act(async () => { await result.current.search({ latitude: 60.2, longitude: 25.1 }); });
  await act(async () => { resolve(response(publishedPage([publishedRecord(2)], 1, 1, 2))); });
  expect(result.current.spots.map((s) => s.id)).toEqual([publishedRecord(3).id]);
});
test("favorites survive searches and errors using exact backend IDs; legacy mock IDs never resolve", async () => {
  fetchMock.mockResolvedValueOnce(response(publishedPage([publishedRecord()])));
  const { result } = await renderHook(useParkingSpots, { wrapper: ParkingProvider });
  await act(async () => { await result.current.search(center); result.current.toggleFavorite("1"); });
  expect(result.current.getSpot("1")).toBeUndefined();
  expect(result.current.savedSpots).toHaveLength(0);
  await act(async () => { result.current.toggleFavorite(publishedRecord().id); });
  expect(result.current.spots[0].isFavorite).toBe(true);
  fetchMock.mockResolvedValueOnce(response(publishedPage()));
  await act(async () => { await result.current.search(center); });
  expect(result.current.spots).toHaveLength(0);
  expect(result.current.savedSpots[0].id).toBe(publishedRecord().id);
  expect(result.current.getSpot(publishedRecord().id)?.isFavorite).toBe(true);
  fetchMock.mockRejectedValueOnce(new Error("offline"));
  await act(async () => { await result.current.search(center); });
  expect(result.current.spots).toHaveLength(0);
  expect(result.current.savedSpots).toHaveLength(1);
  await act(async () => { result.current.toggleFavorite(publishedRecord().id); });
  expect(result.current.savedSpots).toHaveLength(0);
});
test("duration filtering retains unknowns without claiming unlimited and sorts by backend distance", () => {
  const spots = normalizeParkingPage(publishedPage([publishedRecord(1), publishedRecord(2)])).data;
  spots[0].restrictions.maxStayMinutes = null;
  spots[0].distanceMeters = 400;
  expect(filterParkingSpots(spots, [30]).map((s) => s.id)).toEqual([spots[0].id]);
  expect(filterParkingSpots(spots, [120]).map((s) => s.id)).toEqual([spots[1].id, spots[0].id]);
  expect(filterParkingSpots(spots, [])).toEqual([]);
});
