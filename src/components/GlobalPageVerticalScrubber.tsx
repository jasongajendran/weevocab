import React, { useEffect, useState, useMemo } from 'react';
import { playSound } from '../utils/soundEffects';

interface PrefixItem {
  prefix: string;
  count: number;
  firstId: string;
}

interface GlobalPageVerticalScrubberProps {
  entries: { id: string; word: string }[];
  onScrollToWord: (firstId: string) => void;
}

export const GlobalPageVerticalScrubber: React.FC<GlobalPageVerticalScrubberProps> = ({
  entries,
  onScrollToWord,
}) => {
  const [activeLetter, setActiveLetter] = useState<string>('A');
  const [activePrefix, setActivePrefix] = useState<string>('');

  // Group all 2-letter sub-prefixes by their starting letter
  const subPrefixesByLetter = useMemo(() => {
    const map: Record<string, PrefixItem[]> = {};
    const prefixSeen: Record<string, { prefix: string; count: number; firstId: string }> = {};

    entries.forEach((e) => {
      const raw = e.word.trim();
      if (raw.length < 2) return;
      const firstLetter = raw[0].toUpperCase();
      const prefix = raw.slice(0, 2).toLowerCase();

      if (!prefixSeen[prefix]) {
        prefixSeen[prefix] = { prefix, count: 0, firstId: e.id };
      }
      prefixSeen[prefix].count += 1;

      if (!map[firstLetter]) {
        map[firstLetter] = [];
      }
    });

    // Populate sorted prefix items for each letter
    Object.values(prefixSeen).forEach((item) => {
      const letter = item.prefix[0].toUpperCase();
      if (map[letter] && !map[letter].some((p) => p.prefix === item.prefix)) {
        map[letter].push(item);
      }
    });

    Object.keys(map).forEach((letter) => {
      map[letter].sort((a, b) => a.prefix.localeCompare(b.prefix));
    });

    return map;
  }, [entries]);

  // Track window scroll position to determine which letter & prefix is currently active
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 200;

      // Find active letter section
      const letterSections = document.querySelectorAll<HTMLElement>('[id^="letter-section-"]');
      let currentLetter = activeLetter;

      letterSections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollY >= top && scrollY < top + height) {
          const l = sec.id.replace('letter-section-', '');
          currentLetter = l;
        }
      });

      if (currentLetter !== activeLetter) {
        setActiveLetter(currentLetter);
      }

      // Find active word card prefix
      const currentPrefixes = subPrefixesByLetter[currentLetter] || [];
      for (let i = currentPrefixes.length - 1; i >= 0; i--) {
        const item = currentPrefixes[i];
        const el = document.getElementById(`word-card-${item.firstId}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 300) {
            setActivePrefix(item.prefix);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeLetter, subPrefixesByLetter]);

  const currentPrefixes = subPrefixesByLetter[activeLetter] || [];

  if (currentPrefixes.length <= 1) {
    return null;
  }

  return (
    <div
      className="fixed right-1 sm:right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center py-1.5 px-1 rounded-2xl bg-white/70 hover:bg-white/95 backdrop-blur-md shadow-lg border border-slate-200/80 transition-all duration-200 select-none group/scrubber"
      style={{ touchAction: 'none' }}
    >
      {/* Current Active Letter Badge */}
      <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black text-[10px] flex items-center justify-center shadow-2xs mb-1">
        {activeLetter}
      </div>

      <div className="w-3/4 h-px bg-slate-200 my-0.5" />

      {/* Vertical list of sub-prefixes for the section currently in view */}
      <div className="flex flex-col items-center gap-0.5 max-h-[58vh] overflow-y-auto no-scrollbar py-0.5">
        {currentPrefixes.map((item) => {
          const isActive = activePrefix === item.prefix;
          return (
            <button
              key={item.prefix}
              onClick={() => {
                playSound('click');
                setActivePrefix(item.prefix);
                onScrollToWord(item.firstId);
              }}
              title={`Jump to "${item.prefix}" (${item.count} words)`}
              className={`w-6 h-6 rounded-md text-[10px] font-black lowercase tracking-tighter flex items-center justify-center transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs scale-110 font-black'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50 font-extrabold'
              }`}
            >
              {item.prefix}
            </button>
          );
        })}
      </div>
    </div>
  );
};
