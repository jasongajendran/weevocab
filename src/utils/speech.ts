// Web Speech Synthesis and Voice Practice for UK & Scottish Junior Dictionary

// Preferred young / female British English voices (ordered by youthfulness & quality)
const PREFERRED_UK_FEMALE_NAMES = [
  'libby',       // Microsoft Libby Online (Natural) - UK English youthful female
  'maisie',      // Microsoft Maisie Online (Natural) - UK English young girl/female
  'sonia',       // Microsoft Sonia Online (Natural) - UK English young female
  'serena',      // Apple Serena - UK English female
  'stephanie',   // Apple Stephanie - UK English female
  'kate',        // Apple Kate - UK English female
  'fiona',       // Apple Fiona - Scottish / UK English female
  'google uk english female', // Google UK English Female (Chrome/Android)
  'uk english female',
  'hazel',       // Microsoft Hazel - UK English female
  'susan',       // Microsoft Susan - UK English female
  'mia',         // Microsoft Mia - UK English female
  'martha',      // Apple Martha - UK English female
  'victoria',    // Apple Victoria - UK English female
];

const MALE_NAME_KEYWORDS = [
  'male', 'david', 'george', 'oliver', 'ryan', 'guy', 'daniel', 'thomas', 'arthur', 'brian', 'richard', 'james'
];

/**
 * Select the best available British young female voice from the browser's speech synthesis engine.
 */
export const getBestBritishFemaleVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // 1. Check for specific high-quality young British female voices
  for (const preferredName of PREFERRED_UK_FEMALE_NAMES) {
    const match = voices.find(v => {
      const vName = v.name.toLowerCase();
      const isUK = v.lang === 'en-GB' || v.lang === 'en_GB' || v.lang.startsWith('en-GB');
      return isUK && vName.includes(preferredName);
    });
    if (match) return match;
  }

  // 2. Any en-GB voice explicitly labeled female or without male identifiers
  const gbFemaleVoice = voices.find(v => {
    const isUK = v.lang === 'en-GB' || v.lang === 'en_GB' || v.lang.startsWith('en-GB');
    const vName = v.name.toLowerCase();
    const hasFemale = vName.includes('female') || vName.includes('woman') || vName.includes('girl');
    const hasMale = MALE_NAME_KEYWORDS.some(m => vName.includes(m));
    return isUK && (hasFemale || !hasMale);
  });
  if (gbFemaleVoice) return gbFemaleVoice;

  // 3. Fallback: Any en-GB / UK voice
  const anyGbVoice = voices.find(v => 
    v.lang === 'en-GB' || v.lang === 'en_GB' || v.lang.startsWith('en-GB') || v.name.toLowerCase().includes('british') || v.name.toLowerCase().includes('united kingdom')
  );
  if (anyGbVoice) return anyGbVoice;

  // 4. Fallback: Other English female voices (e.g. Jenny, Samantha, Karen)
  const otherFemaleVoice = voices.find(v => {
    const isEn = v.lang.startsWith('en');
    const vName = v.name.toLowerCase();
    const hasFemale = vName.includes('female') || vName.includes('woman') || vName.includes('jenny') || vName.includes('samantha') || vName.includes('karen') || vName.includes('zira');
    const hasMale = MALE_NAME_KEYWORDS.some(m => vName.includes(m));
    return isEn && (hasFemale || !hasMale);
  });
  if (otherFemaleVoice) return otherFemaleVoice;

  // 5. Ultimate fallback: Any English voice
  return voices.find(v => v.lang.startsWith('en')) || null;
};

// Pre-load voices on browser startup/change
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export const speakWord = (
  text: string, 
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
) => {
  speakSentence(text, options);
};

export const speakSentence = (
  text: string,
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this device/browser.');
    return;
  }

  // Cancel any currently playing speech
  window.speechSynthesis.cancel();

  // Clean text from emojis or markdown symbols for clearer speech
  const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();
  if (!cleanText) return;

  const utterance = new SpeechSynthesisUtterance(cleanText);
  
  // Tuned for a friendly, cheerful, youthful British female delivery
  utterance.rate = options?.rate || 0.92; // Crisp, clear pace for junior learners
  utterance.pitch = options?.pitch || 1.18; // Bright, youthful British female pitch

  const voice = getBestBritishFemaleVoice();
  if (voice) {
    utterance.voice = voice;
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
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
