// World Engine: turns the places around the player into a safe walking route.
// A case never names a real place; it asks for kinds of places and falls back when none exist.

import { ChallengeKind } from '../types/case';
import { RunMode } from '../types/run';
import { FALLBACK_CHALLENGES } from './challengeEngine';
import { LatLon, destination } from './geo';

export type PlaceKind = 'open_space' | 'landmark' | 'commercial' | 'quiet';

export type Candidate = {
  id: string;
  name: string;
  kind: PlaceKind;
  distanceM: number;
  /** Degrees from north, used for the compass (direction + distance, no map pin). */
  bearingDeg?: number;
  public: boolean;
  /** Private property, abandoned building, dangerous crossing… never used. */
  unsafe?: boolean;
  /** Real coordinates, when the place comes from the map (live distance and arrival). */
  lat?: number;
  lon?: number;
};

export type Purpose = 'trace' | 'world_challenge' | 'confrontation' | 'finale';

export type RouteStop =
  | { type: 'place'; purpose: Purpose; place: Candidate }
  | { type: 'in_place'; purpose: Purpose; challenge: ChallengeKind };

export type Terrain = {
  mode: RunMode;
  zonesFound: number;
  stops: RouteStop[];
  distanceM: number;
  durationMin: number;
};

export const MODES: Record<RunMode, { label: string; maxDistanceM: number; durationMin: number }> = {
  short: { label: 'COURT', maxDistanceM: 1000, durationMin: 20 },
  normal: { label: 'NORMAL', maxDistanceM: 2000, durationMin: 35 },
  immersive: { label: 'IMMERSIF', maxDistanceM: 4000, durationMin: 60 },
};

const PURPOSES: Purpose[] = ['trace', 'world_challenge', 'confrontation', 'finale'];
const PREFERRED_KINDS: PlaceKind[] = ['open_space', 'landmark', 'commercial', 'quiet'];

export function isSafe(c: Candidate, maxDistanceM: number): boolean {
  return c.public && !c.unsafe && c.distanceM > 0 && c.distanceM <= maxDistanceM;
}

/** Picks up to 4 diverse public places; missing stops become in-place challenges so the run never blocks. */
export function buildTerrain(candidates: Candidate[], mode: RunMode = 'normal'): Terrain {
  const { maxDistanceM, durationMin } = MODES[mode];
  const safe = candidates.filter((c) => isSafe(c, maxDistanceM)).sort((a, b) => a.distanceM - b.distanceM);

  const chosen: Candidate[] = [];
  for (const kind of PREFERRED_KINDS) {
    const c = safe.find((x) => x.kind === kind && !chosen.includes(x));
    if (c) chosen.push(c);
  }
  for (const c of safe) {
    if (chosen.length >= PURPOSES.length) break;
    if (!chosen.includes(c)) chosen.push(c);
  }
  chosen.sort((a, b) => a.distanceM - b.distanceM);

  let fallbackIndex = 0;
  const stops: RouteStop[] = PURPOSES.map((purpose, i) =>
    chosen[i]
      ? { type: 'place', purpose, place: chosen[i] }
      : { type: 'in_place', purpose, challenge: FALLBACK_CHALLENGES[fallbackIndex++ % FALLBACK_CHALLENGES.length] },
  );

  const distanceM = chosen.length ? chosen[chosen.length - 1].distanceM : 0;
  return { mode, zonesFound: chosen.length, stops, distanceM, durationMin };
}

/** Compass label for direction + distance guidance. */
export function compass(bearingDeg: number): string {
  const labels = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return labels[Math.round((((bearingDeg % 360) + 360) % 360) / 45) % 8];
}

/** True when the player is inside the search zone (CASE vibrates). */
export function inSearchZone(remainingM: number, radiusM = 60): boolean {
  return remainingM <= radiusM;
}

/**
 * Without a map (no network), simulated places are pinned around the player's real position,
 * so the compass and the distance still follow their steps.
 */
export function anchorAround(origin: LatLon, places: Candidate[]): Candidate[] {
  return places.map((p) => (p.lat !== undefined ? p : { ...p, ...destination(origin, p.bearingDeg ?? 0, p.distanceM) }));
}
