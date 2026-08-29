import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, Volume2, Mic, Star, Sparkles, CheckCircle2, AlertCircle, 
  Award, MessageSquare, Compass, HelpCircle, Zap, Check, RotateCcw, 
  Layers, ChevronRight, ShieldCheck, Flame, Lightbulb
} from 'lucide-react';
import { DictionaryEntry } from '../types/dictionary';
import { startVoicePractice, RecognitionResult } from '../utils/speech';
import { playSound } from '../utils/soundEffects';

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
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
        tone: 'Essays, presentations, debate, and formal writing',
        advice: 'Use this term in high-level coursework, analytical essays, and formal discussions to convey precision.',
      };
    }
    if (word.category === 'UK Common & Slang' || word.category === 'School & Banter') {
      return {
        level: 'Casual & Conversational',
        dots: 2,
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
        tone: 'Playground banter, daily texts, casual chat with friends',
        advice: 'Common in relaxed spoken conversation and banter. Keep for informal settings rather than exam essays.',
      };
    }
    if (word.isScots) {
      return {
        level: 'Dialect & Cultural Expressive',
        dots: 3,
        badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
        tone: 'Scottish storytelling, regional conversation, local heritage',
        advice: 'Deeply expressive in Scottish storytelling, literature, poetry, and regional dialogue.',
      };
    }
    return {
      level: 'Everyday Standard UK',
      dots: 3,
      badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
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
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 relative my-6 text-left max-h-[92vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          id="close-modal-btn"
          onClick={onClose}
          aria-label="Close Study Guide"
          className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header & Quick Audio */}
        <div className="border-b border-slate-100 pb-4">
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {word.word}
                </h2>

                <span className={`px-2.5 py-0.5 text-xs font-black rounded-lg border ${formalityDetails.badgeBg}`}>
                  {word.category}
                </span>

                {word.isScots && (
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                    🏴󠁧󠁢󠁳󠁣󠁴󠁿 {word.scotsRegion}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 mt-2 text-sm text-slate-600 flex-wrap">
                <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                  {word.partOfSpeech}
                </span>
                <span className="font-mono text-slate-500 font-bold text-xs">{word.phonetic}</span>
                <span className="text-purple-700 font-extrabold text-xs">
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
                    ? 'bg-gradient-to-tr from-purple-600 via-emerald-600 to-amber-500 text-white scale-110 ring-4 ring-purple-300 animate-pulse shadow-lg'
                    : 'bg-gradient-to-tr from-purple-50 to-emerald-50 text-purple-900 hover:from-purple-600 hover:to-indigo-600 hover:text-white hover:scale-108 border border-purple-200 shadow-2xs active:scale-95'
                }`}
              >
                <Volume2 className={`w-5 h-5 ${playingAudioId === 'modal-title-word' ? 'animate-bounce' : ''}`} />
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
                    ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 shadow-md border border-amber-300 ring-2 ring-amber-300/40 scale-105'
                    : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-slate-200'
                }`}
              >
                <Star className={`w-5 h-5 ${isStarred ? 'fill-amber-950 text-amber-950' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Section 1: Pronunciation Studio & Voice Test Lab */}
        <div className="bg-gradient-to-br from-purple-50/70 via-slate-50 to-emerald-50/60 rounded-3xl p-4 sm:p-5 border-2 border-purple-200 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
              <div className="p-1 rounded-lg bg-purple-700 text-white">
                <Volume2 className="w-3.5 h-3.5" />
              </div>
              Pronunciation Studio & Voice Practice
            </span>

            {/* Speeds */}
            <div className="flex items-center gap-2">
              <button
                id="modal-pronounce-normal"
                onClick={() => onPlayAudio(word.word, 'modal-word-norm', 0.9)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-md shadow-purple-500/25 transition-all hover:scale-105 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Normal Speed</span>
              </button>
              <button
                id="modal-pronounce-slow"
                onClick={() => onPlayAudio(word.word, 'modal-word-slow', 0.6)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-purple-900 border-2 border-purple-200 hover:bg-purple-50 font-black text-xs transition-all hover:scale-105 shadow-2xs cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                <span>0.6x Slow Coach</span>
              </button>
            </div>
          </div>

          {/* Interactive Voice Mic */}
          <div className="bg-white rounded-2xl p-4 border border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="text-left w-full sm:w-auto">
              <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-purple-700" />
                Test your pronunciation with your microphone:
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Tap the button and clearly say <span className="font-black text-purple-800">"{word.word}"</span>
              </p>
            </div>

            <button
              id="voice-practice-mic-btn"
              onClick={() => handleStartVoice(word.word)}
              disabled={isRecording}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg'
                  : 'bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 text-white shadow-md shadow-purple-500/25 hover:scale-105 active:scale-95'
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
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              {voiceResult.isMatch ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-black">Brilliant pronunciation!</span> You spoke "{voiceResult.transcript}", which matched perfectly!
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-black">Good attempt!</span> We detected "{voiceResult.transcript}". Try listening to the 0.6x Slow Coach to nail the vowels!
                  </div>
                </>
              )}
            </div>
          )}

          {voiceError && (
            <p className="text-xs text-rose-600 font-medium">⚠️ {voiceError}</p>
          )}
        </div>

        {/* Section 2: Etymology & Cultural Heritage Story (Exclusive non-duplicate content) */}
        {word.loreOrFunFact && (
          <div className="bg-amber-50/90 rounded-2xl p-4 sm:p-5 border border-amber-300 text-amber-950 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Origin, Etymology & Cultural Heritage
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-200/80 rounded-md text-amber-900">
                Word History
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-amber-900 font-medium">
              {word.loreOrFunFact}
            </p>
          </div>
        )}

        {/* Section 3: Formality Meter & Conversational Register */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-slate-500" />
              Usage Register & Formality Meter
            </span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
              {formalityDetails.level}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-700 block flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Where to Use:
              </span>
              <p className="text-slate-600 leading-snug">{formalityDetails.tone}</p>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="font-black text-slate-700 block flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Pro-Tip for Learners:
              </span>
              <p className="text-slate-600 leading-snug">{formalityDetails.advice}</p>
            </div>
          </div>

          {/* Natural Phrasal Collocations */}
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
              Natural Word Pairings & Collocations:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {collocations.map((phrase, idx) => (
                <span 
                  key={idx} 
                  className="px-2.5 py-1 bg-white text-slate-700 border border-slate-200/90 rounded-lg text-xs font-bold shadow-2xs hover:border-blue-300 transition-colors"
                >
                  "{phrase}"
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Interactive Quick Mastery Challenge (Active Recall) */}
        <div className="bg-emerald-50/70 rounded-2xl p-4 sm:p-5 border border-emerald-200 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Quick Mastery Challenge (Active Recall)
              </span>
            </div>
            {quizAnswered && (
              <button
                onClick={handleResetQuiz}
                title="Try another attempt"
                className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm font-bold text-slate-800">
            {quiz.question}
          </p>

          {/* Multiple Choice Options */}
          <div className="space-y-2.5">
            {quiz.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = option.isCorrect;
              
              let btnStyle = 'bg-white border-2 border-emerald-200/90 text-slate-800 hover:bg-emerald-50/80 hover:border-emerald-400 hover:shadow-xs';
              if (quizAnswered) {
                if (isCorrect) {
                  btnStyle = 'bg-emerald-600 text-white border-emerald-600 font-black shadow-md ring-2 ring-emerald-300';
                } else if (isSelected && !isCorrect) {
                  btnStyle = 'bg-rose-500 text-white border-rose-500 font-bold shadow-sm ring-2 ring-rose-300';
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
                        <Check className="w-3.5 h-3.5 text-white" />
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
                        ? 'border-white/30 text-emerald-50 font-medium' 
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
            <div className={`p-4 rounded-2xl border-2 animate-fadeIn space-y-2.5 ${
              quizScore 
                ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-300 text-emerald-950 shadow-xs' 
                : 'bg-gradient-to-br from-rose-50 to-orange-50 border-rose-300 text-rose-950 shadow-xs'
            }`}>
              {quizScore ? (
                <div className="flex items-start gap-2.5">
                  <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-xs sm:text-sm text-emerald-900">
                      Spot on! You've mastered "{word.word}"!
                    </p>
                    <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                      "{word.word}" fits correctly because it means: {word.definition}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <p className="font-black text-xs sm:text-sm text-rose-900">
                      Not quite, but let's review both words:
                    </p>
                    
                    {/* Chosen Wrong Option Explanation */}
                    {selectedOption !== null && quiz.options[selectedOption] && !quiz.options[selectedOption].isCorrect && (
                      <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200 text-xs text-rose-950 font-medium">
                        <span className="font-black text-rose-700 block mb-0.5">
                          ❌ You chose "{quiz.options[selectedOption].word || quiz.options[selectedOption].text}":
                        </span>
                        <span>{quiz.options[selectedOption].definition}</span>
                      </div>
                    )}

                    {/* Correct Option Explanation */}
                    <div className="bg-emerald-50/90 p-2.5 rounded-xl border border-emerald-200 text-xs text-emerald-950 font-medium">
                      <span className="font-black text-emerald-800 block mb-0.5">
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
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
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
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
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
