import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, X, Check, Sliders, RefreshCw, Radio, UserCheck } from 'lucide-react';
import { 
  getAvailableVoicesList, 
  loadVoiceSettings, 
  saveVoiceSettings, 
  testBritishVoicePreview, 
  VoiceOption, 
  VoiceSettings 
} from '../utils/speech';
import { playSound } from '../utils/soundEffects';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>(loadVoiceSettings());
  const [isPlayingSample, setIsPlayingSample] = useState(false);

  const refreshVoiceList = () => {
    const list = getAvailableVoicesList();
    setVoices(list);
  };

  useEffect(() => {
    if (!isOpen) return;
    refreshVoiceList();
    setSettings(loadVoiceSettings());

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        refreshVoiceList();
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectVoice = (uri: string | null) => {
    const updated = saveVoiceSettings({ selectedVoiceURI: uri });
    setSettings(updated);
    playSound('click');
  };

  const handlePitchChange = (pitchVal: number) => {
    const updated = saveVoiceSettings({ pitch: pitchVal });
    setSettings(updated);
  };

  const handleRateChange = (rateVal: number) => {
    const updated = saveVoiceSettings({ rate: rateVal });
    setSettings(updated);
  };

  const handleTestVoice = (customSample?: string) => {
    playSound('pop');
    setIsPlayingSample(true);
    testBritishVoicePreview(customSample);
    setTimeout(() => setIsPlayingSample(false), 3500);
  };

  // Categorize voices
  const recommendedBritishFemale = voices.filter(v => v.isRecommended);
  const otherBritishVoices = voices.filter(v => v.isBritish && !v.isRecommended);
  const otherVoices = voices.filter(v => !v.isBritish && v.lang.startsWith('en'));

  return (
    <div 
      id="voice-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="voice-settings-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 sm:p-7 space-y-5 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5">
                British Voice Studio 🇬🇧
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Young female pronunciation & pitch controls
              </p>
            </div>
          </div>

          <button
            id="close-voice-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Test Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="space-y-0.5 text-center sm:text-left">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 block">
              Active Voice Test
            </span>
            <p className="text-xs font-semibold text-slate-700">
              "Hello! Let's learn some braw vocabulary together."
            </p>
          </div>

          <button
            id="test-voice-btn"
            onClick={() => handleTestVoice()}
            disabled={isPlayingSample}
            className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer ${
              isPlayingSample 
                ? 'bg-blue-600 text-white animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isPlayingSample ? 'animate-bounce' : ''}`} />
            <span>{isPlayingSample ? 'Speaking...' : 'Test Voice Now'}</span>
          </button>
        </div>

        {/* Sliders for Pitch and Speed */}
        <div className="space-y-3.5 bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Tone & Pace Tuning</span>
          </div>

          {/* Pitch Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
              <span>Voice Pitch (Higher = More Youthful)</span>
              <span className="text-blue-600 font-extrabold">
                {settings.pitch >= 1.25 ? '👧 Young / Youthful' : settings.pitch >= 1.1 ? '👩 Natural Female' : 'Standard'} ({settings.pitch.toFixed(2)})
              </span>
            </div>
            <input
              id="voice-pitch-slider"
              type="range"
              min="0.9"
              max="1.5"
              step="0.05"
              value={settings.pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-0.5">
              <span>0.9 (Deeper)</span>
              <span>1.20 (Recommended Young British)</span>
              <span>1.5 (High)</span>
            </div>
          </div>

          {/* Rate Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
              <span>Speech Speed</span>
              <span className="text-blue-600 font-extrabold">
                {settings.rate < 0.9 ? '🐢 Slow (Learner)' : settings.rate > 1.05 ? '⚡ Quick' : 'Normal Pace'} ({settings.rate.toFixed(2)}x)
              </span>
            </div>
            <input
              id="voice-rate-slider"
              type="range"
              min="0.75"
              max="1.25"
              step="0.05"
              value={settings.rate}
              onChange={(e) => handleRateChange(parseFloat(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Voice Selection List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Installed Voice Selector:
            </span>
            <button
              onClick={refreshVoiceList}
              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh Voices ({voices.length})</span>
            </button>
          </div>

          {/* Default Auto Mode */}
          <button
            id="voice-select-auto"
            onClick={() => handleSelectVoice(null)}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              settings.selectedVoiceURI === null
                ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                : 'bg-white border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900">
                    Smart British Young Female (Auto-Select)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatically chooses Libby, Maisie, Serena, Fiona, or highest quality UK female voice.
                </p>
              </div>
            </div>
            {settings.selectedVoiceURI === null && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
          </button>

          {/* List of Detected Voices */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {recommendedBritishFemale.map((v) => (
              <button
                key={v.uri}
                onClick={() => handleSelectVoice(v.uri)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.selectedVoiceURI === v.uri
                    ? 'bg-blue-50 border-blue-400 font-bold'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800">{v.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md font-extrabold">
                        Female
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">{v.lang}</span>
                  </div>
                </div>
                {settings.selectedVoiceURI === v.uri && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            ))}

            {otherBritishVoices.map((v) => (
              <button
                key={v.uri}
                onClick={() => handleSelectVoice(v.uri)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.selectedVoiceURI === v.uri
                    ? 'bg-blue-50 border-blue-400 font-bold'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  <div>
                    <span className="text-xs font-semibold text-slate-700">{v.name}</span>
                    <span className="text-[10px] text-slate-400 block">{v.lang}</span>
                  </div>
                </div>
                {settings.selectedVoiceURI === v.uri && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            ))}

            {otherVoices.slice(0, 5).map((v) => (
              <button
                key={v.uri}
                onClick={() => handleSelectVoice(v.uri)}
                className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.selectedVoiceURI === v.uri
                    ? 'bg-blue-50 border-blue-400 font-bold'
                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <div>
                  <span className="text-xs text-slate-700">{v.name}</span>
                  <span className="text-[10px] text-slate-400 block">{v.lang}</span>
                </div>
                {settings.selectedVoiceURI === v.uri && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Settings save automatically to this browser.
          </span>
          <button
            id="done-voice-settings-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
