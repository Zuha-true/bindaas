import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { AppSettings, readAppSettings } from '../services/appSettings';
import { bindaasTheme, tadkaTheme, type SkinTheme } from './theme';
import { bindaasCopy } from './copy/bindaas';
import { tadkaCopy } from './copy/tadka';

type SkinId = 'bindaas' | 'tadka';
const SkinContext = createContext<{ settings: AppSettings | null; skin: SkinId; theme: SkinTheme; copy: typeof bindaasCopy | typeof tadkaCopy; refresh: () => void }>({ settings: null, skin: 'bindaas', theme: bindaasTheme, copy: bindaasCopy, refresh: () => undefined });
export function SkinProvider({ children }: PropsWithChildren) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => { void readAppSettings().then(setSettings); }, [revision]);
  const skin: SkinId = settings?.disguise === 'cooking' ? 'tadka' : 'bindaas';
  return <SkinContext.Provider value={{ settings, skin, theme: skin === 'tadka' ? tadkaTheme : bindaasTheme, copy: skin === 'tadka' ? tadkaCopy : bindaasCopy, refresh: () => setRevision(value => value + 1) }}>{children}</SkinContext.Provider>;
}
export function useSkin() { return useContext(SkinContext); }
export function useTheme() { return useContext(SkinContext).theme; }
export function useCopy() { return useContext(SkinContext).copy; }
