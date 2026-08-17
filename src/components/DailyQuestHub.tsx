import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Flame, Sparkles, CheckCircle2, Award, Calendar, Volume2, 
  HelpCircle, ArrowRight, Star, ShieldCheck, Trophy, Target 
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

  // Generate 4 options for Word of the Day definition test
  const quizOptions = useMemo(() => {
    const correctDef = wordOfTheDay.definition;
    const distractors = entries
      .filter(e => e.id !== wordOfTheDay.id)
      .slice(0, 3)
      .map(e => e.definition);
    return [correctDef, ...distractors].sort(() => 0.5 - Math.random());
  }, [wordOfTheDay, entries]);

  const handleAnswerQuiz = (chosenDef: string) => {
    if (quizAnswered) return;
    setSelectedOption(chosenDef);
    setQuizAnswered(true);

    if (chosenDef === wordOfTheDay.definition) {
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
    <div className="space-y-6">
      
      {/* Daily Banner */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-orange-900/10 relative overflow-hidden border border-orange-400/30">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-100">
            <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
            Daily Word Quest & Streak Challenge
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Today’s Scottish Word Quest
          </h1>
          <p className="text-sm sm:text-base text-amber-100 leading-relaxed font-normal">
            Keep your <strong className="text-white font-black underline decoration-amber-300 underline-offset-4">{userProgress.streak}-day streak</strong> blazing! Master today's Scottish term, complete 3 daily quests, and unlock authentic Tartan Badges.
          </p>
        </div>
      </div>

      {/* Word of the Day Spotlight Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200/60 text-amber-700">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 block">
                Word of the Day • {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                  {wordOfTheDay.word}
                </h2>
                {wordOfTheDay.isScots && (
                  <span className="px-2.5 py-0.5 text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md">
                    🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots Regional
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="wotd-pronounce-btn"
              onClick={() => {
                playSound('click');
                speakWord(wordOfTheDay.word, { rate: 0.85 });
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100/80 font-bold text-xs transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              <span>Pronounce</span>
            </button>

            <button
              id="wotd-star-btn"
              onClick={() => {
                onToggleStar(wordOfTheDay.id);
                playSound('pop');
              }}
              className={`p-2 rounded-xl transition-all ${
                isStarred 
                  ? 'bg-amber-100/80 text-amber-600' 
                  : 'bg-slate-100/80 text-slate-400 hover:bg-amber-50 hover:text-amber-600'
              }`}
            >
              <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
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
                <span className="text-indigo-600 mr-2">({wordOfTheDay.phoneticGuide})</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-bold">{wordOfTheDay.partOfSpeech}</span>
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Definition
              </span>
              <p className="text-base text-slate-900 font-bold leading-relaxed">
                {wordOfTheDay.definition}
              </p>
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

          {/* 2 Context Examples */}
          <div className="bg-amber-50/60 rounded-2xl p-4 border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 block">
                Examples in Action:
              </span>
              <span className="text-[10px] text-amber-700 font-bold">🔊 Tap to listen</span>
            </div>
            {wordOfTheDay.examples.map((ex, idx) => (
              <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200/60 text-xs sm:text-sm text-slate-800 italic shadow-2xs flex items-start gap-2.5">
                <button
                  id={`wotd-read-ex-${idx}`}
                  onClick={() => {
                    playSound('click');
                    speakSentence(ex, { rate: 0.88 });
                  }}
                  title="Listen to this example"
                  className="p-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors shrink-0 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex-1 pt-0.5">
                  <span className="font-bold text-amber-600 not-italic mr-1.5">#{idx + 1}</span>
                  "{ex}"
                </div>
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
            Which definition accurately describes <strong className="text-blue-600">"{wordOfTheDay.word}"</strong>?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quizOptions.map((opt, idx) => {
              const isSelected = selectedOption === opt;
              const isCorrect = opt === wordOfTheDay.definition;

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
                  className={`p-3 rounded-xl text-xs sm:text-sm text-left transition-all font-medium ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Daily Quests List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Today's Daily Quests</h3>
            <p className="text-xs text-slate-500">Complete quests daily to boost your Tartan Scholar rank!</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-200">
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
