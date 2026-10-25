import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RouteData, TravelMode } from '../types/route.ts';
const prefix = 'route-cache:v1:';
const keyFor = (from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }, mode: TravelMode) => `${prefix}${from.latitude.toFixed(3)},${from.longitude.toFixed(3)}:${to.latitude.toFixed(3)},${to.longitude.toFixed(3)}:${mode}`;
export async function readRouteCache(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }, mode: TravelMode) { try { const raw = await AsyncStorage.getItem(keyFor(from, to, mode)); if (!raw) return null; const saved = JSON.parse(raw) as { savedAt: number; routes: RouteData[] }; return Date.now() - saved.savedAt < 24 * 60 * 60 * 1000 ? saved.routes : null; } catch { return null; } }
export async function saveRouteCache(from: { latitude: number; longitude: number }, to: { latitude: number; longitude: number }, mode: TravelMode, routes: RouteData[]) { try { await AsyncStorage.setItem(keyFor(from, to, mode), JSON.stringify({ savedAt: Date.now(), routes })); } catch { /* cache is optional */ } }
