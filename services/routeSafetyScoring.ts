import type { RouteAnalysis } from '../types/route.ts';

export type SafetyFactor = { key: string; label: string; weight: number; value?: number; contribution?: number; status: 'available' | 'unknown'; explanation: string };
export type SafetyScore = { routeId: string; concern: number; confidence: 'high' | 'medium' | 'low'; factors: SafetyFactor[]; reasons: string[]; unknowns: string[] };

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const normalize = (value: number, values: number[]) => { const min = Math.min(...values); const max = Math.max(...values); return max === min ? .5 : clamp((value - min) / (max - min)); };

export function scoreRouteCandidates(routes: RouteAnalysis[]): SafetyScore[] {
  if (!routes.length) return [];
  const durations = routes.map(route => route.durationMin); const distances = routes.map(route => route.distanceM); const turns = routes.map(route => route.steps.reduce((sum, step) => sum + (step.turnWeight || 0), 0));
  return routes.map(route => {
    const turnCount = route.steps.reduce((sum, step) => sum + (step.turnWeight || 0), 0); const knownVenues = route.places.filter(place => place.openingHours && (place.status === 'open' || place.status === 'closing_soon')).length; const help = route.places.filter(place => place.kind === 'help' && place.openingHours).length; const hasRoadData = route.steps.some(step => Boolean(step.roadClass));
    const factors: SafetyFactor[] = [
      { key: 'time', label: 'Travel time and distance', weight: 20, value: (normalize(route.durationMin, durations) + normalize(route.distanceM, distances)) / 2, status: 'available', explanation: `${route.durationMin} min and ${(route.distanceM / 1000).toFixed(1)} km relative to these options.` },
      { key: 'turns', label: 'Turns and complexity', weight: 15, value: normalize(turnCount, turns), status: 'available', explanation: `${Math.round(turnCount)} weighted turns from route instructions; this is only a weak complexity proxy.` },
      { key: 'venues', label: 'Listed venues with known hours', weight: 25, value: route.places.length ? 1 - clamp(knownVenues / Math.max(route.distanceM / 1000, 1) / 5) : undefined, status: route.places.length ? 'available' : 'unknown', explanation: route.places.length ? `${knownVenues} nearby venues have readable hours.` : 'No nearby venue data was returned.' },
      { key: 'help', label: 'Listed help resources', weight: 20, value: route.places.some(place => place.kind === 'help') ? 1 - clamp(help / 4) : undefined, status: route.places.some(place => place.kind === 'help') ? 'available' : 'unknown', explanation: route.places.some(place => place.kind === 'help') ? `${help} help resources have readable hours.` : 'No help-resource data was returned.' },
      { key: 'road', label: 'Route road attributes', weight: 20, value: hasRoadData ? 0.5 : undefined, status: hasRoadData ? 'available' : 'unknown', explanation: hasRoadData ? 'Road-class attributes are available; lighting and activity are not inferred.' : 'Road attributes were not returned.' },
    ];
    const available = factors.filter(factor => factor.status === 'available' && factor.value !== undefined); const concern = Math.round(available.reduce((sum, factor) => sum + (factor.value || 0) * factor.weight, 0) / Math.max(1, available.reduce((sum, factor) => sum + factor.weight, 0)) * 100); const unknowns = factors.filter(factor => factor.status === 'unknown').map(factor => factor.label); const reasons = factors.filter(factor => factor.status === 'available').sort((a, b) => (b.contribution || b.value || 0) - (a.contribution || a.value || 0)).slice(0, 2).map(factor => `${factor.label}: ${factor.explanation}`); const confidence = available.length >= 5 ? 'high' : available.length >= 3 ? 'medium' : 'low';
    return { routeId: route.id, concern, confidence, factors, reasons, unknowns };
  });
}

export function applySafetyScores(routes: RouteAnalysis[]) { const scores = scoreRouteCandidates(routes); return routes.map(route => { const score = scores.find(item => item.routeId === route.id); return score ? { ...route, relativeConcern: score.concern, concernConfidence: score.confidence, concernReasons: score.reasons, concernUnknowns: score.unknowns } : route; }).sort((a, b) => (a.relativeConcern ?? 50) - (b.relativeConcern ?? 50) || a.durationMin - b.durationMin); }
