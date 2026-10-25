import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTriggerStatus, loadTriggerPreferences, setTriggerStatus } from '../services/triggerPreferences';
import { useShakeTrigger } from '../hooks/useShakeTrigger';
import { useVoiceTrigger } from '../hooks/useVoiceTrigger';
import { useLocalSearchParams, useSegments } from 'expo-router';

export default function GlobalTriggers() {
  const { shakeEnabled, voiceEnabled } = useTriggerStatus();
  const segments = useSegments();
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const voiceScreenOpen = segments[0] !== '(tadka)' || (segments[1] === 'feature' && feature === 'voice');
  const [sessionActive, setSessionActive] = useState(false);
  const routeKey = segments.join('/');
  useEffect(() => {
    let active = true;
    if (segments.some(segment => String(segment) === 'login')) {
      setSessionActive(false);
      setTriggerStatus({ shakeEnabled: false, voiceEnabled: false, voiceListening: false, voiceTier: null });
    } else {
      void AsyncStorage.getItem('session:v1').then(session => {
        if (!active) return;
        setSessionActive(session === 'active');
        if (session === 'active') void loadTriggerPreferences();
        else setTriggerStatus({ shakeEnabled: false, voiceEnabled: false, voiceListening: false, voiceTier: null });
      });
    }
    return () => { active = false; };
  }, [routeKey]);
  useShakeTrigger(shakeEnabled && sessionActive);
  useVoiceTrigger(voiceEnabled && voiceScreenOpen && sessionActive);
  return null;
}
