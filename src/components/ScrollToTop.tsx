import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { playSound } from '../utils/soundEffects';

export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Show when scrolled down more than 150px
      if (window.scrollY > 150) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    // Check initial scroll position
    toggleVisibility();
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
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 p-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-blue-900/40 hover:scale-110 active:scale-95 transition-all duration-200 border-2 border-white/80 focus:outline-hidden focus:ring-4 focus:ring-blue-300 cursor-pointer select-none group"
    >
      <ArrowUp className="w-5 h-5 stroke-[3] group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
};
