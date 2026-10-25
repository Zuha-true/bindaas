import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { ROUTES } from '../constants/routes';
import { loadNotifications } from './notificationRuntime';
import { parseShareSession, type LocationShareSession } from './locationShareSession';

const SESSION_KEY = 'location:sharing:v1';
const REMINDER_ID_KEY = 'location:sharing-reminder-id:v1';

type Listener = (session: LocationShareSession | null) => void;

let session: LocationShareSession | null = null;
let loaded = false;
let watcher: Location.LocationSubscription | null = null;
const listeners = new Set<Listener>();

function copy(value: LocationShareSession | null): LocationShareSession | null {
  return value ? { ...value, recipients: [...value.recipients] } : null;
}

function emit(): void {
  const value = copy(session);
  listeners.forEach(listener => listener(value));
}

async function persist(): Promise<void> {
  if (session) await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else await AsyncStorage.removeItem(SESSION_KEY);
}

function startWatcher(): void {
  if (watcher) return;
  void Location.watchPositionAsync(
    { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
    latest => {
      if (!session?.active) return;
      session = { ...session, latitude: latest.coords.latitude, longitude: latest.coords.longitude, updatedAt: Date.now() };
      void persist();
      emit();
    },
  ).then(subscription => {
    if (!session?.active) { subscription.remove(); return; }
    watcher = subscription;
  }).catch(() => undefined);
}

function stopWatcher(): void {
  watcher?.remove();
  watcher = null;
}

export async function readLocationSharing(): Promise<LocationShareSession | null> {
  if (!loaded) {
    loaded = true;
    session = parseShareSession(await AsyncStorage.getItem(SESSION_KEY));
    if (session?.active) startWatcher();
    emit();
  }
  return copy(session);
}

export function subscribeLocationSharing(listener: Listener): () => void {
  listeners.add(listener);
  listener(copy(session));
  return () => { listeners.delete(listener); };
}

export async function startLocationSharing(reminderMinutes: number | null, recipients: string[]): Promise<LocationShareSession> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('permission');
  const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  session = {
    active: true,
    startedAt: Date.now(),
    reminderMinutes,
    latitude: current.coords.latitude,
    longitude: current.coords.longitude,
    updatedAt: Date.now(),
    recipients: [...recipients],
  };
  loaded = true;
  await persist();
  startWatcher();
  await scheduleReminder(reminderMinutes);
  emit();
  return copy(session)!;
}

export async function updateLocationSharingReminder(reminderMinutes: number | null): Promise<LocationShareSession | null> {
  if (!session) return null;
  session = { ...session, reminderMinutes };
  await persist();
  await scheduleReminder(reminderMinutes);
  emit();
  return copy(session);
}

export async function updateLocationSharingRecipients(recipients: string[]): Promise<LocationShareSession | null> {
  if (!session) return null;
  session = { ...session, recipients: [...recipients] };
  await persist();
  emit();
  return copy(session);
}

export async function stopLocationSharing(): Promise<void> {
  stopWatcher();
  session = null;
  loaded = true;
  await persist();
  await cancelReminder();
  emit();
}

async function scheduleReminder(minutes: number | null): Promise<boolean> {
  await cancelReminder();
  if (!minutes) return false;
  const notifications = await loadNotifications();
  if (!notifications) return false;
  try {
    const current = await notifications.getPermissionsAsync();
    const permission = current.granted ? current : await notifications.requestPermissionsAsync();
    if (!permission.granted) return false;
    const id = await notifications.scheduleNotificationAsync({
      content: {
        title: 'Turn off live sharing?',
        body: `You have been sharing your live location for ${minutes} minutes.`,
        data: { url: ROUTES.live },
      },
      trigger: { type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutes * 60 },
    });
    await AsyncStorage.setItem(REMINDER_ID_KEY, id);
    return true;
  } catch {
    return false;
  }
}

async function cancelReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (!id) return;
  try {
    const notifications = await loadNotifications();
    if (notifications) await notifications.cancelScheduledNotificationAsync(id);
  } catch { /* notification API may be unavailable */ }
  await AsyncStorage.removeItem(REMINDER_ID_KEY);
}
