import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Navbar } from './components/Navbar';
import { DictionaryView } from './components/DictionaryView';
import { GamesArcade } from './components/GamesArcade';
import { DailyQuestHub } from './components/DailyQuestHub';
import { HamishAIBard } from './components/HamishAIBard';
import { WordVault } from './components/WordVault';
import { ScrollToTop } from './components/ScrollToTop';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';

import { DictionaryEntry, UserProgress } from './types/dictionary';
import { INITIAL_DICTIONARY_ENTRIES, BADGES } from './data/dictionaryData';
import { loadUserProgress, saveUserProgress } from './utils/storage';
import { playSound } from './utils/soundEffects';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dictionary' | 'games' | 'daily' | 'ai-bard' | 'vault'>('dictionary');
  const [userProgress, setUserProgress] = useState<UserProgress>(loadUserProgress());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [aiBardTargetWord, setAiBardTargetWord] = useState<DictionaryEntry | null>(null);
  const [isVoiceStudioOpen, setIsVoiceStudioOpen] = useState<boolean>(false);

  // Network offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save progress whenever userProgress updates
  useEffect(() => {
    saveUserProgress(userProgress);
  }, [userProgress]);

  // Combine initial entries + user custom added words
  const allEntries = useMemo(() => {
    return [...INITIAL_DICTIONARY_ENTRIES, ...userProgress.customWords];
  }, [userProgress.customWords]);

  // Check and unlock badges automatically
  const checkBadgeUnlocks = (current: UserProgress): string[] => {
    const newlyUnlocked: string[] = [...current.unlockedBadges];

    if (current.streak >= 3 && !newlyUnlocked.includes('streak-champion')) {
      newlyUnlocked.push('streak-champion');
      playSound('badge');
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
    }
    if (current.starredWordIds.length >= 5 && current.customWords.length >= 1 && !newlyUnlocked.includes('word-vault-king')) {
      newlyUnlocked.push('word-vault-king');
      playSound('badge');
    }
    if (current.gameHighScores.matchMaster >= 500 && !newlyUnlocked.includes('match-master')) {
      newlyUnlocked.push('match-master');
      playSound('badge');
    }
    if (current.gameHighScores.synonymDuel >= 600 && !newlyUnlocked.includes('synonym-slayer')) {
      newlyUnlocked.push('synonym-slayer');
      playSound('badge');
    }

    return newlyUnlocked;
  };

  // Add EXP and check level up
  const addExp = (amount: number) => {
    setUserProgress(prev => {
      const newExp = prev.exp + amount;
      const oldLevel = Math.floor(prev.exp / 100) + 1;
      const newLevel = Math.floor(newExp / 100) + 1;

      if (newLevel > oldLevel) {
        playSound('celebrate');
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }

      const updated = {
        ...prev,
        exp: newExp,
        level: newLevel,
      };

      updated.unlockedBadges = checkBadgeUnlocks(updated);
      return updated;
    });
  };

  // Toggle Star / Bookmark
  const handleToggleStar = (wordId: string) => {
    setUserProgress(prev => {
      const isStarred = prev.starredWordIds.includes(wordId);
      const newStarred = isStarred 
        ? prev.starredWordIds.filter(id => id !== wordId)
        : [...prev.starredWordIds, wordId];

      const updated = { ...prev, starredWordIds: newStarred };
      updated.unlockedBadges = checkBadgeUnlocks(updated);
      return updated;
    });
  };

  // Update Game High Score
  const handleUpdateGameScore = (gameName: keyof UserProgress['gameHighScores'], score: number, expGained: number) => {
    setUserProgress(prev => {
      const currentHigh = prev.gameHighScores[gameName] || 0;
      const newHigh = Math.max(currentHigh, score);
      const updated = {
        ...prev,
        gameHighScores: {
          ...prev.gameHighScores,
          [gameName]: newHigh,
        }
      };
      return updated;
    });
    addExp(expGained);
  };

  // Claim Daily Quest Reward
  const handleClaimDailyReward = (expGained: number, questId: string) => {
    setUserProgress(prev => {
      if (prev.completedDailyQuests.includes(questId)) return prev;
      return {
        ...prev,
        completedDailyQuests: [...prev.completedDailyQuests, questId],
      };
    });
    addExp(expGained);
  };

  // Add Custom Word
  const handleAddCustomWord = (newWord: DictionaryEntry) => {
    setUserProgress(prev => {
      const updated = {
        ...prev,
        customWords: [newWord, ...prev.customWords],
      };
      updated.unlockedBadges = checkBadgeUnlocks(updated);
      return updated;
    });
    addExp(25);
  };

  // Delete Custom Word
  const handleDeleteCustomWord = (wordId: string) => {
    setUserProgress(prev => ({
      ...prev,
      customWords: prev.customWords.filter(w => w.id !== wordId),
    }));
  };

  // Export Vault to JSON
  const handleExportVault = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allEntries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "weevocab_scottish_dictionary_vault.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    playSound('pop');
  };

  // Import Vault from JSON
  const handleImportVault = (importedEntries: DictionaryEntry[]) => {
    const validCustom = importedEntries.filter(e => e.word && e.definition);
    setUserProgress(prev => ({
      ...prev,
      customWords: [...validCustom, ...prev.customWords],
    }));
    addExp(30);
  };

  // Open AI Bard with specific word
  const handleOpenAIBardWithWord = (word: DictionaryEntry) => {
    setAiBardTargetWord(word);
    setActiveTab('ai-bard');
  };

  return (
    <div className="min-h-screen bg-[#f7f9f3] text-[#16291e] flex flex-col selection:bg-emerald-700 selection:text-amber-100 font-sans relative overflow-x-hidden">
      
      {/* Eye-friendly Subtle Yellow-Green Botanical Backdrop Ambient Washes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Soft Meadow Sage Glow */}
        <div className="absolute -top-24 left-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        {/* Soft Honey & Buttercup Glow */}
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl" />
        {/* Soft Olive & Lime Leaf Glow */}
        <div className="absolute top-2/3 -left-20 w-96 h-96 bg-lime-200/25 rounded-full blur-3xl" />
        {/* Soft Chamomile Warm Ochre Glow */}
        <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-yellow-200/25 rounded-full blur-3xl" />
      </div>

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProgress={userProgress}
        isOnline={isOnline}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenVoiceStudio={() => setIsVoiceStudioOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        
        {/* Tab 1: A-Z Dictionary Explorer */}
        {activeTab === 'dictionary' && (
          <DictionaryView
            entries={allEntries}
            starredWordIds={userProgress.starredWordIds}
            onToggleStar={handleToggleStar}
            onOpenAIBardWithWord={handleOpenAIBardWithWord}
          />
        )}

        {/* Tab 2: Interactive Games Arcade */}
        {activeTab === 'games' && (
          <GamesArcade
            entries={allEntries}
            userProgress={userProgress}
            onUpdateScore={handleUpdateGameScore}
          />
        )}

        {/* Tab 3: Daily Word Quest Hub */}
        {activeTab === 'daily' && (
          <DailyQuestHub
            entries={allEntries}
            userProgress={userProgress}
            onClaimDailyReward={handleClaimDailyReward}
            onToggleStar={handleToggleStar}
          />
        )}

        {/* Tab 4: Hamish AI Bard & Story Generator */}
        {activeTab === 'ai-bard' && (
          <HamishAIBard
            entries={allEntries}
            initialWord={aiBardTargetWord}
            isOnline={isOnline}
          />
        )}

        {/* Tab 5: My Word Vault & Flashcards */}
        {activeTab === 'vault' && (
          <WordVault
            entries={allEntries}
            userProgress={userProgress}
            onToggleStar={handleToggleStar}
            onAddCustomWord={handleAddCustomWord}
            onDeleteCustomWord={handleDeleteCustomWord}
            onExportVault={handleExportVault}
            onImportVault={handleImportVault}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-md border-t border-emerald-900/10 py-6 text-center text-xs text-[#4b6354] relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🦉</span>
            <span className="font-extrabold text-[#16291e]">WeeVocab Scotland Junior Dictionary</span>
            <span className="text-[#4b6354]">• For P6–S4 Students (Ages 10–15)</span>
          </div>
          <div className="flex items-center gap-3 font-bold text-[#2e4739] flex-wrap justify-center">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300/80">100% Offline Ready</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-950 border border-amber-300/80">Curriculum for Excellence</span>
            <span className="px-2.5 py-0.5 rounded-full bg-lime-50 text-lime-950 border border-lime-300/80">British & Scots Audio</span>
          </div>
        </div>
      </footer>

      {/* Floating Scroll to Top button */}
      <ScrollToTop />

      {/* British Voice Settings & Audio Studio Modal */}
      <VoiceSettingsModal
        isOpen={isVoiceStudioOpen}
        onClose={() => setIsVoiceStudioOpen(false)}
      />

    </div>
  );
}
