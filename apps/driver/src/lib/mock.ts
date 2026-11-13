/* ------------------------------------------------------------------ */
/* Geo primitives — real coordinates for the Durban delivery zone.      */
/* The engine works on a 0–100 grid; these helpers map it onto a real   */
/* bounding box so live state drives a real map.                        */
/* ------------------------------------------------------------------ */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Fallback courier position when GPS is denied/unavailable. */
export const DURBAN: LatLng = { lat: -29.8587, lng: 31.0218 };

/** Bounding box the 0–100 simulation grid maps onto (≈10 km × 10 km). */
const BBOX = {
  minLat: -29.905,
  maxLat: -29.815,
  minLng: 30.97,
  maxLng: 31.075,
};

export function gridToLatLng(p: { x: number; y: number }): LatLng {
  return {
    lat: BBOX.maxLat - (p.y / 100) * (BBOX.maxLat - BBOX.minLat),
    lng: BBOX.minLng + (p.x / 100) * (BBOX.maxLng - BBOX.minLng),
  };
}

export function latLngToGrid(p: LatLng): { x: number; y: number } {
  return {
    x: ((p.lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100,
    y: ((BBOX.maxLat - p.lat) / (BBOX.maxLat - BBOX.minLat)) * 100,
  };
}

/* ------------------------------------------------------------------ */
/* Surge zones — typed so they can come from the backend later.         */
/* ------------------------------------------------------------------ */

export interface SurgeZone {
  id: string;
  /** grid position (0–100) — converted to lat/lng at render time */
  x: number;
  y: number;
  /** radius in meters */
  radiusM: number;
  mult: number;
}

export const SURGE_ZONES: SurgeZone[] = [
  { id: 'sz1', x: 45, y: 55, radiusM: 1400, mult: 1.5 },
  { id: 'sz2', x: 78, y: 55, radiusM: 1000, mult: 1.3 },
];

/* ------------------------------------------------------------------ */
/* OSRM routing                                                        */
/* ------------------------------------------------------------------ */

export interface RouteLeg {
  distanceM: number;
  durationS: number;
}

export interface OsrmRoute {
  /** [lat, lng] polyline, in order */
  points: LatLng[];
  legs: RouteLeg[];
  totalDistanceM: number;
  totalDurationS: number;
}

interface OsrmJson {
  code?: string;
  routes?: {
    distance: number;
    duration: number;
    legs: { distance: number; duration: number }[];
    geometry: { coordinates: [number, number][] };
  }[];
}

/** Fetch a driving route through the given waypoints (in order). Fails silently → null. */
export async function fetchRoute(waypoints: LatLng[]): Promise<OsrmRoute | null> {
  if (waypoints.length < 2) return null;
  try {
    const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&overview=full&steps=false`,
    );
    const json = (await res.json()) as OsrmJson;
    const route = json.routes?.[0];
    if (!route) return null;
    return {
      points: route.geometry.coordinates.map(([lng, lat]) => ({ lat, lng })),
      legs: route.legs.map((l) => ({ distanceM: l.distance, durationS: l.duration })),
      totalDistanceM: route.distance,
      totalDurationS: route.duration,
    };
  } catch {
    return null;
  }
}

export function formatEta(seconds: number): string {
  const min = Math.max(1, Math.round(seconds / 60));
  return `${min} min`;
}

export function formatDist(meters: number): string {
  return `${(meters / 1000).toFixed(1)} km`;
}
