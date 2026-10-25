import AsyncStorage from '@react-native-async-storage/async-storage';

export type DisguiseMode = 'none' | 'calculator' | 'cooking';
export interface AppSettings {
  disguise: DisguiseMode;
  pin: string;
  sosCode: string;
  cookAsIf: boolean;
}

const KEY = 'settings:v1';
const defaults: AppSettings = { disguise: 'none', pin: '2468', sosCode: '1122', cookAsIf: false };

export async function readAppSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) try {
    const saved = JSON.parse(raw) as Partial<AppSettings>;
    if (saved.disguise === 'none' || saved.disguise === 'calculator' || saved.disguise === 'cooking') return { ...defaults, ...saved };
  } catch { /* migrate legacy settings below */ }
  const [legacyMode, pin, sosCode] = await AsyncStorage.multiGet(['app-start-mode:v1', 'unlock-pin:v1', 'sos-code:v1']);
  const disguise: DisguiseMode = legacyMode[1] === 'Calculator' ? 'calculator' : legacyMode[1] === 'Cooking app' ? 'cooking' : 'none';
  const migrated = { ...defaults, disguise, pin: pin[1] || defaults.pin, sosCode: sosCode[1] || defaults.sosCode };
  await writeAppSettings(migrated);
  return migrated;
}

export async function writeAppSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.multiSet([
    [KEY, JSON.stringify(settings)],
    ['app-start-mode:v1', settings.disguise === 'calculator' ? 'Calculator' : settings.disguise === 'cooking' ? 'Cooking app' : 'Bindaas'],
    ['unlock-pin:v1', settings.pin], ['sos-code:v1', settings.sosCode],
  ]);
}

export async function setDisguiseMode(disguise: DisguiseMode): Promise<AppSettings> {
  const current = await readAppSettings();
  const next = { ...current, disguise };
  await writeAppSettings(next);
  return next;
}
