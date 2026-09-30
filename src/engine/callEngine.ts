// Call Engine: the psychology of a phone call. Pure functions, no UI.
// Introduce yourself first; adapt your tone to the person; push too hard and they hang up.
// A hang-up never blocks the game: the player can call back, starting from lower trust.

import { CaseFile, IntroId, SuspectId, Tone } from '../types/case';
import { GameEvent, RunState } from '../types/run';
import { CASE_2317 } from '../cases/23-17';
import { ask } from './interrogationEngine';

export type CallState = {
  suspectId: SuspectId;
  introduced: boolean;
  trust: number;
  tension: number;
  hungUp: boolean;
  /** How many times they already hung up on the player. */
  hangups: number;
};

export type CallReply = { state: CallState; text: string; events: GameEvent[]; guarded?: boolean };

export type Mood = 'En confiance' | 'Réservé' | 'Méfiant' | 'Sur la défensive' | 'À bout';

export const INTROS: { id: IntroId; label: string; text: string }[] = [
  { id: 'close', label: 'Je suis un proche', text: 'Je suis un proche de Nora. Je la cherche, moi aussi.' },
  { id: 'honest', label: 'J’enquête', text: 'Je m’appelle Alex. J’enquête sur la disparition de Nora, à titre personnel.' },
  { id: 'blunt', label: 'Aller droit au but', text: 'Peu importe qui je suis. Où est Nora ?' },
];

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const psycheOf = (id: SuspectId, caseFile: CaseFile) => caseFile.suspects.find((s) => s.id === id)!.psyche;

/** `grudge`: the player snubbed them earlier (e.g. ignored a message). They remember that too. */
export function startCall(suspectId: SuspectId, hangups = 0, grudge = false, caseFile: CaseFile = CASE_2317): CallState {
  const p = psycheOf(suspectId, caseFile);
  // Calling back after a hang-up: they remember.
  const cold = hangups + (grudge ? 1 : 0);
  return { suspectId, introduced: false, trust: clamp(p.trust - 15 * cold), tension: clamp(10 + 15 * cold), hungUp: false, hangups };
}

function withEffect(state: CallState, effect: { trust: number; tension: number }, caseFile: CaseFile): CallState {
  const next = { ...state, trust: clamp(state.trust + effect.trust), tension: clamp(state.tension + effect.tension) };
  return next.tension >= psycheOf(state.suspectId, caseFile).tensionLimit ? { ...next, hungUp: true, hangups: state.hangups + 1 } : next;
}

export function introduce(state: CallState, intro: IntroId, caseFile: CaseFile = CASE_2317): CallReply {
  if (state.hungUp) return { state, text: '', events: [] };
  const p = psycheOf(state.suspectId, caseFile);
  const effect = p.intros[intro];
  const next = { ...withEffect(state, effect, caseFile), introduced: true };
  if (next.hungUp) return { state: next, text: p.lines.hangup, events: [] };
  return { state: next, text: effect.trust > 0 ? p.lines.warm : p.lines.cold, events: [] };
}

/** A question in a given tone. The answer depends on who they are and how the call is going. */
export function askInCall(state: CallState, run: RunState, question: string, tone: Tone, caseFile: CaseFile = CASE_2317): CallReply {
  if (state.hungUp) return { state, text: '', events: [] };
  const p = psycheOf(state.suspectId, caseFile);

  if (!state.introduced) {
    const next = withEffect(state, { trust: -10, tension: 25 }, caseFile);
    return { state: next, text: next.hungUp ? p.lines.hangup : p.lines.suspicious, events: [] };
  }

  const next = withEffect(state, p.tones[tone], caseFile);
  if (next.hungUp) return { state: next, text: p.lines.hangup, events: [] };

  const answer = ask(run, state.suspectId, question, caseFile);
  const topic = caseFile.topics[state.suspectId].find((t) => t.id === answer.topicId);
  if (topic?.minTrust && next.trust < topic.minTrust) {
    return { state: next, text: p.lines.evasive, events: [], guarded: true };
  }
  return { state: next, text: answer.text, events: answer.events };
}

export function moodOf(state: CallState, caseFile: CaseFile = CASE_2317): Mood {
  const limit = psycheOf(state.suspectId, caseFile).tensionLimit;
  if (state.tension >= limit * 0.75) return 'À bout';
  if (state.tension >= limit * 0.45) return 'Sur la défensive';
  if (state.trust >= 60) return 'En confiance';
  if (state.trust < 25) return 'Méfiant';
  return 'Réservé';
}
