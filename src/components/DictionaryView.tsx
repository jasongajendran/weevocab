import React, { useState, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Search, Volume2, Mic, MicOff, Star, Sparkles, Shuffle, X, 
  BookOpen, ChevronRight, CheckCircle2, AlertCircle, BookmarkCheck,
  Tag, MapPin, Layers, GraduationCap, ChevronDown, ChevronUp,
  Eye, EyeOff, VolumeX, Radio, Compass, Filter, ChevronLeft, ArrowUp,
  Rows, Columns2, Columns3
} from 'lucide-react';
import { DictionaryEntry, WordCategory, ScottishRegion } from '../types/dictionary';
import { speakWord, speakSentence, cancelSpeech, startVoicePractice, isSpeechRecognitionSupported, RecognitionResult } from '../utils/speech';
import { playSound } from '../utils/soundEffects';
import { GlobalPageVerticalScrubber } from './GlobalPageVerticalScrubber';
import { HighlightedText } from '../utils/textHighlight';
import { WordStudyModal } from './WordStudyModal';
import { SoundWaveIcon } from './SoundWaveIcon';

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
  
  // Layout column mode: '1' (1 word per row - large font, best for tablets/reading), '2' (2 cols), '3' (3 cols)
  const [layoutColumns, setLayoutColumns] = useState<'1' | '2' | '3'>(() => {
    return (localStorage.getItem('scots_dict_layout_cols') as '1' | '2' | '3') || '1';
  });

  const handleLayoutChange = (cols: '1' | '2' | '3') => {
    setLayoutColumns(cols);
    localStorage.setItem('scots_dict_layout_cols', cols);
    playSound('click');
  };

  // Distraction-Free / Focus Mode toggle
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Collapsible Filters toggle (kept collapsed on initial load as requested)
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  // Audio playing state indicator for words/examples
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Voice Practice State in Modal
  const [isRecording, setIsRecording] = useState(false);
  const [voiceResult, setVoiceResult] = useState<RecognitionResult | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  // Refs for smooth manual scrubbing
  const alphabetBarRef = useRef<HTMLDivElement>(null);

  const scrollAlphabetBar = (direction: 'left' | 'right') => {
    if (alphabetBarRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      alphabetBarRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      playSound('click');
    }
  };

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

  // Distinct available letters in the current filtered set
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    filteredEntries.forEach(e => {
      if (e.word[0]) set.add(e.word[0].toUpperCase());
    });
    return Array.from(set).sort();
  }, [filteredEntries]);

  // Group filtered entries by starting letter
  const groupedByLetter = useMemo(() => {
    const groups: { letter: string; entries: DictionaryEntry[] }[] = [];
    const map: Record<string, DictionaryEntry[]> = {};
    filteredEntries.forEach(entry => {
      const letter = entry.word[0]?.toUpperCase() || '#';
      if (!map[letter]) map[letter] = [];
      map[letter].push(entry);
    });
    Object.keys(map).sort().forEach(letter => {
      groups.push({ letter, entries: map[letter] });
    });
    return groups;
  }, [filteredEntries]);

  // Compute 2-letter sub-prefixes (e.g. ba, be, bi, bl, br...) for instant vertical scrubber navigation
  const prefixItems = useMemo(() => {
    if (filteredEntries.length <= 1) return [];
    const map: Record<string, { prefix: string; count: number; firstId: string }> = {};
    filteredEntries.forEach(e => {
      const raw = e.word.trim();
      if (raw.length < 2) return;
      const prefix = raw.slice(0, 2).toLowerCase();
      if (!map[prefix]) {
        map[prefix] = { prefix, count: 0, firstId: e.id };
      }
      map[prefix].count += 1;
    });
    return Object.values(map).sort((a, b) => a.prefix.localeCompare(b.prefix));
  }, [filteredEntries]);

  const scrollToWordCard = (cardId: string) => {
    playSound('click');
    const el = document.getElementById(`word-card-${cardId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-blue-400', 'scale-[1.02]');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-blue-400', 'scale-[1.02]');
      }, 1200);
    }
  };

  // Random word
  const handleRandomWord = () => {
    if (entries.length === 0) return;
    const random = entries[Math.floor(Math.random() * entries.length)];
    playSound('pop');
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']
    });
    setActiveModalWord(random);
  };

  // Speak word or sentence with active animation feedback
  const handlePronounceAudio = (text: string, audioId: string, rate: number = 0.9) => {
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
          playSound('celebrate');
          confetti({
            particleCount: 70,
            spread: 70,
            origin: { y: 0.55 },
            colors: ['#10b981', '#3b82f6', '#fbbf24', '#a855f7']
          });
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

  // Helper for Category Styling & Badges with rich vibrant kid-friendly colors
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
        badgeBg: 'bg-indigo-950/80 text-indigo-300 border-indigo-600/50 font-bold',
        flag: '🎓 Scholar',
        accentBar: 'border-t-4 border-t-indigo-500',
        exBorder: 'border-l-indigo-500 bg-slate-800/70',
        titleHover: 'group-hover:text-indigo-300',
        studyBtn: 'bg-slate-800 hover:bg-slate-750 text-indigo-300 border-indigo-500/40 hover:border-indigo-400 shadow-2xs',
        studyIconBg: 'bg-indigo-600 text-white',
        studyChevron: 'text-indigo-400',
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
      return <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-purple-950/80 text-purple-300 border border-purple-700/60">adv.</span>;
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
    return <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-950/80 text-purple-300 border border-purple-700/60">🟣 S3–S4</span>;
  };

  return (
    <div className="space-y-5 pb-24 sm:pb-8">
      
      {/* Top Header & Search Hub - Vibrant, Cheerful & Kid-Friendly */}
      {!isFocusMode ? (
        <div className="bg-slate-900/95 rounded-3xl p-3.5 sm:p-4 text-white shadow-md border border-slate-800 space-y-3">
          {/* Top Bar: Identity on Left, Action Controls on Right */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">📖</span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-amber-300 tracking-tight">
                    British & Scottish Vocabulary
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-slate-800 text-slate-200 border border-slate-700">
                    {filteredEntries.length} terms
                  </span>
                </div>
              </div>
            </div>

            {/* Aligned Right Controls: Surprise Word, Layout Selector & Focus Mode */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Quick Surprise Word Button */}
              <button
                id="random-word-btn"
                onClick={handleRandomWord}
                title="Explore a random Scottish or British term"
                className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all whitespace-nowrap cursor-pointer border border-amber-300 shrink-0 hover:scale-[1.03]"
              >
                <Shuffle className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
                <span>Surprise Word! 🎲</span>
              </button>

              {/* Layout Mode Selector */}
              <div className="flex items-center gap-0.5 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
                <button
                  id="top-layout-1-col-btn"
                  onClick={() => handleLayoutChange('1')}
                  title="1 Word per Row (Large & Easy Read on Tablet)"
                  aria-label="1 Word per Row"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    layoutColumns === '1'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Rows className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">1 / row</span>
                </button>
                <button
                  id="top-layout-2-col-btn"
                  onClick={() => handleLayoutChange('2')}
                  title="2 Words per Row (Split Columns Grid)"
                  aria-label="2 Words per Row"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    layoutColumns === '2'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">2 cols</span>
                </button>
                <button
                  id="top-layout-3-col-btn"
                  onClick={() => handleLayoutChange('3')}
                  title="3 Words per Row (Compact Grid)"
                  aria-label="3 Words per Row"
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    layoutColumns === '3'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">3 cols</span>
                </button>
              </div>

              {/* Focus Mode Toggle */}
              <button
                id="toggle-focus-mode-btn"
                onClick={() => {
                  setIsFocusMode(!isFocusMode);
                  playSound('pop');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
                title="Hide distractions for peaceful reading"
              >
                <EyeOff className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Distraction Free</span>
              </button>
            </div>
          </div>

          {/* Unified Search Input Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="dictionary-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search word, meaning, or slang (e.g. chuffed, dreich, braw, analyse)..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-950 text-slate-100 placeholder:text-slate-500 font-bold text-xs sm:text-sm shadow-xs border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                id="clear-search-btn"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Focus Mode Simple Header */
        <div className="flex items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-xs">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="focus-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type any word or meaning to search..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-950 text-slate-100 placeholder:text-slate-500 font-semibold text-xs sm:text-sm border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            id="exit-focus-mode-btn"
            onClick={() => {
              setIsFocusMode(false);
              playSound('pop');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Full Hub</span>
          </button>
        </div>
      )}

      {/* A to Z Alphabet Navigation Bar (Mobile Swipeable & Touch Optimized) */}
      <div className="bg-slate-900/90 rounded-2xl p-3.5 sm:p-4 shadow-xs border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              A–Z Alphabet Scroller:
            </span>
            {selectedLetter && (
              <button
                id="clear-letter-filter-btn"
                onClick={() => {
                  setSelectedLetter(null);
                  playSound('click');
                }}
                className="text-xs font-black text-emerald-300 hover:text-emerald-200 hover:underline px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700/60"
              >
                Show All (A–Z) ✕
              </button>
            )}
          </div>

          {/* Left/Right scroll buttons for smooth manual alphabet scrubbing */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollAlphabetBar('left')}
              title="Scroll A-Z left"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-2xs cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => scrollAlphabetBar('right')}
              title="Scroll A-Z right"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 shadow-2xs cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Swipeable Horizontal Alphabet Pill Bar with visible custom scrollbar and smooth touch scrolling */}
        <div
          ref={alphabetBarRef}
          className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pt-2 pb-3 px-1 scroll-smooth custom-scrollbar"
        >
          <button
            id="alphabet-all-btn"
            onClick={() => {
              setSelectedLetter(null);
              playSound('click');
            }}
            className={`px-4 py-2 min-h-[40px] rounded-xl font-black text-xs sm:text-sm whitespace-nowrap transition-all shrink-0 cursor-pointer ${
              selectedLetter === null
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md ring-2 ring-emerald-400'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
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
                className={`relative px-3.5 py-2 min-h-[40px] min-w-[40px] rounded-xl font-black text-xs sm:text-sm transition-all shrink-0 cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-md ring-2 ring-amber-400 border-2 border-emerald-400'
                    : count > 0
                    ? 'bg-slate-800 text-slate-200 hover:bg-slate-750 hover:text-white hover:border-slate-600 border border-slate-700 shadow-2xs'
                    : 'bg-slate-900/40 text-slate-600 cursor-not-allowed opacity-30 border border-slate-850'
                }`}
                title={count > 0 ? `${count} word${count > 1 ? 's' : ''} starting with ${letter}` : `No words starting with ${letter}`}
              >
                <span className="text-sm">{letter}</span>
                {count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-900 text-slate-300 border border-slate-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Filter Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xs overflow-hidden transition-all">
        {/* Accordion Header */}
        <div 
          onClick={() => {
            setIsFilterOpen(!isFilterOpen);
            playSound('click');
          }}
          className="flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-850 cursor-pointer border-b border-slate-800 select-none transition-colors"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/50">
              <Filter className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-200">
              Filter Categories & Regions
            </span>
            {activeFiltersCount > 0 && (
              <span className="px-2.5 py-0.5 text-[11px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-full shadow-2xs">
                {activeFiltersCount} Active
              </span>
            )}
            {!isFilterOpen && (
              <span className="text-xs text-slate-400 font-bold truncate max-w-[200px] sm:max-w-md hidden sm:inline">
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
                className="text-xs font-black text-amber-300 hover:text-amber-200 hover:underline px-2 py-1 cursor-pointer"
              >
                Reset All
              </button>
            )}
            <button
              id="filter-accordion-toggle-btn"
              aria-label={isFilterOpen ? 'Collapse filter section' : 'Expand filter section'}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"
            >
              {isFilterOpen ? <ChevronUp className="w-4 h-4 text-slate-200 font-bold" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isFilterOpen && (
          <div className="p-4 space-y-3.5 animate-in fade-in duration-150">
            {/* Category Filter Chips */}
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Vocabulary Categories:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '🌿 All Categories', value: 'All', activeClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm ring-2 ring-emerald-400', normalClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' },
                  { label: '🇬🇧 UK Common & Slang', value: 'UK Common', activeClass: 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm ring-2 ring-amber-300', normalClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' },
                  { label: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots & Regional', value: 'Scots Slang', activeClass: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm ring-2 ring-sky-400', normalClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' },
                  { label: '🎓 Academic & Power', value: 'Academic', activeClass: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm ring-2 ring-indigo-400', normalClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' },
                  { label: '🏫 School & Banter', value: 'School & Banter', activeClass: 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-sm ring-2 ring-teal-400', normalClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' },
                  { label: '🌲 Nature & Places', value: 'Nature & Places', activeClass: 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-sm ring-2 ring-cyan-400', normalClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' },
                  { label: '🍲 Food & Culture', value: 'Food & Culture', activeClass: 'bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-sm ring-2 ring-rose-400', normalClass: 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700' },
                ].map(cat => (
                  <button
                    key={cat.value}
                    id={`filter-cat-${cat.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      playSound('click');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                      selectedCategory === cat.value
                        ? `${cat.activeClass} scale-105 ring-2 ring-emerald-400`
                        : `${cat.normalClass}`
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Region & Difficulty Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2.5 bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-700">
                <div className="p-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                  <MapPin className="w-4 h-4 shrink-0" />
                </div>
                <div className="flex-1">
                  <label htmlFor="region-filter-select" className="text-[10px] font-black text-emerald-400 uppercase block">
                    Region
                  </label>
                  <select
                    id="region-filter-select"
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    aria-label="Filter by UK or Scottish region"
                    className="w-full bg-slate-900 font-bold text-slate-200 border border-slate-700 rounded-md px-1.5 py-1 focus:outline-hidden text-xs cursor-pointer"
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

              <div className="flex items-center gap-2.5 bg-slate-800/80 px-3.5 py-2.5 rounded-xl border border-slate-700">
                <div className="p-1 rounded-lg bg-lime-950 text-lime-300 border border-lime-700/50">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                </div>
                <div className="flex-1">
                  <label htmlFor="difficulty-filter-select" className="text-[10px] font-black text-lime-400 uppercase block">
                    School Stage
                  </label>
                  <select
                    id="difficulty-filter-select"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    aria-label="Filter by school stage and difficulty"
                    className="w-full bg-slate-900 font-bold text-slate-200 border border-slate-700 rounded-md px-1.5 py-1 focus:outline-hidden text-xs cursor-pointer"
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

      {/* Results Count & Active Filters Bar - Crystal Clear, High Contrast & Calibrated */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-300 px-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-300 font-medium">
            Showing <strong className="font-black text-amber-300">{filteredEntries.length}</strong> of <strong className="font-black text-slate-100">{entries.length}</strong> terms
          </span>
          {selectedLetter && <span className="text-slate-400"> • Letter <strong className="text-emerald-300 font-bold">'{selectedLetter}'</strong></span>}
          {searchQuery && <span className="text-slate-400"> • Matching <strong className="text-emerald-300 font-bold">"{searchQuery}"</strong></span>}
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
              className="ml-1 text-amber-300 hover:text-amber-200 font-bold hover:underline cursor-pointer bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-600/50"
            >
              Clear Filters ✕
            </button>
          )}
        </div>

        {/* Informative column layout indicator */}
        <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-400">
          <span>View: </span>
          <span className="font-black text-slate-200">
            {layoutColumns === '1' ? '1 Word / Row (Reader)' : layoutColumns === '2' ? '2 Columns Grid' : '3 Columns Grid'}
          </span>
        </div>
      </div>

      {/* Global Page Vertical Scrubber pinned to whole page scroll on right edge (hidden during active modal study to prevent touch conflicts) */}
      {!activeModalWord && (
        <GlobalPageVerticalScrubber
          entries={filteredEntries}
          onScrollToWord={scrollToWordCard}
        />
      )}

      {/* Word Cards Grid / Grouped Sections */}
      {filteredEntries.length === 0 ? (
        <div className="bg-slate-900 rounded-3xl p-10 text-center border border-slate-800 shadow-xs max-w-md mx-auto">
          <div className="w-16 h-16 bg-slate-800 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl">
            🔍
          </div>
          <h3 className="text-lg font-black text-white mb-1">No words match your filters</h3>
          <p className="text-xs text-slate-400 mb-4">
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
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedByLetter.map((group) => {
            const gridClasses = 
              layoutColumns === '1'
                ? 'grid grid-cols-1 gap-6 max-w-4xl mx-auto w-full'
                : layoutColumns === '2'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 w-full'
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 w-full';

            return (
              <div key={group.letter} id={`letter-section-${group.letter}`} className="relative space-y-3.5 scroll-mt-24">
                {/* Section Header with anchor and count */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 pt-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white font-black text-base sm:text-lg flex items-center justify-center shadow-xs">
                      {group.letter}
                    </span>
                    <span className="font-extrabold text-slate-100 text-sm sm:text-base">
                      Letter {group.letter}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {group.entries.length} {group.entries.length === 1 ? 'word' : 'words'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      playSound('click');
                    }}
                    title="Move to top"
                    aria-label="Move to top"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Grid of cards for this letter group formatted with responsive layout */}
                <div className={gridClasses}>
                {group.entries.map((entry) => {
            const isStarred = starredWordIds.includes(entry.id);
            const theme = getCategoryTheme(entry);
            const isWordPlaying = playingAudioId === `word-${entry.id}`;

            return (
              <div
                key={entry.id}
                id={`word-card-${entry.id}`}
                className={`bg-slate-900/90 rounded-3xl border border-slate-800 hover:border-slate-600 hover:shadow-lg transition-all duration-250 flex flex-col justify-between group ${theme.accentBar} ${
                  layoutColumns === '1' ? 'p-6 sm:p-7 shadow-2xs' : 'p-5 shadow-2xs'
                }`}
              >
                <div>
                  {/* Top Bar: Word, Badges & Bookmark on Left; Audio Icon Aligned in Straight Vertical Column */}
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

                    {/* 1. Word Pronunciation Sound Icon (Vertical Alignment Guide 1/4) */}
                    <button
                      id={`word-sound-btn-${entry.id}`}
                      onClick={() => handlePronounceAudio(entry.word, `word-${entry.id}`, 0.9)}
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
                  {(() => {
                    const isDefPlaying = playingAudioId === `card-def-${entry.id}`;
                    return (
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
                          onClick={() => handlePronounceAudio(entry.definition, `card-def-${entry.id}`, 0.9)}
                          title="Listen to definition"
                          aria-label={`Listen to definition: ${entry.definition}`}
                          className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                            isDefPlaying
                              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                              : 'bg-slate-900 text-slate-300 hover:bg-emerald-600 hover:text-white shadow-2xs border border-slate-700 hover:scale-105 active:scale-95'
                          }`}
                        >
                          <SoundWaveIcon isPlaying={isDefPlaying} size="sm" />
                        </button>
                      </div>
                    );
                  })()}

                  {/* Example Sentences */}
                  <div className="space-y-2 mb-3.5">
                    {entry.examples.map((ex, idx) => {
                      const exAudioId = `card-${entry.id}-ex-${idx}`;
                      const isExPlaying = playingAudioId === exAudioId;

                      return (
                        <div 
                          key={idx} 
                          className={`flex items-start justify-between gap-3 p-3 sm:p-3.5 rounded-2xl border transition-all shadow-2xs ${
                            isExPlaying 
                              ? 'bg-slate-800 border-l-4 border-l-amber-400 border-slate-700 text-slate-100 font-bold' 
                              : `${theme.exBorder} border-slate-750 text-slate-200`
                          }`}
                        >
                          <p className={`italic leading-relaxed flex-1 min-w-0 pt-0.5 font-medium ${
                            layoutColumns === '1' ? 'text-sm sm:text-base' : 'text-xs'
                          }`}>
                            "<HighlightedText text={ex} targetWord={entry.word} />"
                          </p>

                          {/* Example Sound Button */}
                          <button
                            id={`read-ex-${entry.id}-${idx}`}
                            onClick={() => handlePronounceAudio(ex, exAudioId, 0.88)}
                            title="Listen to this example sentence"
                            aria-label={`Listen to example sentence: ${ex}`}
                            className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center transition-all shrink-0 cursor-pointer ${
                              isExPlaying
                                ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                                : 'bg-slate-900 text-slate-300 hover:bg-amber-400 hover:text-slate-950 shadow-2xs border border-slate-700 hover:scale-105 active:scale-95'
                            }`}
                          >
                            <SoundWaveIcon isPlaying={isExPlaying} size="sm" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Synonyms & Antonyms preview tags */}
                  {(entry.synonyms.length > 0 || entry.antonyms.length > 0) && (
                    <div className="space-y-2 text-xs mb-3.5">
                      {entry.synonyms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-emerald-400 text-[11px] flex items-center gap-1">
                            ✨ Synonyms:
                          </span>
                          {entry.synonyms.map((syn, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSearchQuery(syn)}
                              className="px-2.5 py-0.5 bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 rounded-lg text-[11px] font-bold hover:bg-emerald-900 hover:scale-105 cursor-pointer transition-all shadow-2xs"
                            >
                              {syn}
                            </button>
                          ))}
                        </div>
                      )}

                      {entry.antonyms.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-amber-400 text-[11px] flex items-center gap-1">
                            ⚡ Antonyms:
                          </span>
                          {entry.antonyms.map((ant, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSearchQuery(ant)}
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
                      setActiveModalWord(entry);
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
          })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deep Word Study Modal (Exclusive Non-Duplicate Content) */}
      {activeModalWord && (
        <WordStudyModal
          word={activeModalWord}
          allEntries={entries}
          isStarred={starredWordIds.includes(activeModalWord.id)}
          onToggleStar={() => onToggleStar(activeModalWord.id)}
          onClose={() => setActiveModalWord(null)}
          onOpenAIBard={onOpenAIBardWithWord}
          playingAudioId={playingAudioId}
          onPlayAudio={handlePronounceAudio}
        />
      )}
    </div>
  );
};
