import React, { useState, useEffect } from 'react';
import { ArrowUp, Rocket } from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 220) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    playSound('pop');
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      id="scroll-to-top-btn"
      onClick={scrollToTop}
      aria-label="Move to top of page"
      title="Move to top"
      className="fixed bottom-6 right-5 sm:bottom-8 sm:right-8 z-40 flex items-center gap-1.5 px-3.5 py-3 sm:px-4 sm:py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-blue-900/30 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/60 focus:outline-hidden focus:ring-4 focus:ring-blue-300 animate-in fade-in slide-in-from-bottom-5 cursor-pointer select-none group"
    >
      <div className="p-1 bg-white/20 rounded-full group-hover:-translate-y-0.5 transition-transform">
        <ArrowUp className="w-4 h-4 stroke-[3]" />
      </div>
      <span className="hidden sm:inline tracking-wide font-black">Top</span>
    </button>
  );
};
