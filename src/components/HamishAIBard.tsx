import React, { useState } from 'react';
import { Sparkles, Send, BookOpen, Wand2, MessageSquare, RefreshCw, Copy, Check, Info, Volume2, VolumeX } from 'lucide-react';
import { DictionaryEntry } from '../types/dictionary';
import { playSound } from '../utils/soundEffects';
import { speakSentence, cancelSpeech } from '../utils/speech';

interface HamishAIBardProps {
  entries: DictionaryEntry[];
  initialWord?: DictionaryEntry | null;
  isOnline: boolean;
}

export const HamishAIBard: React.FC<HamishAIBardProps> = ({
  entries,
  initialWord,
  isOnline,
}) => {
  const [activeMode, setActiveMode] = useState<'story' | 'translate' | 'ask'>('story');
  
  // Story Generator State
  const [selectedWordsForStory, setSelectedWordsForStory] = useState<string[]>(
    initialWord ? [initialWord.word, 'Dreich', 'Stooshie'] : ['Braw', 'Dreich', 'Stooshie']
  );
  const [customStoryTopic, setCustomStoryTopic] = useState('A stormy football match and an unexpected Loch Ness encounter');
  
  // Translator State
  const [translateInput, setTranslateInput] = useState('I am very tired, and the weather is cold and wet outside.');
  
  // Ask Hamish State
  const [askPrompt, setAskPrompt] = useState('Why do Scottish people use the word "wee" so much, and how can I use it in creative writing?');

  // AI Response State
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleToggleSpeak = () => {
    if (!aiResponse) return;
    if (isSpeaking) {
      cancelSpeech();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      // Clean markdown stars from speech text
      const cleanText = aiResponse.replace(/[*#_~]/g, '');
      speakSentence(cleanText);
    }
  };

  // Quick word pills selection
  const handleToggleStoryWord = (word: string) => {
    playSound('click');
    if (selectedWordsForStory.includes(word)) {
      setSelectedWordsForStory(prev => prev.filter(w => w !== word));
    } else {
      if (selectedWordsForStory.length >= 4) {
        setSelectedWordsForStory(prev => [...prev.slice(1), word]);
      } else {
        setSelectedWordsForStory(prev => [...prev, word]);
      }
    }
  };

  // Offline fallback story builder
  const generateOfflineStory = () => {
    const words = selectedWordsForStory.join(', ');
    return `🏰 **The Great Scottish School Castle Adventure**

It was an unforgettable Tuesday afternoon at Glenfinnan Academy. The sky outside had turned completely **dreich**, with heavy Highland rain lashing against the classroom windows. Callum looked over at his best friend with a **braw** grin on his face. 

Suddenly, an almighty **stooshie** erupted in the science corridor when an experimental balloon burst with a loud bang! The headteacher rushed out into the hall shouting for everyone to keep their wheesht. In the end, the students worked together with remarkable diligence to clean up the guddle.

---
💡 *Scottish Word Spotlight:*
• **Dreich**: Gloomy, grey, drizzly weather.
• **Braw**: Splendid, fine, handsome.
• **Stooshie**: A sudden uproar or commotion.`;
  };

  // Offline fallback translator
  const generateOfflineTranslation = (input: string) => {
    return `🏴󠁧󠁢󠁳󠁣󠁴󠁿 **Authentic Scottish Phrasing:**

*"I'm fair pechin, and it's pure dreich oot there!"*

📖 **Breakdown & Cultural Lore:**
• In Scotland, instead of saying "very tired", students often say **fair pechin** (panting / exhausted) or **knackered**.
• For "cold and wet weather", the classic Scots word is **dreich** or **drookit** (drenched).
• "Oot there" is standard Scots pronunciation for "out there".

Try using these in your next Scottish literature or creative writing assignment!`;
  };

  // Handle AI Submission
  const handleGenerate = async () => {
    playSound('click');
    setIsLoading(true);
    setAiResponse(null);

    let promptText = '';
    if (activeMode === 'story') {
      promptText = `Write an engaging, funny short adventure story for a Scottish student aged 10-15 incorporating the vocabulary words: ${selectedWordsForStory.join(', ')}. Topic: ${customStoryTopic}. Highlight the words in **bold** and include a mini Scottish vocabulary glossary at the end.`;
    } else if (activeMode === 'translate') {
      promptText = `Translate this sentence into authentic Scottish regional slang / Scots phrasing for a 10-15 year old student, with explanations: "${translateInput}"`;
    } else {
      promptText = askPrompt;
    }

    try {
      const res = await fetch('/api/ask-bard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          mode: activeMode,
        }),
      });

      if (!res.ok) {
        throw new Error('AI service error');
      }

      const data = await res.json();
      setAiResponse(data.text || 'No response received.');
      playSound('pop');
    } catch (err) {
      // Offline fallback
      if (activeMode === 'story') {
        setAiResponse(generateOfflineStory());
      } else if (activeMode === 'translate') {
        setAiResponse(generateOfflineTranslation(translateInput));
      } else {
        setAiResponse(`🦉 Hamish says: "That is a grand question! In Scottish culture and language, Scots evolved from Early Middle English alongside Scottish Gaelic and Old Norse. Words like 'wee' and 'braw' have been celebrated in Scottish literature from Robert Burns to modern Scottish authors!"`);
      }
      playSound('pop');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setCopied(true);
    playSound('pop');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 sm:pb-8">
      
      {/* Bard Mascot Header */}
      <div className="bg-gradient-to-br from-[#12281d] via-[#1b3d2b] to-[#14281f] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden border border-emerald-700/30">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-gradient-to-br from-amber-400/20 via-emerald-400/20 to-lime-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-8 bottom-3 opacity-15 text-8xl font-black select-none pointer-events-none">
          🌿
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-emerald-400/30 text-xs font-black text-amber-200 shadow-2xs">
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>AI Scottish Vocabulary Tutor & Story Weaver</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-amber-100">
              Hamish the Tartan Bard
            </h1>
            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl font-medium">
              Hamish helps you write creative Scottish stories with your vocabulary words, translates everyday English into authentic Scots slang, and answers any word questions!
            </p>
          </div>

          <div className="w-18 h-18 sm:w-22 sm:h-22 bg-gradient-to-tr from-emerald-800/60 to-teal-800/60 rounded-3xl backdrop-blur-md border border-emerald-500/40 flex items-center justify-center text-4xl sm:text-5xl shadow-lg shrink-0 transform hover:scale-105 transition-transform">
            🦉
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-2 bg-emerald-50/40 p-2 rounded-2xl border border-emerald-900/10">
        <button
          id="bard-mode-story"
          onClick={() => {
            setActiveMode('story');
            playSound('click');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeMode === 'story'
              ? 'bg-emerald-800 text-amber-100 shadow-md scale-102 border border-emerald-700'
              : 'text-[#4b6354] hover:text-[#14281f] hover:bg-white/80'
          }`}
        >
          <Wand2 className={`w-4 h-4 ${activeMode === 'story' ? 'text-amber-300' : 'text-emerald-800'}`} />
          <span>Story Generator</span>
        </button>

        <button
          id="bard-mode-translate"
          onClick={() => {
            setActiveMode('translate');
            playSound('click');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeMode === 'translate'
              ? 'bg-teal-800 text-amber-100 shadow-md scale-102 border border-teal-700'
              : 'text-[#4b6354] hover:text-[#14281f] hover:bg-white/80'
          }`}
        >
          <BookOpen className={`w-4 h-4 ${activeMode === 'translate' ? 'text-amber-300' : 'text-teal-800'}`} />
          <span>Scots Slang Translator</span>
        </button>

        <button
          id="bard-mode-ask"
          onClick={() => {
            setActiveMode('ask');
            playSound('click');
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
            activeMode === 'ask'
              ? 'bg-amber-700 text-amber-100 shadow-md scale-102 border border-amber-800'
              : 'text-[#4b6354] hover:text-[#14281f] hover:bg-white/80'
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${activeMode === 'ask' ? 'text-amber-200' : 'text-amber-700'}`} />
          <span>Ask Hamish</span>
        </button>
      </div>

      {/* Mode 1: Story Generator Form */}
      {activeMode === 'story' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-900/10 shadow-xs space-y-5">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#14281f] block mb-2">
              1. Choose Words to Star in Your Story (Select up to 4):
            </label>
            <div className="flex flex-wrap gap-2">
              {entries.slice(0, 16).map((entry) => {
                const isSelected = selectedWordsForStory.includes(entry.word);
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleToggleStoryWord(entry.word)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-800 text-amber-100 shadow-xs scale-105 border border-emerald-700'
                        : 'bg-emerald-50/40 text-[#14281f] hover:bg-emerald-100 hover:text-emerald-950 border border-emerald-200/80'
                    }`}
                  >
                    {entry.word}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#14281f] block mb-2">
              2. Story Theme / Setting:
            </label>
            <input
              type="text"
              value={customStoryTopic}
              onChange={(e) => setCustomStoryTopic(e.target.value)}
              placeholder="e.g. A mystery at Edinburgh Castle, a rainy school sports day, or a Highland camping trip..."
              className="w-full p-3.5 rounded-2xl bg-emerald-50/20 border border-emerald-900/10 text-sm font-medium text-[#14281f] focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
            />
          </div>

          <button
            id="generate-story-btn"
            disabled={isLoading || selectedWordsForStory.length === 0}
            onClick={handleGenerate}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-800 to-teal-800 hover:from-emerald-700 hover:to-teal-700 active:scale-99 text-amber-100 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-600/30"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Hamish is crafting your Scottish story...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Weave Scottish Adventure Story</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mode 2: Scots Slang Translator Form */}
      {activeMode === 'translate' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-900/10 shadow-xs space-y-5">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#14281f] block mb-2">
              Enter English Sentence to Translate into Scots Slang:
            </label>
            <textarea
              rows={3}
              value={translateInput}
              onChange={(e) => setTranslateInput(e.target.value)}
              placeholder="e.g. My bedroom is very messy, and my teacher was angry about my homework..."
              className="w-full p-3.5 rounded-2xl bg-emerald-50/20 border border-emerald-900/10 text-sm font-medium text-[#14281f] focus:outline-hidden focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-[#4b6354] font-semibold">Try examples:</span>
            {[
              "Be quiet, the teacher is speaking!",
              "I am very hungry after football practice.",
              "That boy is being very silly today."
            ].map((eg, idx) => (
              <button
                key={idx}
                onClick={() => setTranslateInput(eg)}
                className="text-emerald-900 hover:underline bg-emerald-50 px-2 py-0.5 rounded-md font-medium cursor-pointer border border-emerald-200/60"
              >
                "{eg}"
              </button>
            ))}
          </div>

          <button
            id="translate-scots-btn"
            disabled={isLoading || !translateInput.trim()}
            onClick={handleGenerate}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-800 to-emerald-800 hover:from-teal-700 hover:to-emerald-700 active:scale-99 text-amber-100 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-teal-600/30"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                <span>Translating with Scottish lore...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-300" />
                <span>Translate to Authentic Scots</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Mode 3: Ask Hamish Form */}
      {activeMode === 'ask' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-900/10 shadow-xs space-y-5">
          <div>
            <label className="text-xs font-black uppercase tracking-wider text-[#14281f] block mb-2">
              Ask Any Question About Scottish Vocabulary, Grammar, or Literature:
            </label>
            <input
              type="text"
              value={askPrompt}
              onChange={(e) => setAskPrompt(e.target.value)}
              placeholder="e.g. What is the difference between Scots and Scottish Gaelic?"
              className="w-full p-3.5 rounded-2xl bg-emerald-50/20 border border-emerald-900/10 text-sm font-medium text-[#14281f] focus:outline-hidden focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <button
            id="ask-hamish-btn"
            disabled={isLoading || !askPrompt.trim()}
            onClick={handleGenerate}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-700 to-yellow-700 hover:from-amber-600 hover:to-yellow-600 active:scale-99 text-amber-100 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-amber-600/30"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-amber-200" />
                <span>Hamish is thinking...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-amber-200" />
                <span>Ask Hamish the Bard</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* AI Output Card */}
      {aiResponse && (
        <div className="bg-gradient-to-br from-white to-emerald-50/30 rounded-3xl p-6 sm:p-8 border border-emerald-900/15 shadow-lg space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦉</span>
              <h3 className="font-extrabold text-[#14281f] text-base sm:text-lg">
                Hamish's Bardic Creation
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleSpeak}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border shadow-2xs transition-colors cursor-pointer ${
                  isSpeaking
                    ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100'
                }`}
                title="Read aloud with young British female voice"
              >
                {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-700" /> : <Volume2 className="w-4 h-4 text-emerald-800" />}
                <span>{isSpeaking ? 'Stop Reading' : 'Listen in British Voice'}</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 hover:text-emerald-900 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>
          </div>

          <div className="prose prose-emerald max-w-none text-[#14281f] text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
            {aiResponse}
          </div>
        </div>
      )}

    </div>
  );
};
