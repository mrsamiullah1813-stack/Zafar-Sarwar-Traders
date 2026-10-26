import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getVisitorId, getBestVisitorIdentity, getVisitorToken, setVisitorToken } from '../utils/visitorIdentity';

export interface ProductLikesData {
  count: number;
  isLiked: boolean;
  label: string;
  isLoading: boolean;
}

// In-memory global store
const likesCountMap = new Map<string, number>();
const userLikedSet = new Set<string>();
const listeners = new Set<() => void>();
const inFlightToggles = new Set<string>();

let isInitialFetchDone = false;
let initialFetchPromise: Promise<void> | null = null;

function notifySubscribers() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.warn('[ProductLikesService] Subscriber notification error:', err);
    }
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

/**
 * Format total like count per specification:
 * - 0: "0 Likes" or "No likes yet"
 * - 1: "1 Like"
 * - N: "N Likes"
 */
export function formatLikesLabel(
  count: number, 
  zeroText: '0 Likes' | 'No likes yet' = '0 Likes'
): string {
  if (count <= 0) return zeroText;
  if (count === 1) return '1 Like';
  return `${count.toLocaleString('en-PK')} Likes`;
}

/**
 * Fetch all likes or batch of likes from Database / Server proxy
 */
export async function loadProductLikesData(forceRefresh = false): Promise<void> {
  if (isInitialFetchDone && !forceRefresh) return;
  if (initialFetchPromise && !forceRefresh) return initialFetchPromise;

  initialFetchPromise = (async () => {
    const visitorId = getVisitorId();

    // 1. Try server proxy endpoint first
    try {
      const vToken = getVisitorToken();
      const headers: Record<string, string> = {};
      if (vToken) {
        headers['x-visitor-token'] = vToken;
      }

      const res = await fetch(`/api/likes?visitorId=${encodeURIComponent(visitorId)}`, { headers });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && data.success && data.counts) {
          if (data.visitorToken) {
            setVisitorToken(data.visitorToken);
          }

          likesCountMap.clear();
          userLikedSet.clear();

          Object.entries(data.counts).forEach(([prodId, cnt]) => {
            likesCountMap.set(String(prodId), Number(cnt) || 0);
          });

          if (Array.isArray(data.userLikes)) {
            data.userLikes.forEach((prodId: string) => {
              userLikedSet.add(String(prodId));
            });
          }

          isInitialFetchDone = true;
          notifySubscribers();
          return;
        }
      }
    } catch {
      // Fall through to Direct Supabase SDK
    }

    // 2. Direct Supabase SDK Fallback
    if (isSupabaseConfigured && supabase) {
      try {
        // Query dedicated product_likes table
        const { data: tableLikes, error: tableErr } = await supabase
          .from('product_likes')
          .select('product_id, visitor_id');

        if (!tableErr && Array.isArray(tableLikes)) {
          likesCountMap.clear();
          userLikedSet.clear();

          tableLikes.forEach((row) => {
            const pId = String(row.product_id);
            const currentCount = likesCountMap.get(pId) || 0;
            likesCountMap.set(pId, currentCount + 1);

            if (row.visitor_id === visitorId) {
              userLikedSet.add(pId);
            }
          });

          isInitialFetchDone = true;
          notifySubscribers();
          return;
        }
      } catch {
        // Fallback to site_settings table
      }

      // 3. Fallback: site_settings row 'product_likes'
      try {
        const { data: settings } = await supabase
          .from('site_settings')
          .select('theme_settings')
          .eq('id', 'product_likes')
          .maybeSingle();

        const likesList = Array.isArray(settings?.theme_settings?.likes)
          ? settings.theme_settings.likes
          : [];

        likesCountMap.clear();
        userLikedSet.clear();

        likesList.forEach((row: any) => {
          const pId = String(row.productId || row.product_id);
          const currentCount = likesCountMap.get(pId) || 0;
          likesCountMap.set(pId, currentCount + 1);

          if (row.visitorId === visitorId || row.visitor_id === visitorId) {
            userLikedSet.add(pId);
          }
        });

        isInitialFetchDone = true;
        notifySubscribers();
      } catch (err) {
        console.warn('[ProductLikesService] Failed to load likes from Supabase:', err);
      }
    }
  })().finally(() => {
    initialFetchPromise = null;
  });

  return initialFetchPromise;
}

/**
 * Toggles Like / Unlike for a product.
 * - Prevents duplicate/inflated clicks with inFlight mutex.
 * - Optimistically updates UI immediately.
 * - Persists permanently to database (product_likes table + site_settings).
 * - Dispatches 'product-likes-updated' event.
 */
export async function toggleProductLike(productId: string): Promise<{
  success: boolean;
  isLiked: boolean;
  count: number;
}> {
  if (!productId || typeof productId !== 'string') {
    return { success: false, isLiked: false, count: 0 };
  }

  const cleanProductId = productId.trim();
  if (inFlightToggles.has(cleanProductId)) {
    // Prevent duplicate rapid click race condition
    const currentLiked = userLikedSet.has(cleanProductId);
    const currentCount = likesCountMap.get(cleanProductId) || 0;
    return { success: true, isLiked: currentLiked, count: currentCount };
  }

  inFlightToggles.add(cleanProductId);

  const visitorId = getVisitorId();
  const previouslyLiked = userLikedSet.has(cleanProductId);
  const previousCount = likesCountMap.get(cleanProductId) || 0;

  // 1. Optimistic Update
  const nextLiked = !previouslyLiked;
  const nextCount = Math.max(0, previousCount + (nextLiked ? 1 : -1));

  if (nextLiked) {
    userLikedSet.add(cleanProductId);
  } else {
    userLikedSet.delete(cleanProductId);
  }
  likesCountMap.set(cleanProductId, nextCount);
  notifySubscribers();

  try {
    const vToken = getVisitorToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (vToken) {
      headers['x-visitor-token'] = vToken;
    }

    // Attach user auth token if logged in
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authSession } = await supabase.auth.getSession();
        if (authSession?.session?.access_token) {
          headers['Authorization'] = `Bearer ${authSession.session.access_token}`;
        }
      } catch {}
    }

    // 2. Call Server API proxy
    const res = await fetch('/api/likes/toggle', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        productId: cleanProductId,
        visitorId,
        visitorToken: vToken
      })
    });

    if (res.ok) {
      const data = await res.json().catch(() => null);
      if (data && data.success) {
        if (data.visitorToken) {
          setVisitorToken(data.visitorToken);
        }

        // Sync with verified server count and state
        const serverLiked = typeof data.liked === 'boolean' ? data.liked : nextLiked;
        const serverCount = typeof data.count === 'number' ? data.count : nextCount;

        likesCountMap.set(cleanProductId, serverCount);
        if (serverLiked) {
          userLikedSet.add(cleanProductId);
        } else {
          userLikedSet.delete(cleanProductId);
        }

        notifySubscribers();
        dispatchUpdateEvent(cleanProductId, serverLiked, serverCount);
        return { success: true, isLiked: serverLiked, count: serverCount };
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    dispatchUpdateEvent(cleanProductId, nextLiked, nextCount);
    return { success: true, isLiked: nextLiked, count: nextCount };
  } catch (err) {
    console.error('[ProductLikesService] Toggle error, reverting optimistic update:', err);
    // Rollback optimistic update
    if (previouslyLiked) {
      userLikedSet.add(cleanProductId);
    } else {
      userLikedSet.delete(cleanProductId);
    }
    likesCountMap.set(cleanProductId, previousCount);
    notifySubscribers();
    return { success: false, isLiked: previouslyLiked, count: previousCount };
  } finally {
    inFlightToggles.delete(cleanProductId);
  }
}

function dispatchUpdateEvent(productId: string, isLiked: boolean, count: number) {
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('product-likes-updated', {
          detail: { productId, isLiked, count }
        })
      );
    } catch {}
  }
}

// Initial automatic load
if (typeof window !== 'undefined') {
  loadProductLikesData();

  // Listen to cross-tab or custom events
  window.addEventListener('product-likes-updated', ((e: CustomEvent) => {
    if (e.detail?.productId) {
      const pId = String(e.detail.productId);
      if (typeof e.detail.count === 'number') {
        likesCountMap.set(pId, e.detail.count);
      }
      if (typeof e.detail.isLiked === 'boolean') {
        if (e.detail.isLiked) userLikedSet.add(pId);
        else userLikedSet.delete(pId);
      }
      notifySubscribers();
    }
  }) as EventListener);
}

/**
 * React Hook for consuming Product Likes in any component.
 * Automatically stays synchronized across all cards and pages.
 */
export function useProductLikes(
  productId: string | undefined,
  zeroText: '0 Likes' | 'No likes yet' = '0 Likes'
): ProductLikesData & { toggle: (e?: React.MouseEvent) => Promise<void> } {
  const cleanId = productId ? String(productId).trim() : '';

  // Synchronous subscription to reactive in-memory store
  const isLiked = useSyncExternalStore(
    subscribe,
    () => (cleanId ? userLikedSet.has(cleanId) : false),
    () => false
  );

  const count = useSyncExternalStore(
    subscribe,
    () => (cleanId ? (likesCountMap.get(cleanId) || 0) : 0),
    () => 0
  );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isInitialFetchDone) {
      loadProductLikesData();
    }
  }, []);

  const toggle = useCallback(
    async (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      if (!cleanId || isLoading) return;

      setIsLoading(true);
      try {
        await toggleProductLike(cleanId);
      } finally {
        setIsLoading(false);
      }
    },
    [cleanId, isLoading]
  );

  const label = formatLikesLabel(count, zeroText);

  return {
    count,
    isLiked,
    label,
    isLoading,
    toggle
  };
}
