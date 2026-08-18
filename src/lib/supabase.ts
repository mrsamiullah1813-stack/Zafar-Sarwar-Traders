import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
let rawUrl = (
  env.VITE_SUPABASE_URL ||
  env.SUPABASE_URL ||
  env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).trim();

let rawKey = (
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.SUPABASE_KEY ||
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

if (isSupabaseConfigured) {
  activeClient = createSupabaseInstance(rawUrl, rawKey, true);
  console.log('✅ Supabase client initialized from build environment variables:', rawUrl);
} else {
  activeClient = createSupabaseInstance(dummyUrl, dummyKey, false);
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
      // 1. Check if safe cached credentials exist in sessionStorage
      try {
        const cached = sessionStorage.getItem('zst_sb_config_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.url && parsed?.anonKey && !isPlaceholderUrl(parsed.url) && !isPlaceholderKey(parsed.anonKey)) {
            const cleanUrl = normalizeSupabaseUrl(parsed.url);
            activeClient = createSupabaseInstance(cleanUrl, parsed.anonKey, true);
            isSupabaseConfigured = true;
            console.log('✅ Supabase restored from runtime session cache:', cleanUrl);
            return true;
          }
        }
      } catch {}

      // 2. Fetch server-provided public config endpoint (which accesses Hostinger/Cloud Run process.env)
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
            console.log('✅ Supabase successfully connected via runtime server configuration:', cleanUrl);
            return true;
          }
        }
      }
    } catch (e) {
      console.warn('Runtime Supabase config check skipped or server unreachable:', e);
    }
    return isSupabaseConfigured;
  })();

  return runtimeInitPromise;
}


