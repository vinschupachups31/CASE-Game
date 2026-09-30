// Device: GPS, compass heading and the 07:42 notification. Every call degrades gracefully:
// no permission, no signal or the web → the game carries on (simulation, manual arrival, countdown).

import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { LatLon } from '../engine/geo';
import { fetchPlaces } from '../engine/places';
import { Candidate } from '../engine/worldEngine';

export type World = { origin: LatLon; places: Candidate[] };

/**
 * Reads the player's surroundings: position, then public places from OpenStreetMap.
 * No map (network down) still returns the position with no places: the simulation is then pinned around the player.
 */
export async function readSurroundings(timeoutMs = 15000): Promise<World> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Error('timeout')), timeoutMs)));
  const read = async (): Promise<World> => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') throw new Error('permission');
    const last = await Location.getLastKnownPositionAsync().catch(() => null);
    const pos = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
    const origin = { lat: pos.coords.latitude, lon: pos.coords.longitude };
    try {
      return { origin, places: await fetchPlaces(origin) };
    } catch {
      return { origin, places: [] };
    }
  };
  try {
    return await Promise.race([read(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

const stop = (sub?: { remove: () => void }) => {
  try {
    sub?.remove();
  } catch {}
};

/** Live position while `enabled`. The browser's own geolocation on the web (expo-location's web watcher cannot be stopped cleanly). */
export function useLivePosition(enabled: boolean): LatLon | undefined {
  const [pos, setPos] = useState<LatLon>();
  useEffect(() => {
    if (!enabled) return;
    if (Platform.OS === 'web') {
      const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
      if (!geo) return;
      const id = geo.watchPosition((p) => setPos({ lat: p.coords.latitude, lon: p.coords.longitude }), () => {}, { enableHighAccuracy: true, maximumAge: 2000 });
      return () => geo.clearWatch(id);
    }
    let sub: Location.LocationSubscription | undefined;
    let alive = true;
    Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 5, timeInterval: 2000 }, (p) =>
      setPos({ lat: p.coords.latitude, lon: p.coords.longitude }),
    )
      .then((s) => (alive ? (sub = s) : stop(s)))
      .catch(() => {});
    return () => {
      alive = false;
      stop(sub);
    };
  }, [enabled]);
  return pos;
}

/** Where the phone points, degrees from north (native only). */
export function useHeading(enabled: boolean): number | undefined {
  const [heading, setHeading] = useState<number>();
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;
    let sub: Location.LocationSubscription | undefined;
    let alive = true;
    Location.watchHeadingAsync((h) => setHeading(h.trueHeading >= 0 ? h.trueHeading : h.magHeading))
      .then((s) => (alive ? (sub = s) : stop(s)))
      .catch(() => {});
    return () => {
      alive = false;
      stop(sub);
    };
  }, [enabled]);
  return heading;
}

/** The daily appointment: a system notification when the next chapter opens. */
export async function scheduleChapterNotification(at: Date, title: string, body: string): Promise<void> {
  if (Platform.OS === 'web' || at.getTime() <= Date.now()) return;
  // Expo Go no longer ships notifications on Android: they need a development or store build.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
  try {
    const N = require('expo-notifications') as typeof import('expo-notifications');
    const perm = await N.requestPermissionsAsync();
    if (!perm.granted) return;
    await N.cancelAllScheduledNotificationsAsync();
    await N.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: at },
    });
  } catch {}
}
