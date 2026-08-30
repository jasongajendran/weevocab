// Web Speech Synthesis and Device-Aware High-Quality Voice Engine for Wee-Vocab
// Optimized for iPhone, iPad, Android Phones & Tablets, Windows, and Mac

export interface VoiceSettings {
  selectedVoiceURI: string | null;
  pitch: number; // 0.8 to 1.6 (device-adjusted default ~1.15-1.20)
  rate: number;  // 0.7 to 1.3 (device-adjusted default ~0.92-0.95)
  autoOptimizeForDevice: boolean;
}

export interface DeviceInfo {
  platform: 'ios' | 'android' | 'mac' | 'windows' | 'other';
  deviceType: 'iphone' | 'ipad' | 'android-phone' | 'android-tablet' | 'desktop' | 'mobile';
  displayName: string;
  isTouchDevice: boolean;
  osTip?: string;
}

const VOICE_PREF_KEY = 'weevocab_voice_settings_v3';

/**
 * Detect user's current hardware and operating system to pick optimal TTS voices.
 */
export const detectDevicePlatform = (): DeviceInfo => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      platform: 'other',
      deviceType: 'desktop',
      displayName: 'Standard Device',
      isTouchDevice: false,
    };
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const uaLower = ua.toLowerCase();
  const maxTouchPoints = navigator.maxTouchPoints || 0;
  const isTouch = maxTouchPoints > 0 || 'ontouchstart' in window;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;

  // 1. Apple iOS Detection (iPhone, iPod)
  if (/iphone|ipod/i.test(uaLower)) {
    return {
      platform: 'ios',
      deviceType: 'iphone',
      displayName: 'Apple iPhone',
      isTouchDevice: true,
      osTip: 'iOS High-Quality Serena & Fiona (Enhanced) neural voices supported in Safari / WebKit.',
    };
  }

  // 2. Apple iPad / iPadOS (including iPad Pro running iPadOS reporting as MacIntel with touch)
  const isIPad = /ipad/i.test(uaLower) || (navigator.platform === 'MacIntel' && maxTouchPoints > 1);
  if (isIPad) {
    return {
      platform: 'ios',
      deviceType: 'ipad',
      displayName: 'Apple iPad',
      isTouchDevice: true,
      osTip: 'iPadOS High-Quality Serena & Fiona (Enhanced) voices supported.',
    };
  }

  // 3. Android Detection (Tablet vs Phone)
  if (/android/i.test(uaLower)) {
    // Android tablets typically don't have 'mobile' in UA or have wide viewport
    const isTablet = !/mobile/i.test(uaLower) || /tablet/i.test(uaLower) || screenWidth >= 600;
    return {
      platform: 'android',
      deviceType: isTablet ? 'android-tablet' : 'android-phone',
      displayName: isTablet ? 'Android Tablet' : 'Android Phone',
      isTouchDevice: true,
      osTip: 'Google Speech Services & Samsung UK English high-definition network voices supported.',
    };
  }

  // 4. Apple Mac macOS
  if (/macintosh|mac os x/i.test(uaLower) && !isIPad) {
    return {
      platform: 'mac',
      deviceType: 'desktop',
      displayName: 'Apple Mac',
      isTouchDevice: isTouch,
      osTip: 'macOS Siri & Serena/Fiona enhanced neural voices supported.',
    };
  }

  // 5. Microsoft Windows
  if (/windows/i.test(uaLower)) {
    return {
      platform: 'windows',
      deviceType: 'desktop',
      displayName: 'Windows PC',
      isTouchDevice: isTouch,
      osTip: 'Microsoft Libby & Maisie Online (Natural) HD neural voices supported in Edge / Chrome.',
    };
  }

  // 6. Generic Mobile or Desktop fallback
  if (isTouch) {
    return {
      platform: 'other',
      deviceType: 'mobile',
      displayName: 'Mobile Device',
      isTouchDevice: true,
    };
  }

  return {
    platform: 'other',
    deviceType: 'desktop',
    displayName: 'Web Browser',
    isTouchDevice: false,
  };
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  selectedVoiceURI: null,
  pitch: 1.18,
  rate: 0.94,
  autoOptimizeForDevice: true,
};

// Priority keywords by platform for high fidelity
const IPHONE_IPAD_HIGH_QUALITY_PRIORITY = [
  'serena (enhanced)',
  'serena (premium)',
  'stephanie (enhanced)',
  'stephanie (premium)',
  'fiona (enhanced)',
  'fiona (premium)',
  'kate (enhanced)',
  'kate (premium)',
  'martha (enhanced)',
  'siri voice 1',
  'siri voice 2',
  'siri voice 3',
  'siri voice 4',
  'serena',
  'stephanie',
  'fiona',
  'kate',
  'martha',
  'moira (enhanced)',
  'samantha (enhanced)',
  'ava (enhanced)',
];

const ANDROID_HIGH_QUALITY_PRIORITY = [
  'google uk english female',
  'google uk english',
  'en-gb-x-rjs#female',
  'en-gb-x-fis#female',
  'en-gb-x-gba-network',
  'en-gb-x-rjs-network',
  'samsung english (united kingdom) female',
  'samsung english (united kingdom)',
  'samsung british english',
  'google english (united kingdom)',
  'uk english female',
  'google us english female',
];

const DESKTOP_HIGH_QUALITY_PRIORITY = [
  'microsoft libby online (natural)',
  'microsoft maisie online (natural)',
  'microsoft sonia online (natural)',
  'microsoft ryan online (natural)',
  'serena (enhanced)',
  'fiona (enhanced)',
  'stephanie (enhanced)',
  'google uk english female',
  'microsoft hazel',
  'microsoft susan',
  'microsoft mia',
];

const KNOWN_MALE_KEYWORDS = [
  'male', 'david', 'george', 'oliver', 'ryan', 'guy', 'daniel', 
  'thomas', 'arthur', 'brian', 'richard', 'james', 'mark', 'steven', 
  'john', 'eddie', 'paul', 'tom', 'peter', 'charles', 'male_1', 'male_2'
];

/**
 * Load voice settings with localStorage persistence and device defaults.
 */
export const loadVoiceSettings = (): VoiceSettings => {
  if (typeof window === 'undefined') return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = localStorage.getItem(VOICE_PREF_KEY);
    if (!raw) {
      // Calibrate base defaults according to device
      const device = detectDevicePlatform();
      if (device.platform === 'ios') {
        return { ...DEFAULT_VOICE_SETTINGS, pitch: 1.12, rate: 0.95 };
      } else if (device.platform === 'android') {
        return { ...DEFAULT_VOICE_SETTINGS, pitch: 1.18, rate: 0.92 };
      }
      return DEFAULT_VOICE_SETTINGS;
    }
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
 * Check if a voice is female.
 */
export const isVoiceFemale = (voice: SpeechSynthesisVoice): boolean => {
  const name = voice.name.toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();
  
  if (KNOWN_MALE_KEYWORDS.some(m => name.includes(m) || uri.includes(m))) {
    return false;
  }
  if (name.includes('female') || name.includes('woman') || name.includes('girl') || uri.includes('female')) {
    return true;
  }
  if (
    IPHONE_IPAD_HIGH_QUALITY_PRIORITY.some(k => name.includes(k) || uri.includes(k)) ||
    DESKTOP_HIGH_QUALITY_PRIORITY.some(k => name.includes(k) || uri.includes(k))
  ) {
    return true;
  }
  return true; // Default neutral/female candidate
};

/**
 * Check if a voice has a British or Scottish accent.
 */
export const isVoiceBritish = (voice: SpeechSynthesisVoice): boolean => {
  const lang = (voice.lang || '').toLowerCase();
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();
  return (
    lang.startsWith('en-gb') || 
    lang.startsWith('en_gb') || 
    lang.startsWith('en-scot') || 
    name.includes('united kingdom') || 
    name.includes('british') || 
    name.includes('uk english') ||
    name.includes('scot') ||
    name.includes('fiona') ||
    name.includes('serena') ||
    name.includes('libby') ||
    name.includes('maisie') ||
    uri.includes('en-gb') ||
    uri.includes('en_gb')
  );
};

/**
 * Check if a voice is an Enhanced / High Definition Neural voice.
 */
export const isVoiceEnhanced = (voice: SpeechSynthesisVoice): boolean => {
  const name = (voice.name || '').toLowerCase();
  const uri = (voice.voiceURI || '').toLowerCase();
  return (
    name.includes('enhanced') ||
    name.includes('premium') ||
    name.includes('natural') ||
    name.includes('neural') ||
    name.includes('online') ||
    name.includes('high quality') ||
    name.includes('wavenet') ||
    uri.includes('enhanced') ||
    uri.includes('premium') ||
    uri.includes('network') ||
    (!voice.localService && name.includes('google'))
  );
};

export interface VoiceOption {
  voice: SpeechSynthesisVoice;
  name: string;
  lang: string;
  uri: string;
  isBritish: boolean;
  isFemale: boolean;
  isEnhanced: boolean;
  isRecommended: boolean;
  isDeviceSpecificPick: boolean;
  qualityBadge?: string;
}

/**
 * Get scored and device-sorted voice options available in the browser.
 */
export const getAvailableVoicesList = (): VoiceOption[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  
  const rawVoices = window.speechSynthesis.getVoices() || [];
  const device = detectDevicePlatform();

  const enriched = rawVoices.map(voice => {
    const isBrit = isVoiceBritish(voice);
    const isFem = isVoiceFemale(voice);
    const isEnh = isVoiceEnhanced(voice);
    const vName = voice.name.toLowerCase();
    const vUri = (voice.voiceURI || '').toLowerCase();

    let isDeviceSpecificPick = false;
    let qualityBadge: string | undefined = undefined;

    if (device.platform === 'ios') {
      if (IPHONE_IPAD_HIGH_QUALITY_PRIORITY.slice(0, 10).some(k => vName.includes(k) || vUri.includes(k))) {
        isDeviceSpecificPick = true;
        qualityBadge = isEnh ? 'Apple HD Enhanced' : 'Apple iOS Voice';
      }
    } else if (device.platform === 'android') {
      if (ANDROID_HIGH_QUALITY_PRIORITY.slice(0, 8).some(k => vName.includes(k) || vUri.includes(k))) {
        isDeviceSpecificPick = true;
        qualityBadge = isEnh ? 'Google HD Neural' : 'Android UK Voice';
      }
    } else {
      if (DESKTOP_HIGH_QUALITY_PRIORITY.slice(0, 6).some(k => vName.includes(k) || vUri.includes(k))) {
        isDeviceSpecificPick = true;
        qualityBadge = isEnh ? 'Microsoft Natural HD' : 'Desktop UK Voice';
      }
    }

    if (vName.includes('fiona')) {
      qualityBadge = '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Authentic Scottish';
    }

    const isRec = isBrit && isFem && (isDeviceSpecificPick || isEnh);

    return {
      voice,
      name: voice.name,
      lang: voice.lang,
      uri: voice.voiceURI || voice.name,
      isBritish: isBrit,
      isFemale: isFem,
      isEnhanced: isEnh,
      isRecommended: isRec,
      isDeviceSpecificPick,
      qualityBadge,
    };
  });

  // Sort with recommended and device-specific at top
  return enriched.sort((a, b) => {
    if (a.isDeviceSpecificPick && !b.isDeviceSpecificPick) return -1;
    if (!a.isDeviceSpecificPick && b.isDeviceSpecificPick) return 1;
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    if (a.isBritish && !b.isBritish) return -1;
    if (!a.isBritish && b.isBritish) return 1;
    return a.name.localeCompare(b.name);
  });
};

/**
 * Intelligent Selection of Highest Quality British / Scottish Voice tailored to the specific device.
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
  const device = detectDevicePlatform();

  // 1. If user explicitly selected a voice in settings
  if (userSettings.selectedVoiceURI) {
    const userMatch = voices.find(v => (v.voiceURI || v.name) === userSettings.selectedVoiceURI);
    if (userMatch) {
      const isMale = !isVoiceFemale(userMatch);
      return { voice: userMatch, pitchBoost: isMale ? 0.22 : 0 };
    }
  }

  // 2. DEVICE-SPECIFIC HIGH-FIDELITY MATCHING

  // A. Apple iOS (iPhone & iPad)
  if (device.platform === 'ios') {
    for (const keyword of IPHONE_IPAD_HIGH_QUALITY_PRIORITY) {
      const match = voices.find(v => {
        const vName = v.name.toLowerCase();
        const vUri = (v.voiceURI || '').toLowerCase();
        return (vName.includes(keyword) || vUri.includes(keyword)) && isVoiceFemale(v);
      });
      if (match) return { voice: match, pitchBoost: 0 };
    }
  }

  // B. Android Phones & Android Tablets
  if (device.platform === 'android') {
    for (const keyword of ANDROID_HIGH_QUALITY_PRIORITY) {
      const match = voices.find(v => {
        const vName = v.name.toLowerCase();
        const vUri = (v.voiceURI || '').toLowerCase();
        return (vName.includes(keyword) || vUri.includes(keyword)) && isVoiceFemale(v);
      });
      if (match) return { voice: match, pitchBoost: 0 };
    }
  }

  // C. Windows / macOS Desktop / General High Quality Fallback
  for (const keyword of DESKTOP_HIGH_QUALITY_PRIORITY) {
    const match = voices.find(v => {
      const vName = v.name.toLowerCase();
      const vUri = (v.voiceURI || '').toLowerCase();
      return (vName.includes(keyword) || vUri.includes(keyword)) && isVoiceFemale(v);
    });
    if (match) return { voice: match, pitchBoost: 0 };
  }

  // 3. Any UK/British Voice with Enhanced/Premium flag
  const enhancedUK = voices.find(v => isVoiceBritish(v) && isVoiceFemale(v) && isVoiceEnhanced(v));
  if (enhancedUK) return { voice: enhancedUK, pitchBoost: 0 };

  // 4. Any UK/British Female voice
  const ukFemale = voices.find(v => isVoiceBritish(v) && isVoiceFemale(v));
  if (ukFemale) return { voice: ukFemale, pitchBoost: 0 };

  // 5. Any English Enhanced Female voice (US / AU / International)
  const englishEnhancedFemale = voices.find(v => v.lang.toLowerCase().startsWith('en') && isVoiceFemale(v) && isVoiceEnhanced(v));
  if (englishEnhancedFemale) return { voice: englishEnhancedFemale, pitchBoost: 0.04 };

  // 6. Any English Female voice
  const englishFemale = voices.find(v => v.lang.toLowerCase().startsWith('en') && isVoiceFemale(v));
  if (englishFemale) return { voice: englishFemale, pitchBoost: 0.05 };

  // 7. If only UK male voice is present, apply a pitch boost so it sounds friendly and youthful
  const ukAny = voices.find(v => isVoiceBritish(v));
  if (ukAny) return { voice: ukAny, pitchBoost: 0.22 };

  // 8. Generic English fallback
  const anyEnglish = voices.find(v => v.lang.toLowerCase().startsWith('en'));
  return { voice: anyEnglish || null, pitchBoost: 0.12 };
};

// Listen for browser voice readiness
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

/**
 * Mobile Audio Unlocker:
 * On iOS Safari and Chrome Android, Web Speech API requires user interaction or unpausing
 * before initial speech output can be heard clearly.
 */
export const unlockSpeechEngine = () => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  } catch (e) {}
};

// Global references to prevent GC dropping onend/onstart events and guarantee instant UI feedback
let activeUtterance: SpeechSynthesisUtterance | null = null;
let fallbackEndTimer: any = null;
let currentOnEndCallback: (() => void) | null = null;

export const cancelSpeech = () => {
  if (fallbackEndTimer) {
    clearTimeout(fallbackEndTimer);
    fallbackEndTimer = null;
  }
  if (currentOnEndCallback) {
    const cb = currentOnEndCallback;
    currentOnEndCallback = null;
    cb();
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  activeUtterance = null;
};

/**
 * Speak word with device-calibrated British young female voice.
 */
export const speakWord = (
  text: string, 
  options?: { rate?: number; pitch?: number; onStart?: () => void; onEnd?: () => void }
) => {
  speakSentence(text, options);
};

/**
 * Speak full sentence or phrase with device-calibrated high quality voice.
 */
export const speakSentence = (
  text: string,
  options?: { rate?: number; pitch?: number; onStart?: () => void; onEnd?: () => void }
) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this device/browser.');
    options?.onEnd?.();
    return;
  }

  // Clear previous active timers & callbacks cleanly
  if (fallbackEndTimer) {
    clearTimeout(fallbackEndTimer);
    fallbackEndTimer = null;
  }
  if (currentOnEndCallback) {
    const oldCb = currentOnEndCallback;
    currentOnEndCallback = null;
    oldCb();
  }

  // Clean special characters & markdown for smooth speech
  const cleanText = text.replace(/[*_#`~[\]]/g, '').trim();
  if (!cleanText) {
    options?.onEnd?.();
    return;
  }

  // If already speaking, cancel previous speech
  try {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      window.speechSynthesis.cancel();
    }
  } catch (e) {}

  const utterance = new SpeechSynthesisUtterance(cleanText);
  activeUtterance = utterance; // Prevent browser garbage collection from cutting events

  const settings = loadVoiceSettings();
  const device = detectDevicePlatform();
  const { voice, pitchBoost } = getBestBritishFemaleVoice();

  // Apply device-specific baseline tuning
  let basePitch = settings.pitch;
  let baseRate = settings.rate;

  if (device.platform === 'ios') {
    // iOS Safari sounds most natural at ~0.95 rate and slight pitch elevation
    basePitch = Math.min(1.35, basePitch);
  } else if (device.platform === 'android') {
    // Android speech engine benefits from steady pace
    baseRate = Math.min(1.0, baseRate);
  }

  utterance.pitch = options?.pitch ?? (basePitch + pitchBoost);
  utterance.rate = options?.rate ?? baseRate;

  if (voice) {
    utterance.voice = voice;
  }

  let hasEnded = false;
  const triggerEnd = () => {
    if (hasEnded) return;
    hasEnded = true;
    if (fallbackEndTimer) {
      clearTimeout(fallbackEndTimer);
      fallbackEndTimer = null;
    }
    if (activeUtterance === utterance) {
      activeUtterance = null;
    }
    currentOnEndCallback = null;
    if (options?.onEnd) {
      options.onEnd();
    }
  };

  currentOnEndCallback = triggerEnd;

  utterance.onstart = () => {
    if (options?.onStart) {
      options.onStart();
    }
  };

  utterance.onend = () => {
    triggerEnd();
  };

  utterance.onerror = (e) => {
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      console.warn('TTS playback issue:', e.error);
    }
    triggerEnd();
  };

  // Accurate duration estimation to turn off animation right as speech ends
  // Standard speech is ~140 wpm (~2.3 words/sec, ~14 chars/sec)
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = Math.max(1, words.length);
  const charCount = cleanText.length;
  const effectiveRate = utterance.rate || 0.94;

  const estimatedDurationMs = Math.round(
    Math.max(
      500, // minimum single-word duration
      ((wordCount * 250 + charCount * 38) / effectiveRate) + 150
    )
  );

  // Precision fallback timer to shut off the animation when speech ends without delay
  fallbackEndTimer = setTimeout(() => {
    triggerEnd();
  }, estimatedDurationMs);

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.error('Error executing speech synthesis:', err);
    triggerEnd();
  }
};

/**
 * Play a test preview of the British voice.
 */
export const testBritishVoicePreview = (customText?: string) => {
  const sample = customText || "Hello! I am your British and Scottish study companion. Let's learn some braw vocabulary together!";
  speakSentence(sample);
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
