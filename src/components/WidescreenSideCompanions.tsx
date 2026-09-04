import React, { useState, useMemo } from 'react';
import { 
  Sparkles, Flame, Award, Volume2, ArrowRight, RefreshCw, 
  BookOpen, Compass, Check, HelpCircle, Layers, ChevronRight 
} from 'lucide-react';
import { DictionaryEntry, UserProgress } from '../types/dictionary';
import { speakWord, speakSentence } from '../utils/speech';
import { playSound } from '../utils/soundEffects';

interface WidescreenSideCompanionsProps {
  entries: DictionaryEntry[];
  userProgress: UserProgress;
  onOpenWordStudy?: (entry: DictionaryEntry) => void;
  onSelectTab: (tab: 'dictionary' | 'games' | 'daily' | 'ai-bard' | 'vault') => void;
}

/**
 * WidescreenSideCompanions:
 * Dynamically utilizes the left and right gutters in widescreen browser tabs (≥1440px / 2xl).
 * Features:
 * - Left Wing: "Scots Word of the Moment" Capsule, Dialect Radar, Scottish Cultural Lore
 * - Right Wing: Learner Level & Streak Pod, Quick Scots Audio Practice, Interactive Gutter Flashcard
 */
export const WidescreenSideCompanions: React.FC<WidescreenSideCompanionsProps> = ({
  entries,
  userProgress,
  onOpenWordStudy,
  onSelectTab,
}) => {
  // Left Wing: Rotating Word of the Moment
  const [featuredIndex, setFeaturedIndex] = useState<number>(() => {
    return Math.floor(Math.random() * (entries.length || 1));
  });

  const featuredWord: DictionaryEntry | undefined = entries[featuredIndex] || entries[0];

  const handleNextWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('pop');
    setFeaturedIndex((prev) => (prev + 1) % entries.length);
  };

  const handleSpeakFeatured = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (featuredWord) {
      playSound('click');
      speakWord(featuredWord.word);
    }
  };

  // Right Wing: Gutter Flashcard
  const [flashcardIndex, setFlashcardIndex] = useState<number>(3);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  const flashcardWord: DictionaryEntry | undefined = entries[flashcardIndex] || entries[1];

  const handleNextFlashcard = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound('pop');
    setIsFlipped(false);
    setFlashcardIndex((prev) => (prev + 3) % entries.length);
  };

  // Quick Scots sound practice list
  const scotsSounds = [
    { label: 'Dreich', tip: 'Scots throat "ch"', text: 'dreich' },
    { label: 'Loch', tip: 'Gaelic guttural "ch"', text: 'loch' },
    { label: 'Braw', tip: 'Broad rolled "r"', text: 'braw' },
    { label: 'Gallus', tip: 'Sharp Glasgow glottal', text: 'gallus' },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. LEFT GUTTER COMPANION WING (Hidden on smaller screens, visible on 2xl) */}
      {/* ========================================================================= */}
      <aside 
        aria-label="Scottish Lexicon Side Companion Left"
        className="hidden 2xl:flex flex-col gap-4 fixed left-3 top-20 bottom-8 w-60 xl:w-64 z-30 pointer-events-none"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3.5 pr-1 pointer-events-auto">
          
          {/* Card 1: Scots Word of the Moment */}
          {featuredWord && (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              {/* Top Tartan Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400" />
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Word of the Moment
                </span>
                <button
                  onClick={handleNextWord}
                  title="Cycle to another Scottish word"
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <h4 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                    {featuredWord.word}
                  </h4>
                  <p className="text-xs font-mono font-bold text-cyan-300">
                    {featuredWord.phonetic}
                  </p>
                </div>

                <button
                  onClick={handleSpeakFeatured}
                  title={`Pronounce ${featuredWord.word}`}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs border border-slate-700 hover:scale-105 active:scale-95"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 mb-2.5">
                <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed font-medium">
                  {featuredWord.definition}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                  {featuredWord.isScots ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots' : '🇬🇧 UK Term'}
                </span>

                {onOpenWordStudy && (
                  <button
                    onClick={() => onOpenWordStudy(featuredWord)}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer hover:underline"
                  >
                    <span>Study Lab</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Card 2: Dialect & Regional Radar */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-1.5 mb-2.5 text-xs font-black text-slate-200">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Regional Scots Dialects</span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <span className="font-bold text-slate-200">Glasgow & West</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-300 rounded font-mono font-bold">Patter</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <span className="font-bold text-slate-200">Aberdeen & Shire</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-950 text-amber-300 rounded font-mono font-bold">Doric</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <span className="font-bold text-slate-200">Edinburgh & East</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-teal-950 text-teal-300 rounded font-mono font-bold">Lothian</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                <span className="font-bold text-slate-200">Highlands & Islands</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-sky-950 text-sky-300 rounded font-mono font-bold">Gaelic-Scots</span>
              </div>
            </div>

            <button
              onClick={() => onSelectTab('dictionary')}
              className="mt-3 w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-[11px] font-bold border border-slate-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Explore In Dictionary</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Card 3: Highland Lore & Did You Know */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800/80 text-xs">
            <span className="font-black text-amber-300 flex items-center gap-1 mb-1 text-[11px]">
              <span>💡</span> Scots Fact
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              "Dreich" was voted the most iconic word in Scotland. It describes the damp, gloomy, overcast Highland weather!
            </p>
          </div>

        </div>
      </aside>

      {/* ========================================================================== */}
      {/* 2. RIGHT GUTTER COMPANION WING (Hidden on smaller screens, visible on 2xl) */}
      {/* ========================================================================== */}
      <aside 
        aria-label="Scottish Lexicon Side Companion Right"
        className="hidden 2xl:flex flex-col gap-4 fixed right-3 top-20 bottom-8 w-60 xl:w-64 z-30 pointer-events-none"
      >
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3.5 pl-1 pointer-events-auto">
          
          {/* Card 1: Student Level & Progress Pod */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-500" />
            
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  {userProgress.level}
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Tartan Scholar</h4>
                  <p className="text-[10px] text-slate-400 font-bold">{userProgress.exp} Total XP</p>
                </div>
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-amber-300 font-black text-[11px]">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400 animate-pulse" />
                <span>{userProgress.streak}d</span>
              </div>
            </div>

            {/* EXP bar */}
            <div className="space-y-1 mb-2.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>Level {userProgress.level} Progress</span>
                <span className="text-amber-300">{userProgress.exp % 100}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${userProgress.exp % 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => onSelectTab('daily')}
              className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-[11px] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Daily Quests</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Interactive Gutter Flashcard */}
          {flashcardWord && (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-amber-400" />
                  Quick Scots Flashcard
                </span>
                <button
                  onClick={handleNextFlashcard}
                  title="Next flashcard"
                  className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/90 text-center mb-2.5 min-h-[90px] flex flex-col items-center justify-center">
                {!isFlipped ? (
                  <>
                    <span className="text-lg font-black text-white block mb-0.5">
                      {flashcardWord.word}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      {flashcardWord.phonetic}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Do you know what this means?
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-emerald-300 leading-tight mb-1">
                      {flashcardWord.definition}
                    </p>
                    <span className="text-[10px] italic text-slate-400 line-clamp-1">
                      "{flashcardWord.examples[0]}"
                    </span>
                  </>
                )}
              </div>

              <button
                onClick={() => {
                  playSound('pop');
                  setIsFlipped(!isFlipped);
                }}
                className="w-full py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
              >
                {isFlipped ? 'Hide Meaning' : 'Reveal Meaning 👁️'}
              </button>
            </div>
          )}

          {/* Card 3: Quick Scottish Audio Voice Gym */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-3.5 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-black text-slate-200">
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Accent Pronunciation Gym</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              {scotsSounds.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    playSound('click');
                    speakWord(s.text);
                  }}
                  title={s.tip}
                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/50 border border-slate-700/80 text-left transition-all cursor-pointer group"
                >
                  <span className="text-xs font-bold text-white group-hover:text-emerald-300 block">
                    {s.label}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    {s.tip}
                  </span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </aside>
    </>
  );
};
