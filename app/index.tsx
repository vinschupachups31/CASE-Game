import React, { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { CASE_2317 } from '../src/cases/23-17';
import { validateForSlot } from '../src/engine/challengeEngine';
import {
  chapterSummary,
  contradictionView,
  createRun,
  evidenceView,
  isChapterComplete,
  messageView,
  reduceGame,
} from '../src/engine/gameEngine';
import { ask } from '../src/engine/interrogationEngine';
import { linkStatus, notebookNodes } from '../src/engine/notebook';
import { PROFILES, Profile, simulate } from '../src/engine/simulator';
import { MODES, compass } from '../src/engine/worldEngine';
import { SuspectId, WorldSlotKey } from '../src/types/case';
import { GameEvent } from '../src/types/run';

const STAGES = [
  'brief',
  'terrain',
  'walk',
  'capture1',
  'evidence1',
  'callLeo',
  'sarah',
  'capture2',
  'evidence2',
  'board',
  'threat',
  'callMarc',
  'end',
] as const;
type Stage = (typeof STAGES)[number];

const QUESTIONS: Record<SuspectId, string[]> = {
  leo: ['Nora vous a appelé à 21:53 ?', 'Où étiez-vous après l’appel ?', 'Vous l’avez suivie ?'],
  sarah: ['Sur quoi Nora enquêtait ?', 'Léo ment ?'],
  marc: ['Où étiez-vous à 22:41 ?', 'Vous connaissez Sarah ?', 'Comment connaissez-vous {WORLD_01} ?'],
};

export default function Home() {
  const [profileId, setProfileId] = useState<Profile['id']>('dense');
  const [run, setRun] = useState(() => createRun());
  const [stage, setStage] = useState<Stage>('brief');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string>();
  const [transcript, setTranscript] = useState<{ q: string; a: string }[]>([]);

  const profile = PROFILES[profileId];
  const terrain = useMemo(() => simulate(profileId, run.mode), [profileId, run.mode]);
  const world01 = run.variables.WORLD_01?.value ?? '';

  const apply = (...events: GameEvent[]) => setRun((r) => events.reduce((acc, e) => reduceGame(acc, e), r));

  function go(next: Stage) {
    setError(undefined);
    setInput('');
    setTranscript([]);
    setStage(next);
  }

  function reset() {
    setRun(createRun());
    go('brief');
  }

  function capture(slot: WorldSlotKey, next: Stage) {
    const def = CASE_2317.worldSlots.find((s) => s.key === slot)!;
    const result = validateForSlot(def, input);
    if (!result.ok) return setError(result.reason);
    apply({ type: 'CAPTURE', slot, raw: input, source: 'manual' });
    go(next);
  }

  function fallback(slot: WorldSlotKey, next: Stage) {
    apply({ type: 'USE_FALLBACK', slot });
    go(next);
  }

  function question(suspectId: SuspectId, q: string) {
    const text = q.replace('{WORLD_01}', world01);
    const answer = ask(run, suspectId, text);
    apply(...answer.events);
    setTranscript((t) => [...t, { q: text, a: answer.text }]);
  }

  const evidence = evidenceView(run);
  const summary = chapterSummary(run);

  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={s.brand}>CASE</Text>
        <Text style={s.case}>AFFAIRE 001 / {CASE_2317.title}</Text>

        {stage === 'brief' && (
          <>
            <Text style={s.red}>DOSSIER REÇU</Text>
            <Text style={s.dim}>
              {CASE_2317.opening.date} • {CASE_2317.opening.time}
            </Text>
            <Text style={s.hero}>{CASE_2317.victim.name.toUpperCase()}</Text>
            <Text style={s.dim}>
              {CASE_2317.victim.age} ans • {CASE_2317.victim.occupation} • DISPARUE
            </Text>
            <Text style={s.quote}>« {CASE_2317.opening.audio.join(' ')} »</Text>
            <Text style={s.label}>SIMULATION</Text>
            <View style={s.row}>
              {Object.values(PROFILES).map((p) => (
                <Pill key={p.id} label={p.label} active={p.id === profileId} onPress={() => setProfileId(p.id)} />
              ))}
            </View>
          </>
        )}

        {stage === 'terrain' && (
          <>
            <Text style={s.red}>PRÉPARATION DU TERRAIN</Text>
            <Text style={s.hero}>{terrain.zonesFound} ZONES PUBLIQUES TROUVÉES</Text>
            <View style={s.row}>
              {(Object.keys(MODES) as (keyof typeof MODES)[]).map((m) => (
                <Pill key={m} label={MODES[m].label} active={run.mode === m} onPress={() => setRun((r) => ({ ...r, mode: m }))} />
              ))}
            </View>
            {terrain.stops.map((stop, i) => (
              <View style={s.line} key={stop.purpose}>
                <Text style={s.num}>0{i + 1}</Text>
                <View>
                  <Text style={s.white}>{stop.type === 'place' ? stop.place.name : 'Sur place'}</Text>
                  <Text style={s.dim}>
                    {stop.type === 'place' ? `${stop.place.distanceM} m • ` : `${stop.challenge} • `}
                    {stop.purpose}
                  </Text>
                </View>
              </View>
            ))}
            <Text style={s.dim}>
              ~{terrain.durationMin} min • {(terrain.distanceM / 1000).toFixed(1)} km
            </Text>
          </>
        )}

        {stage === 'walk' && (
          <>
            <Text style={s.red}>MISSION 01 — DERNIÈRE TRACE</Text>
            <Text style={s.copy}>À 21:53, Nora a passé un appel. Retrouvez la zone depuis laquelle il a été émis.</Text>
            {terrain.stops[0].type === 'place' ? (
              <Text style={s.big}>
                {terrain.stops[0].place.distanceM} M • {compass(terrain.stops[0].place.bearingDeg ?? 0)}
              </Text>
            ) : (
              <Text style={s.big}>SUR PLACE</Text>
            )}
            <Text style={s.hero}>RANGE TON TÉLÉPHONE.</Text>
            <Text style={s.copy}>CASE vibrera lorsque tu entreras dans la zone de recherche.</Text>
          </>
        )}

        {stage === 'capture1' && (
          <Capture
            title="CHERCHE UNE ANNÉE."
            hint="La caméra validera ce que tu trouves. En attendant, saisis-le."
            placeholder={profile.year ?? 'ex. 1927'}
            value={input}
            onChange={setInput}
            error={error}
            onSubmit={() => capture('WORLD_01', 'evidence1')}
            onFallback={() => fallback('WORLD_01', 'evidence1')}
          />
        )}

        {stage === 'evidence1' && evidence[0] && (
          <>
            <Text style={s.red}>PREUVE DÉBLOQUÉE</Text>
            <Text style={s.code}>WORLD_01 = {world01}</Text>
            <File name={evidence[0].fileName} lines={evidence[0].lines} />
            <Text style={s.copy}>Léo Vasseur est disponible pour interrogatoire.</Text>
          </>
        )}

        {stage === 'callLeo' && <Call suspectId="leo" transcript={transcript} onAsk={question} world01={world01} />}

        {stage === 'sarah' && (
          <Message id="sarah_01" run={run}>
            {!run.flags.some((f) => f.startsWith('SARAH_')) &&
              messageView(run, 'sarah_01')?.replies?.map((r) => (
                <Pill key={r.id} label={r.label} onPress={() => apply({ type: 'SET_FLAG', flag: r.setsFlag })} />
              ))}
          </Message>
        )}

        {stage === 'capture2' && (
          <Capture
            title="LE NOM ÉTAIT DEVANT MOI."
            hint="Trouve autour de toi un mot d’au moins 6 lettres."
            placeholder={profile.word ?? 'ex. PHARMACIE'}
            value={input}
            onChange={setInput}
            error={error}
            onSubmit={() => capture('WORLD_02', 'evidence2')}
            onFallback={() => fallback('WORLD_02', 'evidence2')}
          />
        )}

        {stage === 'evidence2' && (
          <>
            <Text style={s.red}>CODE {summary.code}</Text>
            {evidence
              .filter((e) => e.id === 'e02')
              .map((e) => (
                <File key={e.id} name={e.fileName} lines={e.lines} />
              ))}
            <Text style={s.hero}>MARC DELCOURT</Text>
            <Text style={s.copy}>Le troisième suspect entre dans l’enquête.</Text>
          </>
        )}

        {stage === 'board' && <Board run={run} onLink={(a, b) => apply({ type: 'LINK', a, b })} />}

        {stage === 'threat' && <Message id="threat_01" run={run} />}

        {stage === 'callMarc' && (
          <>
            <Message id="marc_01" run={run} />
            <Call suspectId="marc" transcript={transcript} onAsk={question} world01={world01} />
          </>
        )}

        {stage === 'end' && (
          <>
            <Text style={s.red}>{summary.title.toUpperCase()} TERMINÉ</Text>
            <Text style={s.copy}>
              {summary.evidence} preuves • {summary.variables} variables • {summary.suspects} suspects • {summary.contradictions}{' '}
              contradictions • code {summary.code}
            </Text>
            {contradictionView(run).map((c) => (
              <Text key={c.id} style={s.alert}>
                {c.level === 'established' ? 'CONTRADICTION' : 'CONTRADICTION POTENTIELLE'} — {c.label}
              </Text>
            ))}
            {summary.closing.map((l) => (
              <Text key={l} style={s.closing}>
                {l}
              </Text>
            ))}
          </>
        )}
      </ScrollView>

      <View style={s.bottom}>
        <Primary stage={stage} run={run} go={go} reset={reset} apply={apply} />
      </View>
    </SafeAreaView>
  );
}

function Primary({
  stage,
  run,
  go,
  reset,
  apply,
}: {
  stage: Stage;
  run: ReturnType<typeof createRun>;
  go: (s: Stage) => void;
  reset: () => void;
  apply: (...e: GameEvent[]) => void;
}) {
  const next: Partial<Record<Stage, { label: string; action: () => void; disabled?: boolean }>> = {
    brief: { label: 'OUVRIR LE DOSSIER', action: () => go('terrain') },
    terrain: { label: 'PARTIR', action: () => go('walk') },
    walk: { label: 'SIMULER : ZONE ATTEINTE', action: () => (apply({ type: 'SET_FLAG', flag: 'ZONE_1_REACHED' }), go('capture1')) },
    evidence1: { label: 'APPELER LÉO', action: () => go('callLeo') },
    callLeo: { label: 'RACCROCHER', action: () => go('sarah'), disabled: !run.messages.includes('sarah_01') },
    sarah: { label: 'CONTINUER LA MISSION', action: () => go('capture2') },
    evidence2: { label: 'OUVRIR LE CARNET', action: () => go('board') },
    board: {
      label: 'MARCHER VERS LA ZONE 3',
      action: () => (apply({ type: 'SET_FLAG', flag: 'WALKING_TO_ZONE_3' }), go('threat')),
    },
    threat: { label: 'DÉCROCHER', action: () => go('callMarc') },
    callMarc: { label: 'RACCROCHER', action: () => go('end'), disabled: !isChapterComplete(run) },
    end: { label: 'REJOUER AILLEURS', action: reset },
  };
  const n = next[stage];
  if (!n) return null;
  return (
    <Pressable style={[s.btn, n.disabled && s.btnOff]} onPress={n.action} disabled={n.disabled}>
      <Text style={s.bt}>{n.label}</Text>
    </Pressable>
  );
}

function Pill({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable style={[s.pill, active && s.active]} onPress={onPress}>
      <Text style={s.pt}>{label}</Text>
    </Pressable>
  );
}

function File({ name, lines }: { name: string; lines: string[] }) {
  return (
    <View style={s.file}>
      <Text style={s.code}>{name}</Text>
      {lines.map((l) => (
        <Text key={l} style={s.white}>
          {l}
        </Text>
      ))}
    </View>
  );
}

function Capture(p: {
  title: string;
  hint: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  onSubmit: () => void;
  onFallback: () => void;
}) {
  return (
    <>
      <Text style={s.red}>ZONE DE RECHERCHE</Text>
      <Text style={s.hero}>{p.title}</Text>
      <Text style={s.copy}>{p.hint}</Text>
      <TextInput
        style={s.input}
        value={p.value}
        onChangeText={p.onChange}
        placeholder={p.placeholder}
        placeholderTextColor="#4a524e"
        autoCapitalize="characters"
        onSubmitEditing={p.onSubmit}
      />
      {p.error && <Text style={s.alert}>{p.error}</Text>}
      <View style={s.row}>
        <Pill label="CONSERVER CETTE PREUVE" active onPress={p.onSubmit} />
        <Pill label="JE NE TROUVE PAS" onPress={p.onFallback} />
      </View>
    </>
  );
}

function Call({
  suspectId,
  transcript,
  onAsk,
  world01,
}: {
  suspectId: SuspectId;
  transcript: { q: string; a: string }[];
  onAsk: (id: SuspectId, q: string) => void;
  world01: string;
}) {
  const suspect = CASE_2317.suspects.find((x) => x.id === suspectId)!;
  return (
    <>
      <Text style={s.red}>INTERROGATOIRE</Text>
      <Text style={s.hero}>{suspect.name.toUpperCase()}</Text>
      {transcript.map((t, i) => (
        <View key={i} style={s.exchange}>
          <Text style={s.dim}>— {t.q}</Text>
          <Text style={s.quote}>« {t.a} »</Text>
        </View>
      ))}
      <View style={s.col}>
        {QUESTIONS[suspectId].map((q) => (
          <Pill key={q} label={q.replace('{WORLD_01}', world01)} onPress={() => onAsk(suspectId, q)} />
        ))}
      </View>
    </>
  );
}

function Message({ id, run, children }: { id: string; run: ReturnType<typeof createRun>; children?: React.ReactNode }) {
  const m = messageView(run, id);
  if (!m) return null;
  const from = m.from === 'unknown' ? 'NUMÉRO INCONNU' : CASE_2317.suspects.find((x) => x.id === m.from)!.name.toUpperCase();
  return (
    <>
      <Text style={m.from === 'unknown' ? s.red : s.label}>{from}</Text>
      {m.lines.map((l) => (
        <View key={l} style={s.message}>
          <Text style={s.white}>{l}</Text>
        </View>
      ))}
      <View style={s.row}>{children}</View>
    </>
  );
}

function Board({ run, onLink }: { run: ReturnType<typeof createRun>; onLink: (a: string, b: string) => void }) {
  const nodes = notebookNodes(run);
  const labelOf = (id: string) => nodes.find((n) => n.id === id)?.label ?? id.toUpperCase();
  const [selected, setSelected] = useState<string>();
  function tap(id: string) {
    if (!selected) return setSelected(id);
    if (selected !== id) onLink(selected, id);
    setSelected(undefined);
  }
  return (
    <>
      <Text style={s.red}>CARNET</Text>
      <Text style={s.copy}>Touche deux éléments pour les relier.</Text>
      <View style={s.row}>
        {nodes.map((n) => (
          <Pill key={n.id} label={n.label} active={selected === n.id} onPress={() => tap(n.id)} />
        ))}
      </View>
      {run.links.map((l) => {
        const st = linkStatus(run, l.a, l.b);
        return (
          <View key={l.a + l.b} style={s.evidence}>
            <Text style={s.white}>
              {labelOf(l.a)} — {labelOf(l.b)}
              {st.label ? ` • ${st.label}` : ''}
            </Text>
            <Text style={st.status === 'FAIT ÉTABLI' ? s.dim : s.alert}>{st.status}</Text>
          </View>
        );
      })}
    </>
  );
}

const INK = '#f4f1e8';
const RED = '#e14d45';
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080a0c' },
  wrap: { padding: 24, paddingTop: 64, paddingBottom: 140 },
  brand: { color: INK, fontSize: 16, fontWeight: '900', letterSpacing: 5 },
  case: { color: '#656d69', fontSize: 11, letterSpacing: 2, marginTop: 8, marginBottom: 52 },
  red: { color: RED, fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 8 },
  label: { color: '#8b938f', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 28 },
  hero: { color: INK, fontSize: 40, lineHeight: 43, fontWeight: '900', marginTop: 12, letterSpacing: -1 },
  big: { color: INK, fontSize: 54, fontWeight: '900', letterSpacing: 2, marginTop: 30 },
  copy: { color: '#adb3af', fontSize: 18, lineHeight: 28, marginTop: 24 },
  closing: { color: INK, fontSize: 22, lineHeight: 30, marginTop: 18, fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  col: { gap: 8, marginTop: 24 },
  pill: { borderWidth: 1, borderColor: '#303633', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 3 },
  active: { backgroundColor: RED, borderColor: RED },
  pt: { color: INK, fontSize: 13, fontWeight: '800' },
  line: { flexDirection: 'row', gap: 18, borderTopWidth: 1, borderTopColor: '#242927', paddingVertical: 17, marginTop: 12 },
  num: { color: RED, fontWeight: '900' },
  white: { color: INK, fontSize: 17, fontWeight: '800', marginTop: 4 },
  dim: { color: '#747d78', marginTop: 5 },
  alert: { color: RED, marginTop: 10, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#414945', color: INK, fontSize: 36, fontWeight: '900', letterSpacing: 4, padding: 20, marginTop: 30, textAlign: 'center' },
  code: { color: RED, marginTop: 16, fontFamily: 'monospace' },
  file: { borderWidth: 1, borderColor: '#303633', padding: 20, marginTop: 20 },
  evidence: { borderLeftWidth: 2, borderLeftColor: RED, paddingLeft: 15, marginTop: 22 },
  exchange: { marginTop: 20 },
  quote: { color: INK, fontSize: 22, lineHeight: 30, marginTop: 8 },
  message: { backgroundColor: '#171b19', padding: 22, marginTop: 14, borderRadius: 4 },
  bottom: { position: 'absolute', left: 24, right: 24, bottom: 24 },
  btn: { backgroundColor: INK, padding: 20, borderRadius: 3 },
  btnOff: { opacity: 0.3 },
  bt: { color: '#080a0c', fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
});
