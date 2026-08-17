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

// Generate seed mock analytics data over last 30 days if empty
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

  const sampleSearches = ['Master Mixer', 'CPVC Pipe price', 'Wall closet', 'Shower column', 'Nippon weather coat', 'Plumbing rates'];

  // Seed 30 days of activity
  for (let i = 29; i >= 0; i--) {
    const dayTimestamp = now - (i * dayMs);
    // 30-80 views per day
    const viewsCount = Math.floor(30 + Math.random() * 50);

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

      // Product view (70% probability)
      if (Math.random() > 0.3) {
        const prod = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        productViews.push({
          id: `pvprod-${i}-${v}`,
          productId: prod.id,
          productName: prod.name,
          timestamp: timestampIso
        });
      }

      // Category click (40% probability)
      if (Math.random() > 0.6) {
        const cat = sampleCategories[Math.floor(Math.random() * sampleCategories.length)];
        categoryClicks.push({
          id: `cat-${i}-${v}`,
          categoryId: cat.id,
          categoryName: cat.name,
          timestamp: timestampIso
        });
      }

      // Action event (15% probability)
      if (Math.random() > 0.85) {
        const randAct = Math.random();
        if (randAct > 0.6) {
          actions.push({ id: `act-${i}-${v}`, type: 'whatsapp', label: 'Product Inquiry', timestamp: timestampIso });
        } else if (randAct > 0.35) {
          actions.push({ id: `act-${i}-${v}`, type: 'call', label: 'Showroom Phone', timestamp: timestampIso });
        } else if (randAct > 0.2) {
          actions.push({ id: `act-${i}-${v}`, type: 'quote', label: 'AI Materials Estimator', timestamp: timestampIso });
        } else if (randAct > 0.1) {
          const q = sampleSearches[Math.floor(Math.random() * sampleSearches.length)];
          actions.push({ id: `act-${i}-${v}`, type: 'search', label: q, timestamp: timestampIso });
        } else {
          actions.push({ id: `act-${i}-${v}`, type: 'download', label: 'Catalog PDF', timestamp: timestampIso });
        }
      }

    }
  }

  return { pageViews, productViews, categoryClicks, actions };
};

export const loadAnalyticsData = (): AnalyticsData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          pageViews: Array.isArray(parsed.pageViews) ? parsed.pageViews : [],
          productViews: Array.isArray(parsed.productViews) ? parsed.productViews : [],
          categoryClicks: Array.isArray(parsed.categoryClicks) ? parsed.categoryClicks : [],
          actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        };
      }
    }
  } catch (e) {
    console.error('Error loading analytics', e);
  }
  const initial = generateInitialAnalytics();
  saveAnalyticsData(initial);
  return initial;
};

export const saveAnalyticsData = (data: AnalyticsData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving analytics', e);
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
    // keep latest 10,000
    if (data.pageViews.length > 10000) data.pageViews = data.pageViews.slice(-10000);
    saveAnalyticsData(data);
  } catch (e) {
    console.error(e);
  }
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
    saveAnalyticsData(data);
  } catch (e) {
    console.error(e);
  }
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
    saveAnalyticsData(data);
  } catch (e) {
    console.error(e);
  }
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
    saveAnalyticsData(data);
  } catch (e) {
    console.error(e);
  }
};

export const resetAnalytics = () => {
  const fresh = generateInitialAnalytics();
  saveAnalyticsData(fresh);
  return fresh;
};
