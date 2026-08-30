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
        badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
        tone: 'Essays, presentations, debate, and formal writing',
        advice: 'Use this term in high-level coursework, analytical essays, and formal discussions to convey precision.',
      };
    }
    if (word.category === 'UK Common & Slang' || word.category === 'School & Banter') {
      return {
        level: 'Casual & Conversational',
        dots: 2,
        badgeBg: 'bg-amber-100 text-amber-950 border-amber-300',
        tone: 'Playground banter, daily texts, casual chat with friends',
        advice: 'Common in relaxed spoken conversation and banter. Keep for informal settings rather than exam essays.',
      };
    }
    if (word.isScots) {
      return {
        level: 'Dialect & Cultural Expressive',
        dots: 3,
        badgeBg: 'bg-teal-100 text-teal-950 border-teal-300',
        tone: 'Scottish storytelling, regional conversation, local heritage',
        advice: 'Deeply expressive in Scottish storytelling, literature, poetry, and regional dialogue.',
      };
    }
    return {
      level: 'Everyday Standard UK',
      dots: 3,
      badgeBg: 'bg-lime-100 text-lime-950 border-lime-300',
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

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-emerald-900/15 relative my-6 text-left max-h-[92vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-modal-btn"
          onClick={onClose}
          aria-label="Close Study Guide"
          className="absolute right-4 top-4 p-2 rounded-full text-[#4b6354] hover:text-[#14281f] hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Quick Audio */}
        <div className="border-b border-emerald-900/10 pb-4">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-4xl font-black text-[#14281f] tracking-tight">
                  {word.word}
                </h2>

                <span className={`px-2.5 py-0.5 text-xs font-black rounded-lg border ${formalityDetails.badgeBg}`}>
                  {word.category}
                </span>

                {word.isScots && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200">
                    🏴󠁧󠁢󠁳󠁣󠁴󠁿 {word.scotsRegion}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-2 text-sm text-[#4b6354] flex-wrap">
                <span className="font-extrabold text-[#14281f] bg-emerald-50 px-2 py-0.5 rounded-md text-xs border border-emerald-200">
                  {word.partOfSpeech}
                </span>
                <span className="font-mono text-[#4b6354] font-bold text-xs">{word.phonetic}</span>
                <span className="text-emerald-800 font-extrabold text-xs">
                  📖 {word.phoneticGuide}
                </span>
              </div>
            </div>

            {/* Top Right Action Icons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="modal-word-title-sound-btn"
                onClick={() => onPlayAudio(word.word, 'modal-title-word', 0.9)}
                title={`Listen to pronunciation of "${word.word}"`}
                aria-label={`Listen to pronunciation of ${word.word}`}
                className={`p-3 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
                  playingAudioId === 'modal-title-word'
                    ? 'bg-gradient-to-tr from-emerald-800 via-teal-800 to-amber-500 text-amber-100 scale-110 ring-4 ring-emerald-300 shadow-lg'
                    : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-800 hover:text-amber-100 hover:scale-108 border border-emerald-200 shadow-2xs active:scale-95'
                }`}
              >
                <SoundWaveIcon isPlaying={playingAudioId === 'modal-title-word'} size="lg" />
              </button>

              <button
                id="modal-star-btn"
                onClick={() => {
                  onToggleStar();
                  playSound('pop');
                }}
                title={isStarred ? 'Remove from Vault' : 'Save to Vault'}
                className={`p-3 rounded-2xl transition-all cursor-pointer ${
                  isStarred
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md border border-amber-300 ring-2 ring-amber-300/40 scale-105'
                    : 'bg-emerald-50/70 text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-emerald-900/10'
                }`}
              >
                <Star className={`w-5 h-5 ${isStarred ? 'fill-slate-950 text-slate-950' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section: Meaning & Primary Definition */}
        <div className="bg-gradient-to-br from-emerald-50/80 to-amber-50/50 rounded-2xl p-4 sm:p-5 border-2 border-emerald-800/20 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-black text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-800" />
              Definition & Meaning
            </span>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-800 text-amber-100 shadow-2xs">
              {word.difficulty}
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-[#14281f] leading-relaxed">
            {word.definition}
          </p>
        </div>

        {/* Section: Example Sentences in Action with Voice Audio */}
        {word.examples && word.examples.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-emerald-900/15 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Quote className="w-4 h-4 text-emerald-800" />
                Contextual Example Sentences ({word.examples.length})
              </span>
              <span className="text-[10px] font-bold text-[#4b6354]">
                Tap speaker icon to listen
              </span>
            </div>

            <div className="space-y-2.5">
              {word.examples.map((example, idx) => {
                const audioKey = `modal-example-${word.id}-${idx}`;
                const isPlaying = playingAudioId === audioKey;
                return (
                  <div 
                    key={idx}
                    className="flex items-start justify-between gap-3 p-3.5 rounded-xl bg-emerald-50/40 border-l-4 border-l-emerald-700 border-y border-r border-emerald-900/10 text-xs sm:text-sm font-medium text-[#14281f] hover:bg-emerald-50/80 transition-colors"
                  >
                    <div className="space-y-1 flex-1">
                      <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider block">
                        Example {idx + 1}
                      </span>
                      <p className="italic leading-relaxed">
                        "{example}"
                      </p>
                    </div>

                    <button
                      id={`modal-listen-ex-${idx}`}
                      onClick={() => onPlayAudio(example, audioKey, 0.9)}
                      title="Listen to this example sentence"
                      aria-label={`Listen to example ${idx + 1}`}
                      className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                        isPlaying
                          ? 'bg-emerald-800 text-amber-100 scale-110 shadow-md ring-2 ring-emerald-400'
                          : 'bg-white text-emerald-900 hover:bg-emerald-800 hover:text-amber-100 border border-emerald-200 shadow-2xs'
                      }`}
                    >
                      <SoundWaveIcon isPlaying={isPlaying} size="sm" />
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
              <div className="bg-emerald-50/30 p-3.5 rounded-2xl border border-emerald-900/10 space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-emerald-700" /> Synonyms / Similar Terms:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {word.synonyms.map((syn, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white text-xs font-bold text-emerald-950 border border-emerald-200/80 shadow-2xs"
                    >
                      {syn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {word.antonyms && word.antonyms.length > 0 && (
              <div className="bg-amber-50/30 p-3.5 rounded-2xl border border-amber-900/10 space-y-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-amber-700" /> Antonyms / Opposites:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {word.antonyms.map((ant, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-white text-xs font-bold text-amber-950 border border-amber-200/80 shadow-2xs"
                    >
                      {ant}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section 1: Pronunciation Studio & Voice Test Lab */}
        <div className="bg-emerald-50/30 rounded-3xl p-4 sm:p-5 border border-emerald-900/15 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <div className="p-1 rounded-lg bg-emerald-800 text-amber-100">
                <Volume2 className="w-3.5 h-3.5" />
              </div>
              Pronunciation Studio & Voice Practice
            </span>

            {/* Speeds */}
            <div className="flex items-center gap-2">
              <button
                id="modal-pronounce-normal"
                onClick={() => onPlayAudio(word.word, 'modal-word-norm', 0.9)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-100 font-black text-xs shadow-md transition-all hover:scale-105 cursor-pointer border border-emerald-700"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Normal Speed</span>
              </button>
              <button
                id="modal-pronounce-slow"
                onClick={() => onPlayAudio(word.word, 'modal-word-slow', 0.6)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50 font-black text-xs transition-all hover:scale-105 shadow-2xs cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>0.6x Slow Coach</span>
              </button>
            </div>
          </div>

          {/* Interactive Voice Mic */}
          <div className="bg-white rounded-2xl p-4 border border-emerald-900/10 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="text-left w-full sm:w-auto">
              <p className="text-xs font-black text-[#14281f] flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-emerald-700" />
                Test your pronunciation with your microphone:
              </p>
              <p className="text-[11px] text-[#4b6354] font-medium mt-0.5">
                Tap the button and clearly say <span className="font-black text-emerald-900">"{word.word}"</span>
              </p>
            </div>

            <button
              id="voice-practice-mic-btn"
              onClick={() => handleStartVoice(word.word)}
              disabled={isRecording}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse shadow-lg'
                  : 'bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-amber-100 shadow-md hover:scale-105 active:scale-95 border border-emerald-700'
              }`}
            >
              {isRecording ? <Mic className="w-4 h-4 animate-bounce" /> : <Mic className="w-4 h-4" />}
              <span>{isRecording ? 'Listening now...' : 'Start Voice Test'}</span>
            </button>
          </div>

          {/* Voice Result Feedback */}
          {voiceResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              voiceResult.isMatch 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}>
              {voiceResult.isMatch ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <span className="font-black">Brilliant pronunciation!</span> You spoke "{voiceResult.transcript}", which matched perfectly!
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-black">Good attempt!</span> We detected "{voiceResult.transcript}". Try listening to the 0.6x Slow Coach to nail the vowels!
                  </div>
                </>
              )}
            </div>
          )}

          {voiceError && (
            <p className="text-xs text-rose-700 font-medium">⚠️ {voiceError}</p>
          )}
        </div>

        {/* Section 2: Etymology & Cultural Heritage Story (Exclusive non-duplicate content) */}
        {word.loreOrFunFact && (
          <div className="bg-amber-50/70 rounded-2xl p-4 sm:p-5 border border-amber-300/80 text-amber-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                Origin, Etymology & Cultural Heritage
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200/70 rounded-md text-amber-900 border border-amber-300">
                Word History
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-amber-950 font-medium">
              {word.loreOrFunFact}
            </p>
          </div>
        )}

        {/* Section 3: Formality Meter & Conversational Register */}
        <div className="bg-emerald-50/20 rounded-2xl p-4 sm:p-5 border border-emerald-900/15 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#4b6354] flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-700" />
              Usage Register & Formality Meter
            </span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-200">
              {formalityDetails.level}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-emerald-900/10 space-y-1">
              <span className="font-black text-[#14281f] block flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" /> Where to Use:
              </span>
              <p className="text-[#4b6354] leading-snug">{formalityDetails.tone}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-emerald-900/10 space-y-1">
              <span className="font-black text-[#14281f] block flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-600" /> Pro-Tip for Learners:
              </span>
              <p className="text-[#4b6354] leading-snug">{formalityDetails.advice}</p>
            </div>
          </div>

          {/* Natural Phrasal Collocations */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-[#4b6354] block mb-1.5">
              Natural Word Pairings & Collocations:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {collocations.map((phrase, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 bg-white text-[#14281f] border border-emerald-900/15 rounded-lg text-xs font-bold shadow-2xs hover:border-emerald-400 transition-colors"
                >
                  "{phrase}"
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Interactive Quick Mastery Challenge (Active Recall) */}
        <div className="bg-emerald-50/40 rounded-2xl p-4 sm:p-5 border border-emerald-900/15 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                Quick Mastery Challenge (Active Recall)
              </span>
            </div>
            {quizAnswered && (
              <button
                onClick={handleResetQuiz}
                title="Try another attempt"
                className="flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm font-bold text-[#14281f]">
            {quiz.question}
          </p>

          {/* Multiple Choice Options */}
          <div className="space-y-2.5">
            {quiz.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = option.isCorrect;
              
              let btnStyle = 'bg-white border border-emerald-900/15 text-[#14281f] hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-xs';
              if (quizAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-800 text-amber-100 border-emerald-700 font-black shadow-md ring-2 ring-emerald-400';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-700 text-white border-rose-700 font-bold shadow-sm ring-2 ring-rose-300';
                } else {
                  btnStyle = 'bg-slate-50 text-slate-400 border-slate-200 opacity-60';
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
                    <span className="font-black text-sm leading-snug">
                      {option.text}
                    </span>
                    {quizAnswered && isCorrect && (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md text-[11px] font-black shrink-0">
                        <Check className="w-3.5 h-3.5 text-amber-200" />
                        <span>Correct</span>
                      </div>
                    )}
                    {quizAnswered && isSelected && !isCorrect && (
                      <div className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md text-[11px] font-black shrink-0">
                        <X className="w-3.5 h-3.5 text-white" />
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
                        ? 'border-white/30 text-rose-50 font-medium' 
                        : 'border-slate-200 text-slate-500'
                    }`}>
                      {quiz.type === 'fill_blank' ? (
                        <p className="leading-snug">
                          <strong className="opacity-95">"{option.word}"</strong>: {option.definition}
                        </p>
                      ) : (
                        <p className="leading-snug">
                          <strong className="opacity-95">
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
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs' 
                : 'bg-rose-50 border-rose-300 text-rose-950 shadow-xs'
            }`}>
              {quizScore ? (
                <div className="flex items-start gap-2.5">
                  <Award className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-xs sm:text-sm text-emerald-950">
                      Spot on! You've mastered "{word.word}"!
                    </p>
                    <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                      "{word.word}" fits correctly because it means: {word.definition}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="font-black text-xs sm:text-sm text-rose-950">
                      Not quite, but let's review both words:
                    </p>
                    
                    {/* Chosen Wrong Option Explanation */}
                    {selectedOption !== null && quiz.options[selectedOption] && !quiz.options[selectedOption].isCorrect && (
                      <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200 text-xs text-rose-950 font-medium">
                        <span className="font-black text-rose-800 block mb-0.5">
                          ❌ You chose "{quiz.options[selectedOption].word || quiz.options[selectedOption].text}":
                        </span>
                        <span>{quiz.options[selectedOption].definition}</span>
                      </div>
                    )}

                    {/* Correct Option Explanation */}
                    <div className="bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-medium">
                      <span className="font-black text-emerald-900 block mb-0.5">
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

        {/* Modal Footer Actions */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/10">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-[#14281f] bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            Back to Dictionary
          </button>

          {onOpenAIBard && (
            <button
              id="modal-generate-story-btn"
              onClick={() => {
                const w = word;
                onClose();
                onOpenAIBard(w);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 text-amber-100 font-black text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer border border-emerald-700"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Create Scottish Tale with Hamish AI</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
