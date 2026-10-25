import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProfileFields } from './profileValidation';

export const PROFILE_KEY = 'profile:v1';
export interface Profile extends ProfileFields {}

export async function readProfile(): Promise<Profile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (raw) try {
    const profile = JSON.parse(raw) as Partial<Profile>;
    if (typeof profile.name === 'string' && typeof profile.phone === 'string') return { name: profile.name, phone: profile.phone, email: profile.email ?? '', photoUri: profile.photoUri ?? null };
  } catch { /* try the previous local profile key */ }
  const legacy = await AsyncStorage.getItem('bindaas:profile:v1');
  if (!legacy) return null;
  try {
    const old = JSON.parse(legacy) as { name?: unknown; phone?: unknown; email?: unknown };
    if (typeof old.name !== 'string' || typeof old.phone !== 'string') return null;
    const migrated: Profile = { name: old.name, phone: old.phone, email: typeof old.email === 'string' ? old.email : '', photoUri: null };
    await saveProfile(migrated);
    await AsyncStorage.removeItem('bindaas:profile:v1');
    return migrated;
  } catch { return null; }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}
