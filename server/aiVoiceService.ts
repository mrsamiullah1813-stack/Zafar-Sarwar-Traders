/**
 * Isolated High-Fidelity AI Voice & Text-to-Speech Engine
 * Powered by Microsoft Azure Cognitive Speech Neural Voices
 * Authentic Urdu (ur-PK) and Studio English (en-US, en-GB)
 * Features in-memory audio caching, prosody tuning, and graceful fallback.
 */

import type { Request, Response } from "express";

export interface AiVoiceOption {
  id: string;
  name: string;
  displayName: string;
  nativeName?: string;
  gender: "female" | "male";
  locale: string;
  language: "Urdu" | "English";
  tone: string;
  description: string;
  recommendedRate: number;
  recommendedPitch: number;
  badge: string;
}

export const AI_NEURAL_VOICE_CATALOG: AiVoiceOption[] = [
  // 🇵🇰 Urdu Neural Voices (Pakistan & Regional)
  {
    id: "ur-PK-UzmaNeural",
    name: "Uzma (Urdu - Pakistan)",
    displayName: "Uzma / عظمیٰ — Pakistan National Broadcast",
    nativeName: "عظمیٰ (اردو پاکستان)",
    gender: "female",
    locale: "ur-PK",
    language: "Urdu",
    tone: "Broadcast / Professional",
    description: "Authentic Pakistani Urdu with flawless pronunciation, natural rhythm, and clear diction.",
    recommendedRate: 0.90,
    recommendedPitch: 1.0,
    badge: "🇵🇰 Urdu Female • Broadcast"
  },
  {
    id: "ur-PK-AsadNeural",
    name: "Asad (Urdu - Pakistan)",
    displayName: "Asad / اسد — Corporate & Authoritative",
    nativeName: "اسد (اردو پاکستان)",
    gender: "male",
    locale: "ur-PK",
    language: "Urdu",
    tone: "Corporate / Formal Executive",
    description: "Deep, formal Urdu presentation with commanding cadence and authentic native vowelization.",
    recommendedRate: 0.90,
    recommendedPitch: 0.96,
    badge: "🇵🇰 Urdu Male • Executive"
  },
  {
    id: "ur-IN-GulNeural",
    name: "Gul (Urdu - Regional)",
    displayName: "Gul / گل — Friendly & Warm Conversational",
    nativeName: "گل (اردو)",
    gender: "female",
    locale: "ur-IN",
    language: "Urdu",
    tone: "Warm / Conversational",
    description: "Polite, smooth, and gentle Urdu cadence ideal for conversational guidance.",
    recommendedRate: 0.92,
    recommendedPitch: 1.04,
    badge: "🇵🇰 Urdu Female • Friendly"
  },
  {
    id: "ur-IN-SalmanNeural",
    name: "Salman (Urdu - Regional)",
    displayName: "Salman / سلمان — Polite & Dignified",
    nativeName: "سلمان (اردو)",
    gender: "male",
    locale: "ur-IN",
    language: "Urdu",
    tone: "Polite / Dignified",
    description: "Calm, articulate, and distinguished tone with balanced pacing.",
    recommendedRate: 0.90,
    recommendedPitch: 0.96,
    badge: "🇵🇰 Urdu Male • Dignified"
  },

  // 🇺🇸 US English Neural Voices
  {
    id: "en-US-AriaNeural",
    name: "Aria (US English)",
    displayName: "Aria — Executive & Crisp (Default)",
    gender: "female",
    locale: "en-US",
    language: "English",
    tone: "Executive / Authoritative",
    description: "Clear, modern, professional executive female assistant tone.",
    recommendedRate: 0.92,
    recommendedPitch: 1.0,
    badge: "🇺🇸 US Female • Executive"
  },
  {
    id: "en-US-JennyNeural",
    name: "Jenny (US English)",
    displayName: "Jenny — Warm, Friendly & Natural",
    gender: "female",
    locale: "en-US",
    language: "English",
    tone: "Warm / Friendly",
    description: "Natural conversational tone with warm, helpful inflections.",
    recommendedRate: 0.92,
    recommendedPitch: 1.0,
    badge: "🇺🇸 US Female • Friendly"
  },
  {
    id: "en-US-SaraNeural",
    name: "Sara (US English)",
    displayName: "Sara — Corporate & Confident",
    gender: "female",
    locale: "en-US",
    language: "English",
    tone: "Corporate / Confident",
    description: "Confident enterprise administrative assistant tone.",
    recommendedRate: 0.92,
    recommendedPitch: 1.0,
    badge: "🇺🇸 US Female • Corporate"
  },
  {
    id: "en-US-GuyNeural",
    name: "Guy (US English)",
    displayName: "Guy — Deep Executive & Resonant",
    gender: "male",
    locale: "en-US",
    language: "English",
    tone: "Executive / Resonant",
    description: "Deep, polished corporate male presenter with commanding presence.",
    recommendedRate: 0.92,
    recommendedPitch: 0.95,
    badge: "🇺🇸 US Male • Executive"
  },
  {
    id: "en-US-ChristopherNeural",
    name: "Christopher (US English)",
    displayName: "Christopher — Formal System Announcer",
    gender: "male",
    locale: "en-US",
    language: "English",
    tone: "Formal Announcer",
    description: "Official, deliberate system notification and broadcast voice.",
    recommendedRate: 0.90,
    recommendedPitch: 0.94,
    badge: "🇺🇸 US Male • Announcer"
  },
  {
    id: "en-US-EricNeural",
    name: "Eric (US English)",
    displayName: "Eric — Casual & Approachable",
    gender: "male",
    locale: "en-US",
    language: "English",
    tone: "Casual / Modern",
    description: "Approachable, conversational male voice with friendly cadence.",
    recommendedRate: 0.95,
    recommendedPitch: 1.0,
    badge: "🇺🇸 US Male • Casual"
  },

  // 🇬🇧 British English Neural Voices
  {
    id: "en-GB-SoniaNeural",
    name: "Sonia (British English)",
    displayName: "Sonia — Refined & Corporate",
    gender: "female",
    locale: "en-GB",
    language: "English",
    tone: "Refined / Corporate",
    description: "Dignified British accent with crisp, articulate pronunciation.",
    recommendedRate: 0.90,
    recommendedPitch: 1.0,
    badge: "🇬🇧 UK Female • Refined"
  },
  {
    id: "en-GB-RyanNeural",
    name: "Ryan (British English)",
    displayName: "Ryan — Executive British Announcer",
    gender: "male",
    locale: "en-GB",
    language: "English",
    tone: "Executive Announcer",
    description: "Prestigious British male broadcast delivery with distinguished tone.",
    recommendedRate: 0.90,
    recommendedPitch: 0.94,
    badge: "🇬🇧 UK Male • Announcer"
  }
];

// In-Memory LRU Audio Cache (max 250 items to prevent RAM bloat)
const audioBufferCache = new Map<string, Buffer>();
const MAX_CACHE_ENTRIES = 250;

function setCache(key: string, buffer: Buffer) {
  if (audioBufferCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = audioBufferCache.keys().next().value;
    if (oldestKey) audioBufferCache.delete(oldestKey);
  }
  audioBufferCache.set(key, buffer);
}

/**
 * Normalizes input voice and ensures Urdu text gets a native Urdu Neural model
 */
export function resolveEffectiveVoice(requestedVoice: string | undefined, text: string): string {
  const hasUrdu = /[\u0600-\u06FF]/.test(text);

  if (requestedVoice && AI_NEURAL_VOICE_CATALOG.some(v => v.id === requestedVoice)) {
    const voiceMeta = AI_NEURAL_VOICE_CATALOG.find(v => v.id === requestedVoice);
    // If text is in Urdu script, but an English voice was selected, automatically use the matching gender Urdu voice
    if (hasUrdu && voiceMeta && voiceMeta.language === "English") {
      return voiceMeta.gender === "male" ? "ur-PK-AsadNeural" : "ur-PK-UzmaNeural";
    }
    return requestedVoice;
  }

  // Fallbacks if voice is not directly found
  if (hasUrdu) {
    if (requestedVoice?.toLowerCase().includes("male") || requestedVoice?.toLowerCase().includes("asad") || requestedVoice?.toLowerCase().includes("tariq")) {
      return "ur-PK-AsadNeural";
    }
    return "ur-PK-UzmaNeural";
  }

  if (requestedVoice?.toLowerCase().includes("guy") || requestedVoice?.toLowerCase().includes("male") || requestedVoice?.toLowerCase().includes("david")) {
    return "en-US-GuyNeural";
  }

  return "en-US-AriaNeural";
}

/**
 * Formats speed/pitch numbers into Edge/Azure SSML prosody strings
 */
function formatProsody(rate?: number, pitch?: number, volume?: number) {
  let rateStr = "+0%";
  if (typeof rate === "number" && !isNaN(rate)) {
    const clampedRate = Math.max(0.5, Math.min(1.5, rate));
    const ratePercent = Math.round((clampedRate - 1.0) * 100);
    rateStr = (ratePercent >= 0 ? "+" : "") + ratePercent + "%";
  }

  let pitchStr = "+0Hz";
  if (typeof pitch === "number" && !isNaN(pitch)) {
    const clampedPitch = Math.max(0.6, Math.min(1.4, pitch));
    const pitchHz = Math.round((clampedPitch - 1.0) * 50);
    pitchStr = (pitchHz >= 0 ? "+" : "") + pitchHz + "Hz";
  }

  let volumeStr = "+0%";
  if (typeof volume === "number" && !isNaN(volume)) {
    const clampedVol = Math.max(0.2, Math.min(1.0, volume));
    const volPercent = Math.round((clampedVol - 1.0) * 50);
    volumeStr = (volPercent >= 0 ? "+" : "") + volPercent + "%";
  }

  return { rate: rateStr, pitch: pitchStr, volume: volumeStr };
}

/**
 * Secondary fallback: Google Translate TTS audio buffer
 */
async function generateFallbackTts(text: string, lang: string): Promise<Buffer> {
  const sanitizedText = text.slice(0, 300);
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${encodeURIComponent(lang)}&client=tw-ob&q=${encodeURIComponent(sanitizedText)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "audio/mpeg, audio/*;q=0.9, */*;q=0.8",
      "Referer": "https://translate.google.com/"
    }
  });

  if (!res.ok) {
    throw new Error(`Fallback TTS failed with status ${res.status}`);
  }

  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

/**
 * Core Speech Synthesis Function
 * Generates broadcast-quality MP3 audio using Microsoft Azure Cognitive Speech via msedge-tts
 */
export async function synthesizeNeuralSpeech(params: {
  text: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
}): Promise<Buffer> {
  const text = (params.text || "").trim();
  if (!text) {
    throw new Error("Text is empty");
  }

  const effectiveVoice = resolveEffectiveVoice(params.voice, text);
  const prosody = formatProsody(params.rate, params.pitch, params.volume);
  const cacheKey = `${effectiveVoice}_${prosody.rate}_${prosody.pitch}_${text}`;

  // Check in-memory cache
  if (audioBufferCache.has(cacheKey)) {
    return audioBufferCache.get(cacheKey)!;
  }

  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
    const tts = new MsEdgeTTS();
    await tts.setMetadata(effectiveVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(text, {
      rate: prosody.rate,
      pitch: prosody.pitch,
      volume: prosody.volume
    });

    const chunks: Buffer[] = [];

    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Edge TTS generation timed out after 6 seconds"));
      }, 6000);

      audioStream.on("data", (chunk: Buffer) => chunks.push(chunk));
      audioStream.on("end", () => {
        clearTimeout(timeoutId);
        const combined = Buffer.concat(chunks);
        if (combined.length === 0) {
          reject(new Error("Edge TTS returned 0 bytes"));
        } else {
          resolve(combined);
        }
      });
      audioStream.on("error", (err: any) => {
        clearTimeout(timeoutId);
        reject(err);
      });
    });

    setCache(cacheKey, audioBuffer);
    return audioBuffer;
  } catch (edgeError: any) {
    console.warn(`[Neural TTS] Edge TTS failed (${edgeError?.message || edgeError}). Falling back to secondary engine.`);
    
    // Automatic graceful fallback
    const hasUrdu = /[\u0600-\u06FF]/.test(text);
    const fallbackLang = params.lang || (hasUrdu ? "ur" : "en");
    const fallbackBuffer = await generateFallbackTts(text, fallbackLang);
    setCache(cacheKey, fallbackBuffer);
    return fallbackBuffer;
  }
}

/**
 * Express Request Handler for GET /api/tts
 */
export async function handleTtsGet(req: Request, res: Response) {
  try {
    const text = String(req.query.text || "").trim();
    if (!text) {
      return res.status(400).json({ error: "Missing text query parameter" });
    }

    const voice = req.query.voice ? String(req.query.voice) : undefined;
    const rate = req.query.rate ? parseFloat(String(req.query.rate)) : undefined;
    const pitch = req.query.pitch ? parseFloat(String(req.query.pitch)) : undefined;
    const volume = req.query.volume ? parseFloat(String(req.query.volume)) : undefined;
    const lang = req.query.lang ? String(req.query.lang) : undefined;

    const buffer = await synthesizeNeuralSpeech({ text, voice, rate, pitch, volume, lang });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(buffer);
  } catch (err: any) {
    console.error("[TTS GET Handler Error]:", err?.message || err);
    return res.status(500).json({ error: "Failed to synthesize speech audio" });
  }
}

/**
 * Express Request Handler for POST /api/tts
 */
export async function handleTtsPost(req: Request, res: Response) {
  try {
    const { text, voice, rate, pitch, volume, lang } = req.body || {};
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing text in request body" });
    }

    const parsedRate = typeof rate === "number" ? rate : undefined;
    const parsedPitch = typeof pitch === "number" ? pitch : undefined;
    const parsedVolume = typeof volume === "number" ? volume : undefined;

    const buffer = await synthesizeNeuralSpeech({
      text,
      voice: typeof voice === "string" ? voice : undefined,
      rate: parsedRate,
      pitch: parsedPitch,
      volume: parsedVolume,
      lang: typeof lang === "string" ? lang : undefined
    });

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    return res.send(buffer);
  } catch (err: any) {
    console.error("[TTS POST Handler Error]:", err?.message || err);
    return res.status(500).json({ error: "Failed to synthesize speech audio" });
  }
}

/**
 * Express Request Handler for GET /api/tts/voices
 */
export function handleTtsVoicesGet(req: Request, res: Response) {
  return res.json({
    success: true,
    engine: "Microsoft Azure Cognitive Speech Neural AI",
    voices: AI_NEURAL_VOICE_CATALOG
  });
}
