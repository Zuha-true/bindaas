import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { readAppSettings } from '../services/appSettings';
import { ROUTES } from '../constants/routes';
import { colors } from '../theme/tokens';

export default function EntryScreen() {
  useEffect(() => {
    let active = true;
    void Promise.all([readAppSettings(), import('@react-native-async-storage/async-storage')]).then(async ([settings, storage]) => {
      if (!active) return;
      const profile = await storage.default.getItem('bindaas:profile:v1');
      if (!active) return;
      if (settings.disguise === 'cooking') router.replace(ROUTES.tadka);
      else if (settings.disguise === 'calculator') router.replace(ROUTES.calculator);
      else router.replace(profile ? ROUTES.hub : ROUTES.splash);
    });
    return () => { active = false; };
  }, []);
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink50 }}><ActivityIndicator color={colors.ink} /></View>;
}
