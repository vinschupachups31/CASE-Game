import React, { useEffect, useRef, useState } from 'react';
import { Image, LayoutChangeEvent, Platform, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { GRAIN } from './grain';
import { color } from './theme';

// Motion layer, 2026: the screen is a living film frame. Grain, drifting light, masked titles,
// data that decrypts itself, cards that catch the light when the phone moves.
// Everything runs on the UI thread (Reanimated). When the OS asks for reduced motion (common on Android,
// battery saver included), only large movements stop — drift, grain, tilt. Fades, masks and decrypting stay.

export const ease = Easing.bezier(0.16, 1, 0.3, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const web = Platform.OS === 'web';

// ---------- Ambient: grain, drifting glows, vignette ----------

export type Mood = 'calm' | 'tense' | 'dark';

function Glow({ size, tint, opacity }: { size: number; tint: string; opacity: number }) {
  const id = `g${tint.replace(/[^a-z0-9]/gi, '')}${size}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <RadialGradient id={id} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={tint} stopOpacity={opacity} />
          <Stop offset="0.45" stopColor={tint} stopOpacity={opacity * 0.35} />
          <Stop offset="1" stopColor={tint} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={size} height={size} fill={`url(#${id})`} />
    </Svg>
  );
}

/** Two glows wander slowly across the frame; the red one rises with tension. */
export function Ambient({ mood }: { mood: Mood }) {
  const reduced = useReducedMotion();
  const drift = useSharedValue(0);
  const tension = useSharedValue(mood === 'tense' ? 1 : 0);
  const dark = useSharedValue(mood === 'dark' ? 1 : 0);

  useEffect(() => {
    if (reduced) return;
    drift.value = withRepeat(withTiming(1, { duration: 18000, easing: easeInOut }), -1, true);
    return () => cancelAnimation(drift);
  }, [reduced]);

  useEffect(() => {
    tension.value = withTiming(mood === 'tense' ? 1 : 0, { duration: 1400, easing: easeInOut });
    dark.value = withTiming(mood === 'dark' ? 1 : 0, { duration: 900, easing: easeInOut });
  }, [mood]);

  const warm = useAnimatedStyle(() => ({
    opacity: 1 - dark.value * 0.6 - tension.value * 0.4,
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [-160, 60]) },
      { translateY: interpolate(drift.value, [0, 1], [-120, 40]) },
      { scale: interpolate(drift.value, [0, 0.5, 1], [1, 1.15, 1]) },
    ],
  }));
  const red = useAnimatedStyle(() => ({
    opacity: tension.value * 0.9 + dark.value * 0.25,
    transform: [
      { translateX: interpolate(drift.value, [0, 1], [120, -40]) },
      { translateY: interpolate(drift.value, [0, 1], [420, 300]) },
      { scale: interpolate(drift.value, [0, 0.5, 1], [1.1, 0.95, 1.1]) },
    ],
  }));
  const base = useAnimatedStyle(() => ({ opacity: dark.value }));

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: color.bg, overflow: 'hidden' }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: color.black }, base]} />
      <Animated.View style={[{ position: 'absolute', left: -80, top: -80 }, warm]}>
        <Glow size={620} tint={color.ink} opacity={0.07} />
      </Animated.View>
      <Animated.View style={[{ position: 'absolute', left: -120, top: 0 }, red]}>
        <Glow size={680} tint={color.red} opacity={0.2} />
      </Animated.View>
      <Grain />
      <Vignette />
    </View>
  );
}

/** Film grain: a noise tile jumping a few pixels every other frame. */
export function Grain({ opacity = 0.07 }: { opacity?: number }) {
  const reduced = useReducedMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const frame = useSharedValue(0);
  useFrameCallback(() => {
    frame.value += 1;
    if (frame.value % 3 !== 0) return;
    x.value = -Math.floor(Math.random() * 96);
    y.value = -Math.floor(Math.random() * 96);
  }, !reduced);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, top: 0, right: -96, bottom: -96, opacity }, s]}>
      <Image source={{ uri: GRAIN }} resizeMode="repeat" style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

function Vignette() {
  return (
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="vignette" cx="50%" cy="45%" r="75%">
          <Stop offset="0.55" stopColor="#000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.6} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#vignette)" />
    </Svg>
  );
}

/** A soft halo that breathes behind a key element (a portrait, a code). */
export function Halo({ size, tint = color.ink, strength = 0.18, period = 3200 }: { size: number; tint?: string; strength?: number; period?: number }) {
  const reduced = useReducedMotion();
  const v = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    v.value = withRepeat(withTiming(1, { duration: period, easing: easeInOut }), -1, true);
    return () => cancelAnimation(v);
  }, [reduced]);
  const s = useAnimatedStyle(() => ({ opacity: 0.6 + v.value * 0.4, transform: [{ scale: 0.92 + v.value * 0.12 }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, s]}>
      <Glow size={size} tint={tint} opacity={strength} />
    </Animated.View>
  );
}

// ---------- Text ----------

/**
 * Title lines rising from behind a mask, one after the other — the film-credits reveal.
 * Each entry of `lines` is one line (plain text or styled <Text> children).
 */
export function MaskReveal({
  lines,
  style,
  delay = 0,
  stagger = 110,
  duration = 1000,
  align,
}: {
  lines: React.ReactNode[];
  style: StyleProp<TextStyle>;
  delay?: number;
  stagger?: number;
  duration?: number;
  align?: 'center';
}) {
  return (
    <View style={align === 'center' ? { alignItems: 'center' } : undefined}>
      {lines.map((line, i) => (
        <MaskLine key={i} style={style} delay={delay + i * stagger} duration={duration}>
          {line}
        </MaskLine>
      ))}
    </View>
  );
}

function MaskLine({ children, style, delay, duration }: { children: React.ReactNode; style: StyleProp<TextStyle>; delay: number; duration: number }) {
  const v = useSharedValue(0);
  const [h, setH] = useState(0);
  useEffect(() => {
    if (!h) return;
    v.value = withDelay(delay, withTiming(1, { duration, easing: ease }));
  }, [h]);
  const s = useAnimatedStyle(() => ({
    opacity: interpolate(v.value, [0, 0.3, 1], [0, 1, 1]),
    transform: [{ translateY: (1 - v.value) * h * 1.05 }, { rotateZ: `${(1 - v.value) * 3}deg` }],
  }));
  return (
    // A few pixels of padding keep descenders and italic overhangs inside the mask.
    <View style={{ overflow: 'hidden', paddingBottom: 6, marginBottom: -6, paddingRight: 8 }} onLayout={(e: LayoutChangeEvent) => setH(e.nativeEvent.layout.height)}>
      <Animated.Text style={[style, s]}>{children}</Animated.Text>
    </View>
  );
}

const GLYPHS = '0123456789ABCDEFX#%/<>*+=';

/** Data decrypts itself: characters cycle, then lock in left to right. For times, files, codes. */
export function Scramble({
  text,
  style,
  delay = 0,
  duration = 700,
  onDone,
  numberOfLines,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  delay?: number;
  duration?: number;
  onDone?: () => void;
  numberOfLines?: number;
}) {
  const [out, setOut] = useState(text.replace(/\S/g, ' '));
  useEffect(() => {
    let raf: ReturnType<typeof setTimeout>;
    const start = Date.now() + delay;
    const tick = () => {
      const t = Math.max(0, Date.now() - start);
      const locked = Math.floor((t / duration) * text.length);
      setOut(
        text
          .split('')
          .map((ch, i) => (i < locked || /\s/.test(ch) ? ch : t === 0 ? ' ' : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
          .join(''),
      );
      if (locked < text.length) raf = setTimeout(tick, 33);
      else onDone?.();
    };
    raf = setTimeout(tick, 0);
    return () => clearTimeout(raf);
  }, [text]);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {out}
    </Text>
  );
}

// ---------- Surfaces ----------

type Motion = { beta: number; gamma: number };

/** Device tilt on phones, pointer position on the web. Values in [-1, 1]. */
function useTilt(enabled: boolean) {
  const rx = useSharedValue(0);
  const ry = useSharedValue(0);
  useEffect(() => {
    if (!enabled || web) return;
    let sub: { remove: () => void } | undefined;
    try {
      const { DeviceMotion } = require('expo-sensors') as typeof import('expo-sensors');
      DeviceMotion.setUpdateInterval(33);
      let origin: Motion | undefined;
      sub = DeviceMotion.addListener((m) => {
        const r = m.rotation;
        if (!r) return;
        origin ??= { beta: r.beta, gamma: r.gamma };
        const clamp = (n: number) => Math.max(-1, Math.min(1, n));
        rx.value = withSpring(clamp((r.beta - origin.beta) * 2.2), { damping: 18, stiffness: 120 });
        ry.value = withSpring(clamp((r.gamma - origin.gamma) * 2.2), { damping: 18, stiffness: 120 });
      });
    } catch {}
    return () => sub?.remove();
  }, [enabled]);
  return { rx, ry };
}

/** A card that catches the light: 3D tilt with the phone, a specular sheen sliding across. */
export function Tilt({ children, max = 7, style, radius = 24 }: { children: React.ReactNode; max?: number; style?: StyleProp<ViewStyle>; radius?: number }) {
  const reduced = useReducedMotion();
  const { rx, ry } = useTilt(!reduced);
  const idle = useSharedValue(0);
  const [w, setW] = useState(300);

  // No sensor (web, desktop): a slow idle sway so the light still moves.
  useEffect(() => {
    if (reduced) return;
    idle.value = withRepeat(withTiming(1, { duration: 6000, easing: easeInOut }), -1, true);
    return () => cancelAnimation(idle);
  }, [reduced]);

  const card = useAnimatedStyle(() => {
    const x = rx.value + (web ? interpolate(idle.value, [0, 1], [-0.35, 0.35]) : 0);
    const y = ry.value + (web ? interpolate(idle.value, [0, 1], [0.5, -0.5]) : 0);
    return { transform: [{ perspective: 900 }, { rotateX: `${-x * max}deg` }, { rotateY: `${y * max}deg` }] };
  });
  const sheen = useAnimatedStyle(() => {
    const y = ry.value + (web ? interpolate(idle.value, [0, 1], [0.5, -0.5]) : 0);
    return { transform: [{ translateX: interpolate(y, [-1, 1], [-w * 0.9, w * 0.9]) }, { rotateZ: '18deg' }] };
  });

  const onPointer = web
    ? {
        onPointerMove: (e: { nativeEvent: { offsetX?: number; offsetY?: number } }) => {
          const { offsetX = w / 2, offsetY = 100 } = e.nativeEvent;
          ry.value = withSpring((offsetX / w) * 2 - 1, { damping: 20 });
          rx.value = withSpring((offsetY / 200) * 2 - 1, { damping: 20 });
        },
        onPointerLeave: () => {
          rx.value = withSpring(0);
          ry.value = withSpring(0);
        },
      }
    : {};

  return (
    <Animated.View style={[style, card]} onLayout={(e) => setW(e.nativeEvent.layout.width)} {...(onPointer as object)}>
      {children}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]}>
        <Animated.View style={[{ position: 'absolute', top: -80, bottom: -80, width: 140, left: w / 2 - 70 }, sheen]}>
          <LinearGradient
            colors={['rgba(242,237,228,0)', 'rgba(242,237,228,0.09)', 'rgba(242,237,228,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/** A light sweeping once across a surface (buttons), then again every few seconds. */
export function Glint({ width, every = 5200, delay = 700, tint = 'rgba(255,255,255,0.55)' }: { width: number; every?: number; delay?: number; tint?: string }) {
  const v = useSharedValue(0);
  useEffect(() => {
    v.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 900, easing: easeInOut }), withDelay(every, withTiming(0, { duration: 0 }))), -1));
    return () => cancelAnimation(v);
  }, [width]);
  const s = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(v.value, [0, 1], [-90, width + 30]) }, { skewX: '-20deg' }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, bottom: 0, width: 60 }, s]}>
      <LinearGradient colors={['rgba(255,255,255,0)', tint, 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
    </Animated.View>
  );
}

/** A quick flash over the whole frame: a cut in the film (incoming call, a revelation). */
export function Flash({ trigger, tint = color.ink, peak = 0.35 }: { trigger: unknown; tint?: string; peak?: number }) {
  const v = useSharedValue(0);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    v.value = withSequence(withTiming(peak, { duration: 60 }), withTiming(0, { duration: 520, easing: ease }));
  }, [trigger]);
  const s = useAnimatedStyle(() => ({ opacity: v.value }));
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }, s]} />;
}
