import { useEffect } from 'react';
import { router } from 'expo-router';
import { ROUTES } from '../constants/routes';
import { SplashScreen } from '../screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { readProfile } from '../services/profile';

export default function EntryScreen() {
  useEffect(() => {
    let active = true;
    // Discreet Mode never hijacks launch: returning authenticated users land on the hub.
    void Promise.all([
      readProfile(),
      AsyncStorage.getItem('session:v1'),
      AsyncStorage.getItem('bindaas:profile:v1'),
      new Promise(resolve => setTimeout(resolve, 1200)),
    ]).then(async ([profile, session, legacyProfile]) => {
      if (!active) return;
      const hasProfile = Boolean(profile || legacyProfile);
      const authenticated = session === 'active' || (!session && Boolean(legacyProfile));
      if (!session && legacyProfile) await AsyncStorage.setItem('session:v1', 'active');
      if (!hasProfile) router.replace(ROUTES.splash);
      else if (!authenticated) router.replace(ROUTES.login);
      else router.replace(ROUTES.hub);
    });
    return () => { active = false; };
  }, []);
  return <SplashScreen cta={false} />;
}
