import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe static access to Vite environment variables (statically replaced by Vite during build)
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};
const winEnv = typeof window !== 'undefined' ? ((window as any).__ENV__ || (window as any) || {}) : {};

let rawUrl = (
  metaEnv.VITE_SUPABASE_URL ||
  metaEnv.SUPABASE_URL ||
  metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
  winEnv.VITE_SUPABASE_URL ||
  winEnv.SUPABASE_URL ||
  ''
).trim();

let rawKey = (
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.SUPABASE_ANON_KEY ||
  metaEnv.SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.SUPABASE_KEY ||
  winEnv.VITE_SUPABASE_ANON_KEY ||
  winEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
  winEnv.SUPABASE_ANON_KEY ||
  ''
).trim();

export function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
    if (!cleaned.includes('.')) {
      cleaned += '.supabase.co';
    }
  }
  return cleaned;
}

rawUrl = normalizeSupabaseUrl(rawUrl);

function isValidHttpUrl(urlString: string): boolean {
  if (!urlString) return false;
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isPlaceholderUrl = (url: string) =>
  !url ||
  url.includes('your-supabase-project') ||
  url.includes('placeholder') ||
  url.includes('EXAMPLE') ||
  url.includes('YOUR_');

export const isPlaceholderKey = (key: string) =>
  !key ||
  key.includes('your-supabase-anon-key') ||
  key.includes('placeholder') ||
  key.includes('EXAMPLE') ||
  key.includes('YOUR_');

export let isSupabaseConfigured = Boolean(
  isValidHttpUrl(rawUrl) &&
  !isPlaceholderUrl(rawUrl) &&
  !isPlaceholderKey(rawKey)
);

// Fallback dummy URL/Key to avoid initialization throw if env vars aren't populated yet
const dummyUrl = 'https://placeholder.supabase.co';
const dummyKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

let activeClient: SupabaseClient;

function createSupabaseInstance(url: string, key: string, isReal: boolean): SupabaseClient {
  try {
    return createClient(url, key, {
      auth: {
        persistSession: isReal,
        autoRefreshToken: isReal,
        detectSessionInUrl: isReal,
      },
    });
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    return createClient(dummyUrl, dummyKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
}

// Extract safe hostname for diagnostic logging (never log keys or tokens)
export function getSafeHost(url: string): string {
  try {
    if (!url || isPlaceholderUrl(url)) return 'Not configured (placeholder)';
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return 'Invalid URL format';
  }
}

if (isSupabaseConfigured) {
  activeClient = createSupabaseInstance(rawUrl, rawKey, true);
  console.log(`[Supabase Direct SDK] Initialization: SUCCESS | Target: ${getSafeHost(rawUrl)} | Auth: Configured`);
} else {
  activeClient = createSupabaseInstance(dummyUrl, dummyKey, false);
  console.warn(`[Supabase Direct SDK] Initialization: PENDING | Target: ${getSafeHost(rawUrl)} | Key Present: ${Boolean(rawKey)}`);
}

// Proxied supabase client that dynamically routes all calls to activeClient
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(activeClient, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(activeClient);
    }
    return value;
  },
  set(_target, prop, value, receiver) {
    return Reflect.set(activeClient, prop, value, receiver);
  }
});

let runtimeInitPromise: Promise<boolean> | null = null;

export async function initializeSupabaseRuntime(): Promise<boolean> {
  if (isSupabaseConfigured) {
    return true;
  }
  if (runtimeInitPromise) {
    return runtimeInitPromise;
  }

  runtimeInitPromise = (async () => {
    try {
      // 1. Check if safe cached credentials exist in sessionStorage or localStorage
      try {
        const cached = sessionStorage.getItem('zst_sb_config_cache') || localStorage.getItem('zst_sb_config_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.url && parsed?.anonKey && !isPlaceholderUrl(parsed.url) && !isPlaceholderKey(parsed.anonKey)) {
            const cleanUrl = normalizeSupabaseUrl(parsed.url);
            activeClient = createSupabaseInstance(cleanUrl, parsed.anonKey, true);
            isSupabaseConfigured = true;
            console.log(`[Supabase Direct SDK] Restored from runtime storage cache: ${getSafeHost(cleanUrl)}`);
            return true;
          }
        }
      } catch {}

      // 2. Check window.__ENV__ if injected dynamically
      try {
        const win = typeof window !== 'undefined' ? (window as any) : null;
        if (win) {
          const dynamicUrl = win.__ENV__?.VITE_SUPABASE_URL || win.VITE_SUPABASE_URL;
          const dynamicKey = win.__ENV__?.VITE_SUPABASE_ANON_KEY || win.VITE_SUPABASE_ANON_KEY || win.VITE_SUPABASE_PUBLISHABLE_KEY;
          if (dynamicUrl && dynamicKey && !isPlaceholderUrl(dynamicUrl) && !isPlaceholderKey(dynamicKey)) {
            const cleanUrl = normalizeSupabaseUrl(dynamicUrl);
            activeClient = createSupabaseInstance(cleanUrl, dynamicKey, true);
            isSupabaseConfigured = true;
            console.log(`[Supabase Direct SDK] Connected via window runtime config: ${getSafeHost(cleanUrl)}`);
            return true;
          }
        }
      } catch {}

      // 3. Fallback: only try server config endpoint if available (non-fatal if 404 on static hosting)
      try {
        const res = await fetch('/api/supabase-config', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json?.configured && json?.url && json?.anonKey) {
            const cleanUrl = normalizeSupabaseUrl(json.url);
            if (isValidHttpUrl(cleanUrl) && !isPlaceholderUrl(cleanUrl) && !isPlaceholderKey(json.anonKey)) {
              activeClient = createSupabaseInstance(cleanUrl, json.anonKey, true);
              isSupabaseConfigured = true;
              try {
                sessionStorage.setItem('zst_sb_config_cache', JSON.stringify({ url: cleanUrl, anonKey: json.anonKey }));
              } catch {}
              console.log(`[Supabase Direct SDK] Connected via server configuration: ${getSafeHost(cleanUrl)}`);
              return true;
            }
          }
        }
      } catch {}
    } catch (e) {
      // Silent catch - static hosting won't have /api/ endpoints
    }
    return isSupabaseConfigured;
  })();

  return runtimeInitPromise;
}
