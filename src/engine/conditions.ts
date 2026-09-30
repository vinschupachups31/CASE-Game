import { Condition } from '../types/case';
import { RunState } from '../types/run';

export function check(condition: Condition, run: RunState): boolean {
  if ('all' in condition) return condition.all.every((c) => check(c, run));
  if ('any' in condition) return condition.any.some((c) => check(c, run));
  if ('not' in condition) return !check(condition.not, run);
  if ('variable' in condition) return run.variables[condition.variable] !== undefined;
  if ('evidence' in condition) return run.evidence.includes(condition.evidence);
  if ('flag' in condition) return run.flags.includes(condition.flag);
  if ('statement' in condition) return run.statements.some((s) => s.id === condition.statement);
  if ('message' in condition) return run.messages.includes(condition.message);
  if ('suspect' in condition) return run.suspects.includes(condition.suspect);
  if ('contradiction' in condition) return run.contradictions.includes(condition.contradiction);
  return run.chapter >= condition.chapter;
}
