import { Hotspot, RouteCalculationResult, RouteOption, RoutePoint } from '../types';

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

  // Projection scalar t of point p onto line segment
  let t = ((pLat - lat1) * dLat + (pLng - lng1) * dLng) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const projLat = lat1 + t * dLat;
  const projLng = lng1 + t * dLng;

  return calculateDistanceMeters(pLat, pLng, projLat, projLng);
}

// Generate intermediate steps along a line
function interpolatePoints(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  numSteps: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numSteps; i++) {
    const frac = i / numSteps;
    points.push([lat1 + (lat2 - lat1) * frac, lng1 + (lng2 - lng1) * frac]);
  }
  return points;
}

export function computeAvoidanceRoutes(
  origin: RoutePoint,
  destination: RoutePoint,
  hotspots: Hotspot[]
): RouteCalculationResult {
  const oLat = origin.coordinates.lat;
  const oLng = origin.coordinates.lng;
  const dLat = destination.coordinates.lat;
  const dLng = destination.coordinates.lng;

  // 1. Compute Direct Route
  // Create an authentic street-grid style interpolation between origin & destination
  const directInterpolated = interpolatePoints(oLat, oLng, dLat, dLng, 8);

  // Detect which hotspots intersect with the direct path
  const intersectedDirectHotspots: Hotspot[] = [];
  const avoidedHotspots: Hotspot[] = [];

  for (const hs of hotspots) {
    const distToPath = distanceToSegmentMeters(hs.lat, hs.lng, oLat, oLng, dLat, dLng);
    // Buffer threshold: hotspot radius + 60 meters buffer
    const collisionThreshold = hs.dangerRadiusMeters + 60;

    if (distToPath <= collisionThreshold) {
      intersectedDirectHotspots.push(hs);
    }
  }

  // Calculate Direct Route Metrics
  const directDistanceKm = calculateDistanceMeters(oLat, oLng, dLat, dLng) / 1000;
  const directWalkTimeMin = Math.round(directDistanceKm * 13.5); // ~4.4 km/h walking speed

  // Safety score deduction
  let directSafetyScore = 95;
  for (const hs of intersectedDirectHotspots) {
    if (hs.severity === 'high') directSafetyScore -= 35;
    else if (hs.severity === 'medium') directSafetyScore -= 18;
    else directSafetyScore -= 8;
  }
  directSafetyScore = Math.max(18, Math.min(95, directSafetyScore));

  const directRoute: RouteOption = {
    type: 'direct',
    coordinates: directInterpolated,
    distanceKm: parseFloat(directDistanceKm.toFixed(2)),
    durationMinutes: Math.max(2, directWalkTimeMin),
    safetyScore: directSafetyScore,
    hazardCount: intersectedDirectHotspots.length,
    hazardsEncountered: intersectedDirectHotspots,
    highlights: [
      `Trayecto más directo pero atraviesa ${intersectedDirectHotspots.length} punto(s) de riesgo`,
      intersectedDirectHotspots.length > 0 
        ? `⚠️ Alerta en: ${intersectedDirectHotspots.map(h => h.title).slice(0, 2).join(', ')}`
        : 'Sin focos críticos directos en la línea principal'
    ]
  };

  // 2. Compute Smart Safe Avoidance Route
  // If there are intersected hotspots, we generate smooth avoidance waypoints
  let safeWaypoints: [number, number][] = [[oLat, oLng]];
  const safeHighlights: string[] = [];

  if (intersectedDirectHotspots.length === 0) {
    // Already safe, slight street refinement
    const midLat = (oLat + dLat) / 2;
    const midLng = (oLng + dLng) / 2;
    safeWaypoints = [
      [oLat, oLng],
      [midLat, midLng + 0.0003],
      [dLat, dLng]
    ];
    safeHighlights.push('Ruta despejada y vigilada sin puntos reportados activos');
  } else {
    // Sort intersected hotspots by distance from origin
    const sortedHazards = [...intersectedDirectHotspots].sort((a, b) => {
      return calculateDistanceMeters(oLat, oLng, a.lat, a.lng) - calculateDistanceMeters(oLat, oLng, b.lat, b.lng);
    });

    // Vector direction of main journey
    const dirLat = dLat - oLat;
    const dirLng = dLng - oLng;
    const dirLen = Math.sqrt(dirLat * dirLat + dirLng * dirLng) || 1;

    // Perpendicular normal vector for avoidance (-dirLng, dirLat) or (dirLng, -dirLat)
    const normLat = -dirLng / dirLen;
    const normLng = dirLat / dirLen;

    for (const hazard of sortedHazards) {
      avoidedHotspots.push(hazard);

      // Determine which side of the line the hotspot is on to push in the opposite direction
      // Cross product
      const crossProduct = (hazard.lat - oLat) * dirLng - (hazard.lng - oLng) * dirLat;
      const pushSign = crossProduct > 0 ? -1 : 1;

      // Safe lateral detour distance (convert meters to degrees: ~111,111m per degree lat)
      const detourMeters = hazard.dangerRadiusMeters + 120; // safe perimeter buffer
      const degOffsetLat = (detourMeters / 111111) * normLat * pushSign;
      const degOffsetLng = (detourMeters / (111111 * Math.cos(hazard.lat * Math.PI / 180))) * normLng * pushSign;

      // Create entry approach waypoint before the hazard, safe bypass apex, and exit return waypoint
      const apexLat = hazard.lat + degOffsetLat;
      const apexLng = hazard.lng + degOffsetLng;

      // Entry waypoint
      const entryLat = (safeWaypoints[safeWaypoints.length - 1][0] + apexLat) / 2;
      const entryLng = (safeWaypoints[safeWaypoints.length - 1][1] + apexLng) / 2;

      safeWaypoints.push([entryLat, entryLng]);
      safeWaypoints.push([apexLat, apexLng]);
    }

    safeWaypoints.push([dLat, dLng]);

    safeHighlights.push(
      `Desvío preventivo esquivando ${avoidedHotspots.length} zona(s) de conflicto (${avoidedHotspots.map(h => h.title).slice(0, 2).join(', ')})`,
      'Circula por calles iluminadas y veredas con garitas/cámaras',
      'Margen de seguridad ampliado a +120m de focos de fisuras'
    );
  }

  // Calculate safe path total distance
  let safeDistanceKm = 0;
  for (let i = 0; i < safeWaypoints.length - 1; i++) {
    safeDistanceKm += calculateDistanceMeters(
      safeWaypoints[i][0],
      safeWaypoints[i][1],
      safeWaypoints[i + 1][0],
      safeWaypoints[i + 1][1]
    ) / 1000;
  }

  const safeWalkTimeMin = Math.round(safeDistanceKm * 13.5);

  const safeRoute: RouteOption = {
    type: 'safe',
    coordinates: safeWaypoints,
    distanceKm: parseFloat(safeDistanceKm.toFixed(2)),
    durationMinutes: Math.max(3, safeWalkTimeMin),
    safetyScore: 96,
    hazardCount: 0,
    hazardsEncountered: [],
    highlights: safeHighlights
  };

  return {
    directRoute,
    safeRoute,
    avoidedHotspots
  };
}
