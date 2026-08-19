import React, { useState } from 'react';
import { 
  Star, Plus, Trash2, BookOpen, Layers, Volume2, Sparkles, 
  Download, Upload, CheckCircle2, RotateCw, X, ChevronLeft, ChevronRight, Tag
} from 'lucide-react';
import { DictionaryEntry, UserProgress, PartOfSpeech, ScottishRegion, WordCategory } from '../types/dictionary';
import { speakWord, speakSentence } from '../utils/speech';
import { playSound } from '../utils/soundEffects';
import { HighlightedText } from '../utils/textHighlight';

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
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-900/10 relative overflow-hidden border border-emerald-500/30">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-200">
              <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
              Personal Study Vault & Flashcards
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              My Word Vault
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl font-normal">
              Save your favourite Scottish words, practice with interactive 3D flashcards, and create your own custom school vocabulary bank!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="add-custom-word-btn"
              onClick={() => {
                setShowAddModal(true);
                playSound('click');
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white text-emerald-950 font-black text-sm shadow-sm hover:bg-emerald-50 active:scale-95 transition-all whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-700" />
              <span>Add Custom Word</span>
            </button>
          </div>
        </div>
      </div>

      {importStatus && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs sm:text-sm font-bold text-blue-900 flex items-center justify-between shadow-xs">
          <span>{importStatus}</span>
          <button
            onClick={() => setImportStatus(null)}
            className="text-blue-500 hover:text-blue-700 p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sub navigation bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
        <div className="flex items-center gap-1">
          <button
            id="subtab-starred"
            onClick={() => {
              setActiveSubTab('starred');
              playSound('click');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'starred'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Starred Words ({starredEntries.length})</span>
          </button>

          <button
            id="subtab-flashcards"
            onClick={() => {
              setActiveSubTab('flashcards');
              playSound('click');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'flashcards'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Interactive Flashcards</span>
          </button>

          <button
            id="subtab-custom"
            onClick={() => {
              setActiveSubTab('custom');
              playSound('click');
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeSubTab === 'custom'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export Vault</span>
          </button>

          <label className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold border border-slate-200/80 transition-colors cursor-pointer shadow-2xs">
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
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                ⭐
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Your Vault is Empty</h3>
              <p className="text-sm text-slate-500 mb-4">
                Star any Scottish slang or academic word in the A-Z Dictionary to save it for quick revision!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {starredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{entry.word}</h3>
                        <span className="text-xs font-mono text-slate-500">{entry.phonetic} • {entry.partOfSpeech}</span>
                      </div>
                      <button
                        onClick={() => {
                          onToggleStar(entry.id);
                          playSound('pop');
                        }}
                        title="Remove from vault"
                        className="p-1.5 text-amber-500 hover:text-slate-400 rounded-lg hover:bg-slate-100"
                      >
                        <Star className="w-5 h-5 fill-amber-500" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 mb-3">{entry.definition}</p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs italic text-slate-700 space-y-2 mb-3">
                      <div className="flex items-center justify-between not-italic">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Context Examples:</span>
                        <span className="text-[10px] text-blue-600 font-bold">🔊 Tap to hear</span>
                      </div>
                      {entry.examples.map((ex, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <button
                            onClick={() => {
                              playSound('click');
                              speakSentence(ex, { rate: 0.88 });
                            }}
                            title="Listen to this example"
                            className="p-1 rounded-md bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors shrink-0 cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <p className="flex-1 pt-0.5">"<HighlightedText text={ex} targetWord={entry.word} />"</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div><strong className="text-emerald-700">Synonyms:</strong> {entry.synonyms.join(', ')}</div>
                      <div><strong className="text-rose-700">Antonyms:</strong> {entry.antonyms.join(', ') || 'None'}</div>
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        playSound('click');
                        speakWord(entry.word);
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      <Volume2 className="w-4 h-4" />
                      <span>Listen</span>
                    </button>
                    <span className="text-[10px] font-bold text-slate-400">{entry.scotsRegion}</span>
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
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-2">
            <span>Card {cardIndex + 1} of {flashcardPool.length}</span>
            <span>Click card to flip</span>
          </div>

          {/* Flashcard Box */}
          <div
            id="interactive-flashcard"
            onClick={handleFlipCard}
            className={`min-h-[340px] rounded-3xl p-8 cursor-pointer transition-all duration-300 flex flex-col justify-between select-none shadow-xl border-2 ${
              isFlipped
                ? 'bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-indigo-500'
                : 'bg-white text-slate-900 border-indigo-200'
            }`}
          >
            {!isFlipped ? (
              // FRONT OF CARD
              <div className="flex flex-col items-center justify-center my-auto text-center space-y-3">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-800 rounded-full text-xs font-black uppercase tracking-wider">
                  {currentFlashcard.isScots ? '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scots Term' : '🎓 Power Word'}
                </span>
                <h2 className="text-4xl font-black tracking-tight">{currentFlashcard.word}</h2>
                <p className="text-sm font-mono text-slate-500">{currentFlashcard.phonetic}</p>
                <p className="text-xs text-indigo-600 font-semibold italic">📖 {currentFlashcard.phoneticGuide}</p>
                <div className="pt-4 flex items-center gap-1.5 text-xs text-slate-400">
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Tap anywhere to reveal definition & double examples</span>
                </div>
              </div>
            ) : (
              // BACK OF CARD
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xl font-black text-indigo-300">{currentFlashcard.word}</span>
                  <span className="text-xs px-2 py-0.5 bg-white/20 rounded-md font-bold">{currentFlashcard.partOfSpeech}</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Definition:</span>
                  <p className="text-sm sm:text-base font-semibold leading-snug">{currentFlashcard.definition}</p>
                </div>

                <div className="bg-white/10 p-3 rounded-xl space-y-2 text-xs italic">
                  <div className="flex items-center justify-between not-italic">
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">Double Examples:</span>
                    <span className="text-[10px] text-indigo-200 font-bold">🔊 Tap to hear</span>
                  </div>
                  {currentFlashcard.examples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playSound('click');
                          speakSentence(ex, { rate: 0.88 });
                        }}
                        title="Listen to example sentence"
                        className="p-1 rounded-md bg-white/20 text-white hover:bg-white/30 transition-colors shrink-0 cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                      <p className="flex-1 pt-0.5">#{i + 1} "{ex}"</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <strong className="text-emerald-400 block">Synonyms:</strong>
                    <span className="text-slate-300">{currentFlashcard.synonyms.join(', ')}</span>
                  </div>
                  <div>
                    <strong className="text-rose-400 block">Antonyms:</strong>
                    <span className="text-slate-300">{currentFlashcard.antonyms.join(', ') || 'None'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between border-t border-slate-100/20 text-xs">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playSound('click');
                  speakWord(currentFlashcard.word);
                }}
                className="flex items-center gap-1 font-bold text-blue-500 hover:underline"
              >
                <Volume2 className="w-4 h-4" />
                <span>Audio Pronunciation</span>
              </button>
              <span className="text-[11px] opacity-60">Flip: Click anywhere</span>
            </div>
          </div>

          {/* Flashcard Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handlePrevCard}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleFlipCard}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm shadow-md"
            >
              Flip Card ↻
            </button>
            <button
              onClick={handleNextCard}
              className="p-3 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-xs"
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
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-lg mx-auto">
              <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                ✍️
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Custom Words Added</h3>
              <p className="text-sm text-slate-500 mb-4">
                Add words you learned in Scottish school, local area slang, or family phrases!
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-all"
              >
                + Add First Custom Word
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-slate-900">{entry.word}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 text-teal-900 rounded-md">
                            Custom Added
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">{entry.phonetic} • {entry.partOfSpeech}</span>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete custom word "${entry.word}"?`)) {
                            onDeleteCustomWord(entry.id);
                            playSound('pop');
                          }
                        }}
                        title="Delete custom word"
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 mb-3">{entry.definition}</p>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs italic text-slate-700 space-y-2 mb-3">
                      <div className="flex items-center justify-between not-italic">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Context Examples:</span>
                        <span className="text-[10px] text-teal-600 font-bold">🔊 Tap to hear</span>
                      </div>
                      {entry.examples.map((ex, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <button
                            onClick={() => {
                              playSound('click');
                              speakSentence(ex, { rate: 0.88 });
                            }}
                            title="Listen to this custom example"
                            className="p-1 rounded-md bg-white text-teal-700 hover:bg-teal-50 border border-teal-200 transition-colors shrink-0 cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <p className="flex-1 pt-0.5">#{i + 1} "{ex}"</p>
                        </div>
                      ))}
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1">
                      <div><strong className="text-emerald-700">Synonyms:</strong> {entry.synonyms.join(', ')}</div>
                      <div><strong className="text-rose-700">Antonyms:</strong> {entry.antonyms.join(', ') || 'None'}</div>
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
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 relative shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-2xl font-black text-slate-900">Add New Scottish Word</h2>
              <p className="text-xs text-slate-500">Include definition, at least 2 examples, synonyms, and antonyms.</p>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800 flex items-center gap-2">
                <span>⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomWord} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1 uppercase tracking-wider">Word / Slang Term *</label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. Sassenach, Teuchter, Glisk..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase tracking-wider">Part of Speech</label>
                  <select
                    value={newPartOfSpeech}
                    onChange={(e) => setNewPartOfSpeech(e.target.value as PartOfSpeech)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
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
                  <label className="block mb-1 uppercase tracking-wider">Scottish Region</label>
                  <select
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value as ScottishRegion)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
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
                <label className="block mb-1 uppercase tracking-wider">Definition *</label>
                <textarea
                  rows={2}
                  required
                  value={newDefinition}
                  onChange={(e) => setNewDefinition(e.target.value)}
                  placeholder="Clear, kid-friendly explanation of what it means..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>

              {/* Min 2 Examples */}
              <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="block text-[11px] font-black uppercase text-blue-700">
                  Minimum 2 Examples in Context *
                </span>
                <input
                  type="text"
                  required
                  value={newExample1}
                  onChange={(e) => setNewExample1(e.target.value)}
                  placeholder="Example 1: Scottish school or sports sentence..."
                  className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-normal"
                />
                <input
                  type="text"
                  required
                  value={newExample2}
                  onChange={(e) => setNewExample2(e.target.value)}
                  placeholder="Example 2: Everyday conversation sentence..."
                  className="w-full p-2 rounded-lg bg-white border border-slate-200 text-xs font-normal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 uppercase tracking-wider">Synonyms (comma separated)</label>
                  <input
                    type="text"
                    value={newSynonyms}
                    onChange={(e) => setNewSynonyms(e.target.value)}
                    placeholder="e.g. Great, Fine, Splendid"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-normal"
                  />
                </div>
                <div>
                  <label className="block mb-1 uppercase tracking-wider">Antonyms (comma separated)</label>
                  <input
                    type="text"
                    value={newAntonyms}
                    onChange={(e) => setNewAntonyms(e.target.value)}
                    placeholder="e.g. Terrible, Bad"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-normal"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 uppercase tracking-wider">Fun Fact / Lore (Optional)</label>
                <input
                  type="text"
                  value={newLore}
                  onChange={(e) => setNewLore(e.target.value)}
                  placeholder="Historical tidbit, origin, or where you heard it..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-normal"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md"
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
