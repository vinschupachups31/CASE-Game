// Case File: the immutable truth of an affair. Nothing in a run can modify it.

export type SuspectId = 'leo' | 'sarah' | 'marc';
export type CharacterId = SuspectId | 'unknown';

/** Environment slots filled by what the player finds in the real world. */
export type WorldSlotKey = 'WORLD_01' | 'WORLD_02' | 'WORLD_03';

/** Run length. Longer runs add story elements (people, items, false leads), never a different truth. */
export type Mode = 'short' | 'normal' | 'immersive';

export type ChallengeKind =
  | 'visible_year'
  | 'visible_word'
  | 'visible_number'
  | 'color'
  | 'audio_memory'
  | 'photo_observation';

/** Declarative condition evaluated against the run state. */
export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { variable: WorldSlotKey }
  | { evidence: string }
  | { flag: string }
  | { statement: string }
  | { message: string }
  | { suspect: SuspectId }
  | { contradiction: string }
  | { chapter: number };

export type Fact = { id: string; text: string };

export type TimelineEntry = { time: string; factId: string; text: string };

export type Lie = {
  /** Statement id recorded when the suspect says it. */
  statementId: string;
  statement: string;
  /** Canonical fact the lie hides. */
  hidesFactId: string;
};

/** How the player speaks: each person reacts differently to each tone. */
export type Tone = 'empathy' | 'neutral' | 'pressure' | 'evidence';
export type Effect = { trust: number; tension: number };

export type IntroId = 'close' | 'honest' | 'blunt';

/** Psychology of a person on the phone. Trust opens doors; tension past the limit ends the call. */
export type Psyche = {
  temperament: string;
  /** What the player knows about them before calling. */
  cue: string;
  trust: number;
  tensionLimit: number;
  tones: Record<Tone, Effect>;
  intros: Record<IntroId, Effect>;
  lines: {
    /** When the player asks before introducing themselves. */
    suspicious: string;
    /** When a question needs more trust than they have. */
    evasive: string;
    /** When tension reaches the limit. */
    hangup: string;
    /** After an introduction that lands well. */
    warm: string;
    /** After an introduction that lands badly. */
    cold: string;
  };
};

export type Suspect = {
  psyche: Psyche;
  id: SuspectId;
  name: string;
  role: string;
  /** Public claim, what the suspect says first. */
  claim: string;
  knownFacts: string[];
  lies: Lie[];
  forbidden: string[];
  objective: string;
  /** When the suspect becomes available for interrogation. */
  availableWhen: Condition;
};

export type EvidenceDef = {
  /** Shortest mode in which this item appears (default: every mode). */
  minMode?: Mode;
  id: string;
  title: string;
  /** Template; `{WORLD_01}`, `{WORLD_02}` and `{CODE}` are replaced from the run. */
  fileName: string;
  lines: string[];
  unlockWhen: Condition;
  /** Suspects revealed by this evidence. */
  reveals?: SuspectId[];
};

export type WorldSlotDef = {
  minMode?: Mode;
  key: WorldSlotKey;
  challenge: ChallengeKind;
  prompt: string;
  /** Used when the environment cannot provide the value, so a run is never blocked. */
  fallbackValue: string;
  availableWhen: Condition;
};

export type ContradictionDef = {
  id: string;
  suspectId: SuspectId;
  label: string;
  /** 'potential' = suspicious, 'established' = proven by evidence. */
  level: 'potential' | 'established';
  detectedWhen: Condition;
};

export type TopicDef = {
  id: string;
  /** Lowercased, accent-free regex sources matched against the question. */
  patterns: string[];
  answer: string;
  requires?: Condition;
  /** Statement recorded in the run when this answer is given. */
  statementId?: string;
  /** Trust needed before they say this (a lie needs none: lying is a defence). */
  minTrust?: number;
  /** Flag set in the run when this answer is given. */
  setsFlag?: string;
};

export type MessageDef = {
  id: string;
  from: CharacterId;
  lines: string[];
  triggerWhen: Condition;
  /** Replies offered to the player; each one is remembered as a flag. */
  replies?: { id: string; label: string; setsFlag: string }[];
};

export type LinkDef = { a: string; b: string; label: string; supportedBy: Condition };

export type ChapterDef = {
  number: number;
  title: string;
  completeWhen: Condition;
  closing: string[];
};

/** Secondary character: a witness, never a suspect. Adds texture and leads, never changes the truth. */
export type WitnessDef = {
  id: string;
  name: string;
  role: string;
  minMode: Mode;
  /** Designer summary; must agree with the canonical timeline. */
  testimony: string;
  /** Where the player reaches them (by phone). */
  place: string;
  /** What they say, first person. */
  lines: string[];
  /** Flag set once the player has heard them. */
  setsFlag: string;
};

/** A lead that points the wrong way. `why` records, for designers, why it is false. */
export type FalseLeadDef = {
  id: string;
  title: string;
  pointsTo: SuspectId;
  minMode: Mode;
  clue: string;
  why: string;
  /** Who it seems to come from, as the player sees it. */
  from: string;
  /** Flag set once the player has seen it; the verdict explains the leads they followed. */
  setsFlag: string;
};

/** Layer of a portrait. A portrait starts as a bare silhouette; each layer is discovered in play. */
export type PortraitPart = 'hair' | 'top' | 'accessory';

/** A visible detail of a person, learned from a concrete source (a photo, a message, a witness). */
export type AppearanceTrait = {
  id: string;
  part: PortraitPart;
  /** What the player now knows, e.g. "Sweat gris à capuche". */
  label: string;
  /** Where it comes from, shown with the detail. */
  source: string;
  revealWhen: Condition;
  /** Shortest mode in which this detail can be found (default: every mode). */
  minMode?: Mode;
};

/** A moment of the evening the player can place on their timeline once they have the clue for it. */
export type TimeClue = { time: string; label: string; revealWhen: Condition; evidenceId?: string };

export type CaseFile = {
  id: string;
  title: string;
  victim: { name: string; age: number; occupation: string };
  opening: { date: string; time: string; audio: string[]; scheduledMessage: string };
  truth: { culprit: SuspectId; facts: Fact[] };
  timeline: TimelineEntry[];
  suspects: Suspect[];
  worldSlots: WorldSlotDef[];
  evidence: EvidenceDef[];
  contradictions: ContradictionDef[];
  topics: Record<SuspectId, TopicDef[]>;
  messages: MessageDef[];
  links: LinkDef[];
  chapters: ChapterDef[];
  witnesses: WitnessDef[];
  falseLeads: FalseLeadDef[];
  accusation: { requiredEvidence: string[]; requiredContradictions: string[] };
  appearance: Record<SuspectId, AppearanceTrait[]>;
  /** The player's timeline: what they know of the evening, in order. */
  clues: TimeClue[];
};
