import { DictionaryEntry, Badge } from '../types/dictionary';
import { SCOTS_ENTRIES } from './scotsWords';
import { UK_ACADEMIC_ENTRIES } from './ukAcademicWords';
import { UK_COMMON_AND_SLANG_ENTRIES } from './ukCommonAndSlangWords';
import { UK_SPOKEN_CONVERSATION_ENTRIES } from './ukSpokenAndConversationalWords';
import { POPULAR_KIDS_ENTRIES } from './popularKidsWords';

// Merge all vocabulary collections and deduplicate by word id
const allRawEntries: DictionaryEntry[] = [
  ...SCOTS_ENTRIES,
  ...UK_ACADEMIC_ENTRIES,
  ...UK_COMMON_AND_SLANG_ENTRIES,
  ...UK_SPOKEN_CONVERSATION_ENTRIES,
  ...POPULAR_KIDS_ENTRIES,
];

const seenIds = new Set<string>();
const uniqueEntries: DictionaryEntry[] = [];

for (const entry of allRawEntries) {
  const normalizedId = entry.id.toLowerCase().trim();
  if (!seenIds.has(normalizedId)) {
    seenIds.add(normalizedId);
    uniqueEntries.push(entry);
  }
}

// Sort alphabetically by word for smooth A-to-Z browsing
export const INITIAL_DICTIONARY_ENTRIES: DictionaryEntry[] = uniqueEntries.sort((a, b) =>
  a.word.localeCompare(b.word)
);

export const BADGES: Badge[] = [
  {
    id: 'uk-scholar',
    title: 'UK Vocab Champion',
    description: 'Explore 20+ words across UK regional slang and academic curriculum.',
    icon: '🇬🇧',
    category: 'learning'
  },
  {
    id: 'scots-scholar',
    title: 'Braw Scots Scholar',
    description: 'Explore 10 Scottish regional words and listen to their pronunciations.',
    icon: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
    category: 'scots'
  },
  {
    id: 'streak-champion',
    title: 'Highland Flame',
    description: 'Maintain a 3-day daily challenge streak.',
    icon: '🔥',
    category: 'streak'
  },
  {
    id: 'match-master',
    title: 'Loch Ness Match Ace',
    description: 'Score 500+ points in Vocab Match Master.',
    icon: '🐉',
    category: 'games',
    requiredScore: 500
  },
  {
    id: 'anagram-whiz',
    title: 'Word Quest Anagram Bard',
    description: 'Unscramble 5 words in a row without using hints.',
    icon: '📜',
    category: 'games'
  },
  {
    id: 'synonym-slayer',
    title: 'Showdown Duel Master',
    description: 'Achieve a 100% accuracy run in the Synonym & Antonym Showdown.',
    icon: '⚔️',
    category: 'games'
  },
  {
    id: 'word-vault-king',
    title: 'Vocab Vault Collector',
    description: 'Star at least 5 words and add a custom word to your Vault.',
    icon: '🏰',
    category: 'learning'
  }
];
