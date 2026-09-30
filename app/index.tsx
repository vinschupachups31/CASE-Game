import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Ambient, Flash, Mood, ease, easeInOut } from '../src/ui/fx';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { CASE_2317 } from '../src/cases/23-17';
import { createRun, isChapterComplete, reduceGame } from '../src/engine/gameEngine';
import { PROFILES, Profile, simulate } from '../src/engine/simulator';
import { anchorAround, buildTerrain } from '../src/engine/worldEngine';
import { World } from '../src/ui/device';
import { Saved, clearGame, loadGame, saveGame } from '../src/ui/save';
import { GameEvent, RunMode, RunState } from '../src/types/run';
import { Flow, OBJECTIVES, ROMAN, SUSPECT_SHORT, Stage, chapterOf, pageLabel, resolveStage } from '../src/ui/flow';
import { haptic } from '../src/ui/haptics';
import { ChapterContext, ObjectiveContext, T, Toast, ToastKind } from '../src/ui/kit';
import { Pressable, Text } from 'react-native';
import { isVoiceOn, onVoiceChange, setVoiceOn } from '../src/ui/voice';
import { color, motion } from '../src/ui/theme';
import { Board } from '../src/ui/screens/board';
import { ChapterEnd } from '../src/ui/screens/end';
import { Arrived, Brief, Detect, Evidence, Navigate, Pocket, Viewfinder } from '../src/ui/screens/field';
import { Boot, Dossier, Terrain } from '../src/ui/screens/intro';
import { Interrogation, Ring, SarahMessages, Threat, Walk } from '../src/ui/screens/people';
import { Accuse, Verdict } from '../src/ui/screens/verdict';
import { FalseLead, Witness } from '../src/ui/screens/leads';
import { Download, Unlock } from '../src/ui/screens/files';
import { newTraits } from '../src/engine/appearance';
import { Portrait, partsFor } from '../src/ui/portraits';
import { SuspectId } from '../src/types/case';
import { CALL_OPENINGS } from '../src/voice/lines';

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
  // Notices queue up: a contradiction and a new portrait detail can land on the same answer.
  const [toasts, setToasts] = useState<{ text: string; kind: ToastKind; id: number; who?: SuspectId }[]>([]);
  const toast = toasts[0];

  const [world, setWorld] = useState<World>();
  const [endedAt, setEndedAt] = useState<number>();
  // Real map when available; otherwise the simulated places, pinned around the player when the GPS knows where they are.
  const terrain = useMemo(
    () =>
      world?.places.length
        ? buildTerrain(world.places, run.mode)
        : buildTerrain(world ? anchorAround(world.origin, PROFILES[profileId].places) : PROFILES[profileId].places, run.mode),
    [world, profileId, run.mode],
  );

  // Save and resume: closing the app never loses the investigation.
  const [saved, setSaved] = useState<Saved>();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    loadGame().then((s) => {
      if (s && s.stage !== 'boot') setSaved(s);
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (stage === 'end' && !endedAt) setEndedAt(Date.now());
  }, [stage]);
  useEffect(() => {
    if (!loaded || stage === 'boot') return;
    saveGame({ v: 1, run, stage, profileId, world, capturedAt, endedAt });
  }, [loaded, run, stage, profileId, world, capturedAt, endedAt]);
  // Scene transitions: a soft dissolve with depth by default, a hard cut for what should startle.
  const scene = useSharedValue(1);
  const [cut, setCut] = useState<{ n: number; tint: string }>({ n: 0, tint: color.ink });
  const sceneStyle = useAnimatedStyle(() => ({
    opacity: scene.value,
    transform: [{ scale: 0.985 + scene.value * 0.015 }, { translateY: (1 - scene.value) * 10 }],
  }));

  // Feedback on what the engine just learned: contradictions, portrait details, statements.
  const prev = useRef(run);
  useEffect(() => {
    const before = prev.current;
    prev.current = run;
    const notices: typeof toasts = [];
    const stamp = Date.now();
    for (const id of run.contradictions.filter((c) => !before.contradictions.includes(c))) {
      const def = CASE_2317.contradictions.find((c) => c.id === id)!;
      notices.push({ text: def.level === 'established' ? 'Contradiction établie' : 'Contradiction potentielle', kind: 'alert', id: stamp + notices.length });
    }
    for (const { suspectId, trait } of newTraits(before, run)) {
      notices.push({ text: `Portrait de ${SUSPECT_SHORT[suspectId]} · ${trait.label}`, kind: 'info', id: stamp + notices.length, who: suspectId });
    }
    if (!notices.length && run.statements.length > before.statements.length) notices.push({ text: 'Déclaration enregistrée', kind: 'info', id: stamp });
    if (!notices.length) return;
    notices[0].kind === 'alert' ? haptic.warning() : haptic.confirm();
    setToasts((q) => [...q, ...notices]);
  }, [run]);

  function go(target: Stage) {
    const next = resolveStage(target, run.mode);
    const kind = TRANSITION[next] ?? 'dissolve';
    if (kind === 'cut') {
      setStage(next);
      setCut((c) => ({ n: c.n + 1, tint: next === 'threat' || next === 'ringMarc' ? color.red : color.ink }));
      scene.value = withSequence(withTiming(0.2, { duration: 0 }), withTiming(1, { duration: 360, easing: ease }));
      return;
    }
    scene.value = withTiming(0, { duration: 200, easing: easeInOut });
    setTimeout(() => {
      setStage(next);
      if (kind === 'flash') setCut((c) => ({ n: c.n + 1, tint: color.ink }));
      scene.value = withTiming(1, { duration: kind === 'slow' ? 1100 : 560, easing: ease });
    }, 210);
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
    world,
    setWorld,
    saved: saved && { stage: saved.stage, chapter: saved.run.chapter },
    resume: () => {
      if (!saved) return;
      prev.current = saved.run; // no replay of old notices
      setRun(saved.run);
      setProfileId(saved.profileId);
      setWorld(saved.world);
      setCapturedAt(saved.capturedAt);
      setEndedAt(saved.endedAt);
      setSaved(undefined);
      go(saved.stage);
    },
    endedAt,
    restart: () => {
      clearGame();
      setEndedAt(undefined);
      setSaved(undefined);
      prev.current = createRun();
      setRun(createRun());
      setPending(undefined);
      setCapturedAt(undefined);
      setWorld(undefined);
      setProfileId((p) => PROFILE_ORDER[(PROFILE_ORDER.indexOf(p) + 1) % PROFILE_ORDER.length]);
      go('boot');
    },
  };

  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: color.bg }} />;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: color.black, alignItems: 'center' }}>
        <Ambient mood={MOOD[stage] ?? 'calm'} />
        <Animated.View style={[{ flex: 1, width: '100%', maxWidth: 480 }, sceneStyle]}>
          <ChapterContext.Provider value={ROMAN[chapterOf(stage)]}>
            <ObjectiveContext.Provider value={OBJECTIVES[stage]}>
              <StageView flow={flow} />
            </ObjectiveContext.Provider>
          </ChapterContext.Provider>
        </Animated.View>
        {/* Page marker for playtests ("03 · Terrain") and the voice switch. */}
        <View pointerEvents="box-none" style={{ position: 'absolute', bottom: 0, width: '100%', maxWidth: 480, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 }}>
          <Text pointerEvents="none" style={[T.mono, { color: color.faint }]}>
            {pageLabel(flow.stage)}
          </Text>
          <VoiceSwitch />
        </View>
        <Flash trigger={cut.n} tint={cut.tint} peak={cut.tint === color.red ? 0.45 : 0.18} />
        {toast && (
          <Toast
            key={toast.id}
            text={toast.text}
            kind={toast.kind}
            leading={toast.who && <Portrait id={toast.who} size={32} parts={partsFor(run, toast.who)} />}
            onHide={() => setToasts((q) => q.slice(1))}
          />
        )}
      </View>
    </SafeAreaProvider>
  );
}

/** The light of each moment: tense stages turn the frame red, calls and the viewfinder go dark. */
const MOOD: Partial<Record<Stage, Mood>> = {
  boot: 'dark',
  pocket1: 'dark',
  capture1: 'dark',
  detect1: 'dark',
  capture2: 'dark',
  detect2: 'dark',
  capture3: 'dark',
  detect3: 'dark',
  download: 'dark',
  ringLeo: 'dark',
  ringSarah: 'dark',
  ringMarc2: 'dark',
  leadLeo: 'dark',
  threat: 'tense',
  ringMarc: 'tense',
  callMarc: 'tense',
  callMarc2: 'tense',
  leadSarah: 'tense',
  accuse: 'tense',
};

/** How each stage enters: a cut startles, a flash marks a discovery, slow lets an ending breathe. */
const TRANSITION: Partial<Record<Stage, 'cut' | 'flash' | 'slow'>> = {
  threat: 'cut',
  ringMarc: 'cut',
  leadLeo: 'cut',
  detect1: 'flash',
  detect2: 'flash',
  detect3: 'flash',
  unlock1: 'flash',
  unlock2: 'flash',
  unlock3: 'flash',
  evidence3: 'flash',
  end: 'slow',
  verdict: 'slow',
  chapter2: 'slow',
};

function StageView({ flow }: { flow: Flow }) {
  const word = CASE_2317.worldSlots[1];
  switch (flow.stage) {
    case 'boot':
      return <Boot flow={flow} />;
    case 'download':
      return <Download flow={flow} />;
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
          text="À 21:53, Nora a passé un appel. Son journal d’appels est verrouillé, et Nora verrouillait tout avec ce qu’elle voyait autour d’elle. Va là d’où elle a appelé : la clé y est inscrite."
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
          text={'Nora a appelé d’ici. Elle a fermé son journal avec une année visible de cet endroit.\nUne façade, une plaque, une porte.'}
          next="capture1"
        />
      );
    case 'capture1':
      return <ZoneReached flow={flow} />;
    case 'detect1':
      return <Detect flow={flow} next="unlock1" back="capture1" />;
    case 'unlock1':
      return <Unlock flow={flow} evidenceId="e01" title="Journal d’appels de Nora" rule="Nora l’a verrouillé avec l’année qu’elle avait sous les yeux, là d’où elle a appelé." next="evidence1" />;
    case 'evidence1':
      return <Evidence flow={flow} id="e01" cta="Appeler Léo" next="ringLeo" />;
    case 'ringLeo':
      return <Ring flow={flow} suspectId="leo" next="callLeo" />;
    case 'callLeo':
      return (
        <Interrogation
          flow={flow}
          suspectId="leo"
          opening={CALL_OPENINGS.leo}
          canHangUp={(r) => r.messages.includes('sarah_01')}
          hint="Demande-lui où il était après l’appel."
          next="sarah"
        />
      );
    case 'sarah':
      return <SarahMessages flow={flow} next="leadLeo" />;
    case 'leadLeo':
      return <FalseLead flow={flow} id="fl_leo_sms" next="paul" />;
    case 'paul':
      return <Witness flow={flow} id="paul" next="mission2" />;
    case 'mission2':
      return (
        <Brief
          flow={flow}
          number="02"
          title="Le nom était"
          italic="devant elle."
          quote="Le nom était devant moi. Toujours la troisième."
          text={`Son dossier principal est verrouillé. Clé : ton année, ${flow.run.variables.WORLD_01?.value ?? ''}, puis une lettre. Nora prenait toujours la 3e lettre d’un mot qu’elle avait sous les yeux. ${word.prompt}`}
          cta="Ouvrir l’objectif"
          next="capture2"
        />
      );
    case 'capture2':
      return <Viewfinder flow={flow} slot="WORLD_02" instruction="Un mot d’au moins 6 lettres." placeholder={flow.profile.word ?? 'PHARMACIE'} next="detect2" fallbackNext="unlock2" />;
    case 'detect2':
      return <Detect flow={flow} next="unlock2" back="capture2" />;
    case 'unlock2':
      return <Unlock flow={flow} evidenceId="e02" title="Dossier principal de Nora" rule="Sa clé : l’année du lieu de l’appel, puis la 3e lettre d’un mot de ta ville. « Le nom était devant moi. »" next="evidence2" />;
    case 'evidence2':
      return <Evidence flow={flow} id="e02" cta="Continuer" next="ticket" />;
    case 'ticket':
      return <Evidence flow={flow} id="e04" cta="Appeler le café" next="ines" />;
    case 'ines':
      return <Witness flow={flow} id="ines" next="board" />;
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
          opening={CALL_OPENINGS.marc}
          canHangUp={(r) => isChapterComplete(r) && r.statements.some((s) => s.suspectId === 'marc')}
          hint="Demande-lui comment il connaît ce chiffre."
          next="end"
        />
      );
    case 'end':
      return <ChapterEnd flow={flow} />;
    case 'chapter2':
      return (
        <Brief
          flow={flow}
          eyebrow="Chapitre II · 07:42"
          number="04"
          title="Ce que Nora"
          italic="savait."
          text="Cette nuit, un fichier de Nora a refait surface. Il était rangé sous le nom de ta ville."
          cta="Ouvrir le fichier"
          next="evidence3"
        />
      );
    case 'evidence3':
      return <Evidence flow={flow} id="e03" cta="Appeler Sarah" next="mission3" />;
    case 'mission3':
      return (
        <Brief
          flow={flow}
          number="05"
          title="La clé"
          italic="de Nora."
          quote="Le code est dans la rue. Comme toujours."
          text={CASE_2317.worldSlots[2].prompt}
          cta="Ouvrir l’objectif"
          next="capture3"
        />
      );
    case 'capture3':
      return <Viewfinder flow={flow} slot="WORLD_03" instruction="Un nombre. Une porte, une rue, un horaire." placeholder="12" next="detect3" fallbackNext="unlock3" />;
    case 'detect3':
      return <Detect flow={flow} next="unlock3" back="capture3" />;
    case 'unlock3':
      return <Unlock flow={flow} evidenceId="e05" title="Clé USB de Nora" rule="Protégée par un nombre, pris comme toujours dans la rue." next="evidence5" />;
    case 'evidence5':
      return <Evidence flow={flow} id="e05" cta="Continuer" next="leadSarah" />;
    case 'leadSarah':
      return <FalseLead flow={flow} id="fl_sarah_mails" next="ringSarah" />;
    case 'ringSarah':
      return <Ring flow={flow} suspectId="sarah" next="callSarah" />;
    case 'callSarah': {
      // Sarah remembers whether the player answered her message.
      const ignored = flow.run.flags.includes('SARAH_IGNORED');
      return (
        <Interrogation
          flow={flow}
          suspectId="sarah"
          grudge={ignored}
          opening={ignored ? CALL_OPENINGS.sarah_ignored : CALL_OPENINGS.sarah}
          canHangUp={(r) => r.flags.includes('SARAH_CONFESSED')}
          hint="Présente-lui la note de Nora."
          next="ringMarc2"
        />
      );
    }
    case 'ringMarc2':
      return <Ring flow={flow} suspectId="marc" next="callMarc2" />;
    case 'callMarc2':
      return (
        <Interrogation
          flow={flow}
          suspectId="marc"
          opening={CALL_OPENINGS.marc_again}
          canHangUp={(r) => r.contradictions.includes('c_marc_sarah')}
          hint="Demande-lui s’il connaît Sarah."
          next="board2"
        />
      );
    case 'board2':
      return <Board flow={flow} cta="Passer à l’accusation" next="accuse" />;
    case 'accuse':
      return <Accuse flow={flow} next="verdict" />;
    case 'verdict':
      return <Verdict flow={flow} />;
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
  return <Viewfinder flow={flow} slot="WORLD_01" instruction="Une année. Quatre chiffres." placeholder={flow.profile.year ?? '1927'} next="detect1" fallbackNext="unlock1" />;
}
