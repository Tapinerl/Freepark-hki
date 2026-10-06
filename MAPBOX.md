# FreePark Mapbox setup

Copy `.env.example` to `.env.local` and supply a Mapbox public access token (`pk...`). Never put a secret token in an `EXPO_PUBLIC_` variable. `.env.local` is ignored by Git.

```dotenv
EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=your_public_token
EXPO_PUBLIC_MAPBOX_STYLE_URL=mapbox://styles/your_account/your_style_id
```

The style URL is optional. Mapbox Light v11 is the fallback, including when a custom style fails to load. Missing access tokens show a setup message within the map area. Restart Metro after changing environment variables. Configure the same public variables in the EAS development environment for cloud builds.

## Development build

Mapbox needs a native development build; Expo Go cannot render it. On Windows, use EAS for iOS:

```sh
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform ios --profile development
npx expo start --dev-client
```

During configuration choose your own unique iOS bundle identifier and link the Expo project. Register the iPhone when prompted (a paid Apple Developer membership is required for this distribution). Install the build from EAS, then connect to Metro. The `development-simulator` profile is available for a simulator on a Mac. Android uses `--platform android`. Native dependencies are configured through the Mapbox Expo plugin; no handwritten native folders are needed.

## Mapbox Studio

Create an editable style based on Mapbox Light / a classic vector template. Keep streets, road names, buildings, parks and water. Disable POI icon and label layers (shops, restaurants, businesses, attractions), transit labels/icons, and unnecessary landmarks. Retain car-accessible major roads and local streets with clear casing and readable street labels at zoom 14–17.

Apply these colors to the corresponding style layers:

| Layer | Color |
| --- | --- |
| Background / land | `#F2F1ED` |
| Minor roads | `#FFFFFF` |
| Major roads | `#D9DDE3` |
| Road casing | `#C8CDD4` |
| Building footprints | `#DEDAD4` |
| Parks | `#D3DFCD` |
| National parks | `#CCDCC8` |
| Other land use | `#E8E3D9` |
| Water | `#C7DDE5` |
| Primary labels | `#5D6670` |
| Secondary labels | `#8C949D` |

Publish the style, copy its `mapbox://styles/...` URL to the environment variable, and restart Metro. Preserve the classic layer IDs `land`, `water`, `national-park`, `landuse`, and `building`: the app applies this muted palette to those existing layers, including in the Light v11 fallback. POI suppression belongs in the Studio style. Parking markers remain app overlays in `#0055B8`, with selection in `#1E6EF4`.

## Integration behavior

The results screen owns filters, selection and layout. The map is an absolute background underneath the controls. Selecting a marker anchors a `ParkingCard` callout directly below that pin in a native `MarkerView`, so it follows the geographic location while panning. The camera eases to the selected coordinates with padding for the top controls, measured callout height, and visible search panel. Selection dims the basemap and other pins; tapping elsewhere restores the light map and fades/slides the callout away. Tapping the card opens the detail route.

Destination suggestions use Mapbox geocoding restricted to Finland and Helsinki municipality context, with known demo neighborhoods as local suggestions. Searching centers the destination pin and adjusts zoom to nearby eligible spots, expanding beyond 5 km when needed. Using the device location requests a fresh foreground fix and shows only a blue dot; it does not continuously track movement. Clearing the search removes location markers and frames the spots matching the current duration filters. Map movement is constrained to the Helsinki extent. Parking locations and conditions are fictional examples.

Browser previews retain the controls and list mode with a native-build message in the map area because `@rnmapbox/maps` supports iOS and Android. Native rendering and SDK compatibility must be verified on a development build with a working token.

References: [Mapbox React Native installation](https://rnmapbox.github.io/docs/install), [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/), [Expo environment variables](https://docs.expo.dev/guides/environment-variables/).
