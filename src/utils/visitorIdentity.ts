/**
 * Visitor Identity Management for Zafar Sarwar Traders
 * 
 * Provides a reliable, persistent identifier for customer interactions (like/unlike votes).
 * - If customer is authenticated in Supabase, returns their authenticated user ID.
 * - Otherwise, generates and persists a cryptographically secure anonymous visitor UUID
 *   stored in browser localStorage.
 */

const VISITOR_ID_STORAGE_KEY = 'zst_visitor_id';
const VISITOR_TOKEN_STORAGE_KEY = 'zst_visitor_token';

function generateSecureVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `vst-${crypto.randomUUID()}`;
  }
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 12);
  const secondRandom = Math.random().toString(36).substring(2, 8);
  return `vst-${timestamp}-${randomPart}-${secondRandom}`;
}

/**
 * Synchronously retrieves or initializes the persistent visitor UUID from localStorage.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') {
    return 'server-ssr-visitor';
  }

  try {
    let visitorId = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (!visitorId || typeof visitorId !== 'string' || visitorId.trim().length < 8) {
      visitorId = generateSecureVisitorId();
      window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    }
    return visitorId.trim();
  } catch {
    return 'ephemeral-browser-visitor';
  }
}

/**
 * Retrieve the cryptographically signed visitor token issued by the server.
 */
export function getVisitorToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(VISITOR_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store the cryptographically signed visitor token issued by the server.
 */
export function setVisitorToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (token && typeof token === 'string') {
      window.localStorage.setItem(VISITOR_TOKEN_STORAGE_KEY, token.trim());
    }
  } catch {}
}

/**
 * Asynchronously retrieves the best identity available:
 * 1. Authenticated Supabase User ID (if logged in)
 * 2. Persistent Anonymous Visitor UUID from localStorage
 */
export async function getBestVisitorIdentity(supabaseClient?: any): Promise<string> {
  if (supabaseClient && typeof supabaseClient.auth?.getSession === 'function') {
    try {
      const { data } = await supabaseClient.auth.getSession();
      if (data?.session?.user?.id) {
        return `usr-${data.session.user.id}`;
      }
    } catch {
      // Fallback to anonymous visitor
    }
  }
  return getVisitorId();
}
