import React, { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { CASE_2317 } from '../../cases/23-17';
import { Flow, SUSPECT_SHORT, Stage, progressOf } from '../flow';
import { haptic } from '../haptics';
import { Eyebrow, Flex, PrimaryButton, Screen, Spacer, T } from '../kit';
import { Pulse, Reveal, Waveform, WordReveal } from '../motion';
import { Portrait } from '../portraits';
import { color, radius } from '../theme';
import { estimateMs, speak, stopVoice } from '../voice';

// Long modes: witnesses who saw something, and leads that point the wrong way.
// Neither changes the truth; a lead is only explained at the verdict.

/** A witness, reached by phone. They speak line by line; hearing them sets their flag. */
export function Witness({ flow, id, next }: { flow: Flow; id: 'ines' | 'paul'; next: Stage }) {
  const w = CASE_2317.witnesses.find((x) => x.id === id)!;
  const [line, setLine] = useState(-1);
  const [speaking, setSpeaking] = useState(false);
  const done = line >= w.lines.length;
  const alive = useRef(true);

  useEffect(() => {
    haptic.ring();
    const t = setTimeout(() => setLine(0), 1600);
    return () => {
      alive.current = false;
      clearTimeout(t);
      stopVoice();
    };
  }, []);

  useEffect(() => {
    if (line < 0) return;
    if (done) {
      flow.apply({ type: 'SET_FLAG', flag: w.setsFlag });
      return;
    }
    setSpeaking(true);
    speak(w.lines[line], id, () => {
      if (!alive.current) return;
      setSpeaking(false);
      setTimeout(() => alive.current && setLine((l) => l + 1), 500);
    });
  }, [line]);

  const first = w.name.split(' ')[0];

  return (
    <Screen
      progress={progressOf(flow.stage)}
      footer={done ? <PrimaryButton label="Raccrocher" tone="red" onPress={() => flow.go(next)} /> : undefined}
    >
      <Reveal>
        <Eyebrow>Témoin · {w.place}</Eyebrow>
      </Reveal>
      <Spacer h={24} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}>
          {line < 0 && <Pulse size={88} tint={color.ink} period={1600} />}
          <Portrait id={id} size={72} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={T.title}>
            {first} <Text style={T.italic}>{w.name.split(' ').slice(1).join(' ')}</Text>
          </Text>
          <Text style={T.caption}>{w.role}</Text>
        </View>
      </View>
      <Spacer h={24} />
      <Waveform active={speaking} bars={40} height={40} />
      <Spacer h={24} />
      {line < 0 ? (
        <Text style={[T.mono, { textAlign: 'center' }]}>APPEL EN COURS…</Text>
      ) : (
        <View style={{ gap: 16 }}>
          {w.lines.slice(0, line + 1).map((t, i) =>
            i === line && !done ? (
              <WordReveal key={i} text={t} style={T.title} perWord={Math.round(estimateMs(t) / t.split(' ').length)} />
            ) : (
              <Text key={i} style={[T.body, { color: color.inkSoft }]}>
                {t}
              </Text>
            ),
          )}
        </View>
      )}
      <Flex />
      {done && (
        <Reveal>
          <Text style={[T.label, { color: color.ink }]}>Témoignage enregistré</Text>
          <Spacer h={16} />
        </Reveal>
      )}
    </Screen>
  );
}

/** A lead arrives: an anonymous text, a leak. The player cannot know yet that it is false. */
export function FalseLead({ flow, id, next }: { flow: Flow; id: string; next: Stage }) {
  const lead = CASE_2317.falseLeads.find((l) => l.id === id)!;
  const sms = lead.from === 'Numéro masqué';

  useEffect(() => {
    const t = setTimeout(sms ? haptic.alarm : haptic.warning, 500);
    flow.apply({ type: 'SET_FLAG', flag: lead.setsFlag });
    return () => clearTimeout(t);
  }, []);

  return (
    <Screen bare={sms} progress={progressOf(flow.stage)} style={sms ? { backgroundColor: color.black } : undefined} footer={<Reveal delay={2200}><PrimaryButton label="Continuer l’enquête" onPress={() => flow.go(next)} /></Reveal>}>
      {sms && <Spacer h={32} />}
      <Reveal>
        <Eyebrow red>{lead.from}</Eyebrow>
      </Reveal>
      <Spacer h={8} />
      <Reveal delay={150}>
        <Text style={T.title}>{lead.title}</Text>
      </Reveal>
      <Flex />
      <Reveal delay={600} from={8}>
        {sms ? (
          <View style={{ alignSelf: 'flex-start', maxWidth: '86%', backgroundColor: color.surfaceHi, borderRadius: radius.l, borderBottomLeftRadius: 8, paddingVertical: 16, paddingHorizontal: 16 }}>
            <Text style={T.body}>{lead.clue.replace(/[«»]/g, '').trim()}</Text>
          </View>
        ) : (
          <View style={{ borderRadius: radius.l, borderWidth: 1, borderColor: color.redLine, backgroundColor: color.surface, padding: 24 }}>
            <Text style={[T.mono, { color: color.red }]}>DOCUMENT TRANSMIS</Text>
            <Spacer h={8} />
            <Text style={T.title}>{lead.clue}</Text>
          </View>
        )}
      </Reveal>
      <Spacer h={24} />
      <Reveal delay={1500}>
        <Text style={[T.body, { color: color.muted }]}>
          Tout désigne {SUSPECT_SHORT[lead.pointsTo]}. Qui a intérêt à ce que tu y croies ?
        </Text>
      </Reveal>
      <Flex />
    </Screen>
  );
}
