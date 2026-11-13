'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import { gridToLatLng, fetchRoute, type LatLng, type OsrmRoute } from '@sipdash/core';
import type { MapMarker } from './SimMap';

/*
 * LiveMap — real OpenStreetMap tiles through Leaflet.
 * Markers/route/driver accept `latLng` (real) OR x/y (0–100 sim grid, projected
 * onto the Durban bbox). Real coords win wherever present. When both route
 * endpoints are real, the line follows actual roads via OSRM.
 */

const DURBAN: [number, number] = [-29.8587, 31.0218];

export interface GeoPoint {
  x?: number;
  y?: number;
  latLng?: LatLng;
}

const resolve = (p: GeoPoint): [number, number] =>
  p.latLng ? [p.latLng.lat, p.latLng.lng] : p.x !== undefined && p.y !== undefined ? (() => {
    const g = gridToLatLng({ x: p.x, y: p.y });
    return [g.lat, g.lng];
  })() : DURBAN;

export interface LiveMapMarker extends MapMarker {
  latLng?: LatLng;
}

const emojiIcon = (emoji: string, dark = false) =>
  L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;border-radius:16px;background:${dark ? '#1b1526' : '#fff'};border:2px solid ${dark ? '#fff' : '#1b1526'};display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 2px 6px rgba(0,0,0,.3)">${emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const dotIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;border-radius:8px;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  const key = points.map((p) => p.join(',')).join('|');
  const fitted = useRef(false);
  React.useEffect(() => {
    // refit only when the set of endpoints meaningfully changes, not every driver tick
    if (!fitted.current && points.length > 1) {
      fitted.current = true;
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return null;
}

export default function LiveMap({
  markers = [],
  route,
  driver,
  height = 220,
  onRouteInfo,
}: {
  markers?: LiveMapMarker[];
  route?: { from: GeoPoint; to: GeoPoint; progress?: number };
  driver?: GeoPoint & { heading?: number };
  height?: number;
  /** road route stats (real km / seconds) once OSRM answers — null on failure */
  onRouteInfo?: (r: { distanceM: number; durationS: number } | null) => void;
}) {
  const [osrm, setOsrm] = useState<OsrmRoute | null>(null);
  const onRouteInfoRef = useRef(onRouteInfo);
  onRouteInfoRef.current = onRouteInfo;

  const fromLL = route ? resolve(route.from) : null;
  const toLL = route ? resolve(route.to) : null;
  const bothReal = !!(route?.from.latLng && route?.to.latLng);

  /* fetch the road route once per endpoint pair — not on every GPS tick */
  const routeKey = fromLL && toLL ? `${fromLL.join(',')}->${toLL.join(',')}` : '';
  useEffect(() => {
    if (!bothReal || !route?.from.latLng || !route?.to.latLng) {
      setOsrm(null);
      onRouteInfoRef.current?.(null);
      return;
    }
    let alive = true;
    fetchRoute([route.from.latLng, route.to.latLng]).then((r) => {
      if (!alive) return;
      setOsrm(r);
      onRouteInfoRef.current?.(r ? { distanceM: r.totalDistanceM, durationS: r.totalDurationS } : null);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey, bothReal]);

  const line: [number, number][] = useMemo(() => {
    if (osrm) return osrm.points.map((p) => [p.lat, p.lng]);
    return fromLL && toLL ? [fromLL, toLL] : [];
  }, [osrm, fromLL, toLL]);

  // progress leg = fraction along the fetched polyline (or straight line)
  const progressLine = useMemo(() => {
    if (route?.progress === undefined || line.length < 2) return null;
    const t = Math.min(1, Math.max(0, route.progress));
    const upto = Math.max(2, Math.ceil(line.length * t));
    return line.slice(0, upto);
  }, [line, route?.progress]);

  const allPts = useMemo(
    () => [
      ...markers.map((m) => resolve(m)),
      ...(fromLL && toLL ? [fromLL, toLL] : []),
      ...(driver ? [resolve(driver)] : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(markers), routeKey, driver?.latLng?.lat, driver?.latLng?.lng, driver?.x, driver?.y],
  );

  return (
    <div style={{ height, overflow: 'hidden', flexShrink: 0 }}>
      <MapContainer
        center={allPts[0] ?? DURBAN}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={allPts} />
        {line.length > 1 && (
          <>
            <Polyline positions={line} pathOptions={{ color: '#1b1526', weight: 4, opacity: bothReal ? 0.85 : 0.6, dashArray: bothReal ? undefined : '6 8' }} />
            {progressLine && (
              <Polyline positions={progressLine} pathOptions={{ color: '#6b3fa0', weight: 5, opacity: 0.95 }} />
            )}
          </>
        )}
        {markers.map((m, i) => (
          <Marker
            key={i}
            position={resolve(m)}
            icon={m.emoji ? emojiIcon(m.emoji) : dotIcon(m.color ?? '#3b82f6')}
            title={m.label}
          />
        ))}
        {driver && <Marker position={resolve(driver)} icon={emojiIcon('🛵', true)} title="Courier" />}
      </MapContainer>
    </div>
  );
}
