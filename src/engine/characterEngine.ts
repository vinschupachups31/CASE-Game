// Character Engine: builds the bounded context a backend AI receives to voice a suspect,
// and guards any AI reply against contradicting the Case File.
// No AI key ever lives in the app: this context is sent to a backend.

import { CaseFile, SuspectId } from '../types/case';
import { RunState } from '../types/run';
import { CASE_2317 } from '../cases/23-17';
import { evidenceView } from './gameEngine';
import { normalize } from './templates';

export const CHARACTER_RULES = [
  'Tu joues un personnage. Tu n’es pas le maître du jeu.',
  'Tu peux improviser la formulation, les hésitations, le ton.',
  'Tu ne modifies jamais un horaire canonique.',
  'Tu n’inventes jamais de suspect, d’alibi ou de preuve.',
  'Tu ne changes jamais le responsable.',
  'Tu ne contredis jamais le dossier.',
];

export function characterContext(run: RunState, suspectId: SuspectId, caseFile: CaseFile = CASE_2317) {
  const s = caseFile.suspects.find((x) => x.id === suspectId)!;
  return {
    character: s.name,
    role: s.role,
    claim: s.claim,
    knownFacts: s.knownFacts,
    lies: s.lies.map((l) => l.statement),
    forbidden: s.forbidden,
    objective: s.objective,
    timeline: caseFile.timeline.map((t) => t.time),
    cast: caseFile.suspects.map((x) => x.name).concat(caseFile.victim.name),
    playerEvidence: evidenceView(run, caseFile).map((e) => `${e.fileName}: ${e.lines.join(' / ')}`),
    alreadySaid: run.statements.filter((x) => x.suspectId === suspectId).map((x) => x.text),
    rules: CHARACTER_RULES,
  };
}

export type GuardResult = { ok: true } | { ok: false; reasons: string[] };

const CONFESSION = [/c'?est moi/, /je l'?ai tuee/, /je suis (le )?responsable/, /j'avoue/];

/** Rejects AI replies that invent a time or make the culprit confess. The local answer is used instead. */
export function guardReply(reply: string, suspectId: SuspectId, caseFile: CaseFile = CASE_2317): GuardResult {
  const reasons: string[] = [];
  const allowedTimes = new Set([
    ...caseFile.timeline.map((t) => t.time),
    caseFile.opening.time,
    '04:17',
  ]);
  for (const time of reply.match(/\b\d{1,2}[:h]\d{2}\b/g) ?? []) {
    const t = time.replace('h', ':').padStart(5, '0');
    if (!allowedTimes.has(t)) reasons.push(`Horaire non canonique : ${time}`);
  }
  const text = normalize(reply).replace(/’/g, "'");
  if (suspectId === caseFile.truth.culprit && CONFESSION.some((r) => r.test(text))) {
    reasons.push('Aveu direct interdit');
  }
  return reasons.length ? { ok: false, reasons } : { ok: true };
}
