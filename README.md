# FreePark Helsinki

Expo SDK 57 / React Native app for finding verified free parking in Helsinki.

## Requirements

- Node.js 22.13+ and npm.
- A Mapbox public access token (`pk...`).
- The separate FreePark backend, configured with its database running.
- An Android emulator or physical device with a native development build. **Expo Go cannot render the Mapbox map.**

## Setup

From the project directory:

```powershell
npm ci
# First setup only; keep your existing .env.local if you have one.
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```dotenv
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_public_pk_token
EXPO_PUBLIC_MAPBOX_STYLE_URL=
```

The style URL is optional. The API URL must be the backend origin, without `/api`:

| Test device | API origin |
| --- | --- |
| Android emulator | `http://10.0.2.2:3001` |
| Android device over USB | `http://127.0.0.1:3001`, after `adb reverse tcp:3001 tcp:3001` |
| iPhone / device over Wi-Fi | A reachable HTTPS public API origin |

All `EXPO_PUBLIC_` values are public. Never put secret tokens or database credentials here. Restart Metro after changing them.

## Run and test

Start the backend on port **3001** using its own setup instructions. See [development notes](DEVELOPMENT.md#start-backend-and-mobile-together-powershell) for the existing local backend workflow.

With a development build installed, start Metro:

```powershell
npx expo start --dev-client
```

Press **a** to open it on Android, or connect your installed device build to Metro. For a first cloud build, follow [Mapbox and EAS setup](MAPBOX.md#development-build) (use `--platform android` for Android).

1. Select a Helsinki destination or allow location access, then search.
2. Check both Map and List. With no published backend locations, the expected message is **“No verified free parking found in this area yet.”** An empty map is expected; the app has no mock fallback.
3. Minimize the map search panel: nothing should appear below that empty-results message. Expand it to see the additional information and filters.
4. Check Saved and Profile navigation. Saved locations last only for the current session.

Automated checks (no running backend required):

```powershell
npm test
npm run lint
npm run typecheck
```

## Important limitations

- The app reads verified, published locations; it does not show live availability. Always check parking signs.
- Accounts, uploads, and submissions are not connected; the Add tab is a local demo.
- Use a native build to test the map. Browser API requests also need backend/proxy CORS support.
- Device `localhost` refers to the device. For connection issues, check the API origin and backend reachability; keep admin services private.

More details: [development notes](DEVELOPMENT.md) · [Mapbox setup](MAPBOX.md).
