import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShoppingBag, 
  Heart, 
  Star, 
  Flame, 
  Check, 
  Eye,
  Edit
} from 'lucide-react';
import { Product, FeaturedCarouselSettings } from '../types';
import { normalizeProductImage, resolveProductImage, handleImageError } from '../utils/imageUtils';
import { getProductPricingDetails } from '../utils/pricingUtils';
import { ProductCardRating } from './ProductCardRating';
import { ProductLikeButton } from './ProductLikeButton';

interface FeaturedProductsCarouselProps {
  products: Product[];
  settings: FeaturedCarouselSettings;
  isAdmin?: boolean;
  onEditProduct?: (product: Product) => void;
  wishlistIds?: string[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onToggleWishlist?: (productId: string) => void;
  onNavigateToStore?: () => void;
}

export const FeaturedProductsCarousel: React.FC<FeaturedProductsCarouselProps> = ({
  products,
  settings,
  isAdmin,
  onEditProduct,
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
  const [isSwiping, setIsSwiping] = useState(false);
  const [userInteractionKey, setUserInteractionKey] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() => 
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  // Track previous diff for each card to prevent wrapping teleport glitch
  const prevDiffsRef = useRef<Map<number, number>>(new Map());

  // Track window resize for responsive card spacing calculations
  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Navigation handlers with seamless modulo wrap and user timer reset
  const handlePrev = useCallback(() => {
    if (totalProducts <= 0) return;
    setActiveIndex(prev => (prev - 1 + totalProducts) % totalProducts);
    setUserInteractionKey(Date.now());
  }, [totalProducts]);

  const handleNext = useCallback(() => {
    if (totalProducts <= 0) return;
    setActiveIndex(prev => (prev + 1) % totalProducts);
    setUserInteractionKey(Date.now());
  }, [totalProducts]);

  const handleSelectIndex = useCallback((idx: number) => {
    setActiveIndex(idx);
    setUserInteractionKey(Date.now());
  }, []);

  // Ultra-smooth, lightweight 5-second (5000ms) autoplay
  // Resets cleanly on manual interaction and pauses during hover or swipe
  useEffect(() => {
    if (isHovered || isSwiping || totalProducts <= 1) return;
    if (settings.autoplay === false) return;

    const timer = setTimeout(() => {
      setActiveIndex(prev => (prev + 1) % totalProducts);
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeIndex, isHovered, isSwiping, userInteractionKey, totalProducts, settings.autoplay]);

  // Touch Swipe for Mobile & Tablet with zero-coordinate bug fix
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsSwiping(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsSwiping(false);
    if (touchStartX.current !== null && touchEndX.current !== null) {
      const distance = touchStartX.current - touchEndX.current;
      if (distance > 45) {
        handleNext();
      } else if (distance < -45) {
        handlePrev();
      }
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

    // Detect if this card jumped across the wrap boundary (e.g. from -2 to +2 or vice versa)
    const prevDiff = prevDiffsRef.current.get(idx);
    const hasWrapped = prevDiff !== undefined && Math.abs(diff - prevDiff) > 1.5;
    prevDiffsRef.current.set(idx, diff);

    // Responsive horizontal distance multipliers
    let step = 310;
    if (viewportWidth >= 1536) step = 345;
    else if (viewportWidth >= 1280) step = 310;
    else if (viewportWidth >= 1024) step = 265;
    else if (viewportWidth >= 768) step = 215;
    else step = Math.min(270, viewportWidth * 0.72);

    const translateX = diff * step;

    // Cinematic scale & elevation hierarchy
    let scale = 1.04;
    let opacity = 1;
    let zIndex = 30;
    let translateY = -6; // Center card elevated gently

    if (isAdjacent) {
      scale = viewportWidth < 640 ? 0.84 : 0.88;
      opacity = viewportWidth < 640 ? 0.38 : 0.82;
      zIndex = 20;
      translateY = 6;
    } else if (isOuter) {
      scale = 0.76;
      opacity = viewportWidth < 1024 ? 0 : 0.45;
      zIndex = 10;
      translateY = 16;
    } else if (!isCenter) {
      scale = 0.65;
      opacity = 0;
      zIndex = 0;
      translateY = 24;
    }

    // Smooth, cinematic transition:
    // When a card wraps around ends or is completely hidden, suppress transform transition
    // so it doesn't fly across the center card!
    const transition = hasWrapped || opacity === 0
      ? 'opacity 300ms ease'
      : 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1), opacity 450ms ease';

    return {
      style: {
        transform: `translate3d(calc(-50% + ${translateX}px), calc(-50% + ${translateY}px), 0) scale(${scale})`,
        zIndex,
        opacity,
        visibility: opacity === 0 ? ('hidden' as const) : ('visible' as const),
        pointerEvents: opacity > 0 ? ('auto' as const) : ('none' as const),
        willChange: 'transform, opacity',
        transition
      },
      isCenter,
      isAdjacent,
      isOuter,
      diff
    };
  };

  // Resolve Header Labels
  const eyebrowLabel = settings.badgeText || 'OUR COLLECTION';
  const headingTitle = settings.title && settings.title !== 'Curated Masterpieces' ? settings.title : 'Featured Products';
  const subtitleText = settings.subtitle && !settings.subtitle.includes('sanitaryware, designer') ? settings.subtitle : 'Explore our selected products';

  return (
    <section 
      id="featured-products-carousel"
      className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-[#FCFBF9] via-[#FAF8F5] to-[#F5F2EC] border-t border-b border-[#EAE5DD] relative overflow-hidden select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Soft Ambient Cinematic Lighting: Very subtle off-white halo behind center card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[950px] h-[520px] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/95 via-[#F8F5EE]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      
      {/* Delicate warm edge highlights */}
      <div className="absolute -top-12 left-12 w-80 h-80 bg-[#EFE9DF]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 right-12 w-80 h-80 bg-[#EAE2D5]/25 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* SECTION HEADER: CENTER-ALIGNED WITH ELEGANT HIERARCHY */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-8 sm:mb-11">
          {/* Eyebrow Label */}
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.24em] text-[#8C7A65] mb-2 sm:mb-2.5">
            {eyebrowLabel}
          </span>
          
          {/* Main Heading */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-[#1C1917] tracking-tight mb-2 sm:mb-2.5">
            {headingTitle}
          </h2>
          
          {/* Short Neutral Subtitle */}
          <p className="text-xs sm:text-sm text-[#736A5F] max-w-lg leading-relaxed">
            {subtitleText}
          </p>
        </div>

        {/* LAYERED CINEMATIC CAROUSEL STAGE */}
        <div 
          className="relative h-[540px] sm:h-[580px] lg:h-[620px] w-full flex items-center justify-center overflow-visible"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Circular Navigation Buttons on stage flanks */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous product"
            className="absolute left-1 sm:left-4 md:left-8 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-[#443E38] hover:text-[#1C1917] shadow-[0_10px_25px_rgba(40,30,20,0.08)] border border-[#E2DAD0] flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 backdrop-blur-md cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={handleNext}
            aria-label="Next product"
            className="absolute right-1 sm:right-4 md:right-8 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-[#443E38] hover:text-[#1C1917] shadow-[0_10px_25px_rgba(40,30,20,0.08)] border border-[#E2DAD0] flex items-center justify-center transition-all duration-200 active:scale-90 hover:scale-105 backdrop-blur-md cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* ALL LAYERED CAROUSEL CARDS */}
          {displayProducts.map((product, idx) => {
            const { style, isCenter, isAdjacent, isOuter } = getCardStyle(idx);
            const pricing = getProductPricingDetails(product);
            const isWishlisted = wishlistIds.includes(product.id);
            const isAdded = addedProductId === product.id;

            return (
              <div
                key={`${product.id}-${idx}`}
                style={style}
                onClick={() => {
                  if (isCenter) {
                    onSelectProduct(product);
                  } else if (isAdjacent || isOuter) {
                    // Clicking an adjacent or outer card brings it into center focus
                    handleSelectIndex(idx);
                  }
                }}
                className={`absolute top-1/2 left-1/2 will-change-transform w-[290px] sm:w-[330px] lg:w-[360px] ${
                  style.pointerEvents === 'none' ? 'pointer-events-none' : 'pointer-events-auto cursor-pointer'
                }`}
              >
                <div
                  className={`relative rounded-3xl overflow-hidden transition-all duration-500 flex flex-col justify-between ${
                    isCenter 
                      ? 'bg-white border-2 border-[#D8CFC3] shadow-[0_22px_45px_-10px_rgba(45,35,25,0.11),0_10px_20px_-5px_rgba(0,0,0,0.03)] ring-1 ring-[#D8CFC3]/40' 
                      : 'bg-[#FFFEFC]/95 border border-[#E8E2D8] shadow-[0_10px_25px_-8px_rgba(45,35,25,0.05)] hover:border-[#DFD7CC] hover:bg-white'
                  }`}
                >
                  {/* CARD TOP BAR: BADGES & WISHLIST */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-start justify-between pointer-events-none">
                    {/* Left Badges */}
                    <div className="flex flex-col gap-1 items-start">
                      {pricing.isSaleActive && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-black text-[10px] uppercase tracking-wider shadow-xs flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-rose-200 text-rose-200" />
                          <span>{pricing.discountPercent > 0 ? `-${pricing.discountPercent}%` : 'SALE'}</span>
                        </span>
                      )}
                      {product.isNew && !pricing.isSaleActive && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#1C1917] text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
                          NEW
                        </span>
                      )}
                      {product.isBestSeller && !pricing.isSaleActive && !product.isNew && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-400 text-stone-950 font-black text-[10px] uppercase tracking-wider shadow-xs">
                          BESTSELLER
                        </span>
                      )}
                      {product.badge && !pricing.isSaleActive && !product.isNew && !product.isBestSeller && (
                        <span className="px-2.5 py-1 rounded-lg bg-[#443E38] text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Right: Admin Edit & Wishlist Icon Buttons */}
                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      {isAdmin && onEditProduct && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProduct(product);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer z-30"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Product</span>
                        </button>
                      )}

                      <ProductLikeButton productId={product.id} variant="card-floating" />
                    </div>
                  </div>

                  {/* PRODUCT IMAGE SHOWCASE AREA (WARM PODIUM DISPLAY) */}
                  <div className="p-3">
                    <div className={`relative w-full rounded-2xl overflow-hidden flex items-center justify-center transition-all ${
                      isCenter 
                        ? 'p-6 sm:p-7 h-[230px] sm:h-[250px] bg-gradient-to-b from-[#FAF8F5] via-white to-[#F5F1EB] shadow-inner' 
                        : 'p-4 sm:p-5 h-[190px] sm:h-[210px] bg-gradient-to-b from-[#FAF8F5] to-[#F2EDE6]'
                    }`}>
                      <img
                        src={resolveProductImage(product)}
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
                        <div className="absolute inset-x-0 bottom-2.5 flex justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C1917]/90 text-white text-[10px] font-bold shadow-md backdrop-blur-sm">
                            <Eye className="w-3 h-3 text-[#E2DAD0]" />
                            <span>Click to View Details</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CARD BODY CONTENT */}
                  <div className="p-4 sm:p-5 flex flex-col justify-between space-y-3.5 bg-white/70 border-t border-[#F0EAE1]">
                    <div>
                      {/* Category & Star Rating */}
                      {/* Category, Real Rating & Likes */}
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="font-bold uppercase tracking-wider text-[#8C7456] truncate max-w-[120px]">
                          {product.brand || product.category || 'Luxury Sanitary'}
                        </span>
                        
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <ProductCardRating productId={product.id} />
                          <span className="text-[#D6CCC0]">|</span>
                          <ProductLikeButton productId={product.id} variant="card-badge" />
                        </div>
                      </div>

                      {/* Product Name */}
                      <h3 className={`font-bold leading-snug line-clamp-1 transition-colors ${
                        isCenter ? 'text-sm sm:text-base text-[#1C1917] group-hover:text-[#786A55]' : 'text-xs sm:text-sm text-[#38332E]'
                      }`}>
                        {product.name}
                      </h3>

                      {/* Short Description */}
                      <p className="text-xs text-[#736B63] line-clamp-2 mt-1 leading-relaxed">
                        {product.shortDescription || product.description || 'Premium grade bathroom sanitaryware & fittings built for durability and elegance.'}
                      </p>
                    </div>

                    {/* Pricing & Add-to-Cart Action */}
                    <div className="pt-3 border-t border-[#EAE3D8] flex items-center justify-between gap-3">
                      
                      {/* Price Section */}
                      <div className="min-w-0">
                        {pricing.isSaleActive ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] text-[#9E958A] line-through leading-none">
                              {pricing.formattedRegularPrice}
                            </span>
                            <span className="text-sm sm:text-base font-black text-rose-600 font-mono tracking-tight">
                              {pricing.formattedSalePrice}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[#9E958A] uppercase font-medium leading-none">
                              Price
                            </span>
                            <span className="text-sm sm:text-base font-black text-[#1C1917] font-mono tracking-tight">
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
                              ? 'bg-[#1C1917] hover:bg-[#38332E] text-white active:scale-95 shadow-md shadow-stone-900/10'
                              : 'bg-[#F1ECE4] hover:bg-[#1C1917] hover:text-white text-[#443E38] active:scale-95 border border-[#E0D7CB]'
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

                    {/* Admin Dedicated Edit Product Button */}
                    {isAdmin && onEditProduct && (
                      <div className="pt-2 mt-2 border-t border-[#EAE3D8]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProduct(product);
                          }}
                          className="w-full py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer z-30"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Edit Product</span>
                        </button>
                      </div>
                    )}
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
              onClick={() => handleSelectIndex(dotIdx)}
              aria-label={`Go to featured product ${dotIdx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                activeIndex === dotIdx
                  ? 'w-8 h-2 bg-[#1C1917] shadow-xs'
                  : 'w-2 h-2 bg-[#DED6CB] hover:bg-[#B8AEA0]'
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
