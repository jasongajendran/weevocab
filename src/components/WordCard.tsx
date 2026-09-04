import React from 'react';
import { Star, MapPin, ChevronRight, Bookmark } from 'lucide-react';
import { DictionaryEntry } from '../types/dictionary';
import { SoundWaveIcon } from './SoundWaveIcon';
import { playSound } from '../utils/soundEffects';

interface WordCardProps {
  entry: DictionaryEntry;
  isStarred: boolean;
  isWordPlaying: boolean;
  isDefPlaying: boolean;
  playingExIdx: number | null;
  layoutColumns: '1' | '2' | '3';
  onToggleStar: (id: string) => void;
  onOpenStudy: (entry: DictionaryEntry) => void;
  onPlayAudio: (text: string, id: string, rate?: number) => void;
  onSearchKeyword: (keyword: string) => void;
}

const getCategoryTheme = (entry: DictionaryEntry) => {
  if (entry.category === 'UK Common & Slang') {
    return {
      badgeBg: 'bg-amber-950/80 text-amber-300 border-amber-600/50 font-bold',
      flag: '🇬🇧 UK Slang',
      accentBar: 'border-t-4 border-t-amber-400',
      exBorder: 'border-l-amber-400 bg-slate-800/70',
      titleHover: 'group-hover:text-amber-300',
      studyBtn: 'bg-slate-800 hover:bg-slate-750 text-amber-300 border-amber-500/40 hover:border-amber-400 shadow-2xs',
      studyIconBg: 'bg-amber-400 text-slate-950',
      studyChevron: 'text-amber-400',
    };
  }
  if (entry.isScots || entry.category === 'School & Banter') {
    return {
      badgeBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50 font-bold',
      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots',
      accentBar: 'border-t-4 border-t-emerald-500',
      exBorder: 'border-l-emerald-500 bg-slate-800/70',
      titleHover: 'group-hover:text-emerald-300',
      studyBtn: 'bg-slate-800 hover:bg-slate-750 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 shadow-2xs',
      studyIconBg: 'bg-emerald-600 text-white',
      studyChevron: 'text-emerald-400',
    };
  }
  if (entry.isAcademic) {
    return {
      badgeBg: 'bg-sky-950/80 text-sky-300 border-sky-600/50 font-bold',
      flag: '🎓 Scholar',
      accentBar: 'border-t-4 border-t-sky-500',
      exBorder: 'border-l-sky-500 bg-slate-800/70',
      titleHover: 'group-hover:text-sky-300',
      studyBtn: 'bg-slate-800 hover:bg-slate-750 text-sky-300 border-sky-500/40 hover:border-sky-400 shadow-2xs',
      studyIconBg: 'bg-sky-600 text-white',
      studyChevron: 'text-sky-400',
    };
  }
  if (entry.category === 'Nature & Places') {
    return {
      badgeBg: 'bg-teal-950/80 text-teal-300 border-teal-600/50 font-bold',
      flag: '🌲 Nature',
      accentBar: 'border-t-4 border-t-teal-500',
      exBorder: 'border-l-teal-500 bg-slate-800/70',
      titleHover: 'group-hover:text-teal-300',
      studyBtn: 'bg-slate-800 hover:bg-slate-750 text-teal-300 border-teal-500/40 hover:border-teal-400 shadow-2xs',
      studyIconBg: 'bg-teal-600 text-white',
      studyChevron: 'text-teal-400',
    };
  }
  return {
    badgeBg: 'bg-rose-950/80 text-rose-300 border-rose-600/50 font-bold',
    flag: '🍲 Culture',
    accentBar: 'border-t-4 border-t-rose-400',
    exBorder: 'border-l-rose-400 bg-slate-800/70',
    titleHover: 'group-hover:text-rose-300',
    studyBtn: 'bg-slate-800 hover:bg-slate-750 text-rose-300 border-rose-500/40 hover:border-rose-400 shadow-2xs',
    studyIconBg: 'bg-rose-500 text-white',
    studyChevron: 'text-rose-400',
  };
};

const getPartOfSpeechBadge = (pos: string) => {
  const p = pos.toLowerCase();
  if (p.includes('noun')) {
    return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-sky-950/80 text-sky-300 border border-sky-700/60">n.</span>;
  }
  if (p.includes('verb')) {
    return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">v.</span>;
  }
  if (p.includes('adj')) {
    return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-amber-950/80 text-amber-300 border border-amber-700/60">adj.</span>;
  }
  if (p.includes('adv')) {
    return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">adv.</span>;
  }
  return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-teal-950/80 text-teal-300 border border-teal-700/60">phr.</span>;
};

const getDifficultyBadge = (difficulty: string) => {
  if (difficulty.includes('P6-P7')) {
    return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">🟢 P6–P7</span>;
  }
  if (difficulty.includes('S1-S2')) {
    return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-amber-950/80 text-amber-300 border border-amber-700/60">🟡 S1–S2</span>;
  }
  return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-950/80 text-blue-300 border border-blue-700/60">🔵 S3–S4</span>;
};

export const WordCard = React.memo<WordCardProps>(({
  entry,
  isStarred,
  isWordPlaying,
  isDefPlaying,
  playingExIdx,
  layoutColumns,
  onToggleStar,
  onOpenStudy,
  onPlayAudio,
  onSearchKeyword,
}) => {
  const theme = getCategoryTheme(entry);

  return (
    <div
      id={`word-card-${entry.id}`}
      className={`bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-slate-600 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group ${theme.accentBar} ${
        layoutColumns === '1' ? 'p-6 sm:p-7 shadow-2xs' : 'p-5 shadow-2xs'
      }`}
    >
      <div>
        {/* Top Bar: Word, Badges & Bookmark on Left; Audio Icon Aligned */}
        <div className="flex items-start justify-between gap-3 mb-3 pr-3 sm:pr-3.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`font-black text-white tracking-tight transition-colors ${theme.titleHover} ${
                layoutColumns === '1' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
              }`}>
                {entry.word}
              </h2>

              <span className={`px-2.5 py-0.5 text-[11px] font-black rounded-lg border shadow-2xs ${theme.badgeBg}`}>
                {theme.flag}
              </span>

              {/* Star / Bookmark Button next to word & badge */}
              <button
                id={`star-btn-${entry.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStar(entry.id);
                  playSound('pop');
                }}
                title={isStarred ? 'Remove from My Vault' : 'Save to My Vault'}
                aria-label={isStarred ? `Remove ${entry.word} from Vault` : `Save ${entry.word} to Vault`}
                className={`p-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center ${
                  isStarred 
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-xs scale-105 border border-amber-300 ring-2 ring-amber-300/40' 
                    : 'bg-slate-800 text-slate-400 hover:text-amber-300 hover:bg-slate-750 border border-slate-700'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isStarred ? 'fill-slate-950 text-slate-950' : ''}`} />
              </button>
            </div>
            
            {/* Phonetic & Pronunciation Guide */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`font-mono font-bold text-cyan-300 ${layoutColumns === '1' ? 'text-sm' : 'text-xs'}`}>
                {entry.phonetic}
              </span>
              <span className={`text-slate-300 font-bold italic bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700 ${layoutColumns === '1' ? 'text-xs' : 'text-[11px]'}`} title={entry.phoneticGuide}>
                🗣️ {entry.phoneticGuide}
              </span>
            </div>
          </div>

          {/* Word Pronunciation Sound Icon */}
          <button
            id={`word-sound-btn-${entry.id}`}
            onClick={() => onPlayAudio(entry.word, `word-${entry.id}`, 0.9)}
            title={`Listen to pronunciation of "${entry.word}"`}
            aria-label={`Listen to pronunciation of ${entry.word}`}
            className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
              isWordPlaying
                ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-emerald-600 hover:text-white shadow-2xs border border-slate-700 hover:scale-105 active:scale-95'
            }`}
          >
            <SoundWaveIcon isPlaying={isWordPlaying} size="sm" />
          </button>
        </div>

        {/* Tags & Metadata Bar */}
        <div className="flex items-center gap-1.5 mb-3 text-xs flex-wrap">
          {getPartOfSpeechBadge(entry.partOfSpeech)}
          {getDifficultyBadge(entry.difficulty)}
          <span className="text-slate-300 font-bold flex items-center gap-1 text-[11px] bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 shadow-2xs" title={entry.scotsRegion}>
            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
            {entry.scotsRegion.replace(' & Scotland', '').replace('UK Wide & Common', 'UK Wide')}
          </span>
        </div>

        {/* Definition Box with Direct Sound Icon */}
        <div className="bg-slate-800/80 rounded-2xl p-3 sm:p-3.5 border border-slate-700 mb-3 flex items-start justify-between gap-3 group/def shadow-2xs">
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-slate-100 leading-relaxed ${
              layoutColumns === '1' ? 'text-base sm:text-lg' : 'text-sm'
            }`}>
              {entry.definition}
            </p>
          </div>

          {/* Definition Sound Icon */}
          <button
            id={`def-sound-btn-${entry.id}`}
            onClick={() => onPlayAudio(entry.definition, `card-def-${entry.id}`, 0.9)}
            title="Listen to definition"
            aria-label="Listen to definition"
            className={`p-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              isDefPlaying
                ? 'bg-emerald-600 text-white scale-105 ring-2 ring-emerald-400 shadow-xs'
                : 'bg-slate-900/90 text-slate-400 hover:text-emerald-300 hover:bg-slate-950 border border-slate-700 shadow-2xs'
            }`}
          >
            <SoundWaveIcon isPlaying={isDefPlaying} size="sm" />
          </button>
        </div>

        {/* Example Sentences */}
        {entry.examples.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {entry.examples.slice(0, layoutColumns === '1' ? 2 : 1).map((ex, idx) => {
              const isExPlaying = playingExIdx === idx;
              return (
                <div 
                  key={idx}
                  className={`flex items-start justify-between gap-2 p-2 rounded-xl border-l-2 text-xs text-slate-300 italic group/ex ${theme.exBorder}`}
                >
                  <span className="flex-1 leading-relaxed">"{ex}"</span>
                  <button
                    id={`ex-sound-btn-${entry.id}-${idx}`}
                    onClick={() => onPlayAudio(ex, `card-ex-${entry.id}-${idx}`, 0.9)}
                    title="Listen to example sentence"
                    aria-label={`Listen to example ${idx + 1}`}
                    className={`p-1 rounded-md transition-all shrink-0 cursor-pointer ${
                      isExPlaying
                        ? 'bg-emerald-600 text-white scale-105 shadow-xs'
                        : 'bg-slate-900/80 text-slate-400 hover:text-emerald-300 hover:bg-slate-900'
                    }`}
                  >
                    <SoundWaveIcon isPlaying={isExPlaying} size="sm" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Synonyms & Antonyms preview tags */}
        {(entry.synonyms.length > 0 || entry.antonyms.length > 0) && (
          <div className="mb-3 space-y-1">
            {entry.synonyms.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-400 font-bold text-[11px]">Syn:</span>
                {entry.synonyms.slice(0, 3).map((syn, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSearchKeyword(syn)}
                    className="px-2.5 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-bold hover:bg-slate-750 hover:text-emerald-300 hover:scale-105 cursor-pointer transition-all shadow-2xs"
                  >
                    {syn}
                  </button>
                ))}
              </div>
            )}
            {entry.antonyms.length > 0 && layoutColumns === '1' && (
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                <span className="text-slate-400 font-bold text-[11px]">Ant:</span>
                {entry.antonyms.slice(0, 2).map((ant, idx) => (
                  <button
                    key={idx}
                    onClick={() => onSearchKeyword(ant)}
                    className="px-2.5 py-0.5 bg-amber-950/60 text-amber-300 border border-amber-700/50 rounded-lg text-[11px] font-bold hover:bg-amber-900 hover:scale-105 cursor-pointer transition-all shadow-2xs"
                  >
                    {ant}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Deep Study Action */}
      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
          <span>✨</span>
          <span className="hidden sm:inline">Etymology, voice & quiz</span>
          <span className="sm:hidden">Study lab</span>
        </span>

        <button
          id={`open-detail-btn-${entry.id}`}
          onClick={() => {
            onOpenStudy(entry);
            playSound('pop');
          }}
          title={`Open full pronunciation studio, etymology, and mastery challenge for ${entry.word}`}
          className={`group flex items-center justify-center gap-1.5 sm:gap-2 font-black rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-2xs shrink-0 border ${theme.studyBtn} ${
            layoutColumns === '1' ? 'px-4 py-2 text-sm' : 'px-3 py-1.5 text-xs'
          }`}
        >
          <div className={`w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${theme.studyIconBg}`}>
            ⚡
          </div>
          <span>Study Lab & Lore</span>
          <ChevronRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-0.5 ${theme.studyChevron}`} />
        </button>
      </div>
    </div>
  );
});

WordCard.displayName = 'WordCard';
