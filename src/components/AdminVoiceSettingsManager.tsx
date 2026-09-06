import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Play, 
  Square, 
  RotateCcw, 
  Save, 
  Sparkles, 
  CheckCircle2, 
  Sliders, 
  Radio, 
  Languages, 
  AlertTriangle,
  Loader2,
  Bot,
  Headphones,
  Wand2,
  Send
} from 'lucide-react';
import { 
  AdminVoiceSettings, 
  AdminVoiceEventKey, 
  ADMIN_VOICE_EVENT_DEFINITIONS, 
  defaultAdminVoiceSettings 
} from '../types';
import { 
  getAdminVoiceSettings, 
  saveAdminVoiceSettings, 
  CURATED_VOICE_PRESETS, 
  testSpeakAdminPrompt, 
  stopAdminVoice 
} from '../utils/adminVoice';

interface AdminVoiceSettingsManagerProps {
  showToast?: (message: string) => void;
}

export const AdminVoiceSettingsManager: React.FC<AdminVoiceSettingsManagerProps> = ({ showToast }) => {
  const [settings, setSettings] = useState<AdminVoiceSettings>(defaultAdminVoiceSettings);
  const [activePlayingKey, setActivePlayingKey] = useState<string | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'authentication' | 'security_pin' | 'pattern_lock'>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom Playground Scratchpad state
  const [scratchpadText, setScratchpadText] = useState('خوش آمدید جناب۔ ظفر سرور ٹریڈرز ایڈمن پینل۔');
  const [isScratchpadPlaying, setIsScratchpadPlaying] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loaded = getAdminVoiceSettings();
    setSettings(loaded);

    return () => {
      stopAdminVoice();
    };
  }, []);

  const handleToggleEnabled = () => {
    const nextState = !settings.enabled;
    const updated = { ...settings, enabled: nextState };
    setSettings(updated);
    setHasUnsavedChanges(true);
    if (!nextState) {
      stopAdminVoice();
      setActivePlayingKey(null);
      setIsScratchpadPlaying(false);
    }
  };

  const handleVoiceChange = (voiceId: string) => {
    const preset = CURATED_VOICE_PRESETS.find(p => p.id === voiceId);
    let updated: AdminVoiceSettings;
    if (preset) {
      updated = {
        ...settings,
        voiceId,
        pitch: preset.recommendedPitch,
        rate: preset.recommendedRate
      };
      // If switching to Urdu voice and scratchpad was in English, suggest Urdu text or vice versa
      if (preset.isUrdu && !/[\u0600-\u06FF]/.test(scratchpadText)) {
        setScratchpadText('خوش آمدید جناب۔ ظفر سرور ٹریڈرز ایڈمن پینل۔');
      } else if (!preset.isUrdu && /[\u0600-\u06FF]/.test(scratchpadText)) {
        setScratchpadText('Welcome, Sir. Zafar Sarwar Traders administrative voice engine is active.');
      }
    } else {
      updated = { ...settings, voiceId };
    }
    setSettings(updated);
    setHasUnsavedChanges(true);
  };

  const handlePromptChange = (key: AdminVoiceEventKey, text: string) => {
    setSettings(prev => ({
      ...prev,
      prompts: {
        ...prev.prompts,
        [key]: text
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleApplyPresetText = (key: AdminVoiceEventKey, text: string) => {
    handlePromptChange(key, text);
    if (showToast) {
      showToast('Preset text applied');
    }
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveAdminVoiceSettings(settings);
      setHasUnsavedChanges(false);
      if (showToast) {
        showToast('AI Voice & TTS Settings Saved Permanently');
      }
    } catch (err) {
      console.error('Failed to save voice settings:', err);
      if (showToast) {
        showToast('Error saving voice settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all voice prompts, acoustic calibration, and neural models back to factory defaults?')) {
      setSettings(defaultAdminVoiceSettings);
      saveAdminVoiceSettings(defaultAdminVoiceSettings);
      setHasUnsavedChanges(false);
      stopAdminVoice();
      setActivePlayingKey(null);
      setIsScratchpadPlaying(false);
      if (showToast) {
        showToast('Reset to Factory Default Voice Settings');
      }
    }
  };

  const handleTestPrompt = (playKey: string, textToSpeak: string) => {
    if (activePlayingKey === playKey) {
      stopAdminVoice();
      setActivePlayingKey(null);
      return;
    }

    stopAdminVoice();
    setActivePlayingKey(playKey);
    setIsScratchpadPlaying(false);

    testSpeakAdminPrompt(
      textToSpeak,
      {
        voiceId: settings.voiceId,
        pitch: settings.pitch,
        rate: settings.rate,
        volume: settings.volume
      },
      () => {
        setActivePlayingKey(playKey);
      },
      () => {
        setActivePlayingKey(null);
      }
    );
  };

  const handlePlayScratchpad = () => {
    if (!scratchpadText.trim()) return;

    if (isScratchpadPlaying) {
      stopAdminVoice();
      setIsScratchpadPlaying(false);
      return;
    }

    stopAdminVoice();
    setActivePlayingKey(null);
    setIsScratchpadPlaying(true);

    testSpeakAdminPrompt(
      scratchpadText,
      {
        voiceId: settings.voiceId,
        pitch: settings.pitch,
        rate: settings.rate,
        volume: settings.volume
      },
      () => {
        setIsScratchpadPlaying(true);
      },
      () => {
        setIsScratchpadPlaying(false);
      }
    );
  };

  const filteredEvents = ADMIN_VOICE_EVENT_DEFINITIONS.filter(def => {
    if (activeCategoryFilter === 'all') return true;
    return def.category === activeCategoryFilter;
  });

  const currentPreset = CURATED_VOICE_PRESETS.find(p => p.id === settings.voiceId) || CURATED_VOICE_PRESETS[0];

  return (
    <div id="admin-voice-settings-manager" className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner & Main Status */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white font-serif tracking-tight">
                  Ultra-Professional AI Voice & TTS Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Neural AI
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Authentic Pakistani Urdu & Studio-Grade English Neural Voices with custom event prompts.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <button
            id="toggle-voice-enabled-btn"
            type="button"
            onClick={handleToggleEnabled}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
              settings.enabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
            }`}
          >
            {settings.enabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>AI Guidance Active</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" />
                <span>AI Guidance Muted</span>
              </>
            )}
          </button>

          <button
            id="save-voice-settings-top-btn"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 disabled:opacity-50 ${
              hasUnsavedChanges
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{hasUnsavedChanges ? 'Save Voice Settings *' : 'Saved & Active'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Audio Playback Equalizer Bar */}
      {(activePlayingKey || isScratchpadPlaying) && (
        <div className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-900 border border-amber-500/60 text-amber-200 flex items-center justify-between gap-3 text-xs shadow-xl animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-5 px-1 bg-amber-500/10 rounded-md border border-amber-500/20">
              <span className="w-1 bg-amber-400 rounded-t animate-bounce [animation-delay:-0.3s] h-4"></span>
              <span className="w-1 bg-amber-400 rounded-t animate-bounce [animation-delay:-0.15s] h-5"></span>
              <span className="w-1 bg-amber-400 rounded-t animate-bounce [animation-delay:-0.4s] h-3"></span>
              <span className="w-1 bg-amber-400 rounded-t animate-bounce h-4.5"></span>
            </div>
            <span className="font-semibold text-white">
              Streaming Neural AI Audio:{' '}
              <span className="text-amber-300 font-normal">
                {isScratchpadPlaying 
                  ? 'Custom Scratchpad Sample'
                  : activePlayingKey === 'master_test' 
                    ? `Active Persona (${currentPreset.name})` 
                    : (ADMIN_VOICE_EVENT_DEFINITIONS.find(d => d.key === activePlayingKey)?.label || activePlayingKey)}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              stopAdminVoice();
              setActivePlayingKey(null);
              setIsScratchpadPlaying(false);
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md shadow-rose-950 transition-all"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop Audio</span>
          </button>
        </div>
      )}

      {/* Unsaved Changes Alert Notice */}
      {hasUnsavedChanges && (
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              You have modified voice models, acoustics, or prompt texts. Click <strong>"Save Voice Settings"</strong> to commit changes system-wide.
            </span>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shrink-0 shadow-md"
          >
            Save Settings Now
          </button>
        </div>
      )}

      {/* SECTION 1: VOICE MODEL SELECTION & ACOUSTIC TUNING */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span>1. AI Neural Voice Selection & Acoustic Calibration</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select between authentic Urdu broadcast models and studio-grade English announcers with fine-grained prosody tuning.
            </p>
          </div>

          <button
            id="test-selected-voice-btn"
            type="button"
            onClick={() => handleTestPrompt(
              'master_test', 
              currentPreset?.isUrdu 
                ? 'خوش آمدید جناب۔ ظفر سرور ٹریڈرز ایڈمن ڈیش بورڈ میں آپ کا خیر مقدم ہے۔' 
                : 'Welcome, Sir. Admin Voice Guidance and text-to-speech engine is active and ready.'
            )}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
              activePlayingKey === 'master_test'
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-950'
                : 'bg-slate-950 border-slate-700 text-amber-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {activePlayingKey === 'master_test' ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Sample</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Selected Voice</span>
              </>
            )}
          </button>
        </div>

        {/* Dropdown & Preset Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Active Neural Voice Model (Microsoft Azure Cognitive AI)
            </label>
            <select
              id="voice-model-selector"
              value={settings.voiceId}
              onChange={(e) => handleVoiceChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
            >
              <optgroup label="🇵🇰 Authentic Pakistani Urdu Neural Voices (قدرتی اردو آوازیں)">
                {CURATED_VOICE_PRESETS.filter(p => p.language === 'Urdu').map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.displayName}
                  </option>
                ))}
              </optgroup>

              <optgroup label="🇺🇸 US English Neural Voices (Executive & Announcers)">
                {CURATED_VOICE_PRESETS.filter(p => p.locale === 'en-US').map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.displayName}
                  </option>
                ))}
              </optgroup>

              <optgroup label="🇬🇧 British English Neural Voices (Dignified & Corporate)">
                {CURATED_VOICE_PRESETS.filter(p => p.locale === 'en-GB').map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.displayName}
                  </option>
                ))}
              </optgroup>
            </select>

            {/* Active Voice Persona Card */}
            {currentPreset && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{currentPreset.displayName}</div>
                      {currentPreset.nativeName && (
                        <div className="text-[11px] text-amber-300/90 font-serif mt-0.5">{currentPreset.nativeName}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      currentPreset.isUrdu 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60' 
                        : 'bg-blue-950 text-blue-300 border-blue-800/60'
                    }`}>
                      {currentPreset.badge}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {currentPreset.description}
                </p>

                <div className="pt-2 border-t border-slate-900/80 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {currentPreset.isUrdu 
                        ? 'Native Pakistani Urdu (ur-PK) pronunciation and Nastaliq cadence active.' 
                        : 'Studio-Grade 24kHz HD Neural Speech Synthesis Active.'}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono">
                    Model: {currentPreset.id}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Acoustic Calibration Sliders */}
          <div className="space-y-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>Acoustic Calibration</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (currentPreset) {
                    setSettings(prev => ({
                      ...prev,
                      pitch: currentPreset.recommendedPitch,
                      rate: currentPreset.recommendedRate,
                      volume: 0.95
                    }));
                    setHasUnsavedChanges(true);
                  }
                }}
                className="text-[10px] text-amber-400 hover:text-amber-300 underline"
              >
                Reset Tuning
              </button>
            </div>

            {/* Speech Rate (Speed) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Speech Rate / Speed</span>
                <span className="text-amber-400 font-mono font-bold">{(settings.rate || 0.9).toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.65"
                max="1.35"
                step="0.02"
                value={settings.rate || 0.9}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.65x (Deliberate)</span>
                <span>0.90x (Optimal)</span>
                <span>1.35x (Brisk)</span>
              </div>
            </div>

            {/* Voice Pitch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Voice Pitch / Frequency</span>
                <span className="text-amber-400 font-mono font-bold">{(settings.pitch || 1.0).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.70"
                max="1.30"
                step="0.02"
                value={settings.pitch || 1.0}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>0.70 (Deeper)</span>
                <span>1.00 (Neutral)</span>
                <span>1.30 (Higher)</span>
              </div>
            </div>

            {/* Output Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Master Playback Volume</span>
                <span className="text-amber-400 font-mono font-bold">{Math.round((settings.volume || 0.95) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="1.00"
                step="0.05"
                value={settings.volume || 0.95}
                onChange={(e) => {
                  setSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }));
                  setHasUnsavedChanges(true);
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: LIVE VOICE SCRATCHPAD / PLAYGROUND */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
                Live Speech Playground (Instant Audio Test)
              </h3>
              <p className="text-[11px] text-slate-400">
                Type any custom phrase in English or native Urdu script to hear how the selected AI Neural Voice pronounces it in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setScratchpadText('خوش آمدید جناب۔ ظفر سرور ٹریڈرز ایڈمن پینل۔')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300"
            >
              Urdu Demo
            </button>
            <button
              type="button"
              onClick={() => setScratchpadText('Welcome, Sir. Authentication system is verified and active.')}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300"
            >
              English Demo
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={scratchpadText}
              onChange={(e) => setScratchpadText(e.target.value)}
              placeholder="Type test text in Urdu or English..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium transition-all"
            />
          </div>

          <button
            id="play-scratchpad-btn"
            type="button"
            onClick={handlePlayScratchpad}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 shrink-0 ${
              isScratchpadPlaying
                ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-950'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-950'
            }`}
          >
            {isScratchpadPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Playing</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generate & Speak</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* SECTION 3: SYSTEM PROMPTS CUSTOMIZATION MATRIX */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>3. Customizable Action Prompts & Script Translations</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Customize what the voice says during each checkpoint. Click the 1-click presets for authentic Urdu or English.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-center">
            {[
              { id: 'all', label: 'All Prompts' },
              { id: 'authentication', label: 'Login' },
              { id: 'security_pin', label: 'PIN' },
              { id: 'pattern_lock', label: 'Pattern' }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveCategoryFilter(f.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  activeCategoryFilter === f.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Event Cards Grid */}
        <div className="space-y-4">
          {filteredEvents.map((eventDef) => {
            const currentText = settings.prompts[eventDef.key] || eventDef.defaultTextEn;
            const isPlaying = activePlayingKey === eventDef.key;

            return (
              <div 
                key={eventDef.key} 
                id={`voice-event-${eventDef.key}`}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isPlaying 
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-lg shadow-amber-950/40' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{eventDef.label}</span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono uppercase">
                        {eventDef.category.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {eventDef.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {/* Audio playing state feedback */}
                    {isPlaying && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                        <span className="w-1.5 h-3 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-4 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-2.5 bg-amber-400 rounded-full animate-bounce"></span>
                        <span className="ml-1">Playing...</span>
                      </span>
                    )}

                    {/* Test Button for this specific prompt */}
                    <button
                      type="button"
                      onClick={() => handleTestPrompt(eventDef.key, currentText)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                        isPlaying
                          ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-950'
                          : 'bg-slate-900 border-slate-700 text-cyan-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Play Sample</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Text Area */}
                <div className="relative">
                  <textarea
                    rows={2}
                    value={currentText}
                    onChange={(e) => handlePromptChange(eventDef.key, e.target.value)}
                    placeholder="Type customized voice prompt text in English or Urdu script..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all leading-relaxed"
                  />
                </div>

                {/* Quick 1-Click Suggestions: English, Urdu Script, Roman Urdu */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                  <span className="text-slate-500 font-medium">Quick Presets:</span>

                  <button
                    type="button"
                    onClick={() => handleApplyPresetText(eventDef.key, eventDef.defaultTextEn)}
                    className="px-2.5 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all"
                    title={eventDef.defaultTextEn}
                  >
                    🇬🇧 Default English
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPresetText(eventDef.key, eventDef.defaultTextUr)}
                    className="px-2.5 py-0.5 rounded-md bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 text-emerald-300 hover:text-white transition-all font-serif"
                    title={eventDef.defaultTextUr}
                  >
                    🇵🇰 اردو (Urdu Script)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPresetText(eventDef.key, eventDef.defaultTextRomanUr)}
                    className="px-2.5 py-0.5 rounded-md bg-blue-950/40 hover:bg-blue-900/50 border border-blue-800/40 text-blue-300 hover:text-white transition-all"
                    title={eventDef.defaultTextRomanUr}
                  >
                    💬 Roman Urdu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FOOTER ACTIONS & PERMANENT COMMIT */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              Unsaved Changes: Click <strong>"Save Voice Settings"</strong> to apply modifications system-wide.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All Voice Settings are synchronized and active system-wide across Admin Login, PIN, and Pattern Lock.
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            id="reset-voice-defaults-btn"
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Defaults</span>
          </button>

          <button
            id="save-voice-settings-bottom-btn"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 ${
              hasUnsavedChanges
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-950 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{hasUnsavedChanges ? 'Save Voice Settings *' : 'Saved & Active'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
