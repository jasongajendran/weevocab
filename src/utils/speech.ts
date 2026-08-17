// Web Speech Synthesis and British Young Female Voice Engine for WeeVocab

export interface VoiceSettings {
  selectedVoiceURI: string | null;
  pitch: number; // 0.8 to 1.6 (default ~1.20 for young female)
  rate: number;  // 0.7 to 1.3 (default ~0.92 for learning enunciation)
}

const VOICE_PREF_KEY = 'weevocab_voice_settings_v2';

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  selectedVoiceURI: null,
  pitch: 1.20,
  rate: 0.92,
};

// Known high-quality Young British / Scottish Female voices
const PREFERRED_UK_FEMALE_KEYWORDS = [
  'libby',       // Microsoft Libby Online (Natural) - UK English youthful female
  'maisie',      // Microsoft Maisie Online (Natural) - UK English young girl
  'sonia',       // Microsoft Sonia Online (Natural) - UK English youthful female
  'serena',      // Apple Serena - UK English female
  'stephanie',   // Apple Stephanie - UK English female
  'kate',        // Apple Kate - UK English female
  'fiona',       // Apple Fiona - Scottish / UK English female
  'google uk english female', // Chrome / Android
  'uk english female',
  'hazel',       // Microsoft Hazel Desktop - UK English female
  'susan',       // Microsoft Susan - UK English female
  'mia',         // Microsoft Mia - UK English female
  'martha',      // Apple Martha - UK English female
  'victoria',    // Apple Victoria - UK English female
  'moira',       // Apple Moira - Irish/Scottish female
];

const KNOWN_ENGLISH_FEMALE_FALLBACKS = [
  'samantha',
  'karen',
  'zira',
  'jenny',
  'google us english female',
  'victoria',
  'ava',
  'allison',
];

const MALE_NAME_KEYWORDS = [
  'male', 'david', 'george', 'oliver', 'ryan', 'guy', 'daniel', 
  'thomas', 'arthur', 'brian', 'richard', 'james', 'mark', 'steven', 
  'john', 'eddie', 'paul', 'tom', 'peter', 'charles'
];

/**
 * Load user customized voice settings from localStorage.
 */
export const loadVoiceSettings = (): VoiceSettings => {
  if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(VOICE_PREF_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_VOICE_SETTINGS;
  }
};

/**
 * Save user voice settings to localStorage.
 */
export const saveVoiceSettings = (settings: Partial<VoiceSettings>): VoiceSettings => {
  const current = loadVoiceSettings();
  const updated = { ...current, ...settings };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(VOICE_PREF_KEY, JSON.stringify(updated));
    } catch (e) {}
  }
  return updated;
};

/**
 * Check if a voice is strictly female (excluding male tokens).
 */
export const isVoiceFemale = (voice: SpeechSynthesisVoice): boolean => {
  const name = voice.name.toLowerCase();
  if (MALE_NAME_KEYWORDS.some(m => name.includes(m))) {
    return false;
  }
  if (name.includes('female') || name.includes('woman') || name.includes('girl')) {
    return true;
  }
  if (PREFERRED_UK_FEMALE_KEYWORDS.some(k => name.includes(k))) {
    return true;
  }
  if (KNOWN_ENGLISH_FEMALE_FALLBACKS.some(k => name.includes(k))) {
    return true;
  }
  return true; // Assume neutral/female if not flagged male
};

/**
 * Check if a voice has a British / UK / Scottish accent.
 */
export const isVoiceBritish = (voice: SpeechSynthesisVoice): boolean => {
  const lang = voice.lang.toLowerCase();
  const name = voice.name.toLowerCase();
  return (
    lang.startsWith('en-gb') || 
    lang.startsWith('en_gb') || 
    lang.startsWith('en-scot') || 
    name.includes('united kingdom') || 
    name.includes('british') || 
    name.includes('uk english') ||
    name.includes('scot')
  );
};

/**
 * Get all available voices on the current system, enriched with metadata.
 */
export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  uri: string;
  isBritish: boolean;
  isFemale: boolean;
  isRecommended: boolean;
}

export const getAvailableVoicesList = (): VoiceOption[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  const rawVoices = window.speechSynthesis.getVoices() || [];
  return rawVoices.map(voice => {
    const isBrit = isVoiceBritish(voice);
    const isFem = isVoiceFemale(voice);
    const isRec = isBrit && isFem && PREFERRED_UK_FEMALE_KEYWORDS.some(k => voice.name.toLowerCase().includes(k));
    return {
      voice,
      name: voice.name,
      lang: voice.lang,
      uri: voice.voiceURI || voice.name,
      isBritish: isBrit,
      isFemale: isFem,
      isRecommended: isRec || (isBrit && isFem),
    };
  });
};

/**
 * Select the best British young female voice available.
 */
export const getBestBritishFemaleVoice = (): { voice: SpeechSynthesisVoice | null; pitchBoost: number } => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { voice: null, pitchBoost: 0 };
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) {
    return { voice: null, pitchBoost: 0 };
  }

  const userSettings = loadVoiceSettings();

  // 1. If user explicitly chose a voice URI in settings
  if (userSettings.selectedVoiceURI) {
    const userMatch = voices.find(v => (v.voiceURI || v.name) === userSettings.selectedVoiceURI);
    if (userMatch) {
      const isMale = !isVoiceFemale(userMatch);
      return { voice: userMatch, pitchBoost: isMale ? 0.25 : 0 };
    }
  }

  // 2. High-priority British Young Female Voices
  for (const preferredKeyword of PREFERRED_UK_FEMALE_KEYWORDS) {
    const match = voices.find(v => {
      const vName = v.name.toLowerCase();
      const isBrit = isVoiceBritish(v);
      return isBrit && vName.includes(preferredKeyword) && isVoiceFemale(v);
    });
    if (match) return { voice: match, pitchBoost: 0 };
  }

  // 3. Any UK/British Voice that is female or not flagged male
  const ukFemale = voices.find(v => isVoiceBritish(v) && isVoiceFemale(v));
  if (ukFemale) return { voice: ukFemale, pitchBoost: 0 };

  // 4. Any English Female voice (e.g. US/AUS female voices like Samantha, Jenny)
  const englishFemale = voices.find(v => v.lang.toLowerCase().startsWith('en') && isVoiceFemale(v));
  if (englishFemale) return { voice: englishFemale, pitchBoost: 0.05 };

  // 5. If only UK male voice is present, pitch boost it significantly (+0.25) so it sounds youthful/feminine
  const ukAny = voices.find(v => isVoiceBritish(v));
  if (ukAny) return { voice: ukAny, pitchBoost: 0.25 };

  // 6. Generic fallback
  const anyEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en'));
  return { voice: anyEnglish || null, pitchBoost: 0.15 };
};

// Listen for browser voice readiness
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

/**
 * Speak word with British young female voice.
 */
export const speakWord = (
  text: string, 
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
) => {
  speakSentence(text, options);
};

/**
 * Speak full sentence or phrase with British young female voice.
 */
export const speakSentence = (
  text: string,
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this device/browser.');
    return;
  }

  // Cancel previous speech
  window.speechSynthesis.cancel();

  // Clean special characters & markdown for smooth speech
  const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const settings = loadVoiceSettings();

  const { voice, pitchBoost } = getBestBritishFemaleVoice();

  // Tuned for a friendly, cheerful, youthful British female tone
  utterance.pitch = options?.pitch ?? (settings.pitch + pitchBoost);
  utterance.rate = options?.rate ?? settings.rate;

  if (voice) {
    utterance.voice = voice;
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
};

/**
 * Play a test preview of the British voice.
 */
export const testBritishVoicePreview = (customText?: string) => {
  const sample = customText || "Hello! I am your British and Scottish study companion. Let's learn some braw vocabulary together!";
  speakSentence(sample);
};

export const cancelSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isSpeechRecognitionSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
};

export interface RecognitionResult {
  transcript: string;
  isMatch: boolean;
  confidence: number;
}

export const startVoicePractice = (
  targetWord: string,
  onResult: (res: RecognitionResult) => void,
  onError: (err: string) => void
): (() => void) => {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser.');
    return () => {};
  }

  const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognitionClass();

  recognition.lang = 'en-GB';
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onresult = (event: any) => {
    const transcript = event.results[0][0].transcript.trim().toLowerCase();
    const confidence = event.results[0][0].confidence || 0.9;
    const target = targetWord.trim().toLowerCase();

    // Check direct match or close fuzzy match
    const isMatch = transcript === target || 
      transcript.includes(target) || 
      target.includes(transcript);

    onResult({
      transcript,
      isMatch,
      confidence
    });
  };

  recognition.onerror = (event: any) => {
    onError(event.error || 'Microphone error occurred.');
  };

  try {
    recognition.start();
  } catch (e) {
    onError('Could not start microphone.');
  }

  return () => {
    try {
      recognition.abort();
    } catch (e) {}
  };
};
