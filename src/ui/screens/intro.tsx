import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { CASE_2317 } from '../../cases/23-17';
import { MODES, RouteStop } from '../../engine/worldEngine';
import { modeScope } from '../../engine/modes';
import { RunMode } from '../../types/run';
import { Portrait } from '../portraits';
import { Flow } from '../flow';
import { haptic } from '../haptics';
import { PlayIcon, ShieldIcon } from '../icons';
import { Eyebrow, Flex, GhostButton, Hairline, PrimaryButton, Screen, Segmented, Spacer, T } from '../kit';
import { Counter, Pulse, Reveal, Waveform, WordReveal } from '../motion';
import { color, radius } from '../theme';
import { estimateMs, speak, stopVoice } from '../voice';

// ---------- Boot: a notification, not a menu. ----------

export function Boot({ flow }: { flow: Flow }) {
  useEffect(() => {
    const t = setTimeout(haptic.alarm, 700);
    return () => clearTimeout(t);
  }, []);
  return (
    <Screen
      bare
      footer={
        <Reveal delay={2200}>
          <PrimaryButton label="Ouvrir le dossier" onPress={() => flow.go('dossier')} />
        </Reveal>
      }
    >
      <Flex />
      <Reveal delay={700} from={-24}>
        <View style={{ backgroundColor: color.surface, borderRadius: radius.l, padding: 16, borderWidth: 1, borderColor: color.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[T.label, { color: color.bg, letterSpacing: 0 }]}>C</Text>
            </View>
            <Text style={[T.label, { color: color.ink, flex: 1 }]}>CASE</Text>
            <Text style={T.mono}>maintenant</Text>
          </View>
          <Spacer h={16} />
          <Text style={T.bodyStrong}>Dossier reçu</Text>
          <Text style={T.body}>Une affaire t’a été assignée. Ouvre-la seul.</Text>
        </View>
      </Reveal>
      <Spacer h={48} />
      <Reveal delay={1500}>
        <Text style={[T.mono, { textAlign: 'center' }]}>
          {CASE_2317.opening.date.toUpperCase()} · {CASE_2317.opening.time}
        </Text>
      </Reveal>
      <Flex />
    </Screen>
  );
}

// ---------- Dossier: Nora's voice first. ----------

export function Dossier({ flow }: { flow: Flow }) {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const voice = CASE_2317.opening.audio.join(' ');
  const perWord = Math.round(estimateMs(voice) / voice.split(' ').length);
  useEffect(() => stopVoice, []);
  const play = () => {
    haptic.press();
    setPhase('playing');
    speak(voice, 'nora', () => setPhase('done'));
  };
  return (
    <Screen
      progress={0.02}
      footer={
        phase === 'done' ? (
          <Reveal delay={900}>
            <PrimaryButton label="Lancer l’enquête" onPress={() => flow.go('terrain')} />
          </Reveal>
        ) : (
          <PrimaryButton label={phase === 'idle' ? 'Écouter son dernier message' : 'Lecture…'} onPress={play} disabled={phase === 'playing'} />
        )
      }
    >
      <Reveal>
        <Eyebrow red>Disparue</Eyebrow>
      </Reveal>
      <Spacer h={16} />
      <Reveal delay={120}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={T.display}>
            Nora{'\n'}
            <Text style={T.italic}>Valen.</Text>
          </Text>
          <Portrait id="nora" size={104} ring={color.redLine} />
        </View>
      </Reveal>
      <Spacer h={16} />
      <Reveal delay={240}>
        <Text style={T.mono}>
          {CASE_2317.victim.age} ANS · {CASE_2317.victim.occupation.toUpperCase()} · DERNIER SIGNAL 23:17
        </Text>
      </Reveal>
      <Spacer h={32} />
      <Reveal delay={400}>
        <View style={{ backgroundColor: color.surface, borderRadius: radius.l, padding: 24, borderWidth: 1, borderColor: color.line }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Pressable
              onPress={play}
              disabled={phase !== 'idle'}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: color.ink, alignItems: 'center', justifyContent: 'center', opacity: phase === 'idle' ? 1 : 0.4 }}
            >
              <PlayIcon />
            </Pressable>
            <View style={{ flex: 1, overflow: 'hidden' }}>
              <Waveform active={phase === 'playing'} bars={24} height={40} />
            </View>
            <Text style={T.mono}>0:14</Text>
          </View>
          <Spacer h={24} />
          {phase === 'idle' ? (
            <Text style={[T.title, T.italic, { color: color.faint }]}>{'«\u00A0Si quelqu’un écoute ça…\u00A0»'}</Text>
          ) : (
            <WordReveal text={`« ${voice} »`} style={[T.title, T.italic]} perWord={perWord} />
          )}
        </View>
      </Reveal>
      {phase === 'done' && (
        <Reveal delay={300}>
          <Spacer h={24} />
          <Text style={[T.label, { color: color.red }]}>Message programmé · 23:17</Text>
          <Spacer h={8} />
          <Text style={T.body}>{CASE_2317.opening.scheduledMessage}</Text>
        </Reveal>
      )}
    </Screen>
  );
}

// ---------- Terrain: the World Engine reads the player's surroundings. ----------

export const PURPOSE_LABEL: Record<RouteStop['purpose'], string> = {
  trace: 'Dernière trace',
  world_challenge: 'Énigme du terrain',
  confrontation: 'Confrontation',
  finale: 'Finale',
};

const MODE_SUB: Record<RunMode, string> = { short: '~20 MIN', normal: '~35 MIN', immersive: '~60 MIN' };

/** What actually changes between modes: how far the places are, so how much you walk. */
const MODE_INFO: Record<RunMode, { pitch: string; detail: string }> = {
  short: {
    pitch: 'L’essentiel de l’affaire.',
    detail: 'Les trois suspects et les preuves clés, sans détour. Lieux à moins de 1 km : quand un lieu manque, l’énigme se joue là où tu es.',
  },
  normal: {
    pitch: 'Le parcours conseillé pour une première affaire.',
    detail: 'Un témoin entre en scène, une fausse piste brouille les cartes et une preuve de plus t’attend. Lieux jusqu’à 2 km.',
  },
  immersive: {
    pitch: 'L’affaire au complet.',
    detail: 'Un second témoin, une seconde fausse piste, une énigme du réel en plus et un objet caché de Nora. Lieux jusqu’à 4 km.',
  },
};

export function Terrain({ flow }: { flow: Flow }) {
  const [scanning, setScanning] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setScanning(false);
      haptic.confirm();
    }, 2400);
    return () => clearTimeout(t);
  }, []);

  if (scanning) {
    return (
      <Screen progress={0.06}>
        <Flex />
        <View style={{ alignItems: 'center', justifyContent: 'center', height: 240 }}>
          <Pulse size={240} tint={color.ink} period={2000} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color.red }} />
        </View>
        <Spacer h={32} />
        <Text style={[T.title, { textAlign: 'center' }]}>Lecture de ton terrain</Text>
        <Spacer h={16} />
        {['Espaces publics', 'Trajets piétons', 'Zones sûres'].map((l, i) => (
          <Reveal key={l} delay={400 + i * 500}>
            <Text style={[T.mono, { textAlign: 'center', lineHeight: 24 }]}>{l.toUpperCase()} ✓</Text>
          </Reveal>
        ))}
        <Flex />
      </Screen>
    );
  }

  const t = flow.terrain;
  const scope = modeScope(flow.run.mode);
  return (
    <Screen progress={0.1} footer={<PrimaryButton label="Commencer l’enquête" onPress={() => flow.go('mission1')} />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Reveal>
          <Eyebrow>Terrain prêt</Eyebrow>
        </Reveal>
        <Spacer h={16} />
        <Reveal delay={100}>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            {[
              { n: t.zonesFound, l: 'zones\npubliques' },
              { n: 1, l: 'parcours\nà pied' },
              { n: scope.worldPuzzles, l: 'énigmes\ndu réel' },
            ].map((s, i) => (
              <View key={s.l} style={{ flex: 1 }}>
                <Counter to={s.n} delay={200 + i * 150} style={T.display} />
                <Text style={T.caption}>{s.l}</Text>
              </View>
            ))}
          </View>
        </Reveal>
        <Spacer h={32} />
        <Reveal delay={300}>
          <Segmented
            options={(Object.keys(MODES) as RunMode[]).map((k) => ({ key: k, label: MODES[k].label, sub: MODE_SUB[k] }))}
            value={flow.run.mode}
            onChange={flow.setMode}
          />
        </Reveal>
        <Spacer h={16} />
        <Reveal key={flow.run.mode} duration={320} from={6}>
          <Text style={T.bodyStrong}>{MODE_INFO[flow.run.mode].pitch}</Text>
          <Text style={T.body}>{MODE_INFO[flow.run.mode].detail}</Text>
          <Spacer h={8} />
          <Text style={T.mono}>
            {t.zonesFound} LIEU{t.zonesFound > 1 ? 'X' : ''} · {(t.distanceM / 1000).toFixed(1).replace('.', ',')} KM MAX · ~{t.durationMin} MIN
            {t.stops.some((x) => x.type === 'in_place') ? ` · ${t.stops.filter((x) => x.type === 'in_place').length} SUR PLACE` : ''}
          </Text>
          <Spacer h={16} />
          <Text style={T.label}>Dans ton affaire</Text>
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            {[
              { n: scope.suspects, l: 'suspects' },
              { n: scope.witnesses.length, l: 'témoins' },
              { n: scope.evidence, l: 'preuves' },
              { n: scope.falseLeads.length, l: 'fausses\npistes' },
            ].map((x) => (
              <View key={x.l} style={{ flex: 1 }}>
                <Counter to={x.n} duration={500} style={[T.title, x.n === 0 && { color: color.faint }]} />
                <Text style={T.caption}>{x.l}</Text>
              </View>
            ))}
          </View>
          <Text style={[T.caption, { marginTop: 16 }]}>Même coupable dans les trois modes. Plus le parcours est long, plus l’affaire s’étoffe.</Text>
        </Reveal>
        <Spacer h={24} />
        {t.stops.map((stop, i) => (
          <Reveal key={stop.purpose + flow.run.mode} delay={400 + i * 90}>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 16 }}>
              <Text style={[T.mono, { color: i === 0 ? color.red : color.muted }]}>0{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={T.bodyStrong}>{PURPOSE_LABEL[stop.purpose]}</Text>
                <Text style={T.caption}>{stop.type === 'place' ? stop.place.name : 'Sur place — sans déplacement'}</Text>
              </View>
              <Text style={T.mono}>{stop.type === 'place' ? `${stop.place.distanceM} M` : '—'}</Text>
            </View>
            <Hairline />
          </Reveal>
        ))}
        <Spacer h={24} />
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <ShieldIcon />
          <Text style={[T.caption, { flex: 1 }]}>Espaces publics uniquement. Aucune propriété privée. Reste attentif à la circulation.</Text>
        </View>
        <GhostButton align="left" label={`Environnement simulé : ${flow.profile.label.toLowerCase()} ↻`} onPress={flow.cycleProfile} />
      </ScrollView>
    </Screen>
  );
}
