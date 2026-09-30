// Appearance: portraits are discovered, not given. A suspect starts as a bare silhouette;
// each detail (hair, clothes, an accessory) comes from a concrete source met in play.

import { AppearanceTrait, CaseFile, SuspectId } from '../types/case';
import { RunState } from '../types/run';
import { CASE_2317 } from '../cases/23-17';
import { check } from './conditions';
import { inMode } from './modes';

export function revealedTraits(run: RunState, suspectId: SuspectId, caseFile: CaseFile = CASE_2317): AppearanceTrait[] {
  if (!run.suspects.includes(suspectId)) return [];
  return caseFile.appearance[suspectId].filter((t) => check(t.revealWhen, run));
}

/** Traits this run can ever reveal: a trait tied to a long-mode element stays hidden in a short run. */
export function reachableTraits(run: RunState, suspectId: SuspectId, caseFile: CaseFile = CASE_2317): AppearanceTrait[] {
  const longOnly = new Set(caseFile.evidence.filter((e) => !inMode(e.minMode, run.mode)).map((e) => e.id));
  return caseFile.appearance[suspectId].filter((t) => !('evidence' in t.revealWhen && longOnly.has(t.revealWhen.evidence)));
}

/** Details learned between two states of the run, for the "portrait updated" notice. */
export function newTraits(before: RunState, after: RunState, caseFile: CaseFile = CASE_2317) {
  return caseFile.suspects.flatMap((s) => {
    const known = new Set(revealedTraits(before, s.id, caseFile).map((t) => t.id));
    return revealedTraits(after, s.id, caseFile)
      .filter((t) => !known.has(t.id))
      .map((trait) => ({ suspectId: s.id, trait }));
  });
}
