import React, { useState, useEffect, useRef } from 'react';
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
  trackAction,
  startLiveVisitorTracking
} from './utils/analyticsStorage';
import { 
  initNavigationHistory, 
  pushNavigationState, 
  replaceNavigationState,
  navigateBackSafe, 
  addNavigationListener,
  resetToHome
} from './utils/navigationHistory';

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
import { FloatingCartBadge } from './components/FloatingCartBadge';
import { OrderCheckoutModal } from './components/OrderCheckoutModal';
import { CinematicIntro } from './components/CinematicIntro';
import { LuxuryCursorEffect } from './components/LuxuryCursorEffect';
import { DeliveryCheckerModal } from './components/DeliveryCheckerModal';
import { DeliveryAreasPage } from './components/DeliveryAreasPage';

// Multi-Page E-commerce Pages
import { StorePage } from './pages/StorePage';
import { CategoriesPage } from './pages/CategoriesPage';
import { CategoryDetailPage } from './pages/CategoryDetailPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { BrandsPage } from './pages/BrandsPage';
import { BrandDetailPage } from './pages/BrandDetailPage';
import { SmartToolsPage } from './pages/SmartToolsPage';
import { DeliveryPage } from './pages/DeliveryPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { 
  findProductBySlug, 
  findCategoryBySlug, 
  findBrandBySlug, 
  getProductSlug,
  generateProductSlug, 
  generateCategorySlug, 
  generateBrandSlug 
} from './utils/slugUtils';
import { updateSeoMetadata } from './utils/seoUtils';

export default function App() {
  // Showroom Cinematic opening presentation (plays once on page load, can be replayed from footer)
  const [showIntro, setShowIntro] = useState<boolean>(true);

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
  const [lastCartAdded, setLastCartAdded] = useState<{ timestamp: number; productName: string } | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const orderCompletedRef = useRef<boolean>(false);
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

  // Canonical Multi-Page Routing State
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const navigateTo = (path: string) => {
    const clean = path || '/';
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== clean) {
        window.history.pushState({ zst_app_state: true, path: clean }, '', clean);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Ensure all modal overlays are cleanly closed on page navigation
    setSelectedProduct(null);
    setSelectedBrand(null);
    setCartOpen(false);
    setCheckoutModalOpen(false);
    setSearchModalOpen(false);
    setCurrentPath(clean);
  };

  // Dedicated transition handler from QuickView modal to full product details page
  const handleViewProductDetailsPage = (prod: Product) => {
    const slug = getProductSlug(prod);
    const path = `/product/${slug}`;
    if (typeof window !== 'undefined') {
      window.history.replaceState({ zst_app_state: true, path }, '', path);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setSelectedProduct(null);
    setSelectedBrand(null);
    setCartOpen(false);
    setCheckoutModalOpen(false);
    setSearchModalOpen(false);
    setCurrentPath(path);
  };

  // Sync browser popstate navigation directly
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname || '/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize dynamic SEO metadata across pages and canonical routes
  useEffect(() => {
    const path = currentPath;
    if (path === '/' || path === '') {
      updateSeoMetadata({
        title: `${config.name || 'Zafar Sarwar Traders'} | Luxury Sanitaryware & Building Materials Pakistan`,
        description: 'Pakistan\'s premier destination for luxury sanitaryware, designer faucets, rain showers, Master paints, PVC pipes, cement, and construction materials.',
        path: '/'
      });
    } else if (path === '/store' || path === '/products') {
      updateSeoMetadata({
        title: 'Online Store & Building Material Catalog | Zafar Sarwar Traders',
        description: 'Shop luxury sanitaryware, CPVC pipes, Master paints, bathroom accessories, and construction materials online with delivery across Pakistan.',
        path: '/store'
      });
    } else if (path === '/categories') {
      updateSeoMetadata({
        title: 'Product Categories & Departments | Zafar Sarwar Traders',
        description: 'Browse bathroom fixtures, sanitary fittings, tiles, paints, hardware, and plumbing solutions.',
        path: '/categories'
      });
    } else if (path.startsWith('/category/')) {
      const slug = path.slice('/category/'.length);
      const cat = findCategoryBySlug(slug, categories);
      if (cat) {
        updateSeoMetadata({
          title: `${cat.name} | Zafar Sarwar Traders`,
          description: cat.description || `Browse our verified collection of ${cat.name} at Zafar Sarwar Traders with delivery across Pakistan.`,
          path: `/category/${slug}`,
          image: cat.image
        });
      }
    } else if (path.startsWith('/product/')) {
      const slug = path.slice('/product/'.length);
      const prod = findProductBySlug(slug, products);
      if (prod) {
        updateSeoMetadata({
          title: `${prod.name} | Buy Online | Zafar Sarwar Traders`,
          description: prod.description || `Buy ${prod.name} at guaranteed wholesale prices from Zafar Sarwar Traders with fast delivery across Pakistan.`,
          path: `/product/${slug}`,
          image: prod.image,
          type: 'product'
        });
      }
    } else if (path === '/brands') {
      updateSeoMetadata({
        title: 'Authorized Brands & Manufacturers | Zafar Sarwar Traders',
        description: 'Official distributor for Master Sanitary, Porta, Grohe, Sonex, Diamond Pipes, and premier building material brands.',
        path: '/brands'
      });
    } else if (path.startsWith('/brand/')) {
      const slug = path.slice('/brand/'.length);
      const brand = findBrandBySlug(slug, brands);
      if (brand) {
        updateSeoMetadata({
          title: `${brand.name} Products & Catalog | Zafar Sarwar Traders`,
          description: brand.description || `Explore genuine products from ${brand.name} at Zafar Sarwar Traders.`,
          path: `/brand/${slug}`,
          image: brand.logo
        });
      }
    } else if (path === '/smart-tools' || path === '/tools') {
      updateSeoMetadata({
        title: 'Smart Construction Calculators & Planners | Zafar Sarwar Traders',
        description: 'Free building material estimator, cement calculator, easy bathroom planner, pipe sizing calculator, and tile quantity tools.',
        path: '/smart-tools'
      });
    } else if (path === '/delivery' || path === '/delivery-areas') {
      updateSeoMetadata({
        title: 'Delivery Coverage & Logistics Directory | Zafar Sarwar Traders',
        description: 'Transparent freight calculation across Chiniot, Faisalabad, Lahore, Rawalpindi, Islamabad, Sargodha, Karachi, and all cities in Pakistan.',
        path: '/delivery'
      });
    } else if (path === '/about') {
      updateSeoMetadata({
        title: 'About Zafar Sarwar Traders | Legacy & Showroom',
        description: 'Established legacy of supplying certified sanitaryware, tiles, CPVC pipes, and architectural building materials across Pakistan.',
        path: '/about'
      });
    } else if (path === '/contact') {
      updateSeoMetadata({
        title: 'Contact Showroom & Warehouse | Zafar Sarwar Traders',
        description: 'Visit our flagship showroom on Main Sargodha Road Chiniot, or contact our sales and logistics team.',
        path: '/contact'
      });
    }
  }, [currentPath, config.name, categories, products, brands]);

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

  // Synchronize browser history (Android Native Back Button & Edge-swipe gestures) with SPA modals and views
  useEffect(() => {
    const initialState = initNavigationHistory(selectedCategoryFilter);

    // Deep link hydration on initial load
    if (initialState.view === 'delivery-areas') {
      setViewDeliveryAreasPage(true);
    } else if (initialState.view === 'product' && initialState.productId) {
      const isDedicatedProductPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/product/');
      if (!isDedicatedProductPage) {
        const prod = products.find(p => p.id === initialState.productId);
        if (prod) setSelectedProduct(prod);
      }
    } else if (initialState.view === 'category' && initialState.categoryId && initialState.categoryId !== 'all') {
      setSelectedCategoryFilter(initialState.categoryId);
    } else if (initialState.view === 'cart') {
      setCartOpen(true);
    } else if (initialState.view === 'checkout') {
      setCheckoutModalOpen(true);
    } else if (initialState.view === 'search') {
      setSearchModalOpen(true);
    } else if (initialState.view === 'brand' && initialState.brandId) {
      const b = brands.find(brand => brand.id === initialState.brandId);
      if (b) setSelectedBrand(b);
    } else if ((initialState.view === 'tools' || initialState.view === 'smart-tools') && initialState.toolId) {
      setActiveToolId(initialState.toolId as SmartToolId | 'hub');
    }

    const unsubscribe = addNavigationListener((state) => {
      // Synchronize canonical path if present
      if (state.pathname) {
        setCurrentPath(state.pathname);
      } else if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname || '/');
      }

      // Whenever navigation moves away from admin dashboard, ensure it is closed
      if (state.view !== 'admin-dashboard') {
        setAdminDashboardOpen(false);
      }
      if (state.view !== 'admin-login') {
        setAdminLoginOpen(false);
      }

      switch (state.view) {
        case 'home':
          setSelectedProduct(null);
          setSelectedBrand(null);
          setCartOpen(false);
          setCheckoutModalOpen(false);
          setSearchModalOpen(false);
          setOrderTrackingOpen(false);
          setViewDeliveryAreasPage(false);
          setActiveToolId(null);
          setIsConstructionBuilderOpen(false);
          setAiModalOpen(false);
          setThemeModalOpen(false);
          setDeliveryCheckerOpen(false);
          setAdminLoginOpen(false);
          setAdminDashboardOpen(false);
          setAdminProductModalOpen(false);
          setConfigModalOpen(false);
          setSelectedCategoryFilter(state.categoryId || 'all');
          break;

        case 'category':
          setSelectedProduct(null);
          setSelectedBrand(null);
          setCartOpen(false);
          setCheckoutModalOpen(false);
          setSearchModalOpen(false);
          setOrderTrackingOpen(false);
          setViewDeliveryAreasPage(false);
          setActiveToolId(null);
          setIsConstructionBuilderOpen(false);
          setAiModalOpen(false);
          setThemeModalOpen(false);
          setDeliveryCheckerOpen(false);
          setAdminLoginOpen(false);
          setAdminDashboardOpen(false);
          setAdminProductModalOpen(false);
          setConfigModalOpen(false);
          setSelectedCategoryFilter(state.categoryId || 'all');
          break;

        case 'product':
          setCartOpen(false);
          setCheckoutModalOpen(false);
          setViewDeliveryAreasPage(false);
          setSearchModalOpen(false);
          if (state.pathname?.startsWith('/product/') || (typeof window !== 'undefined' && window.location.pathname.startsWith('/product/'))) {
            setSelectedProduct(null);
          } else if (state.productId) {
            const prod = products.find(p => p.id === state.productId);
            if (prod) setSelectedProduct(prod);
          }
          if (state.categoryId) {
            setSelectedCategoryFilter(state.categoryId);
          }
          break;

        case 'search':
          setSelectedProduct(null);
          setCartOpen(false);
          setCheckoutModalOpen(false);
          setViewDeliveryAreasPage(false);
          setSearchModalOpen(true);
          break;

        case 'cart':
          setCheckoutModalOpen(false);
          setSelectedProduct(null);
          setViewDeliveryAreasPage(false);
          setCartOpen(true);
          break;

        case 'checkout':
          if (orderCompletedRef.current) {
            resetToHome();
            break;
          }
          setCartOpen(false);
          setSelectedProduct(null);
          setViewDeliveryAreasPage(false);
          setCheckoutModalOpen(true);
          break;

        case 'delivery-areas':
          setSelectedProduct(null);
          setCartOpen(false);
          setCheckoutModalOpen(false);
          setSearchModalOpen(false);
          setViewDeliveryAreasPage(true);
          break;

        case 'brand':
          if (state.brandId) {
            const b = brands.find(brand => brand.id === state.brandId);
            if (b) setSelectedBrand(b);
          }
          break;

        case 'tools':
        case 'smart-tools':
          if (state.toolId) {
            setActiveToolId(state.toolId as SmartToolId | 'hub');
          }
          break;

        case 'builder':
          setIsConstructionBuilderOpen(true);
          break;

        case 'tracking':
          setOrderTrackingOpen(true);
          break;

        case 'delivery-checker':
          setDeliveryCheckerOpen(true);
          break;

        case 'theme':
          setThemeModalOpen(true);
          break;

        case 'ai-consultant':
          setAiModalOpen(true);
          break;

        case 'admin-login':
          setAdminLoginOpen(true);
          break;

        case 'admin-dashboard':
          setAdminDashboardOpen(true);
          break;

        default:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [products, brands]);

  // Sync with server CMS data on mount
  useEffect(() => {
    startLiveVisitorTracking();
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
      setCheckoutSettings,
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
    const handleCloseAdminEvent = () => {
      setAdminDashboardOpen(false);
      setAdminLoginOpen(false);
      setAdminProductModalOpen(false);
      resetToHome();
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {}
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('zst_close_admin', handleCloseAdminEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('zst_close_admin', handleCloseAdminEvent);
    };
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
    setLastCartAdded({ timestamp: Date.now(), productName: product.name });
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
    orderCompletedRef.current = false;
    pushNavigationState('checkout', { checkoutStep: 'cart' }, { checkout: 'direct', product: null });
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
    setAdminLoginOpen(false);
    replaceNavigationState('admin-dashboard', {}, { admin: 'dashboard' });
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
    setAdminLoginOpen(false);
    resetToHome();
  };

  const handleAddReview = (newReview: Review) => {
    setReviews([newReview, ...reviews]);
  };

  const handleSelectCategory = (categoryId: string, skipPush: boolean = false) => {
    setSelectedCategoryFilter(categoryId);
    const catObj = categories.find(c => c.id === categoryId);
    trackCategoryClick(categoryId, catObj ? catObj.name : categoryId);

    if (!skipPush) {
      if (categoryId === 'all') {
        pushNavigationState('home', { categoryId: 'all' }, { category: null });
      } else {
        pushNavigationState('category', { categoryId }, { category: categoryId });
      }
    }

    const element = document.getElementById('products');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleQuickViewProduct = (prod: Product, skipPush: boolean = false) => {
    setSelectedProduct(prod);
    trackProductView(prod.id, prod.name);

    if (!skipPush) {
      pushNavigationState(
        'product',
        {
          productId: prod.id,
          categoryId: selectedCategoryFilter,
          fromSearch: searchModalOpen,
          fromCart: cartOpen
        },
        { product: prod.id }
      );
    }
  };

  const handleOpenCart = () => {
    pushNavigationState('cart', {}, { cart: 'open' });
    setCartOpen(true);
  };

  const handleCloseCart = () => {
    navigateBackSafe(() => setCartOpen(false), { cart: null });
  };

  const handleOpenCheckout = () => {
    orderCompletedRef.current = false;
    pushNavigationState('checkout', { checkoutStep: 'cart' }, { checkout: 'cart', cart: null });
    setCartOpen(false);
    setCheckoutModalOpen(true);
  };

  const handleReturnHomeAfterOrder = () => {
    orderCompletedRef.current = true;
    navigateBackSafe(() => {
      setCheckoutModalOpen(false);
      setDirectCheckoutItem(null);
      setCartOpen(false);
    }, { checkout: null, cart: null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseCheckout = () => {
    navigateBackSafe(() => {
      setCheckoutModalOpen(false);
      setDirectCheckoutItem(null);
    }, { checkout: null });
  };

  const handleOpenDeliveryAreas = () => {
    pushNavigationState('delivery-areas', {}, { page: 'delivery-areas' });
    setViewDeliveryAreasPage(true);
  };

  const handleCloseDeliveryAreas = () => {
    navigateBackSafe(() => setViewDeliveryAreasPage(false), { page: null });
  };

  const handleOpenSearch = () => {
    pushNavigationState('search', {}, { search: 'open' });
    setSearchModalOpen(true);
  };

  const handleCloseSearch = () => {
    navigateBackSafe(() => setSearchModalOpen(false));
  };

  const handleOpenBrand = (brand: ProductBrand) => {
    pushNavigationState('brand', { brandId: brand.id }, { brand: brand.id });
    setSelectedBrand(brand);
  };

  const handleCloseBrand = () => {
    navigateBackSafe(() => setSelectedBrand(null));
  };

  const handleOpenSmartTool = (toolId: SmartToolId | 'hub') => {
    pushNavigationState('tools', { toolId }, { tool: toolId });
    setActiveToolId(toolId);
  };

  const handleCloseSmartTool = () => {
    navigateBackSafe(() => setActiveToolId(null), { tool: null });
  };

  const handleOpenConstructionBuilder = () => {
    pushNavigationState('builder', {}, { builder: 'open' });
    setIsConstructionBuilderOpen(true);
  };

  const handleCloseConstructionBuilder = () => {
    navigateBackSafe(() => setIsConstructionBuilderOpen(false));
  };

  const handleOpenOrderTracking = () => {
    pushNavigationState('tracking', {}, { tracking: 'open' });
    setOrderTrackingOpen(true);
  };

  const handleCloseOrderTracking = () => {
    navigateBackSafe(() => setOrderTrackingOpen(false));
  };

  const handleOpenDeliveryChecker = () => {
    pushNavigationState('delivery-checker', {}, { checker: 'open' });
    setDeliveryCheckerOpen(true);
  };

  const handleCloseDeliveryChecker = () => {
    navigateBackSafe(() => setDeliveryCheckerOpen(false));
  };

  const handleOpenThemeModal = () => {
    pushNavigationState('theme', {}, { theme: 'open' });
    setThemeModalOpen(true);
  };

  const handleCloseThemeModal = () => {
    navigateBackSafe(() => setThemeModalOpen(false));
  };

  const handleOpenAiModal = () => {
    pushNavigationState('ai-consultant', {}, { ai: 'open' });
    setAiModalOpen(true);
  };

  const handleCloseAiModal = () => {
    navigateBackSafe(() => setAiModalOpen(false));
  };

  const handleOpenAdminLogin = () => {
    pushNavigationState('admin-login', {}, { admin: 'login' });
    setAdminLoginOpen(true);
  };

  const handleCloseAdminLogin = () => {
    navigateBackSafe(() => setAdminLoginOpen(false));
  };

  const handleOpenAdminDashboard = () => {
    pushNavigationState('admin-dashboard', {}, { admin: 'dashboard' });
    setAdminDashboardOpen(true);
  };

  const handleCloseAdminDashboard = () => {
    setAdminDashboardOpen(false);
    setAdminLoginOpen(false);
    setAdminProductModalOpen(false);
    resetToHome();
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const handleCloseProductQuickView = () => {
    navigateBackSafe(() => setSelectedProduct(null));
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

  const renderMainContent = () => {
    // 1. Delivery Coverage / Logistics Page
    if (currentPath === '/delivery' || currentPath === '/delivery-areas' || viewDeliveryAreasPage) {
      return (
        <DeliveryPage
          onNavigate={navigateTo}
        />
      );
    }

    // 2. Online Store / Products Catalog
    if (currentPath === '/store' || currentPath === '/products') {
      return (
        <StorePage
          products={products}
          categories={categories}
          brands={brands}
          config={config}
          isAdmin={isAdmin}
          onNavigate={navigateTo}
          onQuickView={handleQuickViewProduct}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      );
    }

    // 3. Categories Hub
    if (currentPath === '/categories') {
      return (
        <CategoriesPage
          categories={categories}
          products={products}
          onNavigate={navigateTo}
        />
      );
    }

    // 4. Category Detail Page
    if (currentPath.startsWith('/category/')) {
      const slug = currentPath.slice('/category/'.length);
      const category = findCategoryBySlug(slug, categories);
      if (category) {
        return (
          <CategoryDetailPage
            category={category}
            allProducts={products}
            allCategories={categories}
            brands={brands}
            config={config}
            isAdmin={isAdmin}
            onNavigate={navigateTo}
            onQuickView={handleQuickViewProduct}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        );
      }
      return (
        <NotFoundPage
          attemptedPath={currentPath}
          customMessage="The product category you requested could not be found."
          onNavigate={navigateTo}
        />
      );
    }

    // 5. Product Detail Page
    if (currentPath.startsWith('/product/')) {
      const slug = currentPath.slice('/product/'.length);
      const product = findProductBySlug(slug, products);
      if (product) {
        return (
          <ProductDetailPage
            product={product}
            allProducts={products}
            categories={categories}
            brands={brands}
            config={config}
            isAdmin={isAdmin}
            onNavigate={navigateTo}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        );
      }
      return (
        <NotFoundPage
          attemptedPath={currentPath}
          customMessage="The product you requested could not be found or is unavailable."
          onNavigate={navigateTo}
        />
      );
    }

    // 6. Brands Directory Hub
    if (currentPath === '/brands') {
      return (
        <BrandsPage
          brands={brands}
          products={products}
          onNavigate={navigateTo}
        />
      );
    }

    // 7. Brand Detail Page
    if (currentPath.startsWith('/brand/')) {
      const slug = currentPath.slice('/brand/'.length);
      const brand = findBrandBySlug(slug, brands);
      if (brand) {
        return (
          <BrandDetailPage
            brand={brand}
            allProducts={products}
            categories={categories}
            config={config}
            isAdmin={isAdmin}
            onNavigate={navigateTo}
            onQuickView={handleQuickViewProduct}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
          />
        );
      }
      return (
        <NotFoundPage
          attemptedPath={currentPath}
          customMessage="The brand you requested could not be found."
          onNavigate={navigateTo}
        />
      );
    }

    // 8. Smart Construction Tools Hub
    if (currentPath === '/smart-tools' || currentPath === '/tools') {
      return (
        <SmartToolsPage
          onNavigate={navigateTo}
          onOpenTool={(toolId) => handleOpenSmartTool(toolId)}
          onOpenSmartTool={(toolId) => handleOpenSmartTool(toolId)}
          onOpenBuilder={handleOpenConstructionBuilder}
          onOpenConstructionBuilder={handleOpenConstructionBuilder}
          onOpenDeliveryChecker={handleOpenDeliveryChecker}
          settings={smartToolsSettings}
        />
      );
    }

    // 9. About Legacy Showroom Page
    if (currentPath === '/about') {
      return (
        <AboutPage
          config={config}
          stats={stats}
          onNavigate={navigateTo}
        />
      );
    }

    // 10. Contact Showroom Page
    if (currentPath === '/contact') {
      return (
        <ContactPage
          config={config}
          contacts={contacts}
          onNavigate={navigateTo}
        />
      );
    }

    // 11. Check if unknown path
    if (currentPath !== '/' && currentPath !== '') {
      return (
        <NotFoundPage
          attemptedPath={currentPath}
          onNavigate={navigateTo}
        />
      );
    }

    // 12. Default: Interactive Homepage
    return (
      <main id="main-content" className="relative z-10">
        <HeroSection
          products={products}
          categories={categories}
          brands={brands}
          heroSettings={heroSettings}
          onSelectProduct={(prod) => {
            const slug = generateProductSlug(prod.name, prod.id);
            navigateTo(`/product/${slug}`);
          }}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          onOpenAiConsultant={handleOpenAiModal}
          onNavigateToStore={() => navigateTo('/store')}
          onNavigateToCategories={() => navigateTo('/categories')}
        />

        {/* Feature Highlights Bar */}
        <FeatureBar />

        <AboutSection config={config} />

        {/* Categories / Departments Navigation */}
        <CategoriesSection
          categories={categories}
          config={config}
          onSelectCategory={(catId) => {
            const cat = categories.find(c => c.id === catId);
            if (cat) {
              const slug = generateCategorySlug(cat.name, cat.id);
              navigateTo(`/category/${slug}`);
            } else {
              handleSelectCategory(catId);
            }
          }}
        />

        {/* Authorized Brands */}
        <BrandsSection
          brands={brands}
          products={products}
          onSelectBrand={(brand) => {
            const slug = generateBrandSlug(brand.name, brand.id);
            navigateTo(`/brand/${slug}`);
          }}
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
          onNavigateToStore={() => navigateTo('/store')}
        />

        {/* 🔧 SMART CONSTRUCTION & FITTING PACKAGE BUILDER (HOMEPAGE ENTRY CARD) */}
        <SmartConstructionBuilderEntryCard
          onOpenBuilder={handleOpenConstructionBuilder}
          config={fittingBuilderConfig}
        />

        {/* COMPACT SMART TOOLS HUB (Cement Calculator, Bathroom Planner, Material Estimator, Budget Finder, Water Tank & Pump Guide) */}
        <SmartToolsSection
          settings={smartToolsSettings}
          onOpenTool={(toolId) => handleOpenSmartTool(toolId)}
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
    );
  };

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
        currentPath={currentPath}
        onNavigate={navigateTo}
        onOpenCart={handleOpenCart}
        onOpenThemeModal={handleOpenThemeModal}
        onOpenWishlist={() => {
          const el = document.getElementById('products');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          else navigateTo('/store');
        }}
        onOpenCompare={() => {
          const el = document.getElementById('products');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          else navigateTo('/store');
        }}
        onLogoutAdmin={handleAdminLogout}
        onOpenAdminDashboard={handleOpenAdminDashboard}
        onOpenAiConsultant={handleOpenAiModal}
        onSearchClick={handleOpenSearch}
        onOpenOrderTracking={handleOpenOrderTracking}
        onSelectCategory={(catId) => {
          const cat = categories.find(c => c.id === catId);
          if (cat) {
            const slug = generateCategorySlug(cat.name, cat.id);
            navigateTo(`/category/${slug}`);
          } else {
            handleSelectCategory(catId);
          }
        }}
        onOpenSmartTool={(toolId) => {
          handleOpenSmartTool(toolId);
        }}
        onOpenConstructionBuilder={handleOpenConstructionBuilder}
        onOpenDeliveryChecker={handleOpenDeliveryChecker}
        onOpenDeliveryAreas={() => navigateTo('/delivery')}
      />

      {/* Dynamic Multi-Page Router View */}
      {renderMainContent()}

      {/* Sticky Floating WhatsApp */}
      <FloatingWhatsApp config={config} />

      {/* Floating Ultra-Premium AI Sales Assistant */}
      <FloatingAiChat
        products={products}
        categories={categories}
        brands={brands}
        config={config}
        aiAssistantConfig={aiAssistantConfig}
        onViewProduct={(prod) => handleQuickViewProduct(prod)}
        onAddToCart={handleAddToCart}
        onSelectCategory={(catId) => {
          handleSelectCategory(catId);
        }}
        onOpenPlanner={() => {
          handleOpenSmartTool('bathroom-planner');
        }}
      />

      {/* Footer */}
      <Footer
        config={config}
        onSelectCategory={(catId) => {
          const cat = categories.find(c => c.id === catId);
          if (cat) {
            const slug = generateCategorySlug(cat.name, cat.id);
            navigateTo(`/category/${slug}`);
          } else {
            handleSelectCategory(catId);
          }
        }}
        onReplayIntro={() => setShowIntro(true)}
        onOpenThemeModal={handleOpenThemeModal}
        onOpenDeliveryChecker={handleOpenDeliveryChecker}
        onOpenDeliveryAreas={() => navigateTo('/delivery')}
        onNavigate={navigateTo}
      />

      {/* Floating Cart Counter Badge & Indicator */}
      <FloatingCartBadge
        cartItems={cartItems}
        onOpenCart={handleOpenCart}
        lastAddedTimestamp={lastCartAdded?.timestamp}
        lastAddedProductName={lastCartAdded?.productName}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        cartItems={cartItems}
        config={config}
        checkoutSettings={checkoutSettings}
        onClose={handleCloseCart}
        onUpdateQuantity={handleUpdateCartQty}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleOpenCheckout}
      />

      {/* Order Checkout Modal */}
      <OrderCheckoutModal
        isOpen={checkoutModalOpen}
        cartItems={cartItems}
        directItem={directCheckoutItem}
        config={config}
        checkoutSettings={checkoutSettings}
        onClose={handleCloseCheckout}
        onReturnHome={handleReturnHomeAfterOrder}
        onOrderPlaced={async (newOrder) => {
          const res = await addOrderToStorage(newOrder);
          if (!res.success) {
            console.error(`Could not save order: ${res.error || 'Database error'}`);
            return res;
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

          return res;
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
          onClose={handleCloseProductQuickView}
          onNavigate={navigateTo}
          onViewFullDetails={handleViewProductDetailsPage}
        />
      )}

      {selectedBrand && (
        <BrandDetailsModal
          brand={selectedBrand}
          products={products}
          onClose={handleCloseBrand}
          onSelectProduct={(prod) => handleQuickViewProduct(prod)}
        />
      )}

      {aiModalOpen && (
        <AiConsultantModal
          config={config}
          onClose={handleCloseAiModal}
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
          handleQuickViewProduct(prod);
          setSearchModalOpen(false);
        }}
        onSelectCategory={(cat) => {
          const catId = typeof cat === 'string' ? cat : (cat as any)?.id || '';
          handleSelectCategory(catId);
          setSearchModalOpen(false);
        }}
        onClose={handleCloseSearch}
      />

      {/* Order Tracking & Customer Portal Modal */}
      <CustomerAccountModal
        isOpen={orderTrackingOpen}
        onClose={handleCloseOrderTracking}
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
        onClose={handleCloseAdminLogin}
        onOpenDashboard={() => {
          setAdminLoginOpen(false);
          handleOpenAdminDashboard();
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
          onClose={handleCloseAdminDashboard}
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
        onClose={handleCloseThemeModal}
        themeSettings={themeSettings}
        activeThemeId={activeTheme}
        onSelectTheme={handleSelectTheme}
      />

      {/* 🔧 SMART CONSTRUCTION & FITTING BUILDER MODAL */}
      <SmartConstructionBuilderModal
        isOpen={isConstructionBuilderOpen}
        onClose={handleCloseConstructionBuilder}
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
        onViewProduct={(p) => handleQuickViewProduct(p)}
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
        onClose={handleCloseSmartTool}
        onSelectTool={(id) => setActiveToolId(id)}
        onOpenQuickView={(prod) => handleQuickViewProduct(prod)}
        onAddToCart={handleAddToCart}
        onBuyNow={(prod, qty, color) => {
          handleCloseSmartTool();
          handleBuyNow(prod, qty, color);
        }}
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
      />
      {/* Delivery Checker Modal Across Pakistan */}
      <DeliveryCheckerModal
        isOpen={deliveryCheckerOpen}
        onClose={handleCloseDeliveryChecker}
      />
    </div>
  );
}
