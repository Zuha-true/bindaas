import { AudioModule } from 'expo-audio';
import { isExpoGo } from './runtime';

export async function requestVoicePermissions(): Promise<boolean> {
  if (isExpoGo) {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      return permission.granted;
    } catch { return false; }
  }
  const recognition = await import('expo-speech-recognition').catch(() => null);
  if (recognition?.ExpoSpeechRecognitionModule) {
    try {
      const permission = await recognition.ExpoSpeechRecognitionModule.requestMicrophonePermissionsAsync();
      return permission.granted;
    } catch { /* Expo Go does not include this development-build native module. */ }
  }
  const permission = await AudioModule.requestRecordingPermissionsAsync();
  return permission.granted;
}
