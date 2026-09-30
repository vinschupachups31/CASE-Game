import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { CharacterId } from '../types/case';
import { color } from './theme';

// Character portraits: faceless silhouettes, lit from the left like a case-file photo.
// Each one is read from a single trait (Nora's red scarf, Léo's hood, Sarah's glasses, Marc's tie),
// never from a face: the player imagines the face, the voice does the rest.

export type PortraitId = CharacterId | 'nora';

const SKIN = ['#5A616A', '#262B31'] as const;
const CLOTH = ['#343A42', '#15181C'] as const;
const HAIR = '#0A0B0D';

const BODY = 'M8 100 C10 80 28 70 50 70 C72 70 90 80 92 100 Z';

function Head() {
  return (
    <>
      <Rect x={43} y={54} width={14} height={18} fill="url(#skin)" />
      <Ellipse cx={50} cy={42} rx={14.5} ry={17.5} fill="url(#skin)" />
    </>
  );
}

const FIGURES: Record<PortraitId, () => React.ReactElement> = {
  nora: () => (
    <>
      {/* Shoulder-length hair, behind the head. */}
      <Path d="M33 44 C30 20 70 20 67 44 L70 67 C65 69 60 64 60 57 L40 57 C40 64 35 69 30 67 Z" fill={HAIR} />
      <Path d={BODY} fill="url(#cloth)" />
      <Head />
      <Path d="M34.5 40 C37 25 63 25 65.5 40 C60 31 46 29 34.5 40 Z" fill={HAIR} />
      {/* The red scarf: the only colour she carries. */}
      <Path d="M36 67 C43 74 57 74 64 67 L66 74 C57 81 43 81 34 74 Z" fill={color.red} />
      <Path d="M56 76 L61 96 L54 96 L52 78 Z" fill={color.red} opacity={0.85} />
    </>
  ),
  leo: () => (
    <>
      {/* Hood down, behind the head. */}
      <Ellipse cx={50} cy={50} rx={23} ry={24} fill="url(#cloth)" />
      <Path d={BODY} fill="url(#cloth)" />
      <Head />
      <Path d="M35 38 L36 27 L41 31 L44 22 L49.5 29 L55 21 L58 29 L63 25 L65 38 C59 31 42 30 35 38 Z" fill={HAIR} />
      {/* Hoodie strings. */}
      <Line x1={45} y1={74} x2={44} y2={90} stroke={color.inkSoft} strokeWidth={1} strokeLinecap="round" />
      <Line x1={55} y1={74} x2={56} y2={90} stroke={color.inkSoft} strokeWidth={1} strokeLinecap="round" />
    </>
  ),
  sarah: () => (
    <>
      <Path d={BODY} fill="url(#cloth)" />
      {/* Blazer lapels. */}
      <Path d="M40 71 L50 92 L60 71" stroke={color.faint} strokeWidth={1} fill="none" />
      <Head />
      <Circle cx={50} cy={22} r={7.5} fill={HAIR} />
      <Path d="M35 44 C32 24 68 24 65 44 C62 32 38 32 35 44 Z" fill={HAIR} />
      {/* Glasses. */}
      <G stroke={color.inkSoft} strokeWidth={1.2} fill="none">
        <Rect x={38} y={40} width={10} height={7} rx={2.5} />
        <Rect x={52} y={40} width={10} height={7} rx={2.5} />
        <Line x1={48} y1={43} x2={52} y2={43} />
      </G>
    </>
  ),
  marc: () => (
    <>
      {/* Broad suit, white collar, thin dark tie. */}
      <Path d="M4 100 C6 78 26 68 50 68 C74 68 94 78 96 100 Z" fill="url(#cloth)" />
      <Path d="M42 69 L50 84 L58 69 Z" fill={color.inkSoft} />
      <Path d="M48.6 73 L51.4 73 L52.6 90 L50 94 L47.4 90 Z" fill={color.bg} />
      <Path d="M38 71 L50 96 M62 71 L50 96" stroke={color.faint} strokeWidth={1} />
      <Head />
      {/* Receding grey hair: sides only. */}
      <Path d="M35.5 46 C34 34 38 28 44 27 L41 42 Z" fill="#8A8782" />
      <Path d="M64.5 46 C66 34 62 28 56 27 L59 42 Z" fill="#8A8782" />
    </>
  ),
  unknown: () => (
    <>
      <Path d={BODY} fill="url(#cloth)" />
      <Head />
      {/* A signal, not a person. */}
      <G opacity={0.55} transform="translate(2.5 0)">
        <Ellipse cx={50} cy={42} rx={14.5} ry={17.5} fill="none" stroke={color.red} strokeWidth={1} />
      </G>
      <SvgText x={50} y={50} fontSize={22} fill={color.red} textAnchor="middle" fontWeight="600">
        ?
      </SvgText>
    </>
  ),
};

export function Portrait({
  id,
  size = 96,
  ring = color.lineHi,
  dim,
}: {
  id: PortraitId;
  size?: number;
  /** Border colour: red for a selected or threatening person. */
  ring?: string;
  /** Not met yet: a faded, dashed placeholder. */
  dim?: boolean;
}) {
  const Figure = FIGURES[id];
  const clip = `clip-${id}`;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: ring,
        borderStyle: dim ? 'dashed' : 'solid',
        overflow: 'hidden',
        opacity: dim ? 0.35 : 1,
        backgroundColor: color.surfaceHi,
      }}
    >
      <Svg width={size - 2} height={size - 2} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="skin" x1="0" y1="0" x2="1" y2="0.3">
            <Stop offset="0" stopColor={SKIN[0]} />
            <Stop offset="1" stopColor={SKIN[1]} />
          </LinearGradient>
          <LinearGradient id="cloth" x1="0" y1="0" x2="1" y2="0.4">
            <Stop offset="0" stopColor={CLOTH[0]} />
            <Stop offset="1" stopColor={CLOTH[1]} />
          </LinearGradient>
          <LinearGradient id="back" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color.surfaceHi} />
            <Stop offset="1" stopColor={color.bg} />
          </LinearGradient>
          <ClipPath id={clip}>
            <Circle cx={50} cy={50} r={50} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#${clip})`}>
          <Rect x={0} y={0} width={100} height={100} fill="url(#back)" />
          <Figure />
        </G>
      </Svg>
    </View>
  );
}
