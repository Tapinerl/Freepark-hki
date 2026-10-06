# FreePark Helsinki

An Expo SDK 57 / React Native prototype for finding free parking in Helsinki.

## Features

- Native Mapbox map, Helsinki destination suggestions, and Map/List results with some  fictional parking spots, parking details, and session-only favorites.
- Photo-first contribution form with a back option

Parking data is illustrative. Authentication, uploads, storage, and review are not connected; contributions are demo submissions.

## Setup

Use Node.js 22.13+ and npm:

```sh
npm ci
```

Copy `.env.example` to `.env.local`, then set `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` to a Mapbox public token (`pk...`). `EXPO_PUBLIC_MAPBOX_STYLE_URL` is optional. Restart the dev server after changing these values.

```sh
npm run web                 # Browser preview: controls and list, no native map
npx expo start --dev-client  # Connect an installed development build
```

Mapbox requires an iOS/Android development build; Expo Go cannot display the map. See [MAPBOX.md](MAPBOX.md) for Mapbox configuration and EAS build instructions. Allow location, camera, or photo access when using those features.


## Development

```sh
npm run lint
npm run typecheck
```

Routes: `src/app/` ? UI: `src/components/` ? Demo spots: `src/data/mockParkingSpots.ts`.
