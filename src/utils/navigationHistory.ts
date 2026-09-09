/**
 * Navigation History Manager for Android Native Back Button, Back Gesture & Browser Navigation
 * 
 * Supports:
 * - Android 3-button navigation (Hardware / On-screen Back button)
 * - Android edge-swipe gesture navigation
 * - Browser Back / Forward buttons
 * - In-website Back buttons and Close (X) buttons
 * - Deep linking with preserved query parameters
 * - Safe fallback when no internal history exists
 */

export interface NavigationState {
  zst_app_state: true;
  depth: number;
  view:
    | 'home'
    | 'category'
    | 'product'
    | 'product-variant'
    | 'product-media'
    | 'cart'
    | 'checkout'
    | 'search'
    | 'brand'
    | 'tools'
    | 'builder'
    | 'tracking'
    | 'delivery-areas'
    | 'delivery-checker'
    | 'theme'
    | 'ai-consultant'
    | 'admin-login'
    | 'admin-dashboard'
    | 'admin-product'
    | 'config';
  categoryId?: string;
  productId?: string;
  variantId?: string;
  variantName?: string;
  brandId?: string;
  toolId?: string;
  checkoutStep?: string;
  fromSearch?: boolean;
  fromCart?: boolean;
  timestamp?: number;
}

let currentNavigationDepth = 0;
let isInternalNavigation = false;

type NavigationChangeListener = (state: NavigationState) => void;
const listeners: Set<NavigationChangeListener> = new Set();

/**
 * Register a listener for popstate navigation changes
 */
export function addNavigationListener(listener: NavigationChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notify all registered navigation listeners
 */
function notifyListeners(state: NavigationState) {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.error('[NavigationHistory] Error in listener:', err);
    }
  });
}

/**
 * Helper to build updated URL query string while preserving existing/unrelated query parameters (e.g. UTM tracking)
 */
export function buildPreservedUrl(updates: Record<string, string | null>): string {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
  }

  const queryStr = params.toString();
  return `${window.location.pathname}${queryStr ? `?${queryStr}` : ''}${window.location.hash || ''}`;
}

/**
 * Initialize history on application mount.
 * Inspects existing URL parameters and establishes base history state.
 */
export function initNavigationHistory(initialCategory: string = 'all'): NavigationState {
  if (typeof window === 'undefined') {
    return {
      zst_app_state: true,
      depth: 0,
      view: 'home',
      categoryId: initialCategory,
      timestamp: Date.now()
    };
  }

  const currentState = window.history.state as NavigationState | null;
  if (currentState && currentState.zst_app_state && typeof currentState.depth === 'number') {
    currentNavigationDepth = currentState.depth;
    return currentState;
  }

  // Parse existing URL parameters so deep links are respected without reloading
  const params = new URLSearchParams(window.location.search);
  const prodId = params.get('product') || undefined;
  const catId = params.get('category') || (initialCategory !== 'all' ? initialCategory : undefined);
  const page = params.get('page') || undefined;
  const search = params.get('search') === 'open';
  const cart = params.get('cart') === 'open';
  const checkout = params.get('checkout') || undefined;
  const brandId = params.get('brand') || undefined;
  const toolId = params.get('tool') || undefined;

  let initialView: NavigationState['view'] = 'home';
  if (page === 'delivery-areas') initialView = 'delivery-areas';
  else if (prodId) initialView = 'product';
  else if (catId && catId !== 'all') initialView = 'category';
  else if (checkout) initialView = 'checkout';
  else if (cart) initialView = 'cart';
  else if (search) initialView = 'search';
  else if (brandId) initialView = 'brand';
  else if (toolId) initialView = 'tools';

  const baseState: NavigationState = {
    zst_app_state: true,
    depth: 0,
    view: initialView,
    categoryId: catId || 'all',
    productId: prodId,
    brandId,
    toolId,
    checkoutStep: checkout,
    timestamp: Date.now()
  };

  currentNavigationDepth = 0;
  window.history.replaceState(baseState, '', window.location.href);
  return baseState;
}

/**
 * Push a new navigation state to browser history
 */
export function pushNavigationState(
  view: NavigationState['view'],
  data: Partial<Omit<NavigationState, 'zst_app_state' | 'depth' | 'view' | 'timestamp'>> = {},
  urlParamsToUpdate: Record<string, string | null> = {}
): NavigationState {
  if (typeof window === 'undefined') {
    return {
      zst_app_state: true,
      depth: 0,
      view,
      ...data,
      timestamp: Date.now()
    };
  }

  currentNavigationDepth += 1;
  const newState: NavigationState = {
    zst_app_state: true,
    depth: currentNavigationDepth,
    view,
    ...data,
    timestamp: Date.now()
  };

  const newUrl = buildPreservedUrl(urlParamsToUpdate);
  isInternalNavigation = true;
  window.history.pushState(newState, '', newUrl);
  isInternalNavigation = false;

  return newState;
}

/**
 * Replace current navigation state (e.g. for step updates without adding to history depth)
 */
export function replaceNavigationState(
  view: NavigationState['view'],
  data: Partial<Omit<NavigationState, 'zst_app_state' | 'depth' | 'view' | 'timestamp'>> = {},
  urlParamsToUpdate: Record<string, string | null> = {}
): NavigationState {
  if (typeof window === 'undefined') {
    return {
      zst_app_state: true,
      depth: currentNavigationDepth,
      view,
      ...data,
      timestamp: Date.now()
    };
  }

  const newState: NavigationState = {
    zst_app_state: true,
    depth: currentNavigationDepth,
    view,
    ...data,
    timestamp: Date.now()
  };

  const newUrl = buildPreservedUrl(urlParamsToUpdate);
  window.history.replaceState(newState, '', newUrl);
  return newState;
}

/**
 * Safely handle navigation back:
 * - If user has internal history depth > 0, invokes window.history.back() to pop smoothly.
 * - If no internal history exists (e.g. initial direct link), executes fallback action safely without leaving the site.
 */
export function navigateBackSafe(fallbackAction: () => void) {
  if (typeof window === 'undefined') {
    fallbackAction();
    return;
  }

  if (currentNavigationDepth > 0) {
    window.history.back();
  } else {
    fallbackAction();
  }
}

/**
 * Check if the user is currently at an internal sub-route/modal (depth > 0)
 */
export function hasInternalNavigationHistory(): boolean {
  return currentNavigationDepth > 0;
}

/**
 * Global popstate listener setup
 */
if (typeof window !== 'undefined') {
  window.addEventListener('popstate', (event: PopStateEvent) => {
    const state = event.state as NavigationState | null;

    if (state && state.zst_app_state && typeof state.depth === 'number') {
      currentNavigationDepth = state.depth;
      notifyListeners(state);
    } else {
      // Returned to root or outside state
      currentNavigationDepth = 0;
      const fallbackState: NavigationState = {
        zst_app_state: true,
        depth: 0,
        view: 'home',
        categoryId: 'all',
        timestamp: Date.now()
      };
      notifyListeners(fallbackState);
    }
  });
}
