import { createAudioPlayer, AudioPlayer } from 'expo-audio';
import { CLIPS } from '../voice/manifest';
import { Speaker, lineIdFor } from '../voice/lines';

// Recorded character voices. A line without a recording stays silent: the subtitles carry it.
// No synthetic device voice — it breaks the immersion.

export type { Speaker };

let enabled = true;
let current: AudioPlayer | undefined;
const listeners = new Set<(on: boolean) => void>();

/** Clips inlined by the hosted demo page (data URIs), else the bundled assets. */
function sourceFor(id: string): string | number | undefined {
  const inlined = (globalThis as { __CASE_VOICES__?: Record<string, string> }).__CASE_VOICES__;
  return inlined?.[id] ?? CLIPS[id];
}

export function hasRecording(speaker: Speaker, text: string): boolean {
  const id = lineIdFor(speaker, text);
  return !!id && sourceFor(id) !== undefined;
}

/** Reading pace for subtitles, and the safety net for the end of a clip. */
export function estimateMs(text: string): number {
  return text.split(/\s+/).filter(Boolean).length * 380 + 300;
}

export function isVoiceOn() {
  return enabled;
}

export function setVoiceOn(on: boolean) {
  enabled = on;
  if (!on) stopVoice();
  listeners.forEach((l) => l(on));
}

export function onVoiceChange(l: (on: boolean) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function stopVoice() {
  try {
    current?.pause();
    current?.remove();
  } catch {}
  current = undefined;
}

/** Plays a character's line; `onDone` fires exactly once, when it ends (or would have been read). */
export function speak(text: string, speaker: Speaker, onDone?: () => void) {
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safety);
    onDone?.();
  };
  const id = lineIdFor(speaker, text);
  const source = id ? sourceFor(id) : undefined;
  stopVoice();
  const expected = estimateMs(text);
  const safety = setTimeout(done, source !== undefined && enabled ? expected * 2 + 2000 : expected);
  if (source === undefined || !enabled) return;
  try {
    const player = createAudioPlayer(source);
    current = player;
    player.addListener('playbackStatusUpdate', (s) => {
      if (s.didJustFinish) done();
    });
    player.play();
  } catch {
    // Playback refused (e.g. before any tap on the web): the subtitles still carry the line.
  }
}
