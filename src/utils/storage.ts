import { UserProgress, DictionaryEntry } from '../types/dictionary';

const STORAGE_KEY = 'weevocab_user_progress_v1';

export const DEFAULT_USER_PROGRESS: UserProgress = {
  streak: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  exp: 40,
  level: 1,
  starredWordIds: ['braw', 'dreich', 'stooshie', 'resilient'],
  masteredWordIds: [],
  completedDailyQuests: [],
  gameHighScores: {
    matchMaster: 0,
    anagrams: 0,
    synonymDuel: 0,
    sentenceDetective: 0,
  },
  customWords: [],
  unlockedBadges: ['scots-scholar']
};

export const loadUserProgress = (): UserProgress => {
  if (typeof window === 'undefined') return DEFAULT_USER_PROGRESS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROGRESS;
    const data = JSON.parse(raw);

    // Calculate streak
    const today = new Date().toISOString().split('T')[0];
    const lastDate = data.lastActiveDate;

    if (lastDate && lastDate !== today) {
      const last = new Date(lastDate);
      const cur = new Date(today);
      const diffDays = Math.round((cur.getTime() - last.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays === 1) {
        // Logged in next day -> streak increases!
        data.streak = (data.streak || 0) + 1;
        data.lastActiveDate = today;
      } else if (diffDays > 1) {
        // Missed a day -> reset to 1
        data.streak = 1;
        data.lastActiveDate = today;
      }
    }

    return { ...DEFAULT_USER_PROGRESS, ...data };
  } catch (e) {
    console.error('Failed to load user progress:', e);
    return DEFAULT_USER_PROGRESS;
  }
};

export const saveUserProgress = (progress: UserProgress): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save user progress:', e);
  }
};
