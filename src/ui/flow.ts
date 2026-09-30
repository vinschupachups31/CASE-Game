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
};

export const pageLabel = (stage: Stage) => `${String(STAGES.indexOf(stage) + 1).padStart(2, '0')} · ${STAGE_NAMES[stage]}`;

export const progressOf = (stage: Stage) => STAGES.indexOf(stage) / (STAGES.length - 1);

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
