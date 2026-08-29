import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe static access to Vite environment variables (statically replaced by Vite during build)
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env || {} : {};
const winEnv = typeof window !== 'undefined' && (window as any).__ENV__ ? (window as any).__ENV__ : {};

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

/**
 * Normalizes any provided Supabase URL to strictly the root origin (https://<project-ref>.supabase.co)
 * Strips all pathnames, trailing slashes, duplicate /rest/v1, /api, or dashboard paths.
 */
export function normalizeSupabaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();

  // Handle accidental dashboard URLs (e.g., https://supabase.com/dashboard/project/<ref> or https://app.supabase.com/project/<ref>)
  const dashMatch = cleaned.match(/supabase\.com\/(?:dashboard\/)?project\/([a-zA-Z0-9_-]+)/i);
  if (dashMatch && dashMatch[1]) {
    return `https://${dashMatch[1]}.supabase.co`;
  }

  // Ensure protocol
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }

  try {
    const parsed = new URL(cleaned);
    let host = parsed.hostname.toLowerCase();

    // If host doesn't have dots and looks like a raw project ref (e.g. 'abcdefghijklm')
    if (!host.includes('.')) {
      host = `${host}.supabase.co`;
    }

    // Preserve non-standard port only if provided (for local supabase dev)
    const portPart = (parsed.port && parsed.port !== '80' && parsed.port !== '443') ? `:${parsed.port}` : '';
    const protocol = parsed.protocol || 'https:';

    // Strictly return protocol://host (NO trailing slash, NO pathname)
    return `${protocol}//${host}${portPart}`;
  } catch {
    // Fallback regex strip
    return cleaned
      .replace(/\/+$/, '')
      .replace(/\/rest\/v1.*$/i, '')
      .replace(/\/api.*$/i, '')
      .replace(/\/+$/, '');
  }
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

// Extract safe hostname for diagnostic logging (never log keys or tokens)
export function getSafeHost(url: string): string {
  try {
    if (!url || isPlaceholderUrl(url)) return 'Not configured (placeholder)';
    const parsed = new URL(url);
    return parsed.host;
  } catch {
    return 'Invalid URL format';
  }
}

function createSupabaseInstance(url: string, key: string, isReal: boolean): SupabaseClient {
  const strictBaseUrl = normalizeSupabaseUrl(url);
  const safeFetch = typeof window !== 'undefined' && window.fetch 
    ? (input: any, init?: any) => window.fetch(input, init)
    : (typeof fetch !== 'undefined' ? (input: any, init?: any) => fetch(input, init) : undefined);

  try {
    return createClient(strictBaseUrl, key, {
      auth: {
        persistSession: isReal,
        autoRefreshToken: isReal,
        detectSessionInUrl: isReal,
      },
      global: {
        fetch: safeFetch,
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
      global: {
        fetch: safeFetch,
      },
    });
  }
}

if (isSupabaseConfigured) {
  activeClient = createSupabaseInstance(rawUrl, rawKey, true);
  console.log(`[Supabase Direct SDK] Initialized successfully with Base URL: ${rawUrl} (Host: ${getSafeHost(rawUrl)})`);
} else {
  activeClient = createSupabaseInstance(dummyUrl, dummyKey, false);
  console.warn(`[Supabase Direct SDK] Initialization PENDING | Base URL: ${rawUrl || 'None'} | Key Present: ${Boolean(rawKey)}`);
}

// Proxied supabase client that dynamically routes all calls to activeClient without leaking Window receiver
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    if (!activeClient) return undefined;
    const value = (activeClient as any)[prop];
    if (typeof value === 'function') {
      return value.bind(activeClient);
    }
    return value;
  },
  set(_target, prop, value) {
    if (activeClient) {
      try {
        (activeClient as any)[prop] = value;
      } catch {}
    }
    return true;
  },
  has(_target, prop) {
    return Boolean(activeClient && prop in activeClient);
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
            console.log(`[Supabase Direct SDK] Restored from runtime storage cache with Base URL: ${cleanUrl} (Host: ${getSafeHost(cleanUrl)})`);
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
            console.log(`[Supabase Direct SDK] Connected via window runtime config with Base URL: ${cleanUrl} (Host: ${getSafeHost(cleanUrl)})`);
            return true;
          }
        }
      } catch {}

      // 3. Fallback: server config endpoint if available (non-fatal if 404 on static hosting)
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
              console.log(`[Supabase Direct SDK] Connected via server configuration with Base URL: ${cleanUrl} (Host: ${getSafeHost(cleanUrl)})`);
              return true;
            }
          }
        }
      } catch {}
    } catch (e) {
      // Silent catch
    }
    return isSupabaseConfigured;
  })();

  return runtimeInitPromise;
}
