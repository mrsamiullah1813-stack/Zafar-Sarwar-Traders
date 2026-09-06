// Ultra-Professional AI Neural Voice & Text-to-Speech Engine
// Powered by Microsoft Azure Cognitive Speech Neural Models
// Authentic Urdu (ur-PK) Broadcast & Executive English (en-US, en-GB)

import {
  AdminVoiceSettings,
  AdminVoiceEventKey,
  AdminVoicePresetOption,
  defaultAdminVoiceSettings
} from '../types';

export const VOICE_SETTINGS_STORAGE_KEY = 'zst_admin_voice_settings_v2';
export const LEGACY_VOICE_STORAGE_KEY_V1 = 'zst_admin_voice_settings_v1';
export const LEGACY_VOICE_ENABLED_KEY = 'zst_admin_voice_enabled';

/**
 * Curated Library of Ultra-Realistic AI Neural Voices
 */
export const CURATED_VOICE_PRESETS: AdminVoicePresetOption[] = [
  // 🇵🇰 Urdu Neural Voices (Pakistan & Regional)
  {
    id: 'ur-PK-UzmaNeural',
    name: 'Uzma / عظمیٰ (Urdu - Pakistan)',
    displayName: 'Uzma / عظمیٰ — Pakistan National Broadcast (Female)',
    nativeName: 'عظمیٰ (اردو پاکستان)',
    gender: 'female',
    locale: 'ur-PK',
    language: 'Urdu',
    tone: 'Broadcast / Professional',
    description: 'Authentic Pakistani Urdu national broadcast cadence, natural rhythm, zero foreign accent.',
    recommendedRate: 0.90,
    recommendedPitch: 1.0,
    badge: '🇵🇰 Urdu Female • Broadcast',
    isUrdu: true
  },
  {
    id: 'ur-PK-AsadNeural',
    name: 'Asad / اسد (Urdu - Pakistan)',
    displayName: 'Asad / اسد — Corporate & Authoritative (Male)',
    nativeName: 'اسد (اردو پاکستان)',
    gender: 'male',
    locale: 'ur-PK',
    language: 'Urdu',
    tone: 'Corporate / Formal Executive',
    description: 'Deep, formal executive presentation with commanding cadence and authentic Urdu diction.',
    recommendedRate: 0.90,
    recommendedPitch: 0.96,
    badge: '🇵🇰 Urdu Male • Executive',
    isUrdu: true
  },
  {
    id: 'ur-IN-GulNeural',
    name: 'Gul / گل (Urdu - Regional)',
    displayName: 'Gul / گل — Friendly & Warm Conversational (Female)',
    nativeName: 'گل (اردو)',
    gender: 'female',
    locale: 'ur-IN',
    language: 'Urdu',
    tone: 'Warm / Conversational',
    description: 'Gentle, polite, and melodic Urdu cadence ideal for welcoming and advisory prompts.',
    recommendedRate: 0.92,
    recommendedPitch: 1.04,
    badge: '🇵🇰 Urdu Female • Friendly',
    isUrdu: true
  },
  {
    id: 'ur-IN-SalmanNeural',
    name: 'Salman / سلمان (Urdu - Regional)',
    displayName: 'Salman / سلمان — Polite & Dignified (Male)',
    nativeName: 'سلمان (اردو)',
    gender: 'male',
    locale: 'ur-IN',
    language: 'Urdu',
    tone: 'Polite / Dignified',
    description: 'Calm, articulate, and distinguished cadence with clear consonant clarity.',
    recommendedRate: 0.90,
    recommendedPitch: 0.96,
    badge: '🇵🇰 Urdu Male • Dignified',
    isUrdu: true
  },

  // 🇺🇸 US English Neural Voices
  {
    id: 'en-US-AriaNeural',
    name: 'Aria (US English)',
    displayName: 'Aria — Executive & Crisp (Default Female)',
    gender: 'female',
    locale: 'en-US',
    language: 'English',
    tone: 'Executive / Authoritative',
    description: 'Crisp, modern, high-confidence executive administrative assistant voice.',
    recommendedRate: 0.92,
    recommendedPitch: 1.0,
    badge: '🇺🇸 US Female • Executive',
    isUrdu: false
  },
  {
    id: 'en-US-JennyNeural',
    name: 'Jenny (US English)',
    displayName: 'Jenny — Friendly, Warm & Natural (Female)',
    gender: 'female',
    locale: 'en-US',
    language: 'English',
    tone: 'Warm / Friendly',
    description: 'Natural human conversational tone with warm, engaging inflections.',
    recommendedRate: 0.92,
    recommendedPitch: 1.0,
    badge: '🇺🇸 US Female • Friendly',
    isUrdu: false
  },
  {
    id: 'en-US-SaraNeural',
    name: 'Sara (US English)',
    displayName: 'Sara — Corporate & Confident (Female)',
    gender: 'female',
    locale: 'en-US',
    language: 'English',
    tone: 'Corporate / Confident',
    description: 'Polished corporate female tone tailored for enterprise security guidance.',
    recommendedRate: 0.92,
    recommendedPitch: 1.0,
    badge: '🇺🇸 US Female • Corporate',
    isUrdu: false
  },
  {
    id: 'en-US-GuyNeural',
    name: 'Guy (US English)',
    displayName: 'Guy — Deep Executive & Resonant (Male)',
    gender: 'male',
    locale: 'en-US',
    language: 'English',
    tone: 'Executive / Resonant',
    description: 'Deep, resonant executive corporate voice with strong commanding presence.',
    recommendedRate: 0.92,
    recommendedPitch: 0.95,
    badge: '🇺🇸 US Male • Executive',
    isUrdu: false
  },
  {
    id: 'en-US-ChristopherNeural',
    name: 'Christopher (US English)',
    displayName: 'Christopher — Formal System Announcer (Male)',
    gender: 'male',
    locale: 'en-US',
    language: 'English',
    tone: 'Formal Announcer',
    description: 'Official, authoritative broadcast delivery designed for high-security environments.',
    recommendedRate: 0.90,
    recommendedPitch: 0.94,
    badge: '🇺🇸 US Male • Announcer',
    isUrdu: false
  },
  {
    id: 'en-US-EricNeural',
    name: 'Eric (US English)',
    displayName: 'Eric — Casual & Approachable (Male)',
    gender: 'male',
    locale: 'en-US',
    language: 'English',
    tone: 'Casual / Modern',
    description: 'Relaxed, modern conversational tone with friendly cadence.',
    recommendedRate: 0.95,
    recommendedPitch: 1.0,
    badge: '🇺🇸 US Male • Casual',
    isUrdu: false
  },

  // 🇬🇧 British English Neural Voices
  {
    id: 'en-GB-SoniaNeural',
    name: 'Sonia (British English)',
    displayName: 'Sonia — Refined & Corporate (UK Female)',
    gender: 'female',
    locale: 'en-GB',
    language: 'English',
    tone: 'Refined / Corporate',
    description: 'Distinguished British female accent with elegant, crisp diction.',
    recommendedRate: 0.90,
    recommendedPitch: 1.0,
    badge: '🇬🇧 UK Female • Refined',
    isUrdu: false
  },
  {
    id: 'en-GB-RyanNeural',
    name: 'Ryan (British English)',
    displayName: 'Ryan — Executive British Announcer (UK Male)',
    gender: 'male',
    locale: 'en-GB',
    language: 'English',
    tone: 'Executive Announcer',
    description: 'Prestigious British broadcast announcer voice with deep, dignified resonance.',
    recommendedRate: 0.90,
    recommendedPitch: 0.94,
    badge: '🇬🇧 UK Male • Announcer',
    isUrdu: false
  }
];

// Mapping for migrating old preset IDs to Neural Voice IDs
const LEGACY_ID_MAP: Record<string, string> = {
  'urdu_female_natural': 'ur-PK-UzmaNeural',
  'urdu_male_formal': 'ur-PK-AsadNeural',
  'urdu_bilingual': 'ur-PK-UzmaNeural',
  'female_executive': 'en-US-AriaNeural',
  'male_executive': 'en-US-GuyNeural',
  'female_warm': 'en-US-JennyNeural',
  'male_corporate': 'en-GB-RyanNeural'
};

export const normalizeVoiceId = (id: string): string => {
  if (LEGACY_ID_MAP[id]) return LEGACY_ID_MAP[id];
  if (CURATED_VOICE_PRESETS.some(p => p.id === id)) return id;
  return 'ur-PK-UzmaNeural';
};

// ==========================================
// STATE MANAGEMENT & PERSISTENCE
// ==========================================

let inMemorySettings: AdminVoiceSettings | null = null;

export const getAdminVoiceSettings = (): AdminVoiceSettings => {
  if (inMemorySettings) {
    return inMemorySettings;
  }
  try {
    if (typeof window === 'undefined') return defaultAdminVoiceSettings;

    // Check modern storage key first
    let raw = localStorage.getItem(VOICE_SETTINGS_STORAGE_KEY);
    if (!raw) {
      // Check v1 storage key
      raw = localStorage.getItem(LEGACY_VOICE_STORAGE_KEY_V1);
    }

    if (!raw) {
      const legacyEnabled = localStorage.getItem(LEGACY_VOICE_ENABLED_KEY);
      const res: AdminVoiceSettings = legacyEnabled !== null
        ? { ...defaultAdminVoiceSettings, enabled: legacyEnabled === 'true' }
        : defaultAdminVoiceSettings;
      inMemorySettings = res;
      return res;
    }

    const parsed = JSON.parse(raw);
    const normalizedVoice = normalizeVoiceId(parsed.voiceId || defaultAdminVoiceSettings.voiceId);

    const merged: AdminVoiceSettings = {
      ...defaultAdminVoiceSettings,
      ...parsed,
      voiceId: normalizedVoice,
      prompts: {
        ...defaultAdminVoiceSettings.prompts,
        ...(parsed.prompts || {})
      }
    };

    inMemorySettings = merged;
    return merged;
  } catch {
    return defaultAdminVoiceSettings;
  }
};

export const saveAdminVoiceSettings = (settings: AdminVoiceSettings): void => {
  try {
    const normalized: AdminVoiceSettings = {
      ...settings,
      voiceId: normalizeVoiceId(settings.voiceId)
    };

    inMemorySettings = { ...normalized };
    if (typeof window === 'undefined') return;

    // 1. Commit to LocalStorage
    localStorage.setItem(VOICE_SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(LEGACY_VOICE_ENABLED_KEY, String(normalized.enabled));

    // 2. Commit to Server CMS disk asynchronously
    try {
      fetch('/api/cms/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: VOICE_SETTINGS_STORAGE_KEY, payload: normalized })
      }).catch(() => {});
    } catch {}

    // 3. Dispatch global sync event
    try {
      window.dispatchEvent(new CustomEvent('zst_voice_settings_updated', { detail: normalized }));
    } catch {}

    // 4. Halt playback if disabled
    if (!normalized.enabled) {
      stopAdminVoice();
    }
  } catch (err) {
    console.warn('[Admin Voice] Failed to save voice settings:', err);
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('zst_voice_settings_updated', (e: any) => {
    if (e?.detail) {
      inMemorySettings = e.detail;
    }
  });
}

// Backward-compatible helpers
export const getAdminVoicePreference = (): boolean => {
  return getAdminVoiceSettings().enabled;
};

export const setAdminVoicePreference = (enabled: boolean): void => {
  try {
    const current = getAdminVoiceSettings();
    saveAdminVoiceSettings({ ...current, enabled });
  } catch {}
};

// ==========================================
// PROMPT LOOKUP MAPPER
// ==========================================

const DEFAULT_PROMPT_MATCHERS: Record<string, AdminVoiceEventKey> = {
  'please enter your email and password.': 'enter_credentials',
  'please enter your security pin.': 'enter_pin',
  'please draw your security pattern.': 'draw_pattern',
  'security pin verified. please draw your pattern lock.': 'pin_verified',
  'welcome, sir. welcome to your admin dashboard.': 'welcome_dashboard',
  'pattern verified. welcome, sir. welcome to your admin dashboard.': 'welcome_dashboard',
  'authentication failed. please try again.': 'auth_failed',
  'security pin is incorrect. please try again.': 'pin_incorrect',
  'incorrect pattern. please try again.': 'pattern_incorrect',
  'please draw your new security pattern.': 'pattern_setup'
};

export const mapTextOrKeyToConfiguredPrompt = (
  textOrKey: string,
  settings: AdminVoiceSettings
): { promptText: string; eventKey?: AdminVoiceEventKey } => {
  if (textOrKey in settings.prompts) {
    const key = textOrKey as AdminVoiceEventKey;
    return { promptText: settings.prompts[key] || textOrKey, eventKey: key };
  }

  const normalized = textOrKey.trim().toLowerCase();
  const matchedKey = DEFAULT_PROMPT_MATCHERS[normalized];
  if (matchedKey && settings.prompts[matchedKey]) {
    return { promptText: settings.prompts[matchedKey], eventKey: matchedKey };
  }

  return { promptText: textOrKey };
};

// ==========================================
// HIGH-FIDELITY AUDIO PLAYBACK ENGINE
// ==========================================

let activeAudioElement: HTMLAudioElement | null = null;
let lastSpokenText = '';
let lastSpokenTimestamp = 0;

// Client-side in-memory Audio cache for instant re-play without network lag
const audioObjectCache = new Map<string, HTMLAudioElement>();

export const stopAdminVoice = (): void => {
  try {
    if (activeAudioElement) {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
      activeAudioElement = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
};

/**
 * Plays ultra-realistic AI Neural Voice audio via the server endpoint
 */
export const playNeuralAiAudio = (options: {
  text: string;
  voiceId?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}): boolean => {
  try {
    stopAdminVoice();

    const sanitized = (options.text || '').trim();
    if (!sanitized) {
      if (options.onEnd) options.onEnd();
      return false;
    }

    const settings = getAdminVoiceSettings();
    const voiceId = normalizeVoiceId(options.voiceId || settings.voiceId);
    const rate = typeof options.rate === 'number' ? options.rate : settings.rate;
    const pitch = typeof options.pitch === 'number' ? options.pitch : settings.pitch;
    const volume = typeof options.volume === 'number' ? options.volume : settings.volume;

    const cacheKey = `${voiceId}_${rate}_${pitch}_${volume}_${sanitized}`;
    let audio: HTMLAudioElement;

    if (audioObjectCache.has(cacheKey)) {
      audio = audioObjectCache.get(cacheKey)!;
      audio.currentTime = 0;
    } else {
      const url = `/api/tts?voice=${encodeURIComponent(voiceId)}&rate=${rate}&pitch=${pitch}&volume=${volume}&text=${encodeURIComponent(sanitized)}`;
      audio = new Audio(url);
      if (audioObjectCache.size < 50) {
        audioObjectCache.set(cacheKey, audio);
      }
    }

    activeAudioElement = audio;
    audio.volume = Math.max(0.1, Math.min(1.0, volume));

    audio.onplay = () => {
      if (options.onStart) options.onStart();
    };

    audio.onended = () => {
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      if (options.onEnd) options.onEnd();
    };

    audio.onerror = (e) => {
      console.warn('[AI Voice] Neural audio playback encountered an issue:', e);
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      if (options.onError) {
        options.onError(e);
      } else if (options.onEnd) {
        options.onEnd();
      }
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('[AI Voice] Playback caught:', err);
        if (activeAudioElement === audio) {
          activeAudioElement = null;
        }
        if (options.onEnd) options.onEnd();
      });
    }
    return true;
  } catch (err) {
    console.warn('[AI Voice] Failed to dispatch neural audio:', err);
    if (options.onEnd) options.onEnd();
    return false;
  }
};

/**
 * System-Wide Voice Dispatcher
 * Spoken during admin logins, security PIN verifications, and pattern locks.
 */
export const speakAdminVoice = (
  textOrKey: string,
  force: boolean = false,
  explicitKey?: AdminVoiceEventKey
): void => {
  try {
    const settings = getAdminVoiceSettings();
    if (!settings.enabled) return;

    let textToSpeak = textOrKey;
    if (explicitKey && settings.prompts[explicitKey]) {
      textToSpeak = settings.prompts[explicitKey];
    } else {
      const mapped = mapTextOrKeyToConfiguredPrompt(textOrKey, settings);
      textToSpeak = mapped.promptText;
    }

    if (!textToSpeak || !textToSpeak.trim()) return;

    const now = Date.now();
    if (!force && lastSpokenText === textToSpeak && now - lastSpokenTimestamp < 1200) {
      return;
    }
    lastSpokenText = textToSpeak;
    lastSpokenTimestamp = now;

    playNeuralAiAudio({
      text: textToSpeak,
      voiceId: settings.voiceId,
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      onError: () => {
        // Fallback to browser SpeechSynthesis if network or server is offline
        try {
          if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const utter = new SpeechSynthesisUtterance(textToSpeak);
            utter.rate = settings.rate;
            utter.pitch = settings.pitch;
            utter.volume = settings.volume;
            window.speechSynthesis.speak(utter);
          }
        } catch {}
      }
    });
  } catch (err) {
    console.warn('[Admin Voice] Speech dispatcher failed:', err);
  }
};

/**
 * Interactive Preview & Sample Playback for the Settings UI
 */
export const testSpeakAdminPrompt = (
  text: string,
  customOptions?: {
    voiceId?: string;
    pitch?: number;
    rate?: number;
    volume?: number;
  },
  onStart?: () => void,
  onEnd?: () => void
): void => {
  playNeuralAiAudio({
    text,
    voiceId: customOptions?.voiceId,
    rate: customOptions?.rate,
    pitch: customOptions?.pitch,
    volume: customOptions?.volume,
    onStart,
    onEnd,
    onError: () => {
      if (onEnd) onEnd();
    }
  });
};
