import { BusinessConfig, Product, ProductCategory, GalleryItem, ProductBrand, StatCounter, AiDesignerConfig, AiAssistantConfig, ContactPerson, CartItem, CustomerOrder, CheckoutSettings, DeliverySettings, CityDeliveryInfo, ThemeOption, ThemeSettings, AnnouncementBarSettings, AnnouncementItem, HeroSettings, BuildMaterialEstimatorConfig, SmartToolsSettings, FittingBuilderConfig, PricingTypographySettings, defaultPricingTypography, Coupon, CouponValidationResult, AppliedCouponState, PaymentMethodConfig, HowToOrderConfig, HowToOrderStep } from '../types';
import { initialBusinessConfig, productCategories, featuredProducts, galleryItems, productBrands, defaultStatCounters } from '../data/storeData';
import { defaultBathroomPlannerConfig } from '../data/defaultPlannerConfig';
import { defaultBuildMaterialEstimatorConfig } from '../data/defaultEstimatorConfig';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';
import { defaultFittingBuilderConfig } from '../data/defaultFittingBuilderData';
import { isSupabaseConfigured, initializeSupabaseRuntime } from '../lib/supabase';
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
  updateOrderPaymentStatusInSupabase,
  fetchPaymentMethodsFromSupabase,
  savePaymentMethodsToSupabase,
  fetchHowToOrderConfigFromSupabase,
  saveHowToOrderConfigToSupabase,
  fetchDeliveryCitiesFromSupabase,
  saveDeliveryCitiesToSupabase,
  fetchSiteSettingFromSupabase,
  saveSiteSettingToSupabase,
  fetchBuildMaterialEstimatorFromSupabase,
  saveBuildMaterialEstimatorToSupabase,
  fetchFittingBuilderConfigFromSupabase,
  saveFittingBuilderConfigToSupabase,
  fetchAiAssistantConfigFromSupabase,
  saveAiAssistantConfigToSupabase,
  fetchAiKnowledgeFromSupabase,
  upsertAiKnowledgeInSupabase,
  deleteAiKnowledgeFromSupabase
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
  FITTING_BUILDER: 'zst_fitting_builder_config_v1',
  PRICING_TYPOGRAPHY: 'zst_pricing_typography_v1',
  COUPONS: 'zst_coupons_list',
  PAYMENT_METHODS: 'zst_payment_methods_v1',
  HOW_TO_ORDER_GUIDE: 'zst_how_to_order_guide_v1',
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, JSON.stringify(settings));
    saveToServerCMS(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, settings);
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.THEME_SETTINGS, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    localStorage.setItem(STORAGE_KEYS.THEME_SETTINGS, JSON.stringify(settings));
    saveToServerCMS(STORAGE_KEYS.THEME_SETTINGS, settings);
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
  globalDeliveryType: 'standard',
  globalMinDeliveryTime: 2,
  globalMaxDeliveryTime: 4,
  globalDeliveryTimeUnit: 'Days',
  globalCustomDeliveryMessage: 'Delivery available across Punjab & major cities of Pakistan. Contact us for bulk orders.',
  globalDeliveryFeeType: 'contact',
  globalDeliveryFeeAmount: 250,
  globalDeliveryFeeText: 'Contact for exact charges',
  globalDeliveryAreaNote: 'Chiniot, Faisalabad, Lahore, Islamabad & 50+ Cities Nationwide',
  globalDeliveryNote: 'Delivery time may vary depending on exact location and product dimensions.',
  deliveryPartner: 'Leopard Courier / TCS / Private Showroom Logistics Fleet',
  storeOpeningTime: '09:00 AM',
  storeClosingTime: '09:00 PM',
  workingDays: 'Monday - Saturday',
  fridayTiming: '09:00 AM - 01:00 PM & 03:00 PM - 09:00 PM (Break for Juma Prayer 1:00 PM - 2:30 PM)',
  orderCutoffTime: '05:00 PM',
  holidaySchedule: 'Closed on Sundays & Gazetted Public Holidays',
  whatsappSupportNumber: '+92 310 8002863',
  defaultSelectedCityId: 'city-chiniot',
  enableCustomCity: true,
  customCityLabel: '➕ Custom City / Address',
  customCityNotice: 'Delivery time for this location will be confirmed by our team.',
  deliveryNotes: [
    '✓ Direct showroom delivery truck available for Chiniot, Faisalabad, Sargodha, & Lahore.',
    '✓ Nationwide tracked courier & cargo dispatch across Pakistan via TCS & Leopard.',
    '✓ Orders placed before 5:00 PM will be processed the same working day.',
    '✓ If your delivery is delayed due to weather, courier, holidays, or other operational reasons, you will be informed immediately.',
    '✓ Contact our support team on WhatsApp anytime for live tracking and special delivery arrangements.'
  ],
  cities: [
    { id: 'city-chiniot', cityName: 'Chiniot', areaTown: 'Chiniot City & Tehsil', status: 'available', estimatedDays: 'Same Day / 1 Day', deliveryFee: 0, deliveryFeeType: 'free', deliveryFeeCustomText: 'Free Local Delivery', isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 1, notes: 'Express direct delivery from our Chiniot showroom.', coverageAreas: ['Chiniot City', 'Katchery Road', 'Jhang Road', 'Faisalabad Road', 'Chenab Nagar / Rabwah', 'Bhowana', 'Lalian'] },
    { id: 'city-bhowana', cityName: 'Bhowana', areaTown: 'Bhowana Tehsil & Surrounding Area', status: 'available', estimatedDays: '1 Working Day', deliveryFee: 200, deliveryFeeType: 'fixed', isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 2, notes: 'Direct showroom vehicle route.' },
    { id: 'city-lalian', cityName: 'Lalian', areaTown: 'Lalian Tehsil & Surrounding Area', status: 'available', estimatedDays: '1 Working Day', deliveryFee: 200, deliveryFeeType: 'fixed', isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 3, notes: 'Direct showroom vehicle route.' },
    { id: 'city-faisalabad', cityName: 'Faisalabad', areaTown: 'All Towns & Industrial Zones', status: 'available', estimatedDays: '1–2 Working Days', deliveryFee: 300, deliveryFeeType: 'fixed', isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 4, notes: 'Daily delivery shuttle available.' },
    { id: 'city-jhang', cityName: 'Jhang', areaTown: 'Jhang City, Saddar & Shorkot', status: 'available', estimatedDays: '1–2 Working Days', deliveryFee: 250, deliveryFeeType: 'fixed', isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 5, notes: 'Showroom delivery route.' },
    { id: 'city-sargodha', cityName: 'Sargodha', areaTown: 'Sargodha City, Cantt & Satellite Town', status: 'available', estimatedDays: '1–2 Working Days', deliveryFee: 250, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 6, notes: 'Direct truck delivery route.' },
    { id: 'city-lahore', cityName: 'Lahore', areaTown: 'All Zones (DHA, Gulberg, Bahria, Johar Town, etc.)', status: 'available', estimatedDays: '1–2 Working Days', deliveryFee: 250, deliveryFeeType: 'fixed', isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 7, notes: 'Daily direct courier & cargo service.' },
    { id: 'city-islamabad', cityName: 'Islamabad', areaTown: 'Federal Capital (All Sectors & DHA/Bahria)', status: 'available', estimatedDays: '2–3 Working Days', deliveryFee: 350, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 8 },
    { id: 'city-rawalpindi', cityName: 'Rawalpindi', areaTown: 'Rawalpindi City & Cantt', status: 'available', estimatedDays: '2–3 Working Days', deliveryFee: 350, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 9 },
    { id: 'city-multan', cityName: 'Multan', areaTown: 'Multan Cantt, Bosan Road & City', status: 'available', estimatedDays: '2–3 Working Days', deliveryFee: 350, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 10 },
    { id: 'city-gujranwala', cityName: 'Gujranwala', areaTown: 'Gujranwala City & Cantt', status: 'available', estimatedDays: '1–2 Working Days', deliveryFee: 250, deliveryFeeType: 'fixed', isSameDayAvailable: true, isNextDayAvailable: true, isEnabled: true, displayOrder: 11 },
    { id: 'city-sialkot', cityName: 'Sialkot', areaTown: 'Sialkot City & Cantt', status: 'available', estimatedDays: '1–2 Working Days', deliveryFee: 250, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 12 },
    { id: 'city-karachi', cityName: 'Karachi', areaTown: 'All Districts & Port Area', status: 'available', estimatedDays: '3–5 Working Days', deliveryFee: 450, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 13, notes: 'Express air & overland cargo.' },
    { id: 'city-bahawalpur', cityName: 'Bahawalpur', areaTown: 'Bahawalpur City & Cantt', status: 'available', estimatedDays: '2–3 Working Days', deliveryFee: 350, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: true, isEnabled: true, displayOrder: 14 },
    { id: 'city-peshawar', cityName: 'Peshawar', areaTown: 'Peshawar City, Hayatabad & Cantt', status: 'available', estimatedDays: '3–4 Working Days', deliveryFee: 400, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 15 },
    { id: 'city-quetta', cityName: 'Quetta', areaTown: 'Quetta City & Cantt', status: 'contact_to_confirm', estimatedDays: '4–6 Working Days', deliveryFee: 500, deliveryFeeType: 'contact', isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 16, notes: 'Please contact WhatsApp to confirm cargo schedule.' },
    { id: 'city-hyderabad', cityName: 'Hyderabad', areaTown: 'Hyderabad City, Latifabad & Qasimabad', status: 'available', estimatedDays: '3–5 Working Days', deliveryFee: 450, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 17 },
    { id: 'city-sukkur', cityName: 'Sukkur', areaTown: 'Sukkur City & Rohri', status: 'available', estimatedDays: '3–4 Working Days', deliveryFee: 400, deliveryFeeType: 'fixed', isSameDayAvailable: false, isNextDayAvailable: false, isEnabled: true, displayOrder: 18 }
  ]
};

export const defaultCheckoutSettings: CheckoutSettings = {
  deliveryFee: 250,
  taxRatePercent: 0,
  enableTaxes: false,
  freeDeliveryThreshold: 50000,
  whatsappNumberOverride: '',
  codAdvanceRequired: false,
  codAdvancePercentage: 30,
  codAdvanceMinAmount: 500,
  codAdvanceInstructions: 'To confirm Cash on Delivery, a 30% advance payment is required. The remaining 70% balance is payable in cash upon doorstep delivery.',
  businessOwnerWhatsapp: '+92 300 6603063'
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
      id: "ck-owner",
      title: "Owner & Founder: Zafar Sarwar",
      category: "companyInfo",
      questionOrTopic: "Who is the Owner and Founder of Zafar Sarwar Traders? (Owner, Founder, Proprietor, Who started the business, Who owns the shop, Who established the business, Who founded the business, Main person, Head of the business, Person behind the business)",
      answerOrContent: "Zafar Sarwar is the Founder and Owner of Zafar Sarwar Traders. He established and owns the business and provides the overall vision and leadership behind the shop. The business operates under his ownership with a focus on quality products, customer satisfaction, and long-term growth.",
      isEnabled: true,
      displayOrder: 1
    },
    {
      id: "ck-ceo",
      title: "CEO: Abubakar Zafar",
      category: "companyInfo",
      questionOrTopic: "Who is the CEO of Zafar Sarwar Traders? (CEO, Chief Executive Officer, Day-to-Day Operations Manager, Management Head, Head of management, Who manages the business, Who runs the business, Who manages the shop, Main manager, Business manager)",
      answerOrContent: "Abubakar Zafar, the son of Zafar Sarwar, serves as the CEO of Zafar Sarwar Traders. He is responsible for managing the shop's day-to-day operations, business activities, administration, and overall management, working to maintain the quality and growth of the business.",
      isEnabled: true,
      displayOrder: 2
    },
    {
      id: "ck-leadership",
      title: "Business Leadership: Owner & CEO",
      category: "companyInfo",
      questionOrTopic: "Who are the Owner and CEO of Zafar Sarwar Traders? (Owner and CEO, Founder and CEO, Who runs Zafar Sarwar Traders, Who is behind Zafar Sarwar Traders, Who is in charge, Who leads the business, Management team, Shop management, Seller, Main person)",
      answerOrContent: "Zafar Sarwar is the Founder and Owner of Zafar Sarwar Traders, while his son, Abubakar Zafar, serves as the CEO and oversees the day-to-day management and operations of the business.",
      isEnabled: true,
      displayOrder: 3
    },
    {
      id: "ck-1",
      title: "Showroom Hours & Live Testing",
      category: "general",
      questionOrTopic: "Where is the showroom and can we test products live?",
      answerOrContent: "Zafar Sarwar Traders showroom features live water pressure test benches for rain showers and designer mixers. Hours: Mon-Sat 9:00 AM - 9:00 PM (Friday break 1:00 PM - 2:30 PM for Juma Prayer). Closed on Sundays.",
      isEnabled: true,
      displayOrder: 4
    },
    {
      id: "ck-2",
      title: "100% Original Brand Warranty",
      category: "warranty",
      questionOrTopic: "Are all products original and covered by brand warranty?",
      answerOrContent: "Yes, every product sold by Zafar Sarwar Traders (Sonex, Faisal, Master, Hansgrohe, Grohe) is 100% original and comes with official manufacturer cartridge and brass finish warranties ranging from 10 to 25 years.",
      isEnabled: true,
      displayOrder: 5
    },
    {
      id: "ck-3",
      title: "Express Nationwide Courier & Fleet Shipping",
      category: "shipping",
      questionOrTopic: "How does delivery work across Pakistan?",
      answerOrContent: "We deliver across Pakistan using TCS, Leopard Courier, and our showroom fleet. Major cities: Lahore (1-2 days), Islamabad/Rawalpindi (2-3 days), Karachi (3-5 days). Free express delivery on orders over PKR 50,000.",
      isEnabled: true,
      displayOrder: 6
    },
    {
      id: "ck-4",
      title: "Wholesale & Contractor Quotations",
      category: "policy",
      questionOrTopic: "Do you offer wholesale bulk discounts for builders and plumbers?",
      answerOrContent: "Yes! We provide special itemized quotations and volume trade discounts for commercial projects, residential plazas, and plumbing contractors. Direct WhatsApp consultation is available.",
      isEnabled: true,
      displayOrder: 7
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
        // Ensure default leadership knowledge entries are preserved
        const mergedKnowledge = [...defaultAiAssistantConfig.customKnowledge];
        if (Array.isArray(parsed.customKnowledge)) {
          parsed.customKnowledge.forEach((item: any) => {
            const idx = mergedKnowledge.findIndex(k => k.id === item.id);
            if (idx >= 0) {
              mergedKnowledge[idx] = { ...mergedKnowledge[idx], ...item };
            } else {
              mergedKnowledge.push(item);
            }
          });
        }
        return { ...defaultAiAssistantConfig, ...parsed, customKnowledge: mergedKnowledge };
      }
    }
  } catch (e) {
    console.error('Error loading AI assistant config', e);
  }
  return defaultAiAssistantConfig;
};

export const saveAiAssistantConfig = async (config: AiAssistantConfig): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await saveAiAssistantConfigToSupabase(config);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.AI_ASSISTANT, config);
    saveToServerCMS(STORAGE_KEYS.AI_ASSISTANT, config);
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.CONFIG, config);
      if (!res.success) return { success: false, error: res.error };
    }
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    saveToServerCMS(STORAGE_KEYS.CONFIG, config);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving stored config', e);
    return { success: false, error: e?.message || String(e) };
  }
};

const sanitizeProductForLocalStorage = (p: Product): Partial<Product> => {
  const isDataUrl = (str?: string) => Boolean(str && (str.startsWith('data:') || str.startsWith('blob:')));
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    categoryId: p.categoryId,
    brand: p.brand,
    brandId: p.brandId,
    price: p.price,
    salePrice: p.salePrice,
    saleEnabled: p.saleEnabled,
    saleStartDate: p.saleStartDate,
    saleEndDate: p.saleEndDate,
    saleLabel: p.saleLabel,
    saleBadgeColor: p.saleBadgeColor,
    saleMessage: p.saleMessage,
    showSaleCountdown: p.showSaleCountdown,
    showDiscountPercentage: p.showDiscountPercentage,
    showSavingsAmount: p.showSavingsAmount,
    saleConfig: p.saleConfig,
    image: isDataUrl(p.image) ? '' : p.image,
    images: Array.isArray(p.images) ? p.images.filter(img => !isDataUrl(img)).slice(0, 3) : undefined,
    badge: p.badge,
    isFeatured: p.isFeatured,
    stockStatus: p.stockStatus,
    stockQuantity: p.stockQuantity,
    sku: p.sku,
    rating: p.rating,
    reviewsCount: p.reviewsCount,
    displayOrder: p.displayOrder,
    description: typeof p.description === 'string' ? p.description.slice(0, 200) : ''
  };
};

export const safeSetLocalStorage = (key: string, value: any): boolean => {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    const strVal = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, strVal);
    return true;
  } catch (e: any) {
    console.warn(`[storage] LocalStorage quota reached or error for key "${key}", safely skipped.`, e?.message);
    return false;
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

export const saveStoredProductSingle = async (product: Product): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await upsertProductInSupabase(product);
      if (res && res.success === false) {
        console.error('[Supabase Save Error] Single product save returned error:', res.error);
        return { success: false, error: res.error };
      }
    }
    const current = loadStoredProducts();
    const existingIndex = current.findIndex(p => p.id === product.id);
    let updated: Product[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = product;
    } else {
      updated = [product, ...current];
    }
    const sanitized = updated.map(sanitizeProductForLocalStorage);
    safeSetLocalStorage(STORAGE_KEYS.PRODUCTS, sanitized);
    saveToServerCMS(STORAGE_KEYS.PRODUCTS, updated);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving single product', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const saveStoredProducts = async (products: Product[]): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await upsertProductInSupabase(products);
      if (res && res.success === false) {
        console.error('[Supabase Save Error] Product save returned error:', res.error);
        return { success: false, error: res.error };
      }
    }
    // Quota-safe lightweight caching (no base64/blobs to avoid storage overflow)
    const sanitized = Array.isArray(products) ? products.map(sanitizeProductForLocalStorage) : [];
    safeSetLocalStorage(STORAGE_KEYS.PRODUCTS, sanitized);
    saveToServerCMS(STORAGE_KEYS.PRODUCTS, products);
    console.log('[Supabase Direct SDK] Products saved and local state cached successfully');
    return { success: true };
  } catch (e: any) {
    console.error('Error saving stored products', e);
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
    const sanitized = updated.map(sanitizeProductForLocalStorage);
    safeSetLocalStorage(STORAGE_KEYS.PRODUCTS, sanitized);
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

export const saveStoredCategorySingle = async (category: ProductCategory): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await upsertCategoryInSupabase(category);
      if (res && !res.success) {
        console.error('Failed to save single category to Supabase:', res.error);
        return { success: false, error: res.error };
      }
    }
    const current = loadStoredCategories();
    const existingIndex = current.findIndex(c => c.id === category.id);
    let updated: ProductCategory[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = category;
    } else {
      updated = [...current, category];
    }
    safeSetLocalStorage(STORAGE_KEYS.CATEGORIES, updated);
    saveToServerCMS(STORAGE_KEYS.CATEGORIES, updated);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving single category', e);
    return { success: false, error: e?.message || String(e) };
  }
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
    safeSetLocalStorage(STORAGE_KEYS.CATEGORIES, categories);
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
    safeSetLocalStorage(STORAGE_KEYS.CATEGORIES, updated);
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.GALLERY, items);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.GALLERY, items);
    saveToServerCMS(STORAGE_KEYS.GALLERY, items);
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

export const saveStoredBrandSingle = async (brand: ProductBrand): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await upsertBrandInSupabase(brand);
      if (res && !res.success) {
        console.error('Failed to save single brand to Supabase:', res.error);
        return { success: false, error: res.error };
      }
    }
    const current = loadStoredBrands();
    const existingIndex = current.findIndex(b => b.id === brand.id);
    let updated: ProductBrand[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = brand;
    } else {
      updated = [...current, brand];
    }
    safeSetLocalStorage(STORAGE_KEYS.BRANDS, updated);
    saveToServerCMS(STORAGE_KEYS.BRANDS, updated);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving single brand', e);
    return { success: false, error: e?.message || String(e) };
  }
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
    safeSetLocalStorage(STORAGE_KEYS.BRANDS, brands);
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
    safeSetLocalStorage(STORAGE_KEYS.BRANDS, updated);
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.STATS, stats);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.STATS, stats);
    saveToServerCMS(STORAGE_KEYS.STATS, stats);
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.PLANNER, config);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.PLANNER, config);
    saveToServerCMS(STORAGE_KEYS.PLANNER, config);
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
    if (isSupabaseConfigured) {
      const res = await saveBuildMaterialEstimatorToSupabase(config);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.ESTIMATOR, config);
    saveToServerCMS(STORAGE_KEYS.ESTIMATOR, config);
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.CONTACTS, contacts);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.CONTACTS, contacts);
    saveToServerCMS(STORAGE_KEYS.CONTACTS, contacts);
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
  safeSetLocalStorage(STORAGE_KEYS.CART, cart);
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
  safeSetLocalStorage(STORAGE_KEYS.ORDERS, orders);
  saveToServerCMS(STORAGE_KEYS.ORDERS, orders);
};

/**
 * Creates a lightweight placeholder for a Delivered order to free backend database storage
 * while preserving customer frontend order history and delivery receipt.
 */
export const createLightweightOrderPlaceholder = (order: CustomerOrder): CustomerOrder => {
  return {
    id: order.id,
    orderNumber: order.orderNumber || order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    phoneNumber: order.phoneNumber || (order as any).customerPhone || '',
    whatsappNumber: order.whatsappNumber,
    city: order.city || '',
    areaLocality: order.areaLocality,
    deliveryAddress: order.deliveryAddress || '',
    subtotal: order.subtotal || order.grandTotal || 0,
    deliveryCharges: order.deliveryCharges || 0,
    taxAmount: order.taxAmount || 0,
    grandTotal: order.grandTotal || 0,
    createdAt: order.createdAt,
    status: 'Delivered',
    paymentStatus: 'Payment Verified',
    paymentMethodName: order.paymentMethodName || 'Cash on Delivery',
    isStorageOptimized: true,
    storageOptimizedAt: new Date().toISOString(),
    deliveredAt: order.deliveredAt || (order as any).updatedAt || new Date().toISOString(),
    items: (order.items || []).map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice || String(item.numericPrice || 0),
      numericPrice: item.numericPrice || 0,
      lineTotal: item.lineTotal || ((item.numericPrice || 0) * (item.quantity || 1)),
      selectedVariant: item.selectedVariant,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor
    }))
  };
};

export const addOrderToStorage = async (order: CustomerOrder): Promise<{ success: boolean; orderId: string; error?: string }> => {
  try {
    // 1. Always persist locally and to server CMS disk first so the customer order is never lost
    const existing = loadStoredOrders();
    const updated = [order, ...existing.filter(o => o.id !== order.id)];
    saveStoredOrders(updated);

    // 2. Sync to Supabase PostgreSQL database if configured
    if (isSupabaseConfigured) {
      const res = await createOrderInSupabase(order);
      if (!res.success) {
        console.warn('[Storage] Order saved locally and to backend CMS, but Supabase sync reported a notice:', res.error);
        return { success: true, orderId: order.id, error: res.error };
      }
    }
    return { success: true, orderId: order.id };
  } catch (err: any) {
    console.warn('[Storage] addOrderToStorage caught error:', err);
    return { success: true, orderId: order.id, error: err?.message || String(err) };
  }
};

export const updateOrderStatusInStorage = async (orderId: string, status: CustomerOrder['status'], note?: string): Promise<boolean> => {
  try {
    const existing = loadStoredOrders();
    const updated = existing.map(o => {
      if (o.id === orderId) {
        const history = Array.isArray(o.statusHistory) ? [...o.statusHistory] : [];
        history.push({ status, timestamp: new Date().toISOString(), note });
        return { ...o, status, statusHistory: history, updatedAt: new Date().toISOString() };
      }
      return o;
    });
    saveStoredOrders(updated);

    try {
      window.dispatchEvent(new CustomEvent('zst_order_status_updated', { detail: { orderId, status, note } }));
    } catch {}

    if (isSupabaseConfigured) {
      await updateOrderStatusInSupabase(orderId, status, note);
    }
    return true;
  } catch (err) {
    console.error('Error updating order status:', err);
    return false;
  }
};

export const updateOrderPaymentStatusInStorage = async (
  orderId: string, 
  paymentStatus: CustomerOrder['paymentStatus'], 
  orderStatus?: CustomerOrder['status'], 
  note?: string,
  rejectionReason?: string
): Promise<boolean> => {
  try {
    const existing = loadStoredOrders();
    const updated = existing.map(o => {
      if (o.id === orderId) {
        const history = Array.isArray(o.statusHistory) ? [...o.statusHistory] : [];
        const effectiveStatus = orderStatus || (paymentStatus === 'Payment Verified' ? 'Order Confirmed' : (paymentStatus === 'Payment Rejected' ? 'Payment Rejected' : o.status));
        history.push({ 
          status: effectiveStatus, 
          timestamp: new Date().toISOString(), 
          note: note || (paymentStatus === 'Payment Rejected' ? `Payment rejected: ${rejectionReason || 'Receipt invalid'}` : `Payment status updated to ${paymentStatus}`),
          updatedBy: 'Admin'
        });
        return { 
          ...o, 
          paymentStatus, 
          status: effectiveStatus,
          statusHistory: history, 
          paymentVerifiedAt: paymentStatus === 'Payment Verified' ? new Date().toISOString() : o.paymentVerifiedAt,
          paymentVerifiedBy: paymentStatus === 'Payment Verified' ? 'Admin' : o.paymentVerifiedBy,
          paymentRejectionReason: paymentStatus === 'Payment Rejected' ? (rejectionReason || note || 'Payment verification failed') : undefined,
          paymentNotes: note || o.paymentNotes,
          updatedAt: new Date().toISOString() 
        };
      }
      return o;
    });
    saveStoredOrders(updated);

    try {
      window.dispatchEvent(new CustomEvent('zst_order_status_updated', { detail: { orderId, paymentStatus, orderStatus } }));
    } catch {}

    if (isSupabaseConfigured) {
      await updateOrderPaymentStatusInSupabase(orderId, paymentStatus, orderStatus, note, rejectionReason, 'Admin');
    }
    return true;
  } catch (err) {
    console.error('Error updating order payment status:', err);
    return false;
  }
};

export const defaultPaymentMethods: PaymentMethodConfig[] = [
  {
    id: 'cod',
    type: 'cod',
    name: 'Cash on Delivery (COD)',
    isEnabled: true,
    requiresProof: false,
    displayOrder: 1,
    badgeText: 'Pay on Delivery',
    instructions: 'Pay conveniently with cash when your package is delivered to your doorstep. Please keep the exact amount ready upon delivery.',
    whatsappNumber: '+92 310 8002863'
  },
  {
    id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer (Meezan Bank)',
    isEnabled: true,
    requiresProof: true,
    displayOrder: 2,
    badgeText: 'Online Banking / ATM',
    bankName: 'Meezan Bank Ltd.',
    accountTitle: 'Zafar Sarwar Traders',
    accountNumber: '02010108920192',
    iban: 'PK64MEZN0002010108920192',
    instructions: 'Please transfer the exact order total to our Meezan Bank account via mobile banking or ATM. After transferring, take a clear screenshot of the transaction receipt and upload it below.',
    whatsappNumber: '+92 310 8002863'
  },
  {
    id: 'easypaisa',
    type: 'easypaisa',
    name: 'Easypaisa Mobile Account',
    isEnabled: true,
    requiresProof: true,
    displayOrder: 3,
    badgeText: 'Instant Transfer',
    bankName: 'Telenor Microfinance Bank',
    accountTitle: 'Zafar Sarwar',
    accountNumber: '03108002863',
    instructions: 'Send the bill amount via Easypaisa App or dial *786#. After successful transfer, upload the confirmation receipt screenshot below to submit proof.',
    whatsappNumber: '+92 310 8002863'
  },
  {
    id: 'jazzcash',
    type: 'jazzcash',
    name: 'JazzCash Mobile Account',
    isEnabled: true,
    requiresProof: true,
    displayOrder: 4,
    badgeText: 'Instant Transfer',
    bankName: 'Mobilink Microfinance Bank',
    accountTitle: 'Zafar Sarwar',
    accountNumber: '03006603063',
    instructions: 'Send money via the JazzCash App or dial *786#. Upload the transaction confirmation screenshot below to submit proof.',
    whatsappNumber: '+92 310 8002863'
  }
];

export const loadPaymentMethods = (): PaymentMethodConfig[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading payment methods from storage', e);
  }
  return defaultPaymentMethods;
};

export const savePaymentMethods = async (methods: PaymentMethodConfig[]): Promise<{ success: boolean; error?: string }> => {
  try {
    safeSetLocalStorage(STORAGE_KEYS.PAYMENT_METHODS, methods);
    saveToServerCMS(STORAGE_KEYS.PAYMENT_METHODS, methods);
    if (isSupabaseConfigured) {
      const res = await savePaymentMethodsToSupabase(methods);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving payment methods', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const defaultHowToOrderConfig: HowToOrderConfig = {
  isEnabled: true,
  buttonLabel: 'Learn how to order',
  title: 'Step-by-Step Guide: How to Place Your Order',
  subtitle: 'Follow these quick steps to order sanitary ware, water pumps, CP fittings, and plumbing materials with ease.',
  supportPhone: '+92 310 8002863',
  supportWhatsapp: '+92 310 8002863',
  customNote: 'All orders are verified by our team prior to dispatch. Need assistance? Tap the WhatsApp button to chat with our product specialist.',
  steps: [
    {
      id: 'step-1',
      stepNumber: 1,
      title: 'Browse & Add Items to Cart',
      description: 'Explore our catalog of luxury CP fittings, wash basins, sanitary ware, water pumps, and plumbing pipes. Select your desired color/variants and click "Add to Cart".',
      tip: 'You can review quantities and apply coupon promo codes directly on the Cart review step.',
      icon: 'cart'
    },
    {
      id: 'step-2',
      stepNumber: 2,
      title: 'Enter Customer Contact Information',
      description: 'Provide your full name and active mobile number. Please ensure your WhatsApp number is accurate so we can send your instant order confirmation and tracking alerts.',
      tip: 'Existing customers can click "Auto-fill Contact" to instantly load saved profile details.',
      icon: 'user'
    },
    {
      id: 'step-3',
      stepNumber: 3,
      title: 'Provide Accurate Delivery Address',
      description: 'Select your delivery city (Chiniot, Lahore, Faisalabad, Islamabad, Karachi, etc.) and enter your detailed street address and nearby landmark for courier dispatch.',
      tip: 'Delivery charges and estimated transit time are automatically calculated based on your city.',
      icon: 'map-pin'
    },
    {
      id: 'step-4',
      stepNumber: 4,
      title: 'Select Your Preferred Payment Method',
      description: 'Choose between Cash on Delivery (COD), Meezan Bank Direct Transfer, EasyPaisa, or JazzCash.',
      tip: 'For COD on bulk or special orders, a small advance payment may be required to confirm dispatch.',
      icon: 'credit-card'
    },
    {
      id: 'step-5',
      stepNumber: 5,
      title: 'Upload Payment Receipt (Online / Advance)',
      description: 'If you selected Bank Transfer, EasyPaisa, or JazzCash, transfer the required amount to our official account details displayed on screen and attach a screenshot receipt.',
      tip: 'You can take a screenshot on your mobile banking app and upload the image directly.',
      icon: 'upload'
    },
    {
      id: 'step-6',
      stepNumber: 6,
      title: 'Instant Order Confirmation & Live Tracking',
      description: 'Once submitted, you will receive a unique Order ID (e.g. ZST-00001). Our accounts team verifies the payment proof and dispatches your order with real-time tracking.',
      tip: 'You can track your parcel live anytime using the Track Order button or through WhatsApp.',
      icon: 'check-circle'
    }
  ]
};

export const loadHowToOrderConfig = (): HowToOrderConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.HOW_TO_ORDER_GUIDE);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.steps) && parsed.steps.length > 0) {
        return { ...defaultHowToOrderConfig, ...parsed };
      }
    }
  } catch (e) {
    console.error('Error loading how to order config from storage', e);
  }
  return defaultHowToOrderConfig;
};

export const saveHowToOrderConfig = async (config: HowToOrderConfig): Promise<{ success: boolean; error?: string }> => {
  try {
    const payload: HowToOrderConfig = {
      ...config,
      updatedAt: new Date().toISOString()
    };
    safeSetLocalStorage(STORAGE_KEYS.HOW_TO_ORDER_GUIDE, payload);
    saveToServerCMS(STORAGE_KEYS.HOW_TO_ORDER_GUIDE, payload);
    try {
      window.dispatchEvent(new CustomEvent('zst_how_to_order_updated', { detail: payload }));
    } catch {}

    if (isSupabaseConfigured) {
      const res = await saveHowToOrderConfigToSupabase(payload);
      if (!res.success) return { success: false, error: res.error };
    }
    return { success: true };
  } catch (e: any) {
    console.error('Error saving how to order config', e);
    return { success: false, error: e?.message || String(e) };
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.CHECKOUT_SETTINGS, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.CHECKOUT_SETTINGS, settings);
    saveToServerCMS(STORAGE_KEYS.CHECKOUT_SETTINGS, settings);
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.DELIVERY_SETTINGS, settings);
      if (!res.success) return { success: false, error: res.error };
      const citiesList = settings.cities || (settings as any).cityDeliveryList;
      if (citiesList) {
        await saveDeliveryCitiesToSupabase(citiesList);
      }
    }
    safeSetLocalStorage(STORAGE_KEYS.DELIVERY_SETTINGS, settings);
    saveToServerCMS(STORAGE_KEYS.DELIVERY_SETTINGS, settings);
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
    if (isSupabaseConfigured) {
      const res = await saveHeroSettingsToSupabase(settings);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.HERO_SETTINGS, settings);
    saveToServerCMS(STORAGE_KEYS.HERO_SETTINGS, settings);
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
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.SMART_TOOLS, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.SMART_TOOLS, settings);
    saveToServerCMS(STORAGE_KEYS.SMART_TOOLS, settings);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving smart tools settings', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const loadFittingBuilderConfig = (): FittingBuilderConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.FITTING_BUILDER);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.packageTypes) && Array.isArray(parsed.items) && parsed.items.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading fitting builder config', e);
  }
  return defaultFittingBuilderConfig;
};

export const saveFittingBuilderConfig = async (config: FittingBuilderConfig): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await saveFittingBuilderConfigToSupabase(config);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.FITTING_BUILDER, config);
    saveToServerCMS(STORAGE_KEYS.FITTING_BUILDER, config);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving fitting builder config', e);
    return { success: false, error: e?.message || String(e) };
  }
};

export const applyPricingTypographyToRoot = (settings: PricingTypographySettings) => {
  if (typeof document === 'undefined') return;
  try {
    const root = document.documentElement;
    const safe: PricingTypographySettings = { ...defaultPricingTypography, ...(settings || {}) };

    // CSS variables for product price typography
    root.style.setProperty('--product-price-color', safe.color || '#e5a93d');
    root.style.setProperty('--product-price-weight', safe.fontWeight || '700');

    const fontVal = (safe.fontFamily || 'Plus Jakarta Sans').trim();
    if (fontVal === 'System Sans' || fontVal === 'Default') {
      root.style.setProperty('--product-price-font', '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
    } else {
      root.style.setProperty('--product-price-font', `"${fontVal}", sans-serif`);
      
      // Dynamically load Google Font if not a system font
      const googleFontFamilies = ['Inter', 'Poppins', 'Montserrat', 'Roboto', 'Open Sans', 'Lato', 'Playfair Display', 'DM Sans', 'Plus Jakarta Sans'];
      if (googleFontFamilies.includes(fontVal)) {
        const fontId = 'google-font-price-typography';
        let linkEl = document.getElementById(fontId) as HTMLLinkElement | null;
        const fontParam = encodeURIComponent(fontVal);
        const href = `https://fonts.googleapis.com/css2?family=${fontParam}:wght@400;500;600;700;800&display=swap`;
        if (!linkEl) {
          linkEl = document.createElement('link');
          linkEl.id = fontId;
          linkEl.rel = 'stylesheet';
          document.head.appendChild(linkEl);
        }
        if (linkEl.href !== href) {
          linkEl.href = href;
        }
      }
    }

    const scaleMap: Record<string, string> = {
      sm: '0.9',
      md: '1.0',
      lg: '1.15',
      xl: '1.3'
    };
    root.style.setProperty('--product-price-scale', scaleMap[safe.fontSizeScale] || '1.0');

    const spacingMap: Record<string, string> = {
      tight: '-0.025em',
      normal: '0em',
      wide: '0.05em'
    };
    root.style.setProperty('--product-price-letter-spacing', spacingMap[safe.letterSpacing || 'normal'] || '0em');
    root.style.setProperty('--product-price-style', safe.priceStyle === 'semibold' ? 'normal' : (safe.priceStyle || 'normal'));
  } catch (e) {
    console.warn('Error applying pricing typography to root', e);
  }
};

export const loadPricingTypographySettings = (): PricingTypographySettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PRICING_TYPOGRAPHY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.color) {
        const config = { ...defaultPricingTypography, ...parsed };
        applyPricingTypographyToRoot(config);
        return config;
      }
    }
  } catch (e) {
    console.error('Error loading pricing typography settings', e);
  }
  applyPricingTypographyToRoot(defaultPricingTypography);
  return defaultPricingTypography;
};

export const savePricingTypographySettings = async (settings: PricingTypographySettings): Promise<{ success: boolean; error?: string }> => {
  try {
    if (isSupabaseConfigured) {
      const res = await saveSiteSettingToSupabase(STORAGE_KEYS.PRICING_TYPOGRAPHY, settings);
      if (!res.success) return { success: false, error: res.error };
    }
    safeSetLocalStorage(STORAGE_KEYS.PRICING_TYPOGRAPHY, settings);
    saveToServerCMS(STORAGE_KEYS.PRICING_TYPOGRAPHY, settings);
    applyPricingTypographyToRoot(settings);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving pricing typography settings', e);
    return { success: false, error: e?.message || String(e) };
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
  setFittingBuilderConfig?: (fc: FittingBuilderConfig) => void;
  setAiAssistantConfig?: (ac: AiAssistantConfig) => void;
  setOrders?: (o: CustomerOrder[]) => void;
  setCheckoutSettings?: (cs: CheckoutSettings) => void;
  setDeliverySettings?: (ds: DeliverySettings) => void;
  setThemeSettings?: (ts: ThemeSettings) => void;
  setAnnouncementSettings?: (as: AnnouncementBarSettings) => void;
  setHeroSettings?: (hs: HeroSettings) => void;
  setSmartToolsSettings?: (st: SmartToolsSettings) => void;
  setPricingTypography?: (pt: PricingTypographySettings) => void;
  customerId?: string;
}) => {
  await initializeSupabaseRuntime();
  try {
    console.log('🔄 [Supabase & Backend Sync] Starting fast prioritized parallel sync...');

    // PRIORITY BATCH 1 (Core Store & Catalog): Run in parallel so products, categories, brands, hero and config load immediately
    const [
      catsResult,
      brandsResult,
      productsResult,
      heroResult,
      configResult,
      pricingTypoResult
    ] = await Promise.allSettled([
      fetchCategoriesFromSupabase(),
      fetchBrandsFromSupabase(),
      fetchProductsFromSupabase(),
      fetchHeroSettingsFromSupabase(),
      fetchSiteSettingFromSupabase<BusinessConfig>(STORAGE_KEYS.CONFIG),
      fetchSiteSettingFromSupabase<PricingTypographySettings>(STORAGE_KEYS.PRICING_TYPOGRAPHY)
    ]);

    // 1. Categories
    if (catsResult.status === 'fulfilled' && catsResult.value && Array.isArray(catsResult.value) && catsResult.value.length > 0) {
      if (callbacks.setCategories) callbacks.setCategories(catsResult.value);
      safeSetLocalStorage(STORAGE_KEYS.CATEGORIES, catsResult.value);
      console.log(`[Sync] Categories loaded into React state: ${catsResult.value.length}`);
    } else {
      const fallbackCats = loadStoredCategories();
      if (callbacks.setCategories) callbacks.setCategories(fallbackCats);
    }

    // 2. Brands
    if (brandsResult.status === 'fulfilled' && brandsResult.value && Array.isArray(brandsResult.value) && brandsResult.value.length > 0) {
      if (callbacks.setBrands) callbacks.setBrands(brandsResult.value);
      safeSetLocalStorage(STORAGE_KEYS.BRANDS, brandsResult.value);
      console.log(`[Sync] Brands loaded into React state: ${brandsResult.value.length}`);
    } else {
      const fallbackBrands = loadStoredBrands();
      if (callbacks.setBrands) callbacks.setBrands(fallbackBrands);
    }

    // 3. Products
    if (productsResult.status === 'fulfilled' && productsResult.value && Array.isArray(productsResult.value) && productsResult.value.length > 0) {
      console.log(`[Sync] Products loaded into React state: ${productsResult.value.length}`);
      if (callbacks.setProducts) callbacks.setProducts(productsResult.value);
      const sanitized = productsResult.value.map(sanitizeProductForLocalStorage);
      safeSetLocalStorage(STORAGE_KEYS.PRODUCTS, sanitized);
    } else {
      const stored = loadStoredProducts();
      if (stored && stored.length > 0) {
        console.log('[Sync] Using local products cache:', stored.length);
        if (callbacks.setProducts) callbacks.setProducts(stored);
      }
    }

    // 4. Hero Settings
    if (heroResult.status === 'fulfilled' && heroResult.value) {
      if (callbacks.setHeroSettings) callbacks.setHeroSettings(heroResult.value);
      safeSetLocalStorage(STORAGE_KEYS.HERO_SETTINGS, heroResult.value);
      console.log('[Sync] Hero settings loaded into React state');
    } else {
      const fallbackHero = loadHeroSettings();
      if (callbacks.setHeroSettings) callbacks.setHeroSettings(fallbackHero);
    }

    // 5. Config
    if (configResult.status === 'fulfilled' && configResult.value && typeof configResult.value === 'object' && Object.keys(configResult.value).length > 0) {
      const mergedConfig = { ...loadStoredConfig(), ...configResult.value };
      if (callbacks.setConfig) callbacks.setConfig(mergedConfig);
      safeSetLocalStorage(STORAGE_KEYS.CONFIG, mergedConfig);
    } else {
      const fallbackConfig = loadStoredConfig();
      if (callbacks.setConfig) callbacks.setConfig(fallbackConfig);
    }

    // 6. Pricing Typography
    if (pricingTypoResult.status === 'fulfilled' && pricingTypoResult.value && typeof pricingTypoResult.value === 'object' && pricingTypoResult.value.color) {
      if (callbacks.setPricingTypography) callbacks.setPricingTypography(pricingTypoResult.value);
      safeSetLocalStorage(STORAGE_KEYS.PRICING_TYPOGRAPHY, pricingTypoResult.value);
      applyPricingTypographyToRoot(pricingTypoResult.value);
    } else {
      const fallbackPricingTypo = loadPricingTypographySettings();
      if (callbacks.setPricingTypography) callbacks.setPricingTypography(fallbackPricingTypo);
      applyPricingTypographyToRoot(fallbackPricingTypo);
    }

    // PRIORITY BATCH 2 (Secondary Tools & Admin Settings): Run concurrently in parallel
    const [
      ordersResult,
      citiesResult,
      announcementResult,
      themeResult,
      checkoutResult,
      deliveryResult,
      statsResult,
      contactsResult,
      galleryResult,
      plannerResult,
      estimatorResult,
      fittingResult,
      aiResult,
      smartToolsResult,
      couponsResult,
      howToOrderResult
    ] = await Promise.allSettled([
      fetchOrdersFromSupabase(callbacks.customerId),
      fetchDeliveryCitiesFromSupabase(),
      fetchSiteSettingFromSupabase<AnnouncementBarSettings>(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS),
      fetchSiteSettingFromSupabase<ThemeSettings>(STORAGE_KEYS.THEME_SETTINGS),
      fetchSiteSettingFromSupabase<CheckoutSettings>(STORAGE_KEYS.CHECKOUT_SETTINGS),
      fetchSiteSettingFromSupabase<DeliverySettings>(STORAGE_KEYS.DELIVERY_SETTINGS),
      fetchSiteSettingFromSupabase<StatCounter[]>(STORAGE_KEYS.STATS),
      fetchSiteSettingFromSupabase<ContactPerson[]>(STORAGE_KEYS.CONTACTS),
      fetchSiteSettingFromSupabase<GalleryItem[]>(STORAGE_KEYS.GALLERY),
      fetchSiteSettingFromSupabase<AiDesignerConfig>(STORAGE_KEYS.PLANNER),
      fetchBuildMaterialEstimatorFromSupabase(),
      fetchFittingBuilderConfigFromSupabase(),
      fetchAiAssistantConfigFromSupabase(),
      fetchSiteSettingFromSupabase<SmartToolsSettings>(STORAGE_KEYS.SMART_TOOLS),
      fetchSiteSettingFromSupabase<Coupon[]>(STORAGE_KEYS.COUPONS),
      fetchHowToOrderConfigFromSupabase()
    ]);

    // Orders
    if (ordersResult.status === 'fulfilled' && ordersResult.value !== null && callbacks.setOrders) {
      const local = loadStoredOrders();
      const orderMap = new Map<string, CustomerOrder>();
      (local || []).forEach(o => { if (o && o.id) orderMap.set(o.id, o); });

      ordersResult.value.forEach(o => {
        if (o && o.id) {
          const existing = orderMap.get(o.id);
          const isExistingVerified = 
            existing?.paymentStatus === 'Payment Verified' || 
            existing?.paymentStatus === 'Payment Confirmed' ||
            Boolean(existing?.paymentVerifiedAt);
          const mergedPaymentStatus = (isExistingVerified && o.paymentStatus !== 'Payment Rejected')
            ? 'Payment Verified'
            : (o.paymentStatus || existing?.paymentStatus);

          orderMap.set(o.id, { 
            ...(existing || {}), 
            ...o,
            isStorageOptimized: existing?.isStorageOptimized || o.isStorageOptimized,
            paymentStatus: mergedPaymentStatus,
            paymentVerifiedAt: isExistingVerified ? (existing?.paymentVerifiedAt || o.paymentVerifiedAt || new Date().toISOString()) : o.paymentVerifiedAt,
            paymentVerifiedBy: isExistingVerified ? (existing?.paymentVerifiedBy || o.paymentVerifiedBy || 'Admin') : o.paymentVerifiedBy
          });
        }
      });

      const allMerged = Array.from(orderMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (callbacks.customerId) {
        // For customer-specific view, show remote orders plus any local storage-optimized orders for this customer
        const customerFiltered = allMerged.filter(o => {
          return o.customerId === callbacks.customerId || 
                 (o.phoneNumber && callbacks.customerId && o.phoneNumber.replace(/\D/g, '') === callbacks.customerId.replace(/\D/g, ''));
        });
        callbacks.setOrders(customerFiltered);
      } else {
        callbacks.setOrders(allMerged);
        safeSetLocalStorage(STORAGE_KEYS.ORDERS, allMerged);
      }
    }

    // Delivery Cities
    if (citiesResult.status === 'fulfilled' && citiesResult.value && citiesResult.value.length > 0) {
      const currentDeliverySettings = loadDeliverySettings();
      const updatedDeliverySettings = { ...currentDeliverySettings, cities: citiesResult.value };
      if (callbacks.setDeliverySettings) callbacks.setDeliverySettings(updatedDeliverySettings);
      safeSetLocalStorage(STORAGE_KEYS.DELIVERY_SETTINGS, updatedDeliverySettings);
    }

    // Announcements
    if (announcementResult.status === 'fulfilled' && announcementResult.value && typeof announcementResult.value === 'object') {
      if (callbacks.setAnnouncementSettings) callbacks.setAnnouncementSettings(announcementResult.value);
      safeSetLocalStorage(STORAGE_KEYS.ANNOUNCEMENT_SETTINGS, announcementResult.value);
    } else {
      const fallbackAnn = loadAnnouncementSettings();
      if (callbacks.setAnnouncementSettings) callbacks.setAnnouncementSettings(fallbackAnn);
    }

    // Theme
    if (themeResult.status === 'fulfilled' && themeResult.value && typeof themeResult.value === 'object' && Object.keys(themeResult.value).length > 0) {
      if (callbacks.setThemeSettings) callbacks.setThemeSettings(themeResult.value);
      safeSetLocalStorage(STORAGE_KEYS.THEME_SETTINGS, themeResult.value);
    } else {
      const fallbackTheme = loadThemeSettings();
      if (callbacks.setThemeSettings) callbacks.setThemeSettings(fallbackTheme);
    }

    // Checkout & Coupons
    if (checkoutResult.status === 'fulfilled' && checkoutResult.value && typeof checkoutResult.value === 'object' && Object.keys(checkoutResult.value).length > 0) {
      if (callbacks.setCheckoutSettings) callbacks.setCheckoutSettings(checkoutResult.value);
      safeSetLocalStorage(STORAGE_KEYS.CHECKOUT_SETTINGS, checkoutResult.value);
      if (Array.isArray((checkoutResult.value as any).coupons) && (checkoutResult.value as any).coupons.length > 0) {
        safeSetLocalStorage(STORAGE_KEYS.COUPONS, (checkoutResult.value as any).coupons);
      }
    } else {
      const fallbackCheckout = loadCheckoutSettings();
      if (callbacks.setCheckoutSettings) callbacks.setCheckoutSettings(fallbackCheckout);
    }

    if (couponsResult.status === 'fulfilled' && Array.isArray(couponsResult.value) && couponsResult.value.length > 0) {
      safeSetLocalStorage(STORAGE_KEYS.COUPONS, couponsResult.value);
      console.log(`[Sync] Coupons synced from Supabase: ${couponsResult.value.length}`);
    }

    // Delivery
    if (deliveryResult.status === 'fulfilled' && deliveryResult.value && typeof deliveryResult.value === 'object' && Array.isArray((deliveryResult.value as any).cities)) {
      if (callbacks.setDeliverySettings) callbacks.setDeliverySettings(deliveryResult.value);
      safeSetLocalStorage(STORAGE_KEYS.DELIVERY_SETTINGS, deliveryResult.value);
    }

    // Stats
    if (statsResult.status === 'fulfilled' && Array.isArray(statsResult.value) && statsResult.value.length > 0) {
      if (callbacks.setStats) callbacks.setStats(statsResult.value);
      safeSetLocalStorage(STORAGE_KEYS.STATS, statsResult.value);
    } else {
      const fallbackStats = loadStoredStats();
      if (callbacks.setStats) callbacks.setStats(fallbackStats);
    }

    // Contacts
    if (contactsResult.status === 'fulfilled' && Array.isArray(contactsResult.value) && contactsResult.value.length > 0) {
      if (callbacks.setContacts) callbacks.setContacts(contactsResult.value);
      safeSetLocalStorage(STORAGE_KEYS.CONTACTS, contactsResult.value);
    } else {
      const fallbackContacts = loadStoredContacts();
      if (callbacks.setContacts) callbacks.setContacts(fallbackContacts);
    }

    // Gallery
    if (galleryResult.status === 'fulfilled' && Array.isArray(galleryResult.value) && galleryResult.value.length > 0) {
      if (callbacks.setGallery) callbacks.setGallery(galleryResult.value);
      safeSetLocalStorage(STORAGE_KEYS.GALLERY, galleryResult.value);
    } else {
      const fallbackGallery = loadStoredGallery();
      if (callbacks.setGallery) callbacks.setGallery(fallbackGallery);
    }

    // Planner
    if (plannerResult.status === 'fulfilled' && plannerResult.value && typeof plannerResult.value === 'object') {
      if (callbacks.setPlannerConfig) callbacks.setPlannerConfig(plannerResult.value);
      safeSetLocalStorage(STORAGE_KEYS.PLANNER, plannerResult.value);
    } else {
      const fallbackPlanner = loadPlannerConfig();
      if (callbacks.setPlannerConfig) callbacks.setPlannerConfig(fallbackPlanner);
    }

    // Material Estimator
    if (estimatorResult.status === 'fulfilled' && estimatorResult.value && typeof estimatorResult.value === 'object') {
      if (callbacks.setEstimatorConfig) callbacks.setEstimatorConfig(estimatorResult.value);
      safeSetLocalStorage(STORAGE_KEYS.ESTIMATOR, estimatorResult.value);
    } else {
      const fallbackEstimator = loadBuildMaterialEstimatorConfig();
      if (callbacks.setEstimatorConfig) callbacks.setEstimatorConfig(fallbackEstimator);
    }

    // Fitting Builder
    if (fittingResult.status === 'fulfilled' && fittingResult.value && typeof fittingResult.value === 'object' && Array.isArray(fittingResult.value.items) && fittingResult.value.items.length > 0) {
      if (callbacks.setFittingBuilderConfig) callbacks.setFittingBuilderConfig(fittingResult.value);
      safeSetLocalStorage(STORAGE_KEYS.FITTING_BUILDER, fittingResult.value);
    } else {
      const fallbackFitting = loadFittingBuilderConfig();
      if (callbacks.setFittingBuilderConfig) callbacks.setFittingBuilderConfig(fallbackFitting);
    }

    // AI Assistant
    if (aiResult.status === 'fulfilled' && aiResult.value && typeof aiResult.value === 'object') {
      if (callbacks.setAiAssistantConfig) callbacks.setAiAssistantConfig(aiResult.value);
      safeSetLocalStorage(STORAGE_KEYS.AI_ASSISTANT, aiResult.value);
    } else {
      const fallbackAi = loadAiAssistantConfig();
      if (callbacks.setAiAssistantConfig) callbacks.setAiAssistantConfig(fallbackAi);
    }

    // Smart Tools
    if (smartToolsResult.status === 'fulfilled' && smartToolsResult.value && typeof smartToolsResult.value === 'object') {
      if (callbacks.setSmartToolsSettings) callbacks.setSmartToolsSettings(smartToolsResult.value);
      safeSetLocalStorage(STORAGE_KEYS.SMART_TOOLS, smartToolsResult.value);
    } else {
      const fallbackTools = loadSmartToolsSettings();
      if (callbacks.setSmartToolsSettings) callbacks.setSmartToolsSettings(fallbackTools);
    }

    // How To Order Guide
    if (howToOrderResult.status === 'fulfilled' && howToOrderResult.value && Array.isArray(howToOrderResult.value.steps) && howToOrderResult.value.steps.length > 0) {
      safeSetLocalStorage(STORAGE_KEYS.HOW_TO_ORDER_GUIDE, howToOrderResult.value);
    }

    console.log('✅ [Database & Backend Sync] Fast parallel synchronization complete!');
    return;
  } catch (err) {
    console.error('[Database & Backend Sync] Sync error, falling back to local cache:', err);
  }

  // Fallback / standard sync with LocalStorage if Supabase client is not configured
  try {
    if (callbacks.setConfig) callbacks.setConfig(loadStoredConfig());
    if (callbacks.setProducts) callbacks.setProducts(loadStoredProducts());
    if (callbacks.setCategories) callbacks.setCategories(loadStoredCategories());
    if (callbacks.setBrands) callbacks.setBrands(loadStoredBrands());
    if (callbacks.setStats) callbacks.setStats(loadStoredStats());
    if (callbacks.setContacts) callbacks.setContacts(loadStoredContacts());
    if (callbacks.setGallery) callbacks.setGallery(loadStoredGallery());
    if (callbacks.setPlannerConfig) callbacks.setPlannerConfig(loadPlannerConfig());
    if (callbacks.setAiAssistantConfig) callbacks.setAiAssistantConfig(loadAiAssistantConfig());
    if (callbacks.setOrders) callbacks.setOrders(loadStoredOrders());
    if (callbacks.setCheckoutSettings) callbacks.setCheckoutSettings(loadCheckoutSettings());
    if (callbacks.setDeliverySettings) callbacks.setDeliverySettings(loadDeliverySettings());
    if (callbacks.setThemeSettings) callbacks.setThemeSettings(loadThemeSettings());
    if (callbacks.setAnnouncementSettings) callbacks.setAnnouncementSettings(loadAnnouncementSettings());
    if (callbacks.setHeroSettings) callbacks.setHeroSettings(loadHeroSettings());
    if (callbacks.setSmartToolsSettings) callbacks.setSmartToolsSettings(loadSmartToolsSettings());
    if (callbacks.setEstimatorConfig) callbacks.setEstimatorConfig(loadBuildMaterialEstimatorConfig());
    if (callbacks.setFittingBuilderConfig) callbacks.setFittingBuilderConfig(loadFittingBuilderConfig());
    if (callbacks.setPricingTypography) {
      const fallbackPricing = loadPricingTypographySettings();
      callbacks.setPricingTypography(fallbackPricing);
      applyPricingTypographyToRoot(fallbackPricing);
    }
  } catch (e) {
    console.warn('Local storage sync fallback error:', e);
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

export const getValidPakistanTimePins = (referenceDate: Date = new Date()): Set<string> => {
  const validPins = new Set<string>();
  const nowMs = referenceDate.getTime();
  const offsets = [-300000, -240000, -180000, -120000, -60000, 0, 60000, 120000, 180000, 240000, 300000];

  for (const offset of offsets) {
    const d = new Date(nowMs + offset);

    // 1. Asia/Karachi (Pakistan Time) - 24-hour format (e.g., 19:15 -> 1915)
    try {
      const formatter24 = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Karachi',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts24 = formatter24.formatToParts(d);
      let h24 = '00', m24 = '00';
      for (const p of parts24) {
        if (p.type === 'hour') h24 = p.value.padStart(2, '0');
        if (p.type === 'minute') m24 = p.value.padStart(2, '0');
      }
      if (h24 === '24') h24 = '00';
      validPins.add(`${h24}${m24}`);

      // 2. Asia/Karachi (Pakistan Time) - 12-hour format (e.g., 07:15 PM -> 0715)
      const formatter12 = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      const parts12 = formatter12.formatToParts(d);
      let h12 = '12', m12 = '00';
      for (const p of parts12) {
        if (p.type === 'hour') h12 = p.value.padStart(2, '0');
        if (p.type === 'minute') m12 = p.value.padStart(2, '0');
      }
      if (h12.length > 2) h12 = h12.slice(-2);
      validPins.add(`${h12.padStart(2, '0')}${m12.padStart(2, '0')}`);
    } catch {
      // Direct UTC+5 calculation fallback for environments without Asia/Karachi Intl timezone
      const pktDate = new Date(d.getTime() + 5 * 60 * 60 * 1000);
      const utcH24 = String(pktDate.getUTCHours()).padStart(2, '0');
      const utcM = String(pktDate.getUTCMinutes()).padStart(2, '0');
      validPins.add(`${utcH24}${utcM}`);

      let utcH12Num = pktDate.getUTCHours() % 12;
      if (utcH12Num === 0) utcH12Num = 12;
      const utcH12 = String(utcH12Num).padStart(2, '0');
      validPins.add(`${utcH12}${utcM}`);
    }

    // 3. Device Local Time (24-hour)
    const localH24 = String(d.getHours()).padStart(2, '0');
    const localM = String(d.getMinutes()).padStart(2, '0');
    validPins.add(`${localH24}${localM}`);

    // 4. Device Local Time (12-hour)
    let localH12Num = d.getHours() % 12;
    if (localH12Num === 0) localH12Num = 12;
    const localH12 = String(localH12Num).padStart(2, '0');
    validPins.add(`${localH12}${localM}`);
  }

  // 5. Always include master and stored PINs
  validPins.add('8002');
  try {
    const storedPin = getAdminPin();
    if (storedPin) validPins.add(storedPin.trim());
  } catch {}

  return validPins;
};

export const verifySecurityPinLocally = (pin: string): boolean => {
  if (!pin) return false;
  const cleanPin = pin.trim().replace(/\D/g, '');
  if (cleanPin.length !== 4) return false;
  const validPins = getValidPakistanTimePins();
  return validPins.has(cleanPin);
};

// =========================================================
// COUPONS & PROMO CODES MANAGEMENT & VALIDATION ENGINE
// =========================================================

export const defaultSeedCoupons: Coupon[] = [
  {
    id: "coupon-welcome10",
    code: "WELCOME10",
    discountPercentage: 10,
    isEnabled: true,
    description: "Welcome Discount for Customers",
    minOrderAmount: 1000,
    maxDiscountAmount: 5000,
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: "coupon-zst5",
    code: "ZST5",
    discountPercentage: 5,
    isEnabled: true,
    description: "Storewide Loyalty Discount",
    minOrderAmount: 500,
    usageCount: 0,
    createdAt: new Date().toISOString()
  }
];

export const loadCouponsFromStorage = (): Coupon[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.COUPONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Error loading coupons from localStorage:', e);
  }
  return defaultSeedCoupons;
};

export const fetchCouponsFromBackend = async (): Promise<Coupon[]> => {
  try {
    const res = await fetch('/api/coupons');
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && Array.isArray(data.coupons)) {
        safeSetLocalStorage(STORAGE_KEYS.COUPONS, data.coupons);
        return data.coupons;
      }
    }
  } catch (e) {
    console.warn('[Coupons] Backend fetch fallback to local storage:', e);
  }
  return loadCouponsFromStorage();
};

export const saveCouponsToStorage = async (coupons: Coupon[]): Promise<{ success: boolean; error?: string }> => {
  try {
    safeSetLocalStorage(STORAGE_KEYS.COUPONS, coupons);
    saveToServerCMS(STORAGE_KEYS.COUPONS, coupons);

    // Save to Supabase and server endpoints
    const res = await fetch('/api/coupons/upsert', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAdminPin() || '8002'}`
      },
      body: JSON.stringify({ coupons })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.success) {
        return { success: true };
      }
    }

    // Also sync to Supabase site_settings directly
    await saveSiteSettingToSupabase(STORAGE_KEYS.COUPONS, coupons);
    return { success: true };
  } catch (e: any) {
    console.error('Error saving coupons:', e);
    return { success: false, error: e?.message || 'Failed to save coupons.' };
  }
};

export const saveCouponSingle = async (coupon: Coupon): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentList = loadCouponsFromStorage();
    const idx = currentList.findIndex(c => c.id === coupon.id);
    let updatedList: Coupon[];
    if (idx >= 0) {
      updatedList = [...currentList];
      updatedList[idx] = coupon;
    } else {
      updatedList = [coupon, ...currentList];
    }
    return await saveCouponsToStorage(updatedList);
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to save coupon' };
  }
};

export const deleteCouponFromStorage = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const currentList = loadCouponsFromStorage();
    const filtered = currentList.filter(c => c.id !== id);
    safeSetLocalStorage(STORAGE_KEYS.COUPONS, filtered);
    saveToServerCMS(STORAGE_KEYS.COUPONS, filtered);

    await fetch(`/api/coupons/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAdminPin() || '8002'}`
      }
    });

    await saveSiteSettingToSupabase(STORAGE_KEYS.COUPONS, filtered);
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to delete coupon' };
  }
};

/**
 * Validates a coupon code securely against the backend endpoint without exposing the list of coupons.
 */
export const validateCouponCode = async (code: string, orderAmount: number): Promise<CouponValidationResult> => {
  if (!code || !code.trim()) {
    return { valid: false, error: 'Invalid or unavailable promo code.' };
  }

  const cleanCode = code.trim().toUpperCase();
  const numAmount = Math.max(0, orderAmount || 0);

  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: cleanCode, orderAmount: numAmount })
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.valid && data.coupon) {
        return {
          valid: true,
          coupon: data.coupon
        };
      } else {
        return {
          valid: false,
          error: data?.error || 'Invalid or unavailable promo code.'
        };
      }
    }
  } catch (err) {
    console.warn('[Coupon] Network error validating coupon, running local validation check:', err);
  }

  // Graceful fallback if offline, static hosting, or server is temporarily unreachable
  const storedList = loadCouponsFromStorage();
  let matched = storedList.find(c => (c.code || '').trim().toUpperCase() === cleanCode);

  // If not found in local storage, query Supabase directly (ensures fresh multi-device verification)
  if (!matched) {
    try {
      const liveCoupons = await fetchSiteSettingFromSupabase<Coupon[]>(STORAGE_KEYS.COUPONS);
      if (Array.isArray(liveCoupons) && liveCoupons.length > 0) {
        safeSetLocalStorage(STORAGE_KEYS.COUPONS, liveCoupons);
        matched = liveCoupons.find(c => (c.code || '').trim().toUpperCase() === cleanCode);
      }
    } catch (e) {
      console.warn('[Coupon] Live Supabase query fallback notice:', e);
    }
  }

  if (!matched || matched.isEnabled === false) {
    return { valid: false, error: 'Invalid or unavailable promo code.' };
  }

  if (matched.expiryDate) {
    const exp = new Date(matched.expiryDate);
    if (!isNaN(exp.getTime())) {
      exp.setHours(23, 59, 59, 999);
      if (Date.now() > exp.getTime()) {
        return { valid: false, error: 'This promo code has expired.' };
      }
    }
  }

  if (matched.minOrderAmount && matched.minOrderAmount > 0 && numAmount < matched.minOrderAmount) {
    return { 
      valid: false, 
      error: `Minimum order amount for this coupon is Rs. ${matched.minOrderAmount.toLocaleString('en-PK')}.` 
    };
  }

  const pct = Math.max(0, Math.min(100, matched.discountPercentage || 0));
  let discountAmount = Math.round((numAmount * pct) / 100);
  if (matched.maxDiscountAmount && matched.maxDiscountAmount > 0) {
    discountAmount = Math.min(discountAmount, matched.maxDiscountAmount);
  }
  discountAmount = Math.min(discountAmount, numAmount);
  const finalTotal = Math.max(0, numAmount - discountAmount);

  return {
    valid: true,
    coupon: {
      id: matched.id,
      code: matched.code.trim().toUpperCase(),
      discountPercentage: pct,
      discountAmount,
      originalTotal: numAmount,
      finalTotal,
      minOrderAmount: matched.minOrderAmount,
      maxDiscountAmount: matched.maxDiscountAmount
    }
  };
};

