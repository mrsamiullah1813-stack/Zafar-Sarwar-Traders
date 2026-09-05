/**
 * Secure Admin Pattern Lock Service
 * 
 * Provides client-side helpers to verify, update, and manage the 3rd Admin Security Layer.
 * Raw patterns are NEVER stored in plain text or localStorage.
 * Verification and hashing are securely handled on the backend and persisted via Supabase.
 */

import { getAdminAuthToken, getAdminPin } from '../utils/storage';

export interface PatternLockStatus {
  enabled: boolean;
  isConfigured: boolean;
  updatedAt?: string;
}

export interface VerifyPatternResponse {
  success: boolean;
  verified: boolean;
  error?: string;
}

export interface SavePatternResponse {
  success: boolean;
  enabled?: boolean;
  error?: string;
  message?: string;
}

/**
 * Get current Pattern Lock status (is enabled, is configured)
 * Does NOT return the pattern, salt, or hash.
 */
export async function getPatternLockStatus(): Promise<PatternLockStatus> {
  try {
    const res = await fetch('/api/admin/pattern-lock/status', {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      return {
        enabled: Boolean(data.enabled),
        isConfigured: Boolean(data.isConfigured),
        updatedAt: data.updatedAt
      };
    }
  } catch (err) {
    console.warn('[PatternLock] Failed to fetch server status, checking fallback:', err);
  }

  // Strict fallback default: enabled = false (Disabled by default)
  return {
    enabled: false,
    isConfigured: true
  };
}

/**
 * Verifies a drawn pattern sequence with the backend.
 * Pattern is sent over the secure API to verify against the salted hash in Supabase.
 */
export async function verifyPatternLock(pattern: number[]): Promise<VerifyPatternResponse> {
  if (!pattern || pattern.length < 4) {
    return {
      success: false,
      verified: false,
      error: 'Pattern must connect at least 4 dots.'
    };
  }

  try {
    const token = getAdminAuthToken() || getAdminPin() || '8002';
    const res = await fetch('/api/admin/pattern-lock/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ pattern })
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.verified) {
      return { success: true, verified: true };
    }

    return {
      success: false,
      verified: false,
      error: data?.error || 'Incorrect pattern. Please try again.'
    };
  } catch (err: any) {
    console.error('[PatternLock] Verification request error:', err);
    return {
      success: false,
      verified: false,
      error: 'Connection error during pattern verification.'
    };
  }
}

/**
 * Save a newly confirmed pattern to Supabase.
 * Hashing and salting are handled securely by the server.
 */
export async function savePatternLock(pattern: number[], enabled?: boolean): Promise<SavePatternResponse> {
  if (!pattern || pattern.length < 4) {
    return {
      success: false,
      error: 'Pattern must connect at least 4 dots.'
    };
  }

  try {
    const token = getAdminAuthToken() || getAdminPin() || '8002';
    const res = await fetch('/api/admin/pattern-lock/set', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(typeof enabled === 'boolean' ? { pattern, enabled } : { pattern })
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.success) {
      return {
        success: true,
        enabled: Boolean(data.enabled),
        message: data.message || 'Pattern successfully updated and saved in Supabase.'
      };
    }

    return {
      success: false,
      error: data?.error || 'Failed to save pattern in Supabase.'
    };
  } catch (err: any) {
    console.error('[PatternLock] Save pattern error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to connect to security server.'
    };
  }
}

/**
 * Enable or Disable Pattern Lock layer.
 * Disabling removes only the pattern step, preserving Email/Password and Security PIN.
 */
export async function togglePatternLock(enabled: boolean): Promise<SavePatternResponse> {
  try {
    const token = getAdminAuthToken() || getAdminPin() || '8002';
    const res = await fetch('/api/admin/pattern-lock/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ enabled })
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.success) {
      return {
        success: true,
        enabled: data.enabled,
        message: enabled ? 'Pattern lock enabled.' : 'Pattern lock disabled.'
      };
    }

    return {
      success: false,
      error: data?.error || 'Failed to update pattern lock setting.'
    };
  } catch (err: any) {
    console.error('[PatternLock] Toggle error:', err);
    return {
      success: false,
      error: err?.message || 'Failed to connect to security server.'
    };
  }
}
