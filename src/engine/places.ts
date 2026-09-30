// Real places around the player, from OpenStreetMap (Overpass). No key, no account.
// Only public, named places; anything private, abandoned or under construction is dropped.

import { Candidate, PlaceKind } from './worldEngine';
import { LatLon, bearingDeg, distanceM } from './geo';

export type OsmElement = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

/** Too close is not a walk; the World Engine then filters by the mode's max distance. */
export const MIN_DISTANCE_M = 100;

export function overpassQuery(at: LatLon, radiusM: number): string {
  const around = `(around:${radiusM},${at.lat},${at.lon})`;
  const sel = [
    'place~"^(square)$"',
    'amenity~"^(marketplace|townhall|place_of_worship|library|pharmacy|cafe|bakery|post_office)$"',
    'historic~"^(monument|memorial|building|church|castle|city_gate)$"',
    'tourism~"^(artwork|attraction|museum|viewpoint)$"',
    'leisure~"^(park|garden)$"',
    'shop~"^(bakery|books|florist|butcher|newsagent)$"',
  ];
  return `[out:json][timeout:12];(${sel.map((s) => `nwr${around}[name][${s}];`).join('')});out center 120;`;
}

export function kindOf(tags: Record<string, string>): PlaceKind | undefined {
  if (tags.place === 'square' || tags.amenity === 'marketplace') return 'open_space';
  if (tags.historic || tags.tourism || ['townhall', 'place_of_worship'].includes(tags.amenity)) return 'landmark';
  if (tags.shop || ['pharmacy', 'cafe', 'bakery', 'post_office'].includes(tags.amenity)) return 'commercial';
  if (tags.leisure || tags.amenity === 'library') return 'quiet';
  return undefined;
}

/** Rule 5 of the product: never private property, abandoned buildings or building sites. */
export function isUnsafe(tags: Record<string, string>): boolean {
  return (
    ['private', 'no', 'customers'].includes(tags.access ?? '') ||
    Object.keys(tags).some((k) => /^(abandoned|disused|ruins|construction)(:|$)/.test(k)) ||
    tags.building === 'ruins' ||
    tags.historic === 'ruins' ||
    tags.landuse === 'construction'
  );
}

export function toCandidates(elements: OsmElement[], from: LatLon): Candidate[] {
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const e of elements) {
    const tags = e.tags ?? {};
    const pos = e.center ?? (e.lat !== undefined && e.lon !== undefined ? { lat: e.lat, lon: e.lon } : undefined);
    const kind = kindOf(tags);
    if (!pos || !kind || !tags.name) continue;
    const key = tags.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const d = distanceM(from, pos);
    if (d < MIN_DISTANCE_M) continue;
    out.push({
      id: `${e.type}/${e.id}`,
      name: tags.name,
      kind,
      distanceM: d,
      bearingDeg: bearingDeg(from, pos),
      public: true,
      unsafe: isUnsafe(tags),
      lat: pos.lat,
      lon: pos.lon,
    });
  }
  return out.sort((a, b) => a.distanceM - b.distanceM);
}

const ENDPOINTS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

/** Fetches public places around the player; throws when every mirror fails (the app falls back to simulation). */
export async function fetchPlaces(at: LatLon, radiusM = 2500, timeoutMs = 9000): Promise<Candidate[]> {
  const body = `data=${encodeURIComponent(overpassQuery(at, radiusM))}`;
  let last: unknown;
  for (const url of ENDPOINTS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: ctrl.signal });
      if (!res.ok) throw new Error(`Overpass ${res.status}`);
      const json = (await res.json()) as { elements: OsmElement[] };
      return toCandidates(json.elements ?? [], at);
    } catch (e) {
      last = e;
    } finally {
      clearTimeout(t);
    }
  }
  throw last instanceof Error ? last : new Error('Overpass indisponible');
}
