import * as Speech from 'expo-speech';

export type ScriptLanguage = 'en' | 'hi';
export type SpeakResult = { hindiVoiceAvailable: boolean; selectedVoiceAvailable: boolean };

export async function speakScript(text: string, language: ScriptLanguage, gender: 'female' | 'male' = 'female', shouldContinue: () => boolean = () => true): Promise<SpeakResult> {
  const wanted = language === 'hi' ? 'hi-IN' : 'en-IN';
  const voices = await Speech.getAvailableVoicesAsync().catch(() => []);
  const localized = voices.filter(voice => voice.language.toLowerCase().startsWith(language));
  const genderPattern = gender === 'female' ? /female|woman|women|girl|neural2.?a|wavenet.?a/i : /male|man|men|boy|neural2.?d|wavenet.?b/i;
  const matchingVoice = localized.find(voice => genderPattern.test(`${voice.name} ${voice.identifier}`));
  const preferred = matchingVoice ?? localized.find(voice => voice.language.toLowerCase() === wanted.toLowerCase());
  const pieces = text.split(/\[?\bPAUSE(?:\s*[:=]?\s*(\d+)\s*(ms|s)?)?\b\]?/giu);
  for (let index = 0; index < pieces.length; index += 1) {
    if (!shouldContinue()) break;
    const spoken = pieces[index].trim();
    if (spoken) await new Promise<void>((resolve, reject) => Speech.speak(spoken, {
      language: wanted, voice: preferred?.identifier, rate: 0.95, pitch: gender === 'female' ? 1.08 : 0.88,
      onDone: resolve, onStopped: resolve, onError: reject,
    }));
    if (index < pieces.length - 1) {
      const amount = Number(pieces[index + 1]);
      const unit = pieces[index + 2]?.toLowerCase();
      await new Promise(resolve => setTimeout(resolve, Math.min(4000, amount ? (unit === 's' ? amount * 1000 : amount) : 800)));
      if (!shouldContinue()) break;
      index += 2;
    }
  }
  return { hindiVoiceAvailable: language !== 'hi' || localized.length > 0, selectedVoiceAvailable: Boolean(matchingVoice) };
}

// A cloud speech provider can be implemented behind this function later; this app makes no network request.
