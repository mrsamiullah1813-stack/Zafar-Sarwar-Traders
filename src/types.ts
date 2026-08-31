export interface BusinessConfig {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  salesWhatsapp?: string;
  orderWhatsapp?: string;
  supportWhatsapp?: string;
  deliveryPhone?: string;
  hoursWeekday: string;
  hoursSunday: string;
  openingTime?: string;
  closingTime?: string;
  workingDays?: string;
  cutOffTime?: string;
  isHolidayNotice?: boolean;
  holidayNoticeText?: string;
  googleMapEmbedUrl: string;
  announcementText?: string;
  heroHeading?: string;
  heroSubheading?: string;
  seoTitle?: string;
  seoDescription?: string;
  faqList?: FaqItem[];
  privacyPolicy?: string;
  termsConditions?: string;
  returnPolicy?: string;
  shippingPolicy?: string;
}

export interface ContactPerson {
  id: string;
  fullName: string;
  designation: string; // e.g. "Owner / CEO", "Sanitary Manager", "Accounts Manager", "Sales Manager"
  department: string;  // e.g. "Management", "Sanitaryware", "Accounts", "Sales"
  mobileNumber: string;
  whatsappNumber: string;
  email?: string;
  profilePhoto?: string;
  workingHours?: string;
  availabilityStatus: 'Available' | 'Busy' | 'Offline';
  isPrimary?: boolean;
  enableWhatsapp?: boolean;
  enableCall?: boolean;
  isHidden?: boolean;
  displayOrder: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug?: string;
  description: string;
  fullDescription?: string;
  image: string;
  iconImage?: string;
  bannerImage?: string;
  itemCount: number;
  badge?: string;
  iconName: string;
  group: 'sanitary' | 'faucets_showers' | 'plumbing' | 'paints_materials' | 'construction';
  isFeatured?: boolean;
  showOnHomepage?: boolean;
  isActive?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  displayOrder?: number;
}

export interface ProductVideo {
  id: string;
  title: string;
  type: 'mp4' | 'youtube' | 'vimeo' | 'embed';
  url: string;
}

export interface ProductSaleConfig {
  saleEnabled?: boolean;
  salePrice?: string | number;
  saleStartDate?: string;
  saleEndDate?: string;
  saleLabel?: string;
  saleBadgeColor?: 'red' | 'emerald' | 'amber' | 'blue' | 'purple' | 'cyan' | string;
  saleMessage?: string;
  showCountdown?: boolean;
  showDiscountPercentage?: boolean;
  showSavings?: boolean;
  showRegularPriceStrike?: boolean;
}

export interface ProductVariant {
  id: string;
  name: string; // e.g. "100 Liters", "200 Liters", "1/2 inch", "3/4 inch", "Chrome", "Matte Black"
  sku?: string; // e.g. "WT-100L"
  price?: string | number; // Regular variant price, e.g. "8000" or "Rs. 8,000"
  saleEnabled?: boolean;
  salePrice?: string | number; // Variant sale price, e.g. "7200" or "Rs. 7,200"
  discountPercentage?: number;
  saleLabel?: string;
  stockQuantity?: number;
  stockStatus?: 'In Stock' | 'Limited Stock' | 'Out of Stock' | 'Coming Soon' | 'Available on Order' | string;
  image?: string; // Variant specific photo
  isActive?: boolean; // Enable / disable without deleting (defaults to true)
  isDefault?: boolean; // Whether this is the default selected variant
  displayOrder?: number;
}

export interface ProductVariantsConfig {
  variantsEnabled?: boolean; // Admin master switch per product
  optionName?: string; // e.g. "Capacity", "Size", "Color", "Length", "Model", "Thickness", "Weight", "Finish"
  variants?: ProductVariant[];
}

export interface PaintShade {
  id: string; // Unique shade id (e.g. "shade-101")
  name: string; // Shade Name (e.g. "Grey Mist", "Snow White", "Off-White")
  code: string; // Exact Manufacturer Shade Code (e.g. "3044", "SW-01", "3001") - Primary Reference
  referenceImage?: string; // Real Shade Reference Image (uploaded sample/card/crop from catalogue)
  image?: string; // Backward compatibility alias for referenceImage
  colorHex?: string; // Optional soft fallback tint if image is loading
  isActive?: boolean; // Available toggle: true = Available (ON), false = Unavailable (OFF)
  displayOrder?: number; // Ordering index
  priceAdjustment?: number; // Optional price delta in PKR
  notes?: string; // Optional manufacturer notes
}

export interface PaintShadesConfig {
  shadesEnabled?: boolean; // Admin master switch per paint product [ON / OFF]
  shadesTitle?: string; // Section title (e.g. "Choose Shade")
  shadeSheetUrl?: string; // Complete manufacturer shade sheet / catalogue reference uploaded by Admin
  shadeSheetName?: string; // e.g. "Berger Super Emulsion Shade Card 2026"
  shades?: PaintShade[];
}

export interface ProductQuantityConfig {
  quantityEnabled?: boolean; // Admin master switch per product [ON / OFF]
  minQuantity?: number; // Minimum allowed quantity (default: 1)
  maxQuantity?: number; // Maximum allowed quantity (optional)
  defaultQuantity?: number; // Initial default quantity (default: 1)
  quantityStep?: number; // Increment / decrement step (default: 1)
  unitLabel?: string; // Optional unit name (e.g. "Pcs", "Bags", "Boxes", "Liters", "Tins", "Units", "Tons")
}

export interface Product {
  id: string;
  sku?: string;
  name: string;
  category: string;
  categoryId: string;
  image: string;
  images?: string[];
  description: string;
  shortDescription?: string;
  price?: string;
  salePrice?: string;
  saleEnabled?: boolean;
  saleStartDate?: string;
  saleEndDate?: string;
  saleLabel?: string;
  saleBadgeColor?: string;
  saleMessage?: string;
  showSaleCountdown?: boolean;
  showDiscountPercentage?: boolean;
  showSavingsAmount?: boolean;
  saleConfig?: ProductSaleConfig;
  // Product Quantity System (Admin controlled per product)
  quantityEnabled?: boolean;
  minQuantity?: number;
  maxQuantity?: number;
  defaultQuantity?: number;
  quantityStep?: number;
  unitLabel?: string;
  quantityConfig?: ProductQuantityConfig;
  // Product Variant System (Admin controlled per product)
  variantsEnabled?: boolean;
  optionName?: string; // Custom label for variant selector (e.g. "Capacity", "Size", "Color", "Length")
  variantsList?: ProductVariant[];
  variantsConfig?: ProductVariantsConfig;
  // Paint-Specific Shade & Color System (Admin controlled per paint product)
  shadesEnabled?: boolean;
  shadesTitle?: string;
  shadeSheetUrl?: string; // Admin reference shade sheet / catalogue image
  shadesList?: PaintShade[];
  paintShadesConfig?: PaintShadesConfig;
  isPaintProduct?: boolean;
  features: string[];
  specs?: Record<string, string>;
  isNew?: boolean;
  isFeatured?: boolean;
  isHeroFeatured?: boolean;
  isBestSeller?: boolean;
  isTrending?: boolean;
  isHidden?: boolean;
  badge?: 'LUXURY' | 'NEW' | 'BESTSELLER' | 'PREMIUM GRADE' | 'IMPACT RESISTANT' | string;
  brand?: string;
  brandId?: string;
  tags?: string[];
  availableFinishes?: string[];
  availableColors?: string[];
  availableSizes?: string[];
  availableVariants?: string[];
  availableMaterials?: string[];
  material?: string;
  warranty?: string;
  stockStatus?: 'In Stock' | 'Limited Stock' | 'Out of Stock' | 'Coming Soon' | 'Available on Order' | string;
  stockQuantity?: number;
  hideStockBadge?: boolean;
  isPriceOnRequest?: boolean;
  hidePrice?: boolean;
  rating?: number;
  reviewsCount?: number;
  reviews_count?: number;
  videos?: ProductVideo[];
  pdfCatalogueUrl?: string;
  installationGuideUrl?: string;
  whatsappCustomMessage?: string;
  relatedProductIds?: string[];
  seoTitle?: string;
  seoDescription?: string;
  displayOrder?: number;
  deliveryConfig?: ProductDeliveryConfig;
}

export interface ProductDeliveryConfig {
  deliveryType?: 'standard' | 'custom' | 'both' | 'inherit';
  // Numeric / Range options
  minDeliveryTime?: number;
  maxDeliveryTime?: number;
  deliveryTimeUnit?: 'Days' | 'Hours' | 'Working Days';
  customDeliveryTimeLabel?: string; // e.g. "Estimated Delivery:", "Estimated Arrival:", "Shipping Time:"
  
  // Custom Delivery Text / Normal English Message
  customDeliveryMessage?: string; // e.g. "Price on Call", "Delivery charges depend on your location.", "Delivery Available — Contact Us"
  customMessageLabel?: string; // e.g. "Delivery Info:", "Note:"
  
  // Delivery Fee
  deliveryFeeType?: 'free' | 'fixed' | 'contact' | 'custom' | 'inherit';
  deliveryFeeAmount?: number;
  deliveryFeeCustomText?: string; // e.g. "Delivery charges depend on location and order quantity."
  deliveryFeeLabel?: string; // e.g. "Delivery Fee:"
  
  // Delivery Coverage Area
  deliveryAreaText?: string; // e.g. "Chiniot & Selected Areas across Punjab"
  deliveryAreaLabel?: string; // e.g. "Delivery Area:"
  
  // Optional Special Note
  deliveryNote?: string; // e.g. "Delivery time may vary depending on location."
  
  // Hide toggle for this product
  hideDeliveryInfo?: boolean;
}

export interface ProductBrand {
  id: string;
  name: string;
  slug?: string;
  logo: string;
  bannerImage?: string;
  description: string;
  officialBadge?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  displayOrder?: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'all' | 'sanitary' | 'faucets' | 'paints' | 'materials';
  image: string;
  description: string;
}

export interface StatCounter {
  id: string;
  title: string;
  numberValue: number;
  suffix?: string;
  prefix?: string;
  iconName: string;
  description?: string;
  displayOrder: number;
  isHidden?: boolean;
  enableAnimation?: boolean;
}

export interface Review {
  id: string;
  name: string;
  role: string;
  location: string;
  projectType: string;
  rating: number;
  comment: string;
  date: string;
  avatar?: string;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export type RoomTypeOption = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export type InteriorStyleOption = {
  id: string;
  label: string;
  description: string;
  badge?: string;
};

export type ColorThemeOption = {
  id: string;
  label: string;
  hex: string;
  gradient?: string;
  description: string;
};

export type BudgetLevelOption = {
  id: string;
  label: string;
  description: string;
  priceRange?: string;
};

export type RoomSizeOption = {
  id: string;
  label: string;
  description: string;
  sqftRange?: string;
};

export type DesignerCategoryType = 
  | 'Wash Basin'
  | 'Faucet'
  | 'Shower'
  | 'Rain Shower'
  | 'Toilet'
  | 'Mirror'
  | 'Cabinet'
  | 'Sink'
  | 'Accessories'
  | 'Bib Cock'
  | 'Angle Valve'
  | 'Floor Drain'
  | 'Cement'
  | string;

export interface DesignerRecommendationRule {
  id: string;
  name: string;
  categoryName: DesignerCategoryType;
  roomTypes?: string[];
  styles?: string[];
  colorThemes?: string[];
  budgets?: string[];
  assignedProductId?: string;
  customNote?: string;
  isActive: boolean;
}

export interface ProductTagMatrix {
  roomTypes?: string[];
  styles?: string[];
  colorThemes?: string[];
  budgets?: string[];
  pinned?: boolean;
  hidden?: boolean;
  displayOrder?: number;
}

export interface AiDesignerConfig {
  isEnabled: boolean;
  title: string;
  subtitle: string;
  bannerTag: string;
  whatsappTemplate: string;
  roomTypes: RoomTypeOption[];
  styles: InteriorStyleOption[];
  colorThemes: ColorThemeOption[];
  budgetLevels: BudgetLevelOption[];
  roomSizes: RoomSizeOption[];
  rules: DesignerRecommendationRule[];
  productTags: Record<string, ProductTagMatrix>;
}

export interface AiDesignerSelection {
  roomType: string;
  style: string;
  colorTheme: string;
  budget: string;
  roomSize: string;
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
}

// Backward compatibility alias
export type BathroomPlannerConfig = AiDesignerConfig;
export type BathroomPlannerSelection = AiDesignerSelection;
export type PlannerCategoryType = DesignerCategoryType;
export type PlannerRecommendationRule = DesignerRecommendationRule;

// ---------------------------------------------------------
// EASY BATHROOM PLANNER (4-STEP WIZARD) INTERFACES
// ---------------------------------------------------------
export interface BathroomTypePreset {
  id: string; // 'master' | 'standard' | 'guest' | 'rental'
  name: string;
  urduName: string;
  description: string;
  icon: string; // 'Crown' | 'Home' | 'Sparkles' | 'Building2'
  recommendedFixtures: string[];
}

export interface BathroomStyleOption {
  id: string; // 'chrome' | 'matte-black' | 'gold' | 'white'
  name: string;
  urduName: string;
  description: string;
  colorHex: string;
  badge?: string;
}

export interface BathroomBudgetTier {
  id: string; // 'economy' | 'standard' | 'luxury'
  name: string;
  urduName: string;
  priceRange: string;
  description: string;
  badge?: string;
  multiplier: number;
}

export interface BathroomFixtureOption {
  id: string; // 'toilet' | 'basin' | 'shower' | 'muslim_shower' | 'accessories' | 'fittings'
  name: string;
  urduName: string;
  description: string;
  categoryGroup: string;
  icon: string;
  defaultChecked?: boolean;
}

export interface EasyBathroomPlannerConfig {
  isEnabled: boolean;
  title: string;
  urduTitle: string;
  subtitle: string;
  urduSubtitle: string;
  whatsappTemplate: string;
  bathroomTypes: BathroomTypePreset[];
  fixtures: BathroomFixtureOption[];
  styles: BathroomStyleOption[];
  budgetTiers: BathroomBudgetTier[];
  rules: DesignerRecommendationRule[];
  productTags: Record<string, ProductTagMatrix>;
  disclaimerText: string;
}

export interface EasyBathroomPlannerInputs {
  bathroomTypeId: string;
  selectedFixtures: string[]; // array of fixture ids
  styleId: string;
  budgetTierId: string;
}

export interface BathroomPackageItem {
  fixtureId: string;
  fixtureName: string;
  fixtureUrduName: string;
  product: Product;
  selectedColor?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isIncluded: boolean;
}

export interface EasyBathroomPlannerResult {
  inputs: EasyBathroomPlannerInputs;
  bathroomTypeName: string;
  styleName: string;
  budgetTierName: string;
  items: BathroomPackageItem[];
  totalPackagePrice: number;
  totalItemsCount: number;
}

export interface AiRecommendationResponse {
  summary?: string;
  headline?: string;
  overview?: string;
  recommendedCategories?: string[];
  recommendedBrands?: string[];
  suggestedItems?: string[];
  keyProducts?: { name: string; whyItFits: string; estimatedSpecs: string }[];
  estimatedMaterialTip?: string;
  whatsappSummary?: string;
  estimatedPackagePrice?: string;
  advice?: string;
}

export interface AiCustomKnowledge {
  id: string;
  title: string;
  category: 'policy' | 'faq' | 'shipping' | 'warranty' | 'general' | 'custom';
  questionOrTopic: string;
  answerOrContent: string;
  isEnabled: boolean;
  displayOrder?: number;
}

export interface AiAssistantConfig {
  isEnabled: boolean;
  aiName: string;
  welcomeMessage: string;
  selectedModel: 'gemini-3.6-flash' | 'gemini-3.1-pro-preview' | string;
  apiKeyNotice?: string;
  theme: 'dark-cyan' | 'emerald-gold' | 'midnight-sapphire' | 'slate-glass' | string;
  suggestedQuestions: string[];
  dataSources: {
    products: boolean;
    categories: boolean;
    brands: boolean;
    faqs: boolean;
    reviews: boolean;
    companyInfo: boolean;
    deliveryInfo?: boolean;
    customKnowledge?: boolean;
  };
  customKnowledge?: AiCustomKnowledge[];
  enableProductRecommendations: boolean;
  enableQuoteAssistance: boolean;
  enableBathroomPlanner: boolean;
}

export interface ChatMessageProduct {
  id: string;
  name: string;
  price?: string;
  image: string;
  brand?: string;
  category?: string;
  features?: string[];
  stockStatus?: string;
}

export interface CategoryCard {
  id: string;
  name: string;
  description?: string;
  itemCount?: number;
}

export interface DeliveryInfoCard {
  cityName: string;
  estimatedDays: string;
  deliveryFee: number;
  isSameDayAvailable?: boolean;
  isNextDayAvailable?: boolean;
  notes?: string;
}

export interface ComparisonData {
  title?: string;
  products: {
    id: string;
    name: string;
    brand?: string;
    price?: string;
    material?: string;
    warranty?: string;
    features?: string;
    availability?: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  recommendedProducts?: ChatMessageProduct[];
  recommendedCategory?: CategoryCard;
  deliveryInfoCard?: DeliveryInfoCard;
  comparisonTable?: ComparisonData;
  launchPlanner?: boolean;
  needsWhatsAppEscalation?: boolean;
  suggestedSmartTool?: 'bathroom_planner' | 'cement_estimator' | 'tank_calculator' | 'tile_calculator' | string;
  suggestedReplies?: string[];
  actionType?: 'whatsapp' | 'call' | 'quote' | 'planner' | 'browse' | string;
}

export interface CartItem {
  id?: string;
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedQuality?: string;
  selectedVariant?: string;
  selectedVariantId?: string;
  selectedVariantName?: string;
  selectedOptionName?: string;
  selectedVariantPrice?: number | string;
  selectedVariantSku?: string;
  // Paint Shade Selection
  selectedShade?: string; // e.g. "Snow White"
  selectedShadeId?: string;
  selectedShadeCode?: string; // e.g. "SW-01"
  selectedShadeColor?: string; // e.g. "#FFFFFF"
  selectedShadeImage?: string; // Texture URL
  selectedShadePriceAdjustment?: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  brand?: string;
  image?: string;
  sku?: string;
  unitPrice: string;
  numericPrice: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  selectedQuality?: string;
  selectedVariant?: string;
  selectedVariantId?: string;
  selectedVariantName?: string;
  selectedOptionName?: string;
  selectedVariantSku?: string;
  // Paint Shade Selection
  selectedShade?: string;
  selectedShadeId?: string;
  selectedShadeCode?: string;
  selectedShadeColor?: string;
  selectedShadeImage?: string;
  selectedShadePriceAdjustment?: number;
  lineTotal: number;
}

export type OrderStatus = 'Order Received' | 'New' | 'Confirmed' | 'Preparing' | 'Ready for Delivery' | 'Out for Delivery' | 'Delivered' | 'On Hold' | 'Cancelled' | 'Pending' | 'Processing';

export interface OrderStatusHistoryItem {
  status: OrderStatus | string;
  timestamp: string;
  note?: string;
  updatedBy?: string;
}

export interface CustomerAddress {
  id: string;
  label: string; // e.g., 'Home', 'Office', 'Site Address'
  address: string;
  city: string;
  areaLocality?: string;
  postalCode?: string;
}

export interface CustomerProfile {
  customerId: string; // e.g. 'ZFT-CUST-1001'
  fullName: string;
  phoneNumber: string;
  whatsappNumber?: string;
  email?: string;
  city?: string;
  areaLocality?: string;
  completeAddress?: string;
  postalCode?: string;
  createdAt: string;
  savedAddresses?: CustomerAddress[];
}

export interface CustomerOrder {
  id: string; // e.g. '#ZFT-1025' or 'ZFT-1025'
  orderNumber?: string; // e.g. 'ZFT-1025'
  customerId?: string; // e.g. 'ZFT-CUST-1001'
  customerName: string;
  phoneNumber: string;
  customerPhone?: string;
  whatsappNumber?: string;
  email?: string;
  city: string;
  areaLocality?: string;
  deliveryAddress: string;
  postalCode?: string;
  landmark?: string;
  deliveryInstructions?: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharges: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: string;
  updatedAt?: string;
  status: OrderStatus;
  statusHistory?: OrderStatusHistoryItem[];
  estimatedDeliveryDays?: string;
  estimatedDeliveryDate?: string; // e.g. '12 August 2026'
  estimatedDeliveryTime?: string; // e.g. '2:00 PM – 6:00 PM'
  isDelayed?: boolean;
  delayReason?: string;
  trackingReference?: string;
  adminNotes?: string;
  deliveryDelayNote?: string;
}

export interface AnnouncementItem {
  id: string;
  text: string;
  linkUrl?: string;
  iconName?: string;
  textColor?: string;
  bgColor?: string;
  accentColor?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface AnnouncementBarSettings {
  isEnabled: boolean;
  rotationMode: 'carousel' | 'marquee' | 'fade';
  displayDurationSeconds: number;
  announcements: AnnouncementItem[];
}

export interface CheckoutSettings {
  deliveryFee: number;
  taxRatePercent: number;
  enableTaxes: boolean;
  freeDeliveryThreshold?: number;
  whatsappNumber?: string;
  whatsappNumberOverride?: string;
}

export interface CityDeliveryInfo {
  id: string;
  cityName: string;
  areaTown?: string; // Specific area/town e.g. "Chiniot City", "Chenab Nagar", "Lalian", "Bhowana"
  status?: 'available' | 'unavailable' | 'contact_to_confirm'; // Availability status
  estimatedDays: string;
  deliveryFee: number;
  deliveryFeeType?: 'free' | 'fixed' | 'contact' | 'custom';
  deliveryFeeCustomText?: string;
  freeDelivery?: boolean;
  minOrderAmount?: number;
  additionalAddress?: string;
  isSameDayAvailable?: boolean;
  isNextDayAvailable?: boolean;
  isEnabled: boolean;
  displayOrder?: number;
  notes?: string;
  coverageAreas?: string[]; // Multiple specific neighborhoods or towns
}

export interface DeliverySettings {
  isEnabled: boolean;
  acrossPakistanHeadline?: string;
  globalDeliveryType?: 'standard' | 'custom' | 'both';
  globalMinDeliveryTime?: number;
  globalMaxDeliveryTime?: number;
  globalDeliveryTimeUnit?: 'Days' | 'Hours' | 'Working Days';
  globalCustomDeliveryMessage?: string;
  globalDeliveryFeeType?: 'free' | 'fixed' | 'contact' | 'custom';
  globalDeliveryFeeAmount?: number;
  globalDeliveryFeeText?: string;
  globalDeliveryAreaNote?: string;
  globalDeliveryNote?: string;
  deliveryPartner?: string;
  storeOpeningTime?: string;
  storeClosingTime?: string;
  workingDays?: string;
  fridayTiming?: string;
  orderCutoffTime?: string;
  holidaySchedule?: string;
  whatsappSupportNumber?: string;
  defaultSelectedCityId?: string;
  enableCustomCity?: boolean;
  customCityLabel?: string;
  customCityNotice?: string;
  deliveryNotes?: string[];
  cities: CityDeliveryInfo[];
  defaultDeliveryFee?: number;
  defaultEstimatedDays?: string;
  freeDeliveryThreshold?: number;
  enableCityOverrides?: boolean;
  expressDeliveryFee?: number;
  enableExpressDelivery?: boolean;
  notes?: string;
}

export interface ThemeOption {
  id: string; // 'light' | 'dark' | 'navy' | 'glass' | 'premium-blue'
  name: string;
  description: string;
  previewBg: string;
  previewAccent: string;
  previewCard: string;
  previewText: string;
  isEnabled: boolean;
  badge?: string;
  displayOrder?: number;
}

export interface ThemeSettings {
  defaultTheme: string;
  primaryAccentColor: string;
  secondaryAccentColor: string;
  availableThemes: ThemeOption[];
}

export interface HeroSettings {
  isEnabled: boolean;
  badgeText: string;
  heading: string;
  subheading: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  enablePrimaryBtn: boolean;
  secondaryBtnText: string;
  secondaryBtnLink: string;
  enableSecondaryBtn: boolean;
  tertiaryBtnText?: string;
  tertiaryBtnLink?: string;
  enableTertiaryBtn?: boolean;
  rotationDurationSeconds: number;
  transitionSpeedSeconds?: number;
  transitionStyle?: 'cinematic-depth' | 'depth-zoom' | '3d-slide' | 'smooth-reveal' | 'scale-reveal' | 'perspective-slide';
  autoPlay: boolean;
  pauseOnHover?: boolean;
  enableParallax?: boolean;
  parallaxStrength?: number;
  glowIntensity?: 'soft' | 'medium' | 'high' | 'ultra';
  bgType?: 'ambient-dark' | 'custom-image' | 'custom-video';
  bgMediaUrl?: string;
  bgVideoUrl?: string;
  heroProductIds: string[];
  heroMode: 'selected_or_featured' | 'featured_only' | 'all';
  productImageOverrides?: Record<string, string>;
  productVideoOverrides?: Record<string, string>;
  customProductOrder?: string[];
  isDraft?: boolean;
  publishedSettings?: Omit<HeroSettings, 'publishedSettings'>;
}

// ---------------------------------------------------------
// BUILD MATERIAL & CEMENT ESTIMATOR INTERFACES
// ---------------------------------------------------------
export interface HouseSizePreset {
  id: string;
  name: string; // e.g. "3 Marla", "5 Marla", "7 Marla", "10 Marla", "1 Kanal", "Custom"
  marlaCount?: number;
  defaultCoveredAreaSqFt: number;
  popular?: boolean;
  description?: string;
}

export interface ConstructionTypeOption {
  id: string; // 'grey-structure' | 'complete-house' | 'renovation' | 'extension'
  name: string;
  description: string;
  multiplier: number;
  badge?: string;
}

export interface FloorOption {
  id: string; // 'ground' | 'ground-1' | 'ground-2' | 'custom'
  name: string;
  floorsCount: number;
  multiplier: number;
}

export interface ConstructionQualityOption {
  id: string; // 'standard' | 'premium'
  name: string;
  description: string;
  multiplier: number;
  badge?: string;
}

export interface OptionalEstimatorFactor {
  id: string; // 'rcc-slab' | 'basement' | 'heavy-foundation' | 'additional-concrete' | 'boundary-wall'
  label: string;
  description: string;
  percentageAdjustment: number; // e.g. 0.15 for +15%
  fixedBagsAdjustment?: number;
  defaultChecked?: boolean;
}

export interface BuildMaterialEstimatorConfig {
  isEnabled: boolean;
  title: string;
  subtitle: string;
  tagline: string;
  description: string;
  ctaText: string;
  whatsappInquiryTemplate: string;
  
  // House Size & Area Config
  sqFtPerMarla: number; // standard default 225
  houseSizes: HouseSizePreset[];
  
  // Multipliers & Base Calculation
  baseCementBagsPerSqFt: number; // e.g. 0.38 bags / sq ft
  minEstimatePercentage: number; // e.g. 92% (0.92)
  maxEstimatePercentage: number; // e.g. 108% (1.08)
  
  constructionTypes: ConstructionTypeOption[];
  floorsOptions: FloorOption[];
  qualityOptions: ConstructionQualityOption[];
  optionalFactors: OptionalEstimatorFactor[];
  
  // Disclaimers & Factors Notes
  disclaimerHeading: string;
  disclaimerText: string;
  engineeringWarningText: string;
  factorsList: string[];
  
  // Cement Products Display
  enableCementProducts: boolean;
  cementCategorySlug: string; // 'cement'
  featuredProductIds?: string[];
  showPrice: boolean;
  showAvailability: boolean;
}

export interface BuildMaterialEstimatorInputs {
  projectType: string; // 'new-house' | 'renovation' | 'extension' | 'other'
  houseSizeId: string;
  customMarla?: number;
  coveredAreaSqFt: number;
  floorId: string;
  customFloorsCount?: number;
  constructionTypeId: string;
  qualityId: string;
  selectedOptionalFactors: string[];
  bathroomsCount?: number;
}

export interface BuildMaterialEstimationResult {
  inputs: BuildMaterialEstimatorInputs;
  coveredAreaSqFt: number;
  baseEstimatedBags: number;
  minEstimatedBags: number;
  maxEstimatedBags: number;
  recommendedBags: number;
  summaryText: string;
  appliedMultipliers: {
    baseRate: number;
    constructionType: { name: string; multiplier: number };
    floors: { name: string; multiplier: number };
    quality: { name: string; multiplier: number };
    optionalAdjustmentsTotalPercentage: number;
    bathroomBags: number;
  };
}

export type SmartToolId = 
  | 'cement-calculator' 
  | 'material-estimator' 
  | 'bathroom-planner' 
  | 'product-finder' 
  | 'construction-cost' 
  | 'budget-products' 
  | 'bricks' 
  | 'paint' 
  | 'water-tank'
  | 'construction-builder'
  | 'fitting-builder'
  | 'bathroom-budget-finder' // backward compatibility alias
  | 'water-tank-pump-guide'; // backward compatibility alias

export interface SmartToolCardConfig {
  id: SmartToolId;
  title: string;
  urduTitle?: string;
  tagline: string;
  description: string;
  badge?: string;
  iconName: string; // 'HardHat' | 'ShowerHead' | 'Calculator' | 'Search' | 'Home' | 'Bot' | 'Boxes' | 'Palette' | 'Droplet' | 'DollarSign'
  buttonText: string;
  isEnabled: boolean;
  showOnHomepage: boolean;
  displayOrder: number;
  disclaimer?: string;
}

export interface SmartToolsSettings {
  isEnabled: boolean;
  sectionTitle: string;
  sectionUrduTitle?: string;
  sectionSubtitle: string;
  sectionBadge: string;
  tools: SmartToolCardConfig[];
  // Global calculation assumptions (Admin configurable)
  brickSettings?: {
    bricksPerCft: number; // default ~13.5
    singleWallBricksPerSqFt: number; // 4.5" wall default ~4.5
    doubleWallBricksPerSqFt: number; // 9" wall default ~9.0
    cementBagsPer1000Bricks: number; // default ~3.2
    sandCftPer1000Bricks: number; // default ~15.0
    defaultWastagePercent: number; // default 5%
    defaultWallHeightFeet?: number; // default 10 ft
    defaultWallThicknessInches?: number; // default 9 inches
    defaultDoorWidthFeet?: number; // default 3 ft
    defaultDoorHeightFeet?: number; // default 7 ft
    defaultWindowWidthFeet?: number; // default 4 ft
    defaultWindowHeightFeet?: number; // default 4 ft
    defaultBrickLengthInches?: number; // default 9 in
    defaultBrickWidthInches?: number; // default 4.5 in
    defaultBrickHeightInches?: number; // default 3 in
  };
  paintSettings?: {
    sqFtPerLitrePerCoat: number; // default ~130
    sqFtPerGallonPerCoat: number; // default ~450
    defaultDoorAreaSqFt: number; // default 21
    defaultWindowAreaSqFt: number; // default 15
    defaultWastagePercent: number; // default 5%
  };
  constructionCostSettings?: {
    greyStructureBasicPerSqFt: number; // PKR ~2,100
    greyStructureStandardPerSqFt: number; // PKR ~2,500
    greyStructurePremiumPerSqFt: number; // PKR ~2,900
    finishingBasicPerSqFt: number; // PKR ~1,800
    finishingStandardPerSqFt: number; // PKR ~2,500
    finishingPremiumPerSqFt: number; // PKR ~3,800
    completeBasicPerSqFt: number; // PKR ~3,900
    completeStandardPerSqFt: number; // PKR ~5,000
    completePremiumPerSqFt: number; // PKR ~6,700
  };
}

// ---------------------------------------------------------
// 1. HOUSE CONSTRUCTION COST ESTIMATOR TYPES
// ---------------------------------------------------------
export interface HouseConstructionInputs {
  houseSizePreset: '3-marla' | '5-marla' | '7-marla' | '10-marla' | '1-kanal' | 'custom';
  customMarla?: number;
  customSqFt?: number;
  storeys: 'single' | 'double' | 'triple' | 'custom';
  customStoreysCount?: number;
  stage: 'grey-structure' | 'finishing' | 'complete-house';
  quality: 'basic' | 'standard' | 'premium';
  bathroomsCount?: number;
  kitchensCount?: number;
  hasBasement?: boolean;
}

export interface ConstructionCostCategoryItem {
  id: string;
  name: string;
  urduName?: string;
  percentage: number;
  estimatedMinPkr: number;
  estimatedMaxPkr: number;
  approxQuantity?: string;
  description: string;
  relatedCategorySlug?: string;
}

export interface HouseConstructionResult {
  inputs: HouseConstructionInputs;
  coveredAreaSqFt: number;
  ratePerSqFtMin: number;
  ratePerSqFtMax: number;
  totalCostMinPkr: number;
  totalCostMaxPkr: number;
  recommendedBudgetPkr: number;
  stageLabel: string;
  qualityLabel: string;
  categories: ConstructionCostCategoryItem[];
  disclaimer: string;
}

// ---------------------------------------------------------
// 2. BUDGET-TO-PRODUCTS AI TYPES
// ---------------------------------------------------------
export interface BudgetProductsAiInputs {
  budgetAmountPkr: number;
  projectType: 'bathroom' | 'plumbing' | 'kitchen' | 'paint' | 'complete-house-sanitary' | 'custom';
  bathroomCount?: number;
  preferredQuality: 'budget' | 'standard' | 'premium';
  selectedPriorities: string[]; // e.g. ['toilets', 'faucets', 'showers', 'vanities', 'accessories', 'plumbing-pipes']
  additionalNotes?: string;
}

export interface BudgetRecommendedItem {
  categoryKey: string;
  categoryLabel: string;
  product: Product;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isEssential: boolean;
  matchScore?: number;
}

export interface BudgetProductsAiResult {
  inputs: BudgetProductsAiInputs;
  targetBudgetPkr: number;
  totalEstimatedPkr: number;
  remainingBudgetPkr: number;
  isWithinBudget: boolean;
  recommendations: BudgetRecommendedItem[];
  aiAdvice: string;
  urduAdvice?: string;
}

// ---------------------------------------------------------
// 3. BRICKS ESTIMATOR TYPES
// ---------------------------------------------------------
export interface OpeningItem {
  id: string;
  type: 'door' | 'window' | 'custom';
  name: string;
  widthFeet: number;
  heightFeet: number;
  quantity: number;
}

export interface BricksEstimatorInputs {
  wallLengthFeet: number;
  wallHeightFeet: number;
  wallThicknessType: '4.5-inch' | '9-inch' | '13.5-inch' | 'custom';
  customThicknessInches?: number;
  openings: OpeningItem[];
  wastagePercent: number; // default 5%
}

export interface BricksEstimatorResult {
  inputs: BricksEstimatorInputs;
  grossWallAreaSqFt: number;
  openingsAreaSqFt: number;
  netWallAreaSqFt: number;
  wallVolumeCft: number;
  rawBricksCount: number;
  wastageBricksCount: number;
  totalBricksMin: number;
  totalBricksMax: number;
  recommendedBricks: number;
  approxCementBags: number;
  approxSandCft: number;
  summaryText: string;
  urduSummaryText: string;
  disclaimer: string;
}

// ---------------------------------------------------------
// 3.1 HOUSE BRICK ESTIMATOR (WIZARD & FULL-HOUSE ENGINE)
// ---------------------------------------------------------
export type HouseStoreyType = 'single' | 'double' | 'triple';

export interface HouseFloorDetail {
  storeyId: 'ground' | 'first' | 'second';
  label: string;
  lengthFeet: number;
  widthFeet: number;
  heightFeet: number;
}

export type RoomCategoryType = 
  | 'bedroom' 
  | 'living' 
  | 'drawing' 
  | 'dining' 
  | 'kitchen' 
  | 'washroom' 
  | 'store' 
  | 'laundry' 
  | 'office' 
  | 'garage' 
  | 'other';

export interface HouseRoomItem {
  id: string;
  category: RoomCategoryType;
  name: string;
  lengthFeet: number;
  widthFeet: number;
  heightFeet: number;
  floorId?: 'ground' | 'first' | 'second' | 'all';
}

export interface BrickDimensions {
  type: 'standard-pakistani' | 'custom';
  lengthInches: number; // 9"
  widthInches: number;  // 4.5"
  heightInches: number; // 3"
}

export interface HouseBrickEstimatorInputs {
  houseType: HouseStoreyType;
  houseLengthFeet: number;
  houseWidthFeet: number;
  defaultWallHeightFeet: number;
  floors: HouseFloorDetail[];
  rooms: HouseRoomItem[];
  kitchens: HouseRoomItem[];
  washrooms: HouseRoomItem[];
  otherSpaces: HouseRoomItem[];
  wallThicknessType: '9-inch' | '4.5-inch' | 'dual' | 'custom'; // dual = 9" exterior + 4.5" interior partitions
  customThicknessInches?: number;
  doorsCount: number;
  doorWidthFeet: number;
  doorHeightFeet: number;
  windowsCount: number;
  windowWidthFeet: number;
  windowHeightFeet: number;
  customOpenings?: OpeningItem[];
  brickDimensions: BrickDimensions;
  wastagePercent: number; // default 5%
}

export interface FloorBrickBreakdown {
  floorId: 'ground' | 'first' | 'second';
  label: string;
  exteriorWallAreaSqFt: number;
  interiorWallAreaSqFt: number;
  openingsDeductionSqFt: number;
  netMasonryAreaSqFt: number;
  rawBricks: number;
  wastageBricks: number;
  totalBricks: number;
}

export interface HouseBrickEstimatorResult {
  inputs: HouseBrickEstimatorInputs;
  totalCoveredAreaSqFt: number;
  approxMarla: number;
  exteriorWallAreaSqFt: number;
  interiorWallAreaSqFt: number;
  grossWallAreaSqFt: number;
  doorsDeductionAreaSqFt: number;
  windowsDeductionAreaSqFt: number;
  totalOpeningsDeductionSqFt: number;
  netWallAreaSqFt: number;
  netMasonryVolumeCft: number;
  rawBricksCount: number;
  wastageBricksCount: number;
  totalBricksMin: number;
  totalBricksMax: number;
  recommendedBricks: number;
  floorBreakdowns: FloorBrickBreakdown[];
  roomBreakdowns: { name: string; category: string; bricksCount: number; areaSqFt: number }[];
  approxCementBags: number;
  approxSandCft: number;
  summaryText: string;
  urduSummaryText: string;
  disclaimer: string;
  brickSizeLabel: string;
}

// ---------------------------------------------------------
// 4. PAINT QUANTITY CALCULATOR TYPES
// ---------------------------------------------------------
export interface PaintEstimatorInputs {
  roomLengthFeet: number;
  roomWidthFeet: number;
  wallHeightFeet: number;
  doorsCount: number;
  windowsCount: number;
  numberOfCoats: number; // 1, 2, 3
  includeCeiling: boolean;
  surfaceType: 'smooth-plaster' | 'rough-plaster' | 'repaint' | 'drywall';
}

export interface PaintEstimatorResult {
  inputs: PaintEstimatorInputs;
  wallsAreaSqFt: number;
  ceilingAreaSqFt: number;
  openingsDeductionSqFt: number;
  netPaintableAreaSqFt: number;
  totalCoatsAreaSqFt: number;
  estimatedLitresMin: number;
  estimatedLitresMax: number;
  recommendedLitres: number;
  approxGallons: number; // ~3.785 litres / imp gallon ~4.54L in PK
  approxDrums: number; // 14-16 Litre drums
  matchedPaintProducts: Product[];
  summaryText: string;
  urduSummaryText: string;
  disclaimer: string;
}

// ---------------------------------------------------------
// 5. SMART PRODUCT FINDER TYPES
// ---------------------------------------------------------
export interface SmartProductFinderInputs {
  lookingFor: string; // 'all' | 'toilet' | 'basin' | 'shower' | 'shower-set' | 'tap' | 'accessories' | 'water-tank' | 'pump' | 'pipes' | 'paint' | 'vanity' | 'mirror' | 'geyser'
  budgetTier: 'all' | 'under-10k' | '10k-25k' | '25k-50k' | '50k-plus' | 'custom';
  customMinPrice?: number;
  customMaxPrice?: number;
  qualityPreference: 'all' | 'budget' | 'standard' | 'premium';
  selectedBrand?: string;
  selectedColor?: string;
  searchQuery?: string;
}

export interface SmartProductFinderResult {
  inputs: SmartProductFinderInputs;
  matchedProducts: Product[];
  totalMatches: number;
}

// Bathroom Budget Finder Types
export interface BathroomBudgetInputs {
  bathroomType: 'small' | 'medium' | 'master' | 'commercial';
  budgetTierId: 'under-50k' | '50k-100k' | '100k-200k' | '200k-350k' | '350k-plus' | 'custom';
  customBudgetAmount?: number;
  requiredFixtureTypes: string[]; // e.g. ['toilets', 'faucets', 'showers', 'vanities', 'accessories', 'plumbing']
  preferredStyle: 'essential' | 'modern' | 'luxury';
  notes?: string;
}

export interface BathroomBudgetItem {
  categoryKey: string;
  categoryTitle: string;
  product?: Product;
  estimatedPrice: number;
  selectedVariant?: string;
  isRequired: boolean;
}

export interface BathroomBudgetPackageResult {
  inputs: BathroomBudgetInputs;
  targetBudget: number;
  totalPackagePrice: number;
  isWithinBudget: boolean;
  differenceAmount: number;
  statusMessage: string;
  urduStatusMessage: string;
  items: BathroomBudgetItem[];
}

// Water Tank & Pump Guide Types
export interface WaterTankPumpInputs {
  peopleCount: number; // 1-3 (3), 4-6 (5), 7-10 (8), 10+ (12)
  floorsCount: number; // 1, 2, 3, 4
  usageLevel: 'eco' | 'standard' | 'high'; // Eco (120L/person), Standard (160L/person), High (220L/person)
  groundStorageNeeded: boolean;
  waterSourceType: 'municipal' | 'borehole' | 'mixed';
}

export interface WaterTankPumpResult {
  inputs: WaterTankPumpInputs;
  dailyWaterRequirementLiters: number;
  dailyWaterRequirementGallons: number;
  recommendedOverheadTankLiters: number;
  recommendedOverheadTankGallons: number;
  recommendedUndergroundTankLiters?: number;
  recommendedPumpHorsepower: string; // e.g. "0.5 HP" | "1.0 HP" | "1.5 HP" | "2.0 HP"
  recommendedPipeSizeInches: string; // e.g. '1.0" Delivery Riser & 0.75" Line'
  summaryText: string;
  urduSummaryText: string;
  recommendedProducts: Product[];
  technicalTips: string[];
}

// ---------------------------------------------------------
// 6. SMART CONSTRUCTION & FITTING PACKAGE BUILDER TYPES
// ---------------------------------------------------------

export interface FittingItemVariant {
  id: string;
  itemId: string;
  sizeType: 'INCH' | 'MM' | 'OTHER' | 'CUSTOM';
  sizeLabel: string; // e.g. '½"', '¾"', '1"', '25mm', '32mm', '50mm', '13 ft'
  price: number | null; // null => Price on Call
  isPriceOnCall?: boolean;
  unit: string; // e.g. 'Piece', '13 ft Length', '10 ft Length', 'Foot', 'Meter', 'Bundle', 'Roll'
  length?: string; // e.g. '13 ft', '10 ft', '100m'
  material?: string; // e.g. 'UPVC', 'PPR', 'PVC', 'CPVC', 'HDPE', 'Brass', 'CP Chrome Plated', 'CI Cast Iron', 'GI Galvanized'
  brand?: string; // e.g. 'Master', 'Popular', 'Beta', 'Sonex', 'Turk Plast', 'IIL', 'Adamjee', 'Faisal'
  grade?: string; // e.g. 'Class B', 'Class C', 'Class D', 'PN 16', 'PN 20', 'Schedule 40', 'Schedule 80'
  thickness?: string; // e.g. 'Medium', 'Heavy', '3.2mm'
  sku?: string;
  enabled: boolean;
  sortOrder: number;
  stockStatus?: 'In Stock' | 'Available on Order' | 'Out of Stock';
}

export interface FittingItem {
  id: string;
  categoryId: string;
  name: string;
  urduName?: string;
  description?: string;
  image?: string;
  unit?: string; // default unit (e.g. 'Piece', 'Length')
  enabled: boolean;
  sortOrder: number;
  linkedProductId?: string; // Optional link to existing main product catalog
  defaultSizeType?: 'INCH' | 'MM' | 'OTHER' | 'CUSTOM';
  supportedSizeTypes?: ('INCH' | 'MM' | 'OTHER' | 'CUSTOM')[];
  material?: string;
  brand?: string;
  grade?: string;
  tags?: string[];
  variants: FittingItemVariant[];
}

export interface FittingCategory {
  id: string;
  slug?: string;
  packageTypeIds?: string[]; // Empty or ['all'] means universal across all packages
  name: string;
  urduName?: string;
  description?: string;
  iconName?: string;
  image?: string;
  enabled: boolean;
  sortOrder: number;
  isPipeCategory?: boolean; // dedicated pipe management support
}

export interface FittingPackageType {
  id: string;
  slug?: string;
  name: string;
  urduName?: string;
  subtitle?: string;
  description: string;
  iconName: string;
  image?: string;
  badge?: string;
  enabled: boolean;
  sortOrder: number;
  featured?: boolean;
  isFeatured?: boolean;
  recommendedCategoryIds?: string[];
  recommendedItemIds?: string[];
}

export interface FittingPackageItemInCart {
  id: string; // unique item-variant entry id
  packageTypeId?: string;
  packageTypeName?: string;
  itemId: string;
  itemName: string;
  name?: string; // alias for itemName
  urduName?: string;
  categoryId: string;
  categoryName: string;
  variantId: string;
  sizeType: 'INCH' | 'MM' | 'OTHER' | 'CUSTOM';
  sizeLabel: string;
  unit: string;
  length?: string;
  material?: string;
  brand?: string;
  grade?: string;
  image?: string;
  unitPrice: number | null; // null => Price on Call
  isPriceOnCall: boolean;
  quantity: number;
  lineTotal: number;
  subtotal?: number; // alias for lineTotal
  linkedProductId?: string;
}

export interface FittingBuilderConfig {
  isEnabled: boolean;
  title: string;
  subtitle: string;
  urduTitle?: string;
  urduSubtitle?: string;
  heroBadge?: string;
  entryCardBadge?: string;
  whatsappNumber?: string;
  whatsappDisclaimerNote?: string;
  packageTypes: FittingPackageType[];
  categories: FittingCategory[];
  items: FittingItem[];
  pipeTypes?: string[];
  commonUnits?: string[];
  heroHeading?: string;
  heroSubheading?: string;
  updatedAt?: string;
}

export type ConstructionBuilderConfig = FittingBuilderConfig;
export type ConstructionPackageItem = FittingPackageItemInCart;
export type FittingVariant = FittingItemVariant;

// =========================================================
// ADMIN-CONTROLLED PRODUCT PRICING TYPOGRAPHY
// =========================================================

export type PriceFontFamily = 
  | 'Plus Jakarta Sans'
  | 'Inter'
  | 'Poppins'
  | 'Montserrat'
  | 'Roboto'
  | 'Open Sans'
  | 'Lato'
  | 'Playfair Display'
  | 'DM Sans'
  | 'System Sans';

export type PriceFontWeight = '400' | '500' | '600' | '700' | '800';
export type PriceFontSizeScale = 'sm' | 'md' | 'lg' | 'xl';
export type PriceLetterSpacing = 'tight' | 'normal' | 'wide';
export type PriceStyle = 'normal' | 'bold' | 'semibold';

export interface PricingTypographySettings {
  color: string; // HEX or color code e.g. '#e5a93d'
  fontFamily: PriceFontFamily | string;
  fontWeight: PriceFontWeight;
  fontSizeScale: PriceFontSizeScale;
  priceStyle?: PriceStyle;
  letterSpacing?: PriceLetterSpacing;
}

export const defaultPricingTypography: PricingTypographySettings = {
  color: '#e5a93d', // Premium Gold / Amber accent
  fontFamily: 'Plus Jakarta Sans',
  fontWeight: '700',
  fontSizeScale: 'md',
  priceStyle: 'bold',
  letterSpacing: 'normal'
};










