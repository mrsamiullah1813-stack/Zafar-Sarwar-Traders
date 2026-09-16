import React, { useState, useEffect } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { Product, ProductCategory, ProductBrand, HeroSettings } from '../types';
import { getProductPricingDetails } from '../utils/pricingUtils';
import { getProductSlug } from '../utils/slugUtils';

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

interface CuratedSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  categoryTag: string;
  defaultImage: string;
  product?: Product;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  products,
  categories,
  brands,
  heroSettings,
  onSelectProduct,
  onAddToCart,
  onNavigateToStore,
  onNavigateToCategories
}) => {
  // 1. Resolve real active products from database
  const safeProducts = Array.isArray(products) ? products.filter(p => !p.isHidden) : [];

  // Build curated slides with real products
  const curatedSlides: CuratedSlide[] = [
    {
      id: 'slide-sanitary',
      badge: 'PREMIUM SANITARYWARE & BATHROOMS',
      title: 'Luxury Bathroom Suites & Sanitary Fittings',
      subtitle: 'Official distributor of Master, Porta, and Sonex. Transform your home with modern commodes, vanity basins, and luxury fixtures.',
      categoryTag: 'Sanitaryware & Basins',
      defaultImage: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80',
      product: safeProducts.find(p => 
        p.category?.toLowerCase().includes('sanitary') || 
        p.name?.toLowerCase().includes('basin') || 
        p.name?.toLowerCase().includes('commode')
      ) || safeProducts[0]
    },
    {
      id: 'slide-faucets',
      badge: 'ENGINEERED BRASS FAUCETS',
      title: 'Architectural Faucets, Mixers & Rain Showers',
      subtitle: 'Forged brass precision by Faisal, Sonex, and Master. Heavy chrome plating, drip-free ceramic cartridges, and lifetime durability.',
      categoryTag: 'Faucets & Showers',
      defaultImage: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=1000&q=80',
      product: safeProducts.find(p => 
        p.category?.toLowerCase().includes('faucet') || 
        p.name?.toLowerCase().includes('mixer') || 
        p.name?.toLowerCase().includes('shower')
      ) || safeProducts[1]
    },
    {
      id: 'slide-pipes-materials',
      badge: 'STRUCTURAL BUILDING MATERIALS',
      title: 'Certified Plumbing Pipes, Water Tanks & Cement',
      subtitle: 'Standardized IIL G.I. pipes, food-grade multi-layer water tanks, PVC drainage, and genuine Portland cement for enduring strength.',
      categoryTag: 'Pipes & Building Materials',
      defaultImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=1000&q=80',
      product: safeProducts.find(p => 
        p.category?.toLowerCase().includes('pipe') || 
        p.category?.toLowerCase().includes('tank') || 
        p.name?.toLowerCase().includes('tank')
      ) || safeProducts[2]
    },
    {
      id: 'slide-paints',
      badge: 'ARCHITECTURAL FINISHES',
      title: 'Weatherproof Emulsions & Decorative Paints',
      subtitle: 'Authorized dealer of Berger and Diamond paints. Authentic shade cards, computer color mixing, and exterior protective coatings.',
      categoryTag: 'Paints & Wall Finishes',
      defaultImage: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1000&q=80',
      product: safeProducts.find(p => 
        p.category?.toLowerCase().includes('paint') || 
        p.name?.toLowerCase().includes('paint') || 
        p.name?.toLowerCase().includes('emulsion')
      ) || safeProducts[3]
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const durationSec = heroSettings?.rotationDurationSeconds || 6;

  // Auto-play timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % curatedSlides.length);
    }, durationSec * 1000);

    return () => clearInterval(timer);
  }, [isPaused, durationSec, curatedSlides.length]);

  const currentSlide = curatedSlides[currentIndex];
  const slideProduct = currentSlide.product;

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % curatedSlides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + curatedSlides.length) % curatedSlides.length);
  };

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

  // Pricing calculation
  const pricing = slideProduct ? getProductPricingDetails(slideProduct) : null;
  const brandName = slideProduct?.brand || (brands.find(b => b.id === slideProduct?.brandId)?.name) || 'Zafar Sarwar Traders';
  const productImage = slideProduct?.image || slideProduct?.images?.[0] || currentSlide.defaultImage;

  return (
    <section 
      id="hero-slider"
      className="relative bg-slate-950 text-white overflow-hidden border-b border-slate-800/80"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Featured Store Showcase"
    >
      {/* Background Architectural Canvas with subtle noise & warm gradients */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Deep Slate Architectural Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-[#0a1120] to-slate-950" />
        
        {/* Soft Warm Neutral & Blue Accents - deliberate & professional */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-blue-900/15 rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-amber-600/10 rounded-full blur-[160px]" />
        
        {/* Subtle architectural grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        
        {/* Toast Notification for Quick Add */}
        <AnimatePresence>
          {addedToast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-24 right-6 z-50 px-4 py-3 bg-emerald-900/95 border border-emerald-500/50 text-white text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Added <strong>{addedToast}</strong> to Cart!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* LEFT COLUMN: HERO HEADLINE, BADGES, DESCRIPTION, CTAS */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Small Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 text-slate-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>{heroSettings?.badgeText || 'EST. 1990 • AUTHORIZED DEALER & DISTRIBUTOR'}</span>
            </div>

            {/* Dynamic Slide Headline & Subtitle */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="space-y-4"
              >
                <div className="inline-block text-xs font-bold uppercase tracking-widest text-blue-400">
                  {currentSlide.categoryTag}
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
                  {currentSlide.title}
                </h1>

                <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl">
                  {currentSlide.subtitle}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Action Buttons: Primary "Shop Now", Secondary "Explore Categories" */}
            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                id="hero-shop-now-btn"
                onClick={() => {
                  if (onNavigateToStore) {
                    onNavigateToStore();
                  } else {
                    window.history.pushState(null, '', '/store');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Online Store</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                id="hero-explore-categories-btn"
                onClick={() => {
                  if (onNavigateToCategories) {
                    onNavigateToCategories();
                  } else {
                    window.history.pushState(null, '', '/categories');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-sm font-semibold transition-all hover:text-white cursor-pointer"
              >
                <Layers className="w-4 h-4 text-slate-400" />
                <span>Browse Categories</span>
              </button>
            </div>

            {/* Trust Micro-Badges */}
            <div className="pt-4 border-t border-slate-800/90 grid grid-cols-3 gap-3 sm:gap-4 max-w-lg">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/50 flex items-center justify-center shrink-0">
                  <Award className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">100% Genuine</div>
                  <div className="text-[10px] text-slate-400">Direct from factory</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center shrink-0">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Fast Delivery</div>
                  <div className="text-[10px] text-slate-400">Across Pakistan</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-950/80 border border-amber-800/50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-tight">Wholesale Rates</div>
                  <div className="text-[10px] text-slate-400">Bulk & Retail</div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: PREMIUM ARCHITECTURAL PRODUCT SHOWCASE */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide.id + (slideProduct?.id || '')}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.45, ease: 'easeOut' }}
                  className="bg-slate-900/90 rounded-2xl border border-slate-800/90 shadow-2xl shadow-black/60 overflow-hidden hover:border-slate-700 transition-all group relative"
                >
                  {/* Real Product Image Stage */}
                  <div 
                    className="relative w-full h-64 sm:h-72 bg-gradient-to-b from-slate-900 to-slate-950 p-6 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => {
                      if (slideProduct) onSelectProduct(slideProduct);
                    }}
                  >
                    {/* Architectural pedestal glow */}
                    <div className="absolute inset-x-8 bottom-4 h-12 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

                    <img
                      src={productImage}
                      alt={slideProduct?.name || currentSlide.title}
                      className="max-h-full max-w-full object-contain filter drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                      loading="eager"
                    />

                    {/* Brand Pill */}
                    <div className="absolute top-4 left-4 px-2.5 py-1 rounded-md bg-slate-950/90 border border-slate-800 text-[11px] font-bold tracking-wider text-slate-300 uppercase backdrop-blur-sm">
                      {brandName}
                    </div>

                    {/* Sale or Authenticity Tag */}
                    {pricing?.isOnSale ? (
                      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-red-600 text-white text-[11px] font-extrabold uppercase shadow-md">
                        {pricing.discountPercent ? `SAVE ${pricing.discountPercent}%` : 'SPECIAL OFFER'}
                      </div>
                    ) : (
                      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-md bg-blue-950/90 border border-blue-700/60 text-blue-300 text-[10px] font-bold uppercase backdrop-blur-sm">
                        GENUINE SPEC
                      </div>
                    )}
                  </div>

                  {/* Card Details & Quick Purchase Bar */}
                  <div className="p-5 space-y-3 bg-slate-900 border-t border-slate-800/80">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">
                        {slideProduct?.category || currentSlide.categoryTag}
                      </div>
                      <h3 
                        className="text-base sm:text-lg font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors cursor-pointer"
                        onClick={() => {
                          if (slideProduct) onSelectProduct(slideProduct);
                        }}
                      >
                        {slideProduct?.name || currentSlide.title}
                      </h3>
                    </div>

                    {/* Price & Action Row */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        {slideProduct ? (
                          pricing?.isOnSale ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-lg font-extrabold text-emerald-400">
                                {pricing.effectivePrice}
                              </span>
                              <span className="text-xs text-slate-500 line-through">
                                {pricing.originalPrice}
                              </span>
                            </div>
                          ) : (
                            <div className="text-lg font-extrabold text-white">
                              {pricing?.effectivePrice || slideProduct.price || 'Contact for Price'}
                            </div>
                          )
                        ) : (
                          <div className="text-sm font-semibold text-slate-400">In Showroom Stock</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {slideProduct && (
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(e, slideProduct)}
                            className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (slideProduct) {
                              onSelectProduct(slideProduct);
                            } else {
                              if (onNavigateToStore) onNavigateToStore();
                            }
                          }}
                          className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Slide Navigation Pagination Dots & Arrows */}
              <div className="mt-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  {curatedSlides.map((slide, idx) => (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={`Go to slide ${idx + 1}`}
                      onClick={() => setCurrentIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentIndex
                          ? 'w-7 bg-blue-500'
                          : 'w-2 bg-slate-700 hover:bg-slate-500'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="Previous Slide"
                    onClick={handlePrev}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next Slide"
                    onClick={handleNext}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
