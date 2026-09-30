import { CaseFile, WorldSlotKey } from '../types/case';
import { RunState } from '../types/run';

/** Adaptive code built from the environment, e.g. 1927-A. */
export function adaptiveCode(run: RunState, caseFile: CaseFile): string {
  const slot = (key: 'WORLD_01' | 'WORLD_02') =>
    run.variables[key]?.value ?? caseFile.worldSlots.find((s) => s.key === key)!.fallbackValue;
  return `${slot('WORLD_01')}-${slot('WORLD_02')}`;
}

/** Replaces {WORLD_01}, {WORLD_02} and {CODE} with the values of this run. */
export function render(template: string, run: RunState, caseFile: CaseFile): string {
  return template.replace(/\{(WORLD_0[123]|CODE)\}/g, (match, key: string) => {
    if (key === 'CODE') return adaptiveCode(run, caseFile);
    return run.variables[key as WorldSlotKey]?.value ?? match;
  });
}

/** Lowercase, accent-free text for local matching. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}
