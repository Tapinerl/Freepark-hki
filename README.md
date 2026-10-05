# FreePark Helsinki

A mobile app prototype for finding free parking in Helsinki, built with Expo SDK 57, React Native, and TypeScript.

## Try it locally

Install [Node.js 22 LTS](https://nodejs.org/) (22.13 or newer) and [Git](https://git-scm.com/), then run:

```sh
git clone https://github.com/Tapinerl/Freepark-hki.git
cd Freepark-hki
npm ci
npm run web
```

Open the local URL printed in the terminal if your browser does not open automatically. Use your browser's mobile device view to preview the phone layout. Keep the terminal running; press `Ctrl+C` to stop the app.

No account, API keys, `.env` file, or backend setup is needed.

## Open on your phone

1. Install [Expo Go](https://expo.dev/go) compatible with SDK 57.
2. Connect your phone and computer to the same Wi-Fi.
3. Run `npm start` from the project folder.
4. Scan the terminal's QR code using your iPhone camera or Expo Go on Android.

Allow location, photo, or camera access when trying those features. Camera and photo behavior depends on the device; the browser preview may open a file picker instead.

If Expo Go does not support this SDK, use the browser preview or follow Expo's [development build guide](https://docs.expo.dev/develop/development-builds/introduction/).

## What's included

- Destination search, parking duration filters, and Map/List views.
- A collapsible search panel in Map view and scrollable parking cards in List view.
- Saved spots and parking details.
- A photo-first contribution flow with editable details. (not actually implemented)
- Profile, login, and signup screens.

This is a demo. Favorites last only for the current session. Login, signup, and contribution submission are previews: authentication, real uploads, map, databases, and moderator review are not connected yet.

## Development

```sh
npm run lint
npm run typecheck
```

Routes are in `src/app/`, shared UI is in `src/components/`, and example parking data is in `src/data/mockParkingSpots.ts` tho map is not implemented yet.
