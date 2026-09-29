import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';
import { color, motion } from './theme';

/** Fades and lifts its children in after `delay` ms. The base building block of every screen. */
export function Reveal({
  delay = 0,
  duration = motion.base,
  from = 14,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  from?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration, delay, easing: motion.ease, useNativeDriver: motion.native }).start();
  }, []);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
}

/** Reveals a sentence word by word, like subtitles following a voice. */
export function WordReveal({
  text,
  style,
  delay = 0,
  perWord = 70,
  onDone,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
  delay?: number;
  perWord?: number;
  onDone?: () => void;
}) {
  // French typography: « ? ! : ; » stay glued to their word with a non-breaking space.
  const words = text
    .replace(/ ([?!:;»])/g, '\u00A0$1')
    .replace(/« /g, '«\u00A0')
    .split(' ');
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      i += 1;
      setShown(i);
      if (i < words.length) timer = setTimeout(step, perWord);
      else onDone?.();
    };
    timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [text]);
  return (
    <Text style={style}>
      {words.map((w, i) => (
        <Text key={i} style={{ opacity: i < shown ? 1 : 0.12 }}>
          {w}
          {i < words.length - 1 ? ' ' : ''}
        </Text>
      ))}
    </Text>
  );
}

/** Counts up to `to`. Numbers that move feel earned. */
export function Counter({ to, duration = 900, delay = 0, style, pad = 0 }: { to: number; duration?: number; delay?: number; style?: StyleProp<TextStyle>; pad?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: ReturnType<typeof setTimeout>;
    const start = Date.now() + delay;
    const tick = () => {
      const t = Math.min(1, Math.max(0, (Date.now() - start) / duration));
      const eased = 1 - Math.pow(1 - t, 4);
      setN(Math.round(eased * to));
      if (t < 1) raf = setTimeout(tick, 16);
    };
    raf = setTimeout(tick, 16);
    return () => clearTimeout(raf);
  }, [to]);
  return <Text style={style}>{String(n).padStart(pad, '0')}</Text>;
}

/** Concentric ring that breathes outward — zones, calls, alerts. */
export function Pulse({ size = 180, tint = color.red, period = 2200, rings = 3 }: { size?: number; tint?: string; period?: number; rings?: number }) {
  const values = useRef([...Array(rings)].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((period / rings) * i),
          Animated.timing(v, { toValue: 1, duration: period, easing: motion.ease, useNativeDriver: motion.native }),
          Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: motion.native }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);
  return (
    <View pointerEvents="none" style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', position: 'absolute' }}>
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 1,
            borderColor: tint,
            opacity: v.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.6, 0] }),
            transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
          }}
        />
      ))}
    </View>
  );
}

/** Rare glitch: a brief chromatic split and jitter. Used only for the unknown number. */
export function Glitch({ children, style, active = true }: { children: string; style?: StyleProp<TextStyle>; active?: boolean }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active) return;
    const frames = [1, 2, 0, 3, 0, 0, 1, 0];
    let i = 0;
    const t = setInterval(() => {
      setFrame(frames[i] ?? 0);
      i += 1;
      if (i > frames.length) clearInterval(t);
    }, 55);
    return () => clearInterval(t);
  }, [active]);
  const dx = [0, 3, -4, 2][frame];
  return (
    <View>
      {frame > 0 && (
        <Text style={[style, { position: 'absolute', color: color.red, opacity: 0.7, transform: [{ translateX: -dx }] }]}>{children}</Text>
      )}
      <Text style={[style, { transform: [{ translateX: dx }] }]}>{children}</Text>
    </View>
  );
}

/** Three dots: someone is typing. */
export function Typing() {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 3, duration: 1100, useNativeDriver: motion.native }));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, paddingVertical: 6 }}>
      {[0, 1, 2].map((i) => (
        <Animated.View
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color.inkSoft,
            opacity: v.interpolate({ inputRange: [i, i + 0.5, i + 1, 3.01].map((x) => Math.min(x, 3)), outputRange: [0.25, 1, 0.25, 0.25], extrapolate: 'clamp' }),
          }}
        />
      ))}
    </View>
  );
}

/** Voice waveform — the voice is the interface, the transcript is secondary. */
export function Waveform({ active, bars = 28, height = 56, tint = color.ink }: { active: boolean; bars?: number; height?: number; tint?: string }) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setSeed((s) => s + 1), 90);
    return () => clearInterval(t);
  }, [active]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, height }}>
      {[...Array(bars)].map((_, i) => {
        const envelope = Math.sin((i / (bars - 1)) * Math.PI);
        const noise = active ? 0.35 + 0.65 * Math.abs(Math.sin(seed * 0.9 + i * 1.7) * Math.cos(seed * 0.37 + i)) : 0.08;
        return <View key={i} style={{ width: 3, borderRadius: 2, backgroundColor: tint, opacity: active ? 0.9 : 0.35, height: Math.max(3, height * envelope * noise) }} />;
      })}
    </View>
  );
}

/** Horizontal scan line sweeping a viewfinder. */
export function ScanLine({ height }: { height: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 2600, easing: motion.easeInOut, useNativeDriver: motion.native }));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        backgroundColor: color.ink,
        opacity: 0.35,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }],
      }}
    />
  );
}
