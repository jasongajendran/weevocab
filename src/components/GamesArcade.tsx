import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Gamepad2, Trophy, RotateCcw, Clock, Sparkles, CheckCircle2, 
  XCircle, Zap, HelpCircle, ArrowRight, ShieldCheck, Flame, 
  Volume2, Volume1, Ear, Compass, BookOpen, Layers, Award,
  Check, Play, ArrowLeft, RefreshCw
} from 'lucide-react';
import { DictionaryEntry, UserProgress } from '../types/dictionary';
import { playSound } from '../utils/soundEffects';
import { speakWord, speakSentence } from '../utils/speech';

interface GamesArcadeProps {
  entries: DictionaryEntry[];
  userProgress: UserProgress;
  onUpdateScore: (gameName: keyof UserProgress['gameHighScores'], score: number, expGained: number) => void;
}

type ActiveGameMode = 
  | 'hub' 
  | 'match' 
  | 'anagram' 
  | 'synonym-duel' 
  | 'detective' 
  | 'listening-bee' 
  | 'dialect-rush';

export const GamesArcade: React.FC<GamesArcadeProps> = ({
  entries,
  userProgress,
  onUpdateScore,
}) => {
  const [activeGame, setActiveGame] = useState<ActiveGameMode>('hub');

  // -------------------------------------------------------------
  // GAME 1: MATCH MASTER STATE
  // -------------------------------------------------------------
  interface MatchCard {
    id: string;
    pairId: string;
    text: string;
    type: 'word' | 'meaning';
    isFlipped: boolean;
    isMatched: boolean;
    entryRef: DictionaryEntry;
  }
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [selectedMatchIndices, setSelectedMatchIndices] = useState<number[]>([]);
  const [matchScore, setMatchScore] = useState(0);
  const [matchTimer, setMatchTimer] = useState(60);
  const [matchIsOver, setMatchIsOver] = useState(false);
  const [matchCombo, setMatchCombo] = useState(1);

  const initMatchGame = () => {
    playSound('pop');
    const shuffled = [...entries].sort(() => 0.5 - Math.random()).slice(0, 6);
    const cards: MatchCard[] = [];

    shuffled.forEach((entry, idx) => {
      // Word card
      cards.push({
        id: `word-${entry.id}-${idx}`,
        pairId: entry.id,
        text: entry.word,
        type: 'word',
        isFlipped: false,
        isMatched: false,
        entryRef: entry
      });
      // Meaning card
      cards.push({
        id: `def-${entry.id}-${idx}`,
        pairId: entry.id,
        text: entry.definition.length > 55 ? entry.definition.slice(0, 52) + '...' : entry.definition,
        type: 'meaning',
        isFlipped: false,
        isMatched: false,
        entryRef: entry
      });
    });

    setMatchCards(cards.sort(() => 0.5 - Math.random()));
    setSelectedMatchIndices([]);
    setMatchScore(0);
    setMatchTimer(60);
    setMatchIsOver(false);
    setMatchCombo(1);
    setActiveGame('match');
  };

  useEffect(() => {
    if (activeGame !== 'match' || matchIsOver) return;
    if (matchTimer <= 0) {
      setMatchIsOver(true);
      playSound('wrong');
      return;
    }
    const timer = setInterval(() => {
      setMatchTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeGame, matchTimer, matchIsOver]);

  const handleMatchCardClick = (index: number) => {
    if (matchIsOver) return;
    const card = matchCards[index];
    if (card.isMatched || card.isFlipped || selectedMatchIndices.length >= 2) return;

    playSound('click');
    if (card.type === 'word') {
      speakWord(card.entryRef.word);
    }

    const newCards = [...matchCards];
    newCards[index].isFlipped = true;
    setMatchCards(newCards);

    const newSelected = [...selectedMatchIndices, index];
    setSelectedMatchIndices(newSelected);

    if (newSelected.length === 2) {
      const first = matchCards[newSelected[0]];
      const second = matchCards[newSelected[1]];

      if (first.pairId === second.pairId && first.type !== second.type) {
        // MATCH SUCCESS
        setTimeout(() => {
          playSound('correct');
          setMatchCards(prev => prev.map((c, i) => 
            i === newSelected[0] || i === newSelected[1] 
              ? { ...c, isMatched: true, isFlipped: true } 
              : c
          ));
          const points = 100 * matchCombo;
          setMatchScore(prev => prev + points);
          setMatchCombo(prev => prev + 1);
          setSelectedMatchIndices([]);

          const remainingUnmatched = matchCards.filter(c => !c.isMatched && c.id !== first.id && c.id !== second.id);
          if (remainingUnmatched.length === 0) {
            setMatchIsOver(true);
            playSound('celebrate');
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
            onUpdateScore('matchMaster', matchScore + points + (matchTimer * 5), 45);
          }
        }, 350);
      } else {
        // MATCH FAIL
        setTimeout(() => {
          playSound('wrong');
          setMatchCards(prev => prev.map((c, i) => 
            i === newSelected[0] || i === newSelected[1] 
              ? { ...c, isFlipped: false } 
              : c
          ));
          setSelectedMatchIndices([]);
          setMatchCombo(1);
        }, 750);
      }
    }
  };

  // -------------------------------------------------------------
  // GAME 2: HIGHLAND ANAGRAM SCRAMBLE
  // -------------------------------------------------------------
  const [anagramIndex, setAnagramIndex] = useState(0);
  const [anagramPool, setAnagramPool] = useState<DictionaryEntry[]>([]);
  const [scrambledLetters, setScrambledLetters] = useState<{ letter: string; originalIndex: number; used: boolean }[]>([]);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [anagramScore, setAnagramScore] = useState(0);
  const [revealedHint, setRevealedHint] = useState(false);
  const [anagramIsOver, setAnagramIsOver] = useState(false);

  const initAnagramGame = () => {
    playSound('pop');
    const valid = entries.filter(e => e.word.length >= 4 && !e.word.includes(' ') && !e.word.includes('-'));
    const shuffled = valid.sort(() => 0.5 - Math.random()).slice(0, 5);
    setAnagramPool(shuffled);
    setAnagramIndex(0);
    setAnagramScore(0);
    setAnagramIsOver(false);
    setupAnagramWord(shuffled[0]);
    setActiveGame('anagram');
  };

  const setupAnagramWord = (target: DictionaryEntry) => {
    const letters = target.word.toUpperCase().split('');
    let shuffled = [...letters].sort(() => 0.5 - Math.random());
    if (shuffled.join('') === letters.join('') && letters.length > 2) {
      shuffled = shuffled.reverse();
    }
    setScrambledLetters(shuffled.map((l, idx) => ({ letter: l, originalIndex: idx, used: false })));
    setCurrentGuess([]);
    setRevealedHint(false);
  };

  const handleAnagramTileClick = (index: number) => {
    const tile = scrambledLetters[index];
    if (tile.used) return;
    playSound('click');
    const newLetters = [...scrambledLetters];
    newLetters[index].used = true;
    setScrambledLetters(newLetters);

    const newGuess = [...currentGuess, tile.letter];
    setCurrentGuess(newGuess);

    const currentWord = anagramPool[anagramIndex];
    if (newGuess.length === currentWord.word.length) {
      const guessedString = newGuess.join('').toUpperCase();
      const targetString = currentWord.word.toUpperCase();

      if (guessedString === targetString) {
        playSound('correct');
        speakWord(currentWord.word);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        const gain = revealedHint ? 80 : 120;
        setAnagramScore(prev => prev + gain);

        setTimeout(() => {
          if (anagramIndex + 1 < anagramPool.length) {
            setAnagramIndex(prev => prev + 1);
            setupAnagramWord(anagramPool[anagramIndex + 1]);
          } else {
            setAnagramIsOver(true);
            playSound('celebrate');
            onUpdateScore('anagrams', anagramScore + gain, 40);
          }
        }, 900);
      } else {
        playSound('wrong');
      }
    }
  };

  const handleResetAnagramGuess = () => {
    playSound('click');
    setScrambledLetters(prev => prev.map(t => ({ ...t, used: false })));
    setCurrentGuess([]);
  };

  // -------------------------------------------------------------
  // GAME 3: SYNONYMS & ANTONYMS SHOWDOWN
  // -------------------------------------------------------------
  interface DuelQuestion {
    word: DictionaryEntry;
    type: 'synonym' | 'antonym';
    options: string[];
    correct: string;
    explanation: string;
  }
  const [duelQuestions, setDuelQuestions] = useState<DuelQuestion[]>([]);
  const [duelCurrentIndex, setDuelCurrentIndex] = useState(0);
  const [duelScore, setDuelScore] = useState(0);
  const [duelTimer, setDuelTimer] = useState(15);
  const [duelSelectedAnswer, setDuelSelectedAnswer] = useState<string | null>(null);
  const [duelIsOver, setDuelIsOver] = useState(false);

  const initSynonymDuel = () => {
    playSound('pop');
    const valid = entries.filter(e => e.synonyms.length > 0 && e.antonyms.length > 0);
    const shuffled = valid.sort(() => 0.5 - Math.random()).slice(0, 8);

    const questions: DuelQuestion[] = shuffled.map((entry) => {
      const isSyn = Math.random() > 0.5;
      const targetPool = isSyn ? entry.synonyms : entry.antonyms;
      const correct = targetPool[Math.floor(Math.random() * targetPool.length)];

      const distractors: string[] = [];
      const otherWords = entries.filter(e => e.id !== entry.id);
      while (distractors.length < 3) {
        const randEntry = otherWords[Math.floor(Math.random() * otherWords.length)];
        const wordOption = randEntry.word;
        if (!distractors.includes(wordOption) && wordOption !== correct) {
          distractors.push(wordOption);
        }
      }

      const allOptions = [correct, ...distractors].sort(() => 0.5 - Math.random());

      return {
        word: entry,
        type: isSyn ? 'synonym' : 'antonym',
        options: allOptions,
        correct,
        explanation: isSyn 
          ? `"${correct}" is a synonym of "${entry.word}" (${entry.definition})` 
          : `"${correct}" is the opposite/antonym of "${entry.word}"`
      };
    });

    setDuelQuestions(questions);
    setDuelCurrentIndex(0);
    setDuelScore(0);
    setDuelTimer(15);
    setDuelSelectedAnswer(null);
    setDuelIsOver(false);
    setActiveGame('synonym-duel');
  };

  useEffect(() => {
    if (activeGame !== 'synonym-duel' || duelIsOver || duelSelectedAnswer !== null) return;
    if (duelTimer <= 0) {
      handleDuelAnswer('TIMEOUT');
      return;
    }
    const timer = setInterval(() => {
      setDuelTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeGame, duelTimer, duelIsOver, duelSelectedAnswer]);

  const handleDuelAnswer = (ans: string) => {
    if (duelSelectedAnswer !== null) return;
    setDuelSelectedAnswer(ans);
    const q = duelQuestions[duelCurrentIndex];

    if (ans === q.correct) {
      playSound('correct');
      const timeBonus = Math.max(0, duelTimer * 5);
      setDuelScore(prev => prev + 100 + timeBonus);
    } else {
      playSound('wrong');
    }

    setTimeout(() => {
      if (duelCurrentIndex + 1 < duelQuestions.length) {
        setDuelCurrentIndex(prev => prev + 1);
        setDuelSelectedAnswer(null);
        setDuelTimer(15);
      } else {
        setDuelIsOver(true);
        playSound('celebrate');
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        onUpdateScore('synonymDuel', duelScore + (ans === q.correct ? 100 : 0), 40);
      }
    }, 1200);
  };

  // -------------------------------------------------------------
  // GAME 4: SENTENCE DETECTIVE
  // -------------------------------------------------------------
  interface DetectiveCase {
    sentenceWithBlank: string;
    targetWord: DictionaryEntry;
    options: string[];
    correct: string;
  }
  const [detectiveCases, setDetectiveCases] = useState<DetectiveCase[]>([]);
  const [detectiveIndex, setDetectiveIndex] = useState(0);
  const [detectiveScore, setDetectiveScore] = useState(0);
  const [detectiveChosen, setDetectiveChosen] = useState<string | null>(null);
  const [detectiveIsOver, setDetectiveIsOver] = useState(false);

  const initDetectiveGame = () => {
    playSound('pop');
    const shuffled = [...entries].sort(() => 0.5 - Math.random()).slice(0, 5);

    const cases: DetectiveCase[] = shuffled.map((entry) => {
      const chosenExample = entry.examples[Math.floor(Math.random() * entry.examples.length)];
      const regex = new RegExp(`\\b${entry.word}\\b`, 'gi');
      let blanked = chosenExample.replace(regex, '__________');
      if (!blanked.includes('__________')) {
        blanked = `The student felt completely __________ after experiencing the unexpected Scottish weather.`;
      }

      const distractors = entries
        .filter(e => e.id !== entry.id && e.partOfSpeech === entry.partOfSpeech)
        .slice(0, 3)
        .map(e => e.word);

      const options = [entry.word, ...distractors].sort(() => 0.5 - Math.random());

      return {
        sentenceWithBlank: blanked,
        targetWord: entry,
        options,
        correct: entry.word
      };
    });

    setDetectiveCases(cases);
    setDetectiveIndex(0);
    setDetectiveScore(0);
    setDetectiveChosen(null);
    setDetectiveIsOver(false);
    setActiveGame('detective');
  };

  const handleDetectiveChoice = (option: string) => {
    if (detectiveChosen !== null) return;
    setDetectiveChosen(option);
    const curr = detectiveCases[detectiveIndex];

    if (option.toLowerCase() === curr.correct.toLowerCase()) {
      playSound('correct');
      speakSentence(curr.sentenceWithBlank.replace('__________', curr.correct));
      setDetectiveScore(prev => prev + 120);
    } else {
      playSound('wrong');
    }

    setTimeout(() => {
      if (detectiveIndex + 1 < detectiveCases.length) {
        setDetectiveIndex(prev => prev + 1);
        setDetectiveChosen(null);
      } else {
        setDetectiveIsOver(true);
        playSound('celebrate');
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        onUpdateScore('sentenceDetective', detectiveScore + (option === curr.correct ? 120 : 0), 40);
      }
    }, 1400);
  };

  // -------------------------------------------------------------
  // GAME 5 (NEW): BRITISH VOICE SPELLING BEE & LISTENING QUEST
  // -------------------------------------------------------------
  const [beePool, setBeePool] = useState<DictionaryEntry[]>([]);
  const [beeIndex, setBeeIndex] = useState(0);
  const [beeInput, setBeeInput] = useState('');
  const [beeScore, setBeeScore] = useState(0);
  const [beeStreak, setBeeStreak] = useState(0);
  const [beeShowPhoneticHint, setBeeShowPhoneticHint] = useState(false);
  const [beeShowDefinitionHint, setBeeShowDefinitionHint] = useState(false);
  const [beeFeedback, setBeeFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [beeIsOver, setBeeIsOver] = useState(false);

  const initListeningBee = () => {
    playSound('pop');
    const valid = entries.filter(e => !e.word.includes(' ') && !e.word.includes('-'));
    const shuffled = valid.sort(() => 0.5 - Math.random()).slice(0, 6);
    setBeePool(shuffled);
    setBeeIndex(0);
    setBeeScore(0);
    setBeeStreak(0);
    setBeeInput('');
    setBeeShowPhoneticHint(false);
    setBeeShowDefinitionHint(false);
    setBeeFeedback(null);
    setBeeIsOver(false);
    setActiveGame('listening-bee');

    // Automatically speak the first word
    setTimeout(() => {
      speakWord(shuffled[0].word);
    }, 400);
  };

  const handleBeeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (beeFeedback !== null || beeIsOver) return;

    const currentEntry = beePool[beeIndex];
    const userGuess = beeInput.trim().toLowerCase();
    const correctWord = currentEntry.word.trim().toLowerCase();

    if (userGuess === correctWord) {
      playSound('correct');
      setBeeFeedback('correct');
      const hintDeduction = (beeShowPhoneticHint ? 20 : 0) + (beeShowDefinitionHint ? 15 : 0);
      const points = Math.max(50, 150 - hintDeduction + (beeStreak * 25));
      setBeeScore(prev => prev + points);
      setBeeStreak(prev => prev + 1);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });

      setTimeout(() => {
        if (beeIndex + 1 < beePool.length) {
          const nextIndex = beeIndex + 1;
          setBeeIndex(nextIndex);
          setBeeInput('');
          setBeeShowPhoneticHint(false);
          setBeeShowDefinitionHint(false);
          setBeeFeedback(null);
          speakWord(beePool[nextIndex].word);
        } else {
          setBeeIsOver(true);
          playSound('celebrate');
          onUpdateScore('listeningBee', beeScore + points, 50);
        }
      }, 1200);
    } else {
      playSound('wrong');
      setBeeFeedback('wrong');
      setBeeStreak(0);
      setTimeout(() => {
        setBeeFeedback(null);
      }, 900);
    }
  };

  // -------------------------------------------------------------
  // GAME 6 (NEW): SPEED SLANG & DIALECT CONVEYOR RUSH
  // -------------------------------------------------------------
  type DialectCategory = 'scots' | 'uk-slang' | 'academic';
  interface RushCard {
    entry: DictionaryEntry;
    correctCategory: DialectCategory;
  }
  const [rushQueue, setRushQueue] = useState<RushCard[]>([]);
  const [rushIndex, setRushIndex] = useState(0);
  const [rushScore, setRushScore] = useState(0);
  const [rushTimer, setRushTimer] = useState(45);
  const [rushStreak, setRushStreak] = useState(0);
  const [rushMultiplier, setRushMultiplier] = useState(1);
  const [rushIsOver, setRushIsOver] = useState(false);
  const [rushFeedbackAnimation, setRushFeedbackAnimation] = useState<'flash-green' | 'flash-red' | null>(null);

  const initDialectRush = () => {
    playSound('pop');
    const cards: RushCard[] = entries
      .sort(() => 0.5 - Math.random())
      .slice(0, 30)
      .map(entry => {
        let cat: DialectCategory = 'scots';
        if (entry.isAcademic) {
          cat = 'academic';
        } else if (!entry.isScots || entry.category === 'UK Common & Slang') {
          cat = 'uk-slang';
        } else {
          cat = 'scots';
        }
        return {
          entry,
          correctCategory: cat
        };
      });

    setRushQueue(cards);
    setRushIndex(0);
    setRushScore(0);
    setRushTimer(45);
    setRushStreak(0);
    setRushMultiplier(1);
    setRushIsOver(false);
    setRushFeedbackAnimation(null);
    setActiveGame('dialect-rush');

    // Pronounce first
    if (cards[0]) {
      speakWord(cards[0].entry.word);
    }
  };

  // Rush Timer Loop
  useEffect(() => {
    if (activeGame !== 'dialect-rush' || rushIsOver) return;
    if (rushTimer <= 0) {
      setRushIsOver(true);
      playSound('celebrate');
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      onUpdateScore('speedDialectRush', rushScore, 50);
      return;
    }
    const timer = setInterval(() => {
      setRushTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [activeGame, rushTimer, rushIsOver]);

  const handleRushSort = (category: DialectCategory) => {
    if (rushIsOver || rushIndex >= rushQueue.length) return;
    const current = rushQueue[rushIndex];

    if (category === current.correctCategory) {
      playSound('correct');
      setRushFeedbackAnimation('flash-green');
      const bonus = 100 * rushMultiplier;
      setRushScore(prev => prev + bonus);
      const newStreak = rushStreak + 1;
      setRushStreak(newStreak);
      if (newStreak >= 8) setRushMultiplier(4);
      else if (newStreak >= 5) setRushMultiplier(3);
      else if (newStreak >= 3) setRushMultiplier(2);
      else setRushMultiplier(1);
    } else {
      playSound('wrong');
      setRushFeedbackAnimation('flash-red');
      setRushStreak(0);
      setRushMultiplier(1);
    }

    setTimeout(() => {
      setRushFeedbackAnimation(null);
      if (rushIndex + 1 < rushQueue.length) {
        setRushIndex(prev => prev + 1);
        speakWord(rushQueue[rushIndex + 1].entry.word);
      } else {
        setRushIsOver(true);
        playSound('celebrate');
        onUpdateScore('speedDialectRush', rushScore, 50);
      }
    }, 200);
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      
      {/* ============================================================= */}
      {/* ARCADE HUB / GAME SELECTOR */}
      {/* ============================================================= */}
      {activeGame === 'hub' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-br from-[#12281d] via-[#1b3d2b] to-[#14281f] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden border border-emerald-700/30">
            {/* Ambient decorative blurs & game elements */}
            <div className="absolute -right-10 -top-10 w-72 h-72 bg-gradient-to-br from-amber-400/15 via-emerald-400/20 to-lime-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-1/4 -bottom-10 w-60 h-60 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-8 bottom-3 opacity-15 text-8xl font-black select-none pointer-events-none">
              🎮
            </div>

            <div className="relative z-10 max-w-3xl space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-emerald-400/30 text-xs font-black text-amber-200 shadow-xs">
                <Gamepad2 className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>6 High-Energy Word Arcade Challenges & Audio Quests</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-amber-100">
                Junior Vocabulary Arcade
              </h1>
              <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed font-medium">
                Level up your Scottish slang, UK idioms, and academic vocabulary. Challenge yourself with British voice spelling bees, conveyor belt rush, synonym duels, and anagram scrambles!
              </p>
            </div>
          </div>

          {/* 6 Game Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            
            {/* Game 1: Scots Match Master (Emerald/Forest) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl hover:border-emerald-500 hover:shadow-emerald-950/40 transition-all duration-250 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-2xs">
                ⏱️ 60s Memory
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-emerald-700 to-teal-600 text-amber-200 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-250 shadow-lg shadow-emerald-950/50 border border-emerald-500/40">
                    🧩
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-slate-800 text-emerald-300 rounded-full border border-slate-700 shadow-2xs">
                    Best: {userProgress.gameHighScores.matchMaster} pts
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-100 mb-1.5 group-hover:text-emerald-300 transition-colors">
                  1. Match Master
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed font-medium">
                  Flip tiles to pair Scottish words with definitions in a 60-second pair-matching grid with live audio pronunciation!
                </p>
              </div>
              <button
                id="play-match-master-btn"
                onClick={initMatchGame}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/30"
              >
                <span>Play Match Master</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </button>
            </div>

            {/* Game 2: Highland Anagram Scramble (Warm Amber/Honey) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl hover:border-amber-500 hover:shadow-amber-950/40 transition-all duration-250 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-2xs">
                🔤 Puzzle
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-250 shadow-lg shadow-amber-950/50 border border-amber-300">
                    🔠
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-slate-800 text-amber-300 rounded-full border border-slate-700 shadow-2xs">
                    Best: {userProgress.gameHighScores.anagrams} pts
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-100 mb-1.5 group-hover:text-amber-300 transition-colors">
                  2. Anagram Scramble
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed font-medium">
                  Unscramble jumbled letter tiles to reconstruct vocabulary words using definitions, rhyming hints, and cultural lore!
                </p>
              </div>
              <button
                id="play-anagrams-btn"
                onClick={initAnagramGame}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-300"
              >
                <span>Play Anagram Scramble</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>
            </div>

            {/* Game 3: Synonym & Antonym Duel (Sage / Lime Green) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl hover:border-lime-500 hover:shadow-lime-950/40 transition-all duration-250 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-lime-600 to-emerald-600 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-2xs">
                ⚡ Rapid Quiz
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-lime-600 to-emerald-700 text-white rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-250 shadow-lg shadow-lime-950/50 border border-lime-400/40">
                    ⚔️
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-slate-800 text-lime-300 rounded-full border border-slate-700 shadow-2xs">
                    Best: {userProgress.gameHighScores.synonymDuel} pts
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-100 mb-1.5 group-hover:text-lime-300 transition-colors">
                  3. Synonym & Antonym Duel
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed font-medium">
                  15-second lightning quiz: pick the correct synonym or antonym before time runs out to build combo multipliers!
                </p>
              </div>
              <button
                id="play-synonym-duel-btn"
                onClick={initSynonymDuel}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-lime-600 to-emerald-600 hover:from-lime-500 hover:to-emerald-500 active:scale-95 text-white font-black text-xs shadow-lg shadow-lime-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-lime-400/30"
              >
                <span>Play Synonym Duel</span>
                <ArrowRight className="w-4 h-4 text-lime-200" />
              </button>
            </div>

            {/* Game 4: Sentence Detective (Warm Ochre / Gold) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl hover:border-yellow-500 hover:shadow-yellow-950/40 transition-all duration-250 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-600 to-amber-600 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-2xs">
                🕵️ Clues
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-yellow-600 to-amber-600 text-white rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-250 shadow-lg shadow-yellow-950/50 border border-yellow-400/40">
                    🔎
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-slate-800 text-yellow-300 rounded-full border border-slate-700 shadow-2xs">
                    Best: {userProgress.gameHighScores.sentenceDetective} pts
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-100 mb-1.5 group-hover:text-yellow-300 transition-colors">
                  4. Sentence Detective
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed font-medium">
                  Deduce missing words in Scottish school stories and everyday banter using rich contextual sentence clues!
                </p>
              </div>
              <button
                id="play-detective-btn"
                onClick={initDetectiveGame}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 active:scale-95 text-white font-black text-xs shadow-lg shadow-yellow-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-yellow-400/30"
              >
                <span>Play Detective</span>
                <ArrowRight className="w-4 h-4 text-yellow-200" />
              </button>
            </div>

            {/* Game 5: British Voice Spelling Bee (Teal Forest) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl hover:border-teal-500 hover:shadow-teal-950/40 transition-all duration-250 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-2xs">
                🇬🇧 Voice Quest
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-teal-600 to-emerald-600 text-amber-200 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-250 shadow-lg shadow-teal-950/50 border border-teal-400/40">
                    🐝
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-slate-800 text-teal-300 rounded-full border border-slate-700 shadow-2xs">
                    Best: {userProgress.gameHighScores.listeningBee || 0} pts
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-100 mb-1.5 group-hover:text-teal-300 transition-colors flex items-center gap-1.5">
                  5. British Voice Spelling Bee
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed font-medium">
                  Listen to the young British female voice pronounce words, hear slow audio phonetics, and test your spelling accuracy!
                </p>
              </div>
              <button
                id="play-listening-bee-btn"
                onClick={initListeningBee}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 active:scale-95 text-white font-black text-xs shadow-lg shadow-teal-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-teal-400/30"
              >
                <span>Start Voice Spelling Bee</span>
                <ArrowRight className="w-4 h-4 text-teal-200" />
              </button>
            </div>

            {/* Game 6: Speed Slang & Dialect Conveyor Rush (Forest Pine / Amber) */}
            <div className="bg-slate-900/85 backdrop-blur-md rounded-3xl p-6 border border-slate-800 shadow-xl hover:border-sky-500 hover:shadow-sky-950/40 transition-all duration-250 flex flex-col justify-between group relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-to-r from-sky-600 to-teal-600 text-white font-black text-[10px] px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-2xs">
                ⚡ 45s Rush
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-tr from-sky-600 to-teal-600 text-amber-200 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-250 shadow-lg shadow-sky-950/50 border border-sky-400/40">
                    ⚡
                  </div>
                  <span className="text-xs font-black px-3 py-1 bg-slate-800 text-sky-300 rounded-full border border-slate-700 shadow-2xs">
                    Best: {userProgress.gameHighScores.speedDialectRush || 0} pts
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-100 mb-1.5 group-hover:text-sky-300 transition-colors">
                  6. Dialect Conveyor Rush
                </h3>
                <p className="text-xs text-slate-400 mb-5 leading-relaxed font-medium">
                  Fast-paced 45s sorting arcade: rapidly categorize incoming words into Scots Regional, UK Slang, or Academic Power!
                </p>
              </div>
              <button
                id="play-rush-btn"
                onClick={initDialectRush}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 active:scale-95 text-white font-black text-xs shadow-lg shadow-sky-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer border border-sky-400/30"
              >
                <span>Play Dialect Rush</span>
                <ArrowRight className="w-4 h-4 text-sky-200" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* ACTIVE GAME 1: MATCH MASTER */}
      {/* ============================================================= */}
      {activeGame === 'match' && (
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Game 1</span>
              <h2 className="text-2xl font-black text-slate-100">Scots Match Master</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-emerald-300 font-extrabold text-sm border border-slate-700">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{matchTimer}s</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 font-extrabold text-sm border border-slate-700">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>{matchScore} pts</span>
              </div>
              {matchCombo > 1 && (
                <div className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs animate-bounce shadow-xs">
                  {matchCombo}x Combo!
                </div>
              )}
            </div>
          </div>

          {!matchIsOver ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {matchCards.map((card, idx) => {
                const isSelected = selectedMatchIndices.includes(idx);
                return (
                  <button
                    key={card.id}
                    id={`match-card-${idx}`}
                    disabled={card.isMatched}
                    onClick={() => handleMatchCardClick(idx)}
                    className={`h-28 sm:h-32 p-3 rounded-2xl border-2 font-bold text-xs sm:text-sm flex items-center justify-center text-center transition-all duration-200 select-none cursor-pointer ${
                      card.isMatched
                        ? 'bg-slate-800/80 border-emerald-500/50 text-emerald-400 opacity-60 scale-95'
                        : isSelected || card.isFlipped
                        ? card.type === 'word'
                          ? 'bg-emerald-700 text-amber-100 border-emerald-500 shadow-lg scale-105'
                          : 'bg-teal-700 text-amber-100 border-teal-500 shadow-lg scale-105'
                        : 'bg-slate-800/70 border-slate-700 text-slate-200 hover:border-emerald-500 hover:bg-slate-800 shadow-md'
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? (
                      <span className="leading-snug">
                        {card.type === 'word' && <span className="block text-[10px] uppercase text-amber-200 mb-1">🏴󠁧󠁢󠁳󠁣󠁴󠁿 Word</span>}
                        {card.type === 'meaning' && <span className="block text-[10px] uppercase text-emerald-200 mb-1">📖 Meaning</span>}
                        {card.text}
                      </span>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-400">
                        <span className="text-2xl">🌿</span>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold">Tap to Flip</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">🎉</div>
              <h3 className="text-2xl font-black text-slate-100">
                Match Master Complete!
              </h3>
              <p className="text-slate-300">
                You scored <strong className="text-emerald-400 text-lg">{matchScore} points</strong> (+45 EXP)!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={initMatchGame}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md cursor-pointer transition-colors"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setActiveGame('hub')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm cursor-pointer border border-slate-700 transition-colors"
                >
                  Arcade Hub
                </button>
              </div>
            </div>
          )}

          {!matchIsOver && (
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Arcade Menu</span>
            </button>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* ACTIVE GAME 2: ANAGRAM SCRAMBLE */}
      {/* ============================================================= */}
      {activeGame === 'anagram' && anagramPool.length > 0 && (
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Word {anagramIndex + 1} of {anagramPool.length}
              </span>
              <h2 className="text-2xl font-black text-slate-100">Highland Anagram Scramble</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 font-extrabold text-sm border border-slate-700">
                Score: {anagramScore}
              </span>
            </div>
          </div>

          {!anagramIsOver ? (
            <div className="space-y-6">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 text-center space-y-1">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Clue & Definition
                </span>
                <p className="text-sm sm:text-base font-semibold text-slate-100">
                  "{anagramPool[anagramIndex].definition}"
                </p>
                <p className="text-xs text-slate-400 italic">
                  Region: {anagramPool[anagramIndex].scotsRegion} • {anagramPool[anagramIndex].partOfSpeech}
                </p>
              </div>

              {/* Guess Display */}
              <div className="flex justify-center items-center gap-2 min-h-14">
                {Array.from({ length: anagramPool[anagramIndex].word.length }).map((_, idx) => {
                  const letter = currentGuess[idx];
                  return (
                    <div
                      key={idx}
                      className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center font-black text-lg sm:text-xl shadow-xs transition-all ${
                        letter
                          ? 'bg-gradient-to-tr from-amber-400 to-yellow-400 border-amber-500 text-slate-950 scale-105'
                          : 'bg-slate-800/70 border-dashed border-slate-600 text-slate-500'
                      }`}
                    >
                      {letter || ''}
                    </div>
                  );
                })}
              </div>

              {/* Scrambled Letter Tiles */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                {scrambledLetters.map((tile, idx) => (
                  <button
                    key={idx}
                    id={`anagram-tile-${idx}`}
                    disabled={tile.used}
                    onClick={() => handleAnagramTileClick(idx)}
                    className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl font-black text-lg sm:text-xl shadow-md transition-all cursor-pointer ${
                      tile.used
                        ? 'bg-slate-800/40 text-slate-600 border border-slate-800 shadow-none scale-90 cursor-not-allowed'
                        : 'bg-slate-800 border-2 border-emerald-500/60 text-emerald-200 hover:bg-emerald-600 hover:text-white hover:scale-105 active:scale-95'
                    }`}
                  >
                    {tile.letter}
                  </button>
                ))}
              </div>

              {/* Tools */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleResetAnagramGuess}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Guess</span>
                </button>

                {!revealedHint && (
                  <button
                    onClick={() => {
                      setRevealedHint(true);
                      playSound('pop');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reveal First Letter Hint</span>
                  </button>
                )}
              </div>

              {revealedHint && (
                <div className="text-center text-xs font-bold text-amber-300 bg-amber-500/15 p-2.5 rounded-xl border border-amber-500/30">
                  💡 Hint: Starts with <strong>'{anagramPool[anagramIndex].word[0].toUpperCase()}'</strong> • Rhymes with: "{anagramPool[anagramIndex].rhymesWith?.[0] || '...'}"
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">🏆</div>
              <h3 className="text-2xl font-black text-slate-100">
                Anagram Challenge Conquered!
              </h3>
              <p className="text-slate-300">
                Final Score: <strong className="text-amber-400 text-lg">{anagramScore} pts</strong> (+40 EXP)
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={initAnagramGame}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-extrabold text-sm shadow-md cursor-pointer border border-amber-300 transition-colors"
                >
                  Play Another Round
                </button>
                <button
                  onClick={() => setActiveGame('hub')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm cursor-pointer border border-slate-700 transition-colors"
                >
                  Arcade Hub
                </button>
              </div>
            </div>
          )}

          {!anagramIsOver && (
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Arcade Menu</span>
            </button>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* ACTIVE GAME 3: SYNONYM & ANTONYM DUEL */}
      {/* ============================================================= */}
      {activeGame === 'synonym-duel' && duelQuestions.length > 0 && (
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-lime-400">
                Question {duelCurrentIndex + 1} of {duelQuestions.length}
              </span>
              <h2 className="text-2xl font-black text-slate-100">Synonym & Antonym Duel</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-lime-300 font-extrabold text-sm border border-slate-700">
                <Clock className="w-4 h-4 text-lime-400" />
                <span>{duelTimer}s</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-100 font-extrabold text-sm border border-slate-700">
                {duelScore} pts
              </div>
            </div>
          </div>

          {!duelIsOver ? (
            <div className="space-y-6">
              <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 text-center space-y-2 relative">
                <span className="text-xs font-black uppercase tracking-widest text-lime-400">
                  {duelQuestions[duelCurrentIndex].type === 'synonym' ? '🌿 FIND THE SYNONYM (SAME MEANING)' : '⚡ FIND THE ANTONYM (OPPOSITE)'}
                </span>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-3xl font-black text-slate-100">
                    "{duelQuestions[duelCurrentIndex].word.word}"
                  </h3>
                  <button
                    onClick={() => speakWord(duelQuestions[duelCurrentIndex].word.word)}
                    className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-lime-300 transition-colors cursor-pointer"
                    title="Pronounce with British female voice"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Definition: {duelQuestions[duelCurrentIndex].word.definition}
                </p>
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {duelQuestions[duelCurrentIndex].options.map((opt, idx) => {
                  const isChosen = duelSelectedAnswer === opt;
                  const isCorrect = opt === duelQuestions[duelCurrentIndex].correct;
                  
                  let btnStyle = 'bg-slate-800/80 border-2 border-slate-700 text-slate-100 hover:border-lime-500 hover:bg-slate-800';
                  if (duelSelectedAnswer !== null) {
                    if (isCorrect) {
                      btnStyle = 'bg-lime-600 border-lime-500 text-slate-950 font-black shadow-lg scale-102';
                    } else if (isChosen && !isCorrect) {
                      btnStyle = 'bg-red-900/80 border-red-700 text-white';
                    } else {
                      btnStyle = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      id={`duel-opt-${idx}`}
                      disabled={duelSelectedAnswer !== null}
                      onClick={() => handleDuelAnswer(opt)}
                      className={`p-4 rounded-2xl font-bold text-sm sm:text-base transition-all text-center flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span className="mx-auto">{opt}</span>
                      {duelSelectedAnswer !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-slate-950 ml-2" />}
                      {duelSelectedAnswer !== null && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-red-300 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {duelSelectedAnswer !== null && (
                <div className="text-xs font-semibold text-slate-200 bg-slate-800/90 p-3 rounded-xl border border-slate-700 text-center animate-in fade-in">
                  💡 {duelQuestions[duelCurrentIndex].explanation}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">⚔️</div>
              <h3 className="text-2xl font-black text-slate-100">
                Showdown Completed!
              </h3>
              <p className="text-slate-300">
                You scored <strong className="text-lime-400 text-lg">{duelScore} points</strong> (+40 EXP)!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={initSynonymDuel}
                  className="px-6 py-2.5 rounded-xl bg-lime-600 hover:bg-lime-500 text-slate-950 font-extrabold text-sm shadow-md cursor-pointer transition-colors"
                >
                  Play Again
                </button>
                <button
                  onClick={() => setActiveGame('hub')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm cursor-pointer border border-slate-700 transition-colors"
                >
                  Arcade Hub
                </button>
              </div>
            </div>
          )}

          {!duelIsOver && (
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Arcade Menu</span>
            </button>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* ACTIVE GAME 4: SENTENCE DETECTIVE */}
      {/* ============================================================= */}
      {activeGame === 'detective' && detectiveCases.length > 0 && (
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                Case {detectiveIndex + 1} of {detectiveCases.length}
              </span>
              <h2 className="text-2xl font-black text-slate-100">Sentence Detective</h2>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-800 text-yellow-300 font-extrabold text-sm border border-slate-700">
              Score: {detectiveScore}
            </div>
          </div>

          {!detectiveIsOver ? (
            <div className="space-y-6">
              <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 text-center space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-yellow-400">
                  🔍 Find the Missing Word in Context:
                </span>
                <p className="text-lg sm:text-xl font-bold text-slate-100 italic leading-relaxed">
                  "{detectiveCases[detectiveIndex].sentenceWithBlank}"
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Clue: {detectiveCases[detectiveIndex].targetWord.definition}
                </p>
              </div>

              {/* 4 Choices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detectiveCases[detectiveIndex].options.map((opt, idx) => {
                  const isChosen = detectiveChosen === opt;
                  const isCorrect = opt === detectiveCases[detectiveIndex].correct;

                  let style = 'bg-slate-800/80 border-2 border-slate-700 text-slate-100 hover:border-yellow-500 hover:bg-slate-800';
                  if (detectiveChosen !== null) {
                    if (isCorrect) {
                      style = 'bg-yellow-600 border-yellow-500 text-slate-950 font-black shadow-lg scale-102';
                    } else if (isChosen && !isCorrect) {
                      style = 'bg-red-900/80 border-red-700 text-white';
                    } else {
                      style = 'bg-slate-800/40 border-slate-800 text-slate-500 opacity-50';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      id={`detective-opt-${idx}`}
                      disabled={detectiveChosen !== null}
                      onClick={() => handleDetectiveChoice(opt)}
                      className={`p-4 rounded-2xl font-black text-sm sm:text-base transition-all text-center flex items-center justify-between cursor-pointer ${style}`}
                    >
                      <span className="mx-auto">{opt}</span>
                      {detectiveChosen !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-slate-950 ml-2" />}
                      {detectiveChosen !== null && isChosen && !isCorrect && <XCircle className="w-5 h-5 text-red-300 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">🕵️‍♂️</div>
              <h3 className="text-2xl font-black text-slate-100">
                Case Solved, Master Detective!
              </h3>
              <p className="text-slate-300">
                You scored <strong className="text-yellow-400 text-lg">{detectiveScore} points</strong> (+40 EXP)!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={initDetectiveGame}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-md cursor-pointer border border-yellow-400/30 transition-colors"
                >
                  Solve More Cases
                </button>
                <button
                  onClick={() => setActiveGame('hub')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm cursor-pointer border border-slate-700 transition-colors"
                >
                  Arcade Hub
                </button>
              </div>
            </div>
          )}

          {!detectiveIsOver && (
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Arcade Menu</span>
            </button>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* ACTIVE GAME 5: BRITISH VOICE SPELLING BEE */}
      {/* ============================================================= */}
      {activeGame === 'listening-bee' && beePool.length > 0 && (
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                Spelling Quest {beeIndex + 1} of {beePool.length}
              </span>
              <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                <span>British Voice Spelling Bee</span>
                <span className="text-sm">🐝</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {beeStreak > 1 && (
                <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-xs animate-pulse">
                  🔥 {beeStreak} Streak
                </span>
              )}
              <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-teal-300 font-extrabold text-sm border border-slate-700">
                Score: {beeScore}
              </span>
            </div>
          </div>

          {!beeIsOver ? (
            <div className="space-y-6">
              {/* Audio Listen Pod */}
              <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-teal-700 to-emerald-700 text-amber-200 rounded-3xl flex items-center justify-center shadow-lg shadow-teal-950/50 border border-teal-500/30">
                  <Ear className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-100">
                    Listen to the British Pronunciation
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Type the correct spelling of the spoken word below
                  </p>
                </div>

                {/* Audio Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    onClick={() => speakWord(beePool[beeIndex].word)}
                    className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Pronounce Word (Normal)</span>
                  </button>

                  <button
                    onClick={() => speakWord(beePool[beeIndex].word, { rate: 0.72 })}
                    className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                  >
                    <Volume1 className="w-4 h-4 text-teal-400" />
                    <span>Slow Phonetics (0.7x)</span>
                  </button>
                </div>
              </div>

              {/* Hints Drawer */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {!beeShowDefinitionHint && (
                  <button
                    onClick={() => {
                      setBeeShowDefinitionHint(true);
                      playSound('pop');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
                    <span>Definition Clue (-15 pts)</span>
                  </button>
                )}

                {!beeShowPhoneticHint && (
                  <button
                    onClick={() => {
                      setBeeShowPhoneticHint(true);
                      playSound('pop');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-700"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Phonetic Guide Clue (-20 pts)</span>
                  </button>
                )}
              </div>

              {/* Revealed Hints */}
              {beeShowDefinitionHint && (
                <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700 text-center text-xs text-teal-300 font-semibold animate-in fade-in">
                  📖 Definition: <strong>"{beePool[beeIndex].definition}"</strong>
                </div>
              )}

              {beeShowPhoneticHint && (
                <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700 text-center text-xs text-amber-300 font-semibold animate-in fade-in">
                  🗣️ Phonetic Guide: <strong>{beePool[beeIndex].phoneticGuide}</strong> ({beePool[beeIndex].phonetic})
                </div>
              )}

              {/* Spelling Input Box */}
              <form onSubmit={handleBeeSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    id="spelling-bee-input"
                    type="text"
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    placeholder="Type the word here..."
                    value={beeInput}
                    onChange={(e) => setBeeInput(e.target.value)}
                    className={`w-full text-center py-4 px-6 rounded-2xl text-xl sm:text-2xl font-black tracking-wider border-2 transition-all outline-hidden ${
                      beeFeedback === 'correct'
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                        : beeFeedback === 'wrong'
                        ? 'bg-rose-950/60 border-rose-500 text-rose-200 shake'
                        : 'bg-slate-800 border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 text-slate-100 placeholder:text-slate-500'
                    }`}
                  />
                  {beeFeedback === 'correct' && (
                    <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" />
                  )}
                  {beeFeedback === 'wrong' && (
                    <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-rose-400" />
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-2xl bg-teal-600 hover:bg-teal-500 active:scale-98 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
                  >
                    Submit Spelling ↵
                  </button>
                  <button
                    type="button"
                    onClick={() => setBeeInput('')}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer border border-slate-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">🐝</div>
              <h3 className="text-2xl font-black text-slate-100">
                Spelling Bee Complete!
              </h3>
              <p className="text-slate-300">
                You scored <strong className="text-teal-400 text-lg">{beeScore} points</strong> with a bonus of +50 EXP!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={initListeningBee}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm shadow-md cursor-pointer transition-colors"
                >
                  Play Another Round
                </button>
                <button
                  onClick={() => setActiveGame('hub')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm cursor-pointer border border-slate-700 transition-colors"
                >
                  Arcade Hub
                </button>
              </div>
            </div>
          )}

          {!beeIsOver && (
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Arcade Menu</span>
            </button>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* ACTIVE GAME 6: SPEED SLANG & DIALECT CONVEYOR RUSH */}
      {/* ============================================================= */}
      {activeGame === 'dialect-rush' && rushQueue.length > 0 && (
        <div className="bg-slate-900/90 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Card {rushIndex + 1} of {rushQueue.length}
              </span>
              <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
                <span>Dialect Conveyor Rush</span>
                <span className="text-sm">⚡</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-extrabold text-sm border ${
                rushTimer <= 10 ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 animate-pulse' : 'bg-slate-800 border-slate-700 text-slate-100'
              }`}>
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{rushTimer}s</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-extrabold text-sm">
                {rushScore} pts
              </div>
              {rushMultiplier > 1 && (
                <div className="px-2.5 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs animate-bounce shadow-xs">
                  {rushMultiplier}x Fever!
                </div>
              )}
            </div>
          </div>

          {!rushIsOver && rushIndex < rushQueue.length ? (
            <div className="space-y-6">
              {/* Conveyor Word Card */}
              <div className={`p-8 rounded-3xl border-2 text-center space-y-3 transition-all duration-150 ${
                rushFeedbackAnimation === 'flash-green'
                  ? 'bg-emerald-950/60 border-emerald-500 scale-102'
                  : rushFeedbackAnimation === 'flash-red'
                  ? 'bg-amber-950/60 border-amber-500 shake'
                  : 'bg-slate-800/80 border-slate-700 shadow-lg'
              }`}>
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
                    {rushQueue[rushIndex].entry.word}
                  </h3>
                  <button
                    onClick={() => speakWord(rushQueue[rushIndex].entry.word)}
                    className="p-1.5 rounded-full bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-slate-600 cursor-pointer transition-colors"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-300 max-w-md mx-auto">
                  "{rushQueue[rushIndex].entry.definition}"
                </p>
                <div className="text-[11px] font-bold text-emerald-400">
                  Phonetics: {rushQueue[rushIndex].entry.phoneticGuide}
                </div>
              </div>

              {/* 3 Sorting Buckets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  id="sort-bucket-scots"
                  onClick={() => handleRushSort('scots')}
                  className="p-4 rounded-2xl bg-slate-800/90 border-2 border-emerald-500/40 hover:bg-emerald-700 hover:border-emerald-500 hover:text-white group text-emerald-200 font-black text-sm flex flex-col items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🏴󠁧󠁢󠁳󠁣󠁴󠁿</span>
                  <span>Scots Regional</span>
                  <span className="text-[10px] font-semibold text-emerald-400 group-hover:text-emerald-100">
                    Braw, Dreich, Gallus
                  </span>
                </button>

                <button
                  id="sort-bucket-uk-slang"
                  onClick={() => handleRushSort('uk-slang')}
                  className="p-4 rounded-2xl bg-slate-800/90 border-2 border-amber-500/40 hover:bg-amber-500 hover:border-amber-400 hover:text-slate-950 group text-amber-200 font-black text-sm flex flex-col items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🇬🇧</span>
                  <span>UK Common & Slang</span>
                  <span className="text-[10px] font-semibold text-amber-400 group-hover:text-slate-950">
                    Chuffed, Dodgy, Proper
                  </span>
                </button>

                <button
                  id="sort-bucket-academic"
                  onClick={() => handleRushSort('academic')}
                  className="p-4 rounded-2xl bg-slate-800/90 border-2 border-lime-500/40 hover:bg-lime-600 hover:border-lime-400 hover:text-slate-950 group text-lime-200 font-black text-sm flex flex-col items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🎓</span>
                  <span>Academic Power</span>
                  <span className="text-[10px] font-semibold text-lime-400 group-hover:text-slate-950">
                    Articulate, Resilient
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">⚡</div>
              <h3 className="text-2xl font-black text-slate-100">
                Dialect Rush Finished!
              </h3>
              <p className="text-slate-300">
                You scored <strong className="text-emerald-400 text-lg">{rushScore} points</strong> with +50 EXP!
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={initDialectRush}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-md cursor-pointer border border-emerald-400/30 transition-colors"
                >
                  Play Another 45s Rush
                </button>
                <button
                  onClick={() => setActiveGame('hub')}
                  className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm cursor-pointer border border-slate-700 transition-colors"
                >
                  Arcade Hub
                </button>
              </div>
            </div>
          )}

          {!rushIsOver && (
            <button
              onClick={() => setActiveGame('hub')}
              className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Arcade Menu</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
};
