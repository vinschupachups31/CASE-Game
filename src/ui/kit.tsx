import React, { useEffect, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import { Glint } from './fx';
import { Animated, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from './haptics';
import { color, font, motion, radius, size, space } from './theme';

// ---------- Typography ----------

export const T = StyleSheet.create({
  display: { fontFamily: font.display, fontSize: size.display, lineHeight: 56, color: color.ink, letterSpacing: -1.2 },
  title: { fontFamily: font.display, fontSize: size.title, lineHeight: 36, color: color.ink, letterSpacing: -0.4 },
  italic: { fontFamily: font.displayItalic },
  body: { fontFamily: font.body, fontSize: size.body, lineHeight: 26, color: color.inkSoft, letterSpacing: -0.2 },
  bodyStrong: { fontFamily: font.semibold, fontSize: size.body, lineHeight: 24, color: color.ink, letterSpacing: -0.2 },
  label: { fontFamily: font.semibold, fontSize: size.label, lineHeight: 16, letterSpacing: 2, color: color.muted, textTransform: 'uppercase' },
  caption: { fontFamily: font.body, fontSize: size.label, lineHeight: 16, color: color.muted },
  mono: { fontFamily: font.mono, fontSize: size.label, lineHeight: 16, letterSpacing: 0.8, color: color.muted },
  monoL: { fontFamily: font.mono, fontSize: size.body, lineHeight: 24, color: color.inkSoft },
});

export function Eyebrow({ children, red, style }: { children: React.ReactNode; red?: boolean; style?: StyleProp<TextStyle> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      {red && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color.red }} />}
      <Text style={[T.label, red && { color: color.red }, style]}>{children}</Text>
    </View>
  );
}

// ---------- Layout ----------

/**
 * One screen = one primary action. The body scrolls-free by design; content is short.
 * `bare` removes the top bar for immersive moments (calls, the unknown number).
 */
/** Chapter shown in the top bar, set once by the app for the current stage. */
export const ChapterContext = React.createContext('I');

export function Screen({
  children,
  footer,
  bare,
  progress,
  chapter,
  style,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
  bare?: boolean;
  progress?: number;
  chapter?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const current = React.useContext(ChapterContext);
  return (
    <View style={[{ flex: 1, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }, style]}>
      {!bare && <TopBar progress={progress} chapter={chapter ?? current} />}
      <View style={{ flex: 1, paddingHorizontal: space.gutter, overflow: 'hidden' }}>{children}</View>
      {footer && <View style={{ paddingHorizontal: space.gutter, paddingTop: 16, gap: 8 }}>{footer}</View>}
    </View>
  );
}

export function TopBar({ progress = 0, chapter }: { progress?: number; chapter: string }) {
  const v = useRef(new Animated.Value(progress)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: progress, duration: motion.slow, easing: motion.ease, useNativeDriver: false }).start();
  }, [progress]);
  return (
    <View style={{ paddingHorizontal: space.gutter, marginBottom: 32 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[T.label, { color: color.ink, letterSpacing: 6 }]}>CASE</Text>
        <Text style={T.mono}>23:17 · CH. {chapter}</Text>
      </View>
      <View style={{ height: 2, backgroundColor: color.line, marginTop: 16, borderRadius: 1 }}>
        <Animated.View
          style={{ height: 2, borderRadius: 1, backgroundColor: color.ink, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
        />
        {/* The head of the bar glows: where the story is now. */}
        <Animated.View
          style={{
            position: 'absolute',
            top: -2,
            marginLeft: -3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: color.ink,
            shadowColor: color.ink,
            shadowOpacity: 0.9,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 0 },
            left: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
    </View>
  );
}

export const Spacer = ({ h = 16 }: { h?: number }) => <View style={{ height: h }} />;
export const Flex = () => <View style={{ flex: 1 }} />;
export const Hairline = ({ style }: { style?: StyleProp<ViewStyle> }) => (
  <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: color.lineHi }, style]} />
);

// ---------- Controls ----------

function usePressScale() {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v: number, bounciness: number) => Animated.spring(scale, { toValue: v, useNativeDriver: motion.native, speed: 32, bounciness }).start();
  return { scale, onPressIn: () => to(0.955, 0), onPressOut: () => to(1, 12) };
}

/** The one big thumb-reachable action. */
export function PrimaryButton({ label, onPress, disabled, tone = 'ink' }: { label: string; onPress: () => void; disabled?: boolean; tone?: 'ink' | 'red' }) {
  const p = usePressScale();
  const [w, setW] = useState(0);
  const bg = tone === 'red' ? color.red : color.ink;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={() => {
        haptic.press();
        onPress();
      }}
    >
      <Animated.View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{
          height: 64,
          borderRadius: radius.m,
          backgroundColor: bg,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.35)',
          shadowColor: bg,
          shadowOpacity: disabled ? 0 : 0.35,
          shadowRadius: 32,
          shadowOffset: { width: 0, height: 10 },
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          opacity: disabled ? 0.28 : 1,
          transform: [{ scale: p.scale }],
        }}
      >
        {!disabled && w > 0 && <Glint width={w} tint={tone === 'red' ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)'} />}
        <Text key={label} style={[T.bodyStrong, { color: tone === 'red' ? color.ink : color.bg }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/**
 * Hold to confirm, for what cannot be undone (the accusation). The fill follows the thumb,
 * haptics tighten as it fills; releasing early drains it back.
 */
export function HoldButton({ label, onConfirm, disabled, duration = 1400 }: { label: string; onConfirm: () => void; disabled?: boolean; duration?: number }) {
  const fill = useRef(new Animated.Value(0)).current;
  const ticks = useRef<ReturnType<typeof setInterval>>(undefined);
  const [w, setW] = useState(0);
  const done = useRef(false);

  function press() {
    if (disabled || done.current) return;
    haptic.press();
    let n = 0;
    ticks.current = setInterval(() => {
      n += 1;
      n % 2 ? haptic.tap() : haptic.press();
    }, 140);
    Animated.timing(fill, { toValue: 1, duration, easing: motion.easeInOut, useNativeDriver: false }).start(({ finished }) => {
      clearInterval(ticks.current);
      if (!finished) return;
      done.current = true;
      haptic.alarm();
      onConfirm();
    });
  }
  function release() {
    clearInterval(ticks.current);
    if (done.current) return;
    Animated.timing(fill, { toValue: 0, duration: 320, easing: motion.ease, useNativeDriver: false }).start();
  }
  useEffect(() => () => clearInterval(ticks.current), []);

  return (
    <Pressable accessibilityRole="button" accessibilityHint="Maintenir pour confirmer" disabled={disabled} onPressIn={press} onPressOut={release}>
      <View
        onLayout={(e) => setW(e.nativeEvent.layout.width)}
        style={{ height: 64, borderRadius: radius.m, borderWidth: 1, borderColor: color.redLine, backgroundColor: color.redSoft, overflow: 'hidden', justifyContent: 'center', opacity: disabled ? 0.28 : 1 }}
      >
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: color.red, width: fill.interpolate({ inputRange: [0, 1], outputRange: [0, w] }) }} />
        <Text style={[T.bodyStrong, { textAlign: 'center', color: color.ink }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

export function GhostButton({ label, onPress, align = 'center' }: { label: string; onPress: () => void; align?: 'center' | 'left' }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        haptic.tap();
        onPress();
      }}
      style={{ minHeight: 48, justifyContent: 'center', alignItems: align === 'center' ? 'center' : 'flex-start' }}
    >
      <Text style={[T.body, { color: color.muted }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label,
  onPress,
  selected,
  disabled,
  icon,
}: {
  label: string;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  icon?: string;
}) {
  const p = usePressScale();
  return (
    <Pressable
      disabled={disabled}
      onPressIn={p.onPressIn}
      onPressOut={p.onPressOut}
      onPress={() => {
        haptic.tap();
        onPress();
      }}
    >
      <Animated.View
        style={{
          minHeight: 48,
          paddingHorizontal: 16,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: selected ? color.ink : color.lineHi,
          backgroundColor: selected ? color.ink : 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          opacity: disabled ? 0.35 : 1,
          transform: [{ scale: p.scale }],
        }}
      >
        {icon && <Text style={[T.mono, { color: selected ? color.bg : color.muted }]}>{icon}</Text>}
        <Text style={[T.body, { color: selected ? color.bg : color.ink }]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** Segmented control for exclusive choices (run modes). */
export function Segmented<K extends string>({ options, value, onChange }: { options: { key: K; label: string; sub?: string }[]; value: K; onChange: (k: K) => void }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: color.surface, borderRadius: radius.m, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              haptic.tap();
              onChange(o.key);
            }}
            style={{ flex: 1, borderRadius: radius.m - 4, paddingVertical: 12, alignItems: 'center', backgroundColor: on ? color.surfaceHi : 'transparent', borderWidth: 1, borderColor: on ? color.lineHi : 'transparent' }}
          >
            <Text style={[T.label, { color: on ? color.ink : color.muted }]}>{o.label}</Text>
            {o.sub && <Text style={[T.mono, { marginTop: 4, color: on ? color.inkSoft : color.faint }]}>{o.sub}</Text>}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Feedback ----------

export type ToastKind = 'info' | 'alert';

/** Slides down from the top: "Déclaration enregistrée", "Contradiction potentielle". */
export function Toast({ text, kind, onHide, leading }: { text: string; kind: ToastKind; onHide: () => void; leading?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(v, { toValue: 1, useNativeDriver: motion.native, speed: 14, bounciness: 9 }),
      Animated.delay(2200),
      Animated.timing(v, { toValue: 0, duration: 320, easing: motion.easeInOut, useNativeDriver: motion.native }),
    ]).start(onHide);
  }, [text]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: insets.top + 8,
        left: 16,
        right: 16,
        borderRadius: radius.m,
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: kind === 'alert' ? 'rgba(40,12,14,0.55)' : 'rgba(26,30,34,0.55)',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: kind === 'alert' ? color.redLine : color.lineHi,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-64, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
      }}
    >
      {/* Frosted glass: the story stays visible behind the notice. */}
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      {leading ?? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: kind === 'alert' ? color.red : color.ink }} />}
      <Text style={[T.label, { color: kind === 'alert' ? color.red : color.ink, flex: 1 }]}>
        {text}
      </Text>
    </Animated.View>
  );
}
