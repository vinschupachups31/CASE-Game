import React, { useEffect, useRef, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { CASE_2317 } from '../../cases/23-17';
import { knownTimeline } from '../../engine/notebook';
import { WorldSlotKey } from '../../types/case';
import { RunState } from '../../types/run';
import { Flow, Stage, progressOf } from '../flow';
import { haptic } from '../haptics';
import { FileIcon } from '../icons';
import { Eyebrow, Flex, Hairline, PrimaryButton, Screen, Spacer, T } from '../kit';
import { Reveal } from '../motion';
import { MaskReveal, Scramble } from '../fx';
import { color, motion, radius } from '../theme';

// Nora's rule, the spine of the investigation: she locked her files with what she had in front of her.
// The player finds those keys in their own city; these screens make the link visible.

// ---------- Download: the case arrives, and some of it is locked. ----------

const INCOMING = [
  { name: 'NORA_VALEN_fiche.pdf', size: '184 Ko' },
  { name: 'MESSAGE_23-17.m4a', size: '0:14' },
  { name: 'CALL_????.dat', size: 'verrouillé', locked: true },
  { name: 'NORA_????-?.doc', size: 'verrouillé', locked: true },
];

export function Download({ flow }: { flow: Flow }) {
  const bar = useRef(new Animated.Value(0)).current;
  const [pct, setPct] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const id = bar.addListener(({ value }) => setPct(Math.round(value * 100)));
    Animated.timing(bar, { toValue: 1, duration: 3200, easing: motion.easeInOut, useNativeDriver: false }).start(() => {
      setDone(true);
      haptic.confirm();
    });
    return () => bar.removeListener(id);
  }, []);
  const shown = Math.min(INCOMING.length, Math.floor(pct / 22));

  return (
    <Screen progress={0.01} footer={done ? <Reveal><PrimaryButton label="Ouvrir le dossier" onPress={() => flow.go('dossier')} /></Reveal> : undefined}>
      <Eyebrow>Dossier 001 · transfert chiffré</Eyebrow>
      <Spacer h={16} />
      <MaskReveal style={T.display} lines={['Téléchargement', <Text style={T.italic}>du dossier.</Text>]} />
      <Spacer h={32} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text style={[T.monoL, { color: color.ink }]}>{String(pct).padStart(3, ' ')} %</Text>
        <Text style={T.mono}>{done ? 'REÇU' : 'RÉCEPTION…'}</Text>
      </View>
      <View style={{ height: 2, backgroundColor: color.line, marginTop: 8, borderRadius: 1, overflow: 'hidden' }}>
        <Animated.View style={{ height: 2, backgroundColor: color.ink, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
      <Spacer h={24} />
      <View style={{ gap: 8 }}>
        {INCOMING.slice(0, shown).map((f) => (
          <Reveal key={f.name} from={6} duration={320}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
              <FileIcon tint={f.locked ? color.red : color.inkSoft} />
              <View style={{ flex: 1 }}>
                <Scramble text={f.name} duration={500} numberOfLines={1} style={[T.monoL, { color: f.locked ? color.red : color.ink }]} />
              </View>
              <Text style={[T.mono, f.locked && { color: color.red }]}>{f.size.toUpperCase()}</Text>
            </View>
            <Hairline />
          </Reveal>
        ))}
      </View>
      <Flex />
      {done && (
        <Reveal>
          <Text style={[T.label, { color: color.red }]}>2 fichiers verrouillés</Text>
          <Spacer h={8} />
          <Text style={T.body}>Nora verrouillait ses fichiers avec ce qu’elle avait sous les yeux. Les clés sont quelque part dans ta ville.</Text>
          <Spacer h={16} />
        </Reveal>
      )}
    </Screen>
  );
}

// ---------- Unlock: the key found in the street opens Nora's file. ----------

type Part = { text: string; slot?: WorldSlotKey };

/** Splits a file template into literal text and key slots ({CODE} = year, dash, letter). */
function partsOf(template: string): Part[] {
  const expanded = template.replace('{CODE}', '{WORLD_01}-{WORLD_02}');
  return expanded.split(/(\{WORLD_0[123]\})/).filter(Boolean).map((t) => {
    const m = t.match(/^\{(WORLD_0[123])\}$/);
    return m ? { text: '', slot: m[1] as WorldSlotKey } : { text: t };
  });
}

const SLOT_NAME: Record<WorldSlotKey, string> = { WORLD_01: 'année', WORLD_02: 'lettre', WORLD_03: 'nombre' };

export function Unlock({ flow, evidenceId, title, rule, next }: { flow: Flow; evidenceId: string; title: string; rule: string; next: Stage }) {
  const def = CASE_2317.evidence.find((e) => e.id === evidenceId)!;
  const parts = partsOf(def.fileName);
  const slots = parts.filter((p) => p.slot);
  const [filled, setFilled] = useState(0);
  const open = filled >= slots.length;
  const lock = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      haptic.confirm();
      Animated.spring(lock, { toValue: 1, useNativeDriver: motion.native, speed: 10, bounciness: 10 }).start();
      return;
    }
    const t = setTimeout(() => {
      haptic.press();
      setFilled((n) => n + 1);
    }, filled === 0 ? 1100 : 900);
    return () => clearTimeout(t);
  }, [filled]);

  let seen = 0;
  const value = (slot: WorldSlotKey, run: RunState) => run.variables[slot]?.value ?? '?';

  return (
    <Screen progress={progressOf(flow.stage)} footer={open ? <Reveal delay={500}><PrimaryButton label="Ouvrir le fichier" onPress={() => flow.go(next)} /></Reveal> : undefined}>
      <Eyebrow red={!open}>{open ? 'Déverrouillé' : 'Fichier verrouillé'}</Eyebrow>
      <Spacer h={16} />
      <MaskReveal style={T.title} lines={[title]} />
      <Spacer h={8} />
      <Text style={T.body}>{rule}</Text>
      <Flex />
      <View style={{ alignItems: 'center' }}>
        <Animated.View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            borderWidth: 1,
            borderColor: open ? color.ink : color.redLine,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale: lock.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
          }}
        >
          <Text style={[T.title, { color: open ? color.ink : color.red }]}>{open ? '✓' : '✕'}</Text>
        </Animated.View>
        <Spacer h={32} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-end', gap: 2 }}>
          {parts.map((p, i) => {
            if (!p.slot) return <Text key={i} style={[T.monoL, { color: color.inkSoft, marginBottom: 20 }]}>{p.text}</Text>;
            const index = seen++;
            const on = index < filled;
            const v = value(p.slot, flow.run);
            return (
              <View key={i} style={{ alignItems: 'center' }}>
                <View style={{ borderBottomWidth: 1, borderBottomColor: on ? color.red : color.lineHi, paddingHorizontal: 4, minWidth: 16 * v.length + 8 }}>
                  {on ? <Scramble text={v} duration={380} style={[T.monoL, { color: color.ink, textAlign: 'center' }]} /> : <Text style={[T.monoL, { color: color.faint, textAlign: 'center' }]}>{'·'.repeat(v.length)}</Text>}
                </View>
                <Text style={[T.mono, { marginTop: 4, color: on ? color.red : color.faint }]}>{SLOT_NAME[p.slot]}</Text>
              </View>
            );
          })}
        </View>
        <Spacer h={24} />
        <Text style={[T.caption, { textAlign: 'center' }]}>
          {slots.map((p) => `${SLOT_NAME[p.slot!]} ${value(p.slot!, flow.run)} : trouvée par toi`).join(' · ')}
        </Text>
      </View>
      <Flex />
    </Screen>
  );
}

// ---------- Timeline rail: where each clue sits in the evening. ----------

export function TimelineRail({ run, highlight }: { run: RunState; highlight?: string }) {
  const known = knownTimeline(run);
  return (
    <View style={{ width: 80, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: color.line }}>
      <Text style={[T.mono, { marginBottom: 8 }]}>SOIRÉE</Text>
      {known.map((c, i) => {
        const on = c.evidenceId === highlight;
        return (
          <Reveal key={c.time} delay={200 + i * 120} from={4}>
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: -12 }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: on ? color.red : c.time === '23:17' ? color.redLine : color.inkSoft }} />
                <Text style={[T.mono, { color: on ? color.red : color.ink }]}>{c.time}</Text>
              </View>
              <Text style={[T.caption, { color: on ? color.ink : color.muted }]}>{c.label}</Text>
            </View>
          </Reveal>
        );
      })}
    </View>
  );
}
