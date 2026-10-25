import { isExpoGo } from './runtime';

/**
 * Expo Go versions that omit the Android topic-subscription module throw while
 * evaluating expo-notifications. Keep that optional feature behind a guarded
 * dynamic import so the router and the rest of the app can still boot.
 */
export async function loadNotifications() {
  // This Expo Go runtime is missing ExpoTopicSubscriptionModule. Do not ask
  // Metro to evaluate expo-notifications; its async-require bridge can return
  // a partial module after the native import throws.
  if (isExpoGo) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

