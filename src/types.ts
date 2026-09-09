export type SeverityLevel = 'high' | 'medium' | 'low';

export type HotspotCategory = 
  | 'active_fisura'       // Fisura activo / hostil
  | 'narcotics_consumption' // Consumo visible (paco/meth/crack)
  | 'encampment'          // Ranchada / Acampe en vereda
  | 'aggressive_begging'  // Pique / Mangueo violento
  | 'dark_street'         // Calle oscura / Sin luminaria
  | 'robbery_zone';       // Zona de arrebatos frecuentes

export interface Hotspot {
  id: string;
  title: string;
  barrio: string;
  crossStreets: string;
  lat: number;
  lng: number;
  severity: SeverityLevel;
  category: HotspotCategory;
  description: string;
  safetyTip: string;
  dangerRadiusMeters: number;
  reportedAt: string;
  confirmedCount: number;
  timeWindow: string; // e.g. "Nocturno (21:00 - 06:00)"
  isCommunityReported?: boolean;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RoutePoint {
  coordinates: Coordinates;
  name: string;
  address?: string;
}

export interface RouteOption {
  type: 'direct' | 'safe';
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  safetyScore: number; // 0 to 100
  hazardCount: number;
  hazardsEncountered: Hotspot[];
  highlights: string[];
  streets?: string[];
}

export interface RouteCalculationResult {
  directRoute: RouteOption;
  safeRoute: RouteOption;
  avoidedHotspots: Hotspot[];
}

export interface SafetyPreset {
  id: string;
  name: string;
  description: string;
  origin: RoutePoint;
  destination: RoutePoint;
  context: string;
}
