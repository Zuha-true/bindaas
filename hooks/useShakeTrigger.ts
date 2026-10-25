import { useEffect, useSyncExternalStore } from 'react';
import { Accelerometer } from 'expo-sensors';
import { AppState, AppStateStatus } from 'react-native';
import { triggerSOS } from '../services/sos';
import { setTriggerStatus } from '../services/triggerPreferences';

export const SHAKE_THRESHOLD_G = 2.3;
const SHAKE_GAP_MS = 250;
const SHAKE_WINDOW_MS = 1500;

export function useShakeTrigger(enabled: boolean): void {
  useEffect(() => {
    let subscription: ReturnType<typeof Accelerometer.addListener> | undefined;
    let appState: AppStateStatus = (AppState.currentState ?? 'active') as AppStateStatus;
    let lastShakeAt = 0;
    let shakes: number[] = [];
    let fired = false;

    const stop = () => { subscription?.remove(); subscription = undefined; };
    const start = () => {
      stop();
      if (!enabled || appState !== 'active') return;
      shakes = [];
      fired = false;
      Accelerometer.setUpdateInterval(100);
      subscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const now = Date.now();
        if (magnitude < SHAKE_THRESHOLD_G || now - lastShakeAt < SHAKE_GAP_MS) return;
        lastShakeAt = now;
        shakes = [...shakes.filter(time => now - time <= SHAKE_WINDOW_MS), now];
        if (!fired && shakes.length >= 3) {
          fired = true;
          triggerSOS('shake');
        }
      });
    };

    const appSubscription = AppState.addEventListener('change', next => { appState = next; start(); });
    start();
    setTriggerStatus({ shakeEnabled: enabled });
    return () => { stop(); appSubscription.remove(); };
  }, [enabled]);
}
