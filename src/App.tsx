import React, { useState, useEffect } from 'react';
import { 
  customerReviews, 
  faqItems 
} from './data/storeData';
import { BusinessConfig, Product, ProductCategory, GalleryItem, Review, ProductBrand, StatCounter, AiDesignerConfig, CartItem, CheckoutSettings, HeroSettings, BuildMaterialEstimatorConfig, SmartToolsSettings, SmartToolId, ProductVariant, PaintShade, FittingBuilderConfig } from './types';
import { getActiveProductPrice } from './utils/pricingUtils';
import { 
  loadStoredConfig, 
  saveStoredConfig, 
  loadStoredProducts, 
  saveStoredProducts, 
  loadStoredCategories, 
  saveStoredCategories, 
  loadStoredGallery, 
  saveStoredGallery,
  loadStoredBrands,
  saveStoredBrands,
  loadStoredStats,
  saveStoredStats,
  getIsAdminLoggedIn,
  setIsAdminLoggedIn,
  loadPlannerConfig,
  savePlannerConfig,
  loadBuildMaterialEstimatorConfig,
  saveBuildMaterialEstimatorConfig,
  loadAiAssistantConfig,
  saveAiAssistantConfig,
  loadSmartToolsSettings,
  saveSmartToolsSettings,
  loadFittingBuilderConfig,
  saveFittingBuilderConfig,
  syncWithServerCMS,
  loadStoredContacts,
  saveStoredContacts,
  loadStoredCart,
  saveStoredCart,
  loadCheckoutSettings,
  loadStoredOrders,
  saveStoredOrders,
  addOrderToStorage,
  loadThemeSettings,
  saveThemeSettings,
  loadHeroSettings,
  saveHeroSettings,
  getActiveTheme,
  setActiveTheme
} from './utils/storage';
import { AiAssistantConfig, ContactPerson, ThemeSettings } from './types';
import { ThemeSwitcherModal } from './components/ThemeSwitcherModal';
import { FloatingAiChat } from './components/FloatingAiChat';
import { 
  trackPageView, 
  trackProductView, 
  trackCategoryClick, 
  trackAction 
} from './utils/analyticsStorage';

import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { FeatureBar } from './components/FeatureBar';
import { SmartToolsSection } from './components/SmartToolsSection';
import { SmartToolsModal } from './components/SmartToolsModal';
import { SmartConstructionBuilderModal } from './components/SmartConstructionBuilderModal';
import { SmartConstructionBuilderEntryCard } from './components/SmartConstructionBuilderEntryCard';
import { AboutSection } from './components/AboutSection';
import { CategoriesSection } from './components/CategoriesSection';
import { BrandsSection } from './components/BrandsSection';
import { FeaturedProductsSection } from './components/FeaturedProductsSection';
import { StatsSection } from './components/StatsSection';
import { WhyChooseUs } from './components/WhyChooseUs';
import { GallerySection } from './components/GallerySection';
import { ReviewsSection } from './components/ReviewsSection';
import { FaqSection } from './components/FaqSection';
import { ContactSection } from './components/ContactSection';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { QuickViewModal } from './components/QuickViewModal';
import { BrandDetailsModal } from './components/BrandDetailsModal';
import { AiConsultantModal } from './components/AiConsultantModal';
import { BusinessConfigModal } from './components/BusinessConfigModal';
import { AdvancedSearchModal } from './components/AdvancedSearchModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { CustomerAccountModal } from './components/CustomerAccountModal';
import { loadCustomerProfile, saveCustomerProfile } from './utils/customerStorage';
import { supabase, initializeSupabaseRuntime } from './lib/supabase';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminProductModal } from './components/AdminProductModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { OrderCheckoutModal } from './components/OrderCheckoutModal';
import { CinematicIntro } from './components/CinematicIntro';
import { LuxuryCursorEffect } from './components/LuxuryCursorEffect';
import { DeliveryCheckerModal } from './components/DeliveryCheckerModal';
import { DeliveryAreasPage } from './components/DeliveryAreasPage';

export default function App() {
  // Showroom Cinematic presentation can be replayed on demand from footer
  const [showIntro, setShowIntro] = useState<boolean>(false);

  const handleIntroComplete = () => {
    try {
      sessionStorage.setItem('zt_intro_played', 'true');
    } catch (e) {
      console.warn('sessionStorage error:', e);
    }
    setShowIntro(false);
  };

  const [config, setConfig] = useState<BusinessConfig>(() => loadStoredConfig());
  const [products, setProducts] = useState<Product[]>(() => loadStoredProducts());
  const [categories, setCategories] = useState<ProductCategory[]>(() => loadStoredCategories());
  const [brands, setBrands] = useState<ProductBrand[]>(() => loadStoredBrands());
  const [stats, setStats] = useState<StatCounter[]>(() => loadStoredStats());
  const [contacts, setContacts] = useState<ContactPerson[]>(() => loadStoredContacts());
  const [gallery, setGallery] = useState<GalleryItem[]>(() => loadStoredGallery());
  const [plannerConfig, setPlannerConfig] = useState<AiDesignerConfig>(() => loadPlannerConfig());
  const [estimatorConfig, setEstimatorConfig] = useState<BuildMaterialEstimatorConfig>(() => loadBuildMaterialEstimatorConfig());
  const [fittingBuilderConfig, setFittingBuilderConfig] = useState<FittingBuilderConfig>(() => loadFittingBuilderConfig());
  const [isConstructionBuilderOpen, setIsConstructionBuilderOpen] = useState(false);
  const [aiAssistantConfig, setAiAssistantConfig] = useState<AiAssistantConfig>(() => loadAiAssistantConfig());
  const [smartToolsSettings, setSmartToolsSettings] = useState<SmartToolsSettings>(() => loadSmartToolsSettings());
  const [activeToolId, setActiveToolId] = useState<SmartToolId | 'hub' | null>(null);
  const [heroSettings, setHeroSettings] = useState<HeroSettings>(() => loadHeroSettings());
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => loadThemeSettings());
  const [activeTheme, setActiveThemeState] = useState<string>(() => getActiveTheme(loadThemeSettings().defaultTheme));
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(customerReviews);

  // Apply active theme data-theme attribute
  useEffect(() => {
    if (activeTheme) {
      document.documentElement.setAttribute('data-theme', activeTheme);
    }
  }, [activeTheme]);

  const handleSelectTheme = (themeId: string) => {
    setActiveThemeState(themeId);
    setActiveTheme(themeId);
  };

  // Cart, Wishlist, Compare
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadStoredCart());
  const [directCheckoutItem, setDirectCheckoutItem] = useState<CartItem | null>(null);
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings>(() => loadCheckoutSettings());
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Automatically persist cart whenever it changes
  useEffect(() => {
    saveStoredCart(cartItems);
  }, [cartItems]);

  // Keep cart items updated if admin edits product details (Name, Price, Image, Stock)
  useEffect(() => {
    if (products.length > 0) {
      setCartItems(prev => {
        let changed = false;
        const updated = prev.map(item => {
          const latestProd = products.find(p => p.id === item.product.id);
          if (latestProd && latestProd !== item.product) {
            changed = true;
            return { ...item, product: latestProd };
          }
          return item;
        });
        return changed ? updated : prev;
      });
    }
  }, [products]);

  const isFullyAuthenticated = (): boolean => {
    try {
      const hasToken = getIsAdminLoggedIn();
      const hasPin = sessionStorage.getItem('zst_admin_time_pin_verified') === 'true';
      const hasPattern = sessionStorage.getItem('zst_admin_pattern_verified') === 'true';
      return Boolean(hasToken && hasPin && hasPattern);
    } catch {
      return false;
    }
  };

  const [isAdmin, setIsAdmin] = useState<boolean>(() => isFullyAuthenticated());
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);
  const [adminProductModalOpen, setAdminProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<ProductBrand | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [orderTrackingOpen, setOrderTrackingOpen] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(() => loadCustomerProfile());
  const [customerOrders, setCustomerOrders] = useState(() => loadStoredOrders());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [deliveryCheckerOpen, setDeliveryCheckerOpen] = useState(false);
  const [viewDeliveryAreasPage, setViewDeliveryAreasPage] = useState(false);

  // Real-time synchronization of customer orders and admin settings across the public website
  useEffect(() => {
    const handleOrderStatusUpdated = () => {
      setCustomerOrders(loadStoredOrders());
    };
    const handleProductsUpdated = () => setProducts(loadStoredProducts());
    const handleCategoriesUpdated = () => setCategories(loadStoredCategories());
    const handleBrandsUpdated = () => setBrands(loadStoredBrands());
    const handleConfigUpdated = () => setConfig(loadStoredConfig());
    const handleCheckoutSettingsUpdated = () => setCheckoutSettings(loadCheckoutSettings());
    const handleHeroSettingsUpdated = () => setHeroSettings(loadHeroSettings());
    const handleThemeSettingsUpdated = () => setThemeSettings(loadThemeSettings());
    const handleSmartToolsUpdated = () => setSmartToolsSettings(loadSmartToolsSettings());

    window.addEventListener('zst_order_status_updated', handleOrderStatusUpdated);
    window.addEventListener('zst_products_updated', handleProductsUpdated);
    window.addEventListener('zst_categories_updated', handleCategoriesUpdated);
    window.addEventListener('zst_brands_updated', handleBrandsUpdated);
    window.addEventListener('zst_config_updated', handleConfigUpdated);
    window.addEventListener('zst_checkout_settings_updated', handleCheckoutSettingsUpdated);
    window.addEventListener('zst_hero_settings_updated', handleHeroSettingsUpdated);
    window.addEventListener('zst_theme_updated', handleThemeSettingsUpdated);
    window.addEventListener('zst_smart_tools_updated', handleSmartToolsUpdated);

    return () => {
      window.removeEventListener('zst_order_status_updated', handleOrderStatusUpdated);
      window.removeEventListener('zst_products_updated', handleProductsUpdated);
      window.removeEventListener('zst_categories_updated', handleCategoriesUpdated);
      window.removeEventListener('zst_brands_updated', handleBrandsUpdated);
      window.removeEventListener('zst_config_updated', handleConfigUpdated);
      window.removeEventListener('zst_checkout_settings_updated', handleCheckoutSettingsUpdated);
      window.removeEventListener('zst_hero_settings_updated', handleHeroSettingsUpdated);
      window.removeEventListener('zst_theme_updated', handleThemeSettingsUpdated);
      window.removeEventListener('zst_smart_tools_updated', handleSmartToolsUpdated);
    };
  }, []);

  // When order tracking modal is opened, refresh stored orders
  useEffect(() => {
    if (orderTrackingOpen) {
      setCustomerOrders(loadStoredOrders());
    }
  }, [orderTrackingOpen]);

  // Diagnostic tracking for React categories state hydration
  useEffect(() => {
    console.log(`[React State Diagnostics] Categories state contains ${categories.length} total categories [Sample: ${categories.slice(0, 5).map(c => c.name).join(', ')}]`);
  }, [categories]);

  // Sync with server CMS data on mount
  useEffect(() => {
    trackPageView(window.location.pathname);
    syncWithServerCMS({
      setConfig,
      setProducts,
      setCategories,
      setBrands,
      setStats,
      setContacts,
      setGallery,
      setPlannerConfig,
      setEstimatorConfig,
      setAiAssistantConfig,
      setSmartToolsSettings,
      setThemeSettings,
      setHeroSettings,
      setOrders: setCustomerOrders,
      customerId: customerProfile?.customerId
    });
  }, [customerProfile?.customerId]);

  // Keyboard shortcut Ctrl+Shift+A or Cmd+Shift+A to trigger Admin Login discreetly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA')) {
        e.preventDefault();
        setAdminLoginOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen to Supabase auth session changes
  useEffect(() => {
    let isMounted = true;
    initializeSupabaseRuntime().then(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (isMounted) {
          if (data?.session?.user) {
            if (isFullyAuthenticated()) {
              setIsAdmin(true);
              setIsAdminLoggedIn(true);
            }
          }
        }
      }).catch(() => {});
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (isMounted) {
        if (event === 'SIGNED_OUT') {
          setIsAdmin(false);
          setIsAdminLoggedIn(false);
          try {
            sessionStorage.removeItem('zst_admin_time_pin_verified');
            sessionStorage.removeItem('zst_admin_pattern_verified');
            localStorage.removeItem('zst_admin_token');
          } catch {}
        } else if (session?.user) {
          if (isFullyAuthenticated()) {
            setIsAdmin(true);
            setIsAdminLoggedIn(true);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  // Cart Operations with Variant Pricing Single Source of Truth
  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    selectedColor?: string,
    selectedSize?: string,
    selectedQuality?: string,
    selectedVariant?: string,
    selectedShade?: { name: string; id?: string; code?: string; colorHex?: string; image?: string; priceAdjustment?: number },
    selectedVariantObj?: ProductVariant
  ) => {
    // Determine active variant and pricing details
    const activePricing = getActiveProductPrice(product, selectedVariantObj || selectedVariant);
    const finalVariant = activePricing.activeVariant || selectedVariantObj;
    const finalVariantName = finalVariant ? finalVariant.name : selectedVariant;

    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id &&
        (item.selectedColor || '') === (selectedColor || '') &&
        (item.selectedSize || '') === (selectedSize || '') &&
        (item.selectedQuality || '') === (selectedQuality || '') &&
        (item.selectedVariant || '') === (finalVariantName || '') &&
        (item.selectedShade || '') === (selectedShade?.name || '')
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + (quantity || 1);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          selectedVariant: finalVariantName,
          selectedVariantId: finalVariant?.id || updated[existingIndex].selectedVariantId,
          selectedVariantName: finalVariant?.name || finalVariantName,
          selectedOptionName: product.optionName || product.variantsConfig?.optionName || 'Option',
          selectedVariantPrice: activePricing.effectivePriceNumeric,
          selectedVariantSku: finalVariant?.sku || updated[existingIndex].selectedVariantSku
        };
        return updated;
      }

      return [
        ...prev,
        {
          product,
          quantity: quantity || 1,
          selectedColor,
          selectedSize,
          selectedQuality,
          selectedVariant: finalVariantName,
          selectedVariantId: finalVariant?.id,
          selectedVariantName: finalVariant?.name || finalVariantName,
          selectedOptionName: product.optionName || product.variantsConfig?.optionName || 'Option',
          selectedVariantPrice: activePricing.effectivePriceNumeric,
          selectedVariantSku: finalVariant?.sku,
          selectedShade: selectedShade?.name,
          selectedShadeId: selectedShade?.id,
          selectedShadeCode: selectedShade?.code,
          selectedShadeColor: selectedShade?.colorHex,
          selectedShadeImage: selectedShade?.image,
          selectedShadePriceAdjustment: selectedShade?.priceAdjustment
        }
      ];
    });
    setCartOpen(true);
  };

  // Buy Now: Creates a direct isolated checkout containing ONLY the selected product without touching or altering existing cart items
  const handleBuyNow = (
    product: Product,
    quantity: number = 1,
    selectedColor?: string,
    selectedSize?: string,
    selectedQuality?: string,
    selectedVariant?: string,
    selectedShade?: { name: string; id?: string; code?: string; colorHex?: string; image?: string; priceAdjustment?: number },
    selectedVariantObj?: ProductVariant
  ) => {
    const activePricing = getActiveProductPrice(product, selectedVariantObj || selectedVariant);
    const finalVariant = activePricing.activeVariant || selectedVariantObj;
    const finalVariantName = finalVariant ? finalVariant.name : selectedVariant;

    const directItem: CartItem = {
      product,
      quantity: quantity || 1,
      selectedColor,
      selectedSize,
      selectedQuality,
      selectedVariant: finalVariantName,
      selectedVariantId: finalVariant?.id,
      selectedVariantName: finalVariant?.name || finalVariantName,
      selectedOptionName: product.optionName || product.variantsConfig?.optionName || 'Option',
      selectedVariantPrice: activePricing.effectivePriceNumeric,
      selectedVariantSku: finalVariant?.sku,
      selectedShade: selectedShade?.name,
      selectedShadeId: selectedShade?.id,
      selectedShadeCode: selectedShade?.code,
      selectedShadeColor: selectedShade?.colorHex,
      selectedShadeImage: selectedShade?.image,
      selectedShadePriceAdjustment: selectedShade?.priceAdjustment
    };

    setDirectCheckoutItem(directItem);
    setCartOpen(false);
    setSelectedProduct(null);
    setCheckoutModalOpen(true);
  };

  const handleUpdateCartQty = (cartIndex: number, delta: number) => {
    setCartItems(prev => {
      if (cartIndex < 0 || cartIndex >= prev.length) return prev;
      const updated = [...prev];
      const newQty = updated[cartIndex].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, idx) => idx !== cartIndex);
      }
      updated[cartIndex] = { ...updated[cartIndex], quantity: newQty };
      return updated;
    });
  };

  const handleRemoveFromCart = (cartIndex: number) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== cartIndex));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Wishlist & Compare Operations
  const handleToggleWishlist = (productId: string) => {
    setWishlistIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const handleToggleCompare = (productId: string) => {
    setCompareIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // Persistence handlers
  const handleSaveProductsState = async (updatedProducts: Product[]) => {
    const res = await saveStoredProducts(updatedProducts);
    if (res && res.success) {
      setProducts(updatedProducts);
    }
    return res;
  };

  const handleSaveCategoriesState = async (updatedCategories: ProductCategory[]) => {
    const res = await saveStoredCategories(updatedCategories);
    if (res && res.success) {
      setCategories(updatedCategories);
    }
    return res;
  };

  const handleSaveBrandsState = async (updatedBrands: ProductBrand[]) => {
    const res = await saveStoredBrands(updatedBrands);
    if (res && res.success) {
      setBrands(updatedBrands);
    }
    return res;
  };

  const handleSaveStatsState = async (updatedStats: StatCounter[]) => {
    const res = await saveStoredStats(updatedStats);
    if (res && res.success) {
      setStats(updatedStats);
    }
    return res;
  };

  const handleSaveContactsState = async (updatedContacts: ContactPerson[]) => {
    const res = await saveStoredContacts(updatedContacts);
    if (res && res.success) {
      setContacts(updatedContacts);
    }
    return res;
  };

  const handleSaveConfigState = async (updatedConfig: BusinessConfig) => {
    const res = await saveStoredConfig(updatedConfig);
    if (res && res.success) {
      setConfig(updatedConfig);
    }
    return res;
  };

  const handleSaveGalleryState = async (updatedGallery: GalleryItem[]) => {
    const res = await saveStoredGallery(updatedGallery);
    if (res && res.success) {
      setGallery(updatedGallery);
    }
    return res;
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setIsAdminLoggedIn(true);
    setAdminDashboardOpen(true);
  };

  const handleAdminLogout = async () => {
    try {
      await initializeSupabaseRuntime();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Admin Auth] Logout error:', err);
    }
    try {
      sessionStorage.removeItem('zst_admin_time_pin_verified');
      sessionStorage.removeItem('zst_admin_pattern_verified');
      localStorage.removeItem('zst_admin_token');
    } catch {}
    setIsAdmin(false);
    setIsAdminLoggedIn(false);
    setAdminDashboardOpen(false);
  };

  const handleAddReview = (newReview: Review) => {
    setReviews([newReview, ...reviews]);
  };

  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategoryFilter(categoryId);
    const catObj = categories.find(c => c.id === categoryId);
    trackCategoryClick(categoryId, catObj ? catObj.name : categoryId);

    const element = document.getElementById('products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickViewProduct = (prod: Product) => {
    setSelectedProduct(prod);
    trackProductView(prod.id, prod.name);
  };

  // Product Admin Operations
  const handleSaveProduct = async (updatedProduct: Product) => {
    const exists = products.some(p => p.id === updatedProduct.id);
    let updated: Product[];
    if (exists) {
      updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    } else {
      updated = [updatedProduct, ...products];
    }
    const res = await handleSaveProductsState(updated);
    if (res && res.success === false) {
      alert(`Save failed: ${res.error || 'Database error'}`);
      return;
    }

    if (selectedProduct && selectedProduct.id === updatedProduct.id) {
      setSelectedProduct(updatedProduct);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    handleSaveProductsState(updated);

    if (selectedProduct && selectedProduct.id === productId) {
      setSelectedProduct(null);
    }
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setAdminProductModalOpen(true);
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setAdminProductModalOpen(true);
  };

  const totalCartCount = (cartItems || []).reduce((sum, item) => sum + (item?.quantity || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">
      
      {/* Luxury Interactive Cursor Effect */}
      <LuxuryCursorEffect />

      {/* Cinematic Intro Opening */}
      {showIntro && (
        <CinematicIntro onComplete={handleIntroComplete} />
      )}

      {/* Local Business JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HomeGoodsStore",
            "name": config.name,
            "description": config.tagline,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": config.address,
              "addressCountry": "PK"
            },
            "telephone": config.phone,
            "email": config.email,
            "openingHours": [config.hoursWeekday, config.hoursSunday],
            "priceRange": "$$$"
          })
        }}
      />

      {/* Navigation Bar */}
      <Navbar
        config={config}
        categories={categories}
        isAdmin={isAdmin}
        cartCount={totalCartCount}
        wishlistCount={wishlistIds.length}
        compareCount={compareIds.length}
        onOpenCart={() => setCartOpen(true)}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onOpenWishlist={() => {
          const el = document.getElementById('products');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenCompare={() => {
          const el = document.getElementById('products');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onLogoutAdmin={handleAdminLogout}
        onOpenAdminDashboard={() => setAdminDashboardOpen(true)}
        onOpenAiConsultant={() => setAiModalOpen(true)}
        onSearchClick={() => setSearchModalOpen(true)}
        onOpenOrderTracking={() => setOrderTrackingOpen(true)}
        onSelectCategory={handleSelectCategory}
        onOpenSmartTool={(toolId) => setActiveToolId(toolId)}
        onOpenConstructionBuilder={() => setIsConstructionBuilderOpen(true)}
        onOpenDeliveryChecker={() => setDeliveryCheckerOpen(true)}
        onOpenDeliveryAreas={() => setViewDeliveryAreasPage(true)}
      />

      {/* Main Page Sections OR Delivery Areas Page */}
      {viewDeliveryAreasPage ? (
        <DeliveryAreasPage
          onBackToHome={() => setViewDeliveryAreasPage(false)}
          onOpenProductQuickView={(prodId) => {
            const found = products.find(p => p.id === prodId);
            if (found) setSelectedProduct(found);
          }}
        />
      ) : (
        <main id="main-content" className="relative z-10">
          <HeroSection
            products={products}
            categories={categories}
            brands={brands}
            heroSettings={heroSettings}
            onSelectProduct={(prod) => setSelectedProduct(prod)}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onOpenAiConsultant={() => setAiModalOpen(true)}
          />

          {/* Feature Highlights Bar */}
          <FeatureBar />

          <AboutSection config={config} />

          {/* Categories / Departments Navigation */}
          <CategoriesSection
            categories={categories}
            config={config}
            onSelectCategory={handleSelectCategory}
          />

          {/* Authorized Brands */}
          <BrandsSection
            brands={brands}
            products={products}
          />

          {/* Featured Products & Storefront Catalog */}
          <FeaturedProductsSection
            products={products}
            categories={categories}
            config={config}
            isAdmin={isAdmin}
            wishlistIds={wishlistIds}
            compareIds={compareIds}
            onQuickView={handleQuickViewProduct}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onToggleWishlist={handleToggleWishlist}
            onToggleCompare={handleToggleCompare}
            onAddProduct={handleOpenAddProduct}
            onEditProduct={handleOpenEditProduct}
            onDeleteProduct={handleDeleteProduct}
            selectedCategoryFilter={selectedCategoryFilter}
          />

          {/* 🔧 SMART CONSTRUCTION & FITTING PACKAGE BUILDER (HOMEPAGE ENTRY CARD) */}
          <SmartConstructionBuilderEntryCard
            onOpenBuilder={() => setIsConstructionBuilderOpen(true)}
            config={fittingBuilderConfig}
          />

          {/* COMPACT SMART TOOLS HUB (Cement Calculator, Bathroom Planner, Material Estimator, Budget Finder, Water Tank & Pump Guide) */}
          <SmartToolsSection
            settings={smartToolsSettings}
            onOpenTool={(toolId) => setActiveToolId(toolId)}
          />

          <StatsSection stats={stats} />

          <WhyChooseUs />

          <GallerySection items={gallery} />

          <ReviewsSection
            reviews={reviews}
            onAddReview={handleAddReview}
          />

          <FaqSection faqs={faqItems} />

          <ContactSection config={config} contacts={contacts} />
        </main>
      )}

      {/* Sticky Floating WhatsApp */}
      <FloatingWhatsApp config={config} />

      {/* Floating Ultra-Premium AI Sales Assistant */}
      <FloatingAiChat
        products={products}
        categories={categories}
        brands={brands}
        config={config}
        aiAssistantConfig={aiAssistantConfig}
        onViewProduct={(prod) => setSelectedProduct(prod)}
        onAddToCart={handleAddToCart}
        onSelectCategory={(catId) => {
          setSelectedCategoryFilter(catId);
          const el = document.getElementById('products');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenPlanner={() => {
          setActiveToolId('bathroom-planner');
        }}
      />

      {/* Footer */}
      <Footer
        config={config}
        onSelectCategory={handleSelectCategory}
        onReplayIntro={() => setShowIntro(true)}
        onOpenThemeModal={() => setThemeModalOpen(true)}
        onOpenDeliveryChecker={() => setDeliveryCheckerOpen(true)}
        onOpenDeliveryAreas={() => setViewDeliveryAreasPage(true)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        cartItems={cartItems}
        config={config}
        checkoutSettings={checkoutSettings}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setCartOpen(false);
          setCheckoutModalOpen(true);
        }}
      />

      {/* Order Checkout Modal */}
      <OrderCheckoutModal
        isOpen={checkoutModalOpen}
        cartItems={cartItems}
        directItem={directCheckoutItem}
        config={config}
        checkoutSettings={checkoutSettings}
        onClose={() => {
          setCheckoutModalOpen(false);
          setDirectCheckoutItem(null);
        }}
        onOrderPlaced={async (newOrder) => {
          const res = await addOrderToStorage(newOrder);
          if (!res.success) {
            console.error(`Could not save order: ${res.error || 'Database error'}`);
          }
          
          // If this was a normal cart checkout, clear cart; if it was Buy Now, leave normal cart untouched!
          if (!directCheckoutItem) {
            setCartItems([]);
            saveStoredCart([]);
          } else {
            setDirectCheckoutItem(null);
          }

          const currentOrders = loadStoredOrders();
          setCustomerOrders(currentOrders);

          // Update customer profile if basic fields missing
          const updatedProf = { ...customerProfile };
          if (!updatedProf.fullName && newOrder.customerName) updatedProf.fullName = newOrder.customerName;
          if (!updatedProf.phoneNumber && newOrder.phoneNumber) updatedProf.phoneNumber = newOrder.phoneNumber;
          if (!updatedProf.city && newOrder.city) updatedProf.city = newOrder.city;
          if (!updatedProf.areaLocality && newOrder.areaLocality) updatedProf.areaLocality = newOrder.areaLocality;
          if (!updatedProf.completeAddress && newOrder.deliveryAddress) updatedProf.completeAddress = newOrder.deliveryAddress;
          setCustomerProfile(updatedProf);
          saveCustomerProfile(updatedProf);
        }}
      />

      {/* Modals */}
      {selectedProduct && (
        <QuickViewModal
          product={selectedProduct}
          config={config}
          allProducts={products}
          isAdmin={isAdmin}
          onEditProduct={(prod) => handleOpenEditProduct(prod)}
          onDeleteProduct={handleDeleteProduct}
          onSelectProduct={(prod) => setSelectedProduct(prod)}
          onAddToCart={(prod, qty, color, size, quality, variant, shade) => {
            handleAddToCart(prod, qty, color, size, quality, variant, shade);
          }}
          onBuyNow={(prod, qty, color, size, quality, variant, shade, variantObj) => {
            handleBuyNow(prod, qty, color, size, quality, variant, shade, variantObj);
          }}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {selectedBrand && (
        <BrandDetailsModal
          brand={selectedBrand}
          products={products}
          onClose={() => setSelectedBrand(null)}
          onSelectProduct={(prod) => setSelectedProduct(prod)}
        />
      )}

      {aiModalOpen && (
        <AiConsultantModal
          config={config}
          onClose={() => setAiModalOpen(false)}
        />
      )}

      {configModalOpen && isAdmin && (
        <BusinessConfigModal
          config={config}
          onSave={handleSaveConfigState}
          onClose={() => setConfigModalOpen(false)}
        />
      )}

      {/* Advanced Search Modal */}
      <AdvancedSearchModal
        isOpen={searchModalOpen}
        products={products}
        categories={categories}
        brands={brands}
        onSelectProduct={(prod) => {
          setSelectedProduct(prod);
          setSearchModalOpen(false);
        }}
        onSelectCategory={(cat) => {
          const catId = typeof cat === 'string' ? cat : (cat as any)?.id || '';
          handleSelectCategory(catId);
          setSearchModalOpen(false);
        }}
        onClose={() => setSearchModalOpen(false)}
      />

      {/* Order Tracking & Customer Portal Modal */}
      <CustomerAccountModal
        isOpen={orderTrackingOpen}
        onClose={() => setOrderTrackingOpen(false)}
        profile={customerProfile}
        orders={customerOrders}
        config={config}
        onUpdateProfile={(updated) => {
          setCustomerProfile(updated);
          saveCustomerProfile(updated);
        }}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={adminLoginOpen}
        isAdmin={isAdmin}
        onLoginSuccess={handleAdminLoginSuccess}
        onLogout={handleAdminLogout}
        onClose={() => setAdminLoginOpen(false)}
        onOpenDashboard={() => {
          setAdminLoginOpen(false);
          setAdminDashboardOpen(true);
        }}
      />

      {/* Full Admin Content Management System (CMS) Dashboard */}
      {adminDashboardOpen && isAdmin && (
        <AdminDashboard
          products={products}
          categories={categories}
          brands={brands}
          stats={stats}
          config={config}
          gallery={gallery}
          contacts={contacts}
          heroSettings={heroSettings}
          smartToolsSettings={smartToolsSettings}
          fittingBuilderConfig={fittingBuilderConfig}
          onSaveProducts={handleSaveProductsState}
          onSaveCategories={handleSaveCategoriesState}
          onSaveBrands={handleSaveBrandsState}
          onSaveStats={handleSaveStatsState}
          onSaveConfig={handleSaveConfigState}
          onSaveGallery={handleSaveGalleryState}
          onSaveContacts={handleSaveContactsState}
          onSaveHeroSettings={async (hs) => {
            const res = await saveHeroSettings(hs);
            if (res && res.success) {
              setHeroSettings(hs);
            }
            return res;
          }}
          onSaveSmartToolsSettings={async (st) => {
            const res = await saveSmartToolsSettings(st);
            if (res && res.success) {
              setSmartToolsSettings(st);
            }
            return res;
          }}
          onSaveFittingBuilderConfig={async (fc) => {
            setFittingBuilderConfig(fc);
            const res = await saveFittingBuilderConfig(fc);
            return res;
          }}
          onLogout={handleAdminLogout}
          onClose={() => setAdminDashboardOpen(false)}
        />
      )}

      {/* Quick Admin Product Create / Edit Modal from storefront */}
      {adminProductModalOpen && isAdmin && (
        <AdminProductModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          allProducts={products}
          onSave={handleSaveProduct}
          onDelete={handleDeleteProduct}
          onClose={() => {
            setAdminProductModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}
      {/* Theme Selection Modal */}
      <ThemeSwitcherModal
        isOpen={themeModalOpen}
        onClose={() => setThemeModalOpen(false)}
        themeSettings={themeSettings}
        activeThemeId={activeTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* 🔧 SMART CONSTRUCTION & FITTING BUILDER MODAL */}
      <SmartConstructionBuilderModal
        isOpen={isConstructionBuilderOpen}
        onClose={() => setIsConstructionBuilderOpen(false)}
        config={fittingBuilderConfig}
        businessConfig={config}
        products={products}
        onAddToCart={handleAddToCart}
        onAddPackageToCart={(items) => {
          items.forEach(item => {
            handleAddToCart(
              item.product,
              item.quantity,
              undefined,
              undefined,
              undefined,
              item.selectedVariantName
            );
          });
        }}
        onViewProduct={(p) => setSelectedProduct(p)}
      />

      {/* Smart Tools Modal */}
      <SmartToolsModal
        toolId={activeToolId}
        products={products}
        config={config}
        estimatorConfig={estimatorConfig}
        plannerConfig={plannerConfig}
        smartToolsSettings={smartToolsSettings}
        fittingBuilderConfig={fittingBuilderConfig}
        onClose={() => setActiveToolId(null)}
        onOpenQuickView={(prod) => setSelectedProduct(prod)}
        onAddToCart={handleAddToCart}
        onBuyNow={(prod, qty, color) => {
          setActiveToolId(null);
          handleBuyNow(prod, qty, color);
        }}
      />
      {/* Delivery Checker Modal Across Pakistan */}
      <DeliveryCheckerModal
        isOpen={deliveryCheckerOpen}
        onClose={() => setDeliveryCheckerOpen(false)}
      />
    </div>
  );
}
