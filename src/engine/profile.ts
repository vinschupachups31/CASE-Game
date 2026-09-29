// Investigator profile: a personal insight worth sharing (identity, not app stats).

import { RunState } from '../types/run';
import { CaseFile } from '../types/case';
import { CASE_2317 } from '../cases/23-17';
import { adaptiveCode } from './templates';

export type InvestigatorProfile = { title: string; line: string };

export function investigatorProfile(run: RunState): InvestigatorProfile {
  const usedFallback = Object.values(run.variables).some((v) => v?.source === 'fallback');
  const liesHeard = run.statements.length;
  if (run.contradictions.length >= 2) return { title: 'L’Œil', line: 'Tu repères ce que les autres laissent passer.' };
  if (usedFallback) return { title: 'L’Improvisateur', line: 'Quand la ville se tait, tu trouves un autre chemin.' };
  if (liesHeard >= 3) return { title: 'Le Confesseur', line: 'Les gens te parlent. Même quand ils mentent.' };
  return { title: 'Le Marcheur', line: 'Tu fais parler la ville.' };
}

/** Share text: the player's own world code is the hook — every city writes a different one. */
export function shareText(run: RunState, caseFile: CaseFile = CASE_2317): string {
  const p = investigatorProfile(run);
  return [
    `CASE · Affaire ${caseFile.title}`,
    `Ma ville a écrit : ${adaptiveCode(run, caseFile)}`,
    `Profil : ${p.title} — ${p.line}`,
    `${run.contradictions.length} contradiction${run.contradictions.length > 1 ? 's' : ''}. Quelqu’un ment.`,
    'Et ta ville, elle a écrit quoi ?',
  ].join('\n');
}

/** Next chapter unlocks at the case's opening time — a daily appointment. */
export function nextUnlock(now: Date, time = CASE_2317.opening.time): Date {
  const [h, m] = time.split(':').map(Number);
  const d = new Date(now);
  d.setHours(h, m, 0, 0);
  if (d <= now) d.setDate(d.getDate() + 1);
  return d;
}
