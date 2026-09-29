import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Vibration is part of the narration: the player walks with the phone away, CASE calls them back.

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function safe(run: () => Promise<unknown>, webPattern?: number | number[]) {
  if (Platform.OS === 'web') {
    try {
      if (webPattern && typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(webPattern);
    } catch {}
    return;
  }
  run().catch(() => {});
}

export const haptic = {
  tap: () => safe(() => Haptics.selectionAsync()),
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 8),
  confirm: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), [12, 60, 24]),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning), [30, 80, 30]),
  /** Two beats, like a pulse — used when entering a search zone. */
  heartbeat: () =>
    safe(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await wait(140);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [40, 120, 25]),
  /** Long, insistent — incoming call or the unknown number. */
  alarm: () =>
    safe(async () => {
      for (let i = 0; i < 3; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        await wait(90);
      }
    }, [60, 60, 60, 60, 120]),
  ring: () =>
    safe(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await wait(110);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, [25, 110, 25]),
};
