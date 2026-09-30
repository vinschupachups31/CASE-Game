import * as Speech from 'expo-speech';

// Character voices. Uses the device's French speech synthesis (expo-speech; Web Speech in a browser).
// Each character gets its own pitch, pace and, when the device has several French voices, its own voice.
// Recorded voice acting can replace this later without touching the screens.

export type Speaker = 'nora' | 'leo' | 'sarah' | 'marc' | 'unknown';

const PROFILE: Record<Speaker, { pitch: number; rate: number; slot: number }> = {
  nora: { pitch: 1.08, rate: 0.9, slot: 0 },
  sarah: { pitch: 1.18, rate: 1.04, slot: 1 },
  leo: { pitch: 0.95, rate: 1.0, slot: 2 },
  marc: { pitch: 0.72, rate: 0.88, slot: 3 },
  unknown: { pitch: 0.5, rate: 0.78, slot: 3 },
};

let enabled = true;
let frenchVoices: string[] | undefined;
const listeners = new Set<(on: boolean) => void>();

async function loadVoices() {
  if (frenchVoices) return frenchVoices;
  try {
    const all = await Speech.getAvailableVoicesAsync();
    frenchVoices = all.filter((v) => v.language?.toLowerCase().startsWith('fr')).map((v) => v.identifier);
  } catch {
    frenchVoices = [];
  }
  return frenchVoices;
}
loadVoices();

/** Approximate spoken duration, used to pace subtitles and as a safety net when no voice is available. */
export function estimateMs(text: string, who: Speaker): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.round((words * 390) / PROFILE[who].rate) + 300;
}

export function isVoiceOn() {
  return enabled;
}

export function setVoiceOn(on: boolean) {
  enabled = on;
  if (!on) Speech.stop();
  listeners.forEach((l) => l(on));
}

export function onVoiceChange(l: (on: boolean) => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** Speaks a line; `onDone` fires exactly once, when the line ends or would have ended. */
export function speak(text: string, who: Speaker, onDone?: () => void) {
  let finished = false;
  const done = () => {
    if (finished) return;
    finished = true;
    clearTimeout(safety);
    onDone?.();
  };
  const expected = estimateMs(text, who);
  // Some browsers never report the end of speech (or have no French voice): never block the story on it.
  const safety = setTimeout(done, enabled ? expected * 1.8 + 1500 : expected);
  if (!enabled) return;

  const p = PROFILE[who];
  const voices = frenchVoices ?? [];
  try {
    Speech.stop();
    Speech.speak(text, {
      language: 'fr-FR',
      voice: voices.length ? voices[p.slot % voices.length] : undefined,
      pitch: p.pitch,
      rate: p.rate,
      onDone: done,
      onError: done,
    });
  } catch {
    // No speech engine: the subtitles still carry the line.
  }
}

export function stopVoice() {
  try {
    Speech.stop();
  } catch {}
}
