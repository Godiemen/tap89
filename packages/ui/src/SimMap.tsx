import React, { CSSProperties } from 'react';
import { colors } from '@sipdash/core';

export interface MapMarker {
  x: number;
  y: number;
  emoji?: string;
  color?: string;
  label?: string;
  pulsing?: boolean;
}

export interface SurgeZone {
  x: number;
  y: number;
  r: number;
  mult: number;
}

const ROADS_H = [18, 34, 50, 66, 84];
const ROADS_V = [16, 32, 50, 68, 86];
const BLOCKS: [number, number, number, number][] = [
  [4, 4, 9, 10], [20, 6, 8, 8], [36, 22, 10, 8], [56, 6, 8, 10],
  [72, 22, 10, 8], [20, 38, 8, 8], [4, 56, 8, 6], [56, 38, 8, 8],
  [72, 56, 10, 6], [36, 70, 10, 10], [56, 70, 8, 10], [88, 70, 8, 10],
  [4, 22, 8, 8], [4, 88, 10, 6], [72, 88, 10, 6], [20, 88, 8, 6],
];

export default function SimMap({
  markers = [],
  route,
  driver,
  surgeZones = [],
  height = 220,
  showRoads = true,
}: {
  markers?: MapMarker[];
  route?: { from: { x: number; y: number }; to: { x: number; y: number }; progress?: number };
  driver?: { x: number; y: number; heading?: number };
  surgeZones?: SurgeZone[];
  height?: number;
  showRoads?: boolean;
}) {
  const routePoints = route
    ? `${route.from.x},${route.from.y} ${(route.from.x + route.to.x) / 2 + 6},${(route.from.y + route.to.y) / 2 - 4} ${route.to.x},${route.to.y}`
    : '';

  return (
    <div style={{ height, borderRadius: 16, overflow: 'hidden', backgroundColor: colors.mapBg, position: 'relative', flexShrink: 0 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block' }}>
        <rect x={0} y={0} width={100} height={100} fill={colors.mapBg} />
        {BLOCKS.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} rx={1.5} fill={colors.mapBlock} />
        ))}
        {showRoads && (
          <>
            {ROADS_H.map((y) => (
              <line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke={colors.mapRoad} strokeWidth={2.4} />
            ))}
            {ROADS_V.map((x) => (
              <line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke={colors.mapRoad} strokeWidth={2.4} />
            ))}
          </>
        )}
        {surgeZones.map((z, i) => (
          <circle key={`s${i}`} cx={z.x} cy={z.y} r={z.r} fill="#F5A623" fillOpacity={0.22} stroke="#F5A623" strokeOpacity={0.5} strokeWidth={0.4} />
        ))}
        {route ? (
          <>
            <polyline points={routePoints} fill="none" stroke={colors.ink} strokeWidth={1.4} strokeDasharray="3,2" strokeLinecap="round" />
            {route.progress !== undefined ? (
              <polyline
                points={routePoints}
                fill="none"
                stroke={colors.accent}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeDasharray={`${route.progress * 200},400`}
              />
            ) : null}
          </>
        ) : null}
      </svg>

      {markers.map((m, i) => (
        <div key={i} style={{ ...pin, left: `${m.x}%`, top: `${m.y}%` }}>
          {m.emoji ? (
            <div style={{ ...emojiPin, ...(m.color ? { backgroundColor: m.color } : {}) }}>
              <span style={{ fontSize: 14 }}>{m.emoji}</span>
            </div>
          ) : (
            <div style={{ ...dot, backgroundColor: m.color ?? colors.blue }} />
          )}
          {m.label ? <div style={markerLabel}><span style={markerLabelText}>{m.label}</span></div> : null}
        </div>
      ))}

      {driver ? (
        <div style={{ ...pin, left: `${driver.x}%`, top: `${driver.y}%` }}>
          <div style={driverDot}>
            <span style={{ fontSize: 12 }}>🚗</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

const pin: CSSProperties = {
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  transform: 'translate(-50%, -50%)',
  transition: 'left 0.45s linear, top 0.45s linear',
};

const emojiPin: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: colors.card,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: `2px solid ${colors.ink}`,
  boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
};

const dot: CSSProperties = {
  width: 14,
  height: 14,
  borderRadius: 7,
  border: '2.5px solid #fff',
};

const driverDot: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 15,
  backgroundColor: colors.ink,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid #fff',
  boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
};

const markerLabel: CSSProperties = {
  marginTop: 2,
  backgroundColor: 'rgba(255,255,255,0.92)',
  padding: '1px 6px',
  borderRadius: 6,
  maxWidth: 110,
};

const markerLabelText: CSSProperties = {
  fontSize: 9,
  fontWeight: 700,
  color: colors.ink,
  whiteSpace: 'nowrap',
};
