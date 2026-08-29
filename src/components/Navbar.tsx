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
      {/* Top Scottish ribbon accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 via-teal-500 via-amber-500 via-rose-500 to-purple-600 shadow-xs" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* App Logo & Mascot */}
          <div 
            id="brand-logo" 
            onClick={() => setActiveTab('dictionary')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 via-teal-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-emerald-700/25 group-hover:scale-108 group-hover:rotate-3 transition-all duration-250 border-2 border-white/40 ring-2 ring-emerald-400/20">
              <span className="text-2xl sm:text-3xl filter drop-shadow-sm transform group-hover:scale-110 transition-transform" role="img" aria-label="Tartan Owl">🦉</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                  Wee<span className="bg-gradient-to-r from-emerald-700 via-teal-600 to-amber-600 bg-clip-text text-transparent">Vocab</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-black bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border border-emerald-200 rounded-full shadow-2xs">
                  <span>🏴󠁧󠁢󠁳󠁣󠁴󠁿</span>
                  <span>Scots Junior</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold hidden xs:block">
                Junior UK & Scottish Dictionary & Vocabulary Arcade (Ages 10–15)
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 border border-amber-300 text-amber-950 font-black text-xs shadow-2xs hover:scale-105 hover:border-amber-400 transition-all active:scale-95 cursor-pointer"
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-2xs">
                <Flame className="w-3 h-3 text-white fill-white animate-pulse" />
              </div>
              <span>{userProgress.streak} <span className="hidden sm:inline">day streak</span></span>
            </button>

            {/* EXP Level Badge */}
            <div 
              id="level-badge"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 text-purple-950 text-xs font-black shadow-2xs"
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-purple-700 to-teal-600 text-white shadow-2xs">
                <Award className="w-3 h-3 text-white" />
              </div>
              <span className="font-black text-purple-950">Lvl {currentLevel}</span>
              <div className="w-16 bg-slate-200/80 h-2 rounded-full overflow-hidden border border-slate-300/40">
                <div 
                  className="bg-gradient-to-r from-purple-700 to-teal-600 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${expInCurrentLevel}%` }}
                />
              </div>
              <span className="text-[10px] text-purple-700 font-extrabold">{expInCurrentLevel}/100</span>
            </div>

            {/* British Voice Studio Button */}
            {onOpenVoiceStudio && (
              <button
                id="open-voice-studio-btn"
                onClick={onOpenVoiceStudio}
                title="High-Quality Voice Studio - Device-tuned British & Scottish voice engine"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-emerald-50 to-teal-100/90 border border-emerald-300 text-emerald-950 font-black text-xs shadow-2xs hover:scale-105 hover:border-emerald-400 transition-all cursor-pointer shrink-0"
              >
                <span className="text-sm">🇬🇧</span>
                <span className="hidden sm:inline">Voice Studio</span>
                <span className="inline sm:hidden">Voice</span>
                <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-spin-slow" />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <div className="p-1 rounded-lg bg-emerald-100 text-emerald-800">
                  <Volume2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 rounded-lg bg-slate-100 text-slate-400">
                  <VolumeX className="w-4 h-4" />
                </div>
              )}
            </button>

            {/* Network / Offline Indicator */}
            <div
              id="network-status-indicator"
              title={isOnline ? 'Online (AI features enabled)' : 'Offline mode active (100% dictionary & games cached)'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                isOnline 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300' 
                  : 'bg-amber-50 text-amber-800 border border-amber-300'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-300" />
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
        <nav className="hidden sm:flex items-center space-x-1.5 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-100">
          <button
            id="nav-tab-dictionary"
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'dictionary'
                ? 'bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-md shadow-emerald-700/30 scale-[1.03]'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/60'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'dictionary' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span>A-Z Dictionary</span>
          </button>

          <button
            id="nav-tab-games"
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'games'
                ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow-md shadow-purple-700/30 scale-[1.03]'
                : 'text-slate-700 hover:text-purple-700 hover:bg-purple-50/60'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'games' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'}`}>
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span>Word Arcade</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'games' ? 'bg-white/30 text-white' : 'bg-purple-100 text-purple-800'}`}>
              6
            </span>
          </button>

          <button
            id="nav-tab-daily"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 scale-[1.03]'
                : 'text-slate-700 hover:text-amber-700 hover:bg-amber-50/60'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'daily' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'}`}>
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span>Daily Word Quest</span>
          </button>

          <button
            id="nav-tab-ai-bard"
            onClick={() => setActiveTab('ai-bard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'ai-bard'
                ? 'bg-gradient-to-r from-violet-700 to-purple-800 text-white shadow-md shadow-purple-900/30 scale-[1.03]'
                : 'text-slate-700 hover:text-purple-800 hover:bg-purple-50/60'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'ai-bard' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Hamish AI Bard</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'ai-bard' ? 'bg-white/30 text-white' : 'bg-purple-100 text-purple-900'}`}>
              AI
            </span>
          </button>

          <button
            id="nav-tab-vault"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-teal-700 to-cyan-700 text-white shadow-md shadow-teal-700/30 scale-[1.03]'
                : 'text-slate-700 hover:text-teal-700 hover:bg-teal-50/60'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'vault' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-700'}`}>
              <Star className="w-4 h-4 fill-current text-amber-300" />
            </div>
            <span>My Word Vault</span>
            {userProgress.starredWordIds.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'vault' ? 'bg-white/30 text-white' : 'bg-teal-100 text-teal-800'}`}>
                {userProgress.starredWordIds.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Ultra thumb-friendly on smartphones) */}
      <nav 
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 px-1 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom"
      >
        <button
          id="mobile-nav-dictionary"
          onClick={() => setActiveTab('dictionary')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'dictionary'
              ? 'text-emerald-700 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'dictionary' ? 'bg-gradient-to-tr from-emerald-700 to-teal-700 text-white shadow-xs scale-105' : 'text-slate-600'}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Dictionary</span>
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
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'games' ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white shadow-xs scale-105' : 'text-slate-600'}`}>
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Arcade (6)</span>
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
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'daily' ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-xs scale-105' : 'text-slate-600'}`}>
            <Flame className="w-4 h-4 fill-white text-white" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Quest</span>
        </button>

        <button
          id="mobile-nav-ai-bard"
          onClick={() => setActiveTab('ai-bard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'ai-bard'
              ? 'text-violet-700 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'ai-bard' ? 'bg-gradient-to-tr from-violet-700 to-purple-800 text-white shadow-xs scale-105' : 'text-slate-600'}`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Hamish AI</span>
        </button>

        <button
          id="mobile-nav-vault"
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
            activeTab === 'vault'
              ? 'text-teal-700 font-black'
              : 'text-slate-500 hover:text-slate-800 font-semibold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'vault' ? 'bg-gradient-to-tr from-teal-700 to-cyan-700 text-white shadow-xs scale-105' : 'text-slate-600'}`}>
            <Star className="w-4 h-4 fill-amber-300 text-white" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">
            Vault {userProgress.starredWordIds.length > 0 && `(${userProgress.starredWordIds.length})`}
          </span>
        </button>
      </nav>
    </header>
  );
};
