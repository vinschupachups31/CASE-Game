// Notebook / evidence board: appears once the player knows enough, and tells facts from hypotheses.

import { CaseFile } from '../types/case';
import { RunState } from '../types/run';
import { CASE_2317 } from '../cases/23-17';
import { check } from './conditions';
import { sameLink } from './gameEngine';
import { render } from './templates';

export type LinkStatus = 'FAIT ÉTABLI' | 'HYPOTHÈSE — PREUVES INSUFFISANTES';

export function isNotebookAvailable(run: RunState): boolean {
  return run.evidence.length >= 1 && run.suspects.length >= 1;
}

export function notebookNodes(run: RunState, caseFile: CaseFile = CASE_2317): { id: string; label: string }[] {
  return [
    { id: 'nora', label: caseFile.victim.name.split(' ')[0].toUpperCase() },
    ...caseFile.suspects.filter((s) => run.suspects.includes(s.id)).map((s) => ({ id: s.id, label: s.name.split(' ')[0].toUpperCase() })),
  ];
}

export function linkStatus(run: RunState, a: string, b: string, caseFile: CaseFile = CASE_2317) {
  const def = caseFile.links.find((l) => sameLink(l, { a, b }));
  const established = !!def && check(def.supportedBy, run);
  return {
    status: (established ? 'FAIT ÉTABLI' : 'HYPOTHÈSE — PREUVES INSUFFISANTES') as LinkStatus,
    label: established ? render(def!.label, run, caseFile) : undefined,
  };
}

export function notebookLinks(run: RunState, caseFile: CaseFile = CASE_2317) {
  return run.links.map((l) => ({ ...l, ...linkStatus(run, l.a, l.b, caseFile) }));
}
