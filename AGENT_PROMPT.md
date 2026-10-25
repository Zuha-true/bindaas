# Prompt for your coding agent

Copy everything inside the block into your agent (Claude Code, Cursor, Copilot or similar), opened at the project root.

````
You are working in "Bindaas", an Expo SDK 58 / React Native / TypeScript app that uses Expo Router.
Read these first, in order: docs/ROUTE_PRD.md, docs/ROUTE_SCORING_SPEC.md, docs/ROUTE_TASKS.md, theme/tokens.ts, components/ui.tsx.

## What already exists
The Route / Journey feature has been implemented. Do not rewrite it. Your job is to bring it up, verify it, tune it and polish it inside the existing app.

New code: types/route.ts, services/route/* (config, geometry, hours, score, analyse, geoapify, planner, location, share, deviation), storage/routeCache.ts, state/routeStore.ts, data/demoRoute.ts, features/route/* (RouteScreen, BreakdownScreen, format, components/*), scripts/verify-route-engine.ts.
Rewired: app/route.tsx and app/route-breakdown.tsx now re-export the new screens. TimerScreen in screens.tsx reads ?minutes=N.

## Hard rules
1. Do not change the colour palette. Use only tokens from theme/tokens.ts. You may enhance layout, spacing, motion, empty states and accessibility using existing tokens and the components in components/ui.tsx. Do not add a UI library.
2. Keep fonts: DM Serif Display for titles and numbers, DM Sans for text.
3. Wording: always "Activity estimate, not a safety rating." Never call a route, place or area "safe" or "unsafe". Messages are "prepared" or "opened", never "sent" or "delivered".
4. Foreground location only, only on user tap. No background location, no tracking, no data uploaded other than the Geoapify requests in services/route/geoapify.ts.
5. Never commit .env or print the API key. EXPO_PUBLIC_GEOAPIFY_KEY is read from .env.
6. Put every tunable number in services/route/config.ts. Keep services/route/score.ts, hours.ts, geometry.ts and analyse.ts free of React Native imports so scripts/verify-route-engine.ts keeps running in Node.
7. The route idea comes from reference videos of another project. Do not copy their names, copy, layout or branding. Keep the Bindaas names: Active Route Score, activity strip, quiet stretch, smart detour.
8. Do not add dependencies except those listed in the tasks. Use `npx expo install <pkg>` so versions match the SDK.
9. Do not make git commits unless I ask.

## Tasks (do them in order; after each, run `npm run typecheck && npm run verify:route`)
1. Setup. Run `npm install --legacy-peer-deps` and `npx expo install react-native-webview expo-location expo-linking expo-constants`. Confirm .env exists (copy .env.example). Report anything that fails.
2. Static checks. Fix any TypeScript errors. `npx expo export --platform android --output-dir /tmp/out` must succeed.
3. Demo path. Start Expo and walk the demo route end to end (Hub, Route finder, Try the demo route, breakdown, a place row, timer). Fix any layout overflow, keyboard overlap (autocomplete list hidden by the keyboard), or touch targets under 44 px. Keep the existing look.
4. Live path (needs my key). With a real key, search two places and confirm: tiles load, routes draw, quiet stretch shows in orange, place dots show, tapping an unselected route line selects it. If the Places API returns nothing, log one raw response (without the key), then correct the category lists in services/route/config.ts and the field mapping in featureToPlace in services/route/geoapify.ts. Add the case to scripts/verify-route-engine.ts.
5. Time re-scoring. Confirm that changing the departure time re-scores with no network call (check there is no fetch). Add a small "scored for 9:30 PM" label if it helps.
6. Keyboard and scroll. The From and To suggestion lists must stay visible above the keyboard. If the map inside the ScrollView steals vertical scroll on Android, keep the Expand map modal as the main way to pan and zoom.
7. Accessibility. Every Pressable has an accessibilityLabel or text. Scores are announced as "activity score N out of 100". Status is never conveyed by colour alone (the text next to the dot already says it; keep it).
8. Tuning. Run five real routes at night times. Print analysis.components for each. Adjust the target values in services/route/config.ts so the best and worst routes differ by at least 25 points. Update docs/ROUTE_SCORING_SPEC.md with the final numbers and re-run verify.
9. Integration polish (small, optional):
   a. Hub: under the "Route finder" tile show the last searched destination, if any (read from the last query in storage/routeCache.ts). Same card style as other tiles.
   b. In AreYouOkScreen, if a route is selected in the route store, show its name in the body text. Do not add tracking.
10. Cleanup. Remove the unused RouteScreen and BreakdownScreen from screens.tsx and the unused `routes` export from data/mock.ts only after confirming nothing imports them (`grep -rn`). Update README.md: add a Route section (setup, env key, scoring summary, credits for OpenStreetMap contributors, Geoapify and Leaflet, and the limits).

## Definition of done
- `npm run typecheck` and `npm run verify:route` pass.
- The demo route and a live route both work on an Android phone in Expo Go.
- No new colours, no new fonts, no unsafe wording, no background location.
- README documents setup and limits.

## Report back
End with: files changed (one line each), anything you could not verify without a device or key, the tuned values in config.ts, and any risks you noticed.
````

## Smaller prompts you can reuse

**Fix one bug**
```
In the Bindaas route feature, [describe what you see]. Find the cause in features/route or services/route, fix it without changing the colour palette, keep the engine files free of React Native imports, and add a check to scripts/verify-route-engine.ts if the bug was in pure logic. Run npm run typecheck && npm run verify:route.
```

**Tune scoring**
```
Open docs/ROUTE_SCORING_SPEC.md and services/route/config.ts. Here are five routes with their current component values: [paste]. Adjust only the target values in config.ts so scores spread across roughly 25 to 80 without making any route above 90 or below 10. Explain each change in one line, update the spec table, and re-run npm run verify:route.
```

**Add the off-route prompt (phase 2)**
```
Using DeviationTracker in services/route/deviation.ts, while the safety timer is running and a route is selected, read foreground location every 15 seconds with expo-location (no background mode). If tracker.update(...).deviating becomes true, open /are-you-ok. Stop reading when the timer ends or the screen unmounts. Add a labelled "Demo: simulate deviation" switch that feeds fake coordinates. Wording must stay: prompt, never "alert sent".
```
