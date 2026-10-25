import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { triggerSOS } from '../services/sos';
import { setTriggerStatus } from '../services/triggerPreferences';
import { isExpoGo } from '../services/runtime';

const MATCHED_PHRASES = ['help', 'help me', 'bachao', 'bachao mujhe', 'मदद', 'बचाओ'];

export function useVoiceTrigger(enabled: boolean): void {
  const recorder = useAudioRecorder({ ...RecordingPresets.LOW_QUALITY, isMeteringEnabled: true });
  const recorderState = useAudioRecorderState(recorder, 100);
  const loudSince = useRef<number | null>(null);
  const triggered = useRef(false);

  useEffect(() => {
    let active = enabled && AppState.currentState === 'active';
    let speechModule: typeof import('expo-speech-recognition') | null = null;
    let subscriptions: Array<{ remove: () => void }> = [];
    let localeIndex = 0;
    let restarting = false;
    let localeTimer: ReturnType<typeof setTimeout> | null = null;

    const clearStatus = () => setTriggerStatus({ voiceListening: false, voiceTier: null });
    const isPhrase = (transcript: string) => {
      const normalized = transcript.normalize('NFC').toLowerCase();
      return MATCHED_PHRASES.some(phrase => normalized.includes(phrase));
    };
    const startLocale = (language: string) => {
      if (!active || !speechModule || restarting) return;
      restarting = true;
      if (localeTimer) clearTimeout(localeTimer);
      setTimeout(() => {
        restarting = false;
        if (!active || !speechModule) return;
        try {
          speechModule.ExpoSpeechRecognitionModule.start({
            lang: language,
            interimResults: true,
            continuous: true,
            requiresOnDeviceRecognition: true,
          });
          localeTimer = setTimeout(() => {
            if (!active || !speechModule) return;
            localeIndex = (localeIndex + 1) % 2;
            speechModule.ExpoSpeechRecognitionModule.abort();
            startLocale(localeIndex === 0 ? 'en-IN' : 'hi-IN');
          }, 12_000);
        } catch {
          speechModule = null;
          subscriptions.forEach(subscription => subscription.remove());
          subscriptions = [];
          void startSoundMeter();
        }
      }, 250);
    };

    const stop = () => {
      active = false;
      if (localeTimer) clearTimeout(localeTimer);
      subscriptions.forEach(subscription => subscription.remove());
      subscriptions = [];
      try { speechModule?.ExpoSpeechRecognitionModule.abort(); } catch { /* Native module may not be present in Expo Go. */ }
      if (recorder.isRecording) {
        const uri = recorder.uri;
        void recorder.stop().finally(() => { if (uri) void import('expo-file-system/legacy').then(fs => fs.deleteAsync(uri, { idempotent: true })).catch(() => undefined); });
      }
      clearStatus();
    };

    const appStateSubscription = AppState.addEventListener('change', state => {
      if (state !== 'active') stop();
      else if (enabled) { active = true; void start(); }
    });

    const startSoundMeter = async () => {
      try {
        const permission = await AudioModule.getRecordingPermissionsAsync();
        if (!active || !permission.granted) { clearStatus(); return; }
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (!active) return;
        recorder.record();
        setTriggerStatus({ voiceListening: true, voiceTier: 'Loud-sound detection' });
      } catch { clearStatus(); }
    };

    const start = async () => {
      if (!active) return;
      const module = isExpoGo ? null : await import('expo-speech-recognition').catch(() => null);
      if (!active) return;
      if (!module?.ExpoSpeechRecognitionModule) { await startSoundMeter(); return; }
      speechModule = module;
      const permission = await module.ExpoSpeechRecognitionModule.getPermissionsAsync().catch(() => null);
      if (!permission) { speechModule = null; await startSoundMeter(); return; }
      if (!active || !permission?.granted) { clearStatus(); return; }
      setTriggerStatus({ voiceListening: true, voiceTier: 'Keyword listening' });
      subscriptions = [
        module.ExpoSpeechRecognitionModule.addListener('result', event => {
          if (!event.results.some(result => isPhrase(result.transcript))) return;
          triggered.current = true;
          triggerSOS('voice');
        }),
        module.ExpoSpeechRecognitionModule.addListener('end', () => {
          if (!active) return;
          localeIndex = (localeIndex + 1) % 2;
          startLocale(localeIndex === 0 ? 'en-IN' : 'hi-IN');
        }),
        module.ExpoSpeechRecognitionModule.addListener('error', () => {
          if (active) { subscriptions.forEach(subscription => subscription.remove()); subscriptions = []; speechModule = null; void startSoundMeter(); }
        }),
      ];
      startLocale('en-IN');
    };

    if (active) void start();
    else clearStatus();
    return () => { stop(); appStateSubscription.remove(); };
  }, [enabled, recorder]);

  useEffect(() => {
    if (!enabled || !recorderState.isRecording || typeof recorderState.metering !== 'number') {
      loudSince.current = null;
      triggered.current = false;
      return;
    }
    if (recorderState.metering >= -8) {
      loudSince.current ??= Date.now();
      if (!triggered.current && Date.now() - loudSince.current >= 800) {
        triggered.current = true;
        triggerSOS('voice');
      }
    } else loudSince.current = null;
  }, [enabled, recorderState.isRecording, recorderState.metering]);
}
