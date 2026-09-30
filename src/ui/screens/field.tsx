import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { CASE_2317 } from '../../cases/23-17';
import { lettersOnly, validateForSlot } from '../../engine/challengeEngine';
import { evidenceView } from '../../engine/gameEngine';
import { Candidate, compass, inSearchZone } from '../../engine/worldEngine';
import { bearingDeg, distanceM, relativeBearing } from '../../engine/geo';
import { useHeading, useLivePosition } from '../device';
import { WorldSlotKey } from '../../types/case';
import { Flow, Stage, progressOf } from '../flow';
import { haptic } from '../haptics';
import { CompassDial, DeviceIcon, FileIcon, Needle } from '../icons';
import { Eyebrow, Flex, GhostButton, Hairline, PrimaryButton, Screen, Spacer, T } from '../kit';
import { Counter, Pulse, Reveal, ScanLine } from '../motion';
import { MaskReveal, Scramble, Tilt } from '../fx';
import { color, motion, radius } from '../theme';

// The camera module is only loaded on device: on web it pulls a barcode worker we do not need.
const Camera: typeof import('expo-camera') | undefined = Platform.OS !== 'web' ? require('expo-camera') : undefined;
const useCameraPermissions = Camera?.useCameraPermissions ?? (() => [undefined, async () => undefined] as const);

const DIRECTION: Record<string, string> = {
  N: 'Nord',
  NE: 'Nord-est',
  E: 'Est',
  SE: 'Sud-est',
  S: 'Sud',
  SO: 'Sud-ouest',
  O: 'Ouest',
  NO: 'Nord-ouest',
};

// ---------- Mission brief ----------

export function Brief({
  flow,
  number,
  title,
  italic,
  text,
  quote,
  cta,
  next,
  eyebrow,
}: {
  flow: Flow;
  /** Replaces "Mission 0X" (e.g. a chapter opening). */
  eyebrow?: string;
  number: string;
  title: string;
  italic: string;
  text: string;
  quote?: string;
  cta: string;
  next: Stage;
}) {
  return (
    <Screen progress={progressFor(flow)} footer={<PrimaryButton label={cta} onPress={() => flow.go(next)} />}>
      <Flex />
      <Reveal>
        <Eyebrow>{eyebrow ?? `Mission ${number}`}</Eyebrow>
      </Reveal>
      <Spacer h={16} />
      <MaskReveal style={T.display} lines={[title, <Text style={T.italic}>{italic}</Text>]} delay={120} />
      {quote && (
        <Reveal delay={300}>
          <Spacer h={24} />
          <View style={{ borderLeftWidth: 1, borderLeftColor: color.red, paddingLeft: 16 }}>
            <Text style={[T.title, T.italic, { color: color.inkSoft }]}>« {quote} »</Text>
            <Text style={[T.mono, { marginTop: 8 }]}>NOTE DE NORA</Text>
          </View>
        </Reveal>
      )}
      <Spacer h={24} />
      <Reveal delay={450}>
        <Text style={T.body}>{text}</Text>
      </Reveal>
      <Flex />
    </Screen>
  );
}

const progressFor = (flow: Flow) => progressOf(flow.stage);

/** Distance and bearing to a real place, updated as the player walks. Undefined for simulated places. */
function useLiveTarget(place?: Candidate) {
  const real = place?.lat !== undefined && place?.lon !== undefined;
  const pos = useLivePosition(real);
  if (!real || !pos) return undefined;
  const to = { lat: place!.lat!, lon: place!.lon! };
  return { distance: distanceM(pos, to), bearing: bearingDeg(pos, to) };
}

// ---------- Navigate: direction + distance, no map pin. ----------

export function Navigate({ flow, stopIndex, label, next }: { flow: Flow; stopIndex: number; label: string; next: Stage }) {
  const stop = flow.terrain.stops[stopIndex];
  const place = stop.type === 'place' ? stop.place : undefined;
  // Real place: live distance and direction from where the player stands, turned by the compass.
  const live = useLiveTarget(place);
  const heading = useHeading(!!live);
  const bearing = live ? (heading !== undefined ? relativeBearing(live.bearing, heading) : live.bearing) : place?.bearingDeg ?? 0;
  const distance = live?.distance ?? place?.distanceM ?? 0;
  const rot = useRef(new Animated.Value(-120)).current;
  useEffect(() => {
    Animated.spring(rot, { toValue: bearing, useNativeDriver: motion.native, speed: heading !== undefined ? 12 : 2, bounciness: 6 }).start();
  }, [bearing]);
  const size = 248;
  return (
    <Screen progress={progressFor(flow)} footer={<PrimaryButton label={place ? 'J’y vais' : 'Chercher ici'} onPress={() => flow.go(next)} />}>
      <Reveal>
        <Eyebrow>{label}</Eyebrow>
      </Reveal>
      <Flex />
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <CompassDial size={size} />
          <Animated.View
            style={{
              position: 'absolute',
              transform: [{ rotate: rot.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) }],
            }}
          >
            <Needle size={size} />
          </Animated.View>
        </View>
        <Spacer h={32} />
        {place ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <Counter to={distance} duration={1400} style={T.display} />
              <Text style={[T.mono, { marginBottom: 12 }]}>MÈTRES</Text>
            </View>
            <Text style={[T.label, { color: color.ink, marginTop: 8 }]}>
              {heading !== undefined ? (Math.abs(bearing) < 20 ? 'Droit devant' : bearing > 0 ? 'Sur ta droite' : 'Sur ta gauche') : DIRECTION[compass(live?.bearing ?? bearing)]}
            </Text>
            {live && <Text style={[T.mono, { marginTop: 8 }]}>{place.name.toUpperCase()}</Text>}
          </>
        ) : (
          <Text style={T.display}>Ici.</Text>
        )}
      </View>
      <Flex />
      <Reveal delay={600}>
        <Text style={[T.body, { textAlign: 'center' }]}>
          {place ? 'Pas de carte. Une direction, une distance.\nRegarde la ville, pas l’écran.' : 'La zone de recherche est autour de toi.'}
        </Text>
      </Reveal>
      <Spacer h={16} />
    </Screen>
  );
}

// ---------- Pocket: the phone leaves the player's hands. ----------

export function Pocket({ flow, next }: { flow: Flow; next: Stage }) {
  // With a real place, CASE watches the GPS and calls the player back on arrival.
  const stop = flow.terrain.stops[0];
  const live = useLiveTarget(stop.type === 'place' ? stop.place : undefined);
  const arrived = useRef(false);
  useEffect(() => {
    if (!live || arrived.current || !inSearchZone(live.distance)) return;
    arrived.current = true;
    haptic.heartbeat();
    flow.go(next);
  }, [live?.distance]);
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: 1800, easing: motion.easeInOut, useNativeDriver: motion.native }),
        Animated.delay(400),
        Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: motion.native }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Screen
      bare
     
      footer={
        <GhostButton
          label={live ? `Je suis dans la zone · ${live.distance} m` : 'Prototype · simuler l’arrivée'}
          onPress={() => {
            haptic.heartbeat();
            flow.go(next);
          }}
        />
      }
    >
      <Flex />
      <View style={{ alignItems: 'center', height: 120 }}>
        <Animated.View
          style={{
            opacity: v.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.6, 0] }),
            transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, 56] }) }],
          }}
        >
          <DeviceIcon size={72} />
        </Animated.View>
      </View>
      <Spacer h={32} />
      <Reveal delay={200}>
        <Text style={[T.display, { textAlign: 'center' }]}>
          Range ton{'\n'}
          <Text style={T.italic}>téléphone.</Text>
        </Text>
      </Reveal>
      <Spacer h={24} />
      <Reveal delay={600}>
        <Text style={[T.body, { textAlign: 'center' }]}>CASE vibrera quand tu entreras{'\n'}dans la zone de recherche.</Text>
      </Reveal>
      <Flex />
    </Screen>
  );
}

// ---------- Arrived: the phone pulls the player back. ----------

export function Arrived({ flow, text, next }: { flow: Flow; text: string; next: Stage }) {
  useEffect(() => {
    haptic.heartbeat();
    const t = setTimeout(haptic.heartbeat, 1600);
    return () => clearTimeout(t);
  }, []);
  return (
    <Screen bare footer={<PrimaryButton label="Ouvrir l’objectif" onPress={() => flow.go(next)} />}>
      <Flex />
      <View style={{ alignItems: 'center', justifyContent: 'center', height: 280 }}>
        <Pulse size={280} period={2400} />
        <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color.red }} />
      </View>
      <Reveal>
        <View style={{ alignItems: 'center' }}>
          <Eyebrow red>Zone de recherche</Eyebrow>
        </View>
      </Reveal>
      <Spacer h={16} />
      <Reveal delay={150}>
        <Text style={[T.display, { textAlign: 'center' }]}>
          Tu y <Text style={T.italic}>es.</Text>
        </Text>
      </Reveal>
      <Spacer h={16} />
      <Reveal delay={350}>
        <Text style={[T.body, { textAlign: 'center' }]}>{text}</Text>
      </Reveal>
      <Flex />
    </Screen>
  );
}

// ---------- Viewfinder: the camera is an investigation tool. ----------

function Brackets({ w, h, tint = color.ink, len = 24 }: { w: number; h: number; tint?: string; len?: number }) {
  const b = { position: 'absolute' as const, width: len, height: len, borderColor: tint };
  return (
    <View pointerEvents="none" style={{ position: 'absolute', width: w, height: h }}>
      <View style={[b, { left: 0, top: 0, borderLeftWidth: 2, borderTopWidth: 2, borderTopLeftRadius: 8 }]} />
      <View style={[b, { right: 0, top: 0, borderRightWidth: 2, borderTopWidth: 2, borderTopRightRadius: 8 }]} />
      <View style={[b, { left: 0, bottom: 0, borderLeftWidth: 2, borderBottomWidth: 2, borderBottomLeftRadius: 8 }]} />
      <View style={[b, { right: 0, bottom: 0, borderRightWidth: 2, borderBottomWidth: 2, borderBottomRightRadius: 8 }]} />
    </View>
  );
}

export function Viewfinder({
  flow,
  slot,
  instruction,
  placeholder,
  next,
  fallbackNext,
}: {
  flow: Flow;
  slot: WorldSlotKey;
  instruction: string;
  placeholder: string;
  next: Stage;
  /** Where "nothing like that around me" leads: the evidence, rebuilt from the fallback value. */
  fallbackNext: Stage;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();
  const [permission, requestPermission] = useCameraPermissions();
  const nativeCamera = Platform.OS !== 'web' && permission?.granted;
  const def = CASE_2317.worldSlots.find((s) => s.key === slot)!;
  const W = 296;
  const H = 184;

  function shoot() {
    const r = validateForSlot(def, value);
    if (!r.ok) {
      haptic.warning();
      return setError(r.reason);
    }
    haptic.confirm();
    flow.setPending({ slot, raw: value });
    flow.go(next);
  }

  return (
    <Screen bare>
      {nativeCamera && Camera && <Camera.CameraView style={StyleSheet.absoluteFill} facing="back" />}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Eyebrow red>Objectif</Eyebrow>
        <Text style={T.mono}>{slot}</Text>
      </View>
      <Spacer h={16} />
      <Text style={T.title}>{instruction}</Text>
      <Flex />
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: W, height: H, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: radius.m, backgroundColor: nativeCamera ? 'transparent' : 'rgba(242,237,228,0.03)' }}>
          <ScanLine height={H} />
          <Text style={[T.display, { color: value ? color.ink : color.faint, letterSpacing: 4 }]} numberOfLines={1} adjustsFontSizeToFit>
            {value ? value.toUpperCase() : '····'}
          </Text>
        </View>
        <Brackets w={W} h={H} />
      </View>
      <Flex />
      {Platform.OS !== 'web' && !permission?.granted && <GhostButton label="Activer la caméra" onPress={() => requestPermission()} />}
      <TextInput
        value={value}
        onChangeText={(v) => {
          setError(undefined);
          setValue(v);
        }}
        placeholder={placeholder}
        placeholderTextColor={color.faint}
        autoCapitalize="characters"
        autoCorrect={false}
        onSubmitEditing={shoot}
        style={[T.monoL, { color: color.ink, textAlign: 'center', outlineWidth: 0, borderBottomWidth: 1, borderBottomColor: error ? color.red : color.lineHi, paddingVertical: 12 }]}
      />
      <Text style={[T.caption, { textAlign: 'center', marginTop: 8, color: error ? color.red : color.muted }]}>
        {error ?? 'Recopie ce que l’objectif voit. La lecture automatique arrive.'}
      </Text>
      <Spacer h={24} />
      <View style={{ alignItems: 'center' }}>
        <Pressable accessibilityLabel="Capturer" onPress={shoot} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: color.ink, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: color.ink }} />
        </Pressable>
      </View>
      <GhostButton
        label="Rien de tel autour de moi"
        onPress={() => {
          flow.apply({ type: 'USE_FALLBACK', slot });
          flow.go(fallbackNext);
        }}
      />
    </Screen>
  );
}

// ---------- Detection: lock-on, then the player decides to keep it. ----------

export function Detect({ flow, next, back }: { flow: Flow; next: Stage; back: Stage }) {
  // Snapshot: the screen keeps rendering during the exit fade after pending is cleared.
  const [pending] = useState(flow.pending!);
  const isWord = pending.slot === 'WORLD_02';
  const isNumber = pending.slot === 'WORLD_03';
  const clean = isWord ? lettersOnly(pending.raw) : pending.raw.trim();
  const lock = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(lock, { toValue: 1, duration: 700, easing: motion.ease, useNativeDriver: motion.native }).start(() => haptic.confirm());
  }, []);
  const W = 296;
  const H = 136;

  return (
    <Screen
      bare
     
      footer={
        <>
          <PrimaryButton
            label="Conserver cette preuve"
            onPress={() => {
              flow.apply({ type: 'CAPTURE', slot: pending.slot, raw: pending.raw, source: 'camera' });
              if (pending.slot === 'WORLD_01') flow.markCaptured();
              flow.setPending(undefined);
              flow.go(next);
            }}
          />
          <GhostButton label="Reprendre" onPress={() => flow.go(back)} />
        </>
      }
    >
      <Flex />
      <Reveal>
        <View style={{ alignItems: 'center' }}>
          <Eyebrow red>{isWord ? 'Mot détecté' : isNumber ? 'Nombre détecté' : 'Année détectée'}</Eyebrow>
        </View>
      </Reveal>
      <Spacer h={32} />
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: W, height: H, alignItems: 'center', justifyContent: 'center' }}>
          {isWord ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
              {clean.split('').map((ch, i) => (
                <Reveal key={i} delay={200 + i * 60}>
                  <Text style={[T.title, { color: i === 2 ? color.red : color.ink }]}>{ch}</Text>
                </Reveal>
              ))}
            </View>
          ) : (
            <Text style={[T.display, { letterSpacing: 8 }]}>{clean}</Text>
          )}
        </View>
        <Animated.View
          style={{
            position: 'absolute',
            width: W,
            height: H,
            opacity: lock,
            transform: [{ scale: lock.interpolate({ inputRange: [0, 1], outputRange: [1.35, 1] }) }],
          }}
        >
          <Brackets w={W} h={H} tint={color.red} />
        </Animated.View>
      </View>
      <Spacer h={32} />
      <Reveal delay={800}>
        <Text style={[T.body, { textAlign: 'center' }]}>
          {isWord
            ? `Troisième lettre : ${clean[2]}.\nNora cachait ses codes ainsi.`
            : isNumber
              ? 'Un nombre de ta rue.\nC’était le mot de passe de sa clé.'
              : 'Une date inscrite dans ta ville.\nL’affaire va s’en souvenir.'}
        </Text>
      </Reveal>
      <Spacer h={16} />
      <Reveal delay={1000}>
        <Text style={[T.mono, { textAlign: 'center', color: color.ink }]}>
          {pending.slot} = {isWord ? clean[2] : clean}
        </Text>
      </Reveal>
      <Flex />
    </Screen>
  );
}

// ---------- Evidence: a file opens, line by line. ----------

const HIGHLIGHT = /(LÉO VASSEUR|MARC DELCOURT|M\.D\.|S\.K\.|Nora n’était pas seule\.)/;

/** Which trace of the player's world each file carries (raw = the word itself, not its letter). */
const TRACE: Record<string, { slot: WorldSlotKey; raw?: boolean }> = {
  e01: { slot: 'WORLD_01' },
  e02: { slot: 'WORLD_02', raw: true },
  e03: { slot: 'WORLD_02' },
  e04: { slot: 'WORLD_01' },
  e05: { slot: 'WORLD_03' },
};

export function Evidence({ flow, id, cta, next }: { flow: Flow; id: string; cta: string; next: Stage }) {
  const file = evidenceView(flow.run).find((e) => e.id === id);
  const isMarc = id === 'e02';
  const dramatic = id !== 'e01';
  const trace = TRACE[id];
  const variable = trace && flow.run.variables[trace.slot];
  useEffect(() => {
    const t = setTimeout(dramatic ? haptic.warning : haptic.press, dramatic ? 2600 : 400);
    return () => clearTimeout(t);
  }, []);
  if (!file) return null;
  // Numbered in the order this player found them.
  const n = flow.run.evidence.indexOf(id) + 1;

  return (
    <Screen progress={progressFor(flow)} footer={<Reveal delay={dramatic ? 3000 : 1600}><PrimaryButton label={cta} onPress={() => flow.go(next)} /></Reveal>}>
      <Reveal>
        <Eyebrow>Preuve 0{n} · débloquée</Eyebrow>
      </Reveal>
      <Spacer h={24} />
      <Reveal delay={150}>
        <Tilt radius={radius.l}>
        <View style={{ backgroundColor: 'rgba(19,22,25,0.82)', borderRadius: radius.l, borderWidth: 1, borderColor: color.lineHi }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16 }}>
            <FileIcon />
            <View style={{ flex: 1 }}>
              <Scramble text={file.fileName} delay={250} duration={600} numberOfLines={1} style={[T.monoL, { color: color.ink }]} />
            </View>
            <Text style={T.mono}>{file.title.toUpperCase()}</Text>
          </View>
          <Hairline />
          <View style={{ padding: 24, gap: 8 }}>
            {file.lines.map((line, i) => {
              const hit = HIGHLIGHT.test(line);
              return (
                <Scramble key={line} text={line} delay={500 + i * 280} duration={420 + line.length * 12} style={[T.monoL, hit && { color: color.ink, fontFamily: T.bodyStrong.fontFamily }]} />
              );
            })}
          </View>
        </View>
        </Tilt>
      </Reveal>
      <Spacer h={16} />
      {variable && (
        <Reveal delay={500 + file.lines.length * 280}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: radius.pill, borderWidth: 1, borderColor: color.lineHi, paddingVertical: 8, paddingHorizontal: 16 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.red }} />
            <Text style={[T.mono, { color: color.ink }]}>
              {variable.source === 'fallback' ? 'SIGNAL RECONSTITUÉ' : `${trace.raw ? variable.raw : variable.value} · TROUVÉ PAR TOI`}
            </Text>
          </View>
        </Reveal>
      )}
      <Flex />
      {isMarc ? (
        <Reveal delay={2400}>
          <Eyebrow red>Troisième suspect</Eyebrow>
          <Spacer h={8} />
          <MaskReveal style={T.display} lines={[<>Marc <Text style={T.italic}>Delcourt.</Text></>]} delay={2500} />
          <Text style={T.body}>La source de Nora. Il dit vouloir aider.</Text>
        </Reveal>
      ) : id === 'e04' ? (
        <Reveal delay={2400}>
          <Eyebrow red>22:34</Eyebrow>
          <Spacer h={8} />
          <Text style={T.title}>
            Deux cafés. <Text style={T.italic}>Avec qui ?</Text>
          </Text>
          <Text style={T.body}>Sept minutes avant 22:41. La serveuse s’en souvient peut-être.</Text>
        </Reveal>
      ) : id === 'e05' ? (
        <Reveal delay={2400}>
          <Eyebrow red>S.K.</Eyebrow>
          <Spacer h={8} />
          <Text style={T.title}>
            Les fichiers venaient de <Text style={T.italic}>Sarah.</Text>
          </Text>
          <Text style={T.body}>Elle a dit ne rien savoir de l’enquête de Nora.</Text>
        </Reveal>
      ) : id === 'e03' ? (
        <Reveal delay={2400}>
          <Eyebrow red>M.D.</Eyebrow>
          <Spacer h={8} />
          <Text style={T.title}>
            Marc savait que <Text style={T.italic}>Sarah</Text> avait aidé Nora.
          </Text>
          <Text style={T.body}>Qui le lui avait dit ?</Text>
        </Reveal>
      ) : (
        <Reveal delay={1400}>
          <Text style={T.body}>
            À 21:53, Nora a appelé <Text style={T.bodyStrong}>Léo Vasseur</Text>. Quatre minutes. Puis plus rien.
          </Text>
        </Reveal>
      )}
      <Spacer h={16} />
    </Screen>
  );
}
