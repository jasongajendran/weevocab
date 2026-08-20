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
      return <Smartphone className="w-4 h-4 text-blue-600" />;
    }
    if (deviceInfo.deviceType === 'ipad' || deviceInfo.deviceType === 'android-tablet') {
      return <Tablet className="w-4 h-4 text-indigo-600" />;
    }
    return <Laptop className="w-4 h-4 text-sky-600" />;
  };

  const deviceRecommendedVoices = voices.filter(v => v.isDeviceSpecificPick || v.isRecommended);
  const otherBritishVoices = voices.filter(v => v.isBritish && !v.isDeviceSpecificPick && !v.isRecommended);
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
                High-Quality Voice Studio 🇬🇧
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Device-tuned British & Scottish pronunciation engine
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

        {/* Device Detection Banner */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 rounded-2xl p-3.5 border border-blue-100/80 shadow-2xs">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-blue-200/60">
                {getDeviceIcon()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                    Detected Device:
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-600 text-white shadow-2xs">
                    {deviceInfo.displayName}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
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
            <div className="mt-2.5 pt-2 border-t border-blue-200/50 flex items-center gap-1.5 text-[10px] text-blue-800 font-medium">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>{deviceInfo.osTip}</span>
            </div>
          )}
        </div>

        {/* Live Audio Test & Sample Selector */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Audio Preview & Enunciation Test</span>
            </span>
            <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
              <button
                onClick={() => setActiveSampleType('greeting')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  activeSampleType === 'greeting' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Greeting
              </button>
              <button
                onClick={() => setActiveSampleType('scots')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  activeSampleType === 'scots' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Scots
              </button>
              <button
                onClick={() => setActiveSampleType('word')}
                className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  activeSampleType === 'word' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Word
              </button>
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 text-xs text-slate-700 italic">
            "{sampleTexts[activeSampleType]}"
          </div>

          <button
            id="test-voice-btn"
            onClick={() => handleTestVoice()}
            disabled={isPlayingSample}
            className={`w-full py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer ${
              isPlayingSample 
                ? 'bg-blue-600 text-white animate-pulse' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-98 text-white'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isPlayingSample ? 'animate-bounce' : ''}`} />
            <span>{isPlayingSample ? 'Speaking through device...' : 'Test Voice on This Device'}</span>
          </button>
        </div>

        {/* Sliders for Pitch and Speed */}
        <div className="space-y-3.5 bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            <span>Pace & Pitch Calibration</span>
          </div>

          {/* Pitch Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
              <span>Voice Pitch</span>
              <span className="text-blue-600 font-extrabold">
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
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-0.5">
              <span>0.90 (Deeper)</span>
              <span>1.15 (Default Sweet)</span>
              <span>1.45 (High)</span>
            </div>
          </div>

          {/* Rate Slider */}
          <div>
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
              <span>Speech Rate (Speed)</span>
              <span className="text-blue-600 font-extrabold">
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
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Voice Selection List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Voice Selector ({deviceInfo.displayName}):
            </span>
            <button
              onClick={refreshVoiceList}
              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
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
                    Smart Device Auto-Select (Recommended)
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-600 text-white">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Automatically chooses the highest quality British/Scottish voice available on your {deviceInfo.displayName}.
                </p>
              </div>
            </div>
            {settings.selectedVoiceURI === null && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
          </button>

          {/* List of Detected Voices */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {deviceRecommendedVoices.map((v) => (
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{v.name}</span>
                      {v.qualityBadge && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-indigo-100 text-indigo-800 rounded-md font-extrabold">
                          {v.qualityBadge}
                        </span>
                      )}
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-md font-extrabold">
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
            Auto-saved for {deviceInfo.displayName}.
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
