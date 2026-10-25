# Active Route Score: scoring specification

Source of truth: `services/route/score.ts` and `services/route/config.ts`. Change numbers in `config.ts`, not in the logic.

The score is an **activity estimate based on listed opening hours**. It is not a safety rating and must never be described as one.

## Inputs
- `route`: coordinates, distance, duration, steps (each with distance, road class and a turn weight)
- `places`: shops, help points and transport points found near the route, each with optional OSM `opening_hours`
- `departAt`: epoch milliseconds of departure
- `mode`: walk, scooter or drive (changes how close a place must be)

## Step 1: sample the route
Resample the polyline every **50 m** into sample points `p[i]` with distance along the route `d[i]`.

## Step 2: time of passing
For each place find its nearest position on the route (distance from the line `offset`, distance along `along`).
`passAt = departAt + (along / routeLength) * duration`
The place counts only if `offset` is within its buffer:

| Kind | walk | scooter | drive |
| --- | --- | --- | --- |
| shop | 100 m | 70 m | 70 m |
| transit | 250 m | 150 m | 150 m |
| help | 300 m | 300 m | 300 m |

## Step 3: status at `passAt`
Parsed from OSM `opening_hours` in local time (UTC+5:30 by default).

| Status | Meaning | Weight |
| --- | --- | --- |
| open | open at `passAt` | 1.0 |
| closing_soon | open, but closes within 30 min of `passAt` | 0.5 |
| closed | listed closed | 0 |
| unknown | no hours, or hours that cannot be read confidently | 0 |

Supported syntax: `24/7`, day ranges and lists, several time ranges, times past midnight, `off`, later rules overriding earlier ones, additive rules after a comma, `PH` and `SH` rules ignored. Months, week numbers, sunrise and sunset, open-ended `10:00+` and conditions give `unknown`.

## Step 4: activity and help coverage per sample
- A sample is **active** if an open place (weight above 0) is within **100 m**.
- A sample is **help covered** if an open help point is within **300 m**.
- `longestQuietM` = longest run of inactive samples × 50 m.
- `longestHelpGapM` = longest run of samples without help cover × 50 m.
- `inactiveShare` = inactive samples ÷ all samples.

## Step 5: six components (total 100)

Let `L` be the route length in km (at least 0.05) and `clamp01(x)` limit x to 0..1.

| # | Key | Max | Formula |
| --- | --- | --- | --- |
| 1 | activity | 25 | `25 × clamp01( Σ weight(shops) / L / 12 )` |
| 2 | help | 20 | `20 × 0.6 × clamp01( Σ weight × typeWeight / 4 )` + `20 × 0.4 × (1 − clamp01( longestHelpGapM / 2000 ))` |
| 3 | mainRoad | 15 | `15 × share of route distance on motorway, trunk, primary, secondary or tertiary roads` |
| 4 | transit | 10 | `10 × clamp01( Σ weight(transit) / 3 )` |
| 5 | continuity | 20 | `20 × ( 0.7 × (1 − clamp01( longestQuietM / 800 )) + 0.3 × (1 − inactiveShare) )` |
| 6 | simplicity | 10 | `10 × (1 − clamp01( turnsPerKm / 6 ))`, with `turnsPerKm = turns / max(L, 0.5)` |

Help type weights: hospital 1, police 1, fire 1, ambulance 1, pharmacy 0.8, fuel 0.8, clinic 0.5.
Turns: left, right, slight and sharp turns and U-turns count 1; a roundabout counts 0.5.

## Step 6: total
`score = round( Σ earned ÷ Σ max of available components × 100 )`
A component is **unavailable** when its data is missing (for example road class not returned). It is removed from both sums, so the total is rescaled rather than punished.

## Step 7: confidence
`knownHoursShare` = nearby places with a readable opening-hours value ÷ all nearby places.
High at 70% or more, medium at 40% or more, otherwise low. Shown on cards and on the breakdown.

## Step 8: ranking and badges
Sort by score, ties go to the faster route. Badges: most listed activity (rank 1), fastest, fewest turns, goes around the quiet stretch (detour routes). `extraMinutes` is the difference from the fastest route.

## Tuning
The targets (12 shops per km, 4 weighted help points, 2000 m help gap, 3 transit points, 800 m quiet stretch, 6 turns per km) are starting points. After testing five real routes in your city:
1. Print the component values (`console.log(analysis.components)`).
2. If every score lands in a narrow band, move the targets until the best and worst routes differ by 25 points or more.
3. Re-run `npm run verify:route`.
4. Note the final values in the README so judges can see the reasoning.

## Limits to state openly
- Opening hours come from OpenStreetMap and are incomplete and sometimes wrong.
- A place being open does not mean anyone there can or will help.
- No crime, lighting or footfall data is used.
