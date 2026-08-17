import React, { useEffect, useState, useMemo, useRef } from 'react';
import { playSound } from '../utils/soundEffects';

interface PrefixItem {
  prefix: string;
  count: number;
  firstId: string;
  letter: string;
}

interface GlobalPageVerticalScrubberProps {
  entries: { id: string; word: string }[];
  onScrollToWord: (firstId: string) => void;
}

export const GlobalPageVerticalScrubber: React.FC<GlobalPageVerticalScrubberProps> = ({
  entries,
  onScrollToWord,
}) => {
  const [scrollPercent, setScrollPercent] = useState<number>(0);
  const [activeLetter, setActiveLetter] = useState<string>('A');
  const [activePrefix, setActivePrefix] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragPrefix, setDragPrefix] = useState<string>('');
  const [dragY, setDragY] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastPrefixRef = useRef<string>('');

  // Collect all 2-letter sub-prefixes in order across the whole dictionary
  const allPrefixItems = useMemo(() => {
    const list: PrefixItem[] = [];
    const prefixMap: Record<string, PrefixItem> = {};

    entries.forEach((e) => {
      const raw = e.word.trim();
      if (raw.length < 2) return;
      const letter = raw[0].toUpperCase();
      const prefix = raw.slice(0, 2).toLowerCase();

      if (!prefixMap[prefix]) {
        const item: PrefixItem = { prefix, count: 0, firstId: e.id, letter };
        prefixMap[prefix] = item;
        list.push(item);
      }
      prefixMap[prefix].count += 1;
    });

    return list;
  }, [entries]);

  // Track window scroll position to sync active thumb position and active prefix
  useEffect(() => {
    const handleScroll = () => {
      if (isDragging) return; // Don't fight drag updates

      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const percent = docHeight > 0 ? Math.min(100, Math.max(0, (currentScroll / docHeight) * 100)) : 0;
      setScrollPercent(percent);

      const scrollYTarget = window.scrollY + 200;

      // Find active letter section
      const letterSections = document.querySelectorAll<HTMLElement>('[id^="letter-section-"]');
      let currentLetter = 'A';

      letterSections.forEach((sec) => {
        const top = sec.offsetTop;
        const height = sec.offsetHeight;
        if (scrollYTarget >= top && scrollYTarget < top + height) {
          currentLetter = sec.id.replace('letter-section-', '');
        }
      });
      setActiveLetter(currentLetter);

      // Find active prefix
      for (let i = allPrefixItems.length - 1; i >= 0; i--) {
        const item = allPrefixItems[i];
        const el = document.getElementById(`word-card-${item.firstId}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 280) {
            setActivePrefix(item.prefix);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [allPrefixItems, isDragging]);

  if (allPrefixItems.length <= 1) {
    return null;
  }

  // Pointer Scrubbing Logic (Supports touch drag and mouse drag)
  const scrubToY = (clientY: number) => {
    if (!containerRef.current || allPrefixItems.length === 0) return;

    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = Math.min(rect.height, Math.max(0, clientY - rect.top));
    const ratio = relativeY / rect.height;

    const index = Math.min(
      allPrefixItems.length - 1,
      Math.max(0, Math.floor(ratio * allPrefixItems.length))
    );

    const targetItem = allPrefixItems[index];
    if (targetItem) {
      setDragY(relativeY);
      setDragPrefix(targetItem.prefix);
      setActiveLetter(targetItem.letter);

      if (lastPrefixRef.current !== targetItem.prefix) {
        lastPrefixRef.current = targetItem.prefix;
        playSound('click');
        onScrollToWord(targetItem.firstId);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    scrubToY(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      scrubToY(e.clientY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDragging(false);
      lastPrefixRef.current = '';
    }
  };

  return (
    <div className="fixed right-0 top-16 bottom-4 z-40 flex items-center justify-end select-none pointer-events-none">
      {/* Interactive Scrubbing Bar Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="pointer-events-auto relative w-7 sm:w-8 h-full flex flex-col items-center justify-between py-2 cursor-pointer touch-none bg-slate-900/10 hover:bg-slate-900/85 text-slate-600 hover:text-white backdrop-blur-xs rounded-l-2xl border-l border-y border-slate-300/40 hover:border-slate-700/80 transition-colors duration-200 group/scrubber"
      >
        {/* Large Floating Magnifier Bubble when Dragging/Hovering */}
        {(isDragging || dragPrefix) && (
          <div
            className="absolute right-full mr-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-2xl border border-slate-700 text-sm font-black whitespace-nowrap pointer-events-none transition-all duration-75"
            style={{
              top: `${isDragging ? dragY : (scrollPercent * 0.92)}px`,
              transform: 'translateY(-50%)',
            }}
          >
            <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {activeLetter}
            </span>
            <span className="lowercase font-extrabold text-blue-300 tracking-tight text-base">
              {isDragging ? dragPrefix : activePrefix}
            </span>
            {/* Pointer indicator arrow */}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-y-6 border-y-transparent border-l-8 border-l-slate-900" />
          </div>
        )}

        {/* List of sub-prefixes spaced out along the bar */}
        <div className="w-full h-full flex flex-col justify-between items-center py-1 overflow-hidden">
          {allPrefixItems.map((item, idx) => {
            const isActive = (isDragging ? dragPrefix : activePrefix) === item.prefix;

            // Render clear sub-prefix text or dots to prevent overcrowding
            const total = allPrefixItems.length;
            const step = Math.ceil(total / 24);
            const isLabelVisible = idx % step === 0 || isActive;

            return (
              <div
                key={item.prefix}
                className="w-full flex items-center justify-center text-center relative"
              >
                {isLabelVisible ? (
                  <span
                    className={`text-[9px] font-black tracking-tighter lowercase leading-none transition-all ${
                      isActive
                        ? 'text-blue-500 font-black scale-130 text-[11px]'
                        : 'text-slate-600 group-hover/scrubber:text-slate-300'
                    }`}
                  >
                    {item.prefix}
                  </span>
                ) : (
                  <span
                    className={`w-1 h-1 rounded-full transition-all ${
                      isActive ? 'bg-blue-500 scale-150' : 'bg-slate-400/40 group-hover/scrubber:bg-slate-500'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Active Scroll Position Thumb Bar */}
        <div
          className="absolute right-0.5 w-1 rounded-full bg-blue-600 transition-all duration-75"
          style={{
            top: `${scrollPercent * 0.95}%`,
            height: '24px',
          }}
        />
      </div>
    </div>
  );
};
