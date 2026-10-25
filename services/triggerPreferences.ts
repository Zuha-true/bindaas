import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

export interface TriggerPreferences { shakeEnabled: boolean; voiceEnabled: boolean }
export interface TriggerStatus extends TriggerPreferences { voiceListening: boolean; voiceTier: 'Keyword listening' | 'Loud-sound detection' | null }

let status: TriggerStatus = { shakeEnabled: false, voiceEnabled: false, voiceListening: false, voiceTier: null };
const listeners = new Set<() => void>();
function publish(patch: Partial<TriggerStatus>): void {
  status = { ...status, ...patch };
  listeners.forEach(listener => listener());
}
function subscribe(listener: () => void): () => void { listeners.add(listener); return () => listeners.delete(listener); }
export function useTriggerStatus(): TriggerStatus { return useSyncExternalStore(subscribe, () => status, () => status); }
export function setTriggerStatus(patch: Partial<TriggerStatus>): void { publish(patch); }

export async function loadTriggerPreferences(): Promise<void> {
  const [shake, voice] = await AsyncStorage.multiGet(['sos:shake-enabled:v1', 'sos:voice-enabled:v1']);
  publish({ shakeEnabled: shake[1] === 'true', voiceEnabled: voice[1] === 'true' });
}

export async function setShakeEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem('sos:shake-enabled:v1', String(enabled));
  publish({ shakeEnabled: enabled });
}

export async function setVoiceEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem('sos:voice-enabled:v1', String(enabled));
  publish({ voiceEnabled: enabled });
}
