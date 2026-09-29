// Challenge Engine: validates what the player found in the real world and turns it into a variable.

import { ChallengeKind, WorldSlotDef } from '../types/case';
import { normalize } from './templates';

export type ChallengeResult = { ok: true; value: string; raw: string } | { ok: false; reason: string };

export const CHALLENGE_PROMPTS: Record<ChallengeKind, string> = {
  visible_year: 'Trouve autour de toi quelque chose portant une année.',
  visible_word: 'Trouve un mot visible d’au moins 6 lettres.',
  visible_number: 'Trouve un nombre visible dans ton environnement.',
  color: 'Trouve un objet d’une couleur dominante.',
  audio_memory: 'Écoute la scène et identifie le son qui ne correspond pas.',
  photo_observation: 'Observe la scène. Un détail sera important.',
};

/** Challenges that never depend on the surroundings, used when the environment is too poor. */
export const FALLBACK_CHALLENGES: ChallengeKind[] = ['audio_memory', 'photo_observation'];

export function validateYear(input: string, now = new Date()): ChallengeResult {
  const raw = input.trim();
  const n = Number(raw);
  if (!/^\d{4}$/.test(raw)) return { ok: false, reason: 'Une année s’écrit avec 4 chiffres.' };
  if (n < 1000 || n > now.getFullYear()) return { ok: false, reason: 'Cette année n’est pas plausible.' };
  return { ok: true, value: raw, raw };
}

export function lettersOnly(word: string): string {
  return normalize(word).replace(/[^a-z]/g, '').toUpperCase();
}

/** A word of at least 6 letters; the variable is its third letter. */
export function validateWord(input: string): ChallengeResult {
  const clean = lettersOnly(input);
  if (clean.length < 6) return { ok: false, reason: 'Il faut un mot d’au moins 6 lettres.' };
  return { ok: true, value: clean[2], raw: clean };
}

export function validateNumber(input: string): ChallengeResult {
  const raw = input.trim();
  if (!/^\d{1,6}$/.test(raw)) return { ok: false, reason: 'Aucun nombre lisible.' };
  return { ok: true, value: raw, raw };
}

export function validateForSlot(slot: WorldSlotDef, input: string): ChallengeResult {
  switch (slot.challenge) {
    case 'visible_year':
      return validateYear(input);
    case 'visible_word':
      return validateWord(input);
    case 'visible_number':
      return validateNumber(input);
    default:
      return input.trim() ? { ok: true, value: input.trim(), raw: input.trim() } : { ok: false, reason: 'Réponse vide.' };
  }
}
