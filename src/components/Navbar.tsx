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
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-md transition-all">
      {/* Top subtle Scottish ribbon accent: Warm Honey, Sage, Forest Green & Olive */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-lime-500 via-emerald-500 to-teal-500 shadow-2xs" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* App Logo & Mascot */}
          <div 
            id="brand-logo" 
            onClick={() => setActiveTab('dictionary')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-slate-950 via-emerald-850 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-950/40 group-hover:scale-108 group-hover:rotate-3 transition-all duration-250 border border-slate-700 ring-2 ring-emerald-500/30">
              <span className="text-2xl sm:text-3xl filter drop-shadow-xs transform group-hover:scale-110 transition-transform" role="img" aria-label="Tartan Owl">🦉</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl text-slate-100 tracking-tight">
                  Wee<span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Vocab</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black bg-gradient-to-r from-emerald-700 to-teal-700 text-amber-200 rounded-full border border-emerald-500/30 shadow-2xs">
                  <span>🏴󠁧󠁢󠁳󠁣󠁴󠁿 P6–S4</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-bold hidden xs:block">
                Junior UK & Scots Lexicon • Voice & Games
              </p>
            </div>
          </div>

          {/* Player Stats Bar (Streak, XP, Sound, Offline Badge) */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Daily Streak Flame (Warm Honey & Amber) */}
            <button
              id="streak-indicator"
              onClick={() => setActiveTab('daily')}
              title="Daily Challenge Streak"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/50 border border-amber-500/40 text-amber-300 font-black text-xs shadow-2xs hover:scale-105 hover:bg-amber-900/60 transition-all active:scale-95 cursor-pointer"
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 shadow-2xs">
                <Flame className="w-3 h-3 text-slate-950 fill-slate-950 animate-pulse" />
              </div>
              <span>{userProgress.streak} <span className="hidden sm:inline">day streak</span></span>
            </button>

            {/* EXP Level Badge (Sage & Moss Green) */}
            <div 
              id="level-badge"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-emerald-300 text-xs font-black shadow-2xs"
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-2xs">
                <Award className="w-3 h-3 text-white" />
              </div>
              <span className="font-black text-slate-200">Lvl {currentLevel}</span>
              <div className="w-16 bg-slate-700 h-2 rounded-full overflow-hidden border border-slate-600">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-lime-400 to-amber-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${expInCurrentLevel}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-extrabold">{expInCurrentLevel}/100</span>
            </div>

            {/* British Voice Studio Button */}
            {onOpenVoiceStudio && (
              <button
                id="open-voice-studio-btn"
                onClick={onOpenVoiceStudio}
                title="High-Quality Voice Studio - Device-tuned British & Scottish voice engine"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-950/60 border border-sky-500/40 text-sky-300 font-black text-xs shadow-2xs hover:scale-105 hover:bg-sky-900/70 transition-all cursor-pointer shrink-0"
              >
                <span className="text-sm">🇬🇧</span>
                <span className="hidden sm:inline">Voice Studio</span>
                <span className="inline sm:hidden">Voice</span>
                <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <div className="p-1 rounded-lg bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                  <Volume2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
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
                  ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60' 
                  : 'bg-amber-950/60 text-amber-300 border border-amber-700/60'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-2 ring-emerald-400/40" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline Ready</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu (Desktop & Tablet) in Dark Theme */}
        <nav className="hidden sm:flex items-center space-x-2 overflow-x-auto py-2.5 no-scrollbar border-t border-slate-800">
          {/* Tab 1: Dictionary */}
          <button
            id="nav-tab-dictionary"
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'dictionary'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50 scale-[1.03] border border-emerald-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'dictionary' ? 'bg-white/20 text-white' : 'bg-slate-800 text-emerald-400 border border-slate-700'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span>A-Z Dictionary</span>
          </button>

          {/* Tab 2: Word Arcade */}
          <button
            id="nav-tab-games"
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'games'
                ? 'bg-gradient-to-r from-indigo-600 to-teal-600 text-white shadow-md shadow-indigo-950/50 scale-[1.03] border border-indigo-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'games' ? 'bg-white/20 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'}`}>
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span>Word Arcade</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'games' ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-amber-300 border border-slate-700'}`}>
              6
            </span>
          </button>

          {/* Tab 3: Daily Quest */}
          <button
            id="nav-tab-daily"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-950/50 scale-[1.03] border border-amber-300'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'daily' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400 border border-slate-700'}`}>
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span>Daily Word Quest</span>
          </button>

          {/* Tab 4: Hamish AI Bard */}
          <button
            id="nav-tab-ai-bard"
            onClick={() => setActiveTab('ai-bard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'ai-bard'
                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-950/50 scale-[1.03] border border-teal-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors flex items-center justify-center ${
              activeTab === 'ai-bard' 
                ? 'bg-white/20 text-amber-200' 
                : 'bg-slate-800 text-teal-300 border border-slate-700 shadow-2xs'
            }`}>
              <Sparkles className={`w-4 h-4 ${activeTab === 'ai-bard' ? 'text-amber-200' : 'text-teal-300'}`} />
            </div>
            <span>Hamish AI Bard</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'ai-bard' 
                ? 'bg-amber-400 text-slate-950' 
                : 'bg-slate-800 text-teal-300 border border-slate-700'
            }`}>
              AI
            </span>
          </button>

          {/* Tab 5: My Word Vault */}
          <button
            id="nav-tab-vault"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-emerald-600 to-lime-600 text-slate-950 shadow-md shadow-emerald-950/50 scale-[1.03] border border-emerald-400'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors flex items-center justify-center ${
              activeTab === 'vault' 
                ? 'bg-slate-950/20 text-slate-950' 
                : 'bg-slate-800 text-lime-400 border border-slate-700 shadow-2xs'
            }`}>
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
            <span>My Word Vault</span>
            {userProgress.starredWordIds.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'vault' 
                  ? 'bg-slate-950 text-amber-300' 
                  : 'bg-slate-800 text-amber-300 border border-slate-700'
              }`}>
                {userProgress.starredWordIds.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav 
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 px-1 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom"
      >
        <button
          id="mobile-nav-dictionary"
          onClick={() => setActiveTab('dictionary')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'dictionary'
              ? 'text-emerald-400 font-black'
              : 'text-slate-400 hover:text-slate-200 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'dictionary' 
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-xs scale-105' 
              : 'bg-slate-800 text-slate-300 border border-slate-700 shadow-2xs'
          }`}>
            <BookOpen className="w-4 h-4 text-current" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Dictionary</span>
        </button>

        <button
          id="mobile-nav-games"
          onClick={() => setActiveTab('games')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
            activeTab === 'games'
              ? 'text-indigo-400 font-black'
              : 'text-slate-400 hover:text-slate-200 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'games' 
              ? 'bg-gradient-to-tr from-indigo-600 to-teal-600 text-white shadow-xs scale-105' 
              : 'bg-slate-800 text-slate-300 border border-slate-700 shadow-2xs'
          }`}>
            <Gamepad2 className="w-4 h-4 text-current" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Arcade (6)</span>
        </button>

        <button
          id="mobile-nav-daily"
          onClick={() => setActiveTab('daily')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'daily'
              ? 'text-amber-400 font-black'
              : 'text-slate-400 hover:text-slate-200 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'daily' 
              ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-xs scale-105' 
              : 'bg-slate-800 text-amber-300 border border-slate-700 shadow-2xs'
          }`}>
            <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Quest</span>
        </button>

        <button
          id="mobile-nav-ai-bard"
          onClick={() => setActiveTab('ai-bard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'ai-bard'
              ? 'text-teal-400 font-black'
              : 'text-slate-400 hover:text-teal-300 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'ai-bard' 
              ? 'bg-gradient-to-tr from-teal-600 to-emerald-600 text-white shadow-xs scale-105' 
              : 'bg-slate-800 text-teal-300 border border-slate-700 shadow-2xs'
          }`}>
            <Sparkles className={`w-4 h-4 ${activeTab === 'ai-bard' ? 'text-amber-200' : 'text-teal-400'}`} />
          </div>
          <span className={`text-[10px] mt-0.5 ${activeTab === 'ai-bard' ? 'font-black text-teal-300' : 'font-bold text-slate-400'}`}>
            Hamish AI
          </span>
        </button>

        <button
          id="mobile-nav-vault"
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
            activeTab === 'vault'
              ? 'text-lime-400 font-black'
              : 'text-slate-400 hover:text-slate-200 font-bold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
            activeTab === 'vault' 
              ? 'bg-gradient-to-tr from-emerald-600 to-lime-600 text-slate-950 shadow-xs scale-105' 
              : 'bg-slate-800 text-slate-300 border border-slate-700 shadow-2xs'
          }`}>
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">
            Vault {userProgress.starredWordIds.length > 0 && `(${userProgress.starredWordIds.length})`}
          </span>
        </button>
      </nav>
    </header>
  );
};
