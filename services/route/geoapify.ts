import type { Point, RouteData, RouteStep, TravelMode } from '../../types/route.ts';
import { distanceM } from './geometry.ts';

const key = () => process.env.EXPO_PUBLIC_GEOAPIFY_KEY || '';
const api = 'https://api.geoapify.com/v1';

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    let detail = '';
    try { const body = await response.json() as { message?: string; error?: string }; detail = body.message || body.error || ''; } catch { /* keep the status-only message */ }
    throw new Error(response.status === 401 || response.status === 403 ? 'Geoapify rejected the API key. Check that the key is active and restart Expo.' : `Map service error (${response.status})${detail ? `: ${detail}` : '.'}`);
  }
  return response.json() as Promise<T>;
}

export async function geocodePlace(text: string, signal?: AbortSignal): Promise<Point> {
  if (!key()) throw new Error('Add EXPO_PUBLIC_GEOAPIFY_KEY to .env and restart Expo.');
  const data = await getJson<{ features?: Array<{ properties?: { lat?: number; lon?: number }; geometry?: { coordinates?: [number, number] } }> }>(`${api}/geocode/search?text=${encodeURIComponent(text)}&limit=1&apiKey=${key()}`, signal);
  const feature = data.features?.[0]; const lat = feature?.properties?.lat; const lon = feature?.properties?.lon; const coordinates = feature?.geometry?.coordinates;
  if (lat !== undefined && lon !== undefined) return { latitude: lat, longitude: lon };
  if (!coordinates) throw new Error(`Could not find “${text}”. Try a fuller address or landmark.`);
  return { longitude: coordinates[0], latitude: coordinates[1] };
}

type RoutingResponse = { features?: Array<{ geometry?: { coordinates?: [number, number][] }; properties?: { time?: number; distance?: number; legs?: Array<{ steps?: Array<{ distance?: number; road_class?: string; turn_type?: string }> }> } }> };
type PlacesResponse = { features?: Array<{ properties?: Record<string, unknown>; geometry?: { coordinates?: [number, number] } }> };

function routeMode(mode: TravelMode) { return mode === 'scooter' ? 'scooter' : mode === 'drive' ? 'drive' : 'walk'; }
function turnWeight(turn?: string) { return turn === 'roundabout' ? .5 : turn ? 1 : 0; }

export async function fetchLiveRoutes(from: Point, to: Point, mode: TravelMode, signal?: AbortSignal): Promise<RouteData[]> {
  if (!key()) throw new Error('Add EXPO_PUBLIC_GEOAPIFY_KEY to .env and restart Expo.');
  const straightLine = distanceM(from, to);
  if (straightLine > 100000) throw new Error(`Those places are about ${Math.round(straightLine / 1000)} km apart. Choose locations within 100 km.`);
  const types = mode === 'drive' ? ['balanced', 'short', 'less_maneuvers'] : ['balanced', 'short'];
  const responses = await Promise.all(types.map(async routeType => { const params = new URLSearchParams({ waypoints: `${from.latitude},${from.longitude}|${to.latitude},${to.longitude}`, mode: routeMode(mode), type: routeType, details: 'instruction_details,route_details', format: 'geojson', units: 'metric', lang: 'en', apiKey: key() }); try { return await getJson<RoutingResponse>(`${api}/routing?${params.toString()}`, signal); } catch (error) { if (routeType === 'balanced') throw error; return { features: [] }; } }));
  const features = responses.flatMap(response => response.features || []);
  if (!features.length) throw new Error('No route found between those places.');
  const routes: RouteData[] = features.slice(0, 3).map((feature, index) => {
    const props = feature.properties || {};
    const coordinates = (feature.geometry?.coordinates || []).map(([longitude, latitude]) => ({ latitude, longitude }));
    const steps: RouteStep[] = (props.legs || []).flatMap(leg => (leg.steps || []).map(step => ({ distanceM: step.distance || 0, roadClass: step.road_class, turnWeight: turnWeight(step.turn_type) })));
    const distanceM = props.distance || steps.reduce((sum, step) => sum + step.distanceM, 0);
    return { id: `live-${index}`, name: index === 0 ? 'Balanced route' : `Alternative ${index}`, coordinates, distanceM, durationMin: Math.max(1, Math.round((props.time || 60) / 60)), steps, places: [] };
  });
  await Promise.all(routes.map(async route => { route.places = await fetchPlacesAlongRoute(route, signal); }));
  return routes;
}

function classify(properties: Record<string, unknown>) {
  const categories = Array.isArray(properties.categories) ? properties.categories.join('.') : '';
  if (/hospital|pharmacy|clinic|police|fire|ambulance|fuel/i.test(categories)) return { kind: 'help' as const, subtype: categories.match(/hospital|pharmacy|clinic|police|fire|ambulance|fuel/i)?.[0] };
  if (/public_transport|railway|taxi|bus|tram|metro/i.test(categories)) return { kind: 'transit' as const, subtype: categories.match(/metro|railway|bus|tram|taxi/i)?.[0] };
  return { kind: 'shop' as const, subtype: categories.match(/cafe|restaurant|food|commercial|shop|cinema/i)?.[0] };
}

async function fetchPlacesAlongRoute(route: RouteData, signal?: AbortSignal) {
  if (!route.coordinates.length) return [];
  const response = await fetch(`${api.replace('/v1', '')}/places?apiKey=${key()}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal, body: JSON.stringify({ categories: ['commercial', 'catering', 'entertainment', 'healthcare', 'service', 'public_transport', 'railway'], filter: { type: 'polyline', geometry: { type: 'LineString', coordinates: route.coordinates.map(point => [point.longitude, point.latitude]) }, buffer: 250 }, limit: 500, lang: 'en' }) });
  if (!response.ok) return [];
  const data = await response.json() as PlacesResponse;
  return (data.features || []).flatMap((feature, index) => { const properties = feature.properties || {}; const coordinates = feature.geometry?.coordinates; if (!coordinates) return []; const classification = classify(properties); const name = String(properties.name || properties.address_line1 || `${classification.kind} point ${index + 1}`); const openingHours = typeof properties.opening_hours === 'string' ? properties.opening_hours : typeof (properties.datasource as { raw?: { opening_hours?: unknown }}|undefined)?.raw?.opening_hours === 'string' ? String((properties.datasource as { raw: { opening_hours: string }}).raw.opening_hours) : undefined; return [{ id: String(properties.place_id || `${route.id}-place-${index}`), name, kind: classification.kind, subtype: classification.subtype, position: { longitude: coordinates[0], latitude: coordinates[1] }, openingHours }]; });
}

export async function autocompletePlace(text: string, signal?: AbortSignal) {
  if (!key() || text.trim().length < 3) return [] as Array<{ id: string; label: string; position: Point }>;
  const data = await getJson<{ features?: Array<{ properties?: { place_id?: string; formatted?: string; lon?: number; lat?: number } }> }>(`${api}/geocode/autocomplete?text=${encodeURIComponent(text)}&limit=5&apiKey=${key()}`, signal);
  return (data.features || []).flatMap(feature => { const p = feature.properties; return p?.lat !== undefined && p.lon !== undefined ? [{ id: p.place_id || p.formatted || String(p.lat), label: p.formatted || 'Suggested place', position: { latitude: p.lat, longitude: p.lon } }] : []; });
}
