import { Easing, Platform } from 'react-native';

/** CASE design tokens — contemporary premium thriller. Red is rare: danger, alert, critical only. */
export const color = {
  bg: '#07080A',
  bgRaised: '#0E1012',
  surface: '#131619',
  surfaceHi: '#1A1E22',
  line: 'rgba(242,237,228,0.08)',
  lineHi: 'rgba(242,237,228,0.16)',
  ink: '#F2EDE4',
  inkSoft: 'rgba(242,237,228,0.72)',
  muted: 'rgba(242,237,228,0.46)',
  faint: 'rgba(242,237,228,0.24)',
  red: '#E5484D',
  redSoft: 'rgba(229,72,77,0.14)',
  redLine: 'rgba(229,72,77,0.4)',
  black: '#000000',
} as const;

/** Serif for narrative, sans for interface, mono only for data (times, files, codes). Two weights: 400 / 600. */
export const font = {
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  body: 'Inter_400Regular',
  semibold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_400Regular',
} as const;

/** Exactly four sizes. Hierarchy comes from size, family and opacity — not from more sizes. */
export const size = { display: 56, title: 32, body: 17, label: 12 } as const;

/** 8-point grid. */
export const space = { xs: 4, s: 8, m: 16, l: 24, xl: 32, xxl: 48, xxxl: 64, gutter: 24 } as const;
export const radius = { s: 8, m: 16, l: 24, pill: 999 } as const;

export const motion = {
  /** Expo-out: fast start, long soft landing. */
  ease: Easing.bezier(0.16, 1, 0.3, 1),
  easeInOut: Easing.bezier(0.65, 0, 0.35, 1),
  fast: 220,
  base: 520,
  slow: 900,
  native: Platform.OS !== 'web',
} as const;
