import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Compass, Sparkles, Navigation } from 'lucide-react';
import { playSound } from '../utils/soundEffects';

interface AlphabetFancyScrubberProps {
  availableLetters: string[];
  activeLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
  subPrefixes?: { prefix: string; count: number; firstId: string }[];
  totalWordsCount: number;
}

export const AlphabetFancyScrubber: React.FC<AlphabetFancyScrubberProps> = ({
  availableLetters,
  activeLetter,
  onSelectLetter,
  subPrefixes = [],
  totalWordsCount,
}) => {
  const [activeScrolledLetter, setActiveScrolledLetter] = useState<string>(availableLetters[0] || 'A');
  const [showFloatingRail, setShowFloatingRail] = useState(false);

  // Monitor scroll to update active highlighted letter on side rail
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloatingRail(true);
      } else {
        setShowFloatingRail(false);
      }

      // Check which section is in viewport
      for (let i = availableLetters.length - 1; i >= 0; i--) {
        const letter = availableLetters[i];
        const el = document.getElementById(`letter-section-${letter}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160) {
            setActiveScrolledLetter(letter);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [availableLetters]);

  const scrollToLetterSection = (letter: string) => {
    playSound('click');
    const el = document.getElementById(`letter-section-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onSelectLetter(letter);
    }
  };

  const scrollToWordCard = (cardId: string) => {
    playSound('click');
    const el = document.getElementById(`word-card-${cardId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Temporary highlight pulse
      el.classList.add('ring-4', 'ring-blue-400', 'scale-[1.02]');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-blue-400', 'scale-[1.02]');
      }, 1200);
    }
  };

  return (
    <>
      {/* IN-LIST SUB-LETTER FANCY SCRUBBER (When a single letter or subset is active) */}
      {subPrefixes.length > 1 && (
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-3 border border-blue-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
              Quick In-Letter Jumper ({activeLetter ? `Words starting with ${activeLetter}` : 'Sub-sections'}):
            </span>
            <span className="text-[10px] font-extrabold text-indigo-700 bg-white/80 px-2 py-0.5 rounded-full border border-indigo-200">
              {subPrefixes.length} Sub-groups
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            {subPrefixes.map((sub) => (
              <button
                key={sub.prefix}
                onClick={() => scrollToWordCard(sub.firstId)}
                title={`Jump to words starting with "${sub.prefix}" (${sub.count} words)`}
                className="px-2.5 py-1.5 bg-white hover:bg-blue-600 hover:text-white text-slate-800 rounded-xl text-xs font-black border border-blue-200/80 shadow-2xs transition-all hover:scale-105 shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <span>{sub.prefix}</span>
                <span className="text-[10px] opacity-75 font-semibold">({sub.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FLOATING RIGHT-SIDE ALPHABET FAST-SCRUBBER (Desktop & Tablet) */}
      {showFloatingRail && availableLetters.length > 2 && (
        <div className="hidden lg:flex fixed right-3 top-1/2 -translate-y-1/2 z-40 flex-col items-center bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-xl max-h-[75vh] overflow-y-auto no-scrollbar space-y-0.5">
          <div className="text-[9px] font-black text-blue-600 uppercase mb-1 px-1 text-center">
            A–Z
          </div>
          {availableLetters.map((letter) => {
            const isCurrent = activeScrolledLetter === letter || activeLetter === letter;
            return (
              <button
                key={letter}
                onClick={() => scrollToLetterSection(letter)}
                title={`Scroll to letter ${letter}`}
                className={`w-6 h-6 rounded-lg text-[11px] font-black transition-all flex items-center justify-center cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs scale-110'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};
