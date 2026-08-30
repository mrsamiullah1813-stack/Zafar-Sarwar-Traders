// Global safe SpeechSynthesis utility for Admin Voice Feedback
// Ensures voice notifications can safely finish across component mount/unmount and route transitions

const femaleKeywords = [
  'jenny', 'aria', 'sonia', 'libby', 'maisie', 'natasha', // Microsoft Natural Neural
  'google uk english female', 'google us english', // Google Chrome Natural
  'samantha', 'karen', 'victoria', 'moira', 'fiona', 'tessa', 'ava', 'allison', 'serena', 'siri', // Apple / iOS / macOS
  'zira', 'hazel', 'susan', 'cather', 'linda', 'eva' // System female
];

let cachedVoices: SpeechSynthesisVoice[] = [];

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const loadVoices = () => {
    try {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length > 0) cachedVoices = v;
    } catch {}
  };
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
}

export const getAdminVoicePreference = (): boolean => {
  try {
    const stored = localStorage.getItem('zst_admin_voice_enabled');
    return stored !== null ? stored === 'true' : true;
  } catch {
    return true;
  }
};

export const setAdminVoicePreference = (enabled: boolean): void => {
  try {
    localStorage.setItem('zst_admin_voice_enabled', String(enabled));
    if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  } catch {}
};

export const getBestAdminFemaleVoice = (): SpeechSynthesisVoice | null => {
  try {
    const voices = cachedVoices.length > 0 
      ? cachedVoices 
      : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : []);
    
    if (!voices || voices.length === 0) return null;

    for (const kw of femaleKeywords) {
      const match = voices.find(v => v.name.toLowerCase().includes(kw) && v.lang.toLowerCase().startsWith('en'));
      if (match) return match;
    }

    const genericFemale = voices.find(v => 
      v.lang.toLowerCase().startsWith('en') && 
      (v.name.toLowerCase().includes('female') || (v as any).gender === 'female')
    );
    if (genericFemale) return genericFemale;

    const englishVoice = voices.find(v => v.lang === 'en-US' || v.lang === 'en-GB' || v.lang.startsWith('en'));
    return englishVoice || voices[0] || null;
  } catch {
    return null;
  }
};

let lastSpokenText = '';
let lastSpokenTimestamp = 0;

export const speakAdminVoice = (text: string, force: boolean = false): void => {
  try {
    if (!getAdminVoicePreference()) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const now = Date.now();
    if (!force && lastSpokenText === text && now - lastSpokenTimestamp < 1500) {
      return;
    }
    lastSpokenText = text;
    lastSpokenTimestamp = now;

    window.speechSynthesis.cancel(); // cancel prior utterances

    const utterance = new SpeechSynthesisUtterance(text);
    // Relaxed, natural, human-like AI female assistant acoustics
    utterance.rate = 0.88;
    utterance.pitch = 1.06;
    utterance.volume = 0.88;
    utterance.lang = 'en-US';

    const selectedVoice = getBestAdminFemaleVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('[Admin Voice] Speech synthesis unavailable:', err);
  }
};
