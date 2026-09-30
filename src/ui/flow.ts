import { SuspectId, WorldSlotKey } from '../types/case';
import { GameEvent, RunMode, RunState } from '../types/run';
import { Profile } from '../engine/simulator';
import { Terrain } from '../engine/worldEngine';
import { inMode } from '../engine/modes';
import type { World } from './device';

/** Chapter I, beat by beat. Each stage is one screen with one main action. */
export const STAGES = [
  'boot',
  'download',
  'dossier',
  'terrain',
  'mission1',
  'navigate1',
  'pocket1',
  'arrived1',
  'capture1',
  'detect1',
  'unlock1',
  'evidence1',
  'ringLeo',
  'callLeo',
  'sarah',
  'leadLeo',
  'paul',
  'mission2',
  'capture2',
  'detect2',
  'unlock2',
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
  'unlock3',
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
  download: 'Téléchargement',
  dossier: 'Dossier Nora',
  terrain: 'Terrain',
  mission1: 'Mission 1',
  navigate1: 'Boussole',
  pocket1: 'Range ton téléphone',
  arrived1: 'Zone atteinte',
  capture1: 'Viseur année',
  detect1: 'Détection année',
  unlock1: 'Déverrouillage appels',
  evidence1: 'Preuve appel',
  ringLeo: 'Appel Léo',
  callLeo: 'Interrogatoire Léo',
  sarah: 'Messages Sarah',
  leadLeo: 'SMS anonyme',
  paul: 'Témoin Paul',
  mission2: 'Mission 2',
  capture2: 'Viseur mot',
  detect2: 'Détection mot',
  unlock2: 'Déverrouillage dossier',
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
  unlock3: 'Déverrouillage clé USB',
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

/** What the player is trying to do right now — always visible, so every step has a reason. */
export const OBJECTIVES: Partial<Record<Stage, string>> = {
  download: 'Ouvrir le dossier de Nora',
  dossier: 'Écouter le dernier message de Nora',
  terrain: 'Choisir la durée de ton enquête',
  mission1: 'Retrouver d’où Nora a appelé à 21:53',
  navigate1: 'Retrouver d’où Nora a appelé à 21:53',
  pocket1: 'Rejoindre la zone de l’appel',
  arrived1: 'Trouver la clé du journal d’appels : une année',
  capture1: 'Trouver la clé du journal d’appels : une année',
  detect1: 'Trouver la clé du journal d’appels : une année',
  unlock1: 'Ouvrir le journal d’appels de Nora',
  evidence1: 'Savoir qui Nora a appelé à 21:53',
  callLeo: 'Savoir où était Léo après l’appel',
  sarah: 'Écouter ce que Sarah sait',
  leadLeo: 'Vérifier ce qu’on te dit de Léo',
  paul: 'Reconstituer la sortie de Nora',
  mission2: 'Ouvrir le dossier principal de Nora',
  capture2: 'Trouver la 2e partie de la clé : une lettre',
  detect2: 'Trouver la 2e partie de la clé : une lettre',
  unlock2: 'Ouvrir le dossier principal de Nora',
  evidence2: 'Découvrir sur qui Nora enquêtait',
  ticket: 'Savoir avec qui Nora était à 22:34',
  ines: 'Savoir avec qui Nora était à 22:34',
  board: 'Relier ce que tu sais',
  walk: 'Rejoindre le point suivant',
  callMarc: 'Comprendre comment Marc connaît ta clé',
  chapter2: 'Lire la note cachée de Nora',
  evidence3: 'Comprendre ce que Marc savait',
  mission3: 'Ouvrir la clé USB de Nora',
  capture3: 'Trouver la clé USB : un nombre',
  detect3: 'Trouver la clé USB : un nombre',
  unlock3: 'Ouvrir la clé USB de Nora',
  evidence5: 'Savoir d’où venaient les fichiers de Nora',
  leadSarah: 'Vérifier ce qu’on te dit de Sarah',
  callSarah: 'Faire dire à Sarah ce qu’elle a donné à Nora',
  callMarc2: 'Confronter Marc au sujet de Sarah',
  board2: 'Relier les preuves avant d’accuser',
  accuse: 'Désigner le responsable, preuve à l’appui',
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
  unlock3: 'immersive',
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
  /** Real surroundings (GPS + map); undefined = simulated environment. */
  world?: World;
  setWorld: (w?: World) => void;
  /** A saved investigation found at launch, offered on the first screen. */
  saved?: { stage: Stage; chapter: number };
  resume: () => void;
  /** When chapter I ended (the 07:42 appointment is computed from it). */
  endedAt?: number;
};

export const SUSPECT_SHORT: Record<SuspectId, string> = { leo: 'Léo', sarah: 'Sarah', marc: 'Marc' };
