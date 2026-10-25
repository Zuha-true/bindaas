import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import type { LocationObjectCoords } from 'expo-location';
import * as SMS from 'expo-sms';
import { Share, ToastAndroid, Vibration, Platform } from 'react-native';
import { Href, router } from 'expo-router';
import { ROUTES } from '../constants/routes';
import { readTrustedContacts } from './contacts';

export type SosSource = 'button' | 'shake' | 'voice' | 'timer' | 'deviation';
export type SosOutcome = 'cancelled' | 'opened' | 'failed';
export interface SosLogEntry { time: string; source: SosSource; outcome: SosOutcome }

const LOG_KEY = 'sos:log:v1';
const CIRCLE_NOTICE_KEY = 'circle:notice:v1';
const LOCK_MS = 30_000;
let lockedUntil = 0;
let activeSource: SosSource = 'button';

function releaseSosLock(): void {
  lockedUntil = 0;
}

export function triggerSOS(source: SosSource): void {
  const now = Date.now();
  if (now < lockedUntil) return;
  lockedUntil = now + LOCK_MS;
  activeSource = source;
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  Vibration.vibrate([0, 250, 120, 250, 120, 500]);
  router.push(ROUTES.sosCountdown as Href);
}

export function getActiveSosSource(): SosSource { return activeSource; }

export async function appendSosLog(outcome: SosOutcome): Promise<void> {
  const existing = await readSosLog();
  const next: SosLogEntry[] = [{ time: new Date().toISOString(), source: activeSource, outcome }, ...existing].slice(0, 20);
  await AsyncStorage.setItem(LOG_KEY, JSON.stringify(next));
}

export async function readSosLog(): Promise<SosLogEntry[]> {
  const raw = await AsyncStorage.getItem(LOG_KEY);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is SosLogEntry =>
      typeof entry === 'object' && entry !== null && 'time' in entry && 'source' in entry && 'outcome' in entry
    ).slice(0, 20);
  } catch { return []; }
}

export async function cancelSOS(): Promise<void> {
  await appendSosLog('cancelled');
  releaseSosLock();
  Vibration.cancel();
  if (Platform.OS === 'android') ToastAndroid.show('Cancelled', ToastAndroid.SHORT);
  router.back();
}

export async function requestSOSCoordinates(): Promise<LocationObjectCoords | null> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return null;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Location timeout')), 10_000); }),
    ]).finally(() => { if (timeout) clearTimeout(timeout); });
    return position.coords;
  } catch { return null; }
}

export async function prepareSOSMessage(coords: LocationObjectCoords | null): Promise<'opened' | 'no-contacts' | 'failed'> {
  const contacts = await readTrustedContacts();
  if (contacts.length === 0) {
    await AsyncStorage.setItem(CIRCLE_NOTICE_KEY, 'Add a trusted contact first');
    releaseSosLock();
    router.replace(ROUTES.circle);
    return 'no-contacts';
  }

  const locationLabel = coords
    ? `https://maps.google.com/?q=${coords.latitude},${coords.longitude}`
    : 'location unavailable';

  const message = `BINDAAS SOS: I need help. My location: ${locationLabel}`;
  try {
    if (await SMS.isAvailableAsync()) {
      await SMS.sendSMSAsync(contacts.map(contact => contact.phone), message);
    } else {
      await Share.share({ message });
    }
    await appendSosLog('opened');
    Vibration.cancel();
    return 'opened';
  } catch {
    await appendSosLog('failed');
    releaseSosLock();
    Vibration.cancel();
    return 'failed';
  }
}
