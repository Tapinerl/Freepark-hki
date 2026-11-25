import { ApiError, validateApiUrl } from "@/api/client";
import { fetchPublishedParking, parkingQueryParams } from "@/api/parking";
import { normalizeParkingPage, parseParkingGeometry } from "@/api/parkingAdapter";
import { POINT, LINE, POLYGON, publishedPage, publishedRecord } from "./fixtures/publishedParking";

const center = { latitude: 60.19, longitude: 25.03 };
const fetchMock = jest.fn();
beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = "http://10.0.2.2:3001";
  global.fetch = fetchMock;
  fetchMock.mockReset();
});
function respond(body: unknown, status = 200) { return { ok: status < 400, status, json: async () => body }; }

test("API configuration accepts origins, trims trailing slashes and requires HTTPS in production", () => {
  expect(validateApiUrl(" http://10.0.2.2:3001/ ", true)).toBe("http://10.0.2.2:3001");
  expect(validateApiUrl("https://api.example.com", false)).toBe("https://api.example.com");
  for (const url of [undefined, "", "bad", "file:///a", "https://user:secret@example.com", "https://example.com/api/admin", "https://example.com?token=secret", "https://example.com/#secret"]) {
    expect(() => validateApiUrl(url, true)).toThrow(ApiError);
  }
  expect(() => validateApiUrl("http://10.0.2.2:3001", false)).toThrow(/HTTPS/);
});
test("builds valid geographic queries with recognized filters and pagination", () => {
  expect(Object.fromEntries(parkingQueryParams(center))).toEqual({ lat: "60.19", lon: "25.03", radius: "500", limit: "50", offset: "0" });
  expect(parkingQueryParams({ latitude: -90, longitude: 180, radius: 50, parkingType: "street", limit: 100, offset: 10000 }).get("parkingType")).toBe("street");
  expect(parkingQueryParams({ ...center, radius: 5000 }).get("radius")).toBe("5000");
});
test.each([NaN, Infinity, -91, 91, "60", null, undefined])("rejects invalid latitude %p before any request", async (latitude) => {
  await expect(fetchPublishedParking({ ...center, latitude } as typeof center)).rejects.toThrow();
  expect(fetchMock).not.toHaveBeenCalled();
});
test.each([{ longitude: 181 }, { longitude: -181 }, { longitude: NaN }, { radius: 49 }, { radius: 5001 }, { radius: Infinity }, { limit: 101 }, { limit: 0 }, { offset: -1 }, { offset: 10001 }, { offset: 0.5 }, { parkingType: "street_side" }])("rejects invalid query %p", (query) => {
  expect(() => parkingQueryParams({ ...center, ...query } as Parameters<typeof parkingQueryParams>[0])).toThrow();
});
test("uses only the public published endpoint and accepts an empty response", async () => {
  fetchMock.mockResolvedValue(respond(publishedPage()));
  expect(await fetchPublishedParking(center)).toEqual(publishedPage());
  const [url, options] = fetchMock.mock.calls[0];
  expect(new URL(url).pathname).toBe("/api/parking-spots");
  expect(url).not.toMatch(/admin|preview|candidate/);
  expect(options.signal).toBeInstanceOf(AbortSignal);
});
test("missing configuration fails clearly before networking", async () => {
  delete process.env.EXPO_PUBLIC_API_URL;
  await expect(fetchPublishedParking(center)).rejects.toThrow(/EXPO_PUBLIC_API_URL/);
  expect(fetchMock).not.toHaveBeenCalled();
});
test("network and HTTP errors do not return fixture data or expose backend messages", async () => {
  fetchMock.mockRejectedValueOnce(new Error("private connection details"));
  await expect(fetchPublishedParking(center)).rejects.toThrow(/Check your connection/);
  fetchMock.mockResolvedValueOnce(respond({ message: "secret" }, 503));
  await expect(fetchPublishedParking(center)).rejects.toMatchObject({ status: 503, message: expect.stringContaining("HTTP 503") });
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
test("invalid JSON and malformed successful responses are rejected", async () => {
  fetchMock.mockResolvedValueOnce({ ok: true, json: async () => { throw new Error("json"); } });
  await expect(fetchPublishedParking(center)).rejects.toThrow(/invalid JSON/);
  fetchMock.mockResolvedValueOnce(respond({ data: [] }));
  await expect(fetchPublishedParking(center)).rejects.toThrow(/invalid/);
});
test("cancels an in-flight request and prevents a late response from returning", async () => {
  let resolve!: (value: unknown) => void;
  fetchMock.mockImplementation(() => new Promise((done) => { resolve = done; }));
  const controller = new AbortController();
  const promise = fetchPublishedParking(center, controller.signal);
  controller.abort();
  expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  resolve(respond(publishedPage()));
  await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  await expect(fetchPublishedParking(center, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
test("normalization preserves IDs, geometry, restrictions, verification, attribution and authoritative distance", () => {
  const record = publishedRecord();
  const spot = normalizeParkingPage(publishedPage([record])).data[0];
  expect(spot).toMatchObject(record);
  expect(spot.isFavorite).toBe(false);
  expect(spot.displayPosition).toEqual({ latitude: 60.191, longitude: 25.031 });
});
test.each([POINT, LINE, POLYGON, { type: "MultiPoint", coordinates: [POINT.coordinates] }, { type: "MultiLineString", coordinates: [LINE.coordinates] }, { type: "MultiPolygon", coordinates: [POLYGON.coordinates] }])("supports source geometry $type without inventing spaces", (geometry) => {
  expect(parseParkingGeometry(geometry)).toEqual(geometry);
});
test.each([{ type: "Point", coordinates: [181, 60] }, { type: "Point", coordinates: [25, NaN] }, { type: "LineString", coordinates: [[25, 60]] }, { type: "Polygon", coordinates: [[[25, 60], [26, 60], [26, 61], [25, 61]]] }, { type: "MultiPolygon", coordinates: [] }, { type: "GeometryCollection", geometries: [] }])("rejects invalid geometry %p", (geometry) => {
  expect(() => parseParkingGeometry(geometry)).toThrow();
});
test.each([{ feeStatus: "unknown" }, { feeStatus: "paid" }, { accessStatus: "private" }, { kind: "source_candidate" }, { publicationStatus: "draft" }, { verificationStatus: "unknown" }, { eligibilityStatus: "conditional" }, { distanceMeters: -1 }, { distanceMeters: "5" }, { lastVerifiedAt: "not-a-date" }, { id: "1" }, { restrictions: { maxStayMinutes: 20 } }, { geometry: null }, { sources: [{ name: "bad" }] }])("rejects incompatible record fields %p instead of claiming free parking", (patch) => {
  expect(() => normalizeParkingPage(publishedPage([{ ...publishedRecord(), ...patch }]))).toThrow();
});
test("pagination is explicit and inconsistent pages or preview scope are rejected", async () => {
  fetchMock.mockResolvedValueOnce(respond(publishedPage([publishedRecord(2)], 1, 1, 2)));
  const page = await fetchPublishedParking({ ...center, limit: 1, offset: 1 });
  expect(page.pagination).toEqual({ limit: 1, offset: 1, total: 2 });
  expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("offset")).toBe("1");
  fetchMock.mockResolvedValueOnce(respond(publishedPage([], 1, 0, 0)));
  await expect(fetchPublishedParking(center)).rejects.toThrow(/unexpected page/);
  for (const response of [publishedPage([], 50, 0, 100), publishedPage([publishedRecord(), publishedRecord()]), { ...publishedPage(), scope: "candidate_preview" }]) {
    expect(() => normalizeParkingPage(response)).toThrow();
  }
});
