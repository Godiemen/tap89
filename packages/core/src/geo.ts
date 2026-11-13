/* Real-world geolocation helpers.
 * The app still carries the 0–100 sim grid (pos_x/pos_y); these helpers bridge
 * it to real coordinates so the same rows drive a real map. Real lat/lng always
 * wins when present — the grid only renders when a row was created before
 * geocoding existed.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

/** Durban delivery zone — the 0–100 sim grid maps onto this ~10km box. */
export const BBOX = {
  minLat: -29.905,
  maxLat: -29.815,
  minLng: 30.97,
  maxLng: 31.075,
};

export const gridToLatLng = (p: { x: number; y: number }): LatLng => ({
  lat: BBOX.maxLat - (p.y / 100) * (BBOX.maxLat - BBOX.minLat),
  lng: BBOX.minLng + (p.x / 100) * (BBOX.maxLng - BBOX.minLng),
});

export const latLngToGrid = (p: LatLng): { x: number; y: number } => ({
  x: ((p.lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100,
  y: ((BBOX.maxLat - p.lat) / (BBOX.maxLat - BBOX.minLat)) * 100,
});

/** Great-circle distance in km. */
export const haversineKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

/** Free-text SA address → coordinates via OSM Nominatim. null on any failure. */
export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=za&limit=1&q=${encodeURIComponent(q)}`,
    );
    const hits = (await res.json()) as { lat: string; lon: string }[];
    const hit = hits?.[0];
    if (!hit) return null;
    return { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
  } catch {
    return null;
  }
}

/* OSRM road routing — same public demo service the driver app already uses.
 * Fine for prototype scale; self-host or a paid tile/routing plan for prod. */
export interface RouteLeg {
  distanceM: number;
  durationS: number;
}
export interface OsrmRoute {
  points: LatLng[]; // [lat,lng] polyline, in order
  legs: RouteLeg[];
  totalDistanceM: number;
  totalDurationS: number;
}

export async function fetchRoute(waypoints: LatLng[]): Promise<OsrmRoute | null> {
  if (waypoints.length < 2) return null;
  try {
    const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(';');
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&overview=full&steps=false`,
    );
    const json = (await res.json()) as {
      routes?: {
        distance: number;
        duration: number;
        legs: { distance: number; duration: number }[];
        geometry: { coordinates: [number, number][] };
      }[];
    };
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
