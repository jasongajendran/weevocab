export type PartOfSpeech = 
  | 'noun' 
  | 'verb' 
  | 'adjective' 
  | 'adverb' 
  | 'interjection' 
  | 'phrase' 
  | 'idiom';

export type WordCategory = 
  | 'UK Common & Slang'
  | 'Scots & Slang' 
  | 'Academic & Powerful' 
  | 'Nature & Places' 
  | 'School & Banter' 
  | 'Food & Culture' 
  | 'Feelings & Traits';

export type UKRegion = 
  | 'Standard UK Academic'
  | 'UK Wide & Common'
  | 'UK Youth Slang & Banter'
  | 'General Scots & Scotland'
  | 'Glasgow & West'
  | 'Edinburgh & East'
  | 'Highlands & Islands'
  | 'Aberdeen & Doric'
  | 'Dundee & Angus'
  | 'Borders & South'
  | 'London & South'
  | 'Northern England'
  | 'Wales & Cymru'
  | 'Northern Ireland & Ulster';

export type ScottishRegion = UKRegion;

export interface DictionaryEntry {
  id: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  phonetic: string;            // e.g. "/drix/"
  phoneticGuide: string;       // e.g. "DREEKH (soft Scottish 'ch' like loch)"
  definition: string;
  examples: [string, string, ...string[]]; // Minimum 2 examples guaranteed!
  synonyms: string[];          // Minimum 2 synonyms
  antonyms: string[];          // Minimum 2 antonyms
  scotsRegion: ScottishRegion;
  category: WordCategory;
  loreOrFunFact?: string;
  isScots: boolean;
  isAcademic: boolean;
  difficulty: 'P6-P7 (Starter)' | 'S1-S2 (Intermediate)' | 'S3-S4 (Advanced Scholar)';
  rhymesWith?: string[];
  tags: string[];
  customUserAdded?: boolean;
}

export interface DailyChallenge {
  date: string;
  wordId: string;
  riddle: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface UserProgress {
  streak: number;
  lastActiveDate: string;
  exp: number;
  level: number;
  starredWordIds: string[];
  masteredWordIds: string[];
  completedDailyQuests: string[];
  gameHighScores: {
    matchMaster: number;
    anagrams: number;
    synonymDuel: number;
    sentenceDetective: number;
    listeningBee?: number;
    speedDialectRush?: number;
  };
  customWords: DictionaryEntry[];
  unlockedBadges: string[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'games' | 'streak' | 'learning' | 'scots';
  requiredScore?: number;
}
