// Web Speech Synthesis and Voice Practice

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
  utterance.rate = options?.rate || 0.9; // Natural pace for learners
  utterance.pitch = options?.pitch || 1.05; // Friendly, clear pitch

  const voices = window.speechSynthesis.getVoices();
  // Try to find a Scottish or British English voice
  const scotVoice = voices.find(v => 
    v.lang === 'en-GB' && (v.name.toLowerCase().includes('scot') || v.name.toLowerCase().includes('fiona'))
  );
  const gbVoice = voices.find(v => v.lang === 'en-GB' || v.lang.startsWith('en-GB') || v.name.toLowerCase().includes('british') || v.name.toLowerCase().includes('uk'));
  const englishVoice = voices.find(v => v.lang.startsWith('en'));

  if (scotVoice) {
    utterance.voice = scotVoice;
  } else if (gbVoice) {
    utterance.voice = gbVoice;
  } else if (englishVoice) {
    utterance.voice = englishVoice;
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
