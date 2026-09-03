import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, Volume2, Mic, Star, Sparkles, CheckCircle2, AlertCircle, 
  Award, MessageSquare, Compass, HelpCircle, Zap, Check, RotateCcw, 
  Layers, ChevronRight, ShieldCheck, Flame, Lightbulb, BookOpen, Tag, Quote
} from 'lucide-react';
import { DictionaryEntry } from '../types/dictionary';
import { startVoicePractice, RecognitionResult } from '../utils/speech';
import { playSound } from '../utils/soundEffects';
import { SoundWaveIcon } from './SoundWaveIcon';

interface WordStudyModalProps {
  word: DictionaryEntry;
  allEntries: DictionaryEntry[];
  isStarred: boolean;
  onToggleStar: () => void;
  onClose: () => void;
  onOpenAIBard?: (word: DictionaryEntry) => void;
  playingAudioId: string | null;
  onPlayAudio: (text: string, id: string, rate?: number) => void;
}

interface QuizOption {
  text: string;
  isCorrect: boolean;
  word: string;
  definition: string;
  partOfSpeech?: string;
}

interface QuizState {
  question: string;
  type: 'meaning' | 'fill_blank';
  options: QuizOption[];
  correctIndex: number;
  correctWord: string;
  correctDefinition: string;
  explanation: string;
}

export const WordStudyModal: React.FC<WordStudyModalProps> = ({
  word,
  allEntries,
  isStarred,
  onToggleStar,
  onClose,
  onOpenAIBard,
  playingAudioId,
  onPlayAudio,
}) => {
  // Voice Recording Practice State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState<RecognitionResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Active Recall Quiz State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState<boolean | null>(null);

  // Generate Unique Non-Duplicate Active Recall Challenge
  const quiz = useMemo<QuizState>(() => {
    // Generate distractors from other entries of same or similar category
    const otherCandidates = allEntries.filter(e => e.id !== word.id && e.partOfSpeech === word.partOfSpeech);
    const pool = otherCandidates.length >= 2 ? otherCandidates : allEntries.filter(e => e.id !== word.id);
    
    // Shuffle pool
    const shuffledPool = [...pool].sort(() => 0.5 - Math.random());
    const distractor1 = shuffledPool[0] || {
      id: 'fallback-1',
      word: 'Meander',
      definition: 'To wander aimlessly or follow a winding, leisurely course.',
      partOfSpeech: 'verb',
      phonetic: '/miˈændər/',
      phoneticGuide: 'mee-AN-der',
      examples: ['They meandered along the river.'],
      category: 'Academic & Powerful',
      difficulty: 'P6-P7',
      isScots: false,
      isAcademic: true,
      synonyms: ['stroll', 'wander'],
      antonyms: ['march', 'rush'],
      scotsRegion: 'UK Wide & Common',
    };
    const distractor2 = shuffledPool[1] || {
      id: 'fallback-2',
      word: 'Embellish',
      definition: 'To add decorative details or exaggerated features to something.',
      partOfSpeech: 'verb',
      phonetic: '/ɪmˈbɛlɪʃ/',
      phoneticGuide: 'im-BEL-ish',
      examples: ['She embellished the story with extra drama.'],
      category: 'Academic & Powerful',
      difficulty: 'S1-S2',
      isScots: false,
      isAcademic: true,
      synonyms: ['decorate', 'adorn'],
      antonyms: ['simplify', 'strip'],
      scotsRegion: 'UK Wide & Common',
    };

    // Pick between Fill-in-the-blank or Definition Challenge
    const useFillBlank = word.examples.length > 0 && Math.random() > 0.35;

    if (useFillBlank && word.examples[0]) {
      const sentence = word.examples[0];
      const regex = new RegExp(`\\b${word.word}\\b`, 'gi');
      const blankedSentence = sentence.replace(regex, '________');

      const correctOpt: QuizOption = {
        text: word.word,
        isCorrect: true,
        word: word.word,
        definition: word.definition,
        partOfSpeech: word.partOfSpeech,
      };

      const wrongOpt1: QuizOption = {
        text: distractor1.word,
        isCorrect: false,
        word: distractor1.word,
        definition: distractor1.definition,
        partOfSpeech: distractor1.partOfSpeech,
      };

      const wrongOpt2: QuizOption = {
        text: distractor2.word,
        isCorrect: false,
        word: distractor2.word,
        definition: distractor2.definition,
        partOfSpeech: distractor2.partOfSpeech,
      };

      const options = [correctOpt, wrongOpt1, wrongOpt2].sort(() => 0.5 - Math.random());
      const correctIndex = options.findIndex(o => o.isCorrect);

      return {
        question: `Complete the sentence: "${blankedSentence}"`,
        type: 'fill_blank',
        options,
        correctIndex,
        correctWord: word.word,
        correctDefinition: word.definition,
        explanation: `"${word.word}" fits correctly because it means: ${word.definition}`,
      };
    } else {
      const correctOpt: QuizOption = {
        text: word.definition,
        isCorrect: true,
        word: word.word,
        definition: word.definition,
        partOfSpeech: word.partOfSpeech,
      };

      const wrongOpt1: QuizOption = {
        text: distractor1.definition,
        isCorrect: false,
        word: distractor1.word,
        definition: distractor1.definition,
        partOfSpeech: distractor1.partOfSpeech,
      };

      const wrongOpt2: QuizOption = {
        text: distractor2.definition,
        isCorrect: false,
        word: distractor2.word,
        definition: distractor2.definition,
        partOfSpeech: distractor2.partOfSpeech,
      };

      const options = [correctOpt, wrongOpt1, wrongOpt2].sort(() => 0.5 - Math.random());
      const correctIndex = options.findIndex(o => o.isCorrect);

      return {
        question: `What is the accurate meaning of "${word.word}"?`,
        type: 'meaning',
        options,
        correctIndex,
        correctWord: word.word,
        correctDefinition: word.definition,
        explanation: `"${word.word}" (${word.partOfSpeech}) means: ${word.definition}`,
      };
    }
  }, [word, allEntries]);

  // Reset quiz state when word changes
  useEffect(() => {
    setSelectedOption(null);
    setQuizAnswered(false);
    setQuizScore(null);
    setVoiceResult(null);
    setVoiceError(null);
  }, [word.id]);

  // Voice practice handler
  const handleStartVoice = (targetWord: string) => {
    setIsRecording(true);
    setVoiceResult(null);
    setVoiceError(null);
    playSound('click');

    const stopRecording = startVoicePractice(
      targetWord,
      (result) => {
        setIsRecording(false);
        setVoiceResult(result);
        if (result.isMatch) {
          playSound('celebrate');
          confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
        } else {
          playSound('wrong');
        }
      },
      (error) => {
        setIsRecording(false);
        setVoiceError(error);
      }
    );

    setTimeout(() => {
      setIsRecording((currentlyRec) => {
        if (currentlyRec) stopRecording();
        return false;
      });
    }, 6000);
  };

  // Handle Quiz Selection
  const handleAnswerQuiz = (index: number) => {
    if (quizAnswered) return;
    setSelectedOption(index);
    setQuizAnswered(true);

    const isCorrect = index === quiz.correctIndex;
    setQuizScore(isCorrect);

    if (isCorrect) {
      playSound('celebrate');
      confetti({ particleCount: 40, spread: 70, origin: { y: 0.6 } });
    } else {
      playSound('wrong');
    }
  };

  const handleResetQuiz = () => {
    setSelectedOption(null);
    setQuizAnswered(false);
    setQuizScore(null);
    playSound('pop');
  };

  // Formality & Register Intelligence
  const formalityDetails = useMemo(() => {
    if (word.isAcademic || word.category === 'Academic & Powerful') {
      return {
        level: 'Formal & Academic',
        dots: 5,
        badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-600/50',
        tone: 'Essays, presentations, debate, and formal writing',
        advice: 'Use this term in high-level coursework, analytical essays, and formal discussions to convey precision.',
      };
    }
    if (word.category === 'UK Common & Slang' || word.category === 'School & Banter') {
      return {
        level: 'Casual & Conversational',
        dots: 2,
        badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
        tone: 'Playground banter, daily texts, casual chat with friends',
        advice: 'Common in relaxed spoken conversation and banter. Keep for informal settings rather than exam essays.',
      };
    }
    if (word.isScots) {
      return {
        level: 'Dialect & Cultural Expressive',
        dots: 3,
        badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-600/50',
        tone: 'Scottish storytelling, regional conversation, local heritage',
        advice: 'Deeply expressive in Scottish storytelling, literature, poetry, and regional dialogue.',
      };
    }
    return {
      level: 'Everyday Standard UK',
      dots: 3,
      badgeBg: 'bg-teal-950/80 text-teal-300 border-teal-600/50',
      tone: 'General everyday UK English across all ages',
      advice: 'Versatile and widely recognized in both spoken conversation and general writing.',
    };
  }, [word]);

  // Collocations & Word Pairings (Dynamic & Smart)
  const collocations = useMemo(() => {
    const list: string[] = [];
    const w = word.word.toLowerCase();

    if (word.partOfSpeech === 'adjective') {
      list.push(`right ${w}`, `pure ${w}`, `terribly ${w}`, `a ${w} day / sight`);
    } else if (word.partOfSpeech === 'verb') {
      list.push(`to ${w} away`, `start to ${w}`, `having a ${w}`, `completely ${w}ed`);
    } else if (word.partOfSpeech === 'noun') {
      list.push(`a wee ${w}`, `the whole ${w}`, `such a ${w}`, `full of ${w}`);
    } else {
      list.push(`right ${w}!`, `properly ${w}`, `dead ${w}`, `sound like a ${w}`);
    }
    return list;
  }, [word]);

  // Highlight the target word inside example sentences
  const renderHighlightedSentence = (sentence: string, targetWord: string) => {
    if (!sentence || !targetWord) return sentence;
    const escaped = targetWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b(${escaped}(?:ing|ed|s|es|d|er|est)?)\\b`, 'gi');
    const parts = sentence.split(regex);
    if (parts.length === 1) {
      return `"${sentence}"`;
    }
    return (
      <>
        "
        {parts.map((part, i) =>
          regex.test(part) ? (
            <span
              key={i}
              className="font-black text-slate-950 bg-amber-400 px-1.5 py-0.5 rounded"
            >
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        "
      </>
    );
  };

  // Lock background scroll and handle Escape key to keep modal fully responsive
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      id="word-study-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-hidden animate-fadeIn overscroll-contain"
      onClick={onClose}
    >
      <div 
        id="word-study-modal-dialog"
        className="bg-slate-900 rounded-3xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-700/80 max-h-[92vh] sm:max-h-[88vh] overflow-hidden text-left relative overscroll-contain touch-pan-y ring-1 ring-slate-700/50"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Top Header: Breadcrumbs & Quick Controls (No duplicated word/definition) */}
        <div className="shrink-0 bg-slate-900/98 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 sm:py-3.5 z-20 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            
            {/* Header Left: Category & Study Guide indicator */}
            <div className="min-w-0 flex-1 pr-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                Study Guide
              </span>
              <span className="text-slate-600">•</span>
              <span className={`px-2.5 py-0.5 text-xs font-black rounded-lg border ${formalityDetails.badgeBg} shrink-0`}>
                {word.category}
              </span>
              {word.isScots && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-sky-950/80 text-sky-300 border border-sky-600/50 shrink-0">
                  🏴󠁧󠁢󠁳󠁣󠁴󠁿 {word.scotsRegion}
                </span>
              )}
            </div>

            {/* Pinned Header Action Controls: Audio, Star & Close */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                id="modal-word-title-sound-btn"
                onClick={() => onPlayAudio(word.word, 'modal-title-word', 0.9)}
                title={`Listen to pronunciation of "${word.word}"`}
                aria-label={`Listen to pronunciation of ${word.word}`}
                className={`p-2.5 sm:p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  playingAudioId === 'modal-title-word'
                    ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white scale-105 ring-2 ring-sky-400 shadow-md'
                    : 'bg-slate-800 text-sky-300 hover:bg-sky-600 hover:text-white hover:scale-105 border border-slate-700 shadow-2xs active:scale-95'
                }`}
              >
                <SoundWaveIcon isPlaying={playingAudioId === 'modal-title-word'} size="md" />
              </button>

              <button
                id="modal-star-btn"
                onClick={() => {
                  onToggleStar();
                  playSound('pop');
                }}
                title={isStarred ? 'Remove from Vault' : 'Save to Vault'}
                aria-label={isStarred ? 'Remove from Vault' : 'Save to Vault'}
                className={`p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer ${
                  isStarred
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md border border-amber-300 ring-2 ring-amber-300/40 scale-105'
                    : 'bg-slate-800 text-slate-300 hover:bg-amber-950/50 hover:text-amber-300 border border-slate-700'
                }`}
              >
                <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isStarred ? 'fill-slate-950 text-slate-950' : ''}`} />
              </button>

              <button
                id="close-modal-btn"
                onClick={onClose}
                aria-label="Close Study Guide"
                title="Close"
                className="p-2.5 sm:p-3 rounded-2xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer border border-slate-700"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div 
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5 custom-scrollbar text-left overscroll-contain touch-pan-y"
          onWheel={(e) => e.stopPropagation()}
        >

          {/* Master Spotlight Showcase: Word, Phonetics & Definition Stated Cleanly ONCE */}
          <div className="bg-slate-800/90 rounded-3xl p-5 sm:p-6 border border-slate-700 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-600/50">
                    {word.difficulty}
                  </span>
                  <span className="text-xs font-black text-slate-300 bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-700">
                    {word.partOfSpeech}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight break-words">
                  {word.word}
                </h1>
                <div className="flex items-center gap-2.5 flex-wrap text-sm sm:text-base text-slate-300 font-bold">
                  <span className="font-mono text-cyan-300 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700 font-bold">
                    {word.phonetic}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300">🗣️ {word.phoneticGuide}</span>
                </div>
              </div>

              <button
                onClick={() => onPlayAudio(word.word, 'hero-spotlight-audio', 0.9)}
                title="Listen to pronunciation aloud"
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-xs sm:text-sm shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-emerald-500/40"
              >
                <SoundWaveIcon isPlaying={playingAudioId === 'hero-spotlight-audio'} size="sm" />
                <span>Pronounce Aloud</span>
              </button>
            </div>

            {/* Clear Primary Definition */}
            <div className="border-t border-slate-700/80 pt-3.5 mt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block mb-1">
                Definition
              </span>
              <p className="text-lg sm:text-xl font-semibold text-slate-100 leading-relaxed">
                {word.definition}
              </p>
            </div>
          </div>

          {/* Section: Example Sentences in Action with Voice Audio */}
          {word.examples && word.examples.length > 0 && (
            <div className="bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-700 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-amber-500 text-slate-950 shadow-2xs">
                    <Quote className="w-3.5 h-3.5" />
                  </div>
                  Examples in Action
                </span>
                <span className="text-xs font-black text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-600/50">
                  {word.examples.length} {word.examples.length === 1 ? 'sentence' : 'sentences'}
                </span>
              </div>

              <div className="space-y-2.5">
                {word.examples.map((example, idx) => {
                  const audioKey = `modal-example-${word.id}-${idx}`;
                  const isPlaying = playingAudioId === audioKey;
                  return (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between gap-3.5 p-3.5 sm:p-4 rounded-xl bg-slate-900/90 border-l-4 border-l-amber-400 border-y border-r border-slate-750 hover:bg-slate-900 transition-colors shadow-2xs"
                    >
                      <p className="flex-1 text-base sm:text-lg font-medium text-slate-200 leading-relaxed italic">
                        {renderHighlightedSentence(example, word.word)}
                      </p>

                      <button
                        id={`modal-listen-ex-${idx}`}
                        onClick={() => onPlayAudio(example, audioKey, 0.9)}
                        title="Listen to this example sentence"
                        aria-label={`Listen to example ${idx + 1}`}
                        className={`p-2.5 sm:p-3 rounded-xl transition-all shrink-0 cursor-pointer ${
                          isPlaying
                            ? 'bg-amber-400 text-slate-950 scale-108 shadow-md ring-2 ring-amber-300'
                            : 'bg-amber-950/60 text-amber-300 hover:bg-amber-400 hover:text-slate-950 border border-amber-500/40 shadow-2xs'
                        }`}
                      >
                        <SoundWaveIcon isPlaying={isPlaying} size="md" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Synonyms & Antonyms */}
          {((word.synonyms && word.synonyms.length > 0) || (word.antonyms && word.antonyms.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {word.synonyms && word.synonyms.length > 0 && (
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2 shadow-xs">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-400" /> Synonyms
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {word.synonyms.map((syn, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-emerald-950/60 text-sm font-bold text-emerald-300 border border-emerald-700/50 shadow-2xs"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {word.antonyms && word.antonyms.length > 0 && (
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2 shadow-xs">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-rose-400" /> Antonyms
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {word.antonyms.map((ant, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 rounded-lg bg-rose-950/60 text-sm font-bold text-rose-300 border border-rose-700/50 shadow-2xs"
                      >
                        {ant}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: Pronunciation Studio & Voice Test Lab (Serene Indigo & Sky Blue theme) */}
          <div className="bg-slate-800/80 rounded-3xl p-4 sm:p-5 border border-slate-700 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Volume2 className="w-4 h-4" />
                </div>
                Pronunciation Studio
              </span>

              {/* Speed Buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="modal-pronounce-normal"
                  onClick={() => onPlayAudio(word.word, 'modal-word-norm', 0.9)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-sm transition-all hover:scale-105 cursor-pointer border border-indigo-500"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Normal Speed</span>
                </button>
                <button
                  id="modal-pronounce-slow"
                  onClick={() => onPlayAudio(word.word, 'modal-word-slow', 0.6)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 text-sky-300 border border-sky-600/50 hover:bg-slate-850 font-black text-xs transition-all hover:scale-105 shadow-2xs cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>0.6x Slow Coach</span>
                </button>
              </div>
            </div>

            {/* Interactive Voice Mic */}
            <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="text-left w-full sm:w-auto">
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-400 block mb-0.5">
                  Voice Speech Test
                </span>
                <p className="text-xs text-slate-400 font-medium">
                  Speak aloud to verify your accent & vowel articulation
                </p>
              </div>

              <button
                id="voice-practice-mic-btn"
                onClick={() => handleStartVoice(word.word)}
                disabled={isRecording}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-lg'
                    : 'bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-md hover:scale-105 active:scale-95 border border-sky-500/40'
                }`}
              >
                {isRecording ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
                <span>{isRecording ? 'Listening now...' : 'Test My Voice'}</span>
              </button>
            </div>

            {/* Voice Result Feedback */}
            {voiceResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
                voiceResult.isMatch 
                  ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200' 
                  : 'bg-amber-950/80 border-amber-600/60 text-amber-200'
              }`}>
                {voiceResult.isMatch ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <span className="font-black">Brilliant pronunciation!</span> You spoke "{voiceResult.transcript}", which matched accurately!
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <span className="font-black">Good attempt!</span> We detected "{voiceResult.transcript}". Try the 0.6x Slow Coach to nail the Scottish/UK vowels!
                    </div>
                  </>
                )}
              </div>
            )}

            {voiceError && (
              <p className="text-xs text-rose-400 font-bold">⚠️ {voiceError}</p>
            )}
          </div>

          {/* Section: Etymology & Cultural Heritage Story */}
          {word.loreOrFunFact && (
            <div className="bg-amber-950/30 rounded-2xl p-4 sm:p-5 border border-amber-500/30 text-amber-200 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-amber-500 text-slate-950 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  Origin & Heritage Story
                </span>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-amber-100 font-medium">
                {word.loreOrFunFact}
              </p>
            </div>
          )}

          {/* Section: Formality Meter & Conversational Register */}
          <div className="bg-sky-950/30 rounded-2xl p-4 sm:p-5 border border-sky-500/30 space-y-3 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <div className="p-1 rounded-lg bg-sky-600 text-white shadow-2xs">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                Usage & Register
              </span>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sky-900/90 text-sky-200 border border-sky-600/50 shadow-2xs">
                {formalityDetails.level}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-750 space-y-1 shadow-2xs">
                <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" /> Context
                </span>
                <p className="text-sm sm:text-base font-medium text-slate-200 leading-snug">{formalityDetails.tone}</p>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-750 space-y-1 shadow-2xs">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Usage Tip
                </span>
                <p className="text-sm sm:text-base font-medium text-slate-200 leading-snug">{formalityDetails.advice}</p>
              </div>
            </div>

            {/* Natural Phrasal Collocations */}
            {collocations.length > 0 && (
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-sky-300 block mb-2">
                  Common Pairings:
                </span>
                <div className="flex flex-wrap gap-2">
                  {collocations.map((phrase, idx) => (
                    <span 
                      key={idx} 
                      className="px-3 py-1.5 bg-slate-900 text-sky-200 border border-sky-600/50 rounded-xl text-sm font-semibold shadow-2xs hover:border-sky-400 transition-colors"
                    >
                      "{phrase}"
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section: Interactive Quick Mastery Challenge (Active Recall) */}
          <div className="bg-teal-950/30 rounded-2xl p-4 sm:p-5 border border-teal-500/30 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-teal-600 text-white shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-teal-300">
                  Quick Quiz
                </span>
              </div>
              {quizAnswered && (
                <button
                  onClick={handleResetQuiz}
                  title="Try another attempt"
                  className="flex items-center gap-1 text-xs font-black text-teal-300 hover:text-teal-200 cursor-pointer hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
              )}
            </div>

            <p className="text-base sm:text-lg font-bold text-white leading-snug">
              {quiz.question}
            </p>

            {/* Multiple Choice Options */}
            <div className="space-y-2.5">
              {quiz.options.map((option, idx) => {
                const isSelected = selectedOption === idx;
                const isCorrect = option.isCorrect;
                
                let btnStyle = 'bg-slate-900/90 border border-slate-700 text-slate-200 font-semibold hover:border-teal-400 hover:bg-slate-850';
                if (quizAnswered) {
                  if (isCorrect) {
                    btnStyle = 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border border-emerald-400 font-black shadow-md ring-2 ring-emerald-400/40';
                  } else if (isSelected && !isCorrect) {
                    btnStyle = 'bg-rose-700 text-white border border-rose-500 font-black shadow-sm ring-2 ring-rose-400/40';
                  } else {
                    btnStyle = 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-50';
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={quizAnswered}
                    onClick={() => handleAnswerQuiz(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1 cursor-pointer ${btnStyle}`}
                  >
                    <div className="w-full flex items-center justify-between gap-2.5">
                      <span className="font-bold text-base leading-snug">
                        {option.text}
                      </span>
                      {quizAnswered && isCorrect && (
                        <div className="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-md text-xs font-black shrink-0">
                          <Check className="w-4 h-4 text-white" />
                          <span>Correct</span>
                        </div>
                      )}
                      {quizAnswered && isSelected && !isCorrect && (
                        <div className="flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-md text-xs font-black shrink-0">
                          <X className="w-4 h-4 text-white" />
                          <span>Your Choice</span>
                        </div>
                      )}
                    </div>

                    {/* Show definition context for every option once answered */}
                    {quizAnswered && (
                      <div className={`text-xs pt-1.5 mt-1 border-t ${
                        isCorrect 
                          ? 'border-white/30 text-emerald-100 font-medium' 
                          : isSelected 
                          ? 'border-white/30 text-rose-100 font-medium' 
                          : 'border-slate-800 text-slate-400'
                      }`}>
                        {quiz.type === 'fill_blank' ? (
                          <p className="leading-snug">
                            <strong className="opacity-95 text-sm">"{option.word}"</strong>: {option.definition}
                          </p>
                        ) : (
                          <p className="leading-snug">
                            <strong className="opacity-95 text-sm">
                              {isCorrect ? `Meaning of "${option.word}"` : `Belongs to "${option.word}"`}
                            </strong>: {option.definition}
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback banner with full explanations */}
            {quizAnswered && (
              <div className={`p-4 rounded-2xl border animate-fadeIn space-y-2.5 ${
                quizScore 
                  ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200 shadow-xs' 
                  : 'bg-rose-950/80 border-rose-600/60 text-rose-200 shadow-xs'
              }`}>
                {quizScore ? (
                  <div className="flex items-start gap-2.5">
                    <Award className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-black text-xs sm:text-sm text-white">
                        Spot on! You've mastered "{word.word}"!
                      </p>
                      <p className="text-xs text-emerald-300 leading-relaxed font-medium">
                        "{word.word}" fits correctly because it means: {word.definition}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <p className="font-black text-xs sm:text-sm text-white">
                        Not quite, but let's review both words:
                      </p>
                      
                      {/* Chosen Wrong Option Explanation */}
                      {selectedOption !== null && quiz.options[selectedOption] && !quiz.options[selectedOption].isCorrect && (
                        <div className="bg-slate-900/90 p-2.5 rounded-xl border border-rose-700/60 text-xs text-rose-200 font-medium">
                          <span className="font-black text-rose-400 block mb-0.5">
                            ❌ You chose "{quiz.options[selectedOption].word || quiz.options[selectedOption].text}":
                          </span>
                          <span>{quiz.options[selectedOption].definition}</span>
                        </div>
                      )}

                      {/* Correct Option Explanation */}
                      <div className="bg-slate-900/90 p-2.5 rounded-xl border border-emerald-700/60 text-xs text-emerald-200 font-medium">
                        <span className="font-black text-emerald-400 block mb-0.5">
                          ✅ "{quiz.correctWord}" fits correctly because:
                        </span>
                        <span>{quiz.correctDefinition}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pinned Modal Footer Actions */}
        <div className="shrink-0 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 z-20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-black text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            ← Back to Dictionary
          </button>

          {onOpenAIBard && (
            <button
              id="modal-generate-story-btn"
              onClick={() => {
                const w = word;
                onClose();
                onOpenAIBard(w);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-amber-400"
            >
              <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Create Scottish Tale with Hamish AI</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
