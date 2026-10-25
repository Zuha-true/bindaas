import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import type { Platform } from './lookalike';
import type { SavedAccountCheck } from './accountChecks';

export interface EvidenceNote {
  id: string;
  createdAt: string;
  suspectHandle: string;
  realHandle: string;
  platform: Platform;
  indicators: Array<{ id: string; found: boolean }>;
  foundCount: number;
  appVersion: string;
  fingerprint: string;
}
const KEY = 'evidence:v1';
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
export async function fingerprintEvidence(note: Omit<EvidenceNote, 'fingerprint'>): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, stable(note));
}
export async function evidenceFromCheck(check: SavedAccountCheck): Promise<EvidenceNote> {
  const payload = {
    id: check.id,
    createdAt: check.createdAt,
    suspectHandle: check.suspect,
    realHandle: check.real,
    platform: check.platform,
    indicators: check.result.indicators.map(({ id, found }) => ({ id, found })),
    foundCount: check.result.foundCount,
    appVersion: check.appVersion,
  };
  return { ...payload, fingerprint: await fingerprintEvidence(payload) };
}
export async function readEvidence(): Promise<EvidenceNote[]> {
  try { const parsed: unknown = JSON.parse((await AsyncStorage.getItem(KEY)) ?? '[]'); return Array.isArray(parsed) ? parsed.filter(item => item && typeof item.id === 'string') as EvidenceNote[] : []; }
  catch { return []; }
}
export async function saveEvidence(note: EvidenceNote): Promise<void> {
  const previous = await readEvidence();
  await AsyncStorage.setItem(KEY, JSON.stringify([note, ...previous.filter(item => item.id !== note.id)].slice(0, 50)));
}
export async function deleteEvidence(id: string): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify((await readEvidence()).filter(note => note.id !== id)));
}
export async function verifyEvidence(note: EvidenceNote): Promise<boolean> {
  const { fingerprint, ...payload } = note;
  return (await fingerprintEvidence(payload)) === fingerprint;
}
