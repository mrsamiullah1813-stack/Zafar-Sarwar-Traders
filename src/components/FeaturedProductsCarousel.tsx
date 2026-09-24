import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag, 
  Heart, 
  Star, 
  Sparkles, 
  ArrowRight,
  Flame,
  Check,
  Eye
} from 'lucide-react';
import { Product, FeaturedCarouselSettings } from '../types';
import { normalizeProductImage, handleImageError } from '../utils/imageUtils';
import { getProductPricingDetails } from '../utils/pricingUtils';

interface FeaturedProductsCarouselProps {
  products: Product[];
  settings: FeaturedCarouselSettings;
  wishlistIds?: string[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onToggleWishlist?: (productId: string) => void;
  onNavigateToStore?: () => void;
}

export const FeaturedProductsCarousel: React.FC<FeaturedProductsCarouselProps> = ({
  products,
  settings,
  wishlistIds = [],
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  onNavigateToStore
}) => {
  // If carousel is disabled in settings, do not render
  if (settings.isEnabled === false) {
    return null;
  }

  // Resolve the real products to show:
  // 1. Follow admin's configured productIds order
  // 2. Fall back to featured/bestseller/active products from existing database if list is empty
  const displayProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    const productMap = new Map<string, Product>();
    products.forEach(p => {
      if (p && p.id && !p.isHidden) {
        productMap.set(p.id, p);
      }
    });

    const selected: Product[] = [];
    if (Array.isArray(settings.productIds) && settings.productIds.length > 0) {
      settings.productIds.forEach(id => {
        const prod = productMap.get(id);
        if (prod) selected.push(prod);
      });
    }

    // Ensure at least 5 real products for a rich layered depth presentation
    if (selected.length < 5) {
      const addedIds = new Set(selected.map(p => p.id));
      const pool = products.filter(p => !p.isHidden && !addedIds.has(p.id));

      // Priority sort: featured > best sellers > new
      const sortedPool = [...pool].sort((a, b) => {
        const scoreA = (a.isFeatured ? 4 : 0) + (a.isBestSeller ? 2 : 0) + (a.isNew ? 1 : 0);
        const scoreB = (b.isFeatured ? 4 : 0) + (b.isBestSeller ? 2 : 0) + (b.isNew ? 1 : 0);
        return scoreB - scoreA;
      });

      for (const prod of sortedPool) {
        selected.push(prod);
        if (selected.length >= 8) break;
      }
    }

    return selected;
  }, [products, settings.productIds]);

  const totalProducts = displayProducts.length;

  // Active center index
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Track window resize for responsive card spacing calculations
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation handlers with seamless modulo wrap
  const handlePrev = useCallback(() => {
    if (totalProducts <= 0) return;
    setActiveIndex(prev => (prev - 1 + totalProducts) % totalProducts);
  }, [totalProducts]);

  const handleNext = useCallback(() => {
    if (totalProducts <= 0) return;
    setActiveIndex(prev => (prev + 1) % totalProducts);
  }, [totalProducts]);

  // Autoplay functionality
  useEffect(() => {
    if (!settings.autoplay || isHovered || totalProducts <= 1) return;

    const intervalMs = Math.max(3500, (settings.autoplayIntervalSeconds || 5) * 1000);
    const timer = setInterval(() => {
      handleNext();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.autoplay, settings.autoplayIntervalSeconds, isHovered, totalProducts, handleNext]);

  // Touch Swipe for Mobile & Tablet
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 45) {
      handleNext();
    } else if (distance < -45) {
      handlePrev();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Quick Add To Cart feedback
  const handleQuickAdd = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart(product, 1);
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(null);
    }, 1500);
  };

  if (totalProducts === 0) {
    return null;
  }

  // Calculate layered position and transform for any card at index `idx`
  const getCardStyle = (idx: number) => {
    // Calculate circular signed offset from active center index
    let diff = (idx - activeIndex) % totalProducts;
    if (diff > totalProducts / 2) diff -= totalProducts;
    if (diff < -totalProducts / 2) diff += totalProducts;

    const isCenter = diff === 0;
    const isAdjacent = Math.abs(diff) === 1;
    const isOuter = Math.abs(diff) === 2;

    // Responsive horizontal distance multipliers
    let step = 310;
    if (viewportWidth >= 1536) step = 340;
    else if (viewportWidth >= 1280) step = 300;
    else if (viewportWidth >= 1024) step = 260;
    else if (viewportWidth >= 768) step = 210;
    else step = Math.min(270, viewportWidth * 0.72);

    const translateX = diff * step;

    // Scale hierarchy: Center = 1.05, Adjacent = 0.88-0.90, Outer = 0.78
    let scale = 1.05;
    let opacity = 1;
    let zIndex = 30;
    let translateY = -6; // Center card elevated slightly

    if (isAdjacent) {
      scale = viewportWidth < 640 ? 0.82 : 0.88;
      opacity = viewportWidth < 640 ? 0.45 : 0.85;
      zIndex = 20;
      translateY = 8;
    } else if (isOuter) {
      scale = 0.76;
      opacity = viewportWidth < 1024 ? 0 : 0.55;
      zIndex = 10;
      translateY = 16;
    } else if (!isCenter) {
      scale = 0.65;
      opacity = 0;
      zIndex = 0;
      translateY = 24;
    }

    return {
      style: {
        transform: `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), 0) scale(${scale})`,
        zIndex,
        opacity,
        visibility: opacity === 0 ? ('hidden' as const) : ('visible' as const),
        transition: 'transform 650ms cubic-bezier(0.25, 1, 0.5, 1), opacity 550ms ease, box-shadow 550ms ease'
      },
      isCenter,
      isAdjacent,
      isOuter,
      diff
    };
  };

  return (
    <section 
      id="featured-products-carousel"
      className="py-14 sm:py-20 bg-gradient-to-b from-slate-50/70 via-white to-slate-100/40 border-t border-b border-slate-200/80 relative overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Soft Ambient Cinematic Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[500px] bg-gradient-to-tr from-blue-500/8 via-sky-400/5 to-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-10 left-10 w-72 h-72 bg-blue-600/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 right-10 w-72 h-72 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/90 border border-blue-200/70 text-blue-700 text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{settings.badgeText || "Editor's Choice"}</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-slate-900 tracking-tight">
              {settings.title || 'Curated Masterpieces'}
            </h2>
            
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {settings.subtitle || 'Handpicked luxury sanitaryware, designer faucets & architectural fittings direct from our showroom inventory.'}
            </p>
          </div>

          {/* CATALOG LINK */}
          {onNavigateToStore && (
            <div className="self-start md:self-end">
              <button
                type="button"
                onClick={onNavigateToStore}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <span>View Full Catalog</span>
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
              </button>
            </div>
          )}
        </div>

        {/* LAYERED CINEMATIC CAROUSEL STAGE */}
        <div 
          className="relative h-[530px] sm:h-[570px] lg:h-[600px] w-full flex items-center justify-center overflow-visible"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Circular Navigation Buttons on stage flanks */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous product"
            className="absolute left-1 sm:left-4 md:left-8 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 shadow-xl shadow-slate-900/10 border border-slate-200/90 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 backdrop-blur-md cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next product"
            className="absolute right-1 sm:right-4 md:right-8 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-blue-600 shadow-xl shadow-slate-900/10 border border-slate-200/90 flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 backdrop-blur-md cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* ALL LAYERED CAROUSEL CARDS */}
          {displayProducts.map((product, idx) => {
            const { style, isCenter, isAdjacent, diff } = getCardStyle(idx);
            const pricing = getProductPricingDetails(product);
            const isWishlisted = wishlistIds.includes(product.id);
            const isAdded = addedProductId === product.id;

            return (
              <div
                key={product.id || idx}
                style={style}
                onClick={() => {
                  if (isCenter) {
                    onSelectProduct(product);
                  } else {
                    // Clicking an adjacent card smoothly brings it to center focus
                    setActiveIndex(idx);
                  }
                }}
                className={`absolute top-1/2 left-1/2 will-change-transform cursor-pointer w-[285px] sm:w-[320px] lg:w-[350px] ${
                  isCenter ? 'pointer-events-auto' : 'pointer-events-auto'
                }`}
              >
                <div
                  className={`relative rounded-3xl overflow-hidden transition-all duration-500 flex flex-col justify-between ${
                    isCenter 
                      ? 'bg-white border-2 border-blue-500/40 shadow-2xl shadow-blue-900/15 ring-4 ring-blue-500/10' 
                      : 'bg-white/95 border border-slate-200/90 shadow-lg shadow-slate-900/5 hover:border-slate-300'
                  }`}
                >
                  {/* CARD TOP BAR: BADGES & WISHLIST */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-start justify-between pointer-events-none">
                    {/* Left Badges */}
                    <div className="flex flex-col gap-1 items-start">
                      {pricing.isSaleActive && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-rose-300 text-rose-300" />
                          <span>{pricing.discountPercent > 0 ? `-${pricing.discountPercent}%` : 'SALE'}</span>
                        </span>
                      )}
                      {product.isNew && !pricing.isSaleActive && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                          NEW
                        </span>
                      )}
                      {product.isBestSeller && !pricing.isSaleActive && !product.isNew && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider shadow-sm">
                          BESTSELLER
                        </span>
                      )}
                      {product.badge && !pricing.isSaleActive && !product.isNew && !product.isBestSeller && (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Right: Wishlist Icon Button */}
                    {onToggleWishlist && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(product.id);
                        }}
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        className={`pointer-events-auto p-2 rounded-xl backdrop-blur-md transition-all active:scale-90 cursor-pointer ${
                          isWishlisted 
                            ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                            : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white border border-slate-200/80 shadow-xs'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* PRODUCT IMAGE SHOWCASE AREA */}
                  <div className={`relative w-full bg-gradient-to-b from-slate-50 via-slate-50/50 to-slate-100/60 flex items-center justify-center overflow-hidden ${
                    isCenter ? 'p-6 sm:p-8 h-[240px] sm:h-[260px]' : 'p-4 sm:p-6 h-[200px] sm:h-[220px]'
                  }`}>
                    <img
                      src={normalizeProductImage(product.image, product.category, product.name)}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => handleImageError(e, product.category, product.name)}
                      className={`w-full h-full object-contain mix-blend-multiply transition-transform duration-700 ${
                        isCenter ? 'hover:scale-105' : ''
                      }`}
                    />

                    {/* Center Card "View Full Details" Hint */}
                    {isCenter && (
                      <div className="absolute inset-x-0 bottom-3 flex justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-sm text-white text-[11px] font-bold shadow-md">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Click to View Full Details</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* CARD BODY CONTENT */}
                  <div className={`p-4 sm:p-5 flex flex-col justify-between space-y-3.5 ${
                    isCenter ? 'bg-white' : 'bg-slate-50/40'
                  }`}>
                    <div>
                      {/* Category & Star Rating */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                        <span className="font-bold uppercase tracking-wider text-blue-600 truncate max-w-[140px]">
                          {product.brand || product.category || 'Luxury Sanitary'}
                        </span>
                        
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{(product as any).rating || '4.9'}</span>
                        </div>
                      </div>

                      {/* Product Name */}
                      <h3 className={`font-bold text-slate-900 leading-snug line-clamp-1 transition-colors ${
                        isCenter ? 'text-sm sm:text-base text-slate-900 group-hover:text-blue-600' : 'text-xs sm:text-sm text-slate-700'
                      }`}>
                        {product.name}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.shortDescription || product.description || 'Premium grade bathroom sanitaryware & fittings built for durability and elegance.'}
                      </p>
                    </div>

                    {/* Pricing & Add-to-Cart Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                      
                      {/* Price Section */}
                      <div className="min-w-0">
                        {pricing.isSaleActive ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] text-slate-400 line-through leading-none">
                              {pricing.formattedRegularPrice}
                            </span>
                            <span className="text-sm sm:text-base font-black text-rose-600 font-mono tracking-tight">
                              {pricing.formattedSalePrice}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 uppercase font-medium leading-none">
                              Price
                            </span>
                            <span className="text-sm sm:text-base font-black text-slate-900 font-mono tracking-tight">
                              {pricing.formattedCurrentPrice}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        disabled={isAdded}
                        aria-label={`Add ${product.name} to cart`}
                        className={`shrink-0 px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white'
                            : isCenter
                              ? 'bg-slate-900 hover:bg-blue-600 text-white active:scale-95 shadow-md shadow-slate-900/10'
                              : 'bg-slate-200 hover:bg-slate-900 hover:text-white text-slate-700 active:scale-95'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>

                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* ELEGANT PAGINATION INDICATORS */}
        <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6">
          {displayProducts.map((_, dotIdx) => (
            <button
              key={dotIdx}
              type="button"
              onClick={() => setActiveIndex(dotIdx)}
              aria-label={`Go to featured product ${dotIdx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                activeIndex === dotIdx
                  ? 'w-7 h-2 bg-blue-600 shadow-sm shadow-blue-500/40'
                  : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
