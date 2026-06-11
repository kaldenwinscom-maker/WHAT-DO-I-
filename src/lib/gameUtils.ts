import { LOCATIONS, Location } from '@/data/locations';

// ─── Distance ────────────────────────────────────────────────────────────────

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

export function calcScore(distanceKm: number): number {
  return Math.round(5000 * Math.exp(-distanceKm / 1500));
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
// Simple linear congruential generator

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

// ─── Location selection ───────────────────────────────────────────────────────

export function selectLocations(seed: number, count = 5): Location[] {
  const rng = makeRng(seed);
  const pool = [...LOCATIONS];
  const result: Location[] = [];
  while (result.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

// ─── Room codes ───────────────────────────────────────────────────────────────

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit confusing chars

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function generateSeed(): number {
  return Math.floor(Math.random() * 0x7fffffff);
}

// ─── Share-link helpers ───────────────────────────────────────────────────────

export function buildChallengeUrl(seed: number, roundCount: number, timerSec: number): string {
  if (typeof window === 'undefined') return '';
  const u = new URL(window.location.href);
  u.searchParams.set('challenge', '1');
  u.searchParams.set('seed', String(seed));
  u.searchParams.set('rounds', String(roundCount));
  u.searchParams.set('timer', String(timerSec));
  return u.toString();
}

export function parseChallengeUrl(): { seed: number; rounds: number; timer: number } | null {
  if (typeof window === 'undefined') return null;
  const p = new URLSearchParams(window.location.search);
  if (!p.get('challenge')) return null;
  return {
    seed: parseInt(p.get('seed') ?? '0', 10),
    rounds: parseInt(p.get('rounds') ?? '5', 10),
    timer: parseInt(p.get('timer') ?? '90', 10),
  };
}
