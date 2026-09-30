import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, Share, Text, View } from 'react-native';
import { chapterSummary, contradictionView } from '../../engine/gameEngine';
import { investigatorProfile, nextUnlock, shareText } from '../../engine/profile';
import { SuspectId } from '../../types/case';
import { Flow, SUSPECT_SHORT } from '../flow';
import { haptic } from '../haptics';
import { Chip, Eyebrow, GhostButton, Hairline, PrimaryButton, Screen, Spacer, T } from '../kit';
import { Counter, Reveal, WordReveal } from '../motion';
import { Scramble, Tilt } from '../fx';
import { color, radius } from '../theme';

function useCountdown(target: Date) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const s = Math.max(0, Math.floor((target.getTime() - now) / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function ChapterEnd({ flow }: { flow: Flow }) {
  const summary = chapterSummary(flow.run);
  const profile = investigatorProfile(flow.run);
  const contradictions = contradictionView(flow.run);
  const [unlock] = useState(() => nextUnlock(new Date()));
  const countdown = useCountdown(unlock);
  const vote = flow.run.flags.find((f) => f.startsWith('VOTE_'))?.slice(5).toLowerCase() as SuspectId | undefined;

  useEffect(() => {
    haptic.confirm();
  }, []);

  const [copied, setCopied] = useState(false);
  async function share() {
    const message = shareText(flow.run);
    if (Platform.OS === 'web') {
      // Web Share is often unavailable in a browser: copy the text instead.
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

  return (
    <Screen progress={1} footer={<PrimaryButton label={copied ? 'Texte copié ✓' : 'Partager mon code'} onPress={share} />}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <Reveal>
          <Eyebrow>Chapitre I · terminé</Eyebrow>
        </Reveal>
        <Spacer h={16} />
        <Reveal delay={150}>
          <Tilt radius={radius.l}>
          <View style={{ borderRadius: radius.l, padding: 24, backgroundColor: 'rgba(19,22,25,0.8)', borderWidth: 1, borderColor: color.lineHi, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', right: -40, top: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: color.redSoft }} />
            <Text style={T.label}>Ta ville a écrit</Text>
            <Spacer h={8} />
            <Scramble text={summary.code} delay={500} duration={1200} style={[T.display, { letterSpacing: 2 }]} />
            <Spacer h={16} />
            <Hairline />
            <Spacer h={16} />
            <Text style={[T.label, { color: color.red }]}>Profil · {profile.title}</Text>
            <Text style={[T.title, T.italic, { marginTop: 8 }]}>{profile.line}</Text>
          </View>
          </Tilt>
        </Reveal>

        <Spacer h={32} />
        <View style={{ flexDirection: 'row' }}>
          {[
            { n: summary.evidence, l: 'preuves' },
            { n: summary.variables, l: 'traces du réel' },
            { n: summary.suspects, l: 'suspects' },
            { n: summary.contradictions, l: 'contradictions' },
          ].map((s, i) => (
            <View key={s.l} style={{ flex: 1 }}>
              <Counter to={s.n} delay={400 + i * 120} style={[T.title, i === 3 && s.n > 0 && { color: color.red }]} />
              <Text style={T.caption}>{s.l}</Text>
            </View>
          ))}
        </View>

        {contradictions.length > 0 && (
          <>
            <Spacer h={24} />
            {contradictions.map((c, i) => (
              <Reveal key={c.id} delay={900 + i * 150}>
                <View style={{ borderLeftWidth: 1, borderLeftColor: color.red, paddingLeft: 16, marginBottom: 16 }}>
                  <Text style={[T.label, { color: color.red }]}>{c.level === 'established' ? 'Contradiction' : 'Contradiction potentielle'}</Text>
                  <Text style={T.body}>{c.label}</Text>
                </View>
              </Reveal>
            ))}
          </>
        )}

        <Spacer h={24} />
        <WordReveal text={summary.closing.join(' ')} style={[T.title, { color: color.ink }]} delay={1400} perWord={140} />

        <Spacer h={48} />
        <Text style={T.label}>Qui soupçonnes-tu ?</Text>
        <Spacer h={16} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['leo', 'sarah', 'marc'] as SuspectId[]).map((id) => (
            <View key={id} style={{ flex: 1 }}>
              <Chip
                label={SUSPECT_SHORT[id]}
                selected={vote === id}
                disabled={!!vote && vote !== id}
                onPress={() => !vote && flow.apply({ type: 'SET_FLAG', flag: `VOTE_${id.toUpperCase()}` })}
              />
            </View>
          ))}
        </View>
        <Text style={[T.caption, { marginTop: 8 }]}>
          {vote ? 'Réponse scellée. Le chapitre II te dira si tu avais raison.' : 'Ta réponse sera scellée jusqu’au chapitre II.'}
        </Text>

        <Spacer h={48} />
        <View style={{ borderRadius: radius.l, borderWidth: 1, borderColor: color.lineHi, padding: 24 }}>
          <Text style={T.label}>Chapitre II · ouverture dans</Text>
          <Spacer h={8} />
          <Text style={[T.display, { fontFamily: T.monoL.fontFamily, letterSpacing: -2 }]} adjustsFontSizeToFit numberOfLines={1}>
            {countdown}
          </Text>
          <Text style={T.caption}>Le prochain dossier arrive à 07:42. Garde ton téléphone près de toi.</Text>
        </View>
        {/* Playtests cannot wait for 07:42. */}
        <GhostButton
          label="Ouvrir le chapitre II maintenant"
          onPress={() => {
            flow.apply({ type: 'NEXT_CHAPTER' });
            flow.go('chapter2');
          }}
        />
        <GhostButton label="Rejouer dans une autre ville" onPress={flow.restart} />
      </ScrollView>
    </Screen>
  );
}
