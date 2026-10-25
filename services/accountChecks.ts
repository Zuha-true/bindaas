import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalysisInput, AnalysisResult, Platform } from './lookalike';
import { analyzeAccount } from './lookalike';

export interface SavedAccountCheck extends AnalysisInput {
  id: string;
  createdAt: string;
  appVersion: string;
  result: AnalysisResult;
}
const HISTORY_KEY = 'accountchecks:v1';
const LEGACY_KEY = 'account-check:latest:v1';

export async function readAccountChecks(): Promise<SavedAccountCheck[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(item => item && typeof item.id === 'string' && typeof item.result === 'object').slice(0, 25) as SavedAccountCheck[];
    }
  } catch { /* ignore malformed local history */ }
  return [];
}

export async function createAccountCheck(input: AnalysisInput, appVersion: string): Promise<SavedAccountCheck> {
  const result = analyzeAccount(input);
  const check: SavedAccountCheck = { ...input, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, createdAt: new Date().toISOString(), appVersion, result };
  const history = [check, ...(await readAccountChecks())].slice(0, 25);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(check));
  return check;
}

export async function readLatestAccountCheck(): Promise<SavedAccountCheck | null> {
  const history = await readAccountChecks();
  if (history.length) return history[0];
  try {
    const raw = await AsyncStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (typeof value.suspect === 'string' && typeof value.real === 'string' && value.checklist && typeof value.checklist === 'object') return value as unknown as SavedAccountCheck;
  } catch { /* ignore malformed older value */ }
  return null;
}

export async function deleteAccountCheck(id: string): Promise<void> {
  const history = (await readAccountChecks()).filter(check => check.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  if (history.length) await AsyncStorage.setItem(LEGACY_KEY, JSON.stringify(history[0]));
  else await AsyncStorage.removeItem(LEGACY_KEY);
}

export function isPlatform(value: unknown): value is Platform {
  return value === 'instagram' || value === 'whatsapp' || value === 'facebook' || value === 'other';
}
