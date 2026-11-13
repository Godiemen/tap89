'use client';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { DURBAN, LatLng, OsrmRoute, gridToLatLng } from '../lib/mock';
import type { SurgeZone } from '../lib/mock';
import { Crosshair } from 'lucide-react';

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/* ------------------------------ icons ------------------------------ */

const courierIcon = (heading: number | null) =>
  L.divIcon({
    className: 'sd-icon courier-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <span class="sd-pulse" aria-hidden="true"></span>
      ${
        heading !== null
          ? `<span class="sd-heading" style="transform: translate(-50%,-142%) rotate(${heading}deg)" aria-hidden="true"></span>`
          : ''
      }
      <span class="sd-dot" aria-hidden="true"></span>`,
  });

const pickupIcon = L.divIcon({
  className: 'sd-icon pin-marker',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  html: `<span class="sd-pin sd-pin-pickup" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b1526" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></span>`,
});

const dropoffIcon = L.divIcon({
  className: 'sd-icon pin-marker',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  html: `<span class="sd-pin sd-pin-dropoff" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/></svg></span>`,
});

const surgeLabelIcon = (mult: number) =>
  L.divIcon({
    className: 'sd-icon surge-label-marker',
    iconSize: [44, 22],
    iconAnchor: [22, 11],
    html: `<span class="sd-surge-pill">${mult.toFixed(1)}x</span>`,
  });

/* --------------------------- subcomponents ------------------------- */

/** Watches GPS, keeps map centered on the courier unless the user panned away. */
function LocationController({
  courierOverride,
  onPos,
}: {
  courierOverride?: LatLng;
  onPos: (p: LatLng, heading: number | null) => void;
}) {
  const map = useMap();
  const [panned, setPanned] = useState(false);
  const [gps, setGps] = useState<{ pos: LatLng; heading: number | null } | null>(null);
  const firstFix = useRef(false);
  const onPosRef = useRef(onPos);
  onPosRef.current = onPos;

  useMapEvents({
    dragstart: () => setPanned(true),
  });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGps({ pos: DURBAN, heading: null });
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (p) =>
        setGps({
          pos: { lat: p.coords.latitude, lng: p.coords.longitude },
          heading: p.coords.heading,
        }),
      () => setGps({ pos: DURBAN, heading: null }),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 8000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  const courier = courierOverride ?? gps?.pos ?? DURBAN;
  const heading = courierOverride ? null : (gps?.heading ?? null);

  useEffect(() => {
    onPosRef.current(courier, heading);
  }, [courier, heading]);

  useEffect(() => {
    if (!firstFix.current) {
      map.flyTo(courier, 15, { duration: 0.9 });
      firstFix.current = true;
      return;
    }
    if (!panned) {
      const c = map.getCenter();
      if (Math.abs(c.lng - courier.lng) > 0.0002 || Math.abs(c.lat - courier.lat) > 0.0002) {
        map.panTo(courier, { animate: false });
      }
    }
  }, [map, courier, panned]);

  return (
    <>
      <Marker position={courier} icon={courierIcon(heading)} interactive={false} />
      {panned && (
        <button
          aria-label="Recenter map on courier"
          onClick={() => {
            map.flyTo(courier, map.getZoom(), { duration: 0.6 });
            setPanned(false);
          }}
          className="absolute right-4 top-1/2 z-[650] grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-white text-ink shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition hover:bg-stone focus:outline-none focus:ring-2 focus:ring-grape"
          style={{ position: 'absolute' }}
        >
          <Crosshair size={19} />
        </button>
      )}
    </>
  );
}

/** Soft orange-to-yellow heat blobs (two blurred concentric circles + label pill). */
function SurgeZones({ zones }: { zones: SurgeZone[] }) {
  return (
    <>
      {zones.map((z) => {
        const c = gridToLatLng({ x: z.x, y: z.y });
        return (
          <span key={z.id}>
            <Circle
              center={c}
              radius={z.radiusM}
              pathOptions={{
                color: 'transparent',
                weight: 0,
                fillColor: '#ff7a29',
                fillOpacity: 0.32,
                className: 'surge-blob surge-blob-outer',
              }}
            />
            <Circle
              center={c}
              radius={z.radiusM * 0.55}
              pathOptions={{
                color: 'transparent',
                weight: 0,
                fillColor: '#ffd45c',
                fillOpacity: 0.35,
                className: 'surge-blob surge-blob-inner',
              }}
            />
            <Marker position={c} icon={surgeLabelIcon(z.mult)} interactive={false} />
          </span>
        );
      })}
    </>
  );
}

export interface DeliveryRoute {
  pickup: LatLng;
  dropoff: LatLng;
  leg: 'to_pickup' | 'to_dropoff';
}

function RouteLayer({ delivery, route }: { delivery: DeliveryRoute; route: OsrmRoute | null }) {
  const pts = useMemo(
    () => (route ? route.points.map((p) => [p.lat, p.lng] as [number, number]) : []),
    [route],
  );
  return (
    <>
      {pts.length > 0 && (
        <>
          {/* white outline underneath for depth */}
          <Polyline
            positions={pts}
            pathOptions={{ color: '#ffffff', weight: 9, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
          />
          <Polyline
            positions={pts}
            pathOptions={{ color: '#1a1325', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }}
          />
        </>
      )}
      <Marker position={delivery.pickup} icon={pickupIcon} />
      <Marker position={delivery.dropoff} icon={dropoffIcon} />
    </>
  );
}

/* ------------------------------- main ------------------------------ */

export interface LiveMapProps {
  courierOverride?: LatLng;
  surgeZones?: SurgeZone[];
  delivery?: DeliveryRoute | null;
  route?: OsrmRoute | null;
  dimmed?: boolean;
  onCourierPos?: (p: LatLng, heading: number | null) => void;
  className?: string;
}

export default function LiveMap({
  courierOverride,
  surgeZones = [],
  delivery = null,
  route = null,
  dimmed = false,
  onCourierPos,
  className,
}: LiveMapProps) {
  const handlePos = useMemo(() => (p: LatLng, h: number | null) => onCourierPos?.(p, h), [onCourierPos]);

  return (
    <div className={`relative isolate overflow-hidden ${className ?? ''}`}>
      <MapContainer
        center={DURBAN}
        zoom={14}
        zoomControl={false}
        attributionControl={false}
        className="absolute inset-0 z-0"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} maxZoom={19} />
        <LocationController courierOverride={courierOverride} onPos={handlePos} />
        {!dimmed && <SurgeZones zones={surgeZones} />}
        {!dimmed && delivery && <RouteLayer delivery={delivery} route={route} />}
      </MapContainer>

      {dimmed && (
        <div className="pointer-events-none absolute inset-0 z-[650] bg-white/45 backdrop-blur-[1px] transition-opacity" />
      )}

      <div className="pointer-events-none absolute bottom-2 left-3 z-[650] text-[10px] text-ink/50">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
