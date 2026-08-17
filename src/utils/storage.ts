import { BusinessConfig, Product, ProductCategory, GalleryItem, ProductBrand, StatCounter, AiDesignerConfig, AiAssistantConfig, ContactPerson, CartItem, CustomerOrder, CheckoutSettings, DeliverySettings, CityDeliveryInfo, ThemeOption, ThemeSettings, AnnouncementBarSettings, AnnouncementItem, HeroSettings, BuildMaterialEstimatorConfig, SmartToolsSettings } from '../types';
import { initialBusinessConfig, productCategories, featuredProducts, galleryItems, productBrands, defaultStatCounters } from '../data/storeData';
import { defaultBathroomPlannerConfig } from '../data/defaultPlannerConfig';
import { defaultBuildMaterialEstimatorConfig } from '../data/defaultEstimatorConfig';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  fetchProductsFromSupabase, 
  upsertProductInSupabase, 
  deleteProductFromSupabase,
  fetchCategoriesFromSupabase, 
  upsertCategoryInSupabase, 
  deleteCategoryFromSupabase,
  fetchBrandsFromSupabase, 
  upsertBrandInSupabase, 
  deleteBrandFromSupabase,
  fetchHeroSettingsFromSupabase, 
  saveHeroSettingsToSupabase,
  fetchOrdersFromSupabase, 
  createOrderInSupabase, 
  updateOrderStatusInSupabase,
  fetchDeliveryCitiesFromSupabase,
  saveDeliveryCitiesToSupabase,
  fetchSiteSettingFromSupabase,
  saveSiteSettingToSupabase,
  fetchBuildMaterialEstimatorFromSupabase,
  saveBuildMaterialEstimatorToSupabase
} from '../services/supabaseService';

const STORAGE_KEYS = {
  CONFIG: 'zst_business_config_v1',
  PRODUCTS: 'zst_products_v1',
  CATEGORIES: 'zst_categories_v1',
  GALLERY: 'zst_gallery_v1',
  BRANDS: 'zst_brands_v1',
  STATS: 'zst_stats_v1',
  CONTACTS: 'zst_contacts_v1',
  PLANNER: 'zst_planner_config_v2',
  ESTIMATOR: 'zst_build_material_estimator_v1',
  ADMIN_PIN: 'zst_admin_pin_v1',
  IS_ADMIN: 'zst_is_admin_v1',
  AI_ASSISTANT: 'zst_ai_assistant_config_v1',
  CART: 'zst_cart_v1',
  ORDERS: 'zst_orders_v1',
  CHECKOUT_SETTINGS: 'zst_checkout_settings_v1',
  DELIVERY_SETTINGS: 'zst_delivery_settings_v1',
  THEME_SETTINGS: 'zst_theme_settings_v1',
  ANNOUNCEMENT_SETTINGS: 'zst_announcement_settings_v1',
  HERO_SETTINGS: 'zst_hero_settings_v1',
  SMART_TOOLS: 'zst_smart_tools_settings_v1',
};

export const defaultHeroSettings: HeroSettings = {
  isEnabled: true,
  badgeText: 'ZAFAR SARWAR TRADERS',
  heading: 'Premium Sanitaryware\n& Bathroom Solutions',
  subheading: 'Explore premium sanitaryware, bathroom fittings, showers, basins, tiles, paints and complete bathroom solutions.',
  primaryBtnText: 'View Details',
  primaryBtnLink: '#products',
  enablePrimaryBtn: true,
  secondaryBtnText: 'Add to Cart',
  secondaryBtnLink: '#cart',
  enableSecondaryBtn: true,
  tertiaryBtnText: 'Order on WhatsApp',
  tertiaryBtnLink: 'whatsapp',
  enableTertiaryBtn: true,
  rotationDurationSeconds: 5,
  transitionSpeedSeconds: 0.8,
  transitionStyle: 'cinematic-depth',
  autoPlay: true,
  pauseOnHover: true,
  enableParallax: true,
  parallaxStrength: 15,
  glowIntensity: 'high',
  bgType: 'ambient-dark',
  heroProductIds: [],
  heroMode: 'selected_or_featured',
  productImageOverrides: {},
  productVideoOverrides: {},
  customProductOrder: []
};

export const defaultAnnouncementSettings: AnnouncementBarSettings = {
  isEnabled: true,
  rotationMode: 'carousel',
  displayDurationSeconds: 4,
  announcements: [
    {
      id: 'ann-1',
      text: '🚚 Delivery Available Across Pakistan — Express Courier & Showroom Logistics',
      iconName: 'Truck',
      bgColor: '#1e3a8a',
      textColor: '#ffffff',
      accentColor: '#38bdf8',
      isActive: true,
      displayOrder: 1,
    },
    {
      id: 'ann-2',
      text: '🔥 New Luxury Sanitaryware, Faucets & Rain Showers Added to Catalog',
      iconName: 'Flame',
      bgColor: '#0f172a',
      textColor: '#ffffff',
      accentColor: '#f59e0b',
      isActive: true,
      displayOrder: 2,
    },
    {
      id: 'ann-3',
      text: '🎉 Special Wholesale & Bulk Order Discounts Available for Builders & Contractors',
      iconName: 'Gift',
      bgColor: '#14532d',
      textColor: '#ffffff',
      accentColor: '#4ade80',
      isActive: true,
      displayOrder: 3,
    }
  ]
};

export const loadAnnouncementSettings = (): AnnouncementBarSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (typeof parsed.isEnabled === 'boolean' && Array.isArray(parsed.announcements)) {
        return { ...defaultAnnouncementSettings, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading announcement settings', e);
  }
  return defaultAnnouncementSettings;
};

export const saveAnnouncementSettings = async (settings: AnnouncementBarSettings): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, JSON.stringify(settings));
    saveToServerCMS(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, settings);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving announcement settings', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const defaultThemeSettings: ThemeSettings = {
  defaultTheme: 'light',
  primaryAccentColor: '#2563eb',
  secondaryAccentColor: '#3b82f6',
  availableThemes: [
    {
      id: 'light',
      name: 'THEME 1 — LIGHT',
      description: 'Clean white background, dark readable text, soft gray sections & blue accents. Professional shopping-store appearance.',
      previewBg: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      previewAccent: '#2563eb',
      previewCard: '#ffffff',
      previewText: '#0f172a',
      isEnabled: true,
      badge: 'Classic Clean',
      displayOrder: 1
    },
    {
      id: 'dark',
      name: 'THEME 2 — DARK',
      description: 'Deep black / dark navy background, white text & blue accents. Premium cinematic appearance.',
      previewBg: 'linear-gradient(135deg, #030712 0%, #090d16 100%)',
      previewAccent: '#3b82f6',
      previewCard: '#0f172a',
      previewText: '#f8fafc',
      isEnabled: true,
      badge: 'Cinematic Dark',
      displayOrder: 2
    },
    {
      id: 'navy',
      name: 'THEME 3 — NAVY BLUE',
      description: 'Deep corporate navy background, blue gradients & bright white text. Corporate luxury appearance.',
      previewBg: 'linear-gradient(135deg, #0b1329 0%, #132247 100%)',
      previewAccent: '#2563eb',
      previewCard: '#132247',
      previewText: '#f8fafc',
      isEnabled: true,
      badge: 'Corporate Navy',
      displayOrder: 3
    },
    {
      id: 'glass',
      name: 'THEME 4 — GLASS',
      description: 'Light/dark glassmorphism, soft transparent cards & blue accent lighting. Modern futuristic appearance.',
      previewBg: 'linear-gradient(135deg, #080c14 0%, #0e1626 100%)',
      previewAccent: '#38bdf8',
      previewCard: 'rgba(255, 255, 255, 0.08)',
      previewText: '#ffffff',
      isEnabled: true,
      badge: 'Glassmorphism',
      displayOrder: 4
    },
    {
      id: 'premium-blue',
      name: 'THEME 5 — PREMIUM BLUE',
      description: 'Blue-focused visual identity, soft ice-blue background, professional blue buttons & clean luxury feel.',
      previewBg: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)',
      previewAccent: '#1d4ed8',
      previewCard: '#ffffff',
      previewText: '#0f172a',
      isEnabled: true,
      badge: 'Royal Store',
      displayOrder: 5
    }
  ]
};

export const USER_ACTIVE_THEME_KEY = 'zst_active_theme_v1';

export const loadThemeSettings = (): ThemeSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_SETTINGS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.defaultTheme && Array.isArray(parsed.availableThemes)) {
        return { ...defaultThemeSettings, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading theme settings', e);
  }
  return defaultThemeSettings;
};

export const saveThemeSettings = async (settings: ThemeSettings): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME_SETTINGS, JSON.stringify(settings));
    saveToServerCMS(STORAGE_KEYS.THEME_SETTINGS, settings);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.THEME_SETTINGS, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving theme settings', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const getActiveTheme = (fallbackDefault: string = 'light'): string => {
  try {
    const savedUserTheme = localStorage.getItem(USER_ACTIVE_THEME_KEY);
    if (savedUserTheme) {
      return savedUserTheme;
    }
  } catch (e) {
    console.warn('Error reading active user theme', e);
  }
  return fallbackDefault;
};

export const setActiveTheme = (themeId: string) => {
  try {
    localStorage.setItem(USER_ACTIVE_THEME_KEY, themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  } catch (e) {
    console.error('Error saving user active theme', e);
  }
};

export const defaultDeliverySettings: DeliverySettings = {
  isEnabled: true,
  acrossPakistanHeadline: 'Express & Secure Delivery Available Across Pakistan',
  deliveryPartner: 'Leopard Courier / TCS / Private Showroom Logistics Fleet',
  storeOpeningTime: '09:00 AM',
  storeClosingTime: '09:00 PM',
  workingDays: 'Monday - Saturday',
  fridayTiming: '09:00 AM - 01:00 PM & 03:00 PM - 09:00 PM (Break for Juma Prayer 1:00 PM - 2:30 PM)',
  orderCutoffTime: '05:00 PM',
  holidaySchedule: 'Closed on Sundays & Gazetted Public Holidays',
  whatsappSupportNumber: '+92 310 8002863',
  defaultSelectedCityId: 'city-lahore',
  enableCustomCity: true,
  customCityLabel: '➕ Custom City / Address',
  customCityNotice: 'Delivery time for this location will be confirmed by our team.',
  deliveryNotes: [
    '✓ Delivery time depends on your selected city.',
    '✓ Orders placed before 5:00 PM will be processed the same working day.',
    '✓ Orders placed after 5:00 PM will be processed on the next working day.',
    '✓ If your delivery is delayed due to weather, courier, holidays, or other operational reasons, you will be informed immediately.',
    '✓ Our customer support team will contact you directly on WhatsApp or Phone if any change in delivery schedule occurs.'
  ],
  cities: [
    { id: 'city-lahore', cityName: 'Lahore', estimatedDays: '1–2 Working Days', deliveryFee: 250, isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 1 },
    { id: 'city-karachi', cityName: 'Karachi', estimatedDays: '3–5 Working Days', deliveryFee: 450, isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 2 },
    { id: 'city-islamabad', cityName: 'Islamabad', estimatedDays: '2–3 Working Days', deliveryFee: 350, isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 3 },
    { id: 'city-rawalpindi', cityName: 'Rawalpindi', estimatedDays: '2–3 Working Days', deliveryFee: 350, isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 4 },
    { id: 'city-faisalabad', cityName: 'Faisalabad', estimatedDays: '1–2 Working Days', deliveryFee: 300, isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 5 },
    { id: 'city-multan', cityName: 'Multan', estimatedDays: '2–3 Working Days', deliveryFee: 350, isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 6 },
    { id: 'city-gujranwala', cityName: 'Gujranwala', estimatedDays: '1–2 Working Days', deliveryFee: 250, isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 7 },
    { id: 'city-sialkot', cityName: 'Sialkot', estimatedDays: '1–2 Working Days', deliveryFee: 250, isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 8 },
    { id: 'city-chiniot', cityName: 'Chiniot', estimatedDays: 'Same Day / Next Working Day', deliveryFee: 150, isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 9 },
    { id: 'city-jhang', cityName: 'Jhang', estimatedDays: '1–2 Working Days', deliveryFee: 200, isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 10 },
    { id: 'city-sargodha', cityName: 'Sargodha', estimatedDays: '1–2 Working Days', deliveryFee: 250, isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 11 },
    { id: 'city-bahawalpur', cityName: 'Bahawalpur', estimatedDays: '2–3 Working Days', deliveryFee: 350, isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 12 },
    { id: 'city-peshawar', cityName: 'Peshawar', estimatedDays: '3–4 Working Days', deliveryFee: 400, isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 13 },
    { id: 'city-quetta', cityName: 'Quetta', estimatedDays: '4–6 Working Days', deliveryFee: 500, isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 14 },
    { id: 'city-hyderabad', cityName: 'Hyderabad', estimatedDays: '3–5 Working Days', deliveryFee: 450, isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 15 },
    { id: 'city-sukkur', cityName: 'Sukkur', estimatedDays: '3–4 Working Days', deliveryFee: 400, isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 16 }
  ]
};

export const defaultCheckoutSettings: CheckoutSettings = {
  deliveryFee: 250,
  taxRatePercent: 0,
  enableTaxes: false,
  freeDeliveryThreshold: 50000,
  whatsappNumberOverride: ''
};

export const defaultContactPersons: ContactPerson[] = [
  {
    id: 'contact-1',
    fullName: 'Muhammad Zafar Sarwar',
    designation: 'Owner & CEO',
    department: 'Executive Management',
    mobileNumber: '+92 300 6603063',
    whatsappNumber: '+92 300 6603063',
    email: 'info@zafarsarwar.com',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    workingHours: '9:00 AM - 9:00 PM',
    availabilityStatus: 'Available',
    isPrimary: true,
    enableWhatsapp: true,
    enableCall: true,
    isHidden: false,
    displayOrder: 1
  },
  {
    id: 'contact-2',
    fullName: 'Showroom Manager',
    designation: 'Sanitary Manager',
    department: 'Sanitaryware & Luxury Bath',
    mobileNumber: '+92 300 6603063',
    whatsappNumber: '+92 300 6603063',
    email: 'sanitary@zafarsarwar.com',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    workingHours: '9:00 AM - 8:30 PM',
    availabilityStatus: 'Available',
    isPrimary: false,
    enableWhatsapp: true,
    enableCall: true,
    isHidden: false,
    displayOrder: 2
  },
  {
    id: 'contact-3',
    fullName: 'Accounts Desk',
    designation: 'Accounts Manager',
    department: 'Finance & Billing',
    mobileNumber: '+92 300 6603063',
    whatsappNumber: '+92 300 6603063',
    email: 'accounts@zafarsarwar.com',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    workingHours: '10:00 AM - 7:00 PM',
    availabilityStatus: 'Available',
    isPrimary: false,
    enableWhatsapp: true,
    enableCall: true,
    isHidden: false,
    displayOrder: 3
  },
  {
    id: 'contact-4',
    fullName: 'Sales Representative',
    designation: 'Sales Manager',
    department: 'Commercial Sales & Quotations',
    mobileNumber: '+92 300 6603063',
    whatsappNumber: '+92 300 6603063',
    email: 'sales@zafarsarwar.com',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    workingHours: '9:00 AM - 9:00 PM',
    availabilityStatus: 'Available',
    isPrimary: false,
    enableWhatsapp: true,
    enableCall: true,
    isHidden: false,
    displayOrder: 4
  }
];

const saveToServerCMS = (key: string, payload: any) => {
  try {
    fetch('/api/cms/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, payload })
    }).then(res => res.json())
      .catch(err => console.warn(`CMS Save failed for key "${key}":`, err));
  } catch (e) {
    console.warn(`Error dispatching saveToServerCMS for key "${key}":`, e);
  }
};

const saveAllToServerCMS = async (data: Record<string, any>) => {
  try {
    const res = await fetch('/api/cms/save-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    return await res.json();
  } catch (e) {
    console.warn('Error dispatching saveAllToServerCMS:', e);
  }
};

export const defaultAiAssistantConfig: AiAssistantConfig = {
  isEnabled: true,
  aiName: "Zafar AI Shopping Assistant",
  welcomeMessage: `Welcome to Zafar Sarwar Traders.

I'm your AI Shopping Assistant.

I can help you with:
• Finding Products & Live Inventory
• Prices & Budget Search
• Product Specifications & Comparisons
• Delivery Times & City Shipping
• Official Brand Warranties
• Custom Bathroom Packages
• Instant WhatsApp Ordering

How can I help you today?`,
  selectedModel: "gemini-3.6-flash",
  apiKeyNotice: "Server-side GEMINI_API_KEY environment variable is automatically attached.",
  theme: "dark-cyan",
  suggestedQuestions: [
    "Show me faucets under 10000",
    "Show me black shower sets",
    "Which Sonex products do you have?",
    "Do you deliver to Lahore?",
    "Recommend a luxury bathroom package",
    "Compare Hansgrohe Axor Raindance and Porsche Waterfall Faucet"
  ],
  dataSources: {
    products: true,
    categories: true,
    brands: true,
    faqs: true,
    reviews: true,
    companyInfo: true,
    deliveryInfo: true,
    customKnowledge: true,
  },
  customKnowledge: [
    {
      id: "ck-1",
      title: "Showroom Hours & Live Testing",
      category: "general",
      questionOrTopic: "Where is the showroom and can we test products live?",
      answerOrContent: "Zafar Sarwar Traders showroom features live water pressure test benches for rain showers and designer mixers. Hours: Mon-Sat 9:00 AM - 9:00 PM (Friday break 1:00 PM - 2:30 PM for Juma Prayer). Closed on Sundays.",
      isEnabled: true,
      displayOrder: 1
    },
    {
      id: "ck-2",
      title: "100% Original Brand Warranty",
      category: "warranty",
      questionOrTopic: "Are all products original and covered by brand warranty?",
      answerOrContent: "Yes, every product sold by Zafar Sarwar Traders (Sonex, Faisal, Master, Hansgrohe, Grohe) is 100% original and comes with official manufacturer cartridge and brass finish warranties ranging from 10 to 25 years.",
      isEnabled: true,
      displayOrder: 2
    },
    {
      id: "ck-3",
      title: "Express Nationwide Courier & Fleet Shipping",
      category: "shipping",
      questionOrTopic: "How does delivery work across Pakistan?",
      answerOrContent: "We deliver across Pakistan using TCS, Leopard Courier, and our showroom fleet. Major cities: Lahore (1-2 days), Islamabad/Rawalpindi (2-3 days), Karachi (3-5 days). Free express delivery on orders over PKR 50,000.",
      isEnabled: true,
      displayOrder: 3
    },
    {
      id: "ck-4",
      title: "Wholesale & Contractor Quotations",
      category: "policy",
      questionOrTopic: "Do you offer wholesale bulk discounts for builders and plumbers?",
      answerOrContent: "Yes! We provide special itemized quotations and volume trade discounts for commercial projects, residential plazas, and plumbing contractors. Direct WhatsApp consultation is available.",
      isEnabled: true,
      displayOrder: 4
    }
  ],
  enableProductRecommendations: true,
  enableQuoteAssistance: true,
  enableBathroomPlanner: true,
};

export const loadAiAssistantConfig = (): AiAssistantConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.AI_ASSISTANT);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.aiName) {
        return { ...defaultAiAssistantConfig, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading AI assistant config', e);
  }
  return defaultAiAssistantConfig;
};

export const saveAiAssistantConfig = async (config: AiAssistantConfig): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.AI_ASSISTANT, JSON.stringify(config));
    saveToServerCMS(STORAGE_KEYS.AI_ASSISTANT, config);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.AI_ASSISTANT, config);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving AI assistant config', e);
    return { success: false, error: e?.message || String(e) };
  }
};


export const loadStoredConfig = (): BusinessConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading stored config', e);
  }
  return initialBusinessConfig;
};

export const saveStoredConfig = async (config: BusinessConfig): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    saveToServerCMS(STORAGE_KEYS.CONFIG, config);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.CONFIG, config);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving stored config', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadStoredProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored products', e);
  }
  return featuredProducts;
};

export const saveStoredProducts = async (products: Product[]): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    saveToServerCMS(STORAGE_KEYS.PRODUCTS, products);

    if (isSupabaseConfigured) {
      const res = await upsertProductInSupabase(products);
      if (res && res.success === false) {
        console.error('[STEP32 ERROR] Supabase save returned error:', res.error);
        return { success: false, error: res.error };
      }
    }
    console.log('[STEP32 SAVE COMPLETE] saveStoredProducts result: success');
    return { success: true };
  } catch (e: any) {
    console.error('[STEP18] Error saving stored products', e);
    console.log('[STEP18] saveStoredProducts result: failure -', e?.message || String(e));
    return { success: false, error: e?.message || String(e) };
  }
};

export const deleteProductFromStorage = async (productId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const result = await deleteProductFromSupabase(productId);
      if (!result.success) {
        console.error('Failed to delete product from Supabase:', result.error);
        return { success: false, error: result.error };
      }
    }
    const current = loadStoredProducts();
    const updated = current.filter(p => p.id !== productId);
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(updated));
    saveToServerCMS(STORAGE_KEYS.PRODUCTS, updated);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
};

export const loadStoredCategories = (): ProductCategory[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored categories', e);
  }
  return productCategories;
};

export const saveStoredCategories = async (categories: ProductCategory[]): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await upsertCategoryInSupabase(categories);
      if (res && !res.success) {
        console.error('Failed to save categories to Supabase:', res.error);
        return { success: false, error: res.error };
      }
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    saveToServerCMS(STORAGE_KEYS.CATEGORIES, categories);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving stored categories', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const deleteCategoryFromStorage = async (categoryId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const result = await deleteCategoryFromSupabase(categoryId);
      if (!result.success) {
        return { success: false, error: result.error };
      }
    }
    const current = loadStoredCategories();
    const updated = current.filter(c => c.id !== categoryId);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(updated));
    saveToServerCMS(STORAGE_KEYS.CATEGORIES, updated);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
};

export const loadStoredGallery = (): GalleryItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.GALLERY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored gallery', e);
  }
  return galleryItems;
};

export const saveStoredGallery = async (items: GalleryItem[]): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(items));
    saveToServerCMS(STORAGE_KEYS.GALLERY, items);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.GALLERY, items);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving stored gallery', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadStoredBrands = (): ProductBrand[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANDS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored brands', e);
  }
  return productBrands;
};

export const saveStoredBrands = async (brands: ProductBrand[]): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await upsertBrandInSupabase(brands);
      if (res && !res.success) {
        console.error('Failed to save brands to Supabase:', res.error);
        return { success: false, error: res.error };
      }
    }
    localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(brands));
    saveToServerCMS(STORAGE_KEYS.BRANDS, brands);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving stored brands', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const deleteBrandFromStorage = async (brandId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const result = await deleteBrandFromSupabase(brandId);
      if (!result.success) {
        return { success: false, error: result.error };
      }
    }
    const current = loadStoredBrands();
    const updated = current.filter(b => b.id !== brandId);
    localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(updated));
    saveToServerCMS(STORAGE_KEYS.BRANDS, updated);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
};

export const loadStoredStats = (): StatCounter[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.STATS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored stats', e);
  }
  return defaultStatCounters;
};

export const saveStoredStats = async (stats: StatCounter[]): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    saveToServerCMS(STORAGE_KEYS.STATS, stats);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.STATS, stats);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving stored stats', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadPlannerConfig = (): AiDesignerConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANNER);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (parsed.roomTypes && parsed.colorThemes) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading designer config', e);
  }
  return defaultBathroomPlannerConfig;
};

export const savePlannerConfig = async (config: AiDesignerConfig): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.PLANNER, JSON.stringify(config));
    saveToServerCMS(STORAGE_KEYS.PLANNER, config);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.PLANNER, config);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving designer config', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadBuildMaterialEstimatorConfig = (): BuildMaterialEstimatorConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ESTIMATOR);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.houseSizes) && Array.isArray(parsed.constructionTypes)) {
        return {
          ...defaultBuildMaterialEstimatorConfig,
          ...parsed
        };
      }
    }
  } catch (e) {
    console.error('Error loading build material estimator config', e);
  }
  return defaultBuildMaterialEstimatorConfig;
};

export const saveBuildMaterialEstimatorConfig = async (config: BuildMaterialEstimatorConfig): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.ESTIMATOR, JSON.stringify(config));
    saveToServerCMS(STORAGE_KEYS.ESTIMATOR, config);
    if (isSupabaseConfigured) {
      const res = await saveBuildMaterialEstimatorToSupabase(config);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving build material estimator config', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadStoredContacts = (): ContactPerson[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored contacts', e);
  }
  return defaultContactPersons;
};

export const saveStoredContacts = async (contacts: ContactPerson[]): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    saveToServerCMS(STORAGE_KEYS.CONTACTS, contacts);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.CONTACTS, contacts);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving stored contacts', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadStoredCart = (): CartItem[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CART);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored cart', e);
  }
  return [];
};

export const saveStoredCart = (cart: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart));
  } catch (e) {
    console.error('Error saving stored cart', e);
  }
};

export const loadStoredOrders = (): CustomerOrder[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error loading stored orders', e);
  }
  return [];
};

export const generateNextOrderId = (): string => {
  const orders = loadStoredOrders();
  if (!orders || orders.length === 0) {
    return 'ZST-00001';
  }
  let maxNum = 0;
  orders.forEach(o => {
    if (o.id) {
      const match = o.id.match(/ZST-(\d+)/i) || o.id.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1] || match[0], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `ZST-${String(nextNum).padStart(5, '0')}`;
};

export const saveStoredOrders = (orders: CustomerOrder[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    saveToServerCMS(STORAGE_KEYS.ORDERS, orders);
  } catch (e) {
    console.error('Error saving stored orders', e);
  }
};

export const addOrderToStorage = async (order: CustomerOrder): Promise<{ success: boolean; orderId: string; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await createOrderInSupabase(order);
      if (!res.success) {
        console.error('Failed to save order to Supabase:', res.error);
        return { success: false, orderId: order.id, error: res.error };
      }
    }
    const existing = loadStoredOrders();
    const updated = [order, ...existing];
    saveStoredOrders(updated);
    return { success: true, orderId: order.id };
  } catch (err: any) {
    return { success: false, orderId: order.id, error: err?.message || String(err) };
  }
};

export const updateOrderStatusInStorage = async (orderId: string, status: CustomerOrder['status']): Promise<boolean> => {
  try {
    const existing = loadStoredOrders();
    const updated = existing.map(o => o.id === orderId ? { ...o, status } : o);
    saveStoredOrders(updated);

    if (isSupabaseConfigured) {
      await updateOrderStatusInSupabase(orderId, status);
    }
    return true;
  } catch (err) {
    console.error('Error updating order status:', err);
    return false;
  }
};

export const loadCheckoutSettings = (): CheckoutSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CHECKOUT_SETTINGS);
    if (saved !== null) {
      return { ...defaultCheckoutSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading checkout settings', e);
  }
  return defaultCheckoutSettings;
};

export const saveCheckoutSettings = async (settings: CheckoutSettings): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.CHECKOUT_SETTINGS, JSON.stringify(settings));
    saveToServerCMS(STORAGE_KEYS.CHECKOUT_SETTINGS, settings);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.CHECKOUT_SETTINGS, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving checkout settings', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadDeliverySettings = (): DeliverySettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.DELIVERY_SETTINGS);
    if (saved !== null) {
      return { ...defaultDeliverySettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading delivery settings', e);
  }
  return defaultDeliverySettings;
};

export const saveDeliverySettings = async (settings: DeliverySettings): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.DELIVERY_SETTINGS, JSON.stringify(settings));
    saveToServerCMS(STORAGE_KEYS.DELIVERY_SETTINGS, settings);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.DELIVERY_SETTINGS, settings);
      if (!res.success) return { success: false, error: res.error };
      const citiesList = settings.cities || (settings as any).cityDeliveryList;
      if (citiesList) {
        await saveDeliveryCitiesToSupabase(citiesList);
      }
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving delivery settings', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadHeroSettings = (): HeroSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HERO_SETTINGS);
    if (saved !== null) {
      return { ...defaultHeroSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading hero settings', e);
  }
  return defaultHeroSettings;
};

export const saveHeroSettings = async (settings: HeroSettings): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.HERO_SETTINGS, JSON.stringify(settings));
    saveToServerCMS(STORAGE_KEYS.HERO_SETTINGS, settings);
    if (isSupabaseConfigured) {
      const res = await saveHeroSettingsToSupabase(settings);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving hero settings', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadSmartToolsSettings = (): SmartToolsSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SMART_TOOLS);
    if (saved !== null) {
      return { ...defaultSmartToolsSettings, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading smart tools settings', e);
  }
  return defaultSmartToolsSettings;
};

export const saveSmartToolsSettings = async (settings: SmartToolsSettings): Promise<{ success: boolean; error?: string }> => {
  try {
    localStorage.setItem(STORAGE_KEYS.SMART_TOOLS, JSON.stringify(settings));
    saveToServerCMS(STORAGE_KEYS.SMART_TOOLS, settings);
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.SMART_TOOLS, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving smart tools settings', e);
    return { success: false, error: e?.message || String(e) };
  }
};

const safeSetLocalStorage = (key: string, value: any) => {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  } catch (e) {
    console.warn(`[storage] Could not write to localStorage for key ${key}:`, e);
  }
};

export const syncWithServerCMS = async (callbacks: {
  setConfig?: (c: BusinessConfig) => void;
  setProducts?: (p: Product[]) => void;
  setCategories?: (c: ProductCategory[]) => void;
  setBrands?: (b: ProductBrand[]) => void;
  setStats?: (s: StatCounter[]) => void;
  setContacts?: (c: ContactPerson[]) => void;
  setGallery?: (g: GalleryItem[]) => void;
  setPlannerConfig?: (pc: AiDesignerConfig) => void;
  setEstimatorConfig?: (ec: BuildMaterialEstimatorConfig) => void;
  setAiAssistantConfig?: (ac: AiAssistantConfig) => void;
  setOrders?: (o: CustomerOrder[]) => void;
  setCheckoutSettings?: (cs: CheckoutSettings) => void;
  setDeliverySettings?: (ds: DeliverySettings) => void;
  setThemeSettings?: (ts: ThemeSettings) => void;
  setAnnouncementSettings?: (as: AnnouncementBarSettings) => void;
  setHeroSettings?: (hs: HeroSettings) => void;
  setSmartToolsSettings?: (st: SmartToolsSettings) => void;
  customerId?: string;
}) => {
  if (isSupabaseConfigured) {
    try {
      console.log('🔄 Syncing live database from Supabase PostgreSQL source of truth...');
      
      // 1. Fetch Categories
      const categoriesFromDb = await fetchCategoriesFromSupabase();
      let categoriesToUse = categoriesFromDb;
      if (categoriesFromDb !== null && categoriesFromDb.length === 0) {
        console.log('🌱 Syncing default categories to Supabase...');
        for (const cat of productCategories) {
          await upsertCategoryInSupabase(cat);
        }
        categoriesToUse = await fetchCategoriesFromSupabase();
      }
      if (categoriesToUse && Array.isArray(categoriesToUse)) {
        if (callbacks.setCategories) callbacks.setCategories(categoriesToUse);
        safeSetLocalStorage(STORAGE_KEYS.CATEGORIES, categoriesToUse);
      }

      // 2. Fetch Brands
      const brandsFromDb = await fetchBrandsFromSupabase();
      let brandsToUse = brandsFromDb;
      if (brandsFromDb !== null && brandsFromDb.length === 0) {
        console.log('🌱 Syncing default brands to Supabase...');
        for (const brand of productBrands) {
          await upsertBrandInSupabase(brand);
        }
        brandsToUse = await fetchBrandsFromSupabase();
      }
      if (brandsToUse && Array.isArray(brandsToUse)) {
        if (callbacks.setBrands) callbacks.setBrands(brandsToUse);
        safeSetLocalStorage(STORAGE_KEYS.BRANDS, brandsToUse);
      }

      // 3. Fetch Products
      let productsFromDb = await fetchProductsFromSupabase();
      if (productsFromDb !== null) {
        if (productsFromDb.length === 0) {
          console.log('🌱 Supabase products table is empty. Syncing default featured products...');
          for (const prod of featuredProducts) {
            await upsertProductInSupabase(prod);
          }
          productsFromDb = await fetchProductsFromSupabase();
        }

        if (productsFromDb && Array.isArray(productsFromDb)) {
          console.log('[STEP18 LOAD] React products count:', productsFromDb.length);
          if (callbacks.setProducts) callbacks.setProducts(productsFromDb);
          safeSetLocalStorage(STORAGE_KEYS.PRODUCTS, productsFromDb);
        } else {
          const stored = loadStoredProducts();
          if (stored && stored.length > 0) {
            console.log('[STEP18 LOAD] React products count (from local cache):', stored.length);
            if (callbacks.setProducts) callbacks.setProducts(stored);
          }
        }
      } else {
        console.warn('⚠️ Could not fetch products from Supabase. Preserving current products.');
        const stored = loadStoredProducts();
        if (stored && stored.length > 0) {
          console.log('[STEP18 LOAD] React products count (fallback local cache):', stored.length);
          if (callbacks.setProducts) callbacks.setProducts(stored);
        }
      }

      // 4. Fetch Hero Settings
      const heroFromDb = await fetchHeroSettingsFromSupabase();
      let heroToUse = heroFromDb || defaultHeroSettings;
      if (!heroFromDb) {
        console.log('🌱 Supabase hero settings empty. Initializing default hero settings...');
        await saveHeroSettingsToSupabase(defaultHeroSettings);
        heroToUse = defaultHeroSettings;
      }
      if (callbacks.setHeroSettings) callbacks.setHeroSettings(heroToUse);
      safeSetLocalStorage(STORAGE_KEYS.HERO_SETTINGS, heroToUse);

      // 5. Fetch Orders for Customer or All (if Admin)
      const ordersFromDb = await fetchOrdersFromSupabase(callbacks.customerId);
      if (callbacks.setOrders && ordersFromDb !== null) {
        callbacks.setOrders(ordersFromDb);
        safeSetLocalStorage(STORAGE_KEYS.ORDERS, ordersFromDb);
      }

      // 6. Fetch Delivery Cities
      const deliveryCitiesFromDb = await fetchDeliveryCitiesFromSupabase();
      if (deliveryCitiesFromDb && deliveryCitiesFromDb.length > 0) {
        const currentDeliverySettings = loadDeliverySettings();
        const updatedDeliverySettings = { ...currentDeliverySettings, cities: deliveryCitiesFromDb };
        if (callbacks.setDeliverySettings) callbacks.setDeliverySettings(updatedDeliverySettings);
        safeSetLocalStorage(STORAGE_KEYS.DELIVERY_SETTINGS, updatedDeliverySettings);
      }

      // 7. Fetch Site Settings (Business Config, Announcement, Theme, Checkout, Delivery, Stats, Contacts, Gallery, Planner, AI Assistant)
      const configDb = await fetchSiteSettingFromSupabase<BusinessConfig>(STORAGE_KEYS.CONFIG);
      if (configDb && typeof configDb === 'object' && Object.keys(configDb).length > 0 && ('companyName' in configDb || 'tagline' in configDb)) {
        if (callbacks.setConfig) callbacks.setConfig(configDb);
        safeSetLocalStorage(STORAGE_KEYS.CONFIG, configDb);
      } else {
        const fallbackConfig = loadStoredConfig();
        if (callbacks.setConfig) callbacks.setConfig(fallbackConfig);
      }

      const announcementDb = await fetchSiteSettingFromSupabase<AnnouncementBarSettings>(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS);
      if (announcementDb && typeof announcementDb === 'object' && ('text' in announcementDb || 'enabled' in announcementDb)) {
        if (callbacks.setAnnouncementSettings) callbacks.setAnnouncementSettings(announcementDb);
        safeSetLocalStorage(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, announcementDb);
      } else {
        const fallbackAnn = loadAnnouncementSettings();
        if (callbacks.setAnnouncementSettings) callbacks.setAnnouncementSettings(fallbackAnn);
      }

      const themeDb = await fetchSiteSettingFromSupabase<ThemeSettings>(STORAGE_KEYS.THEME_SETTINGS);
      if (themeDb && typeof themeDb === 'object' && Object.keys(themeDb).length > 0 && ('primaryColor' in themeDb || 'availableThemes' in themeDb)) {
        if (callbacks.setThemeSettings) callbacks.setThemeSettings(themeDb);
        safeSetLocalStorage(STORAGE_KEYS.THEME_SETTINGS, themeDb);
      } else {
        const fallbackTheme = loadThemeSettings();
        if (callbacks.setThemeSettings) callbacks.setThemeSettings(fallbackTheme);
      }

      const checkoutDb = await fetchSiteSettingFromSupabase<CheckoutSettings>(STORAGE_KEYS.CHECKOUT_SETTINGS);
      if (checkoutDb && typeof checkoutDb === 'object' && Object.keys(checkoutDb).length > 0 && ('enableCOD' in checkoutDb || 'currency' in checkoutDb)) {
        if (callbacks.setCheckoutSettings) callbacks.setCheckoutSettings(checkoutDb);
        safeSetLocalStorage(STORAGE_KEYS.CHECKOUT_SETTINGS, checkoutDb);
      } else {
        const fallbackCheckout = loadCheckoutSettings();
        if (callbacks.setCheckoutSettings) callbacks.setCheckoutSettings(fallbackCheckout);
      }

      const deliveryDb = await fetchSiteSettingFromSupabase<DeliverySettings>(STORAGE_KEYS.DELIVERY_SETTINGS);
      if (deliveryDb && typeof deliveryDb === 'object' && Array.isArray((deliveryDb as any).cities)) {
        if (callbacks.setDeliverySettings) callbacks.setDeliverySettings(deliveryDb);
        safeSetLocalStorage(STORAGE_KEYS.DELIVERY_SETTINGS, deliveryDb);
      } else {
        const fallbackDelivery = loadDeliverySettings();
        if (callbacks.setDeliverySettings) callbacks.setDeliverySettings(fallbackDelivery);
      }

      const statsDb = await fetchSiteSettingFromSupabase<StatCounter[]>(STORAGE_KEYS.STATS);
      if (Array.isArray(statsDb) && statsDb.length > 0) {
        if (callbacks.setStats) callbacks.setStats(statsDb);
        safeSetLocalStorage(STORAGE_KEYS.STATS, statsDb);
      } else {
        const fallbackStats = loadStoredStats();
        if (callbacks.setStats) callbacks.setStats(fallbackStats);
      }

      const contactsDb = await fetchSiteSettingFromSupabase<ContactPerson[]>(STORAGE_KEYS.CONTACTS);
      if (Array.isArray(contactsDb) && contactsDb.length > 0) {
        if (callbacks.setContacts) callbacks.setContacts(contactsDb);
        safeSetLocalStorage(STORAGE_KEYS.CONTACTS, contactsDb);
      } else {
        const fallbackContacts = loadStoredContacts();
        if (callbacks.setContacts) callbacks.setContacts(fallbackContacts);
      }

      const galleryDb = await fetchSiteSettingFromSupabase<GalleryItem[]>(STORAGE_KEYS.GALLERY);
      if (Array.isArray(galleryDb) && galleryDb.length > 0) {
        if (callbacks.setGallery) callbacks.setGallery(galleryDb);
        safeSetLocalStorage(STORAGE_KEYS.GALLERY, galleryDb);
      } else {
        const fallbackGallery = loadStoredGallery();
        if (callbacks.setGallery) callbacks.setGallery(fallbackGallery);
      }

      const plannerDb = await fetchSiteSettingFromSupabase<AiDesignerConfig>(STORAGE_KEYS.PLANNER);
      if (plannerDb && typeof plannerDb === 'object' && Array.isArray((plannerDb as any).rules)) {
        if (callbacks.setPlannerConfig) callbacks.setPlannerConfig(plannerDb);
        safeSetLocalStorage(STORAGE_KEYS.PLANNER, plannerDb);
      } else {
        const fallbackPlanner = loadPlannerConfig();
        if (callbacks.setPlannerConfig) callbacks.setPlannerConfig(fallbackPlanner);
      }

      const estimatorDb = await fetchBuildMaterialEstimatorFromSupabase();
      if (estimatorDb && typeof estimatorDb === 'object' && Array.isArray(estimatorDb.houseSizes)) {
        if (callbacks.setEstimatorConfig) callbacks.setEstimatorConfig(estimatorDb);
        safeSetLocalStorage(STORAGE_KEYS.ESTIMATOR, estimatorDb);
      } else {
        const fallbackEstimator = loadBuildMaterialEstimatorConfig();
        if (callbacks.setEstimatorConfig) callbacks.setEstimatorConfig(fallbackEstimator);
      }

      const aiAssistantDb = await fetchSiteSettingFromSupabase<AiAssistantConfig>(STORAGE_KEYS.AI_ASSISTANT);
      if (aiAssistantDb && typeof aiAssistantDb === 'object' && Object.keys(aiAssistantDb).length > 0 && ('systemInstruction' in aiAssistantDb || 'enableAiAssistant' in aiAssistantDb)) {
        if (callbacks.setAiAssistantConfig) callbacks.setAiAssistantConfig(aiAssistantDb);
        safeSetLocalStorage(STORAGE_KEYS.AI_ASSISTANT, aiAssistantDb);
      } else {
        const fallbackAi = loadAiAssistantConfig();
        if (callbacks.setAiAssistantConfig) callbacks.setAiAssistantConfig(fallbackAi);
      }

      const smartToolsDb = await fetchSiteSettingFromSupabase<SmartToolsSettings>(STORAGE_KEYS.SMART_TOOLS);
      if (smartToolsDb && typeof smartToolsDb === 'object' && Array.isArray(smartToolsDb.tools)) {
        if (callbacks.setSmartToolsSettings) callbacks.setSmartToolsSettings(smartToolsDb);
        safeSetLocalStorage(STORAGE_KEYS.SMART_TOOLS, smartToolsDb);
      } else {
        const fallbackTools = loadSmartToolsSettings();
        if (callbacks.setSmartToolsSettings) callbacks.setSmartToolsSettings(fallbackTools);
      }

      console.log('✅ Supabase PostgreSQL live synchronization complete!');
      return;
    } catch (err) {
      console.error('Failed to sync directly from Supabase, falling back to local/CMS:', err);
    }
  }

  // Fallback / standard sync with Express backend / LocalStorage
  try {
    const res = await fetch('/api/cms/load');
    const json = await res.json();
    const serverData = (json.success && json.data) ? json.data : {};
    const batchToPush: Record<string, any> = {};

    // 1. Config
    if (serverData[STORAGE_KEYS.CONFIG] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(serverData[STORAGE_KEYS.CONFIG]));
      if (callbacks.setConfig) callbacks.setConfig(serverData[STORAGE_KEYS.CONFIG]);
    } else {
      const current = loadStoredConfig();
      batchToPush[STORAGE_KEYS.CONFIG] = current;
      if (callbacks.setConfig) callbacks.setConfig(current);
    }

    // 2. Products
    if (serverData[STORAGE_KEYS.PRODUCTS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(serverData[STORAGE_KEYS.PRODUCTS]));
      if (callbacks.setProducts) callbacks.setProducts(serverData[STORAGE_KEYS.PRODUCTS]);
    } else {
      const current = loadStoredProducts();
      batchToPush[STORAGE_KEYS.PRODUCTS] = current;
      if (callbacks.setProducts) callbacks.setProducts(current);
    }

    // 3. Categories
    if (serverData[STORAGE_KEYS.CATEGORIES] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(serverData[STORAGE_KEYS.CATEGORIES]));
      if (callbacks.setCategories) callbacks.setCategories(serverData[STORAGE_KEYS.CATEGORIES]);
    } else {
      const current = loadStoredCategories();
      batchToPush[STORAGE_KEYS.CATEGORIES] = current;
      if (callbacks.setCategories) callbacks.setCategories(current);
    }

    // 4. Brands
    if (serverData[STORAGE_KEYS.BRANDS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.BRANDS, JSON.stringify(serverData[STORAGE_KEYS.BRANDS]));
      if (callbacks.setBrands) callbacks.setBrands(serverData[STORAGE_KEYS.BRANDS]);
    } else {
      const current = loadStoredBrands();
      batchToPush[STORAGE_KEYS.BRANDS] = current;
      if (callbacks.setBrands) callbacks.setBrands(current);
    }

    // 5. Stats
    if (serverData[STORAGE_KEYS.STATS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(serverData[STORAGE_KEYS.STATS]));
      if (callbacks.setStats) callbacks.setStats(serverData[STORAGE_KEYS.STATS]);
    } else {
      const current = loadStoredStats();
      batchToPush[STORAGE_KEYS.STATS] = current;
      if (callbacks.setStats) callbacks.setStats(current);
    }

    // 6. Contacts
    if (serverData[STORAGE_KEYS.CONTACTS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(serverData[STORAGE_KEYS.CONTACTS]));
      if (callbacks.setContacts) callbacks.setContacts(serverData[STORAGE_KEYS.CONTACTS]);
    } else {
      const current = loadStoredContacts();
      batchToPush[STORAGE_KEYS.CONTACTS] = current;
      if (callbacks.setContacts) callbacks.setContacts(current);
    }

    // 7. Gallery
    if (serverData[STORAGE_KEYS.GALLERY] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(serverData[STORAGE_KEYS.GALLERY]));
      if (callbacks.setGallery) callbacks.setGallery(serverData[STORAGE_KEYS.GALLERY]);
    } else {
      const current = loadStoredGallery();
      batchToPush[STORAGE_KEYS.GALLERY] = current;
      if (callbacks.setGallery) callbacks.setGallery(current);
    }

    // 8. Planner
    if (serverData[STORAGE_KEYS.PLANNER] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.PLANNER, JSON.stringify(serverData[STORAGE_KEYS.PLANNER]));
      if (callbacks.setPlannerConfig) callbacks.setPlannerConfig(serverData[STORAGE_KEYS.PLANNER]);
    } else {
      const current = loadPlannerConfig();
      batchToPush[STORAGE_KEYS.PLANNER] = current;
      if (callbacks.setPlannerConfig) callbacks.setPlannerConfig(current);
    }

    // 9. AI Assistant
    if (serverData[STORAGE_KEYS.AI_ASSISTANT] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.AI_ASSISTANT, JSON.stringify(serverData[STORAGE_KEYS.AI_ASSISTANT]));
      if (callbacks.setAiAssistantConfig) callbacks.setAiAssistantConfig(serverData[STORAGE_KEYS.AI_ASSISTANT]);
    } else {
      const current = loadAiAssistantConfig();
      batchToPush[STORAGE_KEYS.AI_ASSISTANT] = current;
      if (callbacks.setAiAssistantConfig) callbacks.setAiAssistantConfig(current);
    }

    // 10. Orders
    if (serverData[STORAGE_KEYS.ORDERS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(serverData[STORAGE_KEYS.ORDERS]));
      if (callbacks.setOrders) callbacks.setOrders(serverData[STORAGE_KEYS.ORDERS]);
    } else {
      const current = loadStoredOrders();
      batchToPush[STORAGE_KEYS.ORDERS] = current;
      if (callbacks.setOrders) callbacks.setOrders(current);
    }

    // 11. Checkout Settings
    if (serverData[STORAGE_KEYS.CHECKOUT_SETTINGS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CHECKOUT_SETTINGS, JSON.stringify(serverData[STORAGE_KEYS.CHECKOUT_SETTINGS]));
      if (callbacks.setCheckoutSettings) callbacks.setCheckoutSettings(serverData[STORAGE_KEYS.CHECKOUT_SETTINGS]);
    } else {
      const current = loadCheckoutSettings();
      batchToPush[STORAGE_KEYS.CHECKOUT_SETTINGS] = current;
      if (callbacks.setCheckoutSettings) callbacks.setCheckoutSettings(current);
    }

    // 12. Delivery Settings
    if (serverData[STORAGE_KEYS.DELIVERY_SETTINGS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.DELIVERY_SETTINGS, JSON.stringify(serverData[STORAGE_KEYS.DELIVERY_SETTINGS]));
      if (callbacks.setDeliverySettings) callbacks.setDeliverySettings(serverData[STORAGE_KEYS.DELIVERY_SETTINGS]);
    } else {
      const current = loadDeliverySettings();
      batchToPush[STORAGE_KEYS.DELIVERY_SETTINGS] = current;
      if (callbacks.setDeliverySettings) callbacks.setDeliverySettings(current);
    }

    // 13. Theme Settings
    if (serverData[STORAGE_KEYS.THEME_SETTINGS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.THEME_SETTINGS, JSON.stringify(serverData[STORAGE_KEYS.THEME_SETTINGS]));
      if (callbacks.setThemeSettings) callbacks.setThemeSettings(serverData[STORAGE_KEYS.THEME_SETTINGS]);
    } else {
      const current = loadThemeSettings();
      batchToPush[STORAGE_KEYS.THEME_SETTINGS] = current;
      if (callbacks.setThemeSettings) callbacks.setThemeSettings(current);
    }

    // 14. Announcement Settings
    if (serverData[STORAGE_KEYS.ANNOUNCEMENT_SETTINGS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, JSON.stringify(serverData[STORAGE_KEYS.ANNOUNCEMENT_SETTINGS]));
      if (callbacks.setAnnouncementSettings) callbacks.setAnnouncementSettings(serverData[STORAGE_KEYS.ANNOUNCEMENT_SETTINGS]);
    } else {
      const current = loadAnnouncementSettings();
      batchToPush[STORAGE_KEYS.ANNOUNCEMENT_SETTINGS] = current;
      if (callbacks.setAnnouncementSettings) callbacks.setAnnouncementSettings(current);
    }

    // 15. Hero Settings
    if (serverData[STORAGE_KEYS.HERO_SETTINGS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.HERO_SETTINGS, JSON.stringify(serverData[STORAGE_KEYS.HERO_SETTINGS]));
      if (callbacks.setHeroSettings) callbacks.setHeroSettings(serverData[STORAGE_KEYS.HERO_SETTINGS]);
    } else {
      const current = loadHeroSettings();
      batchToPush[STORAGE_KEYS.HERO_SETTINGS] = current;
      if (callbacks.setHeroSettings) callbacks.setHeroSettings(current);
    }

    // 16. Build Material Estimator
    if (serverData[STORAGE_KEYS.ESTIMATOR] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.ESTIMATOR, JSON.stringify(serverData[STORAGE_KEYS.ESTIMATOR]));
      if (callbacks.setEstimatorConfig) callbacks.setEstimatorConfig(serverData[STORAGE_KEYS.ESTIMATOR]);
    } else {
      const current = loadBuildMaterialEstimatorConfig();
      batchToPush[STORAGE_KEYS.ESTIMATOR] = current;
      if (callbacks.setEstimatorConfig) callbacks.setEstimatorConfig(current);
    }

    // 17. Smart Tools Settings
    if (serverData[STORAGE_KEYS.SMART_TOOLS] !== undefined) {
      localStorage.setItem(STORAGE_KEYS.SMART_TOOLS, JSON.stringify(serverData[STORAGE_KEYS.SMART_TOOLS]));
      if (callbacks.setSmartToolsSettings) callbacks.setSmartToolsSettings(serverData[STORAGE_KEYS.SMART_TOOLS]);
    } else {
      const current = loadSmartToolsSettings();
      batchToPush[STORAGE_KEYS.SMART_TOOLS] = current;
      if (callbacks.setSmartToolsSettings) callbacks.setSmartToolsSettings(current);
    }

    // Batch upload any missing keys to server in a single call
    if (Object.keys(batchToPush).length > 0) {
      await saveAllToServerCMS(batchToPush);
    }
  } catch (e) {
    console.warn('Server CMS sync skipped or unavailable:', e);
  }
};

// Aliases for convenience & backwards compatibility
export const loadStats = loadStoredStats;
export const saveStats = saveStoredStats;
export const loadConfig = loadStoredConfig;
export const saveConfig = saveStoredConfig;
export const loadProducts = loadStoredProducts;
export const saveProducts = saveStoredProducts;
export const loadCategories = loadStoredCategories;
export const saveCategories = saveStoredCategories;
export const loadGallery = loadStoredGallery;
export const saveGallery = saveStoredGallery;
export const loadBrands = loadStoredBrands;
export const saveBrands = saveStoredBrands;

export const getAdminPin = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PIN) || '8002';
  } catch (e) {
    return '8002';
  }
};

export const setAdminPin = (pin: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, pin);
  } catch (e) {
    console.error('Error saving admin pin', e);
  }
};

export const getIsAdminLoggedIn = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEYS.IS_ADMIN) === 'true';
  } catch (e) {
    return false;
  }
};

export const setIsAdminLoggedIn = (status: boolean) => {
  try {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, status ? 'true' : 'false');
  } catch (e) {
    console.error('Error saving admin login status', e);
  }
};

export const setAdminAuthToken = (token: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.IS_ADMIN, 'true');
    localStorage.setItem('zst_admin_token', token);
  } catch (e) {
    console.error('Error setting admin auth token', e);
  }
};

export const getAdminAuthToken = (): string | null => {
  try {
    return localStorage.getItem('zst_admin_token');
  } catch (e) {
    return null;
  }
};
