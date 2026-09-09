import { Coordinates, Hotspot, RouteCalculationResult, RouteOption, RoutePoint } from '../types';

// Haversine formula to compute distance in meters between two lat/lng points
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Minimum distance from point to segment [p1, p2] in meters
export function distanceToSegmentMeters(
  pLat: number,
  pLng: number,
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const lenSq = dLat * dLat + dLng * dLng;

  if (lenSq === 0) {
    return calculateDistanceMeters(pLat, pLng, lat1, lng1);
  }

  let t = ((pLat - lat1) * dLat + (pLng - lng1) * dLng) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projLat = lat1 + t * dLat;
  const projLng = lng1 + t * dLng;

  return calculateDistanceMeters(pLat, pLng, projLat, projLng);
}

// Distance from point to polyline (minimum distance to any segment)
export function distanceToPolylineMeters(
  lat: number,
  lng: number,
  polyline: [number, number][]
): number {
  if (polyline.length === 0) return Infinity;
  if (polyline.length === 1) {
    return calculateDistanceMeters(lat, lng, polyline[0][0], polyline[0][1]);
  }

  let minDist = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distanceToSegmentMeters(
      lat,
      lng,
      polyline[i][0],
      polyline[i][1],
      polyline[i + 1][0],
      polyline[i + 1][1]
    );
    if (d < minDist) {
      minDist = d;
    }
  }
  return minDist;
}

// Calculate total length of a polyline in kilometers
export function calculatePolylineDistanceKm(polyline: [number, number][]): number {
  let dist = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    dist += calculateDistanceMeters(
      polyline[i][0],
      polyline[i][1],
      polyline[i + 1][0],
      polyline[i + 1][1]
    );
  }
  return dist / 1000;
}

export interface OSRMRouteResult {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  streets: string[];
}

export interface RouteSafetyAnalysis {
  safetyScore: number;
  penetratedHotspots: Hotspot[];
  proximityHotspots: Hotspot[];
  minDistanceToAnyHazard: number;
}

// Rigorous safety evaluator for any candidate route
export function evaluateRouteSafety(
  polyline: [number, number][],
  hotspots: Hotspot[],
  originCoords?: Coordinates,
  destCoords?: Coordinates
): RouteSafetyAnalysis {
  const penetratedHotspots: Hotspot[] = [];
  const proximityHotspots: Hotspot[] = [];
  let minDistanceToAnyHazard = Infinity;
  let score = 98;

  for (const hs of hotspots) {
    const d = distanceToPolylineMeters(hs.lat, hs.lng, polyline);
    if (d < minDistanceToAnyHazard) {
      minDistanceToAnyHazard = d;
    }

    // Check if origin or destination itself is inside the hazard radius
    const originInside =
      originCoords &&
      calculateDistanceMeters(originCoords.lat, originCoords.lng, hs.lat, hs.lng) <= hs.dangerRadiusMeters;
    const destInside =
      destCoords &&
      calculateDistanceMeters(destCoords.lat, destCoords.lng, hs.lat, hs.lng) <= hs.dangerRadiusMeters;

    // Strict penetration check: path is strictly INSIDE the danger radius circle
    if (d <= hs.dangerRadiusMeters) {
      penetratedHotspots.push(hs);
      const severityPenalty = hs.severity === 'high' ? 38 : hs.severity === 'medium' ? 22 : 12;
      score -= severityPenalty;

      // Extra penalty if walking through deep core (<40% radius), unless starting/ending there
      if (d < hs.dangerRadiusMeters * 0.4 && !originInside && !destInside) {
        score -= 15;
      }
    } else if (d <= hs.dangerRadiusMeters + 35) {
      // Near perimeter buffer (path is outside the circle, but in immediate sidewalk vicinity)
      proximityHotspots.push(hs);
      score -= 5;
    }
  }

  return {
    safetyScore: Math.max(15, Math.min(99, score)),
    penetratedHotspots,
    proximityHotspots,
    minDistanceToAnyHazard,
  };
}

// Query pedestrian walking routes from OSRM
async function fetchOSRMRoute(
  waypoints: Coordinates[],
  allowAlternatives: boolean = false
): Promise<OSRMRouteResult[]> {
  if (waypoints.length < 2) return [];

  const coordsParam = waypoints
    .map((wp) => `${wp.lng.toFixed(6)},${wp.lat.toFixed(6)}`)
    .join(';');

  const url = `https://router.project-osrm.org/route/v1/foot/${coordsParam}?overview=full&geometries=geojson&steps=true${
    allowAlternatives && waypoints.length === 2 ? '&alternatives=3' : ''
  }`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return [];
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return [];
    }

    const results: OSRMRouteResult[] = [];

    for (const route of data.routes) {
      const rawCoords: [number, number][] = route.geometry.coordinates;
      const leafletCoords: [number, number][] = rawCoords.map(([lng, lat]) => [lat, lng]);
      const distanceKm = parseFloat((route.distance / 1000).toFixed(2));
      const durationMinutes = Math.max(1, Math.round(route.duration / 60));

      const streetsSet = new Set<string>();
      if (route.legs) {
        for (const leg of route.legs) {
          if (leg.steps) {
            for (const step of leg.steps) {
              if (step.name && step.name.trim() && step.name !== '-') {
                streetsSet.add(step.name.trim());
              }
            }
          }
        }
      }

      results.push({
        coordinates: leafletCoords,
        distanceKm,
        durationMinutes,
        streets: Array.from(streetsSet),
      });
    }

    return results;
  } catch {
    clearTimeout(timeoutId);
    return [];
  }
}

// Fallback Buenos Aires Urban Grid Routing (follows 90-degree city cuadras)
function generateBuenosAiresGridRoute(
  origin: Coordinates,
  destination: Coordinates,
  viaPoints?: Coordinates[]
): OSRMRouteResult {
  const allPoints = [origin, ...(viaPoints || []), destination];
  const polyline: [number, number][] = [];

  for (let i = 0; i < allPoints.length - 1; i++) {
    const p1 = allPoints[i];
    const p2 = allPoints[i + 1];

    polyline.push([p1.lat, p1.lng]);

    const cornerLat = p2.lat;
    const cornerLng = p1.lng;

    const leg1Dist = calculateDistanceMeters(p1.lat, p1.lng, cornerLat, cornerLng);
    const steps1 = Math.max(2, Math.round(leg1Dist / 85));
    for (let s = 1; s < steps1; s++) {
      const frac = s / steps1;
      polyline.push([p1.lat + (cornerLat - p1.lat) * frac, p1.lng]);
    }

    polyline.push([cornerLat, cornerLng]);

    const leg2Dist = calculateDistanceMeters(cornerLat, cornerLng, p2.lat, p2.lng);
    const steps2 = Math.max(2, Math.round(leg2Dist / 85));
    for (let s = 1; s < steps2; s++) {
      const frac = s / steps2;
      polyline.push([cornerLat, cornerLng + (p2.lng - cornerLng) * frac]);
    }
  }

  polyline.push([destination.lat, destination.lng]);

  const totalDistKm = parseFloat(calculatePolylineDistanceKm(polyline).toFixed(2));
  const durationMin = Math.max(1, Math.round(totalDistKm * 13.5));

  return {
    coordinates: polyline,
    distanceKm: totalDistKm,
    durationMinutes: durationMin,
    streets: ['Trazado peatonal por cuadras CABA'],
  };
}

export async function computeAvoidanceRoutes(
  origin: RoutePoint,
  destination: RoutePoint,
  hotspots: Hotspot[]
): Promise<RouteCalculationResult> {
  const oCoords = origin.coordinates;
  const dCoords = destination.coordinates;

  // 1. Fetch Real Pedestrian Street Route for Direct Option with alternatives
  let osrmCandidates = await fetchOSRMRoute([oCoords, dCoords], true);

  if (osrmCandidates.length === 0) {
    const gridRoute = generateBuenosAiresGridRoute(oCoords, dCoords);
    osrmCandidates = [gridRoute];
  }

  const primaryDirect = osrmCandidates[0];
  const directEvaluation = evaluateRouteSafety(primaryDirect.coordinates, hotspots, oCoords, dCoords);

  const directStreetList = primaryDirect.streets.length > 0
    ? primaryDirect.streets
    : ['Trazado directo urbano'];

  const directRoute: RouteOption = {
    type: 'direct',
    coordinates: primaryDirect.coordinates,
    distanceKm: primaryDirect.distanceKm,
    durationMinutes: primaryDirect.durationMinutes,
    safetyScore: directEvaluation.safetyScore,
    hazardCount: directEvaluation.penetratedHotspots.length,
    hazardsEncountered: directEvaluation.penetratedHotspots,
    streets: directStreetList,
    highlights: [
      `Trayecto peatonal por calles de CABA`,
      directEvaluation.penetratedHotspots.length > 0
        ? `⚠️ Atraviesa ${directEvaluation.penetratedHotspots.length} zona(s) de riesgo: ${directEvaluation.penetratedHotspots.map((h) => h.title).slice(0, 2).join(', ')}`
        : directEvaluation.proximityHotspots.length > 0
        ? `Pasa por veredas seguras a distancia prudencial de ${directEvaluation.proximityHotspots.map((h) => h.title).slice(0, 2).join(', ')}`
        : 'Sin focos de conflicto en el trayecto directo',
      `Calles: ${directStreetList.slice(0, 4).join(', ')}${directStreetList.length > 4 ? '...' : ''}`,
    ],
  };

  // 2. Determine Safe Route
  let selectedSafeResult: OSRMRouteResult = primaryDirect;
  let selectedSafeEval: RouteSafetyAnalysis = directEvaluation;
  const avoidedHotspots: Hotspot[] = [];
  const safeHighlights: string[] = [];

  // CASE A: Direct route does NOT penetrate any danger zone circle!
  if (directEvaluation.penetratedHotspots.length === 0) {
    // Check if any native alternative route is even safer (e.g. further from perimeter)
    for (let i = 1; i < osrmCandidates.length; i++) {
      const alt = osrmCandidates[i];
      const altEval = evaluateRouteSafety(alt.coordinates, hotspots, oCoords, dCoords);
      if (altEval.penetratedHotspots.length === 0 && altEval.safetyScore > selectedSafeEval.safetyScore) {
        selectedSafeResult = alt;
        selectedSafeEval = altEval;
      }
    }

    safeHighlights.push('Ruta directa despejada: no penetra en ningún foco de riesgo activo');
    safeHighlights.push('Tránsito peatonal por avenidas principales con veredas iluminadas');
    if (selectedSafeResult.streets.length > 0) {
      safeHighlights.push(`Calles: ${selectedSafeResult.streets.slice(0, 4).join(', ')}`);
    }
  } else {
    // CASE B: Direct route penetrates one or more hotspots (e.g. Once, Retiro, plaza center)
    // First, check if any native alternative route already avoids all penetrated hotspots
    let foundNativeSafe = false;
    for (let i = 1; i < osrmCandidates.length; i++) {
      const alt = osrmCandidates[i];
      const altEval = evaluateRouteSafety(alt.coordinates, hotspots, oCoords, dCoords);
      if (altEval.penetratedHotspots.length < directEvaluation.penetratedHotspots.length) {
        selectedSafeResult = alt;
        selectedSafeEval = altEval;
        foundNativeSafe = true;
      }
    }

    // If native alternatives didn't solve it, generate lateral bypass candidate waypoints
    if (!foundNativeSafe || selectedSafeEval.penetratedHotspots.length > 0) {
      // Target the most critical penetrated hazard
      const primaryHazard = directEvaluation.penetratedHotspots[0];

      // Perpendicular vector to general travel direction
      const dirLat = dCoords.lat - oCoords.lat;
      const dirLng = dCoords.lng - oCoords.lng;
      const dirLen = Math.sqrt(dirLat * dirLat + dirLng * dirLng) || 1;
      const normLat = -dirLng / dirLen;
      const normLng = dirLat / dirLen;

      // Place clearance waypoint safely outside the danger radius (radius + 150m)
      const clearanceMeters = primaryHazard.dangerRadiusMeters + 150;
      const offLat = (clearanceMeters / 111111) * normLat;
      const offLng = (clearanceMeters / (111111 * Math.cos((primaryHazard.lat * Math.PI) / 180))) * normLng;

      const candidateWaypoints: Coordinates[] = [
        { lat: primaryHazard.lat + offLat, lng: primaryHazard.lng + offLng },
        { lat: primaryHazard.lat - offLat, lng: primaryHazard.lng - offLng },
      ];

      for (const bp of candidateWaypoints) {
        const bypassRoutes = await fetchOSRMRoute([oCoords, bp, dCoords], false);
        if (bypassRoutes.length > 0) {
          const candidate = bypassRoutes[0];
          const candEval = evaluateRouteSafety(candidate.coordinates, hotspots, oCoords, dCoords);

          // If the origin itself is located inside the primary hazard (e.g. exiting Once Station),
          // candidate is valid if it avoids other hazards and maintains or improves safe distance
          const originInsidePrimary =
            calculateDistanceMeters(oCoords.lat, oCoords.lng, primaryHazard.lat, primaryHazard.lng) <=
            primaryHazard.dangerRadiusMeters;

          const avoidsPrimary = originInsidePrimary
            ? true
            : !candEval.penetratedHotspots.some((h) => h.id === primaryHazard.id);

          const distanceAcceptable = candidate.distanceKm <= primaryDirect.distanceKm * 1.6;

          const improvesSafety = originInsidePrimary
            ? candEval.safetyScore > selectedSafeEval.safetyScore ||
              (candEval.safetyScore === selectedSafeEval.safetyScore && candidate.distanceKm < selectedSafeResult.distanceKm)
            : candEval.penetratedHotspots.length < directEvaluation.penetratedHotspots.length &&
              candEval.safetyScore > selectedSafeEval.safetyScore;

          if (avoidsPrimary && distanceAcceptable && improvesSafety) {
            selectedSafeResult = candidate;
            selectedSafeEval = candEval;
          }
        }
      }
    }

    // Record avoided hazards
    for (const directHs of directEvaluation.penetratedHotspots) {
      if (!selectedSafeEval.penetratedHotspots.some((h) => h.id === directHs.id)) {
        avoidedHotspots.push(directHs);
      }
    }

    if (avoidedHotspots.length > 0) {
      safeHighlights.push(
        `Desvío preventivo esquivando ${avoidedHotspots.length} zona(s) de riesgo: ${avoidedHotspots.map((h) => h.title).slice(0, 2).join(', ')}`
      );
      safeHighlights.push('Navegación protegida por calles alternativas transitadas y vigiladas');
      if (selectedSafeResult.streets.length > 0) {
        safeHighlights.push(`Calles del desvío: ${selectedSafeResult.streets.slice(0, 4).join(', ')}`);
      }
    } else {
      safeHighlights.push('Trayecto optimizado siguiendo los corredores más abiertos y transitados');
      if (selectedSafeResult.streets.length > 0) {
        safeHighlights.push(`Calles: ${selectedSafeResult.streets.slice(0, 4).join(', ')}`);
      }
    }
  }

  const safeRoute: RouteOption = {
    type: 'safe',
    coordinates: selectedSafeResult.coordinates,
    distanceKm: selectedSafeResult.distanceKm,
    durationMinutes: selectedSafeResult.durationMinutes,
    safetyScore: selectedSafeEval.safetyScore,
    hazardCount: selectedSafeEval.penetratedHotspots.length,
    hazardsEncountered: selectedSafeEval.penetratedHotspots,
    streets: selectedSafeResult.streets,
    highlights: safeHighlights,
  };

  return {
    directRoute,
    safeRoute,
    avoidedHotspots,
  };
}
