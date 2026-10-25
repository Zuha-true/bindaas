export type TravelMode = 'walk' | 'scooter' | 'drive';
export type PlaceKind = 'shop' | 'help' | 'transit';
export type PlaceStatus = 'open' | 'closing_soon' | 'closed' | 'unknown';

export type Point = { latitude: number; longitude: number };
export type RouteStep = { distanceM: number; roadClass?: string; turnWeight?: number };
export type RoutePlace = { id: string; name: string; kind: PlaceKind; subtype?: string; position: Point; openingHours?: string; status?: PlaceStatus };
export type RouteData = { id: string; name: string; coordinates: Point[]; distanceM: number; durationMin: number; steps: RouteStep[]; places: RoutePlace[]; isDetour?: boolean };
export type RouteComponent = { key: string; label: string; earned: number; max: number; hint: string; available: boolean };
export type RouteAnalysis = RouteData & { score: number; components: RouteComponent[]; longestQuietM: number; longestHelpGapM: number; inactiveShare: number; knownHoursShare: number; confidence: 'high' | 'medium' | 'low'; openCount: number; extraMinutes: number; relativeConcern?: number; concernConfidence?: 'high' | 'medium' | 'low'; concernReasons?: string[]; concernUnknowns?: string[] };
