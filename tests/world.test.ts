import { describe, expect, it } from 'vitest';
import { bearingDeg, distanceM, relativeBearing } from '../src/engine/geo';
import { OsmElement, kindOf, isUnsafe, overpassQuery, toCandidates } from '../src/engine/places';
import { buildTerrain } from '../src/engine/worldEngine';

const HOME = { lat: 48.8566, lon: 2.3522 };

describe('Géo', () => {
  it('distance et cap réalistes', () => {
    expect(distanceM(HOME, { lat: 48.8656, lon: 2.3522 })).toBeGreaterThan(990);
    expect(distanceM(HOME, { lat: 48.8656, lon: 2.3522 })).toBeLessThan(1010);
    expect(bearingDeg(HOME, { lat: 48.8656, lon: 2.3522 })).toBe(0);
    expect(bearingDeg(HOME, { lat: 48.8566, lon: 2.3622 })).toBe(90);
  });

  it('l’aiguille tourne selon où pointe le téléphone', () => {
    expect(relativeBearing(90, 0)).toBe(90);
    expect(relativeBearing(10, 350)).toBe(20);
    expect(relativeBearing(350, 10)).toBe(-20);
  });
});

describe('Lieux réels (OpenStreetMap)', () => {
  const el = (id: number, dLat: number, tags: Record<string, string>): OsmElement => ({ type: 'node', id, lat: HOME.lat + dLat, lon: HOME.lon, tags });
  const fixture: OsmElement[] = [
    el(1, 0.003, { name: 'Place du Marché', place: 'square' }),
    el(2, 0.006, { name: 'Église Saint-Paul', amenity: 'place_of_worship' }),
    el(3, 0.004, { name: 'Pharmacie Centrale', amenity: 'pharmacy' }),
    el(4, 0.009, { name: 'Jardin des Plantes', leisure: 'park' }),
    el(5, 0.002, { name: 'Usine Martin', historic: 'building', abandoned: 'yes' }),
    el(6, 0.005, { name: 'Parc de la Résidence', leisure: 'park', access: 'private' }),
    el(7, 0.0005, { name: 'Café du Coin', amenity: 'cafe' }),
    el(8, 0.004, { amenity: 'cafe' }),
    el(9, 0.0035, { name: 'Pharmacie Centrale', amenity: 'pharmacy' }),
  ];

  it('classe les lieux et écarte le privé, l’abandonné, l’anonyme, le trop proche et les doublons', () => {
    const c = toCandidates(fixture, HOME);
    expect(c.map((x) => x.name)).toEqual([
      'Usine Martin',
      'Place du Marché',
      'Pharmacie Centrale',
      'Parc de la Résidence',
      'Église Saint-Paul',
      'Jardin des Plantes',
    ]);
    expect(c.find((x) => x.name === 'Usine Martin')?.unsafe).toBe(true);
    expect(c.find((x) => x.name === 'Parc de la Résidence')?.unsafe).toBe(true);
    expect(c.every((x) => x.lat !== undefined && x.bearingDeg === 0)).toBe(true);
  });

  it('le World Engine n’envoie jamais le joueur vers un lieu dangereux', () => {
    const t = buildTerrain(toCandidates(fixture, HOME), 'normal');
    const names = t.stops.flatMap((s) => (s.type === 'place' ? [s.place.name] : []));
    expect(names).toEqual(['Place du Marché', 'Pharmacie Centrale', 'Église Saint-Paul', 'Jardin des Plantes']);
  });

  it('types et sécurité', () => {
    expect(kindOf({ historic: 'monument' })).toBe('landmark');
    expect(kindOf({ shop: 'bakery' })).toBe('commercial');
    expect(isUnsafe({ 'disused:amenity': 'school' })).toBe(true);
    expect(isUnsafe({ amenity: 'cafe' })).toBe(false);
    expect(overpassQuery(HOME, 1500)).toContain('around:1500,48.8566,2.3522');
  });
});
