import React, { useState, useEffect } from 'react';
import { 
  Volume2, Sparkles, X, Check, Sliders, RefreshCw, Smartphone, 
  Tablet, Laptop, Info, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { 
  getAvailableVoicesList, 
  loadVoiceSettings, 
  saveVoiceSettings, 
  testBritishVoicePreview, 
  detectDevicePlatform,
  VoiceOption, 
  VoiceSettings,
  DeviceInfo
} from '../utils/speech';
import { playSound } from '../utils/soundEffects';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({ isOpen, onClose }) => {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [settings, setSettings] = useState<VoiceSettings>(loadVoiceSettings());
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevicePlatform());
  const [isPlayingSample, setIsPlayingSample] = useState(false);
  const [activeSampleType, setActiveSampleType] = useState<'greeting' | 'scots' | 'word'>('greeting');

  const refreshVoiceList = () => {
    const list = getAvailableVoicesList();
    setVoices(list);
    setDeviceInfo(detectDevicePlatform());
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

  const sampleTexts = {
    greeting: "Hello! I am your British and Scottish study companion. Let's learn some braw vocabulary together!",
    scots: "It is a fair dreich morning, but that stooshie in the glen was truly magnificent!",
    word: "Flabbergasted. Flabbergasted: extremely surprised, astonished, or dumbfounded."
  };

  const handleTestVoice = (sampleKey?: 'greeting' | 'scots' | 'word') => {
    const key = sampleKey || activeSampleType;
    playSound('pop');
    setIsPlayingSample(true);
    testBritishVoicePreview(sampleTexts[key]);
    setTimeout(() => setIsPlayingSample(false), 3800);
  };

  // Device icon helper
  const getDeviceIcon = () => {
    if (deviceInfo.deviceType === 'iphone' || deviceInfo.deviceType === 'android-phone') {
      return <Smartphone className="w-4 h-4 text-emerald-700" />;
    }
    if (deviceInfo.deviceType === 'ipad' || deviceInfo.deviceType === 'android-tablet') {
      return <Tablet className="w-4 h-4 text-emerald-700" />;
    }
    return <Laptop className="w-4 h-4 text-emerald-700" />;
  };

  const deviceRecommendedVoices = voices.filter(v => v.isDeviceSpecificPick || v.isRecommended);
  const otherBritishVoices = voices.filter(v => v.isBritish && !v.isDeviceSpecificPick && !v.isRecommended);
  const otherVoices = voices.filter(v => !v.isBritish && v.lang.startsWith('en'));

  return (
    <div 
      id="voice-settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="voice-settings-modal-content"
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-900/15 p-5 sm:p-7 space-y-5 relative max-h-[90vh] overflow-y-auto text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-900/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-amber-100 flex items-center justify-center shadow-xs border border-emerald-700">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#14281f] flex items-center gap-1.5">
                High-Quality Voice Studio 🇬🇧
              </h3>
              <p className="text-xs text-[#4b6354] font-medium">
                Device-tuned British & Scottish pronunciation engine
              </p>
            </div>
          </div>

          <button
            id="close-voice-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full text-[#4b6354] hover:text-[#14281f] hover:bg-emerald-50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Device Detection Banner */}
        <div className="bg-emerald-50/40 rounded-2xl p-3.5 border border-emerald-900/15 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-emerald-200">
                {getDeviceIcon()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-950">
                    Detected Device:
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-800 text-amber-100 shadow-2xs border border-emerald-700">
                    {deviceInfo.displayName}
                  </span>
                </div>
                <p className="text-[11px] text-[#4b6354] font-medium mt-0.5">
                  {deviceInfo.platform === 'ios' && 'Tuned for iPhone / iPad: prioritizing Apple Serena & Scottish Fiona Enhanced neural voices.'}
                  {deviceInfo.platform === 'android' && 'Tuned for Android: prioritizing Google HD Neural & Samsung UK English audio.'}
                  {deviceInfo.platform === 'windows' && 'Tuned for Windows: prioritizing Microsoft Libby & Maisie Natural HD speech.'}
                  {deviceInfo.platform === 'mac' && 'Tuned for macOS: prioritizing Apple Serena / Fiona Enhanced HD audio.'}
                  {deviceInfo.platform === 'other' && 'Tuned for standard British female pronunciation.'}
                </p>
              </div>
            </div>
          </div>

          {deviceInfo.osTip && (
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center gap-1.5 text-[10px] text-emerald-900 font-medium">
              <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span>{deviceInfo.osTip}</span>
            </div>
          )}
        </div>

        {/* Live Audio Test & Sample Selector */}
        <div className="bg-emerald-50/25 rounded-2xl p-4 border border-emerald-900/15 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#14281f] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Audio Preview & Enunciation Test</span>
            </span>
            <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-emerald-200 text-[10px] font-bold">
              <button
                onClick={() => setActiveSampleType('greeting')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  activeSampleType === 'greeting' ? 'bg-emerald-800 text-amber-100' : 'text-[#4b6354] hover:text-[#14281f]'
                }`}
              >
                Greeting
              </button>
              <button
                onClick={() => setActiveSampleType('scots')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  activeSampleType === 'scots' ? 'bg-emerald-800 text-amber-100' : 'text-[#4b6354] hover:text-[#14281f]'
                }`}
              >
                Scots
              </button>
              <button
                onClick={() => setActiveSampleType('word')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  activeSampleType === 'word' ? 'bg-emerald-800 text-amber-100' : 'text-[#4b6354] hover:text-[#14281f]'
                }`}
              >
                Word
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-emerald-900/10 text-xs text-[#14281f] italic">
            "{sampleTexts[activeSampleType]}"
          </div>

          <button
            id="test-voice-btn"
            onClick={() => handleTestVoice()}
            disabled={isPlayingSample}
            className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
              isPlayingSample 
                ? 'bg-emerald-800 text-amber-100 animate-pulse' 
                : 'bg-emerald-800 hover:bg-emerald-700 active:scale-98 text-amber-100 border border-emerald-700'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isPlayingSample ? 'animate-bounce' : ''}`} />
            <span>{isPlayingSample ? 'Speaking through device...' : 'Test Voice on This Device'}</span>
          </button>
        </div>

        {/* Sliders for Pitch and Speed */}
        <div className="space-y-3.5 bg-emerald-50/25 rounded-2xl p-4 border border-emerald-900/15">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#14281f]">
            <Sliders className="w-3.5 h-3.5 text-emerald-700" />
            <span>Pace & Pitch Calibration</span>
          </div>

          {/* Pitch Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-[#4b6354] mb-1">
              <span>Voice Pitch</span>
              <span className="text-emerald-800 font-extrabold">
                {settings.pitch >= 1.25 ? '👧 Youthful / Cheerful' : settings.pitch >= 1.1 ? '👩 Natural British' : 'Standard'} ({settings.pitch.toFixed(2)})
              </span>
            </div>
            <input
              id="voice-pitch-slider"
              type="range"
              min="0.9"
              max="1.45"
              step="0.05"
              value={settings.pitch}
              onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
              className="w-full accent-emerald-700 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#4b6354] font-semibold mt-0.5">
              <span>0.90 (Deeper)</span>
              <span>1.15 (Default Sweet)</span>
              <span>1.45 (High)</span>
            </div>
          </div>

          {/* Rate Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-[#4b6354] mb-1">
              <span>Speech Rate (Speed)</span>
              <span className="text-emerald-800 font-extrabold">
                {settings.rate < 0.9 ? '🐢 Slow (Junior Learner)' : settings.rate > 1.05 ? '⚡ Quick' : 'Enunciation Pace'} ({settings.rate.toFixed(2)}x)
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
              className="w-full accent-emerald-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Voice Selection List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#4b6354]">
              Voice Selector ({deviceInfo.displayName}):
            </span>
            <button
              onClick={refreshVoiceList}
              className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh ({voices.length})</span>
            </button>
          </div>

          {/* Default Smart Device Auto Mode */}
          <button
            id="voice-select-auto"
            onClick={() => handleSelectVoice(null)}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              settings.selectedVoiceURI === null
                ? 'bg-emerald-50 border-emerald-400 shadow-2xs'
                : 'bg-white border-emerald-900/10 hover:bg-emerald-50/50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                ✨
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#14281f]">
                    Smart Device Auto-Select (Recommended)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-800 text-amber-100">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-[#4b6354]">
                  Automatically chooses the highest quality British/Scottish voice available on your {deviceInfo.displayName}.
                </p>
              </div>
            </div>
            {settings.selectedVoiceURI === null && <Check className="w-4 h-4 text-emerald-800 shrink-0" />}
          </button>

          {/* List of Detected Voices */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {deviceRecommendedVoices.map((v) => (
              <button
                key={v.uri}
                onClick={() => handleSelectVoice(v.uri)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.selectedVoiceURI === v.uri
                    ? 'bg-emerald-50 border-emerald-400 font-bold'
                    : 'bg-white border-emerald-900/10 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#14281f]">{v.name}</span>
                      {v.qualityBadge && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-teal-100 text-teal-900 rounded-md font-extrabold">
                          {v.qualityBadge}
                        </span>
                      )}
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-900 rounded-md font-extrabold">
                        Female
                      </span>
                    </div>
                    <span className="text-[10px] text-[#4b6354]">{v.lang}</span>
                  </div>
                </div>
                {settings.selectedVoiceURI === v.uri && <Check className="w-4 h-4 text-emerald-800 shrink-0" />}
              </button>
            ))}

            {otherBritishVoices.map((v) => (
              <button
                key={v.uri}
                onClick={() => handleSelectVoice(v.uri)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.selectedVoiceURI === v.uri
                    ? 'bg-emerald-50 border-emerald-400 font-bold'
                    : 'bg-white border-emerald-900/10 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🇬🇧</span>
                  <div>
                    <span className="text-xs font-semibold text-[#14281f]">{v.name}</span>
                    <span className="text-[10px] text-[#4b6354] block">{v.lang}</span>
                  </div>
                </div>
                {settings.selectedVoiceURI === v.uri && <Check className="w-4 h-4 text-emerald-800 shrink-0" />}
              </button>
            ))}

            {otherVoices.slice(0, 5).map((v) => (
              <button
                key={v.uri}
                onClick={() => handleSelectVoice(v.uri)}
                className={`w-full p-2 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  settings.selectedVoiceURI === v.uri
                    ? 'bg-emerald-50 border-emerald-400 font-bold'
                    : 'bg-white border-emerald-900/10 hover:bg-emerald-50/40'
                }`}
              >
                <div>
                  <span className="text-xs text-[#14281f]">{v.name}</span>
                  <span className="text-[10px] text-[#4b6354] block">{v.lang}</span>
                </div>
                {settings.selectedVoiceURI === v.uri && <Check className="w-4 h-4 text-emerald-800 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-emerald-900/10 flex items-center justify-between">
          <span className="text-[11px] text-[#4b6354]">
            Auto-saved for {deviceInfo.displayName}.
          </span>
          <button
            id="done-voice-settings-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-amber-100 text-xs font-extrabold cursor-pointer border border-emerald-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
