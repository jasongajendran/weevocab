import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Flame, Sparkles, CheckCircle2, Award, Calendar, Volume2, 
  HelpCircle, ArrowRight, Star, ShieldCheck, Trophy, Target, AlertCircle 
} from 'lucide-react';
import { DictionaryEntry, UserProgress } from '../types/dictionary';
import { BADGES } from '../data/dictionaryData';
import { speakWord, speakSentence } from '../utils/speech';
import { playSound } from '../utils/soundEffects';

interface DailyQuestHubProps {
  entries: DictionaryEntry[];
  userProgress: UserProgress;
  onClaimDailyReward: (expGained: number, questId: string) => void;
  onToggleStar: (wordId: string) => void;
}

export const DailyQuestHub: React.FC<DailyQuestHubProps> = ({
  entries,
  userProgress,
  onClaimDailyReward,
  onToggleStar,
}) => {
  // Deterministic Word of the day based on day of the year
  const wordOfTheDay = useMemo(() => {
    const now = new Date();
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const index = Math.abs(dayOfYear) % entries.length;
    return entries[index] || entries[0];
  }, [entries]);

  const [quizAnswered, setQuizAnswered] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(false);

  interface DailyQuizOption {
    word: string;
    definition: string;
    isCorrect: boolean;
  }

  // Generate 4 options for Word of the Day definition test
  const quizOptions = useMemo<DailyQuizOption[]>(() => {
    const correctOpt: DailyQuizOption = {
      word: wordOfTheDay.word,
      definition: wordOfTheDay.definition,
      isCorrect: true,
    };
    const distractors: DailyQuizOption[] = entries
      .filter(e => e.id !== wordOfTheDay.id)
      .slice(0, 3)
      .map(e => ({
        word: e.word,
        definition: e.definition,
        isCorrect: false,
      }));
    return [correctOpt, ...distractors].sort(() => 0.5 - Math.random());
  }, [wordOfTheDay, entries]);

  const handleAnswerQuiz = (option: DailyQuizOption) => {
    if (quizAnswered) return;
    setSelectedOption(option.definition);
    setQuizAnswered(true);

    if (option.isCorrect) {
      setQuizCorrect(true);
      playSound('celebrate');
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
      onClaimDailyReward(30, 'daily-wotd-quiz');
    } else {
      setQuizCorrect(false);
      playSound('wrong');
    }
  };

  const isStarred = userProgress.starredWordIds.includes(wordOfTheDay.id);

  // 3 Daily Quests definition
  const dailyQuests = [
    {
      id: 'daily-wotd-quiz',
      title: 'Conquer Word of the Day Quiz',
      desc: 'Test your understanding of today’s featured Scottish term',
      exp: 30,
      completed: userProgress.completedDailyQuests.includes('daily-wotd-quiz') || (quizAnswered && quizCorrect)
    },
    {
      id: 'daily-vault-star',
      title: 'Expand Your Vault',
      desc: 'Bookmark at least 2 words to your personal Word Vault',
      exp: 25,
      completed: userProgress.starredWordIds.length >= 2
    },
    {
      id: 'daily-game-challenge',
      title: 'Highland Arcade Champion',
      desc: 'Achieve a score in any interactive vocabulary game today',
      exp: 35,
      completed: Object.values(userProgress.gameHighScores).some((s: number) => s > 0)
    }
  ];

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      
      {/* Daily Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-orange-950/15 relative overflow-hidden border-2 border-white/20">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-gradient-to-br from-yellow-300/30 to-rose-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-3 opacity-15 text-8xl font-black select-none pointer-events-none">
          🔥
        </div>

        <div className="relative z-10 max-w-2xl space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-black text-amber-100 shadow-2xs">
            <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
            <span>Daily Word Quest & Streak Challenge</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
            Today’s Scottish Word Quest
          </h1>
          <p className="text-sm sm:text-base text-amber-100 leading-relaxed font-medium">
            Keep your <strong className="text-white font-black underline decoration-amber-300 underline-offset-4">{userProgress.streak}-day streak</strong> blazing! Master today's Scottish term, complete 3 daily quests, and unlock authentic Tartan Badges.
          </p>
        </div>
      </div>

      {/* Word of the Day Spotlight Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/25 border-2 border-white/40">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 block">
                Word of the Day • {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {wordOfTheDay.word}
                </h2>

                {wordOfTheDay.isScots && (
                  <span className="px-3 py-0.5 text-xs font-black bg-gradient-to-r from-purple-600 to-emerald-600 text-white rounded-lg shadow-2xs">
                    🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots Regional
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sound button placed on the right */}
            <button
              id="wotd-sound-btn"
              onClick={() => {
                playSound('click');
                speakWord(wordOfTheDay.word, { rate: 0.85 });
              }}
              title={`Listen to pronunciation of "${wordOfTheDay.word}"`}
              aria-label={`Listen to ${wordOfTheDay.word}`}
              className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-100 to-orange-100 text-amber-900 hover:from-amber-500 hover:to-orange-500 hover:text-white border border-amber-300 shadow-2xs transition-all hover:scale-108 active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-5 h-5" />
            </button>

            <button
              id="wotd-star-btn"
              onClick={() => {
                onToggleStar(wordOfTheDay.id);
                playSound('pop');
              }}
              className={`p-2.5 rounded-2xl transition-all cursor-pointer ${
                isStarred 
                  ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 shadow-md border border-amber-300 ring-2 ring-amber-300/40 scale-105' 
                  : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600 border border-slate-200'
              }`}
            >
              <Star className={`w-5 h-5 ${isStarred ? 'fill-amber-950 text-amber-950' : ''}`} />
            </button>
          </div>
        </div>

        {/* Phonetic & Meaning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Phonetic & Part of Speech
              </span>
              <p className="text-sm font-semibold text-slate-700">
                <span className="font-mono text-slate-900 font-bold mr-2">{wordOfTheDay.phonetic}</span>
                <span className="text-purple-700 mr-2 font-bold">({wordOfTheDay.phoneticGuide})</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-bold">{wordOfTheDay.partOfSpeech}</span>
              </p>
            </div>

            {/* Definition with sound icon right next to definition */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/70 flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Definition
                </span>
                <p className="text-sm sm:text-base text-slate-900 font-bold leading-relaxed">
                  {wordOfTheDay.definition}
                </p>
              </div>
              <button
                id="wotd-def-sound-btn"
                onClick={() => {
                  playSound('click');
                  speakSentence(wordOfTheDay.definition, { rate: 0.9 });
                }}
                title="Listen to definition"
                aria-label={`Read definition: ${wordOfTheDay.definition}`}
                className="p-1.5 rounded-lg bg-white text-amber-800 hover:bg-amber-50 border border-amber-200 shadow-2xs shrink-0 cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Synonyms & Antonyms */}
            <div className="space-y-1 text-xs">
              <div>
                <strong className="text-emerald-700">Synonyms: </strong>
                <span className="text-slate-700 font-medium">{wordOfTheDay.synonyms.join(', ')}</span>
              </div>
              <div>
                <strong className="text-rose-700">Antonyms: </strong>
                <span className="text-slate-700 font-medium">{wordOfTheDay.antonyms.join(', ') || 'None'}</span>
              </div>
            </div>
          </div>

          {/* 2 Context Examples with Sound Button to the Right */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 block">
                Examples in Action:
              </span>
            </div>
            {wordOfTheDay.examples.map((ex, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200/60 text-xs sm:text-sm text-slate-800 italic shadow-2xs flex items-start justify-between gap-2.5">
                <div className="flex-1 pt-0.5">
                  <span className="font-bold text-amber-600 not-italic mr-1.5">#{idx + 1}</span>
                  "{ex}"
                </div>
                <button
                  id={`wotd-read-ex-${idx}`}
                  onClick={() => {
                    playSound('click');
                    speakSentence(ex, { rate: 0.88 });
                  }}
                  title="Listen to this example"
                  aria-label={`Listen to example ${idx + 1}`}
                  className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Word of the Day Quick Challenge / Quiz */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-500" />
              Daily Mastery Check (+30 EXP):
            </span>
            {quizAnswered && quizCorrect && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                ✓ Quest Completed!
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-800">
            Which definition accurately describes <strong className="text-purple-700 font-black">"{wordOfTheDay.word}"</strong>?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quizOptions.map((opt, idx) => {
              const isSelected = selectedOption === opt.definition;
              const isCorrect = opt.isCorrect;

              let btnClass = 'bg-white border-2 border-slate-200 text-slate-800 hover:border-amber-400';
              if (quizAnswered) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-600 border-emerald-700 text-white font-bold shadow-xs';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'bg-rose-500 border-rose-600 text-white font-bold';
                } else {
                  btnClass = 'bg-slate-50 border-slate-200 text-slate-400 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  id={`wotd-quiz-opt-${idx}`}
                  disabled={quizAnswered}
                  onClick={() => handleAnswerQuiz(opt)}
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm text-left transition-all font-medium flex flex-col gap-1 cursor-pointer ${btnClass}`}
                >
                  <span className="leading-snug">{opt.definition}</span>
                  {quizAnswered && (
                    <span className={`text-[11px] pt-1 mt-0.5 border-t ${
                      isCorrect ? 'border-white/30 text-emerald-100 font-bold' : isSelected ? 'border-white/30 text-rose-100 font-bold' : 'border-slate-200 text-slate-500'
                    }`}>
                      {isCorrect ? `✓ Meaning of "${wordOfTheDay.word}"` : `Belongs to: "${opt.word}"`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Feedback banner */}
          {quizAnswered && !quizCorrect && selectedOption && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1 animate-fadeIn">
              <div className="font-bold text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Wrong choice review:</span>
              </div>
              {(() => {
                const selectedOpt = quizOptions.find(o => o.definition === selectedOption);
                return selectedOpt ? (
                  <p className="leading-snug">
                    You selected the definition for <strong className="text-rose-900">"{selectedOpt.word}"</strong> ({selectedOpt.definition}).
                  </p>
                ) : null;
              })()}
              <p className="text-emerald-900 font-medium leading-snug pt-1 border-t border-rose-200/60">
                <strong>"{wordOfTheDay.word}"</strong> actually means: {wordOfTheDay.definition}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Quests List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Today's Daily Quests</h3>
            <p className="text-xs text-slate-500">Complete quests daily to boost your Tartan Scholar rank!</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-purple-50 text-purple-900 rounded-full border border-purple-200">
            {dailyQuests.filter(q => q.completed).length} / 3 Complete
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dailyQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border transition-all ${
                quest.completed
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-bold text-sm leading-snug">{quest.title}</span>
                {quest.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <span className="text-xs font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                    +{quest.exp} XP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{quest.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tartan Trophy & Badge Cabinet */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl font-bold text-slate-900">Tartan Trophy & Badge Cabinet</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {userProgress.unlockedBadges.length} of {BADGES.length} Badges Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {BADGES.map((badge) => {
            const isUnlocked = userProgress.unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                id={`badge-card-${badge.id}`}
                className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
                  isUnlocked
                    ? 'bg-gradient-to-tr from-amber-50 to-orange-50 border-amber-300 shadow-xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="text-3xl p-2 bg-white rounded-2xl shadow-2xs shrink-0">
                  {badge.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-900">{badge.title}</h4>
                    {isUnlocked && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-600 leading-snug mt-1">{badge.description}</p>
                  <span className="inline-block mt-2 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {isUnlocked ? '🏆 Unlocked' : '🔒 In Progress'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
