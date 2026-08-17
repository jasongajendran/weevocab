import React, { useState, useMemo } from 'react';
import { 
  Search, Volume2, Mic, MicOff, Star, Sparkles, Shuffle, X, 
  BookOpen, ChevronRight, CheckCircle2, AlertCircle, BookmarkCheck,
  Tag, MapPin, Layers, GraduationCap, Copy, Check, ChevronDown, ChevronUp,
  Eye, EyeOff, VolumeX, Radio, Compass, Filter
} from 'lucide-react';
import { DictionaryEntry, WordCategory, ScottishRegion } from '../types/dictionary';
import { speakWord, speakSentence, cancelSpeech, startVoicePractice, isSpeechRecognitionSupported, RecognitionResult } from '../utils/speech';
import { playSound } from '../utils/soundEffects';

interface DictionaryViewProps {
  entries: DictionaryEntry[];
  starredWordIds: string[];
  onToggleStar: (wordId: string) => void;
  onOpenAIBardWithWord?: (word: DictionaryEntry) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  entries,
  starredWordIds,
  onToggleStar,
  onOpenAIBardWithWord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [activeModalWord, setActiveModalWord] = useState<DictionaryEntry | null>(null);
  
  // Distraction-Free / Focus Mode toggle
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Collapsible Filters toggle (default open on desktop, collapsible anytime)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(true);

  // Audio playing state indicator for words/examples
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Voice Practice State in Modal
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState<RecognitionResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Alphabet letter counts
  const letterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ALPHABET.forEach(letter => {
      counts[letter] = entries.filter(e => e.word.toUpperCase().startsWith(letter)).length;
    });
    return counts;
  }, [entries]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'All') count++;
    if (selectedRegion !== 'All') count++;
    if (selectedDifficulty !== 'All') count++;
    if (selectedLetter !== null) count++;
    if (searchQuery.trim() !== '') count++;
    return count;
  }, [selectedCategory, selectedRegion, selectedDifficulty, selectedLetter, searchQuery]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      // Letter filter
      if (selectedLetter && !entry.word.toUpperCase().startsWith(selectedLetter)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesWord = entry.word.toLowerCase().includes(q);
        const matchesDef = entry.definition.toLowerCase().includes(q);
        const matchesSyn = entry.synonyms.some(s => s.toLowerCase().includes(q));
        const matchesAnt = entry.antonyms.some(a => a.toLowerCase().includes(q));
        const matchesTags = entry.tags.some(t => t.toLowerCase().includes(q));
        const matchesRegion = entry.scotsRegion.toLowerCase().includes(q);
        if (!matchesWord && !matchesDef && !matchesSyn && !matchesAnt && !matchesTags && !matchesRegion) {
          return false;
        }
      }
      // Category filter
      if (selectedCategory !== 'All') {
        if (selectedCategory === 'Scots Slang') {
          if (!entry.isScots) return false;
        } else if (selectedCategory === 'Academic') {
          if (!entry.isAcademic) return false;
        } else if (selectedCategory === 'UK Common') {
          if (entry.category !== 'UK Common & Slang') return false;
        } else if (entry.category !== selectedCategory) {
          return false;
        }
      }
      // Region filter
      if (selectedRegion !== 'All' && entry.scotsRegion !== selectedRegion) {
        return false;
      }
      // Difficulty filter
      if (selectedDifficulty !== 'All' && !entry.difficulty.startsWith(selectedDifficulty)) {
        return false;
      }
      return true;
    });
  }, [entries, selectedLetter, searchQuery, selectedCategory, selectedRegion, selectedDifficulty]);

  // Random word
  const handleRandomWord = () => {
    if (entries.length === 0) return;
    const random = entries[Math.floor(Math.random() * entries.length)];
    playSound('pop');
    setActiveModalWord(random);
  };

  // Speak word or sentence with active animation feedback
  const handlePronounceAudio = (text: string, audioId: string, rate: number = 0.9) => {
    playSound('click');
    if (playingAudioId === audioId) {
      cancelSpeech();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(audioId);
    speakSentence(text, {
      rate,
      onEnd: () => {
        setPlayingAudioId((prev) => (prev === audioId ? null : prev));
      },
    });
  };

  // Voice practice
  const handleStartVoice = (targetWord: string) => {
    setVoiceResult(null);
    setVoiceError(null);
    setIsRecording(true);
    playSound('click');

    const stopFn = startVoicePractice(
      targetWord,
      (result) => {
        setIsRecording(false);
        setVoiceResult(result);
        if (result.isMatch) {
          playSound('correct');
        } else {
          playSound('wrong');
        }
      },
      (error) => {
        setIsRecording(false);
        setVoiceError(error);
      }
    );

    // Auto-stop after 5 seconds if silent
    setTimeout(() => {
      setIsRecording(false);
      stopFn();
    }, 5000);
  };

  // Copy entry details
  const handleCopyWord = (entry: DictionaryEntry) => {
    const text = `${entry.word} (${entry.partOfSpeech}) - ${entry.phonetic}\nDefinition: ${entry.definition}\nExamples:\n1. ${entry.examples[0]}\n2. ${entry.examples[1]}\nSynonyms: ${entry.synonyms.join(', ')}\nAntonyms: ${entry.antonyms.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    playSound('pop');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper for Category Styling & Badges
  const getCategoryTheme = (entry: DictionaryEntry) => {
    if (entry.category === 'UK Common & Slang') {
      return {
        badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
        flag: '🇬🇧 UK Slang',
        accentBar: 'border-t-4 border-t-sky-500',
        exBorder: 'border-l-sky-500 bg-sky-50/50',
        titleHover: 'group-hover:text-sky-600',
      };
    }
    if (entry.isScots || entry.category === 'School & Banter') {
      return {
        badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
        flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots',
        accentBar: 'border-t-4 border-t-blue-600',
        exBorder: 'border-l-blue-500 bg-blue-50/50',
        titleHover: 'group-hover:text-blue-600',
      };
    }
    if (entry.isAcademic) {
      return {
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
        flag: '🎓 Scholar',
        accentBar: 'border-t-4 border-t-purple-600',
        exBorder: 'border-l-purple-500 bg-purple-50/50',
        titleHover: 'group-hover:text-purple-600',
      };
    }
    if (entry.category === 'Nature & Places') {
      return {
        badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        flag: '🌲 Nature',
        accentBar: 'border-t-4 border-t-emerald-600',
        exBorder: 'border-l-emerald-500 bg-emerald-50/50',
        titleHover: 'group-hover:text-emerald-600',
      };
    }
    return {
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      flag: '🍲 Culture',
      accentBar: 'border-t-4 border-t-amber-500',
      exBorder: 'border-l-amber-500 bg-amber-50/50',
      titleHover: 'group-hover:text-amber-600',
    };
  };

  const getDifficultyBadge = (difficulty: string) => {
    if (difficulty.includes('P6-P7')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">🟢 P6–P7 Starter</span>;
    }
    if (difficulty.includes('S1-S2')) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">🟡 S1–S2 Intermediate</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200">🟣 S3–S4 Scholar</span>;
  };

  return (
    <div className="space-y-5">
      
      {/* Top Controls: Focus Mode Toggle & Quick Helper */}
      <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <span className="text-xs sm:text-sm font-black text-slate-800">
            {isFocusMode ? '🎯 Focus Reading Mode (Distraction-Free)' : '🌟 Full Interactive Dictionary'}
          </span>
          <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {filteredEntries.length} words
          </span>
        </div>

        {/* Hide Distractions / Focus Mode Button */}
        <button
          id="toggle-focus-mode-btn"
          onClick={() => {
            setIsFocusMode(!isFocusMode);
            playSound('pop');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            isFocusMode
              ? 'bg-amber-400 text-slate-950 shadow-xs hover:bg-amber-300'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
          title={isFocusMode ? 'Switch back to full interactive mode' : 'Hide distractions for peaceful reading'}
        >
          {isFocusMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{isFocusMode ? 'Show Full Mode' : 'Hide Distractions'}</span>
        </button>
      </div>

      {/* Main Header Banner (Hidden in Focus Mode) */}
      {!isFocusMode && (
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-3xl p-5 sm:p-8 text-white shadow-lg shadow-blue-900/10 relative overflow-hidden border border-blue-600/30">
          {/* Decorative Subtle Elements */}
          <div className="absolute -right-8 -top-8 w-60 h-60 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-6 bottom-2 opacity-10 text-8xl sm:text-9xl font-black select-none pointer-events-none">
            🇬🇧
          </div>

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              UK Common & Scottish Regional Junior Curriculum
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Junior UK & Scottish Dictionary
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-normal">
              Explore 200+ top UK common words, Scottish regional slang, and academic power terms. Every entry includes <strong>voice audio for both the word and all example sentences</strong>, dual contexts, synonyms, and school stages.
            </p>

            {/* Search Input Bar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  id="dictionary-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search any word, meaning, slang, or synonym (e.g. chuffed, dreich, analyse)..."
                  className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-semibold text-sm sm:text-base shadow-inner border border-slate-200/60 focus:outline-hidden focus:ring-2 focus:ring-sky-400 transition-all"
                />
                {searchQuery && (
                  <button
                    id="clear-search-btn"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                id="random-word-btn"
                onClick={handleRandomWord}
                className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold text-sm shadow-sm transition-all whitespace-nowrap cursor-pointer"
              >
                <Shuffle className="w-4 h-4" />
                <span>Surprise Word!</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Focus Mode Simple Search Bar */}
      {isFocusMode && (
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            id="focus-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type any word or meaning to search..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 font-semibold text-sm sm:text-base shadow-xs border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* A to Z Alphabet Navigation Bar (Mobile Swipeable & Touch Optimized) */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            A–Z Alphabet Scroller:
          </span>
          {selectedLetter && (
            <button
              id="clear-letter-filter-btn"
              onClick={() => {
                setSelectedLetter(null);
                playSound('click');
              }}
              className="text-xs font-black text-blue-600 hover:text-blue-800 hover:underline px-2 py-0.5 rounded-md bg-blue-50"
            >
              Show All (A–Z)
            </button>
          )}
        </div>

        {/* Swipeable Horizontal Alphabet Pill Bar with smooth touch scrolling */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth">
          <button
            id="alphabet-all-btn"
            onClick={() => {
              setSelectedLetter(null);
              playSound('click');
            }}
            className={`px-3.5 py-2 min-h-[40px] rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              selectedLetter === null
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All ({entries.length})
          </button>

          {ALPHABET.map((letter) => {
            const count = letterCounts[letter] || 0;
            const isSelected = selectedLetter === letter;
            return (
              <button
                key={letter}
                id={`letter-btn-${letter}`}
                disabled={count === 0}
                onClick={() => {
                  setSelectedLetter(isSelected ? null : letter);
                  playSound('click');
                }}
                className={`relative px-3 py-2 min-h-[40px] min-w-[38px] rounded-xl font-black text-xs sm:text-sm transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-sm scale-105'
                    : count > 0
                    ? 'bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-700'
                    : 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                }`}
                title={count > 0 ? `${count} word${count > 1 ? 's' : ''} starting with ${letter}` : `No words starting with ${letter}`}
              >
                <span>{letter}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all">
        {/* Accordion Header */}
        <div 
          onClick={() => {
            setIsFilterOpen(!isFilterOpen);
            playSound('click');
          }}
          className="flex items-center justify-between px-4 py-3 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer border-b border-slate-200/60 select-none"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">
              Filter Categories & Regions
            </span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] font-black bg-blue-600 text-white rounded-full">
                {activeFiltersCount} Active
              </span>
            )}
            {!isFilterOpen && (
              <span className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-md hidden sm:inline">
                • {selectedCategory} • {selectedRegion} • {selectedDifficulty}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                id="reset-filter-header-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                  setSelectedLetter(null);
                  setSelectedCategory('All');
                  setSelectedRegion('All');
                  setSelectedDifficulty('All');
                  playSound('click');
                }}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1"
              >
                Reset
              </button>
            )}
            <button
              id="filter-accordion-toggle-btn"
              aria-label={isFilterOpen ? 'Collapse filter section' : 'Expand filter section'}
              className="p-1 rounded-lg text-slate-500 hover:bg-slate-200"
            >
              {isFilterOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isFilterOpen && (
          <div className="p-4 space-y-3.5 animate-in fade-in duration-150">
            {/* Category Filter Chips */}
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                Categories:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { label: 'All Categories', value: 'All', color: 'blue' },
                  { label: '🇬🇧 UK Common & Slang', value: 'UK Common', color: 'sky' },
                  { label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots & Regional', value: 'Scots Slang', color: 'indigo' },
                  { label: '🎓 Academic & Power', value: 'Academic', color: 'purple' },
                  { label: '🏫 School & Banter', value: 'School & Banter', color: 'emerald' },
                  { label: '🌲 Nature & Places', value: 'Nature & Places', color: 'green' },
                  { label: '🍲 Food & Culture', value: 'Food & Culture', color: 'amber' },
                ].map(cat => (
                  <button
                    key={cat.value}
                    id={`filter-cat-${cat.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      playSound('click');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      selectedCategory === cat.value
                        ? 'bg-blue-600 text-white shadow-xs scale-[1.02]'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Region & Difficulty Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <label htmlFor="region-filter-select" className="text-[10px] font-bold text-slate-400 uppercase block">
                    Region
                  </label>
                  <select
                    id="region-filter-select"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    aria-label="Filter by UK or Scottish region"
                    className="w-full bg-transparent font-bold text-slate-800 focus:outline-hidden text-xs cursor-pointer"
                  >
                    <option value="All">All UK & Scottish Regions</option>
                    <option value="UK Wide & Common">UK Wide & Common</option>
                    <option value="Standard UK Academic">Standard UK Academic</option>
                    <option value="London & South">London & South</option>
                    <option value="Northern England">Northern England</option>
                    <option value="Wales & Cymru">Wales & Cymru</option>
                    <option value="Northern Ireland & Ulster">Northern Ireland & Ulster</option>
                    <option value="General Scots & Scotland">General Scots</option>
                    <option value="Glasgow & West">Glasgow & West Coast</option>
                    <option value="Edinburgh & East">Edinburgh & Lothians</option>
                    <option value="Highlands & Islands">Highlands & Islands</option>
                    <option value="Aberdeen & Doric">Aberdeen & Doric</option>
                    <option value="Dundee & Angus">Dundee & Angus</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <GraduationCap className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="flex-1">
                  <label htmlFor="difficulty-filter-select" className="text-[10px] font-bold text-slate-400 uppercase block">
                    School Stage
                  </label>
                  <select
                    id="difficulty-filter-select"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    aria-label="Filter by school stage and difficulty"
                    className="w-full bg-transparent font-bold text-slate-800 focus:outline-hidden text-xs cursor-pointer"
                  >
                    <option value="All">All School Stages (P6–S4)</option>
                    <option value="P6-P7">Primary 6–7 (Starter)</option>
                    <option value="S1-S2">S1–S2 (Intermediate)</option>
                    <option value="S3-S4">S3–S4 (Advanced Scholar)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Count & Active Filters Indicator */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        <div>
          Showing <span className="font-black text-slate-900">{filteredEntries.length}</span> of <span className="font-black text-slate-900">{entries.length}</span> terms
          {selectedLetter && <span> • Letter <strong>'{selectedLetter}'</strong></span>}
          {searchQuery && <span> • Matching <strong>"{searchQuery}"</strong></span>}
        </div>
        {activeFiltersCount > 0 && (
          <button
            id="reset-all-filters-btn"
            onClick={() => {
              setSearchQuery('');
              setSelectedLetter(null);
              setSelectedCategory('All');
              setSelectedRegion('All');
              setSelectedDifficulty('All');
              playSound('click');
            }}
            className="text-blue-600 hover:text-blue-800 font-extrabold hover:underline"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Word Cards Grid */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">
            🔍
          </div>
          <h3 className="text-lg font-black text-slate-900 mb-1">No words match your filters</h3>
          <p className="text-xs text-slate-500 mb-4">
            Try checking spelling, searching for another word, or resetting your filter choices.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedLetter(null);
              setSelectedCategory('All');
              setSelectedRegion('All');
              setSelectedDifficulty('All');
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredEntries.map((entry) => {
            const isStarred = starredWordIds.includes(entry.id);
            const theme = getCategoryTheme(entry);
            const isWordPlaying = playingAudioId === `word-${entry.id}`;

            return (
              <div
                key={entry.id}
                id={`word-card-${entry.id}`}
                className={`bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-blue-400 hover:shadow-lg transition-all duration-200 flex flex-col justify-between group ${theme.accentBar}`}
              >
                <div>
                  {/* Top Bar: Word, Badges, Star */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className={`text-xl sm:text-2xl font-black text-slate-900 transition-colors ${theme.titleHover}`}>
                          {entry.word}
                        </h2>
                        <span className={`px-2 py-0.5 text-[11px] font-extrabold rounded-md border ${theme.badgeBg}`}>
                          {theme.flag}
                        </span>
                      </div>
                      
                      {/* Phonetic & Pronunciation Guide */}
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-500">{entry.phonetic}</span>
                        <span className="text-[11px] text-indigo-700 font-extrabold italic" title={entry.phoneticGuide}>
                          • {entry.phoneticGuide}
                        </span>
                      </div>
                    </div>

                    {/* Star / Bookmark Button */}
                    <button
                      id={`star-btn-${entry.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(entry.id);
                        playSound('pop');
                      }}
                      title={isStarred ? 'Remove from My Vault' : 'Save to My Vault'}
                      className={`p-2.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                        isStarred 
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' 
                          : 'bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                      }`}
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-500 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Tags & Metadata Bar */}
                  <div className="flex items-center gap-2 mb-2.5 text-xs flex-wrap">
                    <span className="font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                      {entry.partOfSpeech}
                    </span>
                    {getDifficultyBadge(entry.difficulty)}
                    <span className="text-slate-500 flex items-center gap-1 text-[11px]" title={entry.scotsRegion}>
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      {entry.scotsRegion}
                    </span>
                  </div>

                  {/* Definition */}
                  <p className="text-sm font-semibold text-slate-800 leading-snug mb-3.5">
                    {entry.definition}
                  </p>

                  {/* Example Sentences with Voice Read-Aloud Buttons */}
                  <div className="bg-slate-50/90 rounded-xl p-3 border border-slate-200/60 space-y-2 mb-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                        Context Examples:
                      </span>
                      <span className="text-[10px] text-blue-600 font-bold">
                        🔊 Tap voice icon to hear
                      </span>
                    </div>

                    {entry.examples.map((ex, idx) => {
                      const exAudioId = `card-${entry.id}-ex-${idx}`;
                      const isExPlaying = playingAudioId === exAudioId;

                      return (
                        <div 
                          key={idx} 
                          className={`flex items-start gap-2 p-2 rounded-lg border-l-3 transition-all ${
                            isExPlaying 
                              ? 'bg-blue-100/70 border-l-blue-600 text-blue-950 font-bold' 
                              : `${theme.exBorder} text-slate-700`
                          }`}
                        >
                          <button
                            id={`read-ex-${entry.id}-${idx}`}
                            onClick={() => handlePronounceAudio(ex, exAudioId, 0.88)}
                            title="Listen to this example sentence"
                            aria-label={`Listen to example sentence: ${ex}`}
                            className={`p-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
                              isExPlaying
                                ? 'bg-blue-600 text-white animate-pulse'
                                : 'bg-white text-blue-700 hover:bg-blue-100 shadow-2xs border border-blue-200'
                            }`}
                          >
                            <Volume2 className={`w-3.5 h-3.5 ${isExPlaying ? 'animate-bounce' : ''}`} />
                          </button>

                          <p className="text-xs italic leading-relaxed flex-1 pt-0.5">
                            "{ex}"
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Synonyms & Antonyms preview tags */}
                  {!isFocusMode && (
                    <div className="space-y-1.5 text-xs mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-emerald-800 text-[11px]">Synonyms:</span>
                        {entry.synonyms.slice(0, 3).map((syn, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSearchQuery(syn)}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-md text-[11px] font-bold hover:bg-emerald-100 cursor-pointer"
                          >
                            {syn}
                          </button>
                        ))}
                        {entry.synonyms.length > 3 && (
                          <span className="text-[10px] text-slate-400 font-bold">+{entry.synonyms.length - 3}</span>
                        )}
                      </div>

                      {entry.antonyms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-rose-800 text-[11px]">Antonyms:</span>
                          {entry.antonyms.slice(0, 3).map((ant, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSearchQuery(ant)}
                              className="px-2 py-0.5 bg-rose-50 text-rose-900 border border-rose-200 rounded-md text-[11px] font-bold hover:bg-rose-100 cursor-pointer"
                            >
                              {ant}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Word Pronounce Button */}
                    <button
                      id={`pronounce-btn-${entry.id}`}
                      onClick={() => handlePronounceAudio(entry.word, `word-${entry.id}`, 0.9)}
                      title="Listen to word pronunciation"
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isWordPlaying
                          ? 'bg-blue-600 text-white animate-pulse'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>{isWordPlaying ? 'Speaking...' : 'Listen'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyWord(entry)}
                      title="Copy word details"
                      className="p-1.5 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                      {copiedId === entry.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    id={`open-detail-btn-${entry.id}`}
                    onClick={() => {
                      setActiveModalWord(entry);
                      playSound('pop');
                    }}
                    className="flex items-center gap-1 text-xs font-black text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Full Study Guide</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deep Word Study Modal */}
      {activeModalWord && (
        <div 
          id="word-study-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
          onClick={() => setActiveModalWord(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 p-5 sm:p-8 space-y-5 relative my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              id="close-modal-btn"
              onClick={() => setActiveModalWord(null)}
              className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-2xl sm:text-4xl font-black text-slate-900">
                  {activeModalWord.word}
                </h2>
                {activeModalWord.category === 'UK Common & Slang' && (
                  <span className="px-3 py-1 text-xs font-black bg-sky-100 text-sky-900 rounded-full border border-sky-300">
                    🇬🇧 UK Slang & Common
                  </span>
                )}
                {activeModalWord.isScots && (
                  <span className="px-3 py-1 text-xs font-black bg-blue-100 text-blue-900 rounded-full border border-blue-300">
                    🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots Regional
                  </span>
                )}
                {activeModalWord.isAcademic && (
                  <span className="px-3 py-1 text-xs font-black bg-purple-100 text-purple-900 rounded-full border border-purple-300">
                    🎓 Academic Vocabulary
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 mt-2 text-sm text-slate-600 flex-wrap">
                <span className="font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  {activeModalWord.partOfSpeech}
                </span>
                <span className="font-mono text-slate-500 font-bold">{activeModalWord.phonetic}</span>
                <span className="text-indigo-700 font-extrabold">
                  📖 {activeModalWord.phoneticGuide}
                </span>
                {getDifficultyBadge(activeModalWord.difficulty)}
              </div>
            </div>

            {/* Audio & Voice Practice Center */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200/80 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-900">
                  Pronunciation Studio & Voice Practice
                </span>
                <div className="flex items-center gap-2">
                  <button
                    id="modal-pronounce-normal"
                    onClick={() => handlePronounceAudio(activeModalWord.word, 'modal-word-norm', 0.9)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Speak Word</span>
                  </button>
                  <button
                    id="modal-pronounce-slow"
                    onClick={() => handlePronounceAudio(activeModalWord.word, 'modal-word-slow', 0.6)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-blue-800 border border-blue-300 hover:bg-blue-50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Slow Speed</span>
                  </button>
                </div>
              </div>

              {/* Voice Practice Microphone */}
              <div className="bg-white rounded-xl p-3.5 border border-blue-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-left w-full sm:w-auto">
                  <p className="text-xs font-bold text-slate-800">
                    🎤 Test your pronunciation out loud:
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Click microphone and say <span className="font-black text-slate-800">"{activeModalWord.word}"</span>!
                  </p>
                </div>

                <button
                  id="voice-practice-mic-btn"
                  onClick={() => handleStartVoice(activeModalWord.word)}
                  disabled={isRecording}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                    isRecording
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
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
                        <span className="font-bold">Brilliant pronunciation!</span> You said "{voiceResult.transcript}", which matched perfectly!
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">Almost there!</span> We heard "{voiceResult.transcript}". Try listening to the slow speed guide and rolling your 'r' or softening vowels!
                      </div>
                    </>
                  )}
                </div>
              )}

              {voiceError && (
                <p className="text-xs text-rose-600 font-medium">⚠️ {voiceError}</p>
              )}
            </div>

            {/* Definition */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Definition
                </h4>
                <button
                  onClick={() => handlePronounceAudio(activeModalWord.definition, 'modal-def', 0.9)}
                  className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Read Meaning</span>
                </button>
              </div>
              <p className="text-base text-slate-800 font-semibold leading-relaxed">
                {activeModalWord.definition}
              </p>
            </div>

            {/* Contextual Examples with Voice Read Buttons */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Context Examples (With Audio Read-Out)
                </h4>
                <span className="text-[11px] text-slate-500">Tap voice button to read sentence</span>
              </div>

              <div className="space-y-2.5">
                {activeModalWord.examples.map((ex, i) => {
                  const modalExId = `modal-ex-${i}`;
                  const isExPlaying = playingAudioId === modalExId;

                  return (
                    <div 
                      key={i} 
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                        isExPlaying 
                          ? 'bg-blue-100/80 border-blue-400 text-blue-950 font-bold' 
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => handlePronounceAudio(ex, modalExId, 0.88)}
                        title="Listen to this sentence"
                        className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                          isExPlaying
                            ? 'bg-blue-600 text-white animate-pulse'
                            : 'bg-white text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-2xs'
                        }`}
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>

                      <div className="text-sm italic leading-relaxed flex-1 pt-0.5">
                        <span className="font-black text-blue-600 not-italic mr-2">#{i + 1}</span>
                        "{ex}"
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Synonyms & Antonyms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50/80 p-4 rounded-2xl border border-emerald-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-2">
                  Synonyms (Similar Meanings)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalWord.synonyms.map((syn, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-white text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold">
                      {syn}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-rose-50/80 p-4 rounded-2xl border border-rose-200">
                <h4 className="text-xs font-black uppercase tracking-wider text-rose-900 mb-2">
                  Antonyms (Opposite Meanings)
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeModalWord.antonyms.length > 0 ? (
                    activeModalWord.antonyms.map((ant, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-white text-rose-900 border border-rose-300 rounded-lg text-xs font-bold">
                        {ant}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-rose-600 italic">No direct opposite</span>
                  )}
                </div>
              </div>
            </div>

            {/* Cultural Lore / Fun Fact */}
            {activeModalWord.loreOrFunFact && (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 text-xs text-amber-950 space-y-1">
                <span className="font-black text-amber-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  Origin, Etymology & Fun Fact
                </span>
                <p className="leading-relaxed font-medium">{activeModalWord.loreOrFunFact}</p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <button
                id="modal-star-btn"
                onClick={() => {
                  onToggleStar(activeModalWord.id);
                  playSound('pop');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                  starredWordIds.includes(activeModalWord.id)
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                <Star className={`w-4 h-4 ${starredWordIds.includes(activeModalWord.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
                <span>{starredWordIds.includes(activeModalWord.id) ? 'Saved in Vault' : 'Save to Vault'}</span>
              </button>

              {onOpenAIBardWithWord && (
                <button
                  id="modal-generate-story-btn"
                  onClick={() => {
                    const w = activeModalWord;
                    setActiveModalWord(null);
                    onOpenAIBardWithWord(w);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-extrabold text-xs shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>Generate Story with Hamish AI</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
