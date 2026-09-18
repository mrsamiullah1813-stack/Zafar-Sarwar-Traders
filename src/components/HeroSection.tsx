import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  Award,
  Layers,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Eye,
  Check
} from 'lucide-react';
import { Product, ProductCategory, ProductBrand, HeroSettings } from '../types';
import { getProductPricingDetails } from '../utils/pricingUtils';

interface HeroSectionProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  heroSettings?: HeroSettings;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onBuyNow?: (product: Product, quantity?: number) => void;
  onOpenAiConsultant?: () => void;
  onNavigateToStore?: () => void;
  onNavigateToCategories?: () => void;
}

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  categoryTag: string;
  image: string;
  product?: Product;
}

// Fallback high-resolution images for key departments
const FALLBACK_CATEGORY_IMAGES = {
  sanitary: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
  faucets: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=1000&q=80',
  pipes: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=1000&q=80',
  paints: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1000&q=80'
};

const slideVariants = {
  enter: ({ direction, isMobile }: { direction: number; isMobile: boolean }) => ({
    x: direction > 0 ? (isMobile ? '22%' : '100%') : (isMobile ? '-22%' : '-100%'),
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: ({ direction, isMobile }: { direction: number; isMobile: boolean }) => ({
    x: direction > 0 ? (isMobile ? '-22%' : '-100%') : (isMobile ? '22%' : '100%'),
    opacity: 0
  })
};

export const HeroSection: React.FC<HeroSectionProps> = ({
  products,
  categories,
  brands,
  heroSettings,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onNavigateToStore,
  onNavigateToCategories
}) => {
  // Respect master on/off toggle from AdminHeroManager
  if (heroSettings && heroSettings.isEnabled === false) {
    return null;
  }

  // Mobile viewport detection for performance scaling
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Root ref and visibility observer to pause autoplay when offscreen or tab inactive
  const heroRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || !heroRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
      } else if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        setIsVisible(inView);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 1. Resolve safe, visible products
  const safeProducts = Array.isArray(products) ? products.filter(p => !p.isHidden) : [];

  // 2. Build slides dynamically based on Admin configuration or curated database products
  const slides: HeroSlide[] = React.useMemo(() => {
    const customIds = heroSettings?.heroProductIds || [];
    const customOrder = heroSettings?.customProductOrder || [];
    const imageOverrides = heroSettings?.productImageOverrides || {};

    let selectedProducts: Product[] = [];

    if (customIds.length > 0) {
      // Find products selected by Admin
      const matched = safeProducts.filter(p => customIds.includes(p.id));
      if (customOrder.length > 0) {
        const orderMap = new Map<string, number>(customOrder.map((id, index) => [id, index]));
        matched.sort((a, b) => {
          const orderA = orderMap.get(a.id) ?? 999;
          const orderB = orderMap.get(b.id) ?? 999;
          return orderA - orderB;
        });
      }
      selectedProducts = matched;
    }

    // If no custom products chosen, fallback to featured or top category products
    if (selectedProducts.length === 0) {
      const featured = safeProducts.filter(p => p.isFeatured || p.isHeroFeatured);
      if (featured.length >= 3) {
        selectedProducts = featured.slice(0, 5);
      } else {
        // Diverse selection across categories
        const sanitary = safeProducts.find(p => p.category?.toLowerCase().includes('sanitary') || p.name?.toLowerCase().includes('commode') || p.name?.toLowerCase().includes('basin'));
        const faucets = safeProducts.find(p => p.category?.toLowerCase().includes('faucet') || p.name?.toLowerCase().includes('mixer') || p.name?.toLowerCase().includes('shower'));
        const pipes = safeProducts.find(p => p.category?.toLowerCase().includes('pipe') || p.category?.toLowerCase().includes('tank') || p.name?.toLowerCase().includes('tank'));
        const paints = safeProducts.find(p => p.category?.toLowerCase().includes('paint') || p.name?.toLowerCase().includes('paint') || p.name?.toLowerCase().includes('emulsion'));

        const pool = [sanitary, faucets, pipes, paints].filter(Boolean) as Product[];
        safeProducts.forEach(p => {
          if (!pool.some(item => item.id === p.id) && pool.length < 5) {
            pool.push(p);
          }
        });
        selectedProducts = pool;
      }
    }

    // Map resolved products to clean Hero Slides
    return selectedProducts.map((prod, index) => {
      const overrideImg = imageOverrides[prod.id];
      const productImg = overrideImg || prod.image || prod.images?.[0] || FALLBACK_CATEGORY_IMAGES.sanitary;
      const catName = prod.category || (categories.find(c => c.id === prod.categoryId)?.name) || 'Premium Quality';
      const brandName = prod.brand || (brands.find(b => b.id === prod.brandId)?.name) || 'Zafar Sarwar Traders';

      return {
        id: `hero-slide-${prod.id}-${index}`,
        badge: `${brandName.toUpperCase()} • ${catName.toUpperCase()}`,
        title: prod.name,
        subtitle: prod.description || `High-grade ${catName.toLowerCase()} engineered for durability, premium aesthetic appeal, and long-lasting performance.`,
        categoryTag: catName,
        image: productImg,
        product: prod
      };
    });
  }, [safeProducts, heroSettings, categories, brands]);

  // Fallback if no products exist at all
  const activeSlides: HeroSlide[] = slides.length > 0 ? slides : [
    {
      id: 'fallback-1',
      badge: heroSettings?.badgeText || 'ZAFAR SARWAR TRADERS',
      title: heroSettings?.heading || 'Premium Sanitaryware & Bathroom Solutions',
      subtitle: heroSettings?.subheading || 'Explore premium sanitaryware, bathroom fittings, showers, basins, tiles, paints and complete bathroom solutions.',
      categoryTag: 'Authorized Distributor',
      image: FALLBACK_CATEGORY_IMAGES.sanitary
    }
  ];

  // State Management
  const [[page, direction], setPage] = useState<[number, number]>([0, 0]);
  const [isPaused, setIsPaused] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Touch tracking for swipe gestures
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const touchEndYRef = useRef<number | null>(null);

  const durationSec = Math.max(3, heroSettings?.rotationDurationSeconds || 5);
  const isAutoPlay = heroSettings?.autoPlay !== false;
  const isPauseOnHover = heroSettings?.pauseOnHover !== false;

  // Safe Index Wrap
  const currentIndex = ((page % activeSlides.length) + activeSlides.length) % activeSlides.length;
  const currentSlide = activeSlides[currentIndex];
  const slideProduct = currentSlide.product;

  // Navigation handlers
  const paginate = useCallback((newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  const handleNext = useCallback(() => {
    paginate(1);
  }, [paginate]);

  const handlePrev = useCallback(() => {
    paginate(-1);
  }, [paginate]);

  const handleGoToSlide = useCallback((index: number) => {
    const diff = index - currentIndex;
    if (diff !== 0) {
      setPage([index, diff > 0 ? 1 : -1]);
    }
  }, [currentIndex]);

  // Stable ref for auto-play callback to avoid re-binding interval constantly
  const handleNextRef = useRef(handleNext);
  useEffect(() => {
    handleNextRef.current = handleNext;
  }, [handleNext]);

  // Autoplay Timer with Hover Pause and Visibility Awareness
  useEffect(() => {
    if (!isAutoPlay || isPaused || !isVisible || activeSlides.length <= 1) return;

    const interval = setInterval(() => {
      handleNextRef.current();
    }, durationSec * 1000);

    return () => clearInterval(interval);
  }, [isAutoPlay, isPaused, isVisible, durationSec, activeSlides.length, page]);

  // Track preloaded images to avoid redundant downloads
  const preloadedUrls = useRef<Set<string>>(new Set());

  // Preload next slide image smoothly in background without blocking main thread
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const nextIdx = (currentIndex + 1) % activeSlides.length;
    const nextSrc = activeSlides[nextIdx]?.image;
    if (nextSrc && !preloadedUrls.current.has(nextSrc)) {
      preloadedUrls.current.add(nextSrc);
      const timer = setTimeout(() => {
        const img = new Image();
        img.src = nextSrc;
      }, isMobile ? 250 : 150);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, activeSlides, isMobile]);

  // Touch handlers for mobile swipe with vertical scroll preservation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchEndXRef.current = e.touches[0].clientX;
    touchEndYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
    touchEndYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartXRef.current !== null && 
      touchEndXRef.current !== null &&
      touchStartYRef.current !== null &&
      touchEndYRef.current !== null
    ) {
      const deltaX = touchStartXRef.current - touchEndXRef.current;
      const deltaY = touchStartYRef.current - touchEndYRef.current;
      const swipeThreshold = 35; // Minimum px for swipe
      // Only register horizontal swipe if horizontal movement is greater than vertical movement
      if (Math.abs(deltaX) > swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.3) {
        if (deltaX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchEndXRef.current = null;
    touchEndYRef.current = null;
  };

  // Quick Add to Cart with Toast
  const handleQuickAdd = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(prod, 1);
      setAddedToast(prod.name);
      setTimeout(() => setAddedToast(null), 2500);
    } else {
      onSelectProduct(prod);
    }
  };

  // Pricing & metadata calculations
  const pricing = slideProduct ? getProductPricingDetails(slideProduct) : null;
  const brandName = slideProduct?.brand || (brands.find(b => b.id === slideProduct?.brandId)?.name) || 'Zafar Sarwar Traders';
  const productImage = currentSlide.image;

  // WhatsApp link generator
  const getWhatsAppLink = (prod?: Product) => {
    const phone = '923108002863';
    const text = prod 
      ? `Hello Zafar Sarwar Traders! I am interested in purchasing: "${prod.name}" (SKU: ${prod.sku || prod.id}). Please share price and delivery details.`
      : `Hello Zafar Sarwar Traders! I would like to inquire about your sanitaryware, faucets, and construction materials catalog.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  // CTAs config
  const showPrimaryBtn = heroSettings?.enablePrimaryBtn !== false;
  const showSecondaryBtn = heroSettings?.enableSecondaryBtn !== false;
  const showTertiaryBtn = heroSettings?.enableTertiaryBtn !== false;

  const primaryBtnText = heroSettings?.primaryBtnText || 'View Full Details';
  const secondaryBtnText = heroSettings?.secondaryBtnText || 'Add to Cart';
  const tertiaryBtnText = heroSettings?.tertiaryBtnText || 'Order on WhatsApp';

  return (
    <section 
      ref={heroRef}
      id="hero-slider-section"
      className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800/80 select-none touch-pan-y"
      onMouseEnter={() => { if (isPauseOnHover) setIsPaused(true); }}
      onMouseLeave={() => { if (isPauseOnHover) setIsPaused(false); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Featured Products Slider"
    >
      {/* Background Architectural Canvas - Optimized for low mobile GPU fillrate */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0b1324] to-slate-950" />
        {/* Desktop ambient blur spheres - hidden on mobile to eliminate Gaussian blur GPU overhead */}
        <div className="hidden sm:block absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-900/15 rounded-full blur-[130px]" />
        <div className="hidden sm:block absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-[140px]" />
        {/* Lightweight mobile ambient gradient - single render pass without blur kernels */}
        <div className="sm:hidden absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/25 via-transparent to-transparent" />
        <div 
          className="absolute inset-0 opacity-[0.02] sm:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '28px 28px'
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* Toast Notification for Quick Cart Add */}
        <AnimatePresence>
          {addedToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-6 z-50 px-4 py-3 bg-emerald-900/95 border border-emerald-500/50 text-white text-xs font-semibold rounded-xl shadow-2xl sm:backdrop-blur-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Added <strong>{addedToast}</strong> to Cart!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carousel Slider Stage with Horizontal Slide Animation */}
        <div className="relative overflow-hidden min-h-[480px] sm:min-h-[500px] lg:min-h-[460px] flex items-center touch-pan-y">
          <AnimatePresence initial={false} custom={{ direction, isMobile }} mode="wait">
            <motion.div
              key={page}
              custom={{ direction, isMobile }}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { 
                  type: "tween", 
                  ease: isMobile ? [0.25, 1, 0.5, 1] : [0.22, 1, 0.36, 1], 
                  duration: isMobile ? 0.22 : 0.40 
                },
                opacity: { duration: isMobile ? 0.16 : 0.26 }
              }}
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center transform-gpu will-change-transform"
            >
              
              {/* LEFT COLUMN: HERO INFORMATION, BADGES, DESCRIPTION, CTAS */}
              <div className="lg:col-span-7 space-y-5 text-left">
                
                {/* Department & Brand Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-300 text-xs font-bold tracking-wider uppercase sm:backdrop-blur-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">{currentSlide.badge}</span>
                </div>

                {/* Product / Category Headline */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-widest text-blue-400">
                    {currentSlide.categoryTag}
                  </div>

                  <h1 
                    onClick={() => {
                      if (slideProduct) onSelectProduct(slideProduct);
                    }}
                    className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] cursor-pointer hover:text-blue-300 transition-colors line-clamp-2"
                  >
                    {currentSlide.title}
                  </h1>

                  <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl line-clamp-3">
                    {currentSlide.subtitle}
                  </p>
                </div>

                {/* Price Display */}
                {slideProduct && (
                  <div className="flex items-center gap-3 pt-1">
                    {pricing?.isOnSale ? (
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
                          {pricing.effectivePrice}
                        </span>
                        <span className="text-sm text-slate-500 line-through font-mono">
                          {pricing.originalPrice}
                        </span>
                        {pricing.discountPercent && (
                          <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-red-400 text-xs font-bold">
                            Save {pricing.discountPercent}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-2xl sm:text-3xl font-black text-white font-mono">
                        {pricing?.effectivePrice || slideProduct.price || 'Rs. Contact for Price'}
                      </div>
                    )}
                    <span className="text-xs text-slate-400 font-medium px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                      ✓ In Stock
                    </span>
                  </div>
                )}

                {/* Interactive Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {/* Button 1: View Product Details */}
                  {showPrimaryBtn && (
                    <button
                      type="button"
                      id="hero-view-details-btn"
                      onClick={() => {
                        if (slideProduct) {
                          onSelectProduct(slideProduct);
                        } else if (onNavigateToStore) {
                          onNavigateToStore();
                        }
                      }}
                      className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer sm:hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>{primaryBtnText}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  )}

                  {/* Button 2: Quick Add to Cart */}
                  {showSecondaryBtn && slideProduct && (
                    <button
                      type="button"
                      id="hero-add-to-cart-btn"
                      onClick={(e) => handleQuickAdd(e, slideProduct)}
                      className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 active:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer sm:hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ShoppingBag className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{secondaryBtnText}</span>
                    </button>
                  )}

                  {/* Button 3: WhatsApp Quick Order */}
                  {showTertiaryBtn && (
                    <a
                      href={getWhatsAppLink(slideProduct)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/40 text-emerald-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer sm:hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400 hover:text-white shrink-0" />
                      <span>{tertiaryBtnText}</span>
                    </a>
                  )}

                  {/* Secondary Explore Store Link */}
                  {onNavigateToStore && (
                    <button
                      type="button"
                      onClick={onNavigateToStore}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>All Products</span>
                    </button>
                  )}
                </div>

                {/* Trust Highlights */}
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-950/80 border border-blue-800/50 flex items-center justify-center shrink-0">
                      <Award className="w-3 h-3 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white leading-tight">100% Genuine</div>
                      <div className="text-[9px] text-slate-400">Authorized Stock</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center shrink-0">
                      <Truck className="w-3 h-3 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white leading-tight">Fast Delivery</div>
                      <div className="text-[9px] text-slate-400">All Pakistan</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-amber-950/80 border border-amber-800/50 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-white leading-tight">Wholesale Rates</div>
                      <div className="text-[9px] text-slate-400">Direct Dealer</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: HIGH-DEFINITION PRODUCT SHOWCASE STAGE */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-full max-w-md">
                  <div 
                    onClick={() => {
                      if (slideProduct) onSelectProduct(slideProduct);
                    }}
                    className="bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-2xl shadow-black/60 overflow-hidden hover:border-slate-700 transition-all group relative cursor-pointer"
                  >
                    {/* Product Image Stage */}
                    <div className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex items-center justify-center overflow-hidden">
                      {/* Ambient Glow behind image - hidden on mobile to avoid offscreen filter blur */}
                      <div className="absolute inset-x-8 bottom-3 h-14 bg-blue-500/10 rounded-full hidden sm:block blur-xl pointer-events-none" />

                      <img
                        src={productImage}
                        alt={currentSlide.title}
                        className="max-h-full max-w-full object-contain filter drop-shadow-md sm:drop-shadow-2xl transition-transform duration-300 sm:group-hover:scale-105 transform-gpu will-change-transform"
                        loading={currentIndex === 0 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={currentIndex === 0 ? "high" : "auto"}
                      />

                      {/* Brand Tag Pill */}
                      <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-slate-950/90 border border-slate-800 text-[11px] font-bold tracking-wider text-slate-300 uppercase sm:backdrop-blur-sm">
                        {brandName}
                      </div>

                      {/* Discount or Authenticity Badge */}
                      {pricing?.isOnSale ? (
                        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-red-600 text-white text-[10px] font-extrabold uppercase shadow-md">
                          {pricing.discountPercent ? `SAVE ${pricing.discountPercent}%` : 'SPECIAL OFFER'}
                        </div>
                      ) : (
                        <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-blue-950/90 border border-blue-700/60 text-blue-300 text-[10px] font-bold uppercase sm:backdrop-blur-sm">
                          ORIGINAL
                        </div>
                      )}
                    </div>

                    {/* Footer Info Strip */}
                    <div className="p-4 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] text-slate-400 truncate">{currentSlide.categoryTag}</p>
                        <h3 className="text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                          {currentSlide.title}
                        </h3>
                      </div>

                      {slideProduct && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickAdd(e, slideProduct)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* CONTROLS BAR: PAGINATION DOTS, SLIDE COUNTER & PREV/NEXT BUTTONS */}
        {activeSlides.length > 1 && (
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
            {/* Pagination Pill Dots */}
            <div className="flex items-center gap-2">
              {activeSlides.map((slide, idx) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={() => handleGoToSlide(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex
                      ? 'w-8 bg-blue-500 shadow-md shadow-blue-500/40'
                      : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>

            {/* Slide Index Counter */}
            <div className="text-xs font-mono font-bold text-slate-400">
              <span className="text-white">0{currentIndex + 1}</span> / 0{activeSlides.length}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous Slide"
                onClick={handlePrev}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer sm:hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next Slide"
                onClick={handleNext}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer sm:hover:scale-105 active:scale-95"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};
