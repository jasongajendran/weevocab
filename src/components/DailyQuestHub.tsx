import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  Flame, Sparkles, CheckCircle2, Award, Calendar, Volume2, 
  HelpCircle, ArrowRight, Star, ShieldCheck, Trophy, Target, AlertCircle, Zap, BookOpen
} from 'lucide-react';
import { DictionaryEntry, UserProgress } from '../types/dictionary';
import { BADGES } from '../data/dictionaryData';
import { speakWord, speakSentence, cancelSpeech } from '../utils/speech';
import { playSound } from '../utils/soundEffects';
import { SoundWaveIcon } from './SoundWaveIcon';

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

  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handlePronounce = (text: string, id: string, rate: number = 0.9) => {
    if (playingAudioId === id) {
      cancelSpeech();
      setPlayingAudioId(null);
      return;
    }
    setPlayingAudioId(id);
    speakSentence(text, {
      rate,
      onEnd: () => setPlayingAudioId((prev) => (prev === id ? null : prev)),
    });
  };

  // 3 Daily Quests definition
  const dailyQuests = [
    {
      id: 'daily-wotd-quiz',
      title: '🎯 Daily Word Quiz',
      desc: 'Test your understanding of today’s featured Scottish term',
      exp: 30,
      badgeColor: 'from-amber-500 to-yellow-500',
      completed: userProgress.completedDailyQuests.includes('daily-wotd-quiz') || (quizAnswered && quizCorrect)
    },
    {
      id: 'daily-vault-star',
      title: '⭐ Expand Word Vault',
      desc: 'Bookmark at least 2 words to your personal study bank',
      exp: 25,
      badgeColor: 'from-emerald-600 to-teal-600',
      completed: userProgress.starredWordIds.length >= 2
    },
    {
      id: 'daily-game-challenge',
      title: '🎮 Arcade Champion',
      desc: 'Score in any interactive Highland mini-game today',
      exp: 35,
      badgeColor: 'from-sky-600 to-teal-600',
      completed: Object.values(userProgress.gameHighScores).some((s: number) => s > 0)
    }
  ];

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      
      {/* Daily Banner */}
      <div className="bg-gradient-to-br from-[#12281d] via-[#1b3d2b] to-[#14281f] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-gradient-to-br from-amber-400/20 via-emerald-400/20 to-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-3 opacity-15 text-8xl font-black select-none pointer-events-none">
          🌿
        </div>

        <div className="relative z-10 max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-emerald-400/30 text-xs font-black text-amber-200 shadow-2xs">
            <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
            <span>Daily Streak: {userProgress.streak} Days 🔥</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-amber-100">
            Daily Scottish Quest
          </h1>
          <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium">
            Master today's Scottish term, complete 3 daily quests, and level up your Tartan Scholar rank!
          </p>
        </div>
      </div>

      {/* Word of the Day Spotlight Card */}
      <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-lg shadow-emerald-950/40 border border-emerald-400/30">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                Word of the Day • {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                  {wordOfTheDay.word}
                </h2>

                {wordOfTheDay.isScots && (
                  <span className="px-2.5 py-0.5 text-xs font-black bg-gradient-to-r from-emerald-700 to-teal-700 text-amber-200 rounded-lg shadow-2xs border border-emerald-500/30">
                    🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sound button with SoundWaveIcon */}
            <button
              id="wotd-sound-btn"
              onClick={() => handlePronounce(wordOfTheDay.word, 'wotd-main', 0.85)}
              title={`Listen to pronunciation of "${wordOfTheDay.word}"`}
              aria-label={`Listen to ${wordOfTheDay.word}`}
              className={`p-2.5 sm:p-3 rounded-2xl border shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                playingAudioId === 'wotd-main'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                  : 'bg-slate-800 text-emerald-300 hover:bg-emerald-600 hover:text-white border-slate-700'
              }`}
            >
              <SoundWaveIcon isPlaying={playingAudioId === 'wotd-main'} size="sm" />
            </button>

            <button
              id="wotd-star-btn"
              onClick={() => {
                onToggleStar(wordOfTheDay.id);
                playSound('pop');
              }}
              className={`p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer ${
                isStarred 
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md border border-amber-300 ring-2 ring-amber-300/40 scale-105' 
                  : 'bg-slate-800 text-slate-400 hover:bg-amber-950/50 hover:text-amber-300 border border-slate-700'
              }`}
            >
              <Star className={`w-5 h-5 ${isStarred ? 'fill-slate-950 text-slate-950' : ''}`} />
            </button>
          </div>
        </div>

        {/* Phonetic & Meaning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-amber-300 font-bold text-sm bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-700/40">{wordOfTheDay.phonetic}</span>
              <span className="text-emerald-300 font-extrabold text-xs bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-700/60">🗣️ {wordOfTheDay.phoneticGuide}</span>
              <span className="bg-sky-950/60 text-sky-300 px-2 py-0.5 rounded-md text-xs font-black border border-sky-700/60">{wordOfTheDay.partOfSpeech}</span>
            </div>

            {/* Definition */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700 flex items-start justify-between gap-3 shadow-2xs">
              <div className="flex-1">
                <p className="text-sm sm:text-base text-slate-100 font-semibold leading-relaxed">
                  {wordOfTheDay.definition}
                </p>
              </div>
              <button
                id="wotd-def-sound-btn"
                onClick={() => handlePronounce(wordOfTheDay.definition, 'wotd-def', 0.9)}
                title="Listen to definition"
                aria-label={`Read definition: ${wordOfTheDay.definition}`}
                className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer shadow-2xs border ${
                  playingAudioId === 'wotd-def'
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-700 text-slate-200 hover:bg-emerald-600 hover:text-white border-slate-600'
                }`}
              >
                <SoundWaveIcon isPlaying={playingAudioId === 'wotd-def'} size="sm" />
              </button>
            </div>

            {/* Synonyms & Antonyms */}
            <div className="space-y-1.5 text-xs">
              {wordOfTheDay.synonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-emerald-400">✨ Synonyms:</span>
                  {wordOfTheDay.synonyms.map((s, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 rounded-md font-bold">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {wordOfTheDay.antonyms.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-amber-400">⚡ Antonyms:</span>
                  {wordOfTheDay.antonyms.map((a, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 bg-amber-950/70 text-amber-300 border border-amber-700/60 rounded-md font-bold">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Context Examples */}
          <div className="bg-slate-800/70 rounded-2xl p-4 border border-slate-700 space-y-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300 block">
              💬 In Context:
            </span>
            {wordOfTheDay.examples.map((ex, idx) => {
              const exId = `wotd-ex-${idx}`;
              return (
                <div key={idx} className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 text-xs sm:text-sm text-slate-200 italic shadow-2xs flex items-start justify-between gap-2.5">
                  <div className="flex-1 pt-0.5 font-medium">
                    "{ex}"
                  </div>
                  <button
                    id={`wotd-read-ex-${idx}`}
                    onClick={() => handlePronounce(ex, exId, 0.88)}
                    title="Listen to this example"
                    aria-label={`Listen to example ${idx + 1}`}
                    className={`p-2 rounded-xl border shadow-2xs transition-colors shrink-0 cursor-pointer ${
                      playingAudioId === exId
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                    }`}
                  >
                    <SoundWaveIcon isPlaying={playingAudioId === exId} size="sm" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Word of the Day Quick Challenge / Quiz */}
        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-400" />
              Daily Mastery Check (+30 EXP):
            </span>
            {quizAnswered && quizCorrect && (
              <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-600/60">
                ✓ Quest Completed!
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-200">
            Which definition accurately describes <strong className="text-emerald-400 font-black">"{wordOfTheDay.word}"</strong>?
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quizOptions.map((opt, idx) => {
              const isSelected = selectedOption === opt.definition;
              const isCorrect = opt.isCorrect;

              let btnClass = 'bg-slate-800/90 border border-slate-700 text-slate-200 hover:border-emerald-500 hover:bg-slate-800';
              if (quizAnswered) {
                if (isCorrect) {
                  btnClass = 'bg-emerald-800 border-emerald-500 text-white font-bold shadow-md';
                } else if (isSelected && !isCorrect) {
                  btnClass = 'bg-red-900/80 border-red-600 text-white font-bold';
                } else {
                  btnClass = 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-60';
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
                      isCorrect ? 'border-white/30 text-amber-300 font-bold' : isSelected ? 'border-white/30 text-amber-300 font-bold' : 'border-slate-700 text-slate-400'
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
            <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-700/60 text-xs text-amber-200 space-y-1 animate-fadeIn">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Wrong choice review:</span>
              </div>
              {(() => {
                const selectedOpt = quizOptions.find(o => o.definition === selectedOption);
                return selectedOpt ? (
                  <p className="leading-snug text-slate-300">
                    You selected the definition for <strong className="text-amber-300">"{selectedOpt.word}"</strong> ({selectedOpt.definition}).
                  </p>
                ) : null;
              })()}
              <p className="text-emerald-300 font-medium leading-snug pt-1 border-t border-amber-700/60">
                <strong>"{wordOfTheDay.word}"</strong> actually means: {wordOfTheDay.definition}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Daily Quests List */}
      <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Today's Daily Quests</h3>
            <p className="text-xs text-slate-400">Complete quests daily to boost your Tartan Scholar rank!</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-950/80 text-emerald-300 rounded-full border border-emerald-700/60">
            {dailyQuests.filter(q => q.completed).length} / 3 Complete
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {dailyQuests.map((quest) => (
            <div
              key={quest.id}
              className={`p-4 rounded-2xl border transition-all ${
                quest.completed
                  ? 'bg-gradient-to-br from-emerald-950/70 to-teal-950/60 border-emerald-600/70 text-emerald-200 shadow-md ring-1 ring-emerald-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-black text-sm leading-snug text-slate-100">{quest.title}</span>
                {quest.completed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded-full border border-emerald-600/50">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Done
                  </span>
                ) : (
                  <span className="text-xs font-black text-amber-950 bg-gradient-to-r from-amber-300 to-yellow-400 px-2 py-0.5 rounded-md shrink-0 border border-amber-300 shadow-2xs">
                    +{quest.exp} XP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{quest.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tartan Trophy & Badge Cabinet */}
      <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="text-xl font-bold text-slate-100">Tartan Trophy & Badge Cabinet</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
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
                    ? 'bg-gradient-to-tr from-slate-800/90 to-emerald-950/50 border-emerald-600/60 shadow-md ring-1 ring-emerald-500/20'
                    : 'bg-slate-800/40 border-slate-800/80 opacity-60'
                }`}
              >
                <div className="text-3xl p-2 bg-slate-800 rounded-2xl shadow-2xs shrink-0 border border-slate-700">
                  {badge.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm text-slate-100">{badge.title}</h4>
                    {isUnlocked && <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-400 leading-snug mt-1">{badge.description}</p>
                  <span className={`inline-block mt-2 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    isUnlocked ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}>
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
