import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Product, ProductCategory, ProductBrand, HeroSettings, HeroBannerSlide } from '../types';
import { defaultHeroBanners } from '../utils/storage';

export interface HeroSectionProps {
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
  // If explicitly disabled in settings, return null
  if (heroSettings && heroSettings.isEnabled === false) {
    return null;
  }

  // Active banner slides resolution
  const activeBanners: HeroBannerSlide[] = React.useMemo(() => {
    if (heroSettings?.banners && Array.isArray(heroSettings.banners) && heroSettings.banners.length > 0) {
      const filtered = heroSettings.banners.filter(b => b.isActive !== false && b.imageUrl);
      if (filtered.length > 0) {
        return [...filtered].sort((a, b) => a.displayOrder - b.displayOrder);
      }
    }
    return defaultHeroBanners;
  }, [heroSettings?.banners]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);

  // Settings configs
  const autoPlay = heroSettings?.autoPlay ?? true;
  const rotationDuration = Math.max(2, heroSettings?.rotationDurationSeconds ?? 5) * 1000;
  const pauseOnHover = heroSettings?.pauseOnHover ?? true;

  // Safe navigation helpers
  const totalBanners = activeBanners.length;

  const handleNext = useCallback(() => {
    if (totalBanners <= 1) return;
    setDirection(1);
    setCurrentIndex(prev => (prev + 1) % totalBanners);
  }, [totalBanners]);

  const handlePrev = useCallback(() => {
    if (totalBanners <= 1) return;
    setDirection(-1);
    setCurrentIndex(prev => (prev - 1 + totalBanners) % totalBanners);
  }, [totalBanners]);

  const handleDotClick = useCallback((index: number) => {
    if (index === currentIndex) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Autoplay timer
  useEffect(() => {
    if (!autoPlay || isPaused || totalBanners <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, rotationDuration);

    return () => clearInterval(timer);
  }, [autoPlay, isPaused, rotationDuration, totalBanners, handleNext]);

  // Preload next image for instant transition
  useEffect(() => {
    if (totalBanners <= 1) return;
    const nextIdx = (currentIndex + 1) % totalBanners;
    const nextBanner = activeBanners[nextIdx];
    if (nextBanner?.imageUrl) {
      const img = new Image();
      img.src = nextBanner.imageUrl;
    }
  }, [currentIndex, activeBanners, totalBanners]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
    if (pauseOnHover) setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const currentX = e.touches[0].clientX;
    setTouchDeltaX(currentX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (pauseOnHover) setIsPaused(false);
    if (touchStartX === null) return;

    const swipeThreshold = 50;
    if (touchDeltaX < -swipeThreshold) {
      handleNext();
    } else if (touchDeltaX > swipeThreshold) {
      handlePrev();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  // Banner click routing
  const handleBannerClick = (banner: HeroBannerSlide) => {
    if (!banner.linkUrl) return;
    const link = banner.linkUrl.trim();

    // 1. External link
    if (link.startsWith('http://') || link.startsWith('https://')) {
      if (banner.openInNewTab) {
        window.open(link, '_blank', 'noopener,noreferrer');
      } else {
        window.location.href = link;
      }
      return;
    }

    // 2. WhatsApp redirect
    if (link.startsWith('whatsapp') || link.startsWith('https://wa.me/')) {
      window.open(link.startsWith('http') ? link : 'https://wa.me/923108002863', '_blank', 'noopener,noreferrer');
      return;
    }

    // 3. Anchor scrolling (e.g., #products, #contact)
    if (link.startsWith('#')) {
      const targetEl = document.querySelector(link);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // 4. Store navigation
    if (link === '/store' || link === 'store') {
      if (onNavigateToStore) {
        onNavigateToStore();
      } else {
        window.location.hash = '/store';
      }
      return;
    }

    // 5. Categories navigation
    if (link === '/categories' || link === 'categories') {
      if (onNavigateToCategories) {
        onNavigateToCategories();
      } else {
        window.location.hash = '/categories';
      }
      return;
    }

    // 6. Product link matching (e.g., /product/123 or product ID/slug)
    if (link.includes('/product/')) {
      const parts = link.split('/product/');
      const query = parts[1]?.trim().toLowerCase();
      if (query && products && products.length > 0) {
        const found = products.find(p => 
          p.id.toLowerCase() === query || 
          p.name.toLowerCase().replace(/\s+/g, '-').includes(query)
        );
        if (found) {
          onSelectProduct(found);
          return;
        }
      }
      window.location.href = link;
      return;
    }

    // Default fallback: internal route or anchor
    if (link.startsWith('/')) {
      window.location.href = link;
    } else {
      const el = document.getElementById(link);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const currentBanner = activeBanners[currentIndex] || activeBanners[0];
  const isClickable = Boolean(currentBanner?.linkUrl);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: '0%',
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0
    })
  };

  return (
    <section 
      id="hero-banner-slider" 
      aria-label="Promotional Banners"
      className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 pb-2 sm:pb-3"
    >
      <div
        className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-900/80 border border-slate-800/80 shadow-2xl shadow-black/40 group select-none"
        onMouseEnter={() => pauseOnHover && setIsPaused(true)}
        onMouseLeave={() => pauseOnHover && setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Aspect Ratio Container for Responsive Full Banner Display */}
        {/* Mobile: 16/9, Tablet: 16/7, Desktop: 21/8 -> displays entire graphic banner without distortion */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[16/7] md:aspect-[21/8] overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentBanner?.id || currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 280, damping: 32 },
                opacity: { duration: 0.35 }
              }}
              onClick={() => handleBannerClick(currentBanner)}
              className={`absolute inset-0 w-full h-full ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              role={isClickable ? 'button' : 'img'}
              aria-label={currentBanner?.title || `Promotional Banner ${currentIndex + 1}`}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleBannerClick(currentBanner);
                }
              }}
            >
              <picture className="w-full h-full block">
                {currentBanner?.mobileImageUrl && (
                  <source media="(max-width: 640px)" srcSet={currentBanner.mobileImageUrl} />
                )}
                <img
                  src={currentBanner?.imageUrl}
                  alt={currentBanner?.title || 'Promotional Banner'}
                  className="w-full h-full object-cover object-center transition-transform duration-700 sm:group-hover:scale-[1.01]"
                  loading={currentIndex === 0 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(e) => {
                    // Fallback to high-res banner if broken link
                    const target = e.currentTarget;
                    if (!target.src.includes('photo-1584622650111')) {
                      target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1920&q=85';
                    }
                  }}
                />
              </picture>

              {/* Optional Subtle Link Indicator on desktop hover if clickable */}
              {isClickable && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-white/90 text-xs font-medium pointer-events-none shadow-lg">
                  <span>Explore</span>
                  <ExternalLink className="w-3 h-3 text-amber-400" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimalist Left Navigation Arrow */}
        {totalBanners > 1 && (
          <button
            type="button"
            id="hero-banner-prev-btn"
            aria-label="Previous Banner"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-black/75 active:bg-black/90 backdrop-blur-md border border-white/15 text-white/90 hover:text-white flex items-center justify-center transition-all duration-200 shadow-xl opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Minimalist Right Navigation Arrow */}
        {totalBanners > 1 && (
          <button
            type="button"
            id="hero-banner-next-btn"
            aria-label="Next Banner"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-black/45 hover:bg-black/75 active:bg-black/90 backdrop-blur-md border border-white/15 text-white/90 hover:text-white flex items-center justify-center transition-all duration-200 shadow-xl opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
          >
            <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Minimalist Pagination Dots at Bottom Center */}
        {totalBanners > 1 && (
          <div 
            className="absolute bottom-2.5 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 shadow-lg"
            role="tablist"
            aria-label="Banner pagination"
          >
            {activeBanners.map((banner, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={banner.id || idx}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Go to slide ${idx + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDotClick(idx);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer focus:outline-none ${
                    isActive 
                      ? 'w-5 sm:w-7 bg-amber-400 shadow-sm shadow-amber-400/50' 
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
