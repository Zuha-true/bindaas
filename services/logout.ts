import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadNotifications } from './notificationRuntime';
import { setTriggerStatus, setShakeEnabled, setVoiceEnabled } from './triggerPreferences';
import { clearEveryStoredKey, clearSessionOnly } from './localStorageClear';

export async function logOutKeepingLocalData(): Promise<void> {
  setTriggerStatus({ shakeEnabled: false, voiceEnabled: false, voiceListening: false, voiceTier: null });
  await clearSessionOnly(AsyncStorage);
}

export async function eraseLocalData(): Promise<void> {
  setTriggerStatus({ shakeEnabled: false, voiceEnabled: false, voiceListening: false, voiceTier: null });
  await setShakeEnabled(false);
  await setVoiceEnabled(false);
  try { const notifications = await loadNotifications(); await notifications?.cancelAllScheduledNotificationsAsync(); } catch { /* unavailable in Expo Go */ }
  await clearEveryStoredKey(AsyncStorage);
}
