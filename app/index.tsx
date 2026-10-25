import { useEffect } from 'react';
import { router } from 'expo-router';
import { ROUTES } from '../constants/routes';
import { SplashScreen } from '../screens';

export default function EntryScreen() {
  useEffect(() => {
    let active = true;
    // Discreet Mode never hijacks launch: the calculator/cooking disguise is reached from
    // the hub's "Lock now" button or Settings, so a returning user always lands on the hub.
    void Promise.all([
      import('@react-native-async-storage/async-storage').then(storage => storage.default.getItem('bindaas:profile:v1')),
      new Promise(resolve => setTimeout(resolve, 1200)),
    ]).then(([profile]) => {
      if (active) router.replace(profile ? ROUTES.hub : ROUTES.splash);
    });
    return () => { active = false; };
  }, []);
  return <SplashScreen cta={false} />;
}
