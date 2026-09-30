// Run: the dynamic part of a game. It changes with the player, the truth does not.

import { Mode, SuspectId, WorldSlotKey } from './case';

export type { Mode as RunMode } from './case';

export type VariableSource = 'camera' | 'manual' | 'simulation' | 'fallback';

export type WorldVariable = {
  value: string;
  /** What the player actually captured (e.g. PHARMACIE for WORLD_02 = A). */
  raw: string;
  source: VariableSource;
};

export type Statement = { id: string; suspectId: SuspectId; text: string; at: number };

export type RunState = {
  id: string;
  caseId: string;
  mode: Mode;
  chapter: number;
  /** Monotonic clock (event counter), keeps the reducer deterministic. */
  tick: number;
  variables: Partial<Record<WorldSlotKey, WorldVariable>>;
  evidence: string[];
  suspects: SuspectId[];
  statements: Statement[];
  contradictions: string[];
  flags: string[];
  messages: string[];
  links: { a: string; b: string }[];
  accusation?: { suspectId: SuspectId; correct: boolean };
};

export type GameEvent =
  | { type: 'CAPTURE'; slot: WorldSlotKey; raw: string; source: VariableSource }
  | { type: 'USE_FALLBACK'; slot: WorldSlotKey }
  | { type: 'STATEMENT'; suspectId: SuspectId; statementId: string; text: string }
  | { type: 'SET_FLAG'; flag: string }
  | { type: 'LINK'; a: string; b: string }
  | { type: 'NEXT_CHAPTER' }
  | { type: 'ACCUSE'; suspectId: SuspectId };
