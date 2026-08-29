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

// Generate seed mock analytics data over last 14 days if empty
const generateInitialAnalytics = (): AnalyticsData => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const pageViews: PageViewEvent[] = [];
  const productViews: ProductViewEvent[] = [];
  const categoryClicks: CategoryClickEvent[] = [];
  const actions: ActionEvent[] = [];

  const sampleProducts = [
    { id: '1', name: 'Master Gold Luxury Mixer Set' },
    { id: '2', name: 'Dura Max CPVC Heavy Duty Pipe' },
    { id: '3', name: 'Primax Wall-Hung Smart Closet' },
    { id: '4', name: 'Nippon Weather-Guard Paint 20L' },
    { id: '5', name: 'Faisal Concealed Shower Column' },
    { id: '6', name: 'Popular Sewage UPVC Main Drain' },
    { id: '7', name: 'Master Onyx Countertop Sink' }
  ];

  const sampleCategories = [
    { id: 'sanitaryware', name: 'Sanitaryware & Basins' },
    { id: 'faucets-mixers', name: 'Faucets & Brass Mixers' },
    { id: 'cpvc-upvc-pipes', name: 'CPVC & UPVC Piping' },
    { id: 'paints-coatings', name: 'Paints & Finishes' }
  ];

  const sampleSearches = ['Master Mixer', 'CPVC Pipe price', 'Wall closet', 'Shower column', 'Nippon weather coat'];

  // Seed 14 days of lightweight activity (~35 total views)
  for (let i = 13; i >= 0; i--) {
    const dayTimestamp = now - (i * dayMs);
    const viewsCount = 2 + (i % 3);

    for (let v = 0; v < viewsCount; v++) {
      const timeOffset = Math.floor(Math.random() * dayMs);
      const timestampIso = new Date(dayTimestamp + timeOffset).toISOString();
      const randDev = Math.random();
      const device = randDev > 0.45 ? 'Mobile' : randDev > 0.1 ? 'Desktop' : 'Tablet';

      const randBrowser = Math.random();
      const browser = randBrowser > 0.5 ? 'Chrome' : randBrowser > 0.25 ? 'Safari' : randBrowser > 0.1 ? 'Edge' : 'Firefox';

      const randSource = Math.random();
      const source = randSource > 0.4 ? 'Direct' : randSource > 0.2 ? 'Google Search' : randSource > 0.1 ? 'WhatsApp / Referral' : 'Social Media';

      pageViews.push({
        id: `pv-${i}-${v}`,
        timestamp: timestampIso,
        device,
        browser,
        source,
        path: '/'
      });

      // Product view (1 per day)
      if (v === 0) {
        const prod = sampleProducts[i % sampleProducts.length];
        productViews.push({
          id: `pvprod-${i}`,
          productId: prod.id,
          productName: prod.name,
          timestamp: timestampIso
        });
      }

      // Category click (every 2 days)
      if (v === 1 && i % 2 === 0) {
        const cat = sampleCategories[i % sampleCategories.length];
        categoryClicks.push({
          id: `cat-${i}`,
          categoryId: cat.id,
          categoryName: cat.name,
          timestamp: timestampIso
        });
      }

      // Action event (every 3 days)
      if (v === 0 && i % 3 === 0) {
        const randAct = Math.random();
        if (randAct > 0.5) {
          actions.push({ id: `act-${i}`, type: 'whatsapp', label: 'Product Inquiry', timestamp: timestampIso });
        } else if (randAct > 0.25) {
          actions.push({ id: `act-${i}`, type: 'call', label: 'Showroom Phone', timestamp: timestampIso });
        } else {
          const q = sampleSearches[i % sampleSearches.length];
          actions.push({ id: `act-${i}`, type: 'search', label: q, timestamp: timestampIso });
        }
      }
    }
  }

  return { pageViews, productViews, categoryClicks, actions };
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
          const result: AnalyticsData = {
            pageViews: Array.isArray(parsed.pageViews) ? parsed.pageViews.slice(-MAX_PAGE_VIEWS) : [],
            productViews: Array.isArray(parsed.productViews) ? parsed.productViews.slice(-MAX_PRODUCT_VIEWS) : [],
            categoryClicks: Array.isArray(parsed.categoryClicks) ? parsed.categoryClicks.slice(-MAX_CATEGORY_CLICKS) : [],
            actions: Array.isArray(parsed.actions) ? parsed.actions.slice(-MAX_ACTIONS) : [],
          };
          inMemoryAnalytics = result;
          return result;
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
  } catch {}
};

export const resetAnalytics = () => {
  const fresh = generateInitialAnalytics();
  saveAnalyticsData(fresh);
  return fresh;
};
