import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { CASE_2317 } from '../src/cases/23-17';
import { createRun, isChapterComplete, reduceGame } from '../src/engine/gameEngine';
import { PROFILES, Profile, simulate } from '../src/engine/simulator';
import { GameEvent, RunMode, RunState } from '../src/types/run';
import { Flow, Stage, pageLabel } from '../src/ui/flow';
import { haptic } from '../src/ui/haptics';
import { T, Toast, ToastKind } from '../src/ui/kit';
import { Pressable, Text } from 'react-native';
import { isVoiceOn, onVoiceChange, setVoiceOn } from '../src/ui/voice';
import { color, motion } from '../src/ui/theme';
import { Board } from '../src/ui/screens/board';
import { ChapterEnd } from '../src/ui/screens/end';
import { Arrived, Brief, Detect, Evidence, Navigate, Pocket, Viewfinder } from '../src/ui/screens/field';
import { Boot, Dossier, Terrain } from '../src/ui/screens/intro';
import { Interrogation, Ring, SarahMessages, Threat, Walk } from '../src/ui/screens/people';

const PROFILE_ORDER: Profile['id'][] = ['dense', 'small', 'rural'];

// The hosted demo page embeds the fonts itself and sets this flag.
const FONTS_INLINED = Platform.OS === 'web' && !!(globalThis as { __CASE_FONTS_INLINED__?: boolean }).__CASE_FONTS_INLINED__;

export default function App() {
  const [fontsLoaded] = useFonts(
    FONTS_INLINED
      ? {}
      : {
          InstrumentSerif_400Regular,
          InstrumentSerif_400Regular_Italic,
          Inter_400Regular,
          Inter_600SemiBold,
          JetBrainsMono_400Regular,
        },
  );

  const [profileId, setProfileId] = useState<Profile['id']>('dense');
  const [run, setRun] = useState<RunState>(() => createRun());
  const [stage, setStage] = useState<Stage>('boot');
  const [pending, setPending] = useState<Flow['pending']>();
  const [capturedAt, setCapturedAt] = useState<number>();
  const [toast, setToast] = useState<{ text: string; kind: ToastKind; id: number }>();

  const terrain = useMemo(() => simulate(profileId, run.mode), [profileId, run.mode]);
  const fade = useRef(new Animated.Value(1)).current;

  // Feedback on what the engine just learned: statements, contradictions, suspects.
  const prev = useRef(run);
  useEffect(() => {
    const before = prev.current;
    prev.current = run;
    const newContradiction = run.contradictions.find((c) => !before.contradictions.includes(c));
    if (newContradiction) {
      const def = CASE_2317.contradictions.find((c) => c.id === newContradiction)!;
      haptic.warning();
      return setToast({ text: def.level === 'established' ? 'Contradiction établie' : 'Contradiction potentielle', kind: 'alert', id: Date.now() });
    }
    if (run.statements.length > before.statements.length) setToast({ text: 'Déclaration enregistrée', kind: 'info', id: Date.now() });
  }, [run]);

  function go(next: Stage) {
    Animated.timing(fade, { toValue: 0, duration: 180, easing: motion.easeInOut, useNativeDriver: motion.native }).start(() => {
      setStage(next);
      Animated.timing(fade, { toValue: 1, duration: 420, easing: motion.ease, useNativeDriver: motion.native }).start();
    });
  }

  const flow: Flow = {
    run,
    terrain,
    profile: PROFILES[profileId],
    stage,
    go,
    apply: (...events: GameEvent[]) => setRun((r) => events.reduce((acc, e) => reduceGame(acc, e), r)),
    setMode: (mode: RunMode) => setRun((r) => ({ ...r, mode })),
    cycleProfile: () => setProfileId((p) => PROFILE_ORDER[(PROFILE_ORDER.indexOf(p) + 1) % PROFILE_ORDER.length]),
    pending,
    setPending,
    capturedAt,
    markCaptured: () => setCapturedAt(Date.now()),
    restart: () => {
      setRun(createRun());
      setPending(undefined);
      setCapturedAt(undefined);
      setProfileId((p) => PROFILE_ORDER[(PROFILE_ORDER.indexOf(p) + 1) % PROFILE_ORDER.length]);
      go('boot');
    },
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: color.bg }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: color.black, alignItems: 'center' }}>
        <Animated.View style={{ flex: 1, width: '100%', maxWidth: 480, opacity: fade }}>
          <StageView flow={flow} />
        </Animated.View>
        {/* Page marker for playtests ("03 · Terrain") and the voice switch. */}
        <View pointerEvents="box-none" style={{ position: 'absolute', bottom: 0, width: '100%', maxWidth: 480, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text pointerEvents="none" style={[T.mono, { color: color.faint }]}>
            {pageLabel(flow.stage)}
          </Text>
          <VoiceSwitch />
        </View>
        {toast && <Toast key={toast.id} text={toast.text} kind={toast.kind} onHide={() => setToast(undefined)} />}
      </View>
    </SafeAreaProvider>
  );
}

function StageView({ flow }: { flow: Flow }) {
  const word = CASE_2317.worldSlots[1];
  switch (flow.stage) {
    case 'boot':
      return <Boot flow={flow} />;
    case 'dossier':
      return <Dossier flow={flow} />;
    case 'terrain':
      return <Terrain flow={flow} />;
    case 'mission1':
      return (
        <Brief
          flow={flow}
          number="01"
          title="Dernière"
          italic="trace."
          text="À 21:53, Nora a passé un appel. Retrouve la zone depuis laquelle il a été émis."
          cta="Localiser le signal"
          next="navigate1"
        />
      );
    case 'navigate1':
      return <Navigate flow={flow} stopIndex={0} label="Mission 01 · Dernière trace" next="pocket1" />;
    case 'pocket1':
      return <Pocket flow={flow} next="arrived1" />;
    case 'arrived1':
      return (
        <Arrived
          flow={flow}
          text={'Cherche une année autour de toi.\nUne façade, une plaque, une porte.'}
          next="capture1"
        />
      );
    case 'capture1':
      return <ZoneReached flow={flow} />;
    case 'detect1':
      return <Detect flow={flow} next="evidence1" back="capture1" />;
    case 'evidence1':
      return <Evidence flow={flow} id="e01" cta="Appeler Léo" next="ringLeo" />;
    case 'ringLeo':
      return <Ring flow={flow} suspectId="leo" next="callLeo" />;
    case 'callLeo':
      return (
        <Interrogation
          flow={flow}
          suspectId="leo"
          opening="Allô ? … Qui êtes-vous ? Comment vous avez eu ce numéro ?"
          canHangUp={(r) => r.messages.includes('sarah_01')}
          hint="Demande-lui où il était après l’appel."
          next="sarah"
        />
      );
    case 'sarah':
      return <SarahMessages flow={flow} next="mission2" />;
    case 'mission2':
      return (
        <Brief
          flow={flow}
          number="02"
          title="Le nom était"
          italic="devant elle."
          quote="Le nom était devant moi."
          text={word.prompt}
          cta="Ouvrir l’objectif"
          next="capture2"
        />
      );
    case 'capture2':
      return <Viewfinder flow={flow} slot="WORLD_02" instruction="Un mot d’au moins 6 lettres." placeholder={flow.profile.word ?? 'PHARMACIE'} next="detect2" />;
    case 'detect2':
      return <Detect flow={flow} next="evidence2" back="capture2" />;
    case 'evidence2':
      return <Evidence flow={flow} id="e02" cta="Ouvrir le carnet" next="board" />;
    case 'board':
      return <Board flow={flow} next="walk" />;
    case 'walk':
      return <Walk flow={flow} next="threat" />;
    case 'threat':
      return <Threat flow={flow} next="ringMarc" />;
    case 'ringMarc':
      return <Ring flow={flow} suspectId="marc" incoming next="callMarc" />;
    case 'callMarc':
      return (
        <Interrogation
          flow={flow}
          suspectId="marc"
          opening={CASE_2317.messages.find((m) => m.id === 'marc_01')!.lines.join(' ')}
          canHangUp={(r) => isChapterComplete(r) && r.statements.some((s) => s.suspectId === 'marc')}
          hint="Demande-lui comment il connaît ce chiffre."
          next="end"
        />
      );
    case 'end':
      return <ChapterEnd flow={flow} />;
  }
}

function VoiceSwitch() {
  const [on, setOn] = useState(isVoiceOn());
  useEffect(() => onVoiceChange(setOn), []);
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} hitSlop={16} onPress={() => setVoiceOn(!on)}>
      <Text style={[T.mono, { color: on ? color.muted : color.faint }]}>{on ? 'VOIX ON' : 'VOIX OFF'}</Text>
    </Pressable>
  );
}

/** Entering the viewfinder marks the zone as reached for the engine. */
function ZoneReached({ flow }: { flow: Flow }) {
  useEffect(() => {
    if (!flow.run.flags.includes('ZONE_1_REACHED')) flow.apply({ type: 'SET_FLAG', flag: 'ZONE_1_REACHED' });
  }, []);
  return <Viewfinder flow={flow} slot="WORLD_01" instruction="Une année. Quatre chiffres." placeholder={flow.profile.year ?? '1927'} next="detect1" />;
}
