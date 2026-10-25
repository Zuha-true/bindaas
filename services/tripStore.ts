import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '../constants/routes';
import { loadNotifications } from './notificationRuntime';

const TRIP_KEY = 'trip:active:v1';
const REMINDER_KEY = 'trip:location-reminder:v1';
const REMINDER_ENABLED_KEY = 'trip:location-reminder-enabled:v1';

export async function isTripActive(): Promise<boolean> {
  return (await AsyncStorage.getItem(TRIP_KEY)) === 'true';
}

export async function startTrip(): Promise<void> {
  await AsyncStorage.setItem(TRIP_KEY, 'true');
  if ((await AsyncStorage.getItem(REMINDER_ENABLED_KEY)) === 'true') await scheduleLocationReminder();
}

export async function endTrip(): Promise<void> {
  await AsyncStorage.setItem(TRIP_KEY, 'false');
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
  await cancelLocationReminder();
}

export async function setLocationReminderEnabled(enabled: boolean): Promise<boolean> {
  if (!enabled) {
    await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'false');
    await cancelLocationReminder();
    return true;
  }
  if (await isTripActive() && !(await scheduleLocationReminder())) return false;
  await AsyncStorage.setItem(REMINDER_ENABLED_KEY, 'true');
  return true;
}

export async function scheduleLocationReminder(): Promise<boolean> {
  const notifications = await loadNotifications();
  if (!notifications) return false;
  await cancelLocationReminder();
  const id = await notifications.scheduleNotificationAsync({
    content: { title: 'Location check-in', body: 'Resend your location?', data: { url: ROUTES.live } },
    trigger: { type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 * 60, repeats: true },
  });
  await AsyncStorage.setItem(REMINDER_KEY, id);
  return true;
}

export async function cancelLocationReminder(): Promise<void> {
  const id = await AsyncStorage.getItem(REMINDER_KEY);
  const notifications = id ? await loadNotifications() : null;
  if (id && notifications) await notifications.cancelScheduledNotificationAsync(id);
  await AsyncStorage.removeItem(REMINDER_KEY);
}
