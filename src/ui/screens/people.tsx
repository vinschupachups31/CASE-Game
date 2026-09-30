import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CASE_2317 } from '../../cases/23-17';
import { evidenceView, messageView } from '../../engine/gameEngine';
import { CallState, INTROS, askInCall, introduce, moodOf, startCall } from '../../engine/callEngine';
import { SuspectId, Tone } from '../../types/case';
import { RunState } from '../../types/run';
import { Flow, Stage, progressOf } from '../flow';
import { haptic } from '../haptics';
import { PhoneIcon } from '../icons';
import { Portrait } from '../portraits';
import { Chip, Eyebrow, Flex, PrimaryButton, Screen, Spacer, T } from '../kit';
import { Glitch, Pulse, Reveal, Typing, Waveform, WordReveal } from '../motion';
import { color, radius } from '../theme';
import { estimateMs, speak, stopVoice } from '../voice';

const suspectOf = (id: SuspectId) => CASE_2317.suspects.find((s) => s.id === id)!;
// ---------- Ring: outgoing (the player calls) or incoming (they call the player). ----------

export function Ring({ flow, suspectId, incoming, next }: { flow: Flow; suspectId: SuspectId; incoming?: boolean; next: Stage }) {
  const s = suspectOf(suspectId);
  const [declined, setDeclined] = useState(0);
  useEffect(() => {
    haptic.ring();
    const loop = setInterval(haptic.ring, 1400);
    const connect = incoming ? undefined : setTimeout(() => flow.go(next), 3200);
    return () => {
      clearInterval(loop);
      if (connect) clearTimeout(connect);
    };
  }, []);
  return (
    <Screen bare style={{ backgroundColor: color.black }}>
      <Spacer h={48} />
      <Reveal>
        <View style={{ alignItems: 'center' }}>
          <Eyebrow red={incoming}>{incoming ? 'Appel entrant' : 'Appel en cours'}</Eyebrow>
        </View>
      </Reveal>
      <Flex />
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 240, height: 240, alignItems: 'center', justifyContent: 'center' }}>
          <Pulse size={240} tint={incoming ? color.red : color.ink} period={1800} />
          <Portrait id={s.id} size={128} />
        </View>
        <Spacer h={24} />
        <Text style={[T.display, { textAlign: 'center' }]}>{s.name.split(' ')[0]}</Text>
        <Text style={[T.title, T.italic, { textAlign: 'center', color: color.muted }]}>{s.name.split(' ').slice(1).join(' ')}</Text>
        <Spacer h={8} />
        <Text style={T.caption}>{declined ? 'Il insiste.' : s.role}</Text>
        <Spacer h={16} />
        <Text style={[T.body, T.italic, { textAlign: 'center', color: color.muted, fontFamily: T.body.fontFamily }]}>{s.psyche.cue}</Text>
      </View>
      <Flex />
      {incoming ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 32 }}>
          <RoundButton
            tint={color.red}
            label="Refuser"
            down
            onPress={() => {
              haptic.warning();
              setDeclined((d) => d + 1);
            }}
          />
          <RoundButton tint={color.ink} label="Décrocher" onPress={() => flow.go(next)} />
        </View>
      ) : (
        <Text style={[T.mono, { textAlign: 'center', marginBottom: 48 }]}>CONNEXION…</Text>
      )}
    </Screen>
  );
}

function RoundButton({ tint, label, onPress, down }: { tint: string; label: string; onPress: () => void; down?: boolean }) {
  // The whole column is the target: thumbs aim at the label as often as at the circle.
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic.press();
        onPress();
      }}
      style={{ alignItems: 'center', gap: 8, padding: 8 }}
    >
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
        <PhoneIcon tint={tint === color.ink ? color.bg : color.ink} down={down} />
      </View>
      <Text style={T.caption}>{label}</Text>
    </Pressable>
  );
}

// ---------- Interrogation: introduce yourself, read the person, adapt your tone. ----------

export type Question = { text: string; tone: Tone };

const QUESTIONS: Record<SuspectId, Question[]> = {
  leo: [
    { text: 'Nora vous a appelé à 21:53 ?', tone: 'neutral' },
    { text: 'Vous devez être inquiet. Où étiez-vous après son appel ?', tone: 'empathy' },
    { text: 'Arrêtez de mentir. Vous l’avez suivie ?', tone: 'pressure' },
    { text: 'Que savez-vous de Sarah ?', tone: 'neutral' },
  ],
  sarah: [
    { text: 'Sur quoi Nora enquêtait-elle ?', tone: 'neutral' },
    { text: 'Pourquoi Léo mentirait ?', tone: 'empathy' },
    { text: 'Vous connaissez Marc Delcourt ?', tone: 'neutral' },
    { text: 'Vous lui avez donné des fichiers. Pourquoi le cacher ?', tone: 'pressure' },
  ],
  marc: [
    { text: 'Où étiez-vous à 22:41 ?', tone: 'neutral' },
    { text: 'Vous connaissez Sarah Klein ?', tone: 'neutral' },
    { text: 'Vous teniez à Nora, n’est-ce pas ?', tone: 'empathy' },
    { text: 'Comment connaissez-vous {WORLD_01} ?', tone: 'pressure' },
  ],
};

const TONE_TAG: Record<Tone, string> = { empathy: 'doux', neutral: 'neutre', pressure: 'dur', evidence: 'preuve' };

const PRESENT: Record<string, string> = {
  e01: 'Journal d’appels : Nora vous appelle à 21:53.',
  e02: 'Le dossier de Nora cite Marc Delcourt comme source.',
  e03: 'Nora a écrit : « M.D. sait que Sarah m’a donné les fichiers. »',
};

export function Interrogation({
  flow,
  suspectId,
  canHangUp,
  hint,
  next,
  opening,
  grudge,
  questions = [],
}: {
  flow: Flow;
  suspectId: SuspectId;
  /** They start colder: the player snubbed them earlier. */
  grudge?: boolean;
  /** Questions that only make sense at this point of the story. */
  questions?: Question[];
  canHangUp: (run: RunState) => boolean;
  hint: string;
  next: Stage;
  /** First words of the call, spoken before the player says anything. */
  opening: string;
}) {
  const s = suspectOf(suspectId);
  const [call, setCall] = useState<CallState>(() => startCall(suspectId, 0, grudge));
  const [tab, setTab] = useState<'intro' | 'questions' | 'evidence'>('intro');
  const [asked, setAsked] = useState<string[]>([]);
  const [current, setCurrent] = useState<{ q: string; a: string; guarded?: boolean }>();
  const [speaking, setSpeaking] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const world01 = flow.run.variables.WORLD_01?.value ?? '';

  const turn = useRef(0);
  function say(q: string, a: string, guarded?: boolean) {
    const mine = ++turn.current;
    setCurrent({ q, a, guarded });
    setSpeaking(true);
    speak(a, suspectId, () => mine === turn.current && setSpeaking(false));
  }

  useEffect(() => {
    const t = setInterval(() => setSeconds((x) => x + 1), 1000);
    const hello = setTimeout(() => say('', opening), 700);
    return () => {
      clearTimeout(hello);
      clearInterval(t);
      stopVoice();
    };
  }, []);

  function react(before: CallState, after: CallState) {
    if (after.hungUp) haptic.alarm();
    else if (after.tension > before.tension + 15) haptic.warning();
  }

  // Tapping while they talk cuts them off, like a real call.
  function present(intro: (typeof INTROS)[number]) {
    const r = introduce(call, intro.id);
    react(call, r.state);
    setCall(r.state);
    setTab('questions');
    say(intro.text, r.text);
  }

  function put(label: string, question: string, tone: Tone) {
    const r = askInCall(call, flow.run, question, tone);
    react(call, r.state);
    flow.apply(...r.events);
    setCall(r.state);
    setAsked((a) => [...a, label]);
    say(question, r.text, r.guarded);
  }

  function callBack() {
    const fresh = startCall(suspectId, call.hangups, grudge);
    setCall(fresh);
    setTab('intro');
    say('', suspectOf(suspectId).psyche.lines.suspicious);
  }

  const evidence = evidenceView(flow.run);
  const ready = canHangUp(flow.run);
  const clock = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const mood = moodOf(call);
  const tense = mood === 'À bout' || mood === 'Sur la défensive';
  const limit = s.psyche.tensionLimit;

  return (
    <Screen
      bare
      footer={
        call.hungUp ? (
          <PrimaryButton label={`Rappeler ${s.name.split(' ')[0]}`} onPress={callBack} />
        ) : (
          <>
            {!ready && asked.length >= 2 && <Text style={[T.caption, { textAlign: 'center' }]}>{hint}</Text>}
            <PrimaryButton tone="red" label="Raccrocher" disabled={!ready || speaking} onPress={() => flow.go(next)} />
          </>
        )
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Portrait id={s.id} size={48} ring={call.hungUp ? color.red : color.lineHi} />
        <View style={{ flex: 1 }}>
          <Text style={T.bodyStrong}>{s.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: call.hungUp || tense ? color.red : color.inkSoft }} />
            <Text style={[T.caption, (call.hungUp || tense) && { color: color.red }]}>{call.hungUp ? 'A raccroché' : mood}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: call.hungUp ? color.faint : color.red }} />
            <Text style={[T.mono, { color: call.hungUp ? color.faint : color.red }]}>{call.hungUp ? 'FIN' : 'REC'}</Text>
          </View>
          <Text style={T.mono}>{clock}</Text>
        </View>
      </View>
      {/* Tension: the player reads the person, not a score. */}
      <View style={{ height: 2, backgroundColor: color.line, marginTop: 16, borderRadius: 1, overflow: 'hidden' }}>
        <View style={{ height: 2, width: `${Math.min(100, (call.tension / limit) * 100)}%`, backgroundColor: tense || call.hungUp ? color.red : color.inkSoft }} />
      </View>

      <View style={{ alignItems: 'center', marginVertical: 24 }}>
        <Waveform active={speaking} bars={40} height={56} />
      </View>

      <View style={{ minHeight: 144, flexShrink: 1 }}>
        {current ? (
          <>
            {current.q ? <Text style={T.caption}>Toi — {current.q}</Text> : <Text style={T.caption}>{s.name.split(' ')[0]}</Text>}
            <Spacer h={8} />
            <WordReveal
              key={current.q + asked.length + call.hangups}
              text={current.a}
              style={[T.title, current.guarded && { color: color.inkSoft }]}
              perWord={Math.round(estimateMs(current.a) / current.a.split(' ').length)}
            />
          </>
        ) : (
          <Text style={[T.title, T.italic, { color: color.faint }]}>« Allô ? »</Text>
        )}
      </View>

      <Flex />
      {call.hungUp ? (
        <Reveal>
          <Text style={[T.body, { textAlign: 'center', marginBottom: 16 }]}>
            {s.name.split(' ')[0]} a raccroché. Tu peux rappeler, mais {s.id === 'sarah' ? 'elle' : 'il'} sera plus méfiant{s.id === 'sarah' ? 'e' : ''}.
          </Text>
        </Reveal>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 24, marginBottom: 16 }}>
            {(call.introduced ? (['questions', 'evidence'] as const) : (['intro', 'questions', 'evidence'] as const)).map((k) => (
              <Pressable key={k} onPress={() => setTab(k)} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: tab === k ? color.ink : 'transparent' }}>
                <Text style={[T.label, { color: tab === k ? color.ink : color.muted }]}>
                  {k === 'intro' ? 'Se présenter' : k === 'questions' ? 'Questions' : `Preuves · ${evidence.length}`}
                </Text>
              </Pressable>
            ))}
          </View>
          <ScrollView style={{ maxHeight: 216, flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
            {tab === 'intro'
              ? INTROS.map((i) => <Chip key={i.id} label={i.label} icon="↳" onPress={() => present(i)} />)
              : tab === 'questions'
                ? [...QUESTIONS[suspectId], ...questions].map((q) => {
                    const text = q.text.replace('{WORLD_01}', world01);
                    return <Chip key={q.text} label={text} icon={asked.includes(text) ? '✓' : TONE_TAG[q.tone]} onPress={() => put(text, text, q.tone)} />;
                  })
                : evidence.map((e) => (
                    <Chip key={e.id} label={`Présenter ${e.fileName}`} icon="preuve" onPress={() => put(e.fileName, PRESENT[e.id] ?? e.title, 'evidence')} />
                  ))}
          </ScrollView>
        </>
      )}
    </Screen>
  );
}

// ---------- Messages: Sarah writes first. ----------

type Bubble = { from: 'them' | 'me' | 'meta'; text: string };

function useScript(lines: string[], gap = 1100) {
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(true);
  useEffect(() => {
    if (shown >= lines.length) return setTyping(false);
    setTyping(true);
    const t = setTimeout(() => {
      setShown((n) => n + 1);
      haptic.tap();
    }, gap);
    return () => clearTimeout(t);
  }, [shown, lines.length]);
  return { shown, typing: typing && shown < lines.length };
}

function Thread({ bubbles, typing, redWord }: { bubbles: Bubble[]; typing: boolean; redWord?: string }) {
  const scroll = useRef<ScrollView>(null);
  return (
    <ScrollView ref={scroll} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })} contentContainerStyle={{ gap: 8, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
      {bubbles.map((b, i) =>
        b.from === 'meta' ? (
          <Text key={i} style={[T.mono, { alignSelf: 'flex-end' }]}>
            {b.text}
          </Text>
        ) : (
          <Reveal key={i} from={8} duration={380}>
            <View
              style={{
                alignSelf: b.from === 'me' ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                backgroundColor: b.from === 'me' ? color.ink : color.surfaceHi,
                borderRadius: radius.l,
                borderBottomLeftRadius: b.from === 'them' ? 8 : radius.l,
                borderBottomRightRadius: b.from === 'me' ? 8 : radius.l,
                paddingVertical: 12,
                paddingHorizontal: 16,
              }}
            >
              <Text style={[T.body, { color: b.from === 'me' ? color.bg : color.ink }]}>
                {redWord && b.text.includes(redWord)
                  ? b.text.split(redWord).map((part, j, arr) => (
                      <Text key={j}>
                        {part}
                        {j < arr.length - 1 && <Text style={{ color: color.red, textDecorationLine: 'underline' }}>{redWord}</Text>}
                      </Text>
                    ))
                  : b.text}
              </Text>
            </View>
          </Reveal>
        ),
      )}
      {typing && (
        <View style={{ alignSelf: 'flex-start', backgroundColor: color.surfaceHi, borderRadius: radius.l, borderBottomLeftRadius: 8, paddingVertical: 8, paddingHorizontal: 16 }}>
          <Typing />
        </View>
      )}
    </ScrollView>
  );
}

export function SarahMessages({ flow, next }: { flow: Flow; next: Stage }) {
  const m = messageView(flow.run, 'sarah_01');
  const [choice, setChoice] = useState<string>();
  const opening = m?.lines ?? [];
  const follow = choice === 'reply' ? ['Pas par message.', 'Continuez votre route. Je vous recontacterai.'] : [];
  const script = [...opening, ...follow];
  const { shown, typing } = useScript(script);

  const bubbles: Bubble[] = [];
  opening.slice(0, Math.min(shown, opening.length)).forEach((t) => bubbles.push({ from: 'them', text: t }));
  if (choice === 'reply') bubbles.push({ from: 'me', text: 'Je vous écoute.' });
  if (choice === 'ignore') bubbles.push({ from: 'meta', text: 'VU' });
  follow.slice(0, Math.max(0, shown - opening.length)).forEach((t) => bubbles.push({ from: 'them', text: t }));

  const waitingChoice = !choice && shown >= opening.length;

  return (
    <Screen
      bare
      footer={
        waitingChoice ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {m?.replies?.map((r) => (
              <View key={r.id} style={{ flex: 1 }}>
                <Chip
                  label={r.id === 'reply' ? 'Répondre' : 'Plus tard'}
                  selected={r.id === 'reply'}
                  onPress={() => {
                    flow.apply({ type: 'SET_FLAG', flag: r.setsFlag });
                    setChoice(r.id);
                  }}
                />
              </View>
            ))}
          </View>
        ) : choice && !typing ? (
          <Reveal>
            <PrimaryButton label="Reprendre la mission" onPress={() => flow.go(next)} />
          </Reveal>
        ) : null
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Portrait id="sarah" size={48} />
        <View>
          <Text style={T.bodyStrong}>Sarah Klein</Text>
          <Text style={T.caption}>Collègue de Nora · en ligne</Text>
        </View>
      </View>
      <Thread bubbles={bubbles} typing={typing && !waitingChoice} />
      {choice === 'ignore' && <Text style={[T.caption, { textAlign: 'center', marginBottom: 16 }]}>Sarah s’en souviendra.</Text>}
    </Screen>
  );
}

// ---------- Walk → the signature moment. ----------

export function Walk({ flow, next }: { flow: Flow; next: Stage }) {
  const stop = flow.terrain.stops[2];
  useEffect(() => {
    flow.apply({ type: 'SET_FLAG', flag: 'WALKING_TO_ZONE_3' });
    const t = setTimeout(() => flow.go(next), 4200);
    return () => clearTimeout(t);
  }, []);
  return (
    <Screen progress={progressOf(flow.stage)}>
      <Eyebrow>Mission 03 · Confrontation</Eyebrow>
      <Flex />
      <Reveal>
        <Text style={T.display}>
          Continue{'\n'}
          <Text style={T.italic}>à marcher.</Text>
        </Text>
      </Reveal>
      <Spacer h={24} />
      <Reveal delay={300}>
        <Text style={T.body}>{stop.type === 'place' ? `Prochain point : ${stop.place.name.toLowerCase()}, ${stop.place.distanceM} m.` : 'Reste où tu es. Écoute.'}</Text>
      </Reveal>
      <Flex />
    </Screen>
  );
}

export function Threat({ flow, next }: { flow: Flow; next: Stage }) {
  const m = messageView(flow.run, 'threat_01');
  const value = flow.run.variables.WORLD_01?.value ?? '';
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setStarted(true);
      haptic.alarm();
    }, 1200);
    return () => clearTimeout(t);
  }, []);
  const lines = started ? m?.lines ?? [] : [];
  const { shown, typing } = useScript(lines, 1500);
  const done = started && shown >= lines.length;
  const minutes = flow.capturedAt ? Math.max(1, Math.round((Date.now() - flow.capturedAt) / 60000)) : undefined;

  useEffect(() => {
    if (!done) return;
    haptic.warning();
    const t = setTimeout(() => flow.go(next), 4200);
    return () => clearTimeout(t);
  }, [done]);

  return (
    <Screen bare style={{ backgroundColor: color.black }}>
      {started && (
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <Portrait id="unknown" size={64} ring={color.redLine} />
          <Spacer h={16} />
          <Glitch style={[T.label, { color: color.red, letterSpacing: 4 }]}>NUMÉRO INCONNU</Glitch>
          <Text style={[T.mono, { marginTop: 8 }]}>+33 · · · · · · · · ·</Text>
        </View>
      )}
      <Flex />
      <Thread bubbles={lines.slice(0, shown).map((t) => ({ from: 'them', text: t }))} typing={started && typing} redWord={value} />
      {done && (
        <Reveal delay={600}>
          <Text style={[T.title, T.italic, { textAlign: 'center', color: color.muted }]}>
            {minutes ? `Tu as trouvé ${value} il y a ${minutes} min.` : `${value}. C’est toi qui l’as trouvé.`}
          </Text>
        </Reveal>
      )}
      <Flex />
    </Screen>
  );
}
