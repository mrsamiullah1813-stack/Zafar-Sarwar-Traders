import React, { useState, useEffect } from 'react';
import { 
  customerReviews, 
  faqItems 
} from './data/storeData';
import { BusinessConfig, Product, ProductCategory, GalleryItem, Review, ProductBrand, StatCounter, AiDesignerConfig, CartItem, CheckoutSettings, HeroSettings, BuildMaterialEstimatorConfig } from './types';
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
import { BathroomPlanner } from './components/BathroomPlanner';
import { BuildMaterialEstimator } from './components/BuildMaterialEstimator';
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
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminProductModal } from './components/AdminProductModal';
import { AdminDashboard } from './components/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { OrderCheckoutModal } from './components/OrderCheckoutModal';
import { CinematicIntro } from './components/CinematicIntro';
import { LuxuryCursorEffect } from './components/LuxuryCursorEffect';

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    try {
      const played = sessionStorage.getItem('zt_intro_played');
      return played !== 'true';
    } catch (e) {
      return true;
    }
  });

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
  const [aiAssistantConfig, setAiAssistantConfig] = useState<AiAssistantConfig>(() => loadAiAssistantConfig());
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

  const [isAdmin, setIsAdmin] = useState<boolean>(() => getIsAdminLoggedIn());
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
      setThemeSettings,
      setHeroSettings,
      setOrders: setCustomerOrders,
      customerId: customerProfile?.customerId
    });
  }, [customerProfile?.customerId]);

  // Keyboard shortcut Ctrl+Shift+A or Cmd+Shift+A to trigger Admin Login discreetly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setAdminLoginOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cart Operations
  const handleAddToCart = (
    product: Product,
    quantity: number = 1,
    selectedColor?: string,
    selectedSize?: string,
    selectedQuality?: string,
    selectedVariant?: string
  ) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id &&
        (item.selectedColor || '') === (selectedColor || '') &&
        (item.selectedSize || '') === (selectedSize || '') &&
        (item.selectedQuality || '') === (selectedQuality || '') &&
        (item.selectedVariant || '') === (selectedVariant || '')
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + (quantity || 1);
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty
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
          selectedVariant
        }
      ];
    });
    setCartOpen(true);
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
    if (!res || res.success !== false) {
      setProducts(updatedProducts);
    }
    return res;
  };

  const handleSaveCategoriesState = async (updatedCategories: ProductCategory[]) => {
    const res = await saveStoredCategories(updatedCategories);
    if (!res || res.success !== false) {
      setCategories(updatedCategories);
    }
    return res;
  };

  const handleSaveBrandsState = async (updatedBrands: ProductBrand[]) => {
    const res = await saveStoredBrands(updatedBrands);
    if (!res || res.success !== false) {
      setBrands(updatedBrands);
    }
    return res;
  };

  const handleSaveStatsState = async (updatedStats: StatCounter[]) => {
    const res = await saveStoredStats(updatedStats);
    if (!res || res.success !== false) {
      setStats(updatedStats);
    }
    return res;
  };

  const handleSaveContactsState = async (updatedContacts: ContactPerson[]) => {
    const res = await saveStoredContacts(updatedContacts);
    if (!res || res.success !== false) {
      setContacts(updatedContacts);
    }
    return res;
  };

  const handleSaveConfigState = async (updatedConfig: BusinessConfig) => {
    const res = await saveStoredConfig(updatedConfig);
    if (!res || res.success !== false) {
      setConfig(updatedConfig);
    }
    return res;
  };

  const handleSaveGalleryState = async (updatedGallery: GalleryItem[]) => {
    const res = await saveStoredGallery(updatedGallery);
    if (!res || res.success !== false) {
      setGallery(updatedGallery);
    }
    return res;
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setIsAdminLoggedIn(true);
    setAdminDashboardOpen(true);
  };

  const handleAdminLogout = () => {
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
        onOpenAdminLogin={() => setAdminLoginOpen(true)}
        onLogoutAdmin={handleAdminLogout}
        onOpenAdminDashboard={() => setAdminDashboardOpen(true)}
        onOpenAiConsultant={() => setAiModalOpen(true)}
        onOpenConfigModal={() => {
          if (isAdmin) {
            setConfigModalOpen(true);
          } else {
            setAdminLoginOpen(true);
          }
        }}
        onSearchClick={() => setSearchModalOpen(true)}
        onOpenOrderTracking={() => setOrderTrackingOpen(true)}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Page Sections */}
      <main id="main-content" className="relative z-10">
        <HeroSection
          products={products}
          categories={categories}
          brands={brands}
          heroSettings={heroSettings}
          onSelectProduct={(prod) => setSelectedProduct(prod)}
          onAddToCart={handleAddToCart}
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
          onToggleWishlist={handleToggleWishlist}
          onToggleCompare={handleToggleCompare}
          onAddProduct={handleOpenAddProduct}
          onEditProduct={handleOpenEditProduct}
          onDeleteProduct={handleDeleteProduct}
          selectedCategoryFilter={selectedCategoryFilter}
        />

        {/* SECONDARY UTILITY TOOLS (Accessible via Navbar / Quick Links) */}
        {/* Estimated Cement Required Section */}
        <BuildMaterialEstimator
          products={products}
          config={config}
          estimatorConfig={estimatorConfig}
          onOpenQuickView={handleQuickViewProduct}
        />

        {/* Easy Bathroom Planner Section */}
        <BathroomPlanner
          products={products}
          config={plannerConfig}
          whatsappNumber={config.phone || "923108002863"}
          onAddToCart={handleAddToCart}
          onViewProduct={handleQuickViewProduct}
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
          const el = document.getElementById('bathroom-planner');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Footer */}
      <Footer
        config={config}
        onSelectCategory={handleSelectCategory}
        onOpenAdminLogin={() => setAdminLoginOpen(true)}
        onReplayIntro={() => setShowIntro(true)}
        onOpenThemeModal={() => setThemeModalOpen(true)}
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
        config={config}
        checkoutSettings={checkoutSettings}
        onClose={() => setCheckoutModalOpen(false)}
        onOrderPlaced={async (newOrder) => {
          const res = await addOrderToStorage(newOrder);
          if (!res.success) {
            alert(`Could not save order: ${res.error || 'Database error'}`);
            return;
          }
          setCartItems([]);
          saveStoredCart([]);
          setCheckoutModalOpen(false);
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

          // Automatically open order tracking portal
          setOrderTrackingOpen(true);
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
          onAddToCart={(prod, qty, color, size, quality, variant) => {
            handleAddToCart(prod, qty, color, size, quality, variant);
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
        onSelectCategory={(catId) => {
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
          onSaveProducts={handleSaveProductsState}
          onSaveCategories={handleSaveCategoriesState}
          onSaveBrands={handleSaveBrandsState}
          onSaveStats={handleSaveStatsState}
          onSaveConfig={handleSaveConfigState}
          onSaveGallery={handleSaveGalleryState}
          onSaveContacts={handleSaveContactsState}
          onSaveHeroSettings={(hs) => {
            setHeroSettings(hs);
            saveHeroSettings(hs);
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
    </div>
  );
}
