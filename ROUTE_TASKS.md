# Route feature: task list

Tick these in order. Each task has a check that proves it is done.

## A. Setup (15 minutes)
- [ ] `npm install --legacy-peer-deps`
- [ ] `npx expo install react-native-webview expo-location expo-linking expo-constants`
- [ ] Create a Geoapify key (https://myprojects.geoapify.com), copy `.env.example` to `.env`, paste the key
- [ ] `npm run typecheck` passes
- [ ] `npm run verify:route` prints `60 passed, 0 failed`
- [ ] `npx expo start -c`, open in Expo Go

## B. First run on the phone
- [ ] Hub, Route finder opens the new screen
- [ ] **Try the demo route**: two cards, detour first, sketch map, "Demo data" chip
- [ ] Breakdown opens; place rows expand and show a schedule
- [ ] Timer button starts a countdown of the expected length

## C. Live data
- [ ] Search two real places 3 to 6 km apart; map shows tiles and routes
- [ ] At least 2 route cards, or one card with the "only one route" note
- [ ] Places on the map are coloured by status
- [ ] Change the time with ±30 and the presets: scores update without a spinner
- [ ] Repeat the search in airplane mode: "Saved results"

## D. Tuning (30 minutes)
- [ ] Run five real routes at night times; note scores
- [ ] Adjust `targetShopsPerKm`, `worstQuietM` and the others in `services/route/config.ts` until scores spread
- [ ] Check which areas have good opening-hours coverage and pick the demo route there
- [ ] Re-run `npm run verify:route`

## E. Polish
- [ ] Add real contacts in Your circle; Share opens the composer with numbers prefilled
- [ ] Check text sizes and touch targets on a small phone
- [ ] Turn on TalkBack for a minute: cards, map buttons and place rows are announced
- [ ] Remove the unused `RouteScreen` and `BreakdownScreen` from `screens.tsx` and `routes` from `data/mock.ts` if desired

## F. Submission
- [ ] README: credit OpenStreetMap contributors, Geoapify, Leaflet; list limits and the scoring formula
- [ ] Rotate or restrict the Geoapify key after the event; make sure `.env` was never committed
- [ ] Record the demo on a route with good coverage, with the demo route as a backup
- [ ] Last commit before the deadline; no commits after it
