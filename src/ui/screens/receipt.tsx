import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Polygon, Rect } from 'react-native-svg';
import { RunState } from '../../types/run';
import { Scramble } from '../fx';
import { font } from '../theme';

// Evidence 04: a real café receipt, thermal paper and all. It names the waitress,
// which is why the player calls the café next.

const PAPER = '#EDE7DB';
const INKP = '#26231F';
const FADED = 'rgba(38,35,31,0.55)';

const mono = { fontFamily: font.mono, fontSize: 12, lineHeight: 18, color: INKP };

function Row({ left, right, strong }: { left: string; right?: string; strong?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[mono, strong && { fontSize: 17, lineHeight: 24 }]}>{left}</Text>
      {right !== undefined && <Text style={[mono, strong && { fontSize: 17, lineHeight: 24 }]}>{right}</Text>}
    </View>
  );
}

const Rule = () => <View style={{ borderBottomWidth: 1, borderColor: FADED, borderStyle: 'dashed', marginVertical: 8 }} />;

/** Torn thermal-paper edge. */
function Edge({ width, flip }: { width: number; flip?: boolean }) {
  const teeth = Math.max(1, Math.round(width / 10));
  const w = width / teeth;
  const pts = [`0,${flip ? 0 : 8}`];
  for (let i = 0; i < teeth; i++) pts.push(`${i * w + w / 2},${flip ? 8 : 0}`, `${(i + 1) * w},${flip ? 0 : 8}`);
  pts.push(`${width},${flip ? 0 : 8}`, `${width},${flip ? 0 : 8}`);
  const poly = flip ? [...pts, `${width},0`, '0,0'] : [...pts, `${width},8`, '0,8'];
  return (
    <Svg width={width} height={8}>
      <Polygon points={poly.join(' ')} fill={PAPER} />
    </Svg>
  );
}

function Barcode({ width }: { width: number }) {
  // Deterministic bars: the same receipt every time.
  const bars: { x: number; w: number }[] = [];
  let x = 0;
  let seed = 1927;
  while (x < width) {
    seed = (seed * 9301 + 49297) % 233280;
    const w = 1 + (seed % 3);
    bars.push({ x, w });
    x += w + 1 + ((seed >> 3) % 3);
  }
  return (
    <Svg width={width} height={36}>
      {bars.map((b, i) => (
        <Rect key={i} x={b.x} y={0} width={b.w} height={36} fill={INKP} />
      ))}
    </Svg>
  );
}

export function Receipt({ run }: { run: RunState }) {
  const [w, setW] = useState(0);
  const number = run.variables.WORLD_01?.value ?? '2317';
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ transform: [{ rotate: '-1.2deg' }] }}>
      {w > 0 && <Edge width={w} />}
      <View style={{ backgroundColor: PAPER, paddingHorizontal: 20, paddingVertical: 16 }}>
        <Text style={[mono, { textAlign: 'center', fontSize: 17, lineHeight: 24, letterSpacing: 2 }]}>CAFÉ DU MARCHÉ</Text>
        <Text style={[mono, { textAlign: 'center', color: FADED }]}>Place du Marché</Text>
        <Text style={[mono, { textAlign: 'center', color: FADED }]}>Ouvert 7j/7 · 7h – minuit</Text>
        <Rule />
        <Row left="29/09" right="22:34" />
        <Row left={`TICKET N° ${number}`} right="TABLE 4" />
        <Row left="SERVEUSE" right="INÈS" />
        <Rule />
        <Row left="2 x CAFÉ SERRÉ" right="4,80" />
        <Row left="   à 2,40" />
        <Rule />
        <Row left="TOTAL TTC" right="4,80 €" strong />
        <Row left="dont TVA 10 %" right="0,44" />
        <Row left="ESPÈCES" right="5,00" />
        <Row left="RENDU" right="0,20" />
        <Rule />
        <Text style={[mono, { textAlign: 'center' }]}>2 COUVERTS</Text>
        <Text style={[mono, { textAlign: 'center', color: FADED }]}>Merci de votre visite</Text>
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          {w > 0 && <Barcode width={Math.min(200, w - 80)} />}
          <Scramble text={`0${number}2934 22341`} delay={600} style={[mono, { fontSize: 12, marginTop: 4 }]} />
        </View>
      </View>
      {w > 0 && <Edge width={w} flip />}
    </View>
  );
}
