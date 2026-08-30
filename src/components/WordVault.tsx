import React, { useState } from 'react';
import { 
  Star, Plus, Trash2, BookOpen, Layers, Volume2, Sparkles, 
  Download, Upload, CheckCircle2, RotateCw, X, ChevronLeft, ChevronRight, Tag
} from 'lucide-react';
import { DictionaryEntry, UserProgress, PartOfSpeech, ScottishRegion, WordCategory } from '../types/dictionary';
import { speakWord, speakSentence, cancelSpeech } from '../utils/speech';
import { playSound } from '../utils/soundEffects';
import { HighlightedText } from '../utils/textHighlight';
import { SoundWaveIcon } from './SoundWaveIcon';

interface WordVaultProps {
  entries: DictionaryEntry[];
  userProgress: UserProgress;
  onToggleStar: (wordId: string) => void;
  onAddCustomWord: (word: DictionaryEntry) => void;
  onDeleteCustomWord: (wordId: string) => void;
  onExportVault: () => void;
  onImportVault: (entries: DictionaryEntry[]) => void;
}

export const WordVault: React.FC<WordVaultProps> = ({
  entries,
  userProgress,
  onToggleStar,
  onAddCustomWord,
  onDeleteCustomWord,
  onExportVault,
  onImportVault,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'starred' | 'flashcards' | 'custom'>('starred');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const handlePronounce = (text: string, id: string, rate: number = 0.9) => {
    if (playingAudioId === id) {
      cancelSpeech();
      setPlayingAudioId(null);
      return;
    }
    setPlayingAudioId(id);
    speakSentence(text, {
      rate,
      onEnd: () => setPlayingAudioId((prev) => (prev === id ? null : prev)),
    });
  };
  
  // Flashcard State
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Add Custom Word Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [newWord, setNewWord] = useState('');
  const [newPartOfSpeech, setNewPartOfSpeech] = useState<PartOfSpeech>('noun');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newPhoneticGuide, setNewPhoneticGuide] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newExample1, setNewExample1] = useState('');
  const [newExample2, setNewExample2] = useState('');
  const [newSynonyms, setNewSynonyms] = useState('');
  const [newAntonyms, setNewAntonyms] = useState('');
  const [newRegion, setNewRegion] = useState<ScottishRegion>('General Scots & Scotland');
  const [newCategory, setNewCategory] = useState<WordCategory>('School & Banter');
  const [newLore, setNewLore] = useState('');

  // Filter starred words
  const starredEntries = entries.filter(e => userProgress.starredWordIds.includes(e.id));
  const customEntries = userProgress.customWords;

  // Flashcards pool
  const flashcardPool = starredEntries.length > 0 ? starredEntries : entries.slice(0, 10);
  const currentFlashcard = flashcardPool[cardIndex] || flashcardPool[0];

  const handleNextCard = () => {
    playSound('click');
    setIsFlipped(false);
    setCardIndex(prev => (prev + 1) % flashcardPool.length);
  };

  const handlePrevCard = () => {
    playSound('click');
    setIsFlipped(false);
    setCardIndex(prev => (prev - 1 + flashcardPool.length) % flashcardPool.length);
  };

  const handleFlipCard = () => {
    playSound('pop');
    setIsFlipped(prev => !prev);
  };

  // Submit custom word
  const handleSaveCustomWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newDefinition.trim() || !newExample1.trim() || !newExample2.trim()) {
      setFormError('Please provide the word, definition, and both context examples!');
      playSound('wrong');
      return;
    }
    setFormError(null);

    const created: DictionaryEntry = {
      id: `custom-${Date.now()}`,
      word: newWord.trim(),
      partOfSpeech: newPartOfSpeech,
      phonetic: newPhonetic.trim() || `/${newWord.toLowerCase()}/`,
      phoneticGuide: newPhoneticGuide.trim() || newWord.toUpperCase(),
      definition: newDefinition.trim(),
      examples: [newExample1.trim(), newExample2.trim()],
      synonyms: newSynonyms.split(',').map(s => s.trim()).filter(Boolean),
      antonyms: newAntonyms.split(',').map(a => a.trim()).filter(Boolean),
      scotsRegion: newRegion,
      category: newCategory,
      loreOrFunFact: newLore.trim() || undefined,
      isScots: true,
      isAcademic: false,
      difficulty: 'P6-P7 (Starter)',
      tags: ['Custom', 'User Added'],
      customUserAdded: true,
    };

    onAddCustomWord(created);
    playSound('correct');
    setShowAddModal(false);

    // Reset form
    setNewWord('');
    setNewDefinition('');
    setNewExample1('');
    setNewExample2('');
    setNewSynonyms('');
    setNewAntonyms('');
    setNewLore('');
  };

  // File import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportVault(parsed);
          playSound('correct');
          setImportStatus(`Successfully imported ${parsed.length} custom vocabulary items!`);
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Invalid JSON format: expected an array of word entries.');
          playSound('wrong');
        }
      } catch (err) {
        setImportStatus('Could not read JSON file. Please check file format.');
        playSound('wrong');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 sm:pb-8">
      
      {/* Vault Header */}
      <div className="bg-gradient-to-br from-[#12281d] via-[#1b3d2b] to-[#14281f] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-gradient-to-br from-amber-400/20 via-emerald-400/20 to-lime-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/4 -bottom-10 w-60 h-60 bg-emerald-600/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-8 bottom-3 opacity-15 text-8xl font-black select-none pointer-events-none">
          ⭐
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-emerald-400/30 text-xs font-black text-amber-200 shadow-2xs">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
              <span>Personal Study Vault & Interactive 3D Flashcards</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-amber-100">
              My Word Vault
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl font-medium">
              Save your favourite Scottish words, practice with interactive 3D flashcards, and create your own custom school vocabulary bank!
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="add-custom-word-btn"
              onClick={() => {
                setShowAddModal(true);
                playSound('click');
              }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-md active:scale-95 transition-all whitespace-nowrap cursor-pointer hover:scale-105 border border-amber-300"
            >
              <Plus className="w-5 h-5 text-slate-950 font-black" />
              <span>Add Custom Word</span>
            </button>
          </div>
        </div>
      </div>

      {importStatus && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs sm:text-sm font-black text-emerald-950 flex items-center justify-between shadow-xs animate-fadeIn">
          <span>{importStatus}</span>
          <button
            onClick={() => setImportStatus(null)}
            className="text-emerald-800 hover:text-emerald-950 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub navigation bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white/90 backdrop-blur-md p-2 rounded-2xl border border-emerald-900/10 shadow-2xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            id="subtab-starred"
            onClick={() => {
              setActiveSubTab('starred');
              playSound('click');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeSubTab === 'starred'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md scale-105 border border-amber-300'
                : 'text-[#4b6354] hover:text-[#14281f] hover:bg-amber-50/60'
            }`}
          >
            <Star className={`w-4 h-4 ${activeSubTab === 'starred' ? 'fill-slate-950 text-slate-950' : 'text-amber-600 fill-amber-600'}`} />
            <span>Starred Words ({starredEntries.length})</span>
          </button>

          <button
            id="subtab-flashcards"
            onClick={() => {
              setActiveSubTab('flashcards');
              playSound('click');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeSubTab === 'flashcards'
                ? 'bg-gradient-to-r from-emerald-800 to-teal-800 text-amber-100 shadow-md scale-105 border border-emerald-700'
                : 'text-[#4b6354] hover:text-[#14281f] hover:bg-emerald-50/60'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Interactive Flashcards</span>
          </button>

          <button
            id="subtab-custom"
            onClick={() => {
              setActiveSubTab('custom');
              playSound('click');
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
              activeSubTab === 'custom'
                ? 'bg-gradient-to-r from-teal-800 to-emerald-900 text-amber-100 shadow-md scale-105 border border-teal-700'
                : 'text-[#4b6354] hover:text-[#14281f] hover:bg-teal-50/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-teal-600" />
            <span>Custom Words ({customEntries.length})</span>
          </button>
        </div>

        {/* Export / Import */}
        <div className="flex items-center gap-2">
          <button
            onClick={onExportVault}
            title="Download word bank as JSON file"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold border border-emerald-900/10 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Vault</span>
          </button>

          <label className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 text-xs font-bold border border-emerald-900/10 transition-colors cursor-pointer shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 1: STARRED WORDS LIST */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'starred' && (
        <div className="space-y-4">
          {starredEntries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-900/10 shadow-xs max-w-lg mx-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-amber-200">
                ⭐
              </div>
              <h3 className="text-lg font-bold text-[#14281f] mb-1">Your Vault is Empty</h3>
              <p className="text-sm text-[#4b6354] mb-4">
                Star any Scottish slang or academic word in the A-Z Dictionary to save it for quick revision!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {starredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Top Bar with Word & Bookmark on Left and Audio Button Aligned to Far Right */}
                    <div className="flex items-start justify-between gap-3 mb-2.5 pr-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-[#14281f]">{entry.word}</h3>
                          {/* Star / Remove button next to title */}
                          <button
                            onClick={() => {
                              onToggleStar(entry.id);
                              playSound('pop');
                            }}
                            title="Remove from vault"
                            aria-label={`Remove ${entry.word} from vault`}
                            className="p-1 text-amber-500 hover:text-slate-400 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                          >
                            <Star className="w-4 h-4 fill-amber-500" />
                          </button>
                        </div>
                        <span className="text-xs font-mono text-[#4b6354] font-bold">{entry.phonetic} • {entry.partOfSpeech}</span>
                      </div>

                      {/* 1. Word Sound button on right */}
                      <button
                        id={`vault-word-sound-${entry.id}`}
                        onClick={() => handlePronounce(entry.word, `vault-w-${entry.id}`, 0.85)}
                        title={`Listen to pronunciation of "${entry.word}"`}
                        aria-label={`Listen to ${entry.word}`}
                        className={`w-8 h-8 rounded-xl border shadow-2xs flex items-center justify-center transition-transform active:scale-95 cursor-pointer shrink-0 ${
                          playingAudioId === `vault-w-${entry.id}`
                            ? 'bg-emerald-800 text-amber-100 border-emerald-700'
                            : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
                        }`}
                      >
                        <SoundWaveIcon isPlaying={playingAudioId === `vault-w-${entry.id}`} size="sm" />
                      </button>
                    </div>

                    {/* Definition */}
                    <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/30 rounded-xl p-3 border border-emerald-900/10 mb-3 flex items-start justify-between gap-2 shadow-2xs">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-[#14281f] font-semibold leading-relaxed">
                          {entry.definition}
                        </p>
                      </div>
                      {/* 2. Definition sound button */}
                      <button
                        id={`vault-def-sound-${entry.id}`}
                        onClick={() => handlePronounce(entry.definition, `vault-def-${entry.id}`, 0.9)}
                        title="Listen to definition"
                        aria-label={`Read definition: ${entry.definition}`}
                        className={`w-7 h-7 rounded-lg border shadow-2xs flex items-center justify-center shrink-0 cursor-pointer ${
                          playingAudioId === `vault-def-${entry.id}`
                            ? 'bg-emerald-800 text-amber-100 border-emerald-700'
                            : 'bg-white text-emerald-900 hover:bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <SoundWaveIcon isPlaying={playingAudioId === `vault-def-${entry.id}`} size="sm" />
                      </button>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {entry.examples.map((ex, i) => {
                        const exAudioId = `vault-ex-${entry.id}-${i}`;
                        return (
                          <div key={i} className="bg-white p-2.5 rounded-xl border border-emerald-900/10 text-xs italic text-[#14281f] flex items-start justify-between gap-2 shadow-2xs">
                            <p className="flex-1 min-w-0 pt-0.5 font-medium">"<HighlightedText text={ex} targetWord={entry.word} />"</p>
                            <button
                              onClick={() => handlePronounce(ex, exAudioId, 0.88)}
                              title="Listen to this example"
                              aria-label={`Listen to example ${i + 1}`}
                              className={`w-7 h-7 rounded-lg border transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
                                playingAudioId === exAudioId
                                  ? 'bg-emerald-800 text-amber-100 border-emerald-700'
                                  : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              <SoundWaveIcon isPlaying={playingAudioId === exAudioId} size="sm" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="text-[11px] text-[#4b6354] space-y-1">
                      <div><strong className="text-emerald-800 font-bold">Synonyms:</strong> {entry.synonyms.join(', ')}</div>
                      <div><strong className="text-amber-800 font-bold">Antonyms:</strong> {entry.antonyms.join(', ') || 'None'}</div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-emerald-900/10 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-[#4b6354]">{entry.scotsRegion}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-950 border border-emerald-200">{entry.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 2: INTERACTIVE 3D FLASHCARDS */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'flashcards' && (
        <div className="max-w-xl mx-auto space-y-5">
          <div className="flex items-center justify-between text-xs text-[#4b6354] font-bold px-2">
            <span>Card {cardIndex + 1} of {flashcardPool.length}</span>
            <span>Click card to flip</span>
          </div>

          {/* Flashcard Box */}
          <div
            id="interactive-flashcard"
            onClick={handleFlipCard}
            className={`min-h-[340px] rounded-3xl p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between select-none shadow-xl border ${
              isFlipped
                ? 'bg-gradient-to-br from-[#12281d] via-[#1b3d2b] to-[#14281f] text-white border-emerald-600/40'
                : 'bg-white text-[#14281f] border-emerald-900/15'
            }`}
          >
            {!isFlipped ? (
              // FRONT OF CARD
              <div className="flex flex-col items-center justify-center my-auto text-center space-y-3">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-950 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-200">
                  {currentFlashcard.isScots ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots Term' : '🎓 Power Word'}
                </span>
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-4xl font-black tracking-tight text-[#14281f]">{currentFlashcard.word}</h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePronounce(currentFlashcard.word, `fc-f-${currentFlashcard.id}`, 0.85);
                    }}
                    title="Pronounce word"
                    aria-label={`Pronounce ${currentFlashcard.word}`}
                    className={`p-2 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer border ${
                      playingAudioId === `fc-f-${currentFlashcard.id}`
                        ? 'bg-emerald-800 text-amber-100 border-emerald-700'
                        : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
                    }`}
                  >
                    <SoundWaveIcon isPlaying={playingAudioId === `fc-f-${currentFlashcard.id}`} size="md" />
                  </button>
                </div>
                <p className="text-sm font-mono text-[#4b6354] font-bold">{currentFlashcard.phonetic}</p>
                <p className="text-xs text-emerald-800 font-semibold italic">🗣️ {currentFlashcard.phoneticGuide}</p>
                <div className="pt-4 flex items-center gap-1.5 text-xs text-[#4b6354]">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  <span>Tap card to flip</span>
                </div>
              </div>
            ) : (
              // BACK OF CARD
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-emerald-600/20 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-amber-200">{currentFlashcard.word}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePronounce(currentFlashcard.word, `fc-b-${currentFlashcard.id}`, 0.85);
                      }}
                      title="Pronounce word"
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        playingAudioId === `fc-b-${currentFlashcard.id}`
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-white/10 text-amber-100 hover:bg-white/20'
                      }`}
                    >
                      <SoundWaveIcon isPlaying={playingAudioId === `fc-b-${currentFlashcard.id}`} size="sm" />
                    </button>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-white/10 text-emerald-200 rounded-md font-bold">{currentFlashcard.partOfSpeech}</span>
                </div>

                <div className="bg-white/10 p-3 rounded-xl flex items-start justify-between gap-2 border border-emerald-400/20">
                  <div className="flex-1">
                    <p className="text-sm sm:text-base font-semibold leading-snug text-emerald-50">{currentFlashcard.definition}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePronounce(currentFlashcard.definition, `fc-def-${currentFlashcard.id}`, 0.9);
                    }}
                    title="Listen to definition"
                    className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                      playingAudioId === `fc-def-${currentFlashcard.id}`
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-white/10 text-amber-200 hover:bg-white/20'
                    }`}
                  >
                    <SoundWaveIcon isPlaying={playingAudioId === `fc-def-${currentFlashcard.id}`} size="sm" />
                  </button>
                </div>

                <div className="bg-white/10 p-3 rounded-xl space-y-2 text-xs italic border border-emerald-400/20">
                  {currentFlashcard.examples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2 text-emerald-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePronounce(ex, `fc-ex-${currentFlashcard.id}-${i}`, 0.88);
                        }}
                        title="Listen to example sentence"
                        className={`p-1 rounded-md transition-colors shrink-0 cursor-pointer ${
                          playingAudioId === `fc-ex-${currentFlashcard.id}-${i}`
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-white/10 text-amber-200 hover:bg-white/20'
                        }`}
                      >
                        <SoundWaveIcon isPlaying={playingAudioId === `fc-ex-${currentFlashcard.id}-${i}`} size="sm" />
                      </button>
                      <p className="flex-1 pt-0.5">#{i + 1} "{ex}"</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong className="text-emerald-300 block font-bold">Synonyms:</strong>
                    <span className="text-emerald-100/80">{currentFlashcard.synonyms.join(', ')}</span>
                  </div>
                  <div>
                    <strong className="text-amber-300 block font-bold">Antonyms:</strong>
                    <span className="text-emerald-100/80">{currentFlashcard.antonyms.join(', ') || 'None'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-emerald-900/10 text-xs">
              <span className="text-[#4b6354] text-[11px] font-medium">{currentFlashcard.scotsRegion}</span>
              <span className="text-[11px] opacity-60">Tap card to flip</span>
            </div>
          </div>

          {/* Flashcard Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevCard}
              className="p-3 rounded-2xl bg-white border border-emerald-900/10 hover:bg-emerald-50 text-[#14281f] shadow-xs cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleFlipCard}
              className="px-6 py-3 rounded-2xl bg-emerald-800 hover:bg-emerald-700 text-amber-100 font-extrabold text-xs sm:text-sm shadow-md cursor-pointer active:scale-95 transition-all border border-emerald-700"
            >
              Flip Card ↻
            </button>
            <button
              onClick={handleNextCard}
              className="p-3 rounded-2xl bg-white border border-emerald-900/10 hover:bg-emerald-50 text-[#14281f] shadow-xs cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUB-VIEW 3: CUSTOM WORDS LIST */}
      {/* ------------------------------------------------------------- */}
      {activeSubTab === 'custom' && (
        <div className="space-y-4">
          {customEntries.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-emerald-900/10 shadow-xs max-w-lg mx-auto">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl border border-emerald-200">
                ✍️
              </div>
              <h3 className="text-lg font-bold text-[#14281f] mb-1">No Custom Words Added</h3>
              <p className="text-sm text-[#4b6354] mb-4">
                Add words you learned in Scottish school, local area slang, or family phrases!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-amber-100 font-bold text-sm rounded-xl transition-all border border-emerald-700"
              >
                + Add First Custom Word
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl p-5 border border-emerald-900/10 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl font-black text-[#14281f]">{entry.word}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 text-emerald-950 rounded-md border border-emerald-200">
                            Custom Added
                          </span>
                        </div>
                        <span className="text-xs font-mono text-[#4b6354] font-bold">{entry.phonetic} • {entry.partOfSpeech}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Sound button on right */}
                        <button
                          onClick={() => handlePronounce(entry.word, `custom-w-${entry.id}`, 0.85)}
                          title={`Listen to "${entry.word}"`}
                          aria-label={`Listen to ${entry.word}`}
                          className={`p-2 rounded-xl border shadow-2xs transition-transform active:scale-95 cursor-pointer ${
                            playingAudioId === `custom-w-${entry.id}`
                              ? 'bg-emerald-800 text-amber-100 border-emerald-700'
                              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
                          }`}
                        >
                          <SoundWaveIcon isPlaying={playingAudioId === `custom-w-${entry.id}`} size="sm" />
                        </button>
                        {/* Delete button on right */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete custom word "${entry.word}"?`)) {
                              onDeleteCustomWord(entry.id);
                              playSound('pop');
                            }
                          }}
                          title="Delete custom word"
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Definition */}
                    <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/30 rounded-xl p-3 border border-emerald-900/10 mb-3 flex items-start justify-between gap-2 shadow-2xs">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm text-[#14281f] font-semibold leading-relaxed">
                          {entry.definition}
                        </p>
                      </div>
                      <button
                        onClick={() => handlePronounce(entry.definition, `custom-def-${entry.id}`, 0.9)}
                        title="Listen to definition"
                        aria-label={`Read definition: ${entry.definition}`}
                        className={`p-1.5 rounded-lg border shadow-2xs shrink-0 cursor-pointer ${
                          playingAudioId === `custom-def-${entry.id}`
                            ? 'bg-emerald-800 text-amber-100 border-emerald-700'
                            : 'bg-white text-emerald-900 hover:bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <SoundWaveIcon isPlaying={playingAudioId === `custom-def-${entry.id}`} size="sm" />
                      </button>
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {entry.examples.map((ex, i) => (
                        <div key={i} className="bg-white p-2.5 rounded-xl border border-emerald-900/10 text-xs italic text-[#14281f] flex items-start justify-between gap-2 shadow-2xs">
                          <p className="flex-1 pt-0.5">#{i + 1} "{ex}"</p>
                          <button
                            onClick={() => handlePronounce(ex, `custom-ex-${entry.id}-${i}`, 0.88)}
                            title="Listen to this custom example"
                            aria-label={`Listen to example ${i + 1}`}
                            className={`p-1.5 rounded-md border transition-colors shrink-0 cursor-pointer ${
                              playingAudioId === `custom-ex-${entry.id}-${i}`
                                ? 'bg-emerald-800 text-amber-100 border-emerald-700'
                                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200'
                            }`}
                          >
                            <SoundWaveIcon isPlaying={playingAudioId === `custom-ex-${entry.id}-${i}`} size="sm" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-[#4b6354] space-y-1">
                      <div><strong className="text-emerald-800 font-bold">Synonyms:</strong> {entry.synonyms.join(', ')}</div>
                      <div><strong className="text-amber-800 font-bold">Antonyms:</strong> {entry.antonyms.join(', ') || 'None'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ADD CUSTOM WORD MODAL */}
      {/* ------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 relative shadow-2xl border border-emerald-900/15">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-[#4b6354] hover:bg-emerald-50"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-emerald-900/10 pb-3">
              <h2 className="text-2xl font-black text-[#14281f]">Add New Scottish Word</h2>
              <p className="text-xs text-[#4b6354]">Include definition, at least 2 examples, synonyms, and antonyms.</p>
            </div>

            {formError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomWord} className="space-y-4 text-xs font-bold text-[#14281f]">
              <div>
                <label className="block mb-1 uppercase tracking-wider text-[#4b6354]">Word / Slang Term *</label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. Sassenach, Teuchter, Glisk..."
                  className="w-full p-3 rounded-xl border border-emerald-900/15 text-sm font-semibold text-[#14281f] focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase tracking-wider text-[#4b6354]">Part of Speech</label>
                  <select
                    value={newPartOfSpeech}
                    onChange={(e) => setNewPartOfSpeech(e.target.value as PartOfSpeech)}
                    className="w-full p-2.5 rounded-xl border border-emerald-900/15 text-xs font-semibold text-[#14281f] focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="noun">Noun</option>
                    <option value="verb">Verb</option>
                    <option value="adjective">Adjective</option>
                    <option value="adverb">Adverb</option>
                    <option value="interjection">Interjection</option>
                    <option value="phrase">Phrase</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 uppercase tracking-wider text-[#4b6354]">Scottish Region</label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value as ScottishRegion)}
                    className="w-full p-2.5 rounded-xl border border-emerald-900/15 text-xs font-semibold text-[#14281f] focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="General Scots & Scotland">General Scots</option>
                    <option value="Glasgow & West">Glasgow & West</option>
                    <option value="Edinburgh & East">Edinburgh & East</option>
                    <option value="Highlands & Islands">Highlands & Islands</option>
                    <option value="Aberdeen & Doric">Aberdeen & Doric</option>
                    <option value="Dundee & Angus">Dundee & Angus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block mb-1 uppercase tracking-wider text-[#4b6354]">Definition *</label>
                <textarea
                  rows={2}
                  required
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  placeholder="Clear, kid-friendly explanation of what it means..."
                  className="w-full p-2.5 rounded-xl border border-emerald-900/15 text-xs font-medium text-[#14281f] focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              {/* Min 2 Examples */}
              <div className="space-y-2 bg-emerald-50/30 p-3 rounded-xl border border-emerald-900/15">
                <span className="block text-[11px] font-black uppercase text-emerald-900">
                  Minimum 2 Examples in Context *
                </span>
                <input
                  type="text"
                  required
                  value={newExample1}
                  onChange={(e) => setNewExample1(e.target.value)}
                  placeholder="Example 1: Scottish school or sports sentence..."
                  className="w-full p-2 rounded-lg bg-white border border-emerald-900/15 text-xs font-normal"
                />
                <input
                  type="text"
                  required
                  value={newExample2}
                  onChange={(e) => setNewExample2(e.target.value)}
                  placeholder="Example 2: Everyday conversation sentence..."
                  className="w-full p-2 rounded-lg bg-white border border-emerald-900/15 text-xs font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase tracking-wider text-[#4b6354]">Synonyms (comma separated)</label>
                  <input
                    type="text"
                    value={newSynonyms}
                    onChange={(e) => setNewSynonyms(e.target.value)}
                    placeholder="e.g. Great, Fine, Splendid"
                    className="w-full p-2.5 rounded-xl border border-emerald-900/15 text-xs font-normal"
                  />
                </div>
                <div>
                  <label className="block mb-1 uppercase tracking-wider text-[#4b6354]">Antonyms (comma separated)</label>
                  <input
                    type="text"
                    value={newAntonyms}
                    onChange={(e) => setNewAntonyms(e.target.value)}
                    placeholder="e.g. Terrible, Bad"
                    className="w-full p-2.5 rounded-xl border border-emerald-900/15 text-xs font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 uppercase tracking-wider text-[#4b6354]">Fun Fact / Lore (Optional)</label>
                <input
                  type="text"
                  value={newLore}
                  onChange={(e) => setNewLore(e.target.value)}
                  placeholder="Historical tidbit, origin, or where you heard it..."
                  className="w-full p-2.5 rounded-xl border border-emerald-900/15 text-xs font-normal"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-50 text-[#14281f] font-bold text-xs hover:bg-emerald-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-100 font-extrabold text-xs shadow-md border border-emerald-700 cursor-pointer"
                >
                  Save to My Vault
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
