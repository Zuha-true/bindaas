import { useEffect } from 'react';
import { useTriggerStatus, loadTriggerPreferences } from '../services/triggerPreferences';
import { useShakeTrigger } from '../hooks/useShakeTrigger';
import { useVoiceTrigger } from '../hooks/useVoiceTrigger';

export default function GlobalTriggers() {
  const { shakeEnabled, voiceEnabled } = useTriggerStatus();
  useEffect(() => { void loadTriggerPreferences(); }, []);
  useShakeTrigger(shakeEnabled);
  useVoiceTrigger(voiceEnabled);
  return null;
}
