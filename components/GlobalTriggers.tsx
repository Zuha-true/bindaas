import { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTriggerStatus, loadTriggerPreferences, setTriggerStatus } from '../services/triggerPreferences';
import { useShakeTrigger } from '../hooks/useShakeTrigger';
import { useVoiceTrigger } from '../hooks/useVoiceTrigger';
import { useLocalSearchParams, useSegments } from 'expo-router';
import { readLocationSharing, stopLocationSharing, subscribeLocationSharing } from '../services/locationSharing';
import { formatDuration, isReminderDue, type LocationShareSession } from '../services/locationShareSession';

export default function GlobalTriggers() {
  const { shakeEnabled, voiceEnabled } = useTriggerStatus();
  const segments = useSegments();
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const voiceScreenOpen = segments[0] !== '(tadka)' || (segments[1] === 'feature' && feature === 'voice');
  const [sessionActive, setSessionActive] = useState(false);
  const [shareSession, setShareSession] = useState<LocationShareSession | null>(null);
  const remindedFor = useRef<string | null>(null);
  const routeKey = segments.join('/');

  useEffect(() => subscribeLocationSharing(setShareSession), []);

  useEffect(() => {
    const minutes = shareSession?.reminderMinutes;
    if (!shareSession?.active || !minutes) return undefined;
    const check = () => {
      if (AppState.currentState !== 'active') return;
      const key = `${shareSession.startedAt}:${minutes}`;
      if (remindedFor.current === key || !isReminderDue(shareSession)) return;
      remindedFor.current = key;
      Alert.alert('Turn off live sharing?', `You have been sharing your live location for ${formatDuration(minutes)}. Stop sharing now if you no longer need it.`, [
        { text: 'Keep sharing', style: 'cancel' },
        { text: 'Stop sharing', style: 'destructive', onPress: () => { void stopLocationSharing(); } },
      ]);
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [shareSession]);

  useEffect(() => {
    let active = true;
    if (segments.some(segment => String(segment) === 'login')) {
      setSessionActive(false);
      setTriggerStatus({ shakeEnabled: false, voiceEnabled: false, voiceListening: false, voiceTier: null });
    } else {
      void AsyncStorage.getItem('session:v1').then(session => {
        if (!active) return;
        setSessionActive(session === 'active');
        if (session === 'active') { void loadTriggerPreferences(); void readLocationSharing(); }
        else setTriggerStatus({ shakeEnabled: false, voiceEnabled: false, voiceListening: false, voiceTier: null });
      });
    }
    return () => { active = false; };
  }, [routeKey]);
  useShakeTrigger(shakeEnabled && sessionActive);
  useVoiceTrigger(voiceEnabled && voiceScreenOpen && sessionActive);
  return null;
}
