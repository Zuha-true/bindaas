import { useEffect } from 'react';
import { useTriggerStatus, loadTriggerPreferences } from '../services/triggerPreferences';
import { useShakeTrigger } from '../hooks/useShakeTrigger';
import { useVoiceTrigger } from '../hooks/useVoiceTrigger';
import { useLocalSearchParams, useSegments } from 'expo-router';

export default function GlobalTriggers() {
  const { shakeEnabled, voiceEnabled } = useTriggerStatus();
  const segments = useSegments();
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const voiceScreenOpen = segments[0] !== '(tadka)' || (segments[1] === 'feature' && feature === 'voice');
  useEffect(() => { void loadTriggerPreferences(); }, []);
  useShakeTrigger(shakeEnabled);
  useVoiceTrigger(voiceEnabled && voiceScreenOpen);
  return null;
}
