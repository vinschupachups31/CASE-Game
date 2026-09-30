import React, { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { contradictionView } from '../../engine/gameEngine';
import { linkStatus, notebookNodes } from '../../engine/notebook';
import { Flow, Stage, progressOf } from '../flow';
import { haptic } from '../haptics';
import { Eyebrow, Flex, PrimaryButton, Screen, Spacer, T } from '../kit';
import { Reveal } from '../motion';
import { Portrait, PortraitId } from '../portraits';
import { color } from '../theme';

// Spatial, minimal, tactile. Not a wall of red strings: a few nodes, lines that mean something.

const POSITIONS: Record<string, { x: number; y: number }> = {
  nora: { x: 0.5, y: 0.42 },
  leo: { x: 0.16, y: 0.12 },
  sarah: { x: 0.84, y: 0.12 },
  marc: { x: 0.5, y: 0.9 },
};
const ALL = ['nora', 'leo', 'sarah', 'marc'];
const NODE = 72;

export function Board({ flow, next, cta = 'Reprendre la route' }: { flow: Flow; next: Stage; cta?: string }) {
  const { width } = useWindowDimensions();
  const W = Math.min(width, 480) - 48;
  const H = 320;
  const nodes = notebookNodes(flow.run);
  const known = new Set(nodes.map((n) => n.id));
  const [selected, setSelected] = useState<string>();
  const [last, setLast] = useState<ReturnType<typeof linkStatus>>();
  const contradictions = contradictionView(flow.run);

  const at = (id: string) => ({ x: POSITIONS[id].x * W, y: POSITIONS[id].y * H });

  function tap(id: string) {
    if (!known.has(id)) return;
    if (!selected) {
      haptic.tap();
      return setSelected(id);
    }
    if (selected !== id) {
      const st = linkStatus(flow.run, selected, id);
      st.status === 'FAIT ÉTABLI' ? haptic.confirm() : haptic.press();
      flow.apply({ type: 'LINK', a: selected, b: id });
      setLast(st);
    }
    setSelected(undefined);
  }

  return (
    <Screen progress={progressOf(flow.stage)} footer={<PrimaryButton label={cta} disabled={flow.run.links.length === 0} onPress={() => flow.go(next)} />}>
      <Reveal>
        <Eyebrow>Carnet</Eyebrow>
        <Spacer h={8} />
        <Text style={T.title}>
          Qui est lié à <Text style={T.italic}>qui ?</Text>
        </Text>
        <Text style={T.caption}>Touche deux personnes pour les relier.</Text>
      </Reveal>
      <Spacer h={24} />
      <View style={{ width: W, height: H + NODE / 2 + 16 }}>
        <Svg width={W} height={H} style={{ position: 'absolute' }}>
          {flow.run.links.map((l) => {
            const a = at(l.a);
            const b = at(l.b);
            const fact = linkStatus(flow.run, l.a, l.b).status === 'FAIT ÉTABLI';
            return (
              <Line
                key={l.a + l.b}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={fact ? color.ink : color.red}
                strokeOpacity={fact ? 0.9 : 0.7}
                strokeWidth={fact ? 1.5 : 1}
                strokeDasharray={fact ? undefined : '4 6'}
              />
            );
          })}
        </Svg>
        {ALL.map((id) => {
          const p = at(id);
          const node = nodes.find((n) => n.id === id);
          const on = selected === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityLabel={node?.label ?? 'Inconnu'}
              onPress={() => tap(id)}
              style={{ position: 'absolute', left: p.x - NODE / 2, top: p.y - NODE / 2, width: NODE, alignItems: 'center' }}
            >
              <Portrait id={id as PortraitId} size={NODE} dim={!node} ring={on ? color.ink : id === 'nora' ? color.redLine : color.lineHi} />
              <Text style={[T.label, { letterSpacing: 1, marginTop: 4, color: on ? color.ink : node ? color.inkSoft : color.faint }]}>{node?.label ?? '?'}</Text>
            </Pressable>
          );
        })}
      </View>
      <Flex />
      {last ? (
        <Reveal key={flow.run.links.length}>
          <Text style={[T.label, { color: last.status === 'FAIT ÉTABLI' ? color.ink : color.red }]}>{last.status}</Text>
          <Text style={T.body}>{last.label ?? 'Rien ne le prouve. Pour l’instant.'}</Text>
        </Reveal>
      ) : (
        <View style={{ flexDirection: 'row', gap: 24 }}>
          <Legend dashed={false} label="Fait établi" />
          <Legend dashed label="Hypothèse" />
        </View>
      )}
      <Spacer h={8} />
      <Text style={T.mono}>
        {flow.run.evidence.length} PREUVES · {contradictions.length} CONTRADICTION{contradictions.length > 1 ? 'S' : ''}
      </Text>
      <Spacer h={16} />
    </Screen>
  );
}

function Legend({ dashed, label }: { dashed: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Svg width={24} height={2}>
        <Line x1={0} y1={1} x2={24} y2={1} stroke={dashed ? color.red : color.ink} strokeWidth={1.5} strokeDasharray={dashed ? '4 4' : undefined} />
      </Svg>
      <Text style={T.caption}>{label}</Text>
    </View>
  );
}
