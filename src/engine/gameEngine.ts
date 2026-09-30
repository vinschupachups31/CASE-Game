// Game Engine: pure reducer over the run. The Case File is read, never written.

import { CaseFile, SuspectId } from '../types/case';
import { GameEvent, RunMode, RunState } from '../types/run';
import { CASE_2317 } from '../cases/23-17';
import { check } from './conditions';
import { validateForSlot } from './challengeEngine';
import { adaptiveCode, render } from './templates';
import { inMode } from './modes';

export function createRun(mode: RunMode = 'normal', id = 'run-' + Date.now().toString(36), caseFile: CaseFile = CASE_2317): RunState {
  return resolve(
    {
      id,
      caseId: caseFile.id,
      mode,
      chapter: 1,
      tick: 0,
      variables: {},
      evidence: [],
      suspects: [],
      statements: [],
      contradictions: [],
      flags: [],
      messages: [],
      links: [],
    },
    caseFile,
  );
}

const add = <T>(list: T[], item: T) => (list.includes(item) ? list : [...list, item]);

/** Applies every unlock whose condition is now met, until nothing changes. */
export function resolve(run: RunState, caseFile: CaseFile = CASE_2317): RunState {
  let next = run;
  for (;;) {
    const before = next;
    for (const e of caseFile.evidence) {
      if (!next.evidence.includes(e.id) && inMode(e.minMode, next.mode) && check(e.unlockWhen, next)) {
        next = { ...next, evidence: [...next.evidence, e.id] };
      }
    }
    for (const s of caseFile.suspects) {
      if (!next.suspects.includes(s.id) && check(s.availableWhen, next)) {
        next = { ...next, suspects: [...next.suspects, s.id] };
      }
    }
    for (const m of caseFile.messages) {
      if (!next.messages.includes(m.id) && check(m.triggerWhen, next)) {
        next = { ...next, messages: [...next.messages, m.id] };
      }
    }
    for (const c of caseFile.contradictions) {
      if (!next.contradictions.includes(c.id) && check(c.detectedWhen, next)) {
        next = { ...next, contradictions: [...next.contradictions, c.id] };
      }
    }
    if (next === before) return next;
  }
}

export function reduceGame(run: RunState, event: GameEvent, caseFile: CaseFile = CASE_2317): RunState {
  const ticked = { ...run, tick: run.tick + 1 };
  switch (event.type) {
    case 'CAPTURE': {
      const slot = caseFile.worldSlots.find((s) => s.key === event.slot);
      if (!slot || !inMode(slot.minMode, run.mode) || run.variables[event.slot] || !check(slot.availableWhen, run)) return run;
      const result = validateForSlot(slot, event.raw);
      if (!result.ok) return run;
      const variable = { value: result.value, raw: result.raw, source: event.source };
      return resolve({ ...ticked, variables: { ...run.variables, [event.slot]: variable } }, caseFile);
    }
    case 'USE_FALLBACK': {
      const slot = caseFile.worldSlots.find((s) => s.key === event.slot);
      if (!slot || !inMode(slot.minMode, run.mode) || run.variables[event.slot]) return run;
      const variable = { value: slot.fallbackValue, raw: slot.fallbackValue, source: 'fallback' as const };
      return resolve({ ...ticked, variables: { ...run.variables, [event.slot]: variable } }, caseFile);
    }
    case 'STATEMENT': {
      if (!run.suspects.includes(event.suspectId)) return run;
      const statement = { id: event.statementId, suspectId: event.suspectId, text: event.text, at: ticked.tick };
      return resolve({ ...ticked, statements: [...run.statements, statement] }, caseFile);
    }
    case 'SET_FLAG':
      return resolve({ ...ticked, flags: add(run.flags, event.flag) }, caseFile);
    case 'LINK': {
      if (run.links.some((l) => sameLink(l, event))) return run;
      return { ...ticked, links: [...run.links, { a: event.a, b: event.b }] };
    }
    case 'NEXT_CHAPTER': {
      const chapter = caseFile.chapters.find((c) => c.number === run.chapter);
      if (chapter && !check(chapter.completeWhen, run)) return run;
      return resolve({ ...ticked, chapter: run.chapter + 1 }, caseFile);
    }
    case 'ACCUSE': {
      if (run.accusation) return run;
      return { ...ticked, accusation: { suspectId: event.suspectId, correct: isAccusationSound(run, event.suspectId, caseFile) } };
    }
  }
}

/** Rule 7: an accusation needs the right suspect AND the evidence AND the proven contradiction. */
export function isAccusationSound(run: RunState, suspectId: SuspectId, caseFile: CaseFile = CASE_2317): boolean {
  const { requiredEvidence, requiredContradictions } = caseFile.accusation;
  return (
    suspectId === caseFile.truth.culprit &&
    requiredEvidence.every((id) => run.evidence.includes(id)) &&
    requiredContradictions.every((id) => run.contradictions.includes(id))
  );
}

export function isChapterComplete(run: RunState, caseFile: CaseFile = CASE_2317): boolean {
  const chapter = caseFile.chapters.find((c) => c.number === run.chapter);
  return !!chapter && check(chapter.completeWhen, run);
}

export function sameLink(x: { a: string; b: string }, y: { a: string; b: string }): boolean {
  return (x.a === y.a && x.b === y.b) || (x.a === y.b && x.b === y.a);
}

// ---- Views: Case File content rendered with the player's own world ----

export function evidenceView(run: RunState, caseFile: CaseFile = CASE_2317) {
  return caseFile.evidence
    .filter((e) => run.evidence.includes(e.id))
    .map((e) => ({
      id: e.id,
      title: e.title,
      fileName: render(e.fileName, run, caseFile),
      lines: e.lines.map((l) => render(l, run, caseFile)),
    }));
}

export function messageView(run: RunState, id: string, caseFile: CaseFile = CASE_2317) {
  const m = caseFile.messages.find((x) => x.id === id);
  if (!m || !run.messages.includes(id)) return undefined;
  return { ...m, lines: m.lines.map((l) => render(l, run, caseFile)) };
}

export function contradictionView(run: RunState, caseFile: CaseFile = CASE_2317) {
  return caseFile.contradictions
    .filter((c) => run.contradictions.includes(c.id))
    .map((c) => ({ id: c.id, suspectId: c.suspectId, level: c.level, label: render(c.label, run, caseFile) }));
}

export function chapterSummary(run: RunState, caseFile: CaseFile = CASE_2317) {
  const chapter = caseFile.chapters.find((c) => c.number === run.chapter);
  return {
    title: chapter?.title ?? `Chapitre ${run.chapter}`,
    evidence: run.evidence.length,
    variables: Object.keys(run.variables).length,
    suspects: run.suspects.length,
    contradictions: run.contradictions.length,
    code: adaptiveCode(run, caseFile),
    closing: chapter?.closing ?? [],
  };
}
