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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-emerald-900/10 shadow-xs transition-all">
      {/* Top subtle Scottish ribbon accent: Warm Honey, Sage, Forest Green & Olive */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-lime-500 via-emerald-600 to-teal-700 shadow-2xs" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-3">
          
          {/* App Logo & Mascot */}
          <div 
            id="brand-logo" 
            onClick={() => setActiveTab('dictionary')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#132a1f] via-emerald-800 to-amber-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/15 group-hover:scale-108 group-hover:rotate-3 transition-all duration-250 border-2 border-emerald-100 ring-2 ring-emerald-400/30">
              <span className="text-2xl sm:text-3xl filter drop-shadow-xs transform group-hover:scale-110 transition-transform" role="img" aria-label="Tartan Owl">🦉</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl sm:text-2xl text-[#14281f] tracking-tight">
                  Wee<span className="bg-gradient-to-r from-emerald-700 via-teal-700 to-amber-600 bg-clip-text text-transparent">Vocab</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-100 rounded-full shadow-2xs">
                  <span>🏴󠁧󠁢󠁳󠁣󠁴󠁿 P6–S4</span>
                </span>
              </div>
              <p className="text-[11px] text-[#365040] font-bold hidden xs:block">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-950 font-black text-xs shadow-2xs hover:scale-105 hover:bg-amber-100 transition-all active:scale-95 cursor-pointer"
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-500 text-slate-950 shadow-2xs">
                <Flame className="w-3 h-3 text-slate-950 fill-slate-950 animate-pulse" />
              </div>
              <span>{userProgress.streak} <span className="hidden sm:inline">day streak</span></span>
            </button>

            {/* EXP Level Badge (Sage & Moss Green) */}
            <div 
              id="level-badge"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-black shadow-2xs"
            >
              <div className="p-1 rounded-full bg-gradient-to-tr from-emerald-700 to-teal-700 text-white shadow-2xs">
                <Award className="w-3 h-3 text-white" />
              </div>
              <span className="font-black text-emerald-950">Lvl {currentLevel}</span>
              <div className="w-16 bg-emerald-100 h-2 rounded-full overflow-hidden border border-emerald-200">
                <div 
                  className="bg-gradient-to-r from-emerald-600 via-lime-500 to-amber-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${expInCurrentLevel}%` }}
                />
              </div>
              <span className="text-[10px] text-emerald-800 font-extrabold">{expInCurrentLevel}/100</span>
            </div>

            {/* British Voice Studio Button (Sage Botanical) */}
            {onOpenVoiceStudio && (
              <button
                id="open-voice-studio-btn"
                onClick={onOpenVoiceStudio}
                title="High-Quality Voice Studio - Device-tuned British & Scottish voice engine"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-lime-50 border border-lime-300 text-lime-950 font-black text-xs shadow-2xs hover:scale-105 hover:bg-lime-100 transition-all cursor-pointer shrink-0"
              >
                <span className="text-sm">🇬🇧</span>
                <span className="hidden sm:inline">Voice Studio</span>
                <span className="inline sm:hidden">Voice</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-700 animate-spin-slow" />
              </button>
            )}

            {/* Sound Toggle */}
            <button
              id="sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all cursor-pointer"
            >
              {soundEnabled ? (
                <div className="p-1 rounded-lg bg-emerald-100 text-emerald-900">
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
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300' 
                  : 'bg-amber-50 text-amber-950 border border-amber-300'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse ring-2 ring-emerald-300" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                  <span>Offline Ready</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu (Desktop & Tablet) in Subtle Yellow-Green Tones */}
        <nav className="hidden sm:flex items-center space-x-2 overflow-x-auto py-2.5 no-scrollbar border-t border-emerald-900/10">
          {/* Tab 1: Dictionary (Forest Moss Green) */}
          <button
            id="nav-tab-dictionary"
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'dictionary'
                ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-100 shadow-md shadow-emerald-900/20 scale-[1.03]'
                : 'text-[#2a4436] hover:text-emerald-950 hover:bg-emerald-50'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'dictionary' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
              <BookOpen className="w-4 h-4" />
            </div>
            <span>A-Z Dictionary</span>
          </button>

          {/* Tab 2: Word Arcade (Meadow Olive / Sage) */}
          <button
            id="nav-tab-games"
            onClick={() => setActiveTab('games')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'games'
                ? 'bg-gradient-to-r from-[#1b3d2b] to-emerald-800 text-amber-100 shadow-md shadow-emerald-950/20 scale-[1.03]'
                : 'text-[#2a4436] hover:text-emerald-950 hover:bg-emerald-50'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'games' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
              <Gamepad2 className="w-4 h-4" />
            </div>
            <span>Word Arcade</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'games' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-950'}`}>
              6
            </span>
          </button>

          {/* Tab 3: Daily Quest (Warm Honey Yellow) */}
          <button
            id="nav-tab-daily"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-400/25 scale-[1.03]'
                : 'text-[#2a4436] hover:text-amber-950 hover:bg-amber-50'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'daily' ? 'bg-slate-950/15 text-slate-950' : 'bg-amber-100 text-amber-900'}`}>
              <Flame className="w-4 h-4 fill-current" />
            </div>
            <span>Daily Word Quest</span>
          </button>

          {/* Tab 4: Hamish AI Bard (Deep Cypress Slate) */}
          <button
            id="nav-tab-ai-bard"
            onClick={() => setActiveTab('ai-bard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'ai-bard'
                ? 'bg-gradient-to-r from-teal-800 to-emerald-900 text-amber-100 shadow-md shadow-teal-900/20 scale-[1.03]'
                : 'text-[#2a4436] hover:text-teal-950 hover:bg-teal-50'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'ai-bard' ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-900'}`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <span>Hamish AI Bard</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'ai-bard' ? 'bg-amber-400 text-slate-950' : 'bg-teal-100 text-teal-950'}`}>
              AI
            </span>
          </button>

          {/* Tab 5: My Word Vault (Warm Olive Moss) */}
          <button
            id="nav-tab-vault"
            onClick={() => setActiveTab('vault')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-emerald-800 to-lime-800 text-amber-100 shadow-md shadow-emerald-900/20 scale-[1.03]'
                : 'text-[#2a4436] hover:text-emerald-950 hover:bg-emerald-50'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === 'vault' ? 'bg-white/20 text-white' : 'bg-lime-100 text-lime-900'}`}>
              <Star className="w-4 h-4 fill-current text-amber-400" />
            </div>
            <span>My Word Vault</span>
            {userProgress.starredWordIds.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'vault' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-950'}`}>
                {userProgress.starredWordIds.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav 
        id="mobile-bottom-nav"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-emerald-900/10 px-1 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom"
      >
        <button
          id="mobile-nav-dictionary"
          onClick={() => setActiveTab('dictionary')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'dictionary'
              ? 'text-emerald-800 font-black'
              : 'text-[#4b6354] hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'dictionary' ? 'bg-gradient-to-tr from-emerald-800 to-teal-800 text-white shadow-xs scale-105' : 'text-[#4b6354]'}`}>
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Dictionary</span>
        </button>

        <button
          id="mobile-nav-games"
          onClick={() => setActiveTab('games')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
            activeTab === 'games'
              ? 'text-emerald-900 font-black'
              : 'text-[#4b6354] hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'games' ? 'bg-gradient-to-tr from-emerald-800 to-lime-800 text-white shadow-xs scale-105' : 'text-[#4b6354]'}`}>
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Arcade (6)</span>
        </button>

        <button
          id="mobile-nav-daily"
          onClick={() => setActiveTab('daily')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'daily'
              ? 'text-amber-800 font-black'
              : 'text-[#4b6354] hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'daily' ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 shadow-xs scale-105' : 'text-[#4b6354]'}`}>
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Quest</span>
        </button>

        <button
          id="mobile-nav-ai-bard"
          onClick={() => setActiveTab('ai-bard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all ${
            activeTab === 'ai-bard'
              ? 'text-teal-800 font-black'
              : 'text-[#4b6354] hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'ai-bard' ? 'bg-gradient-to-tr from-teal-800 to-emerald-900 text-white shadow-xs scale-105' : 'text-[#4b6354]'}`}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Hamish AI</span>
        </button>

        <button
          id="mobile-nav-vault"
          onClick={() => setActiveTab('vault')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all relative ${
            activeTab === 'vault'
              ? 'text-lime-800 font-black'
              : 'text-[#4b6354] hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'vault' ? 'bg-gradient-to-tr from-emerald-800 to-lime-800 text-white shadow-xs scale-105' : 'text-[#4b6354]'}`}>
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
