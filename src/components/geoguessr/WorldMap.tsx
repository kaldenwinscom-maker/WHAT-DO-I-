'use client';

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { LatLng } from '@/types/geo';

interface Props {
  onGuess: (latlng: LatLng) => void;
  guess: LatLng | null;
  answer?: LatLng | null;
  allGuesses?: Array<{ latlng: LatLng; color: string; name: string }>;
  allAnswers?: Array<{ latlng: LatLng; name: string }>;
  revealed?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
  disabled?: boolean;
}

export default function WorldMap({
  onGuess, guess, answer, allGuesses, allAnswers,
  revealed = false, expanded = false, onToggleExpand, disabled = false,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let map: ReturnType<typeof import('leaflet')['map']>;

    async function init() {
      if (!mapRef.current || leafletRef.current) return;
      // Dynamic import to avoid SSR
      const L = (await import('leaflet')).default;

      // Fix default marker icons for Next.js bundling
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      map = L.map(mapRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(map);

      leafletRef.current = { L, map, markers: [], lines: [] };
      setReady(true);
    }
    init();

    return () => {
      if (leafletRef.current?.map) {
        leafletRef.current.map.remove();
        leafletRef.current = null;
      }
    };
  }, []);

  // Click handler
  useEffect(() => {
    if (!ready || !leafletRef.current) return;
    const { map } = leafletRef.current;
    if (disabled || revealed) {
      map.off('click');
      return;
    }
    const handler = (e: { latlng: { lat: number; lng: number } }) => {
      onGuess({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on('click', handler);
    return () => { map.off('click', handler); };
  }, [ready, disabled, revealed, onGuess]);

  // Guess marker
  useEffect(() => {
    if (!ready || !leafletRef.current) return;
    const { L, map } = leafletRef.current;

    if (leafletRef.current._guessMarker) {
      leafletRef.current._guessMarker.remove();
      leafletRef.current._guessMarker = null;
    }

    if (guess) {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
      leafletRef.current._guessMarker = L.marker([guess.lat, guess.lng], { icon }).addTo(map);
    }
  }, [ready, guess]);

  // Revealed state: answer marker + line + zoom
  useEffect(() => {
    if (!ready || !leafletRef.current || !revealed) return;
    const { L, map } = leafletRef.current;

    // Clear old reveal markers/lines
    if (leafletRef.current._revealMarkers) {
      leafletRef.current._revealMarkers.forEach((m: unknown) => (m as { remove: () => void }).remove());
    }
    if (leafletRef.current._revealLines) {
      leafletRef.current._revealLines.forEach((l: unknown) => (l as { remove: () => void }).remove());
    }
    leafletRef.current._revealMarkers = [];
    leafletRef.current._revealLines = [];

    if (allAnswers && allGuesses) {
      // Show all answer markers
      allAnswers.forEach(a => {
        const ansIcon = L.divIcon({
          className: '',
          html: `<div style="width:26px;height:26px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const m = L.marker([a.latlng.lat, a.latlng.lng], { icon: ansIcon }).addTo(map);
        m.bindTooltip(a.name, { permanent: false });
        leafletRef.current._revealMarkers.push(m);
      });

      // Show each guess and connect it to the corresponding answer.
      // If there's only 1 answer (single-round reveal with multiple players),
      // all guesses connect to that one answer.
      allGuesses.forEach((g, i) => {
        const guessIcon = L.divIcon({
          className: '',
          html: `<div style="width:20px;height:20px;border-radius:50%;background:${g.color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
        const gm = L.marker([g.latlng.lat, g.latlng.lng], { icon: guessIcon }).addTo(map);
        gm.bindTooltip(g.name, { permanent: false });
        leafletRef.current._revealMarkers.push(gm);

        const targetAnswer = allAnswers.length === 1 ? allAnswers[0] : allAnswers[i];
        if (targetAnswer) {
          const line = L.polyline(
            [[g.latlng.lat, g.latlng.lng], [targetAnswer.latlng.lat, targetAnswer.latlng.lng]],
            { color: g.color, weight: 2, dashArray: '6,4', opacity: 0.85 },
          ).addTo(map);
          leafletRef.current._revealLines.push(line);
        }
      });

      const allPoints: [number, number][] = [
        ...allAnswers.map(a => [a.latlng.lat, a.latlng.lng] as [number, number]),
        ...allGuesses.map(g => [g.latlng.lat, g.latlng.lng] as [number, number]),
      ];
      if (allPoints.length > 0) {
        map.fitBounds(L.latLngBounds(allPoints), { padding: [40, 40], maxZoom: 7 });
      }
    } else if (answer && guess) {
      // Single round reveal
      const ansIcon = L.divIcon({
        className: '',
        html: `<div style="width:26px;height:26px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });
      const ansM = L.marker([answer.lat, answer.lng], { icon: ansIcon }).addTo(map);
      leafletRef.current._revealMarkers.push(ansM);

      const line = L.polyline(
        [[guess.lat, guess.lng], [answer.lat, answer.lng]],
        { color: '#f59e0b', weight: 2.5, dashArray: '8,5', opacity: 0.9 },
      ).addTo(map);
      leafletRef.current._revealLines.push(line);

      map.fitBounds(
        L.latLngBounds([[guess.lat, guess.lng], [answer.lat, answer.lng]]),
        { padding: [50, 50], maxZoom: 8, animate: true, duration: 0.8 },
      );
    }
  }, [ready, revealed, answer, guess, allAnswers, allGuesses]);

  // Resize when expanded changes
  useEffect(() => {
    if (!ready || !leafletRef.current) return;
    setTimeout(() => leafletRef.current?.map?.invalidateSize(), 50);
  }, [ready, expanded]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/10 transition-all duration-300 ${
        expanded ? 'h-[70vh]' : 'h-[220px] sm:h-[260px]'
      }`}
      style={{ touchAction: 'none' }}
    >
      <div ref={mapRef} className="w-full h-full" />

      {/* Expand / collapse toggle */}
      {onToggleExpand && (
        <button
          onClick={onToggleExpand}
          className="absolute top-2 right-2 z-[500] bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-lg backdrop-blur-sm hover:bg-black/80 transition-colors"
        >
          {expanded ? 'Shrink ↙' : 'Expand ↗'}
        </button>
      )}

      {/* Instruction overlay */}
      {!disabled && !revealed && !guess && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div className="bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm whitespace-nowrap">
            Click map to place your pin
          </div>
        </div>
      )}

      {/* Pin placed indicator */}
      {!revealed && guess && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
          <div className="bg-amber-500/90 text-white text-xs px-3 py-1 rounded-full font-semibold backdrop-blur-sm">
            📍 Pin placed — lock in to confirm
          </div>
        </div>
      )}
    </div>
  );
}
