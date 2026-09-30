import { SuspectId, WorldSlotKey } from '../types/case';
import { GameEvent, RunMode, RunState } from '../types/run';
import { Profile } from '../engine/simulator';
import { Terrain } from '../engine/worldEngine';

/** Chapter I, beat by beat. Each stage is one screen with one main action. */
export const STAGES = [
  'boot',
  'dossier',
  'terrain',
  'mission1',
  'navigate1',
  'pocket1',
  'arrived1',
  'capture1',
  'detect1',
  'evidence1',
  'ringLeo',
  'callLeo',
  'sarah',
  'mission2',
  'capture2',
  'detect2',
  'evidence2',
  'board',
  'walk',
  'threat',
  'ringMarc',
  'callMarc',
  'end',
  // Chapter II: the hidden note, Sarah, Marc again, the accusation.
  'chapter2',
  'evidence3',
  'ringSarah',
  'callSarah',
  'ringMarc2',
  'callMarc2',
  'board2',
  'accuse',
  'verdict',
] as const;

export type Stage = (typeof STAGES)[number];

/** Human names, shown as a small page marker so testers can say exactly where they are. */
export const STAGE_NAMES: Record<Stage, string> = {
  boot: 'Notification',
  dossier: 'Dossier Nora',
  terrain: 'Terrain',
  mission1: 'Mission 1',
  navigate1: 'Boussole',
  pocket1: 'Range ton téléphone',
  arrived1: 'Zone atteinte',
  capture1: 'Viseur année',
  detect1: 'Détection année',
  evidence1: 'Preuve appel',
  ringLeo: 'Appel Léo',
  callLeo: 'Interrogatoire Léo',
  sarah: 'Messages Sarah',
  mission2: 'Mission 2',
  capture2: 'Viseur mot',
  detect2: 'Détection mot',
  evidence2: 'Preuve dossier',
  board: 'Carnet',
  walk: 'Marche',
  threat: 'Numéro inconnu',
  ringMarc: 'Appel Marc',
  callMarc: 'Interrogatoire Marc',
  end: 'Fin de chapitre',
  chapter2: 'Chapitre II',
  evidence3: 'Note de Nora',
  ringSarah: 'Appel Sarah',
  callSarah: 'Interrogatoire Sarah',
  ringMarc2: 'Rappel Marc',
  callMarc2: 'Confrontation Marc',
  board2: 'Carnet II',
  accuse: 'Accusation',
  verdict: 'Verdict',
};

export const pageLabel = (stage: Stage) => `${String(STAGES.indexOf(stage) + 1).padStart(2, '0')} · ${STAGE_NAMES[stage]}`;

/** First stage of each chapter; progress bars fill within a chapter. */
const CHAPTER_STARTS: Stage[] = ['boot', 'chapter2'];

export const chapterOf = (stage: Stage) => CHAPTER_STARTS.filter((s) => STAGES.indexOf(s) <= STAGES.indexOf(stage)).length;

export const progressOf = (stage: Stage) => {
  const n = chapterOf(stage);
  const start = STAGES.indexOf(CHAPTER_STARTS[n - 1]);
  const end = n < CHAPTER_STARTS.length ? STAGES.indexOf(CHAPTER_STARTS[n]) - 1 : STAGES.length - 1;
  return (STAGES.indexOf(stage) - start) / (end - start);
};

export const ROMAN = ['', 'I', 'II', 'III'];

export type Flow = {
  run: RunState;
  terrain: Terrain;
  profile: Profile;
  stage: Stage;
  go: (stage: Stage) => void;
  apply: (...events: GameEvent[]) => void;
  setMode: (mode: RunMode) => void;
  cycleProfile: () => void;
  /** Value read by the viewfinder, awaiting the player's confirmation. */
  pending?: { slot: WorldSlotKey; raw: string };
  setPending: (p?: { slot: WorldSlotKey; raw: string }) => void;
  /** When WORLD_01 was captured — the unknown number will know. */
  capturedAt?: number;
  markCaptured: () => void;
  restart: () => void;
};

export const SUSPECT_SHORT: Record<SuspectId, string> = { leo: 'Léo', sarah: 'Sarah', marc: 'Marc' };
