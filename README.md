# Bindaas

Bindaas is an Expo personal-safety demo with route activity estimates, live location sharing, and foreground-only safety tools. Contact details, preferences, and local history stay on the phone. SOS and location sharing open the phone's SMS composer with a prepared message; the app cannot confirm delivery. Route scores and platform checks use sample or third-party map data, and background tracking is not connected.

Version 1 includes the Bindaas brand logo, an animated splash screen, local sign-up/login and profile editing, a support centre, and optional calculator or cooking disguises.

## Features

- **Safety Hub** with an SOS countdown, trusted-circle summary, and quick access to every tool.
- **SOS draft** that opens the SMS composer with a prepared message and an optional map link. A short cancellation window prevents accidental sends.
- **Live location sharing** that keeps updating the map every few seconds until you tap **Stop sharing location**, even while moving between screens. The first message includes a map link and a note that updates continue until you stop.
- **Stop reminders** for live sharing: choose **5, 10, 30 minutes, or a custom duration** (1–1440 minutes). Bindaas shows an in-app reminder and schedules a local notification when the runtime supports it.
- **Trusted circle** saved on-device, used for SOS and live-location recipients.
- **Route finder** that compares a clearly labelled offline demo journey or live Geoapify routes with an Active Route Score and an experimental relative route-concern estimate. Hours, places, help points, turns, and distance are explained separately; the result is not a safety rating.
- **Safety timer** with a check-in reminder and an SOS prompt when the timer expires.
- **Simulated call** setup with optional ringtone, vibration, language, and a script; a scheduled notification opens the in-app incoming-call screen.
- **Account check** that compares two handles for lookalike letters, separators, and profile warning signs. Results stay on-device and can be saved as evidence.
- **Report, evidence, and privacy audit** tools for saving local notes, verifying evidence fingerprints, reviewing password and exposure hygiene, and opening the **Have I Been Pwned** breach check from the privacy audit.
- **Support centre** with first steps, verified helplines, useful links, and scenario-specific guidance (immediate danger, harassment, fraud, image abuse, and more).
- **On-device profile**: sign up, log in, edit name/phone/email, and choose a profile photo with `expo-image-picker`. Log out keeps local data; erase clears it.
- **Discreet modes**: a camouflaged calculator (`2468` opens the Hub, `1122` opens SOS) and a Tadka cooking skin.
- **Shake and voice triggers** while Bindaas is open, plus a loud-sound fallback in Expo Go.
- **Bindaas branding**: app icon, adaptive Android icon, splash artwork, and a logo-led header with a semi-transparent emblem.

## Tech stack

- Expo SDK 58, React Native 0.88, TypeScript
- Expo Router file-based navigation
- DM Serif Display and DM Sans via `@expo-google-fonts`
- Expo Location, Sensors, Notifications, Audio, Speech, Speech Recognition, Haptics, Keep Awake, SMS, Image Picker, Crypto, Clipboard, Sharing, and File System
- Lucide icons, `react-native-svg` map placeholder, and AsyncStorage for local profiles, contacts, evidence, and preferences
- React Native `StyleSheet` and the built-in `Animated` API; no UI framework

## Run locally

```sh
npm install
npx expo start
```

Open the project in an SDK-matched Expo Go on your iOS or Android phone by scanning the QR code. Keep your phone and computer on the same Wi-Fi network; if local connections are blocked, try `npx expo start --tunnel`.

```sh
npx expo start -c
```

To try native keyword recognition and reliable background notifications, create and run a development build after installing dependencies:

```sh
npx expo run:android
```

Some Expo Go Android versions crash when `expo-notifications` loads; Bindaas guards that optional module so the app can still open, but scheduled reminders require a compatible development build. Location, vibration, SMS composer, TTS, image picking, and the loud-sound voice fallback run in Expo Go. The native keyword recognizer (`expo-speech-recognition`) requires a development build. Voice monitoring is opt-in and foreground-only, and on-device recognition depends on the phone having an offline speech model installed.

The ringtone at `assets/sounds/ringtone.wav` is a bundled demo tone. Replace it with a licensed recording if needed. A scheduled call notification opens the in-app incoming-call simulation; Expo Go does not provide full-screen native call UI over the lock screen.

The source brand artwork is `BINDAAS.jpeg`. Generated assets in `assets/` provide the transparent logo, emblem, app icon, and adaptive icon.

## Screens and routes

| Screen | Route |
| --- | --- |
| Entry / animated splash | `/` |
| Splash with call to action | `/splash` |
| Onboarding | `/onboarding` |
| Sign up | `/signup` |
| Log in | `/login` |
| Safety Hub | `/(tabs)/hub` |
| Route finder | `/route` |
| Trusted circle | `/(tabs)/circle` |
| Tools / account check | `/(tabs)/tools` |
| Calculator discreet mode | `/calculator` |
| SOS draft | `/sos` |
| SOS countdown | `/sos-countdown` |
| Live location sharing | `/live` |
| Route breakdown | `/route-breakdown` |
| Safety timer | `/timer` |
| Simulated call setup | `/fake-call` |
| Simulated incoming call | `/incoming-call` |
| Account check | `/account-check` |
| Indicators found | `/scan-result` |
| Report and evidence | `/report` |
| Saved evidence | `/evidence` |
| Privacy audit | `/privacy` |
| Are you OK? prompt | `/are-you-ok` |
| Settings | `/settings` |
| Edit profile | `/edit-profile` |
| Support home | `/support` |
| Support scenario | `/support/[scenario]` |
| Cooking screen | `/cooking` |
| Tadka feed | `/(tadka)/feed` |
| Tadka box / pantry | `/(tadka)/box`, `/(tadka)/pantry` |
| Tadka feature / recipe | `/(tadka)/feature`, `/(tadka)/recipe/[slug]` |

Demo calculator codes are `2468` (Hub) and `1122` (SOS). Contact data is stored locally with the key `contacts:v1`. A local session is stored as `session:v1`.

## Live location sharing

Live sharing is foreground-only. Start it from **Share location**, choose recipients and a stop reminder, then leave Bindaas open. The map and saved coordinates update every few seconds until you tap **Stop sharing location**. **Send latest location now** opens a fresh SMS draft with the current coordinates. Logging out or erasing local data also stops sharing.

The stop reminder is checked while the app is open and, when notifications are available, scheduled as a local notification. The message itself still opens in your SMS app for you to review and send; Expo cannot send SMS silently.

## Route / Journey

The Route finder compares a clearly labelled offline demo journey or live Geoapify routes using two separate explanations: Active Route Score for listed activity, and an experimental relative route-concern estimate based only on available route, venue, help-resource, time, distance, and turn data. It is not a probability of harm or a safety rating. Set `EXPO_PUBLIC_GEOAPIFY_KEY` in a local `.env` for geocoding, routing, autocomplete, places, and optional tiles; never commit `.env`.

The estimate is limited by incomplete or outdated OpenStreetMap opening hours. Unknown lighting, crime, crowd levels, CCTV, incidents, isolation, and dead-end data remain unknown; they are not treated as favourable evidence. It does not provide turn-by-turn navigation, background location, tracking, or a backend. Location access remains foreground-only and only follows a user tap. Attribution for live map/routing work is OpenStreetMap contributors, Geoapify and Leaflet.

## Data and privacy

- Profiles, contacts, evidence, settings, route selections, and the SOS log are stored on the device with AsyncStorage.
- Evidence fingerprints are generated locally with SHA-256.
- No account server, analytics, or background location service is connected.
- **Check your account** in the privacy audit opens `haveibeenpwned.com` externally; Bindaas does not send the email address itself.
- Log out removes only `session:v1`; **erase** clears all stored Bindaas keys and cancels scheduled notifications.

## Checks and tests

```sh
npm run typecheck
npm test
npm run verify:route
npm run audit:tadka
```

`npm test` covers route hours and scoring, profile validation, logout/erase behaviour, support data, Tadka copy, lookalike detection, and live-location session helpers.
