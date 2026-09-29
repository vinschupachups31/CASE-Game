import React, { useEffect, useRef } from 'react';
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
export function Screen({
  children,
  footer,
  bare,
  progress,
  chapter = 'I',
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
  return (
    <View style={[{ flex: 1, backgroundColor: color.bg, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }, style]}>
      {!bare && <TopBar progress={progress} chapter={chapter} />}
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
      <View style={{ height: 2, backgroundColor: color.line, marginTop: 16, borderRadius: 1, overflow: 'hidden' }}>
        <Animated.View
          style={{ height: 2, backgroundColor: color.ink, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }}
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
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: motion.native, speed: 40, bounciness: 0 }).start();
  return { scale, onPressIn: () => to(0.975), onPressOut: () => to(1) };
}

/** The one big thumb-reachable action. */
export function PrimaryButton({ label, onPress, disabled, tone = 'ink' }: { label: string; onPress: () => void; disabled?: boolean; tone?: 'ink' | 'red' }) {
  const p = usePressScale();
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
        style={{
          height: 64,
          borderRadius: radius.m,
          backgroundColor: bg,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.35)',
          shadowColor: bg,
          shadowOpacity: disabled ? 0 : 0.25,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.28 : 1,
          transform: [{ scale: p.scale }],
        }}
      >
        <Text style={[T.bodyStrong, { color: tone === 'red' ? color.ink : color.bg }]}>{label}</Text>
      </Animated.View>
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
export function Toast({ text, kind, onHide }: { text: string; kind: ToastKind; onHide: () => void }) {
  const insets = useSafeAreaInsets();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 420, easing: motion.ease, useNativeDriver: motion.native }),
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
        backgroundColor: kind === 'alert' ? '#1A0D0E' : color.surfaceHi,
        borderWidth: 1,
        borderColor: kind === 'alert' ? color.redLine : color.lineHi,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        opacity: v,
        transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: kind === 'alert' ? color.red : color.ink }} />
      <Text style={[T.label, { color: kind === 'alert' ? color.red : color.ink, flex: 1 }]}>
        {text}
      </Text>
    </Animated.View>
  );
}
