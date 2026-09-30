import { SuspectId, WorldSlotKey } from '../types/case';
import { GameEvent, RunMode, RunState } from '../types/run';
import { Profile } from '../engine/simulator';
import { Terrain } from '../engine/worldEngine';
import { inMode } from '../engine/modes';

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
  'leadLeo',
  'paul',
  'mission2',
  'capture2',
  'detect2',
  'evidence2',
  'ticket',
  'ines',
  'board',
  'walk',
  'threat',
  'ringMarc',
  'callMarc',
  'end',
  // Chapter II: the hidden note, Sarah, Marc again, the accusation.
  'chapter2',
  'evidence3',
  'mission3',
  'capture3',
  'detect3',
  'evidence5',
  'leadSarah',
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
  leadLeo: 'SMS anonyme',
  paul: 'Témoin Paul',
  mission2: 'Mission 2',
  capture2: 'Viseur mot',
  detect2: 'Détection mot',
  evidence2: 'Preuve dossier',
  ticket: 'Ticket de caisse',
  ines: 'Témoin Inès',
  board: 'Carnet',
  walk: 'Marche',
  threat: 'Numéro inconnu',
  ringMarc: 'Appel Marc',
  callMarc: 'Interrogatoire Marc',
  end: 'Fin de chapitre',
  chapter2: 'Chapitre II',
  evidence3: 'Note de Nora',
  mission3: 'Mission 5',
  capture3: 'Viseur nombre',
  detect3: 'Détection nombre',
  evidence5: 'Clé USB',
  leadSarah: 'Emails supprimés',
  ringSarah: 'Appel Sarah',
  callSarah: 'Interrogatoire Sarah',
  ringMarc2: 'Rappel Marc',
  callMarc2: 'Confrontation Marc',
  board2: 'Carnet II',
  accuse: 'Accusation',
  verdict: 'Verdict',
};

/** Stages that only exist in longer runs: more story, same truth. */
export const STAGE_MODE: Partial<Record<Stage, RunMode>> = {
  leadLeo: 'normal',
  paul: 'immersive',
  ticket: 'normal',
  ines: 'normal',
  mission3: 'immersive',
  capture3: 'immersive',
  detect3: 'immersive',
  evidence5: 'immersive',
  leadSarah: 'immersive',
};

/** The stage actually shown: skips forward past stages this run's mode does not include. */
export function resolveStage(stage: Stage, mode: RunMode): Stage {
  let i = STAGES.indexOf(stage);
  while (!inMode(STAGE_MODE[STAGES[i]], mode)) i++;
  return STAGES[i];
}

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
