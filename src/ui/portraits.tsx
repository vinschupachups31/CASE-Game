import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { CharacterId, PortraitPart } from '../types/case';
import { revealedTraits } from '../engine/appearance';
import { RunState } from '../types/run';
import { color } from './theme';

// Character portraits: faceless silhouettes, lit from the left like a case-file photo.
// Suspects are discovered layer by layer (hair, clothes, an accessory) as the investigation
// finds photos, messages and witnesses. Never a face: the player imagines it, the voice does the rest.

export type PortraitId = CharacterId | 'nora' | 'ines' | 'paul';

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

type Has = (part: PortraitPart) => boolean;

/** Bare silhouette: what the player sees of someone they have not discovered yet. */
const Base = () => (
  <>
    <Path d={BODY} fill="url(#cloth)" />
    <Head />
  </>
);

const FIGURES: Record<PortraitId, (has: Has) => React.ReactElement> = {
  nora: () => (
    <>
      {/* Shoulder-length hair, behind the head. */}
      <Path d="M33 44 C30 20 70 20 67 44 L70 67 C65 69 60 64 60 57 L40 57 C40 64 35 69 30 67 Z" fill={HAIR} />
      <Base />
      <Path d="M34.5 40 C37 25 63 25 65.5 40 C60 31 46 29 34.5 40 Z" fill={HAIR} />
      {/* The red scarf: the only colour she carries. */}
      <Path d="M36 67 C43 74 57 74 64 67 L66 74 C57 81 43 81 34 74 Z" fill={color.red} />
      <Path d="M56 76 L61 96 L54 96 L52 78 Z" fill={color.red} opacity={0.85} />
    </>
  ),
  leo: (has) => (
    <>
      {/* Grey hoodie, hood down behind the head. */}
      {has('top') && <Ellipse cx={50} cy={50} rx={23} ry={24} fill="url(#hoodie)" />}
      <Path d={BODY} fill={has('top') ? 'url(#hoodie)' : 'url(#cloth)'} />
      <Head />
      {has('hair') && <Path d="M35 38 L36 27 L41 31 L44 22 L49.5 29 L55 21 L58 29 L63 25 L65 38 C59 31 42 30 35 38 Z" fill={HAIR} />}
      {has('top') && (
        <>
          <Line x1={45} y1={74} x2={44} y2={88} stroke={color.inkSoft} strokeWidth={1} strokeLinecap="round" />
          <Line x1={55} y1={74} x2={56} y2={88} stroke={color.inkSoft} strokeWidth={1} strokeLinecap="round" />
        </>
      )}
      {/* Wired earbuds: two dots at the ears, a cable down the chest. */}
      {has('accessory') && (
        <G stroke={color.ink} strokeWidth={0.9} fill="none">
          <Circle cx={35.5} cy={45} r={1.6} fill={color.ink} />
          <Circle cx={64.5} cy={45} r={1.6} fill={color.ink} />
          <Path d="M35.5 47 C36 60 44 66 50 72 M64.5 47 C64 60 56 66 50 72 L50 94" />
        </G>
      )}
    </>
  ),
  sarah: (has) => (
    <>
      <Path d={BODY} fill="url(#cloth)" />
      {/* Jacket lapels and a press badge on a lanyard. */}
      {has('top') && (
        <>
          <Path d="M40 71 L50 92 L60 71" stroke={color.faint} strokeWidth={1} fill="none" />
          <Path d="M42 71 L47 84 M58 71 L53 84" stroke={color.red} strokeWidth={0.9} />
          <Rect x={45} y={83} width={10} height={7} rx={1} fill={color.ink} />
          <Rect x={46.5} y={85} width={7} height={1} fill={color.bg} />
        </>
      )}
      <Head />
      {has('hair') && (
        <>
          <Circle cx={50} cy={22} r={7.5} fill={HAIR} />
          <Path d="M35 44 C32 24 68 24 65 44 C62 32 38 32 35 44 Z" fill={HAIR} />
        </>
      )}
      {has('accessory') && (
        <G stroke={color.inkSoft} strokeWidth={1.2} fill="none">
          <Rect x={38} y={40} width={10} height={7} rx={2.5} />
          <Rect x={52} y={40} width={10} height={7} rx={2.5} />
          <Line x1={48} y1={43} x2={52} y2={43} />
        </G>
      )}
    </>
  ),
  marc: (has) => (
    <>
      {/* Broad dark suit, white collar, thin dark tie. */}
      {has('top') ? (
        <>
          <Path d="M4 100 C6 78 26 68 50 68 C74 68 94 78 96 100 Z" fill="url(#suit)" />
          <Path d="M42 69 L50 84 L58 69 Z" fill={color.inkSoft} />
          <Path d="M48.6 73 L51.4 73 L52.6 90 L50 94 L47.4 90 Z" fill={color.bg} />
          <Path d="M38 71 L50 96 M62 71 L50 96" stroke={color.faint} strokeWidth={1} />
        </>
      ) : (
        <Path d={BODY} fill="url(#cloth)" />
      )}
      <Head />
      {/* Receding grey hair: sides only. */}
      {has('hair') && (
        <>
          <Path d="M35.5 46 C34 34 38 28 44 27 L41 42 Z" fill="#8A8782" />
          <Path d="M64.5 46 C66 34 62 28 56 27 L59 42 Z" fill="#8A8782" />
        </>
      )}
      {/* Gold watch at the wrist, lower left. */}
      {has('accessory') && (
        <>
          <Rect x={25} y={84} width={10} height={7} rx={1.5} fill="#C9A45C" />
          <Circle cx={30} cy={87.5} r={1.8} fill={color.bg} />
        </>
      )}
    </>
  ),
  // Witnesses: known from the start, they are not suspects.
  ines: () => (
    <>
      {/* Ponytail and a waitress apron. */}
      <Path d="M62 34 C74 38 74 58 66 66 C68 54 66 44 60 40 Z" fill={HAIR} />
      <Base />
      <Path d="M35 42 C33 24 67 24 65 42 C60 32 40 32 35 42 Z" fill={HAIR} />
      <Path d="M36 80 L64 80 L66 100 L34 100 Z" fill={color.inkSoft} opacity={0.85} />
      <Path d="M40 80 L44 72 M60 80 L56 72" stroke={color.inkSoft} strokeWidth={1.2} />
    </>
  ),
  paul: () => (
    <>
      {/* Grey moustache, flat cap, sleeveless vest. */}
      <Base />
      <Path d="M44 70 L50 100 L56 70" stroke={color.faint} strokeWidth={1} fill="none" />
      <Path d="M24 76 C30 72 38 70 44 70 L48 100 L20 100 Z M76 76 C70 72 62 70 56 70 L52 100 L80 100 Z" fill="#3A3F45" />
      <Path d="M44 49 C47 47 53 47 56 49 L55 51 C52 50 48 50 45 51 Z" fill="#9A968F" />
      <Path d="M34 34 C36 22 64 22 66 34 L72 36 C72 38 60 38 50 37 C42 37 34 37 34 34 Z" fill="#2B2F34" />
    </>
  ),
  unknown: () => (
    <>
      <Base />
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
  parts,
}: {
  id: PortraitId;
  /** Layers discovered so far; omitted = the full portrait (Nora, or a case that is closed). */
  parts?: PortraitPart[];
  size?: number;
  /** Border colour: red for a selected or threatening person. */
  ring?: string;
  /** Not met yet: a faded, dashed placeholder. */
  dim?: boolean;
}) {
  const figure = FIGURES[id]((part) => !parts || parts.includes(part));
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
          <LinearGradient id="hoodie" x1="0" y1="0" x2="1" y2="0.4">
            <Stop offset="0" stopColor="#6A6F75" />
            <Stop offset="1" stopColor="#2E3236" />
          </LinearGradient>
          <LinearGradient id="suit" x1="0" y1="0" x2="1" y2="0.4">
            <Stop offset="0" stopColor="#23272D" />
            <Stop offset="1" stopColor="#0C0E10" />
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
          {figure}
        </G>
      </Svg>
    </View>
  );
}

/** Layers the player has discovered for this person; undefined = always fully known. */
export function partsFor(run: RunState, id: PortraitId): PortraitPart[] | undefined {
  if (id !== 'leo' && id !== 'sarah' && id !== 'marc') return undefined;
  return revealedTraits(run, id).map((t) => t.part);
}
