import React, { useEffect, useState, useMemo, useRef } from 'react';
import { ChevronRight, ChevronLeft, ArrowUpDown } from 'lucide-react';
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

const STORAGE_KEY = 'weevocab_scrubber_collapsed_v1';

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

  // Initialize collapsed state: default to collapsed on mobile (<768px) to prevent accidental touches
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {
      // ignore
    }
    // Mobile default: collapsed so kids don't accidentally touch it while scrolling
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const lastPrefixRef = useRef<string>('');

  const toggleCollapse = (newVal?: boolean) => {
    const nextVal = typeof newVal === 'boolean' ? newVal : !isCollapsed;
    setIsCollapsed(nextVal);
    playSound('pop');
    try {
      localStorage.setItem(STORAGE_KEY, String(nextVal));
    } catch {
      // ignore
    }
  };

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

      const scrollYTarget = window.scrollY + 220;

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
    <>
      {/* 1. COLLAPSED FLOATING TAB (Discreet and completely safe against accidental touches) */}
      {isCollapsed && (
        <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-auto">
          <button
            id="open-scrubber-tab-btn"
            onClick={() => toggleCollapse(false)}
            title="Open A-Z Fast Scrubber (jump to any letter)"
            aria-label="Open A-Z Fast Scrubber"
            className="group flex flex-col items-center gap-1.5 py-3 px-1.5 sm:px-2 bg-[#14281f]/95 hover:bg-emerald-800 text-amber-100 shadow-xl rounded-l-2xl border-l-2 border-y border-emerald-700/80 hover:border-amber-400/70 backdrop-blur-md transition-all duration-200 cursor-pointer active:scale-95"
          >
            <div className="flex items-center gap-0.5 text-amber-300 group-hover:text-amber-100 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5 stroke-[3]" />
              <span className="text-[10px] font-black uppercase tracking-wider">A-Z</span>
            </div>
            
            {/* Current letter indicator bubble */}
            <span className="w-6 h-6 rounded-lg bg-emerald-700 group-hover:bg-amber-400 text-amber-100 group-hover:text-emerald-950 font-black text-xs flex items-center justify-center shadow-xs transition-colors border border-emerald-600">
              {activeLetter}
            </span>

            <ArrowUpDown className="w-3 h-3 text-emerald-400 group-hover:text-amber-200" />
          </button>
        </div>
      )}

      {/* 2. EXPANDED FULL-HEIGHT SCRUBBER */}
      {!isCollapsed && (
        <div className="fixed right-0 top-16 bottom-4 z-40 flex items-center justify-end select-none pointer-events-none animate-in fade-in slide-in-from-right-4 duration-200 pr-0">
          <div className="pointer-events-auto relative flex flex-col items-center h-full bg-[#14281f]/95 text-amber-100 backdrop-blur-md rounded-l-2xl border-l-2 border-t-2 border-b-2 border-emerald-700/90 shadow-2xl transition-all duration-200 overflow-hidden">
            {/* Top Collapse Button Header */}
            <div className="w-full pt-1.5 pb-1 px-1 flex flex-col items-center border-b border-emerald-800 bg-[#0f2018]/90">
              <button
                id="collapse-scrubber-btn"
                onClick={() => toggleCollapse(true)}
                title="Collapse Scrubber (prevents accidental touch on mobile)"
                aria-label="Collapse Scrubber"
                className="p-1 rounded-lg bg-emerald-900/90 hover:bg-rose-900/80 text-emerald-300 hover:text-white transition-colors cursor-pointer border border-emerald-700/60"
              >
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
              <span className="text-[8px] font-black text-amber-300 uppercase tracking-tighter mt-0.5">
                A–Z
              </span>
            </div>

            {/* Interactive Scrubbing Bar Track */}
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="relative w-7 sm:w-8 flex-1 flex flex-col items-center justify-between py-1.5 cursor-pointer touch-none text-emerald-200 hover:text-amber-100 transition-colors group/scrubber"
            >
              {/* Large Floating Magnifier Bubble when Dragging/Hovering */}
              {(isDragging || dragPrefix) && (
                <div
                  className="absolute right-full mr-3 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14281f] text-amber-100 shadow-2xl border border-emerald-700 text-sm font-black whitespace-nowrap pointer-events-none transition-all duration-75"
                  style={{
                    top: `${isDragging ? dragY : (scrollPercent * 0.90)}px`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  <span className="w-6 h-6 rounded-lg bg-emerald-700 text-amber-200 font-black text-xs flex items-center justify-center shadow-xs border border-emerald-600">
                    {activeLetter}
                  </span>
                  <span className="lowercase font-extrabold text-amber-300 tracking-tight text-base">
                    {isDragging ? dragPrefix : activePrefix}
                  </span>
                  {/* Pointer indicator arrow */}
                  <div className="absolute left-full top-1/2 -translate-y-1/2 border-y-6 border-y-transparent border-l-8 border-l-[#14281f]" />
                </div>
              )}

              {/* List of sub-prefixes spaced out along the bar */}
              <div className="w-full h-full flex flex-col justify-between items-center py-1 overflow-hidden">
                {allPrefixItems.map((item, idx) => {
                  const isActive = (isDragging ? dragPrefix : activePrefix) === item.prefix;

                  // Render clear sub-prefix text or dots to prevent overcrowding
                  const total = allPrefixItems.length;
                  const step = Math.ceil(total / 22);
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
                              ? 'text-amber-300 font-black scale-130 text-[11px]'
                              : 'text-emerald-400 group-hover/scrubber:text-emerald-100'
                          }`}
                        >
                          {item.prefix}
                        </span>
                      ) : (
                        <span
                          className={`w-1 h-1 rounded-full transition-all ${
                            isActive ? 'bg-amber-300 scale-150' : 'bg-emerald-800 group-hover/scrubber:bg-emerald-600'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active Scroll Position Thumb Bar */}
              <div
                className="absolute right-0.5 w-1 rounded-full bg-amber-400 transition-all duration-75 shadow-xs"
                style={{
                  top: `${scrollPercent * 0.94}%`,
                  height: '24px',
                }}
              />
            </div>

            {/* Bottom quick close */}
            <div className="w-full pb-1.5 pt-1 flex justify-center border-t border-emerald-900">
              <button
                onClick={() => toggleCollapse(true)}
                title="Hide A-Z Scrubber"
                aria-label="Hide A-Z Scrubber"
                className="text-[9px] text-emerald-400 hover:text-amber-200 font-black px-1 py-0.5 hover:underline cursor-pointer"
              >
                Hide
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
