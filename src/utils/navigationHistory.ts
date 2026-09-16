/**
 * Multi-Page Navigation & History Manager
 * Supports:
 * - Proper canonical routes: /, /store, /products, /categories, /category/:slug, /product/:slug, /brands, /brand/:slug, /smart-tools, /delivery, /about, /contact
 * - Direct URL opening & browser refresh without 404s
 * - Android native back button, swipe gestures & browser back/forward buttons
 * - Preserves query parameters (UTM, filters, cart, checkout)
 */

export interface NavigationState {
  zst_app_state: true;
  depth: number;
  view:
    | 'home'
    | 'store'
    | 'products'
    | 'categories'
    | 'category'
    | 'product'
    | 'brands'
    | 'brand'
    | 'smart-tools'
    | 'delivery'
    | 'about'
    | 'contact'
    | 'product-variant'
    | 'product-media'
    | 'cart'
    | 'checkout'
    | 'search'
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
  pathname?: string;
  categoryId?: string;
  categorySlug?: string;
  productId?: string;
  productSlug?: string;
  variantId?: string;
  variantName?: string;
  brandId?: string;
  brandSlug?: string;
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
export function notifyListeners(state: NavigationState) {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.error('[NavigationHistory] Error in listener:', err);
    }
  });
}

/**
 * Parse pathname into view and entity slugs
 */
export function parsePathname(pathname: string): {
  view: NavigationState['view'];
  productSlug?: string;
  categorySlug?: string;
  brandSlug?: string;
} {
  const cleanPath = (pathname || '/').replace(/\/+$/, '') || '/';
  
  if (cleanPath === '/' || cleanPath === '') return { view: 'home' };
  if (cleanPath === '/store') return { view: 'store' };
  if (cleanPath === '/products') return { view: 'products' };
  if (cleanPath === '/categories') return { view: 'categories' };
  if (cleanPath.startsWith('/category/')) {
    const slug = cleanPath.slice('/category/'.length);
    return { view: 'category', categorySlug: decodeURIComponent(slug) };
  }
  if (cleanPath.startsWith('/product/')) {
    const slug = cleanPath.slice('/product/'.length);
    return { view: 'product', productSlug: decodeURIComponent(slug) };
  }
  if (cleanPath === '/brands') return { view: 'brands' };
  if (cleanPath.startsWith('/brand/')) {
    const slug = cleanPath.slice('/brand/'.length);
    return { view: 'brand', brandSlug: decodeURIComponent(slug) };
  }
  if (cleanPath === '/smart-tools' || cleanPath === '/tools') return { view: 'smart-tools' };
  if (cleanPath === '/delivery' || cleanPath === '/delivery-areas') return { view: 'delivery' };
  if (cleanPath === '/about') return { view: 'about' };
  if (cleanPath === '/contact') return { view: 'contact' };

  return { view: 'home' };
}

/**
 * Helper to build updated URL query string while preserving existing/unrelated query parameters (e.g. UTM tracking)
 */
export function buildPreservedUrl(
  updates: Record<string, string | null>,
  targetPath?: string
): string {
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
  const basePath = targetPath !== undefined ? targetPath : window.location.pathname;
  return `${basePath}${queryStr ? `?${queryStr}` : ''}${window.location.hash || ''}`;
}

/**
 * Parse current window location into a NavigationState
 */
export function parseCurrentLocation(): NavigationState {
  if (typeof window === 'undefined') {
    return {
      zst_app_state: true,
      depth: 0,
      view: 'home',
      timestamp: Date.now()
    };
  }

  const pathname = window.location.pathname;
  const pathInfo = parsePathname(pathname);
  const params = new URLSearchParams(window.location.search);

  // Backward-compatibility fallback checks for legacy query params
  const prodId = params.get('product') || pathInfo.productSlug;
  const catId = params.get('category') || pathInfo.categorySlug;
  const brandId = params.get('brand') || pathInfo.brandSlug;
  const page = params.get('page');
  const toolId = params.get('tool');
  const search = params.get('search') === 'open';
  const cart = params.get('cart') === 'open';
  const checkout = params.get('checkout') || undefined;

  let activeView = pathInfo.view;
  if (checkout) activeView = 'checkout';
  else if (cart) activeView = 'cart';
  else if (search) activeView = 'search';
  else if (page === 'delivery-areas' && activeView === 'home') activeView = 'delivery';
  else if (prodId && activeView === 'home') activeView = 'product';
  else if (catId && catId !== 'all' && activeView === 'home') activeView = 'category';
  else if (brandId && activeView === 'home') activeView = 'brand';
  else if (toolId && activeView === 'home') activeView = 'smart-tools';

  return {
    zst_app_state: true,
    depth: currentNavigationDepth,
    view: activeView,
    pathname,
    categoryId: catId || undefined,
    categorySlug: pathInfo.categorySlug || catId || undefined,
    productId: prodId || undefined,
    productSlug: pathInfo.productSlug || prodId || undefined,
    brandId: brandId || undefined,
    brandSlug: pathInfo.brandSlug || brandId || undefined,
    toolId: toolId || undefined,
    checkoutStep: checkout,
    timestamp: Date.now()
  };
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

  const parsed = parseCurrentLocation();
  const currentState = window.history.state as NavigationState | null;

  if (currentState && currentState.zst_app_state && typeof currentState.depth === 'number') {
    currentNavigationDepth = currentState.depth;
    return { ...currentState, view: parsed.view, pathname: window.location.pathname };
  }

  currentNavigationDepth = 0;
  window.history.replaceState(parsed, '', window.location.href);
  return parsed;
}

/**
 * Push a new navigation state to browser history
 */
export function pushNavigationState(
  view: NavigationState['view'],
  data: Partial<Omit<NavigationState, 'zst_app_state' | 'depth' | 'view' | 'timestamp'>> = {},
  urlParamsToUpdate: Record<string, string | null> = {},
  targetPathname?: string
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
    pathname: targetPathname || window.location.pathname,
    ...data,
    timestamp: Date.now()
  };

  const newUrl = buildPreservedUrl(urlParamsToUpdate, targetPathname);
  isInternalNavigation = true;
  window.history.pushState(newState, '', newUrl);
  isInternalNavigation = false;

  return newState;
}

/**
 * Replace current navigation state
 */
export function replaceNavigationState(
  view: NavigationState['view'],
  data: Partial<Omit<NavigationState, 'zst_app_state' | 'depth' | 'view' | 'timestamp'>> = {},
  urlParamsToUpdate: Record<string, string | null> = {},
  targetPathname?: string
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
    pathname: targetPathname || window.location.pathname,
    ...data,
    timestamp: Date.now()
  };

  const newUrl = buildPreservedUrl(urlParamsToUpdate, targetPathname);
  window.history.replaceState(newState, '', newUrl);
  return newState;
}

/**
 * Navigate directly to a specific URL path with full browser history support
 */
export function navigateTo(
  path: string,
  extraData: Partial<Omit<NavigationState, 'zst_app_state' | 'depth' | 'view' | 'timestamp'>> = {}
): NavigationState {
  if (typeof window === 'undefined') {
    return {
      zst_app_state: true,
      depth: 0,
      view: 'home',
      timestamp: Date.now()
    };
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const pathInfo = parsePathname(cleanPath);
  currentNavigationDepth += 1;

  const newState: NavigationState = {
    zst_app_state: true,
    depth: currentNavigationDepth,
    view: pathInfo.view,
    pathname: cleanPath,
    productSlug: pathInfo.productSlug,
    categorySlug: pathInfo.categorySlug,
    brandSlug: pathInfo.brandSlug,
    ...extraData,
    timestamp: Date.now()
  };

  isInternalNavigation = true;
  window.history.pushState(newState, '', cleanPath);
  isInternalNavigation = false;

  notifyListeners(newState);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  return newState;
}

/**
 * Safely handle navigation back from modals and internal states
 */
export function navigateBackSafe(
  fallbackAction: () => void,
  urlCleanups: Record<string, string | null> = {}
) {
  if (typeof window === 'undefined') {
    fallbackAction();
    return;
  }

  // Always invoke the local fallback action immediately so UI updates without lag
  try {
    fallbackAction();
  } catch (err) {
    console.error('Error executing navigation fallback action:', err);
  }

  if (currentNavigationDepth > 0) {
    window.history.back();
  } else {
    const cleanedUrl = buildPreservedUrl({
      checkout: null,
      cart: null,
      page: null,
      product: null,
      variant: null,
      search: null,
      ...urlCleanups
    });

    const parsed = parseCurrentLocation();
    const safeState: NavigationState = {
      zst_app_state: true,
      depth: 0,
      view: parsed.view,
      pathname: window.location.pathname,
      timestamp: Date.now()
    };

    window.history.replaceState(safeState, '', cleanedUrl);
  }
}

/**
 * Safely navigates back from a dedicated product page or detail view:
 * - Uses browser history if available within this session
 * - Otherwise navigates cleanly to the provided fallback path or '/store'
 */
export function navigateBackFromProduct(
  fallbackPath: string = '/store',
  onNavigate?: (path: string) => void
) {
  if (typeof window === 'undefined') {
    if (onNavigate) onNavigate(fallbackPath);
    return;
  }

  const hasHistory = currentNavigationDepth > 0 || (window.history.length > 1 && window.history.state?.zst_app_state);

  if (hasHistory) {
    window.history.back();
  } else {
    if (onNavigate) {
      onNavigate(fallbackPath);
    } else {
      navigateTo(fallbackPath);
    }
  }
}

/**
 * Check if the user is currently at an internal sub-route/modal
 */
export function hasInternalNavigationHistory(): boolean {
  return currentNavigationDepth > 0;
}

/**
 * Reset navigation history and URL cleanly to Home Page (/)
 */
export function resetToHome() {
  if (typeof window === 'undefined') return;
  currentNavigationDepth = 0;
  const homeState: NavigationState = {
    zst_app_state: true,
    depth: 0,
    view: 'home',
    pathname: '/',
    categoryId: 'all',
    timestamp: Date.now()
  };

  window.history.pushState(homeState, '', '/');
  notifyListeners(homeState);
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
      currentNavigationDepth = 0;
      const parsed = parseCurrentLocation();
      notifyListeners(parsed);
    }
  });
}
