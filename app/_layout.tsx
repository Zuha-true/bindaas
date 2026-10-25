import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold } from '@expo-google-fonts/dm-sans';
import { ActivityIndicator, View } from 'react-native';
import { router } from 'expo-router';
import type * as NotificationTypes from 'expo-notifications';
import { colors } from '../theme/tokens';
import { ROUTES } from '../constants/routes';
import GlobalTriggers from '../components/GlobalTriggers';
import { loadNotifications } from '../services/notificationRuntime';

function useNotificationNavigation() {
  useEffect(() => {
    let active = true;
    let removeListener: (() => void) | undefined;
    void loadNotifications().then(notifications => {
      if (!active || !notifications || typeof notifications.setNotificationHandler !== 'function') return;
      notifications.setNotificationHandler({
        handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
      });
      const openRoute = (response: NotificationTypes.NotificationResponse | null) => {
        const url = response?.notification.request.content.data?.url;
        if (url === ROUTES.live) router.push(ROUTES.live);
        if (url === ROUTES.incomingCall) router.push(ROUTES.incomingCall);
      };
      openRoute(notifications.getLastNotificationResponse());
      const subscription = notifications.addNotificationResponseReceivedListener(openRoute);
      removeListener = () => subscription.remove();
    }).catch(() => undefined);
    return () => { active = false; removeListener?.(); };
  }, []);
}

export default function RootLayout() {
  const [loaded] = useFonts({ DMSerifDisplay_400Regular, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold, DMSans_800ExtraBold });
  useNotificationNavigation();
  if (!loaded) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.pink50 }}><ActivityIndicator color={colors.ink} /></View>;
  return <><GlobalTriggers /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.pink50 }, animation: 'slide_from_right' }} /></>;
}
