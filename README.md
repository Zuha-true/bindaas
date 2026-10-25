# Bindaas

Bindaas is an Expo demo for route activity estimates and foreground-only personal safety tools. Contact details, preferences, and a short SOS log are stored on-device. SOS opens the phone’s SMS composer with a prepared message; the app cannot confirm delivery. Route scores and platform checks use sample data, and background tracking is not connected.

## Tech stack

- Expo SDK 58, React Native 0.88, TypeScript
- Expo Router file-based navigation
- DM Serif Display and DM Sans via `@expo-google-fonts`
- Expo Location, Sensors, Notifications, Audio, Speech, Haptics, Keep Awake, SMS and File System
- Lucide icons, `react-native-svg` map placeholder, AsyncStorage for trusted contacts and demo preferences
- React Native `StyleSheet`; no UI framework

## Run locally

```sh
npm install
npx expo start
```

Open the project in an SDK-matched Expo Go on your iOS or Android phone by scanning the QR code. Keep your phone and computer on the same Wi-Fi network; if local connections are blocked, try `npx expo start --tunnel`. Some Expo Go Android versions currently crash when `expo-notifications` loads; Bindaas guards that optional module so the app can still open, but background reminders require a compatible development build. Location, vibration, SMS composer, TTS, and the loud-sound voice fallback can run in Expo Go. The native keyword recognizer (`expo-speech-recognition`) also requires a development build. Voice monitoring is opt-in and foreground-only. On-device recognition depends on the phone having an offline speech model installed.

```sh
npx expo start -c
```

To try native keyword recognition, create and run a development build after installing dependencies:

```sh
npx expo run:android
```

The ringtone at `assets/sounds/ringtone.wav` is a bundled demo tone. Replace it with a licensed recording if needed. A scheduled call notification opens the in-app incoming-call simulation; Expo Go does not provide full-screen native call UI over the lock screen.

## Screens and routes

| Screen | Route |
| --- | --- |
| Splash | `/` |
| Onboarding | `/onboarding` |
| Sign up | `/signup` |
| Safety Hub | `/(tabs)/hub` |
| Route finder | `/route` |
| Trusted circle | `/(tabs)/circle` |
| Tools / account check | `/(tabs)/tools` |
| Calculator discreet mode | `/calculator` |
| SOS draft | `/sos` |
| SOS countdown | `/sos-countdown` |
| Location snapshot | `/live` |
| Route breakdown | `/route-breakdown` |
| Safety timer | `/timer` |
| Simulated call setup | `/fake-call` |
| Simulated incoming call | `/incoming-call` |
| Account check | `/account-check` |
| Indicators found | `/scan-result` |
| Report and evidence | `/report` |
| Privacy audit | `/privacy` |
| Are you OK? prompt | `/are-you-ok` |
| Settings | `/settings` |
| Tadka cooking skin | `/cooking` |

Demo calculator codes are `2468` (Hub) and `1122` (SOS). Contact data is stored locally with the key `contacts:v1`.

## Route / Journey

The Route finder compares a clearly labelled offline demo journey or live Geoapify routes using two separate explanations: Active Route Score for listed activity, and an experimental relative route-concern estimate based only on available route, venue, help-resource, time, distance, and turn data. It is not a probability of harm or a safety rating. Set `EXPO_PUBLIC_GEOAPIFY_KEY` in a local `.env` for geocoding, routing, autocomplete, places, and optional tiles; never commit `.env`.

The estimate is limited by incomplete or outdated OpenStreetMap opening hours. Unknown lighting, crime, crowd levels, CCTV, incidents, isolation, and dead-end data remain unknown; they are not treated as favourable evidence. It does not provide turn-by-turn navigation, background location, tracking, or a backend. Location access remains foreground-only and only follows a user tap. Attribution for live map/routing work is OpenStreetMap contributors, Geoapify and Leaflet.

Run `npm run typecheck` and `npm run verify:route` to check the route engine.
