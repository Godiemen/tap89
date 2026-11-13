import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect } from 'react-native-svg';
import { colors } from '../theme';

export interface MapMarker {
  x: number; // 0-100 map coords
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
    <View style={[styles.wrap, { height }]}>
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Rect x={0} y={0} width={100} height={100} fill={colors.mapBg} />
        {BLOCKS.map(([x, y, w, h], i) => (
          <Rect key={i} x={x} y={y} width={w} height={h} rx={1.5} fill={colors.mapBlock} />
        ))}
        {showRoads && (
          <>
            {ROADS_H.map((y) => (
              <Line key={`h${y}`} x1={0} y1={y} x2={100} y2={y} stroke={colors.mapRoad} strokeWidth={2.4} />
            ))}
            {ROADS_V.map((x) => (
              <Line key={`v${x}`} x1={x} y1={0} x2={x} y2={100} stroke={colors.mapRoad} strokeWidth={2.4} />
            ))}
          </>
        )}
        {surgeZones.map((z, i) => (
          <Circle key={`s${i}`} cx={z.x} cy={z.y} r={z.r} fill="#F5A623" fillOpacity={0.22} stroke="#F5A623" strokeOpacity={0.5} strokeWidth={0.4} />
        ))}
        {route ? (
          <>
            <Polyline points={routePoints} fill="none" stroke={colors.ink} strokeWidth={1.4} strokeDasharray="3,2" strokeLinecap="round" />
            {route.progress !== undefined ? (
              <Polyline
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
      </Svg>

      {/* markers rendered as RN views over the svg */}
      {markers.map((m, i) => (
        <View key={i} style={[styles.marker, { left: `${m.x}%`, top: `${m.y}%` }]}>
          {m.emoji ? (
            <View style={[styles.emojiPin, m.color ? { backgroundColor: m.color } : null]}>
              <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
            </View>
          ) : (
            <View style={[styles.dot, { backgroundColor: m.color ?? colors.blue }]} />
          )}
          {m.label ? (
            <View style={styles.markerLabel}>
              <Text style={styles.markerLabelText} numberOfLines={1}>{m.label}</Text>
            </View>
          ) : null}
        </View>
      ))}

      {driver ? (
        <View style={[styles.marker, { left: `${driver.x}%`, top: `${driver.y}%` }]}>
          <View style={styles.driverDot}>
            <Text style={{ fontSize: 12 }}>🚗</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.mapBg,
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -14 }, { translateY: -14 }],
  },
  emojiPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.ink,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  driverDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLabel: {
    marginTop: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    maxWidth: 110,
  },
  markerLabelText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.ink,
  },
});
