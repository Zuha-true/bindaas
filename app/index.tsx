import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import { readAppSettings } from '../services/appSettings';
import { ROUTES } from '../constants/routes';
import { colors } from '../theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readProfile } from '../services/profile';

export default function EntryScreen() {
  useEffect(() => {
    let active = true;
    void Promise.all([readAppSettings(), AsyncStorage.getItem('session:v1'), AsyncStorage.getItem('bindaas:profile:v1')]).then(async ([settings, session, legacyProfile]) => {
      if (!active) return;
      const profile = await readProfile();
      if (!active) return;
      const authenticated = session === 'active' || (!session && Boolean(legacyProfile));
      if (!session && legacyProfile) await AsyncStorage.setItem('session:v1', 'active');
      if (!profile) router.replace(ROUTES.splash);
      else if (!authenticated) router.replace(ROUTES.login);
      else if (settings.disguise === 'cooking') router.replace(ROUTES.tadka);
      else if (settings.disguise === 'calculator') router.replace(ROUTES.calculator);
      else router.replace(ROUTES.hub);
    });
    return () => { active = false; };
  }, []);
  return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink50 }}><ActivityIndicator color={colors.ink} /></View>;
}
