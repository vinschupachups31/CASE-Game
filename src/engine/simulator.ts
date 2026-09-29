// Simulator: plays the same affair in different environments, without real GPS or camera.
// The route and the world variables change; the truth must not.

import { GameEvent, RunMode, RunState } from '../types/run';
import { SuspectId } from '../types/case';
import { CASE_2317 } from '../cases/23-17';
import { Candidate, Terrain, buildTerrain } from './worldEngine';
import { createRun, reduceGame } from './gameEngine';
import { ask } from './interrogationEngine';

export type Profile = {
  id: 'dense' | 'small' | 'rural';
  label: string;
  places: Candidate[];
  /** What the player finds in this environment; undefined = nothing, fallback used. */
  year?: string;
  word?: string;
};

export const PROFILES: Record<Profile['id'], Profile> = {
  dense: {
    id: 'dense',
    label: 'VILLE DENSE',
    year: '1927',
    word: 'PHARMACIE',
    places: [
      { id: 'a', name: 'Grande place', kind: 'open_space', distanceM: 340, bearingDeg: 40, public: true },
      { id: 'b', name: 'Monument', kind: 'landmark', distanceM: 710, bearingDeg: 95, public: true },
      { id: 'c', name: 'Rue commerçante', kind: 'commercial', distanceM: 980, bearingDeg: 150, public: true },
      { id: 'd', name: 'Jardin public', kind: 'quiet', distanceM: 1420, bearingDeg: 220, public: true },
      { id: 'x', name: 'Entrepôt désaffecté', kind: 'quiet', distanceM: 300, bearingDeg: 10, public: false, unsafe: true },
    ],
  },
  small: {
    id: 'small',
    label: 'PETITE VILLE',
    year: '1874',
    word: 'BOULANGERIE',
    places: [
      { id: 'a', name: 'Place centrale', kind: 'open_space', distanceM: 260, bearingDeg: 300, public: true },
      { id: 'b', name: 'Mairie', kind: 'landmark', distanceM: 540, bearingDeg: 350, public: true },
      { id: 'c', name: 'Centre', kind: 'commercial', distanceM: 820, bearingDeg: 20, public: true },
      { id: 'd', name: 'Espace calme', kind: 'quiet', distanceM: 1060, bearingDeg: 80, public: true },
    ],
  },
  rural: {
    id: 'rural',
    label: 'ZONE RURALE',
    places: [{ id: 'a', name: 'Église', kind: 'landmark', distanceM: 450, bearingDeg: 180, public: true }],
  },
};

export function simulate(profileId: Profile['id'], mode: RunMode = 'normal'): Terrain {
  return buildTerrain(PROFILES[profileId].places, mode);
}

/** Plays chapter I (and the chapter II opening) end to end with a scripted player. */
export function playthrough(profileId: Profile['id'], accuse: SuspectId = 'marc'): { run: RunState; terrain: Terrain } {
  const profile = PROFILES[profileId];
  const terrain = simulate(profileId);
  let run = createRun('normal', `sim-${profileId}`);
  const apply = (...events: GameEvent[]) => events.forEach((e) => (run = reduceGame(run, e)));
  const question = (suspectId: SuspectId, q: string) => apply(...ask(run, suspectId, q).events);

  apply({ type: 'SET_FLAG', flag: 'ZONE_1_REACHED' });
  apply(profile.year ? { type: 'CAPTURE', slot: 'WORLD_01', raw: profile.year, source: 'simulation' } : { type: 'USE_FALLBACK', slot: 'WORLD_01' });
  question('leo', 'Où étiez-vous après l’appel ?');
  apply({ type: 'SET_FLAG', flag: 'SARAH_ANSWERED' });
  apply(profile.word ? { type: 'CAPTURE', slot: 'WORLD_02', raw: profile.word, source: 'simulation' } : { type: 'USE_FALLBACK', slot: 'WORLD_02' });
  apply({ type: 'LINK', a: 'nora', b: 'leo' }, { type: 'LINK', a: 'leo', b: 'marc' });
  apply({ type: 'SET_FLAG', flag: 'WALKING_TO_ZONE_3' });
  question('marc', `Comment connaissez-vous ${run.variables.WORLD_01!.value} ?`);
  question('marc', 'Vous connaissez Sarah ?');
  apply({ type: 'NEXT_CHAPTER' });
  apply({ type: 'ACCUSE', suspectId: accuse });
  return { run, terrain };
}

export const CASE = CASE_2317;
