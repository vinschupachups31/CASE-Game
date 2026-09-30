// Run modes: a longer run adds story (people, items, leads). It never changes the truth or the difficulty.

import { CaseFile, Mode } from '../types/case';
import { CASE_2317 } from '../cases/23-17';

const RANK: Record<Mode, number> = { short: 0, normal: 1, immersive: 2 };

/** True when an element with this minimum mode belongs to a run of `mode`. */
export function inMode(minMode: Mode | undefined, mode: Mode): boolean {
  return RANK[minMode ?? 'short'] <= RANK[mode];
}

/** What a run of this mode contains — shown to the player before choosing. */
export function modeScope(mode: Mode, caseFile: CaseFile = CASE_2317) {
  const evidence = caseFile.evidence.filter((e) => inMode(e.minMode, mode) && !isLaterChapter(e.unlockWhen));
  return {
    suspects: caseFile.suspects.length,
    witnesses: caseFile.witnesses.filter((w) => inMode(w.minMode, mode)),
    evidence: evidence.length,
    falseLeads: caseFile.falseLeads.filter((f) => inMode(f.minMode, mode)),
    worldPuzzles: caseFile.worldSlots.filter((s) => inMode(s.minMode, mode)).length,
  };
}

function isLaterChapter(c: unknown): boolean {
  return !!c && typeof c === 'object' && 'chapter' in c;
}
