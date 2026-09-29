import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import { color } from './theme';

type P = { size?: number; tint?: string };

export const PlayIcon = ({ size = 18, tint = color.bg }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M7 4.5v15l12-7.5z" fill={tint} />
  </Svg>
);

export const PhoneIcon = ({ size = 26, tint = color.ink, down = false }: P & { down?: boolean }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" style={down ? { transform: [{ rotate: '135deg' }] } : undefined}>
    <Path
      d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"
      fill={tint}
    />
  </Svg>
);

export const DeviceIcon = ({ size = 64, tint = color.ink }: P) => (
  <Svg width={size * 0.6} height={size} viewBox="0 0 36 60">
    <Rect x={1} y={1} width={34} height={58} rx={7} stroke={tint} strokeWidth={1.5} fill="none" />
    <Line x1={14} y1={6} x2={22} y2={6} stroke={tint} strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

export const FileIcon = ({ size = 20, tint = color.inkSoft }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 2.8h8l4.2 4.2v14.2H6z" stroke={tint} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
    <Path d="M14 2.8V7h4.2" stroke={tint} strokeWidth={1.4} fill="none" strokeLinejoin="round" />
  </Svg>
);

export const ShieldIcon = ({ size = 16, tint = color.muted }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 3l7 3v5.5c0 4.4-3 8.2-7 9.5-4-1.3-7-5.1-7-9.5V6z" stroke={tint} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
  </Svg>
);

export const ShareIcon = ({ size = 18, tint = color.bg }: P) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 3v12M7 8l5-5 5 5" stroke={tint} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 13v6.5h14V13" stroke={tint} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** Minimal compass: ticks and a needle pointing to the bearing (rotation handled by the parent). */
export const CompassDial = ({ size = 260 }: { size?: number }) => {
  const c = size / 2;
  const ticks = [...Array(72)].map((_, i) => {
    const a = (i * 5 * Math.PI) / 180;
    const major = i % 18 === 0;
    const r1 = c - 6;
    const r2 = c - (major ? 22 : i % 2 === 0 ? 14 : 10);
    return (
      <Line
        key={i}
        x1={c + r1 * Math.sin(a)}
        y1={c - r1 * Math.cos(a)}
        x2={c + r2 * Math.sin(a)}
        y2={c - r2 * Math.cos(a)}
        stroke={major ? color.ink : color.faint}
        strokeWidth={major ? 1.6 : 1}
      />
    );
  });
  return (
    <Svg width={size} height={size}>
      <Circle cx={c} cy={c} r={c - 1} stroke={color.line} strokeWidth={1} fill="none" />
      {ticks}
    </Svg>
  );
};

export const Needle = ({ size = 260 }: { size?: number }) => {
  const c = size / 2;
  return (
    <Svg width={size} height={size}>
      <Path d={`M${c} ${34} L${c + 9} ${c} L${c} ${c - 12} L${c - 9} ${c} Z`} fill={color.red} />
      <Path d={`M${c} ${size - 34} L${c + 9} ${c} L${c} ${c + 12} L${c - 9} ${c} Z`} fill={color.faint} />
      <Circle cx={c} cy={c} r={4} fill={color.bg} stroke={color.ink} strokeWidth={1.5} />
    </Svg>
  );
};
