import AsyncStorage from '@react-native-async-storage/async-storage';
import { ROUTES } from '../constants/routes';
import { loadNotifications } from './notificationRuntime';
import { readAppSettings } from './appSettings';

export type FakeCallLanguage = 'en' | 'hi';
export type FakeCallVoiceGender = 'female' | 'male';
export interface FakeCallSettings {
  callerName: string;
  delaySeconds: 5 | 30 | 60;
  ringtoneEnabled: boolean;
  vibrationEnabled: boolean;
  language: FakeCallLanguage;
  voiceGender: FakeCallVoiceGender;
  scripts: { en: string; hi: string };
  speakOnRing: boolean;
}

export const DEFAULT_FAKE_CALL_SETTINGS: FakeCallSettings = {
  callerName: 'Riya',
  delaySeconds: 30,
  ringtoneEnabled: true,
  vibrationEnabled: true,
  language: 'en',
  voiceGender: 'female',
  scripts: {
    en: "Hi, where are you? PAUSE Come to the main road, I'm waiting.",
    hi: 'हैलो, तुम कहाँ हो? PAUSE मैं मुख्य सड़क पर इंतज़ार कर रही हूँ, जल्दी आओ।',
  },
  speakOnRing: false,
};

const SETTINGS_KEY = 'fakecall:v1';
const SCHEDULED_KEY = 'fakecall:notification:v1';

export async function readFakeCallSettings(): Promise<FakeCallSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_FAKE_CALL_SETTINGS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_FAKE_CALL_SETTINGS;
    const value = parsed as Partial<FakeCallSettings>;
    return {
      ...DEFAULT_FAKE_CALL_SETTINGS,
      ...value,
      scripts: { ...DEFAULT_FAKE_CALL_SETTINGS.scripts, ...value.scripts },
    };
  } catch { return DEFAULT_FAKE_CALL_SETTINGS; }
}

export async function writeFakeCallSettings(settings: FakeCallSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function scheduleFakeCall(delaySeconds: number, callerName: string): Promise<string> {
  const notifications = await loadNotifications();
  if (!notifications) throw new Error('Notifications are unavailable in this Expo Go runtime.');
  const existing = await AsyncStorage.getItem(SCHEDULED_KEY);
  if (existing) await notifications.cancelScheduledNotificationAsync(existing);
  const cooking = (await readAppSettings()).disguise === 'cooking';
  const savedSettings = await readFakeCallSettings();
  const id = await notifications.scheduleNotificationAsync({
    content: { title: cooking ? `${callerName} is calling` : 'Incoming call', body: `${callerName} is calling`, sound: savedSettings.ringtoneEnabled ? 'default' : false, data: { url: cooking ? `/(tadka)/feature?feature=ringing&caller=${encodeURIComponent(callerName)}` : ROUTES.incomingCall } },
    trigger: { type: notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: delaySeconds },
  });
  await AsyncStorage.setItem(SCHEDULED_KEY, id);
  return id;
}

export async function cancelFakeCallNotification(): Promise<void> {
  const id = await AsyncStorage.getItem(SCHEDULED_KEY);
  const notifications = id ? await loadNotifications() : null;
  if (id && notifications) await notifications.cancelScheduledNotificationAsync(id);
  await AsyncStorage.removeItem(SCHEDULED_KEY);
}
