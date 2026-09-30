// Interrogation Engine (local, deterministic). Answers come from the Case File topics;
// a backend AI may later rephrase them but never change their facts.

import { CaseFile, SuspectId, TopicDef } from '../types/case';
import { GameEvent, RunState } from '../types/run';
import { CASE_2317 } from '../cases/23-17';
import { check } from './conditions';
import { normalize, render } from './templates';

export type Answer = { text: string; topicId?: string; events: GameEvent[] };

export function ask(run: RunState, suspectId: SuspectId, question: string, caseFile: CaseFile = CASE_2317): Answer {
  const suspect = caseFile.suspects.find((s) => s.id === suspectId)!;
  if (!run.suspects.includes(suspectId)) return { text: '', events: [] };

  const q = normalize(question);
  // The topic matching the most patterns wins; on a tie, the first one in the Case File.
  let topic: TopicDef | undefined;
  let best = 0;
  for (const t of caseFile.topics[suspectId]) {
    if (t.requires && !check(t.requires, run)) continue;
    const score = t.patterns.filter((p) => {
      const source = normalize(render(p, run, caseFile));
      // Skip patterns whose world variable is not captured yet.
      return !/\{WORLD_0[123]\}/i.test(source) && new RegExp(source).test(q);
    }).length;
    if (score > best) {
      best = score;
      topic = t;
    }
  }

  if (!topic) {
    return { text: suspect.claim, events: [] };
  }

  const text = render(topic.answer, run, caseFile);
  const events: GameEvent[] = [];
  if (topic.statementId) events.push({ type: 'STATEMENT', suspectId, statementId: topic.statementId, text });
  if (topic.setsFlag) events.push({ type: 'SET_FLAG', flag: topic.setsFlag });
  return { text, topicId: topic.id, events };
}
