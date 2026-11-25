# FreePark Helsinki development notes

See [README.md](README.md) for quick setup and testing. These notes cover the backend integration, architecture, and troubleshooting.

Expo SDK 57 / React Native mobile app for discovering verified, published free parking in Helsinki. Phase 5.2 connects the existing Mapbox map, Map/List results and parking cards to the separate Fastify backend. The backend currently has zero published locations; an empty map is expected.

## Architecture

`Expo Router screens → shared ParkingProvider → typed API client → Fastify public Parking Search API → PostgreSQL/PostGIS`

The mobile app makes read-only calls to **GET /api/parking-spots**. It never connects to PostgreSQL, candidate previews or administrative services. Publication eligibility remains the backend's responsibility. The existing navigation, native Mapbox style/camera, duration controls, session favorites and local contribution form remain in place. Accounts, uploads and submissions are not connected.

- Routes: `src/app/`; shared UI: `src/components/`.
- API configuration/transport: `src/api/client.ts`; queries: `src/api/parking.ts`.
- Runtime response adapter: `src/api/parkingAdapter.ts`; app model: `src/types/parking.ts`.
- Results, cancellation, pagination and favorites: `src/hooks/useParkingSpots.tsx`.
- Source geometry/display anchors: `src/lib/parkingGeometry.ts`.
- Test-only synthetic published responses: `tests/fixtures/publishedParking.ts`. There is no application fixture mode or error fallback to test data.

## Environment and device URLs

Use Node.js 22.13+ and npm (this project has `package-lock.json`, not a Bun lockfile).

```powershell
Set-Location C:\Users\ellio\freepark-helsinki
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
code .env.local
```

Set these values in `.env.local`:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_public_pk_token
EXPO_PUBLIC_MAPBOX_STYLE_URL=
```

`EXPO_PUBLIC_API_URL` is the API **origin**, without `/api`, credentials, query parameters or fragments. Missing or invalid configuration produces a setup error with a retry action. Production JavaScript builds reject HTTP URLs. All `EXPO_PUBLIC_` values are embedded in the app and are public: never put database credentials, Mapbox secret tokens or admin secrets here. `.env` and local environment variants are ignored by Git; `.env.example` contains no secrets. Reload the app after changes; restart Metro if needed.

| Target | API URL |
| --- | --- |
| Android Studio emulator | `http://10.0.2.2:3001` (emulator alias for the host's loopback) |
| Physical Android over trusted USB | `http://127.0.0.1:3001` after `adb reverse tcp:3001 tcp:3001` |
| Physical device over Wi-Fi / iOS | HTTPS host reachable from the device; for local work, use a public-path-only HTTPS proxy to the backend. Device `localhost` does not refer to the computer. |
| Production | Your deployed **HTTPS** public API origin |

Keep the backend on its existing `127.0.0.1` listener. Do not bind administrative services to the LAN or expose them through a proxy. A LAN address only works if a separately secured, public-only proxy is reachable on that address; no backend binding changes are needed for the Android emulator or USB approach. No deployment is included here.

The existing Expo-generated Android **debug** manifest permits cleartext HTTP for development (also used by Metro). The main manifest has no broad cleartext opt-in; Android's release policy blocks it. No handwritten native manifest changes or production transport exceptions are needed. Native folders are generated and ignored by Git. iOS development should use an HTTPS API unless local-only ATS configuration is deliberately added in a later task.

## Start backend and mobile together (PowerShell)

Terminal 1 — existing backend, with its existing `.env` and migrated database:

```powershell
Set-Location C:\Users\ellio\freepark-backend\Freepark-backend
# Start Docker Desktop first if the database is stopped.
docker compose up -d --wait
$env:HOST = '127.0.0.1'
$env:PORT = '3001'
npm run dev
```

Backend dependencies must already be installed (`npm ci` on first setup). Do not reimport data, change publication state or publish test spots to populate the app. If the backend already runs on port 3001, reuse that process.

Terminal 2 — verify the public API on Windows:

```powershell
Invoke-RestMethod 'http://127.0.0.1:3001/api/parking-spots?lat=60.19&lon=25.03&radius=500' | ConvertTo-Json -Depth 8
```

Expected while verified coverage is empty:

```json
{"scope":"published","data":[],"pagination":{"limit":50,"offset":0,"total":0}}
```

Terminal 3 — start an Android emulator from Android Studio, then run the mobile app:

```powershell
Set-Location C:\Users\ellio\freepark-helsinki
adb devices
npx expo start --dev-client
```

Press **a** in Metro to open an installed development build. If needed, create/install one first:

```powershell
npx expo run:android
```

Alternatively use `npx eas-cli@latest build --platform android --profile development` and install the resulting development APK. Mapbox requires a development build; Expo Go cannot display it. See [MAPBOX.md](MAPBOX.md) for Mapbox and EAS setup. Allow foreground location when using your location.

To verify Android networking independently, open this URL in the emulator's browser:

```text
http://10.0.2.2:3001/api/parking-spots?lat=60.19&lon=25.03&radius=500
```

Then select a Helsinki destination or use your location in FreePark and search. Map and List should both report no verified free parking found yet, with no parking markers. This checks the native fetch/cleartext policy as well as networking. If it fails: confirm port 3001 is listening, check the Windows request above, check the emulator URL, verify the bundled `EXPO_PUBLIC_API_URL`, reload the app, and inspect Fastify HTTP status/logs and `adb logcat` for cleartext errors. Keep the existing debug transport policy; do not enable cleartext for release or expose admin routes to fix a connectivity problem.

## Search, state and pagination

Destination suggestions use actual Mapbox geocoding restricted to Helsinki; the old mock-coordinate suggestions were removed. The home screen waits for a selected destination or a fresh device location. Search requests use that latitude/longitude, a **500 m** default radius and a page size of **50**. Clearing a search in results requests the existing Helsinki initial-map center. The API client accepts radii **50–5000 m**, limits **1–100**, offsets **0–10000**, and the optional canonical `parkingType` filter. There is no new radius selector in this milestone.

Map camera movement never triggers network requests. New searches abort and disregard older requests, including pages, so late responses cannot replace newer results. Requests time out after 15 seconds. Duration filters apply locally to loaded results using the existing buckets; unknown maximum stays remain visible with an unconfirmed label and are never treated as unlimited. Distances and ordering use the backend's distance to source geometry, not a fabricated marker distance.

Map and List share the same filtered array and stable IDs. Switching views does not refetch. Selecting a list card focuses its map feature; tapping the map callout opens details. Selection survives toggling and is only rendered while its location is in the result set.

Counts distinguish matching locations, loaded locations and the backend total. **Load more locations** explicitly requests the next page; there is no unbounded automatic pagination. Failed pages retain loaded results and offer retry. Changed/overlapping pages ask the user to search again. At the backend's offset ceiling, the UI explains that the search must be narrowed rather than claiming all results were loaded. Local filters operate only on loaded pages.

- **Loading:** “Searching for verified parking locations…” while the map remains usable.
- **Empty success:** “No verified free parking found in this area yet.” FreePark is expanding verified coverage; this does not say no legal free parking exists.
- **Error:** parking data could not be loaded, with a retry action. Discovery results clear on a new search; errors never insert mock spots or saved snapshots into the live map/list.

## Public response mapping

The adapter was checked against the accessible backend's `src/services/parking-search/contract.ts`, `query.ts`, `service.ts` and `src/db/schema.ts` after Phase 5.1. No native API contract mismatch required a backend change.

| Public backend field | App behavior |
| --- | --- |
| `scope: published`, `kind: parking_spot` | Required; candidate/preview records are rejected |
| UUID `id` | Stable key for map features, cards, selection and saved locations |
| `parkingType` | Accepts `unknown`, `street`, `surface`, `multi_storey`, `underground`, `park_and_ride`, `other`; mapped to a neutral type label |
| `feeStatus: free`, `accessStatus: public`, `eligibilityStatus: eligible` | Required public-contract values; missing/unknown/paid/restricted values are rejected, never converted to free |
| `publicationStatus: published`, `verificationStatus: verified`, `lastVerifiedAt` | Validated and retained; date shown with a reminder to check signs on arrival |
| GeoJSON `geometry` | Point, MultiPoint, LineString, MultiLineString, Polygon, MultiPolygon preserved with coordinates; finite geographic bounds, nonempty parts and closed rings validated |
| `distanceMeters` | Required finite nonnegative backend distance for search ordering/display |
| `restrictions.maxStayMinutes` | Positive integer or null; null means unconfirmed |
| `restrictions.parkingDiscRequired` | Boolean or null; unknown requirement is omitted |
| Other `restrictions` | Opening hours, schedules, conditional/legacy rules, duration expressions, vehicle restrictions and original expressions preserved and displayed without inventing conditions or computing “free now” |
| `sources[]` | Name, attribution, license name, source/license URLs retained; attribution appears on cards and in details |
| `pagination` | Validated limit/offset/total, expected page length, duplicate-ID and requested-page checks |

The public response has **no address or location-name field**. Cards use parking-type labels and backend distance; no mock street addresses are carried forward. API shape changes are isolated to the adapter and reported as data errors instead of silently mislabeling locations.

Points retain the existing P markers; lines and areas use Mapbox ShapeSource/LineLayer/FillLayer, with selected styling and feature taps. MultiPoints render as circles. A **source vertex** is used solely as a camera/callout anchor, kept separate in `displayPosition`; it is not an entrance, centroid, numbered space or new curbside coordinate. Area/line geometry is never collapsed into invented individual spaces. The app does not display capacity, empty-space counts or live occupancy.

## Saved locations and limitations

Favorites continue to live in memory for the current session, keyed by backend UUID. Saved snapshots survive searching another area and API failures, and refresh only when the same ID is returned again. They may show older conditions; their distance refers to the search where they were loaded. They do not populate discovery results. The previous app had no persisted favorite storage, so its placeholder favorites are not migrated or remapped; an old detail ID shows an unavailable message.

Native shape drawing, the map style and camera require a working Mapbox public token and native development build. Browser previews keep controls and List, with a native-map message. **Browser API requests require CORS support on a public-only proxy/backend**; the inspected Fastify app currently has no CORS headers. Native apps are unaffected. This is documented rather than changing the backend or widening access in Phase 5.2.

Local Android validation on 2026-11-24 confirmed a real search through `10.0.2.2:3001`, empty coverage in both Map and List, and Saved/Profile navigation without placeholder favorites. The software-rendered emulator displayed a dark basemap with the existing style setup; the original style overrides were retained, so light-style appearance still needs a hardware/device check. With zero published records, nonempty feature rendering and selection are covered by mocked component tests rather than a live published location.

Schedules are shown as backend expressions in the Helsinki timezone, not interpreted as real-time eligibility. A verification date is historical evidence and does not guarantee today's signs. Detail routes use the current/session-saved record; standalone deep links require a fresh search. The Add tab remains the existing local demo. Future phases can connect authentication and user submissions separately; Supabase Auth, synchronization, admin review, occupancy, AI and deployment are outside this phase.

## Tests and checks

```powershell
Set-Location C:\Users\ellio\freepark-helsinki
npm test
npm run lint
npm run typecheck
```

Jest with the SDK-compatible `jest-expo` preset and React Native Testing Library covers URL configuration, valid/invalid geographic queries and radius bounds, network/HTTP/JSON failures, cancellation and stale searches/pages, empty responses, full normalization, malformed records, pagination, all six source geometries, Map/List selection, card restrictions/attribution, favorites and legacy IDs, and absence of unverified fallback/admin API calls. Network responses and native Mapbox rendering are mocked; no running backend/database is needed. Synthetic fixtures live only under `tests/`, without a runtime fixture switch. `test-renderer` is pinned to 1.2.0 to match React 19.2 (newer renderer versions require React 19.3).

Expo references: [SDK 57](https://docs.expo.dev/versions/v57.0.0/), [environment variables](https://docs.expo.dev/guides/environment-variables/), [unit testing](https://docs.expo.dev/develop/unit-testing/), [development builds](https://docs.expo.dev/develop/development-builds/introduction/).
