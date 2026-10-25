# Bindaas: Route / Journey feature PRD

Version 1.0 · Expo SDK 58 · React Native · recHERsion'26 build

This PRD covers one feature: choosing a route at night by how much listed activity it passes, at the time the traveller will actually pass it. It replaces the static mock in `RouteScreen` and `BreakdownScreen` with a working, data-driven version and keeps the existing look of the app.

---

## 1. Where the app is today

The project is a UI prototype. Every screen exists and navigates, but the route feature is fake:

| Piece | Today | After this PRD |
| --- | --- | --- |
| `app/route.tsx` | re-exports `RouteScreen` from `screens.tsx` | re-exports `features/route/RouteScreen.tsx` |
| `app/route-breakdown.tsx` | re-exports `BreakdownScreen` from `screens.tsx` | re-exports `features/route/BreakdownScreen.tsx` |
| Route data | `routes` array in `data/mock.ts` (hardcoded) | fetched from Geoapify, scored on device |
| Map | `MapPlaceholder` (static SVG) | Leaflet map in a WebView (real tiles), SVG sketch as fallback |
| Score | hardcoded 67 / 56 / 44 | computed from opening hours, distance, road class, turns |
| Timer link | opens a fixed 24:35 countdown | opens a countdown sized to the trip |

Everything else (Hub, SOS, Circle, Calculator, Settings) is untouched except one line in `TimerScreen` that reads a `minutes` parameter.

### Theme rule
Colours, fonts, radii and spacing come from `theme/tokens.ts` and the shared components in `components/ui.tsx`. Nothing in the palette changes. The enhancements below only reuse existing tokens: `ink`, `pink`, `pink100`, `rose`, `orange`, `green`, `muted`, `sos`, `warnBg`, `warn`, `mapSurface`.

---

## 2. Inspiration, and what is deliberately different

The reference videos show a "night activity score" idea: rank routes by how many places are listed open when you pass, show a per-place open or closed view, and call out long empty stretches. This PRD uses the idea, not the product. The implementation, names, formulas, copy and visuals are original:

| Idea in the references | What Bindaas does differently |
| --- | --- |
| Single score of listed activity | Named **Active Route Score**, six components that add to 100, with help coverage and quiet gaps weighted higher |
| Open or closed at passing time | Four states: open, **closing soon** (half credit), closed, and **unknown** (never counted as open) |
| Long dark stretch illustration | **Activity strip** on every card plus the quiet stretch drawn in orange on the map |
| Alternative routes | Routes from routing strategies **plus a smart detour** that avoids the quietest point of the best route |
| Needs network for everything | Fetched data is cached, so changing the **departure time re-scores instantly with no network call** |
| No data confidence | **Confidence** label based on how many nearby places list opening hours |
| Fixed demo | Built-in simulated demo route, clearly labelled, that works offline |

Credit OpenStreetMap contributors, Geoapify and Leaflet in the README, the PPT and on the map.

---

## 3. Goals and non-goals

### Goals
1. Let a user enter a start and a destination, a travel mode and a departure time, and get two or three routes ranked by Active Route Score.
2. Explain every score: six components, the longest quiet stretch, the longest stretch without an open help point, and every place with its status when the user passes.
3. Make the quiet stretch visible on the card (strip) and on the map (orange overlay).
4. Work in Expo Go with no native build and no backend.
5. Stay honest: it is an activity estimate based on listed hours, never a safety rating.
6. Connect to the rest of the app: start a check-in timer sized to the trip, share the trip by SMS (user presses send).

### Non-goals
- Crime, lighting, or any "safe" or "unsafe" verdict.
- Turn-by-turn navigation or live tracking.
- Background location of any kind.
- A backend, accounts, or server-side scoring.
- Public transport routing (transit modes are not supported by `route_details`).

---

## 4. Users and flows

**User:** a woman travelling in the evening, often holding her phone in one hand, who wants to choose between routes quickly.

### Primary flow
1. Hub, tap **Route finder**.
2. Enter **From** (or tap **Use my location**) and **To**; pick **Walk, Two-wheeler or Car or cab**; pick a time (**Now, 8:00 PM, 9:30 PM, 11:00 PM**, or step by 30 minutes).
3. Tap **Compare routes**. Progress shows: Finding routes, Checking places along routes, Looking for a way around quiet stretches.
4. See the map and ranked route cards. Tap a card to highlight that route on the map.
5. Tap **See route breakdown** for the six components, quiet stretch, help gap and the place list.
6. Tap a place to see its weekly schedule with the passing day highlighted.
7. Tap **Start check-in timer** or **Share this route**.

### Secondary flows
- Change departure time after results: scores update instantly, no network.
- **Try the demo route:** loads simulated data, works offline.
- Error, rate limit, or no key: show a plain message with **Try again** and **Use demo route**.
- Open the breakdown with no results: show an empty state with a button back to the route finder.

```
Hub ─ Route finder ─ search ─ results ─┬─ Breakdown ─ place detail
                                       ├─ Timer (minutes = trip + 25% + 5)
                                       └─ Share (SMS composer, user sends)
```

---

## 5. Functional requirements

IDs are used in the task list and in test notes.

### 5.1 Route finder screen (`features/route/RouteScreen.tsx`)

| ID | Requirement | Acceptance |
| --- | --- | --- |
| R-1 | From and To fields with address suggestions after 3 characters, debounced 350 ms | Suggestions appear within 2 s on a normal connection; selecting one fills the field |
| R-2 | **Use my location** asks foreground permission only when tapped; falls back politely if denied | Denying shows a message and the field stays editable |
| R-3 | Swap button exchanges From and To | Fields and state swap |
| R-4 | Mode chips: Walk, Two-wheeler, Car or cab | Changing mode clears old results (routes depend on mode) |
| R-5 | Time chooser: Now, three presets, ±30 min | Changing time re-scores existing results with no network request |
| R-6 | Compare routes disabled until both places are set | Button does nothing without both |
| R-7 | Loading card with progress text and Cancel | Cancel aborts requests and returns to the previous state |
| R-8 | Result cards sorted by score; selecting one highlights it on the map | Rank, badges, `+N min` versus the fastest |
| R-9 | Each card shows score ring, time, distance, places open count, activity strip, confidence | See `RouteCard.tsx` |
| R-10 | Disclaimer under results: "Activity estimate, not a safety rating." | Always visible with results |
| R-11 | Demo chip when data is simulated; "Saved results" chip when from cache | Visible |
| R-12 | Start check-in timer opens `/timer?minutes=N` where N = ceil(trip minutes × 1.25) + 5 | Timer starts at N minutes |
| R-13 | Share this route opens the SMS composer prefilled; message says the user must send it | No claim of delivery |
| R-14 | Expand map opens a full-screen map modal | Map usable without scroll conflicts |

### 5.2 Map (`components/RouteMap.tsx`, `RouteSketch.tsx`)

| ID | Requirement |
| --- | --- |
| M-1 | Real map: Leaflet 1.9.4 in a WebView, Geoapify `positron` tiles with a warm CSS filter so they match the cream palette |
| M-2 | Selected route: white casing plus ink line. Other routes: rose dashed. Quiet stretch: orange overlay. A is a white circle with ink ring, B is `sos` red |
| M-3 | Place markers coloured by status: green open, orange closing soon, muted closed or unknown; toggle with "Places on map" |
| M-4 | Tapping an unselected route line selects it |
| M-5 | Fallback to the SVG sketch for demo data, no API key, or a failed load; a "Sketch" button switches manually |
| M-6 | Attribution "OpenStreetMap contributors · Geoapify" on the map and under the results |

### 5.3 Breakdown screen (`features/route/BreakdownScreen.tsx`)

| ID | Requirement |
| --- | --- |
| B-1 | Route switcher chips when more than one route exists |
| B-2 | Hero card: score ring, "Active Route Score", disclaimer, time, distance, departure, confidence line |
| B-3 | Activity strip with a sentence naming where the longest quiet stretch is |
| B-4 | Six components with numbered badges, points earned out of max, a bar and a hint; unavailable components show `n/a` and are excluded from the total |
| B-5 | Two stat cards: longest stretch without an open help point, longest quiet stretch |
| B-6 | "What we saw along the way": found, open, closed, hours not listed for shops, help points, transport |
| B-7 | Place list with filters (All, Help points, Shops & food, Transport, Open, Closed), 25 per page |
| B-8 | Each place row shows status, "about N min into the journey, around 9:42 PM"; tap expands a seven-day schedule with the passing day highlighted; unreadable hours are shown verbatim |
| B-9 | Footer text on data limits; buttons for timer and share |

---

## 6. Data pipeline

All network code is in `services/route/geoapify.ts`. All decisions are in pure functions (`score.ts`, `hours.ts`, `geometry.ts`).

1. **Routes.** One request per strategy, in parallel: `balanced`, `short`, and `less_maneuvers` only for `drive` (the API supports it only for motorised road modes). Parameters: `mode`, `type`, `details=instruction_details,route_details` (gives turn types and road class). Waypoints are `lat,lon|lat,lon`.
2. **De-duplicate.** Two routes are the same when 90% of one route's sample points are within 60 m of the other.
3. **Places along each route.** Two POST requests to the Places API per route with a polyline filter and a buffer:
   - activity: `commercial`, `catering`, `entertainment.cinema`, buffer 130 m
   - support: hospitals, pharmacies, clinics, police, fire, ambulance, fuel, public transport, metro, light rail, taxi, buffer 320 m
   The route line is simplified to at most 600 points so the request body stays small. Up to two pages of 500 results.
4. **Classify** each feature (`featureToPlace`): shop, help (with type) or transit, and read `opening_hours` from `properties.opening_hours` or `properties.datasource.raw.opening_hours`.
5. **Smart detour.** Score the routes; if the best one has a quiet stretch of 400 m or more, request one more route with `avoid=location:lat,lon` at the middle of that stretch. Keep it if it is distinct and takes at most 1.6 times the fastest route's time.
6. **Cache** the bundle (routes plus places) in AsyncStorage for 24 hours, keyed by rounded coordinates and mode. Four entries maximum.
7. **Score** on device for the chosen departure time (`analyseBundle`). Rank, add badges and `+N min`.

Credit use per fresh search is roughly: routes 3 to 4 (each with `route_details` costs extra), places 6 to 8 requests, plus one detour. The free plan is 3,000 credits a day, so cache and demo mode matter. Check the current pricing page before the final demo.

### Time and timezone
`LOCAL_UTC_OFFSET_MIN` in `config.ts` is 330 (India Standard Time, no daylight saving). Opening hours are local time, so the passing time is converted with this offset. Change it if the app is used elsewhere.

---

## 7. Scoring (summary)

Full formulas are in `docs/ROUTE_SCORING_SPEC.md`. In short, 100 points:

| # | Component | Max | Idea |
| --- | --- | --- | --- |
| 1 | Open places along the route | 25 | open shops and food per km |
| 2 | Open help points nearby | 20 | weighted count (60%) plus shortest gap between help points (40%) |
| 3 | Distance on main roads | 15 | share of the route on motorway to tertiary roads |
| 4 | Open transport points | 10 | weighted count of open transport within reach |
| 5 | Fewer quiet gaps | 20 | longest quiet stretch (70%) plus share of quiet route (30%) |
| 6 | Fewer turns | 10 | turns per km |

Unknown opening hours earn nothing. If a component has no data (for example road class), it is excluded and the total is rescaled, so a missing field never silently lowers a score.

---

## 8. Files

### New
```
types/route.ts                        shared types
services/route/config.ts              every tunable number
services/route/geometry.ts            distance, resample, projection, simplify
services/route/hours.ts               opening_hours parser and evaluator, time helpers
services/route/score.ts               scoreRoute, rankAnalyses
services/route/analyse.ts             analyseBundle (pure)
services/route/geoapify.ts            geocode, routing, places, tiles
services/route/planner.ts             fetchBundle: routes, places, detour, cache
services/route/location.ts            one-off foreground location
services/route/share.ts               trip SMS
services/route/deviation.ts           off-route tracker (phase 2 hook, pure)
storage/routeCache.ts                 bundle cache and last query
state/routeStore.ts                   shared store with useRouteState
data/demoRoute.ts                     simulated demo bundle
features/route/RouteScreen.tsx
features/route/BreakdownScreen.tsx
features/route/format.ts
features/route/components/RouteMap.tsx, RouteSketch.tsx, RouteCard.tsx,
  ActivityStrip.tsx, PlaceSearchField.tsx, TimeChooser.tsx, PlaceRow.tsx
scripts/verify-route-engine.ts        60 offline checks
docs/*.md
.env.example
```

### Modified
```
app/route.tsx             now re-exports features/route/RouteScreen
app/route-breakdown.tsx   now re-exports features/route/BreakdownScreen
screens.tsx               TimerScreen reads ?minutes=N (one line); old RouteScreen and BreakdownScreen are now unused
package.json              + react-native-webview, expo-location, tsx, script verify:route
.gitignore                + .env
```

`data/mock.ts` still exports `routes`; it is no longer used by the route screens and can be deleted together with the old screens when convenient.

---

## 9. Error handling

| Situation | Behaviour |
| --- | --- |
| No API key | Address search off, hint shown, demo route available |
| Key rejected (401 or 403) | Message names the env variable; no retry button |
| Daily limit (429) | "Limit reached", retry and demo buttons |
| Offline or timeout (15 s) | "Could not reach the map service", retry and demo |
| No route between places | "No route found" |
| One route survives de-duplication | Show one card with a note |
| Places request fails | Whole search fails with the message above (partial scores would mislead) |
| Detour request fails | Ignored silently; standard routes are shown |
| Map page fails to load | Switch to the SVG sketch automatically |
| Location denied | Alert, field stays editable |
| Opening hours unreadable | Place is `unknown`; shown verbatim in the place detail |

---

## 10. Safety and privacy wording

- Always: "Activity estimate, not a safety rating."
- Never use "safe", "unsafe", "dangerous", "protected" about a route or place.
- Messages: "prepared" or "opened", never "sent" or "delivered".
- Location is read once, on tap, in the foreground. Nothing is stored except the last searched addresses.
- The Geoapify key ships inside the app bundle (every `EXPO_PUBLIC_` value does). Restrict it in the Geoapify dashboard and rotate it after the event. Never commit `.env`.
- Opening hours are crowd-sourced and can be wrong; the UI says so.

---

## 11. Design enhancements (same palette)

- Score rings reuse `ScoreRing`; larger on the breakdown hero card.
- **Activity strip**: 40 small bars per route, rose when a place is open nearby, orange when quiet.
- Map tiles warmed with `sepia(.28) saturate(.9) hue-rotate(-10deg)` to sit on the cream background.
- Status dots: green, orange, muted. No new colours.
- Chips for badges, filters, modes and times, all existing `Chip`.
- 44 px minimum touch targets; accessibility labels on cards, map controls and place rows.
- Display type stays DM Serif Display for numbers and titles; body stays DM Sans.

---

## 12. Test plan

### Automated (no device)
`npm run verify:route` runs 60 checks: opening-hours cases (past midnight, additive rules, unknown formats), geometry, place classification, scoring behaviour (busy beats empty, closed places earn nothing at night, unknown hours are not counted, missing road class rescales, more turns lowers the score), ranking, the demo story (detour beats the direct route at 9 PM), deviation tracker.
`npm run typecheck` must pass.

### Manual on an Android phone in Expo Go
1. Demo route: tap **Try the demo route**; two cards, detour ranked first at Now or 9:30 PM; "Demo data" chip; sketch map.
2. Change time to 11:00 PM and to 12:00 noon equivalent (step ±30 repeatedly): scores change with no spinner.
3. With a key: search two real places 3 to 6 km apart; 2 to 3 cards; map shows tiles, routes and markers.
4. Tap an unselected route line on the map: selection changes.
5. Breakdown: components add up; open a place; the passing day is highlighted.
6. Airplane mode, repeat the same search: "Saved results" appears.
7. Airplane mode, new search: error card with demo button.
8. Deny location, tap Use my location: polite message.
9. Timer button: countdown starts at the expected minutes.
10. Share: SMS composer opens with the trip text; nothing claims it was sent.
11. Switch mode to Car or cab: results clear; compare again works.

---

## 13. Setup (exact steps)

```sh
npm install --legacy-peer-deps
npx expo install react-native-webview expo-location
cp .env.example .env          # then paste your key: EXPO_PUBLIC_GEOAPIFY_KEY=...
npm run typecheck
npm run verify:route
npx expo start -c             # -c clears the cache so the new env value is picked up
```

Get a key at https://myprojects.geoapify.com (free plan, no card). Restart Expo after editing `.env`.

---

## 14. Risks

| Risk | Mitigation |
| --- | --- |
| Few places list opening hours, so many show "unknown" | Confidence label; unknown never counted; choose a demo area with good OSM coverage |
| Walking routes from the two strategies are nearly identical | De-duplication plus the smart detour; pick demo endpoints where roads differ |
| WebView map slow or blocked | SVG fallback; demo data never needs the map |
| API quota | 24 h cache; time changes re-score locally; demo route |
| Leaflet or tile CDN unreachable | Same fallback |
| Wrong hours in OSM | Disclosure text; per-place schedule so users can judge |
| Key exposed in the bundle | Restrict and rotate; documented |
| Category names change in the Places API | All category lists are in `config.ts`; a failed list shows as zero places, check the Geoapify categories page |

## 15. Phase 2 backlog

1. Off-route prompt: feed foreground location into `DeviationTracker` while the timer runs and open `/are-you-ok` when `deviating` is true.
2. Wire SOS draft to include the active route and the last known position.
3. Tune `SCORE_CONFIG` targets against 5 real routes so scores spread over roughly 25 to 80.
4. Per-user "avoid" options (for example skip bars).
5. Optional live tracking page (needs a backend).

## 16. Demo script (about 60 seconds)

1. Hub, Route finder. Set 9:30 PM, Two-wheeler.
2. Compare. Say: the direct route is quickest but has a long quiet stretch; show the orange bars.
3. Select the detour: higher score, a few minutes longer.
4. Breakdown: six components, the closed pharmacy at passing time, the help gap.
5. Start the timer, then share the trip. Say clearly: Bindaas prepares the message, you send it. It is an activity estimate, not a safety rating.
