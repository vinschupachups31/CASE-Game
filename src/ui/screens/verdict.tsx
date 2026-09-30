import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { CASE_2317 } from '../../cases/23-17';
import { accusationVerdict, chapterSummary, contradictionView } from '../../engine/gameEngine';
import { verdictShareText } from '../../engine/profile';
import { SuspectId } from '../../types/case';
import { Flow, SUSPECT_SHORT, Stage, progressOf } from '../flow';
import { haptic } from '../haptics';
import { Eyebrow, Flex, GhostButton, Hairline, HoldButton, PrimaryButton, Screen, Spacer, T } from '../kit';
import { Halo, MaskReveal, Scramble } from '../fx';
import { Reveal, WordReveal } from '../motion';
import { Portrait, partsFor } from '../portraits';
import { color, radius } from '../theme';

// Rule 7: an accusation needs a person AND a proof. The player chooses both; the engine judges.

/** Any id outside the proven contradictions fails: an intuition is not a proof. */
const INTUITION = 'intuition';

export function Accuse({ flow, next }: { flow: Flow; next: Stage }) {
  const [suspect, setSuspect] = useState<SuspectId>();
  const [proof, setProof] = useState<string>();
  const contradictions = contradictionView(flow.run);
  const against = contradictions.filter((c) => c.suspectId === suspect);

  function pick(id: SuspectId) {
    haptic.tap();
    setSuspect(id);
    setProof(undefined);
  }

  function accuse() {
    if (!suspect || !proof) return;
    flow.apply({ type: 'ACCUSE', suspectId: suspect, contradictionId: proof });
    flow.go(next);
  }

  const name = suspect && CASE_2317.suspects.find((s) => s.id === suspect)!.name;

  return (
    <Screen
      progress={progressOf(flow.stage)}
      footer={<HoldButton label={suspect ? `Maintenir pour accuser ${SUSPECT_SHORT[suspect]}` : 'Choisis une personne'} disabled={!suspect || !proof} onConfirm={accuse} />}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
        <Reveal>
          <Eyebrow red>Accusation</Eyebrow>
          <Spacer h={8} />
          <Text style={T.title}>
            Qui a fait <Text style={T.italic}>disparaître Nora ?</Text>
          </Text>
          <Text style={T.caption}>Tu ne pourras pas revenir en arrière.</Text>
        </Reveal>
        <Spacer h={24} />
        <View style={{ gap: 8 }}>
          {CASE_2317.suspects.map((s, i) => {
            const on = suspect === s.id;
            const n = contradictions.filter((c) => c.suspectId === s.id).length;
            return (
              <Reveal key={s.id} delay={150 + i * 90}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => pick(s.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16,
                    minHeight: 64,
                    paddingHorizontal: 16,
                    borderRadius: radius.m,
                    borderWidth: 1,
                    borderColor: on ? color.red : color.line,
                    backgroundColor: on ? color.redSoft : color.surface,
                  }}
                >
                  <Portrait id={s.id} size={48} parts={partsFor(flow.run, s.id)} ring={on ? color.red : color.lineHi} />
                  <View style={{ flex: 1, paddingVertical: 12 }}>
                    <Text style={T.bodyStrong}>{s.name}</Text>
                    <Text style={T.caption}>{s.role}</Text>
                  </View>
                  <Text style={[T.mono, n > 0 && { color: color.red }]}>
                    {n} CONTRADICTION{n > 1 ? 'S' : ''}
                  </Text>
                </Pressable>
              </Reveal>
            );
          })}
        </View>

        {suspect && (
          <Reveal key={suspect}>
            <Spacer h={32} />
            <Text style={T.label}>Ta preuve contre {name}</Text>
            <Spacer h={8} />
            <View style={{ gap: 8 }}>
              {against.map((c) => (
                <ProofOption
                  key={c.id}
                  selected={proof === c.id}
                  kind={c.level === 'established' ? 'Contradiction établie' : 'Contradiction potentielle'}
                  label={c.label}
                  onPress={() => setProof(c.id)}
                />
              ))}
              <ProofOption
                selected={proof === INTUITION}
                kind="Aucune preuve"
                label={against.length ? 'Je n’ai pas besoin de preuve. Je le sens.' : 'Rien ne vise cette personne. Tu accuses sur une intuition.'}
                onPress={() => setProof(INTUITION)}
              />
            </View>
          </Reveal>
        )}
      </ScrollView>
    </Screen>
  );
}

function ProofOption({ selected, kind, label, onPress }: { selected: boolean; kind: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={{ borderLeftWidth: 2, borderLeftColor: selected ? color.red : color.line, paddingLeft: 16, paddingVertical: 12, minHeight: 48 }}
    >
      <Text style={[T.label, { color: selected ? color.red : color.muted }]}>{kind}</Text>
      <Text style={[T.body, { color: selected ? color.ink : color.inkSoft }]}>{label}</Text>
    </Pressable>
  );
}

const HEADLINE = {
  sound: { eyebrow: 'Accusation retenue', title: 'confondu.' },
  weak: { eyebrow: 'Accusation fragile', title: 'repart libre.' },
  wrong: { eyebrow: 'Mauvaise personne', title: 'n’est pas responsable.' },
} as const;

export function Verdict({ flow }: { flow: Flow }) {
  const v = accusationVerdict(flow.run)!;
  const summary = chapterSummary(flow.run);
  const vote = flow.run.flags.find((f) => f.startsWith('VOTE_'))?.slice(5).toLowerCase() as SuspectId | undefined;
  const proof = contradictionView(flow.run).find((c) => c.id === flow.run.accusation?.contradictionId);
  const hidden = v.accused.lies.map((l) => v.facts.find((f) => f.id === l.hidesFactId)!.text);
  const leads = CASE_2317.falseLeads.filter((l) => flow.run.flags.includes(l.setsFlag));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(v.outcome === 'sound' ? haptic.confirm : haptic.warning, 600);
    return () => clearTimeout(t);
  }, []);

  async function share() {
    const message = verdictShareText(flow.run);
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      } catch {}
      return;
    }
    try {
      await Share.share({ message });
    } catch {}
  }

  const h = HEADLINE[v.outcome];
  const first = v.accused.name.split(' ')[0];
  const last = v.accused.name.split(' ').slice(1).join(' ');

  return (
    <Screen progress={1} footer={<PrimaryButton label={copied ? 'Texte copié ✓' : 'Partager mon affaire'} onPress={share} />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Reveal>
          <Eyebrow red={v.outcome !== 'sound'}>{h.eyebrow}</Eyebrow>
        </Reveal>
        <Spacer h={16} />
        <Reveal delay={100}>
          <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
            <Halo size={260} tint={v.outcome === 'sound' ? color.ink : color.red} strength={0.2} />
            <Portrait id={v.accused.id} size={96} ring={v.outcome === 'sound' ? color.ink : color.red} />
          </View>
          <Spacer h={16} />
        </Reveal>
        <MaskReveal
          style={T.display}
          delay={400}
          stagger={180}
          lines={[`${first} ${last}`, <Text style={[T.italic, v.outcome !== 'sound' && { color: color.red }]}>{h.title}</Text>]}
        />
        <Spacer h={24} />
        <Reveal delay={700}>
          {v.outcome === 'sound' && proof && (
            <View style={{ borderLeftWidth: 1, borderLeftColor: color.ink, paddingLeft: 16 }}>
              <Text style={T.label}>Ta preuve</Text>
              <Text style={T.body}>{proof.label}</Text>
            </View>
          )}
          {v.outcome === 'weak' && (
            <Text style={T.body}>
              Tu as nommé la bonne personne. Mais {proof ? 'une esquive n’est pas une preuve' : 'une intuition n’est pas une preuve'}. Sans contradiction établie, rien ne le retient.
            </Text>
          )}
          {v.outcome === 'wrong' && (
            <View style={{ borderLeftWidth: 1, borderLeftColor: color.red, paddingLeft: 16 }}>
              <Text style={[T.label, { color: color.red }]}>Ce que {first} cachait</Text>
              {hidden.map((t) => (
                <Text key={t} style={T.body}>
                  {t}
                </Text>
              ))}
            </View>
          )}
        </Reveal>

        <Spacer h={40} />
        <Reveal delay={1200}>
          <Text style={T.label}>La vérité · affaire {CASE_2317.title}</Text>
          <Spacer h={16} />
          <View style={{ borderRadius: radius.l, borderWidth: 1, borderColor: color.line, backgroundColor: color.surface }}>
            {v.timeline.map((e, i) => (
              <View key={e.time}>
                {i > 0 && <Hairline />}
                <View style={{ flexDirection: 'row', gap: 16, padding: 16 }}>
                  <Scramble text={e.time} delay={1300 + i * 250} style={[T.monoL, { color: e.time === '23:17' ? color.red : color.ink }]} />
                  <Text style={[T.body, { flex: 1 }]}>{e.text}</Text>
                </View>
              </View>
            ))}
          </View>
          <Spacer h={16} />
          {v.outcome !== 'sound' && (
            <Text style={T.body}>
              La personne responsable était <Text style={T.bodyStrong}>{v.culprit.name}</Text>.
            </Text>
          )}
        </Reveal>

        <Spacer h={32} />
        <WordReveal text={summary.closing.join(' ')} style={[T.title, { color: color.ink }]} delay={1800} perWord={140} />

        {leads.length > 0 && (
          <Reveal delay={2600}>
            <Spacer h={40} />
            <Text style={T.label}>Les fausses pistes</Text>
            <Spacer h={8} />
            {leads.map((l) => (
              <View key={l.id} style={{ borderLeftWidth: 1, borderLeftColor: color.line, paddingLeft: 16, marginTop: 16 }}>
                <Text style={[T.label, { color: color.muted }]}>
                  {l.title} · vers {SUSPECT_SHORT[l.pointsTo]}
                </Text>
                <Text style={T.body}>{l.why}</Text>
              </View>
            ))}
          </Reveal>
        )}

        {vote && (
          <Reveal delay={3200}>
            <Spacer h={40} />
            <View style={{ borderRadius: radius.l, borderWidth: 1, borderColor: color.lineHi, padding: 24 }}>
              <Text style={T.label}>Vote scellé · chapitre I</Text>
              <Spacer h={8} />
              <Text style={T.title}>
                Tu soupçonnais <Text style={T.italic}>{SUSPECT_SHORT[vote]}.</Text>
              </Text>
              <Text style={T.body}>{vote === v.culprit.id ? 'Ton intuition était la bonne. Dès le premier soir.' : `Ce n’était pas la bonne piste. ${v.culprit.name.split(' ')[0]} y comptait.`}</Text>
            </View>
          </Reveal>
        )}
        <Spacer h={24} />
        <Flex />
        <GhostButton label="Rejouer dans une autre ville" onPress={flow.restart} />
      </ScrollView>
    </Screen>
  );
}
