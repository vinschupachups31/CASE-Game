// Every line spoken aloud in the game, in one place: the source for recorded voices.
// Lines come from the Case File (the truth stays there); only call openings are written here.
// Text messages (Sarah, the unknown number) are read, not heard.

import { CASE_2317 } from '../cases/23-17';
import { SuspectId } from '../types/case';

export type Speaker = 'nora' | SuspectId;
export type VoiceLine = { id: string; speaker: Speaker; text: string; direction: string };

export const CALL_OPENINGS: Record<'leo' | 'marc', string> = {
  leo: 'Allô ? … Qui êtes-vous ? Comment vous avez eu ce numéro ?',
  marc: CASE_2317.messages.find((m) => m.id === 'marc_01')!.lines.join(' '),
};

/** Acting notes, sent with the text when the voices are generated. */
export const CASTING: Record<Speaker, string> = {
  nora: 'Femme, 32 ans, journaliste. Message enregistré en urgence, voix basse, essoufflée, peur contenue.',
  leo: 'Homme, 30-35 ans, ex de Nora. Nerveux, sur la défensive, phrases courtes, cache quelque chose.',
  sarah: 'Femme, 30-35 ans, collègue et meilleure amie de Nora. Rapide, inquiète, prudente.',
  marc: 'Homme, 50-55 ans, source de Nora. Calme, posé, chaleureux en surface, manipulateur.',
};

const ALL_LINES: VoiceLine[] = [
  { id: 'nora_message', speaker: 'nora', text: CASE_2317.opening.audio.join(' '), direction: CASTING.nora },
  { id: 'leo_opening', speaker: 'leo', text: CALL_OPENINGS.leo, direction: CASTING.leo },
  { id: 'marc_opening', speaker: 'marc', text: CALL_OPENINGS.marc, direction: CASTING.marc },
  ...(Object.keys(CASE_2317.topics) as SuspectId[]).flatMap((s) =>
    CASE_2317.topics[s].map((t) => ({ id: t.id, speaker: s as Speaker, text: t.answer, direction: CASTING[s] })),
  ),
  // Reactions driven by the call's psychology.
  ...CASE_2317.suspects.flatMap((s) =>
    (Object.keys(s.psyche.lines) as (keyof typeof s.psyche.lines)[]).map((k) => ({
      id: `${s.id}_${k}`,
      speaker: s.id as Speaker,
      text: s.psyche.lines[k],
      direction: CASTING[s.id],
    })),
  ),
  // A suspect's default line when a question hits no topic.
  ...CASE_2317.suspects.map((s) => ({ id: `${s.id}_claim`, speaker: s.id as Speaker, text: s.claim, direction: CASTING[s.id] })),
];

/** Unique lines (a claim and a topic answer can share the same words). */
export const VOICE_LINES: VoiceLine[] = ALL_LINES.filter(
  (l, i) => ALL_LINES.findIndex((x) => x.speaker === l.speaker && x.text === l.text) === i,
);

const byText = new Map(VOICE_LINES.map((l) => [`${l.speaker}|${l.text}`, l.id]));

/** Finds the recorded line for what a character is about to say, if there is one. */
export function lineIdFor(speaker: Speaker, text: string): string | undefined {
  return byText.get(`${speaker}|${text}`);
}
