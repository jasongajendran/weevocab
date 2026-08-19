import React from 'react';
import { BookOpen, Gamepad2, Sparkles, Flame, Volume2, VolumeX, Wifi, WifiOff, Star, Award } from 'lucide-react';
import { UserProgress } from '../types/dictionary';

interface NavbarProps {
  activeTab: 'dictionary' | 'games' | 'daily' | 'ai-bard' | 'vault';
  setActiveTab: (tab: 'dictionary' | 'games' | 'daily' | 'ai-bard' | 'vault') => void;
  userProgress: UserProgress;
  isOnline: boolean;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onOpenVoiceStudio?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  userProgress,
  isOnline,
  soundEnabled,
  setSoundEnabled,
  onOpenVoiceStudio,
}) => {
  // Calculate level progress (each level takes 100 XP)
  const expInCurrentLevel = userProgress.exp % 100;
  const currentLevel = Math.floor(userProgress.exp / 100) + 1;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-xs transition-all">
      {/* Top subtle Scottish ribbon accent */}
      <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* App Logo & Mascot */}
          <div 
            id="brand-logo" 
            onClick={() => setActiveTab('dictionary')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:scale-105 transition-all duration-200 border border-white/20">
              <span className="text-xl sm:text-2xl filter drop-shadow-xs" role="img" aria-label="Tartan Owl">🦉</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight">
                  Wee<span className="text-blue-600">Vocab</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 rounded-full">
                  🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots Junior
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden xs:block">
                Junior Dictionary & Vocabulary Quest (Ages 10–15)
              </p>
            </div>
          </div>

          {/* Player Stats Bar (Streak, XP, Sound, Offline Badge) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Daily Streak Flame */}
            <button
              id="streak-indicator"
              onClick={() => setActiveTab('daily')}
              title="Daily Challenge Streak"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50/90 border border-amber-200/80 text-amber-900 font-bold text-xs shadow-2xs hover:bg-amber-100 hover:border-amber-300 transition-all active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulse" />
              <span>{userProgress.streak} <span className="hidden sm:inline">day streak</span></span>
            </button>

            {/* EXP Level Badge */}
            <div 
              id="level-badge"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200/80 text-slate-800 text-xs font-semibold shadow-2xs"
            >
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-bold text-slate-900">Lvl {currentLevel}</span>
              <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${expInCurrentLevel}%` }}
                />
              </div>
              <span className="text-[10px] text-indigo-600 font-bold">{expInCurrentLevel}/100</span>
            </div>

            {/* British Voice Studio Button */}
            {onOpenVoiceStudio && (
              <button
                id="open-voice-studio-btn"
                onClick={onOpenVoiceStudio}
                title="Voice Studio - British young female voice & pitch controls"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-900 font-extrabold text-xs shadow-2xs hover:bg-sky-100 hover:border-sky-300 transition-all cursor-pointer"
              >
                <span className="text-sm">🇬🇧</span>
                <span className="hidden sm:inline">Voice Studio</span>
                <Sparkles className="w-3 h-3 text-sky-600" />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent hover:border-slate-200/60 transition-all cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Network / Offline Indicator */}
            <div
              id="network-status-indicator"
              title={isOnline ? 'Online (AI features enabled)' : 'Offline mode active (100% dictionary & games cached)'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
                isOnline 
                  ? 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/80' 
                  : 'bg-amber-50/90 text-amber-800 border border-amber-300/80'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Offline Ready</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu (Desktop & Tablet) */}
        <nav className="hidden sm:flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto py-2 no-scrollbar border-t border-slate-100">
          <button
            id="nav-tab-dictionary"
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'dictionary'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>A-Z Dictionary</span>
          </button>

          <button
            id="nav-tab-games"
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'games'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Word Arcade</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'games' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-800'}`}>
              6
            </span>
          </button>

          <button
            id="nav-tab-daily"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/25 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Daily Word Quest</span>
          </button>

          <button
            id="nav-tab-ai-bard"
            onClick={() => setActiveTab('ai-bard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'ai-bard'
                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm shadow-indigo-500/25 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Sparkles className="w-4 h-4 text-sky-200" />
            <span>Hamish AI Bard</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'ai-bard' ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'}`}>
              AI
            </span>
          </button>

          <button
            id="nav-tab-vault"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/25 scale-[1.02]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>My Word Vault</span>
            {userProgress.starredWordIds.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${activeTab === 'vault' ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                {userProgress.starredWordIds.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Ultra thumb-friendly on smartphones) */}
      <nav 
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-1 py-1 flex items-center justify-around shadow-2xl safe-area-bottom"
      >
        <button
          id="mobile-nav-dictionary"
          onClick={() => setActiveTab('dictionary')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'dictionary'
              ? 'text-blue-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'dictionary' ? 'bg-blue-100' : ''}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Dictionary</span>
        </button>

        <button
          id="mobile-nav-games"
          onClick={() => setActiveTab('games')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
            activeTab === 'games'
              ? 'text-purple-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'games' ? 'bg-purple-100' : ''}`}>
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Arcade (6)</span>
        </button>

        <button
          id="mobile-nav-daily"
          onClick={() => setActiveTab('daily')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'daily'
              ? 'text-amber-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'daily' ? 'bg-amber-100' : ''}`}>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <span className="text-[10px] mt-0.5">Quest</span>
        </button>

        <button
          id="mobile-nav-ai-bard"
          onClick={() => setActiveTab('ai-bard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'ai-bard'
              ? 'text-sky-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'ai-bard' ? 'bg-sky-100' : ''}`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5">Hamish AI</span>
        </button>

        <button
          id="mobile-nav-vault"
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
            activeTab === 'vault'
              ? 'text-emerald-600 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'vault' ? 'bg-emerald-100' : ''}`}>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <span className="text-[10px] mt-0.5">
            Vault {userProgress.starredWordIds.length > 0 && `(${userProgress.starredWordIds.length})`}
          </span>
        </button>
      </nav>
    </header>
  );
};
