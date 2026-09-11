export interface PageViewEvent {
  id: string;
  timestamp: string; // ISO string
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
  source: 'Direct' | 'Google Search' | 'WhatsApp / Referral' | 'Social Media';
  path: string;
}

export interface ProductViewEvent {
  id: string;
  productId: string;
  productName: string;
  timestamp: string;
}

export interface CategoryClickEvent {
  id: string;
  categoryId: string;
  categoryName: string;
  timestamp: string;
}

export interface ActionEvent {
  id: string;
  type: 'whatsapp' | 'call' | 'quote' | 'search' | 'download';
  label?: string;
  timestamp: string;
}

export interface AnalyticsData {
  pageViews: PageViewEvent[];
  productViews: ProductViewEvent[];
  categoryClicks: CategoryClickEvent[];
  actions: ActionEvent[];
}

const STORAGE_KEY = 'zst_visitor_analytics_v1';

// Detect Device
const getDeviceType = (): 'Desktop' | 'Mobile' | 'Tablet' => {
  if (typeof window === 'undefined') return 'Desktop';
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'Tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'Mobile';
  }
  return 'Desktop';
};

// Detect Browser
const getBrowserName = (): 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other' => {
  if (typeof window === 'undefined') return 'Chrome';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
  return 'Other';
};

// Safe capacity limits for local storage to stay well under browser quota
const MAX_PAGE_VIEWS = 200;
const MAX_PRODUCT_VIEWS = 100;
const MAX_CATEGORY_CLICKS = 100;
const MAX_ACTIONS = 100;

// Clean production zero baseline
const generateInitialAnalytics = (): AnalyticsData => {
  return { pageViews: [], productViews: [], categoryClicks: [], actions: [] };
};

// In-memory fallback if localStorage is completely disabled or full
let inMemoryAnalytics: AnalyticsData | null = null;

export const loadAnalyticsData = (): AnalyticsData => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Detect and discard legacy dummy seed data if found
          const hasLegacySeed = Array.isArray(parsed.pageViews) && parsed.pageViews.some((p: any) => p.id && String(p.id).startsWith('pv-'));
          if (!hasLegacySeed) {
            const result: AnalyticsData = {
              pageViews: Array.isArray(parsed.pageViews) ? parsed.pageViews.slice(-MAX_PAGE_VIEWS) : [],
              productViews: Array.isArray(parsed.productViews) ? parsed.productViews.slice(-MAX_PRODUCT_VIEWS) : [],
              categoryClicks: Array.isArray(parsed.categoryClicks) ? parsed.categoryClicks.slice(-MAX_CATEGORY_CLICKS) : [],
              actions: Array.isArray(parsed.actions) ? parsed.actions.slice(-MAX_ACTIONS) : [],
            };
            inMemoryAnalytics = result;
            return result;
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      }
    }
  } catch {}
  
  if (inMemoryAnalytics) {
    return inMemoryAnalytics;
  }

  const initial = generateInitialAnalytics();
  inMemoryAnalytics = initial;
  saveAnalyticsData(initial);
  return initial;
};

export const saveAnalyticsData = (data: AnalyticsData) => {
  // Prune arrays to safe boundaries
  const safeData: AnalyticsData = {
    pageViews: (data.pageViews || []).slice(-MAX_PAGE_VIEWS),
    productViews: (data.productViews || []).slice(-MAX_PRODUCT_VIEWS),
    categoryClicks: (data.categoryClicks || []).slice(-MAX_CATEGORY_CLICKS),
    actions: (data.actions || []).slice(-MAX_ACTIONS),
  };

  inMemoryAnalytics = safeData;

  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeData));
  } catch (e: any) {
    // If quota is exceeded, aggressively prune older items and retry
    try {
      const compactData: AnalyticsData = {
        pageViews: safeData.pageViews.slice(-50),
        productViews: safeData.productViews.slice(-30),
        categoryClicks: safeData.categoryClicks.slice(-30),
        actions: safeData.actions.slice(-20),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compactData));
      inMemoryAnalytics = compactData;
    } catch {
      // If still failing, keep in memory without throwing or spamming console
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }
};

// Background beacon sender with fail-soft safety
let cachedVisitorUUID: string | null = null;
export const getVisitorUUID = (): string => {
  if (cachedVisitorUUID) return cachedVisitorUUID;
  if (typeof window !== 'undefined') {
    try {
      let id = localStorage.getItem('zst_visitor_uuid');
      if (!id) {
        id = `v_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('zst_visitor_uuid', id);
      }
      cachedVisitorUUID = id;
      return id;
    } catch {}
  }
  cachedVisitorUUID = `v_anon_${Math.random().toString(36).substring(2, 8)}`;
  return cachedVisitorUUID;
};

const sendBackgroundBeacon = (payload: any) => {
  if (typeof window === 'undefined') return;
  try {
    const isAdmin = Boolean(
      localStorage.getItem('zst_admin_token') ||
      sessionStorage.getItem('zst_admin_token') ||
      (window.location && window.location.pathname && window.location.pathname.startsWith('/admin'))
    );

    const fullPayload = {
      ...payload,
      visitorId: payload.visitorId || getVisitorUUID(),
      path: payload.path || window.location.pathname,
      timestamp: Date.now(),
      isAdmin
    };
    
    // Prefer modern sendBeacon for non-blocking unload safety, fallback to fetch with keepalive
    const blob = new Blob([JSON.stringify(fullPayload)], { type: 'application/json' });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const sent = navigator.sendBeacon('/api/analytics/track', blob);
      if (sent) return;
    }
    
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload),
      keepalive: true
    }).catch(() => {});
  } catch {}
};

// Global background tracking singleton
let isTrackingInitialized = false;
let heartbeatTimer: any = null;

export const startLiveVisitorTracking = () => {
  if (isTrackingInitialized || typeof window === 'undefined') return;
  isTrackingInitialized = true;

  // 1. Initial Pageview Beacon
  sendBackgroundBeacon({
    type: 'pageview',
    device: getDeviceType(),
    browser: getBrowserName(),
    source: 'Direct'
  });

  // 2. Periodic Heartbeat Beacon every 25 seconds while tab is open
  heartbeatTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      sendBackgroundBeacon({
        type: 'heartbeat',
        device: getDeviceType(),
        browser: getBrowserName()
      });
    }
  }, 25000);

  // 3. Non-blocking Clickstream Listener
  let lastClickTime = 0;
  window.addEventListener('click', (e: MouseEvent) => {
    try {
      const now = Date.now();
      if (now - lastClickTime < 60) return; // avoid rapid micro double-firing
      lastClickTime = now;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Check if click was on or inside a product card
      const productEl = target.closest('[data-product-id], [data-testid="product-card"], .product-card, a[href*="/product/"]') as HTMLElement | null;
      const productId = productEl?.getAttribute('data-product-id') || productEl?.dataset?.productId;
      const productName = productEl?.getAttribute('data-product-name') || productEl?.querySelector('h3, h4, .product-title')?.textContent?.trim();

      if (productId || productEl) {
        trackProductClick(productId || 'view', productName);
      } else {
        trackWebsiteClick();
      }
    } catch {}
  }, { passive: true });
};

// Trackers
export const trackPageView = (path: string = '/') => {
  try {
    const data = loadAnalyticsData();
    const newEvent: PageViewEvent = {
      id: `pv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      device: getDeviceType(),
      browser: getBrowserName(),
      source: 'Direct',
      path
    };
    data.pageViews.push(newEvent);
    if (data.pageViews.length > MAX_PAGE_VIEWS) {
      data.pageViews = data.pageViews.slice(-MAX_PAGE_VIEWS);
    }
    saveAnalyticsData(data);

    sendBackgroundBeacon({
      type: 'pageview',
      path,
      device: getDeviceType(),
      browser: getBrowserName()
    });
  } catch {}
};

export const trackWebsiteClick = () => {
  try {
    sendBackgroundBeacon({
      type: 'page_click'
    });
  } catch {}
};

export const trackProductClick = (productId: string, productName?: string) => {
  try {
    sendBackgroundBeacon({
      type: 'product_click',
      productId,
      productName
    });
  } catch {}
};

export const trackSearchQuery = (query: string) => {
  try {
    if (!query || query.trim().length < 2) return;
    const cleanQ = query.trim();
    trackAction('search', cleanQ);
    sendBackgroundBeacon({
      type: 'search',
      query: cleanQ
    });
  } catch {}
};

export const trackProductView = (productId: string, productName: string) => {
  try {
    const data = loadAnalyticsData();
    data.productViews.push({
      id: `pvp-${Date.now()}`,
      productId,
      productName,
      timestamp: new Date().toISOString()
    });
    if (data.productViews.length > MAX_PRODUCT_VIEWS) {
      data.productViews = data.productViews.slice(-MAX_PRODUCT_VIEWS);
    }
    saveAnalyticsData(data);

    sendBackgroundBeacon({
      type: 'product_view',
      productId,
      productName
    });
  } catch {}
};

export const trackCategoryClick = (categoryId: string, categoryName: string) => {
  try {
    const data = loadAnalyticsData();
    data.categoryClicks.push({
      id: `cat-${Date.now()}`,
      categoryId,
      categoryName,
      timestamp: new Date().toISOString()
    });
    if (data.categoryClicks.length > MAX_CATEGORY_CLICKS) {
      data.categoryClicks = data.categoryClicks.slice(-MAX_CATEGORY_CLICKS);
    }
    saveAnalyticsData(data);

    sendBackgroundBeacon({
      type: 'category_click',
      categoryId,
      categoryName
    });
  } catch {}
};

export const trackAction = (type: 'whatsapp' | 'call' | 'quote' | 'search' | 'download', label?: string) => {
  try {
    const data = loadAnalyticsData();
    data.actions.push({
      id: `act-${Date.now()}`,
      type,
      label,
      timestamp: new Date().toISOString()
    });
    if (data.actions.length > MAX_ACTIONS) {
      data.actions = data.actions.slice(-MAX_ACTIONS);
    }
    saveAnalyticsData(data);

    sendBackgroundBeacon({
      type: 'action',
      actionType: type,
      label
    });
  } catch {}
};

export const resetAnalytics = async () => {
  const fresh = generateInitialAnalytics();
  saveAnalyticsData(fresh);
  try {
    const token = localStorage.getItem('zst_admin_token') || sessionStorage.getItem('zst_admin_token') || '';
    await fetch('/api/analytics/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
  } catch {}
  return fresh;
};

// Live Server Dashboard Data Interface
export interface LiveSalesAnalytics {
  totalOrders: number;
  completedOrders: number;
  confirmedOrders?: number;
  pendingOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  grossRevenue: number;
  netRevenue: number;
  pendingRevenue: number;
  averageOrderValue: number;
  dailyOrdersCount?: number;
  dailyRevenue?: number;
  weeklyOrdersCount?: number;
  weeklyRevenue?: number;
  monthlyOrdersCount?: number;
  monthlyRevenue?: number;
  codBreakdown: {
    count: number;
    revenue: number;
    percentage: number;
    revenuePercentage: number;
  };
  onlineBreakdown: {
    count: number;
    revenue: number;
    percentage: number;
    revenuePercentage: number;
  };
  statusBreakdown: {
    completed: { count: number; percentage: number };
    pending: { count: number; percentage: number };
    cancelled: { count: number; percentage: number };
    returned: { count: number; percentage: number };
  };
  detailedStatuses: Record<string, number>;
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: string;
    paymentMethod: string;
    createdAt: string;
  }>;
}

export interface LiveDashboardData {
  success: boolean;
  liveVisitors: number;
  totalVisitors: number;
  uniqueVisitors?: number;
  dailyVisitors?: number;
  weeklyVisitors?: number;
  monthlyVisitors?: number;
  todayVisits?: number;
  conversionRate?: number;
  totalPageViews: number;
  totalWebsiteClicks: number;
  totalProductClicks: number;
  topProducts: Array<{ id: string; name: string; views: number; clicks: number }>;
  topSearches: Array<{ query: string; count: number }>;
  topCategories: Array<{ id: string; name: string; count: number }>;
  actions: Record<string, number>;
  deviceCounts: Record<string, number>;
  browserCounts: Record<string, number>;
  sourceCounts: Record<string, number>;
  dailyTrend?: Array<{
    label: string;
    dateStr: string;
    views: number;
    visitors: number;
    orders: number;
    revenue: number;
  }>;
  recentEvents: Array<{
    id: string;
    type: string;
    label: string;
    details: string;
    timestamp: string;
  }>;
  sales: LiveSalesAnalytics;
  lastUpdated: string;
}

// Fetch live backend aggregated metrics
export const fetchLiveAnalyticsDashboard = async (): Promise<LiveDashboardData | null> => {
  try {
    const res = await fetch('/api/analytics/dashboard', {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    if (data && data.success) {
      return data as LiveDashboardData;
    }
  } catch (err) {
    console.warn('[Analytics Dashboard Fetch] Fallback to client-side:', err);
  }
  return null;
};
