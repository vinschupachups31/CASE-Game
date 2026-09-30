// Save: the investigation survives closing the app — the 07:42 appointment depends on it.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunState } from '../types/run';
import { Profile } from '../engine/simulator';
import { STAGES, Stage } from './flow';
import { World } from './device';

const KEY = 'case:23-17:save';

export type Saved = {
  v: 1;
  run: RunState;
  stage: Stage;
  profileId: Profile['id'];
  world?: World;
  capturedAt?: number;
  /** When chapter I ended: the chapter II appointment is the next 07:42 after it. */
  endedAt?: number;
};

/** Screens that hold unsaved state (a value under the lens) reopen one step earlier. */
const RESUME_AT: Partial<Record<Stage, Stage>> = { detect1: 'capture1', detect2: 'capture2', detect3: 'capture3' };

export const resumeStage = (stage: Stage): Stage => RESUME_AT[stage] ?? stage;

export async function loadGame(): Promise<Saved | undefined> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return undefined;
    const s = JSON.parse(raw) as Saved;
    if (s.v !== 1 || !STAGES.includes(s.stage)) return undefined;
    return { ...s, stage: resumeStage(s.stage) };
  } catch {
    return undefined;
  }
}

export async function saveGame(s: Saved): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

export async function clearGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
