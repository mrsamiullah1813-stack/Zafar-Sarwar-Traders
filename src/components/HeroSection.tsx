import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  ShoppingBag,
  Eye,
  CheckCircle2,
  Tag,
  ShieldCheck,
  Award,
  MessageCircle,
  Truck,
  RotateCcw,
  Sparkle,
  SlidersHorizontal,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Product, ProductCategory, ProductBrand, HeroSettings } from '../types';
import { ProductSaleBadge } from './ProductSaleBadge';
import { getProductPricingDetails } from '../utils/pricingUtils';
import { loadStoredConfig } from '../utils/storage';

interface HeroSectionProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  heroSettings: HeroSettings;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onOpenAiConsultant: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  products,
  categories,
  brands,
  heroSettings,
  onSelectProduct,
  onAddToCart,
  onOpenAiConsultant,
}) => {
  // Filter and order products for the Hero Section based on settings and database
  const getHeroProducts = (): Product[] => {
    const safeProducts = Array.isArray(products) ? products : [];
    const activeProducts = safeProducts.filter(p => !p.isHidden);

    let selected: Product[] = [];

    // 1. If admin manually specified product IDs, pick those in order
    if (heroSettings?.heroProductIds && heroSettings.heroProductIds.length > 0) {
      const mapped = heroSettings.heroProductIds
        .map(id => activeProducts.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);
      if (mapped.length > 0) selected = mapped;
    }

    // 2. If no explicit array, look for products marked as isHeroFeatured or isFeatured
    if (selected.length === 0) {
      const heroFeatured = activeProducts.filter(p => p.isHeroFeatured || p.isFeatured);
      if (heroFeatured.length > 0) selected = heroFeatured;
    }

    // 3. Fallback: latest available active products (up to 6)
    if (selected.length === 0) {
      selected = activeProducts.slice(0, 6);
    }

    // Apply custom order if defined
    if (heroSettings?.customProductOrder && heroSettings.customProductOrder.length > 0) {
      const orderMap = new Map<string, number>(heroSettings.customProductOrder.map((id, index) => [id, index]));
      selected.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999;
        const orderB = orderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });
    }

    return selected;
  };

  const heroProducts = getHeroProducts();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(heroSettings?.autoPlay ?? true);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [addedToastProduct, setAddedToastProduct] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure currentIndex stays within bounds when products change
  useEffect(() => {
    if (heroProducts.length > 0 && currentIndex >= heroProducts.length) {
      setCurrentIndex(0);
    }
  }, [heroProducts.length, currentIndex]);

  const durationSec = heroSettings?.rotationDurationSeconds || 5;
  const pauseOnHover = heroSettings?.pauseOnHover ?? true;

  // Auto Rotation Timer
  useEffect(() => {
    if (!isPlaying || heroProducts.length <= 1) return;
    if (pauseOnHover && isHovered) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
    }, durationSec * 1000);

    return () => clearInterval(timer);
  }, [isPlaying, heroProducts.length, durationSec, pauseOnHover, isHovered]);

  // Keyboard navigation listener (Arrow Left / Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [heroProducts.length]);

  const handleNext = () => {
    if (heroProducts.length <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % heroProducts.length);
  };

  const handlePrev = () => {
    if (heroProducts.length <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + heroProducts.length) % heroProducts.length);
  };

  const currentProduct = heroProducts[currentIndex];

  // Mouse Parallax movement calculator
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroSettings?.enableParallax && heroSettings?.enableParallax !== undefined) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const strength = (heroSettings?.parallaxStrength || 15) / 100;
    const moveX = (e.clientX - centerX) * strength * 0.1;
    const moveY = (e.clientY - centerY) * strength * 0.1;

    setMousePosition({ x: moveX, y: moveY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePosition({ x: 0, y: 0 });
  };

  // Helper to format category or brand name
  const getCategoryName = (catId?: string) => {
    if (!catId) return 'Luxury Sanitaryware';
    const found = (categories || []).find(c => c && c.id === catId);
    return found ? found.name : 'Sanitaryware';
  };

  const getBrandName = (brandId?: string, fallbackBrand?: string) => {
    if (fallbackBrand) return fallbackBrand;
    if (!brandId) return 'Zafar Sarwar Traders';
    const found = (brands || []).find(b => b && b.id === brandId);
    return found ? found.name : 'Zafar Sarwar Traders';
  };

  // Get effective product image (supports custom hero image override)
  const getProductImage = (prod: Product) => {
    const override = heroSettings?.productImageOverrides?.[prod.id];
    if (override && override.trim() !== '') {
      return override;
    }
    return prod.image || prod.images?.[0] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=80';
  };

  const handleQuickAddToCart = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(prod, 1);
      setAddedToastProduct(prod.name);
      setTimeout(() => setAddedToastProduct(null), 3000);
    } else {
      onSelectProduct(prod);
    }
  };

  const handleWhatsAppOrder = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    const currentConfig = loadStoredConfig();
    const rawPhone = currentConfig?.whatsapp || currentConfig?.phone || '923108002863';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const pricing = getProductPricingDetails(prod);
    let priceText = pricing.effectivePriceString;
    if (pricing.isSaleActive && pricing.discountPercentage > 0) {
      priceText = `${pricing.formattedSalePrice} (Special Sale: ${pricing.discountPercentage}% OFF — Regular: ${pricing.formattedRegularPrice})`;
    }
    const text = encodeURIComponent(
      `Assalam-o-Alaikum! I am interested in purchasing from ${currentConfig?.name || 'Zafar Sarwar Traders'}:\n\n*Product:* ${prod.name}\n*Price:* ${priceText}\n*SKU:* ${prod.sku || prod.id}\n\nPlease share availability and order confirmation.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // Dynamic animation variants based on transition style
  const transitionStyle = heroSettings?.transitionStyle || 'cinematic-depth';
  const transitionSpeed = heroSettings?.transitionSpeedSeconds || 0.8;

  const getAnimationVariants = () => {
    switch (transitionStyle) {
      case 'depth-zoom':
        return {
          initial: { opacity: 0, scale: 0.75, z: -200, filter: 'blur(12px)' },
          animate: { opacity: 1, scale: 1, z: 0, filter: 'blur(0px)' },
          exit: { opacity: 0, scale: 1.25, z: 200, filter: 'blur(12px)' }
        };
      case '3d-slide':
        return {
          initial: { opacity: 0, x: direction * 120, rotateY: direction * 25, scale: 0.85, filter: 'blur(8px)' },
          animate: { opacity: 1, x: 0, rotateY: 0, scale: 1, filter: 'blur(0px)' },
          exit: { opacity: 0, x: -direction * 120, rotateY: -direction * 25, scale: 0.85, filter: 'blur(8px)' }
        };
      case 'smooth-reveal':
        return {
          initial: { opacity: 0, y: 30, filter: 'blur(6px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          exit: { opacity: 0, y: -30, filter: 'blur(6px)' }
        };
      case 'scale-reveal':
        return {
          initial: { opacity: 0, scale: 0.88, filter: 'blur(10px)' },
          animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
          exit: { opacity: 0, scale: 0.88, filter: 'blur(10px)' }
        };
      case 'perspective-slide':
        return {
          initial: { opacity: 0, x: direction * 80, rotateY: direction * 15, scale: 0.9 },
          animate: { opacity: 1, x: 0, rotateY: 0, scale: 1 },
          exit: { opacity: 0, x: -direction * 80, rotateY: -direction * 15, scale: 0.9 }
        };
      case 'cinematic-depth':
      default:
        return {
          initial: { 
            opacity: 0, 
            x: direction * 60, 
            scale: 0.92,
            rotateY: direction * 12,
            filter: 'blur(10px)'
          },
          animate: { 
            opacity: 1, 
            x: 0, 
            scale: 1,
            rotateY: 0,
            filter: 'blur(0px)'
          },
          exit: { 
            opacity: 0, 
            x: -direction * 60, 
            scale: 0.92,
            rotateY: -direction * 12,
            filter: 'blur(10px)'
          }
        };
    }
  };

  const variants = getAnimationVariants();

  if (!heroSettings?.isEnabled) {
    return null;
  }

  return (
    <section 
      id="hero" 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-[88vh] lg:min-h-[94vh] flex flex-col justify-between bg-slate-950 text-white overflow-hidden select-none"
    >
      {/* 1. CINEMATIC BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Video or Image Background */}
        {heroSettings?.bgType === 'custom-video' && heroSettings?.bgVideoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover filter brightness-[0.25] contrast-[1.2]"
            src={heroSettings.bgVideoUrl}
          />
        ) : (
          <div 
            className="absolute inset-0 bg-cover bg-center filter brightness-[0.2] contrast-[1.3] scale-105 transition-all duration-1000"
            style={{
              backgroundImage: `url('${heroSettings?.bgMediaUrl || 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=2000&q=80'}')`,
              transform: `translate3d(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px, 0) scale(1.05)`
            }}
          />
        )}

        {/* Dark Slate/Navy Overlay Gradients for Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/90" />

        {/* Ambient Blue & Cyan Glow Orbs for Luxury Showroom Atmosphere */}
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[160px] pointer-events-none" 
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-10 w-[450px] h-[450px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none" 
        />
        <div className="absolute top-1/3 left-10 w-[380px] h-[380px] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none" />

        {/* Subtle Architectural Grid Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:36px_36px] opacity-10" />
      </div>

      {/* 2. MAIN HERO COMPOSITION CONTAINER */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full my-auto py-10 lg:py-16">
        
        {/* Quick Added to Cart Toast Notification */}
        <AnimatePresence>
          {addedToastProduct && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-200 text-xs font-bold shadow-2xl backdrop-blur-xl flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>Added <strong className="text-white">{addedToastProduct}</strong> to your Cart!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col-reverse lg:flex-row items-center justify-between gap-10 lg:gap-16">
          
          {/* LEFT SIDE: INFORMATION & ACTION CALLS */}
          <div className="w-full lg:w-1/2 space-y-6 lg:space-y-7 text-left">
            
            {/* Small Premium Badge Header */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600/30 via-cyan-500/20 to-blue-600/30 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-widest backdrop-blur-md shadow-xl"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
              <span>{heroSettings.badgeText || 'ZAFAR SARWAR TRADERS'}</span>
            </motion.div>

            {/* Dynamic Product Category Label */}
            <AnimatePresence mode="wait">
              {currentProduct && (
                <motion.div
                  key={currentProduct.id + '-cat'}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.4 }}
                  className="flex items-center gap-2 text-cyan-400 text-xs sm:text-sm font-bold uppercase tracking-wider"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>{getCategoryName(currentProduct.categoryId)}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">{getBrandName(currentProduct.brandId, currentProduct.brand)}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main Headline / Dynamic Product Name */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentProduct ? currentProduct.id + '-title' : 'static-title'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                {currentProduct ? (
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif text-white tracking-tight leading-[1.15]">
                    {currentProduct.name}
                  </h1>
                ) : (
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-serif text-white tracking-tight leading-[1.15]">
                    {(heroSettings.heading || 'Premium Sanitaryware\n& Bathroom Solutions').split('\n').map((line, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <br />}
                        <span className={idx === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-200 to-white' : ''}>
                          {line}
                        </span>
                      </React.Fragment>
                    ))}
                  </h1>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Product Description */}
            <AnimatePresence mode="wait">
              <motion.p
                key={currentProduct ? currentProduct.id + '-desc' : 'static-desc'}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl line-clamp-3"
              >
                {currentProduct?.description || heroSettings.subheading || 'Explore premium sanitaryware, bathroom fittings, showers, basins, tiles, paints and complete bathroom solutions.'}
              </motion.p>
            </AnimatePresence>

            {/* Price & Availability Tag Box */}
            {currentProduct && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentProduct.id + '-price'}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex flex-wrap items-center gap-4 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/90 backdrop-blur-md"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Showroom Price</span>
                    {currentProduct.price ? (
                      <span className="text-xl sm:text-2xl font-black text-cyan-300 font-mono product-price-typography">
                        Rs. {!isNaN(Number(currentProduct.price)) && Number(currentProduct.price) > 0 ? Number(currentProduct.price).toLocaleString() : currentProduct.price}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-slate-300">Contact for Wholesale Price</span>
                    )}
                  </div>

                  <div className="h-8 w-px bg-slate-800 hidden sm:block" />

                  <div className="flex items-center gap-2">
                    {currentProduct.stockStatus !== 'Out of Stock' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        In Stock & Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/90 border border-amber-500/40 text-amber-300 text-xs font-bold">
                        Available on Order
                      </span>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Action Buttons (View Product, Add to Cart, Order on WhatsApp) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              {currentProduct ? (
                <>
                  {/* Button 1: View Product */}
                  <button
                    onClick={() => onSelectProduct(currentProduct)}
                    className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] border border-blue-400/30"
                  >
                    <Eye className="w-4 h-4 text-cyan-200" />
                    <span>View Product</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </button>

                  {/* Button 2: Add to Cart */}
                  <button
                    onClick={(e) => handleQuickAddToCart(e, currentProduct)}
                    className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-100 font-bold text-xs sm:text-sm border border-slate-700/80 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 shadow-lg hover:border-blue-500/50"
                  >
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                    <span>Add to Cart</span>
                  </button>

                  {/* Button 3: Order on WhatsApp */}
                  <button
                    onClick={(e) => handleWhatsAppOrder(e, currentProduct)}
                    className="px-5 py-3.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 font-bold text-xs sm:text-sm border border-emerald-500/30 backdrop-blur-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] flex items-center gap-2 shadow-lg hover:border-emerald-400/50"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-400" />
                    <span>Order on WhatsApp</span>
                  </button>
                </>
              ) : (
                <>
                  <a
                    href={heroSettings.primaryBtnLink || '#products'}
                    className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2.5 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] border border-blue-400/30"
                  >
                    <ShoppingBag className="w-4 h-4 text-cyan-200" />
                    <span>{heroSettings.primaryBtnText || 'Shop Catalog'}</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </a>

                  <button
                    onClick={onOpenAiConsultant}
                    className="px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 font-bold text-sm border border-cyan-500/30 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>AI Bathroom Planner</span>
                  </button>
                </>
              )}
            </motion.div>

            {/* Quick Trust Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Authorized Brand Distributor</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-cyan-400" />
                <span>European Standards</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-400" />
                <span>Nationwide Express Logistics</span>
              </div>
            </motion.div>

          </div>

          {/* RIGHT SIDE: CINEMATIC 3D FLOATING PRODUCT SHOWCASE */}
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center relative">
            
            {/* Ambient Podium Reflection Floor Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/25 via-cyan-400/15 to-transparent rounded-full blur-3xl transform scale-95 pointer-events-none" />

            {currentProduct ? (
              <div className="w-full max-w-lg relative group">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentProduct.id}
                    variants={variants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ 
                      duration: transitionSpeed, 
                      ease: [0.16, 1, 0.3, 1] 
                    }}
                    style={{
                      transform: `perspective(1000px) rotateX(${-mousePosition.y * 0.8}deg) rotateY(${mousePosition.x * 0.8}deg)`
                    }}
                    onClick={() => onSelectProduct(currentProduct)}
                    className="cursor-pointer relative z-10 bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_25px_60px_-15px_rgba(2,6,23,0.9)] transition-all duration-500 overflow-hidden group/showcase"
                  >
                    {/* Subtle Shimmer Light Beam Effect */}
                    <div className="absolute -inset-full top-0 block w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover/showcase:animate-shimmer pointer-events-none" />

                    {/* Floating Quality Spec Badges */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5">
                      <ProductSaleBadge product={currentProduct} />
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-[11px] font-bold text-slate-200 backdrop-blur-md shadow-md">
                        <Sparkle className="w-3 h-3 text-cyan-400" />
                        <span>Featured Product</span>
                      </div>
                    </div>

                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-[11px] font-bold text-cyan-300 backdrop-blur-md shadow-md">
                      <Award className="w-3 h-3 text-cyan-400" />
                      <span>{getBrandName(currentProduct.brandId, currentProduct.brand)}</span>
                    </div>

                    {/* Main Dominant Product Image Container */}
                    <div className="relative w-full h-72 sm:h-80 my-4 flex items-center justify-center p-6 bg-slate-950/70 rounded-2xl border border-slate-800/80 overflow-hidden group-hover/showcase:border-cyan-500/30 transition-all duration-500 shadow-inner">
                      
                      {/* Radial Spot Light Highlight behind Product */}
                      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/10 via-transparent to-blue-600/10 pointer-events-none" />

                      {/* Main Image with Smooth Floating Bob Effect */}
                      <motion.img
                        animate={{
                          y: [0, -8, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        src={getProductImage(currentProduct)}
                        alt={`${currentProduct.name} - Premium Sanitaryware & Luxury Bathroom Fitting | Zafar Sarwar Traders Pakistan`}
                        className="max-h-full max-w-full object-contain filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] transform group-hover/showcase:scale-105 transition-transform duration-700 ease-out z-10 relative"
                      />

                      {/* Product Floor Reflection Effect */}
                      <div className="absolute bottom-1 w-3/4 h-8 bg-gradient-to-t from-cyan-400/20 to-transparent rounded-full blur-lg pointer-events-none transform scale-y-50 opacity-60 group-hover/showcase:opacity-90 transition-opacity" />

                      {/* Quick Hover Hint Badge */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/showcase:opacity-100 transition-opacity flex items-center justify-center z-20 backdrop-blur-xs">
                        <span className="px-5 py-2.5 rounded-2xl bg-blue-600/90 text-white font-bold text-xs shadow-2xl flex items-center gap-2 backdrop-blur-md transform translate-y-2 group-hover/showcase:translate-y-0 transition-transform">
                          <Eye className="w-4 h-4" />
                          <span>Click to Inspect Specifications</span>
                        </span>
                      </div>
                    </div>

                    {/* Product Footer Quick Info Bar */}
                    <div className="flex items-center justify-between pt-2 z-10 relative">
                      <div className="min-w-0 pr-4">
                        <h3 className="text-base sm:text-lg font-bold text-white truncate group-hover/showcase:text-cyan-200 transition-colors">
                          {currentProduct.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          SKU: {currentProduct.sku || currentProduct.id}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        {(() => {
                          const pricing = getProductPricingDetails(currentProduct);
                          if (pricing.isSaleActive) {
                            return (
                              <div className="flex flex-col items-end">
                                <span className="text-base sm:text-lg font-black text-rose-400 font-mono">
                                  {pricing.formattedSalePrice}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {pricing.showRegularPriceStrike && (
                                    <span className="text-xs text-slate-400 line-through font-mono">
                                      {pricing.formattedRegularPrice}
                                    </span>
                                  )}
                                  {pricing.showDiscountPercentage && pricing.discountPercentage > 0 && (
                                    <span className="px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-300 font-bold text-[10px] font-mono border border-rose-500/40">
                                      {pricing.discountPercentage}% OFF
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return currentProduct.price ? (
                            <span className="text-base sm:text-lg font-black text-cyan-300 font-mono">
                              Rs. {!isNaN(Number(currentProduct.price)) && Number(currentProduct.price) > 0 ? Number(currentProduct.price).toLocaleString() : currentProduct.price}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-slate-300">Contact for Quote</span>
                          );
                        })()}
                      </div>
                    </div>

                  </motion.div>
                </AnimatePresence>
              </div>
            ) : (
              <div className="w-full max-w-lg bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 shadow-2xl">
                <p className="text-sm">No featured products selected to display in hero.</p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* 3. BOTTOM CINEMATIC NAVIGATION BAR & THUMBNAILS */}
      {heroProducts.length > 0 && (
        <div className="relative z-10 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-4 py-3">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            
            {/* Active Counter & Thumbnail Jump Strip */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-cyan-400 font-bold text-sm tracking-wider">
                0{currentIndex + 1} <span className="text-slate-600">/</span> 0{heroProducts.length}
              </span>

              {/* Small Product Thumbnail Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto max-w-xs sm:max-w-md py-1 no-scrollbar">
                {heroProducts.map((prod, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => {
                        setDirection(idx > currentIndex ? 1 : -1);
                        setCurrentIndex(idx);
                      }}
                      className={`relative flex items-center justify-center rounded-lg p-1 border transition-all duration-300 shrink-0 ${
                        isActive 
                          ? 'w-10 h-10 bg-blue-950 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105' 
                          : 'w-8 h-8 bg-slate-900 border-slate-800 hover:border-slate-700 opacity-60 hover:opacity-100'
                      }`}
                      title={prod.name}
                    >
                      <img 
                        src={getProductImage(prod)} 
                        alt={prod.name} 
                        className="w-full h-full object-contain"
                      />
                      {isActive && (
                        <span className="absolute -bottom-1 w-2 h-1 bg-cyan-400 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Product Quick Title */}
            {currentProduct && (
              <div className="hidden lg:flex items-center gap-2 text-slate-300 font-medium truncate max-w-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="truncate text-xs font-semibold">{currentProduct.name}</span>
              </div>
            )}

            {/* Rotation Controls: Auto-play Toggle & Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-1.5 px-3"
                title={isPlaying ? 'Pause Rotation' : 'Play Auto Rotation'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 text-cyan-400" /> : <Play className="w-3.5 h-3.5 text-slate-400" />}
                <span className="text-[11px] font-bold">{isPlaying ? 'Auto' : 'Paused'}</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors active:scale-95"
                  title="Previous Product (Left Arrow)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="w-px h-4 bg-slate-800" />

                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors active:scale-95"
                  title="Next Product (Right Arrow)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
