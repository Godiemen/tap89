'use client';
import React, { useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type { LatLng } from '@sipdash/core';

/** Draggable pin on a real map — for setting a store/customer location. */

const DURBAN: LatLng = { lat: -29.8587, lng: 31.0218 };

const pinIcon = L.divIcon({
  className: '',
  html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 4px;background:#1b1526;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.4)"></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 32],
});

function ClickToMove({ onPick }: { onPick: (p: LatLng) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

export default function LocationPicker({
  value,
  onPick,
  height = 240,
}: {
  value?: LatLng;
  onPick: (p: LatLng) => void;
  height?: number;
}) {
  const [pos, setPos] = useState<LatLng>(value ?? DURBAN);
  const center = value ?? DURBAN;
  const markerRef = useRef<L.Marker>(null);

  const pick = (p: LatLng) => {
    setPos(p);
    onPick(p);
  };

  return (
    <div style={{ height, overflow: 'hidden', borderRadius: 12 }}>
      <MapContainer center={[center.lat, center.lng]} zoom={14} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickToMove onPick={pick} />
        <Marker
          position={[pos.lat, pos.lng]}
          icon={pinIcon}
          draggable
          ref={markerRef}
          eventHandlers={{
            dragend: () => {
              const ll = markerRef.current?.getLatLng();
              if (ll) pick({ lat: ll.lat, lng: ll.lng });
            },
          }}
        />
      </MapContainer>
    </div>
  );
}
