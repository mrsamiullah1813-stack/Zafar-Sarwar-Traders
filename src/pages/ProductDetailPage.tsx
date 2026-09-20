import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  MessageCircle, 
  Check, 
  ShieldCheck, 
  Plus, 
  Minus, 
  Truck, 
  Award, 
  Share2, 
  ArrowLeft,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  ChevronLeft,
  Info,
  FileText,
  HelpCircle,
  Clock,
  Shield,
  Zap,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { Product, ProductCategory, ProductBrand, BusinessConfig, ProductVariant, PaintShade } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductSaleBadge } from '../components/ProductSaleBadge';
import { ProductDeliveryEstimator } from '../components/ProductDeliveryEstimator';
import { PaintShadeSelector } from '../components/PaintShadeSelector';
import { 
  getActiveProductPrice, 
  getActiveVariants, 
  hasActiveVariants,
  formatPakistaniPrice,
  getProductQuantityConfig,
  buildProductWhatsAppOrderUrl,
  parseNumericPrice
} from '../utils/pricingUtils';
import { getActivePaintShades, hasActivePaintShades } from '../utils/paintShadeUtils';
import { getProductSlug, getCategorySlug } from '../utils/slugUtils';
import { navigateBackFromProduct } from '../utils/navigationHistory';
import { normalizeProductImage, normalizeProductImages, resolveProductImage, handleImageError } from '../utils/imageUtils';
import { ProductReviewsSection } from '../components/ProductReviewsSection';
import { ProductCardRating } from '../components/ProductCardRating';

interface ProductDetailPageProps {
  product: Product;
  categories: ProductCategory[];
  brands: ProductBrand[];
  allProducts: Product[];
  config: BusinessConfig;
  isAdmin?: boolean;
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string,
    selectedQuality?: string,
    selectedVariant?: string,
    selectedShade?: PaintShade,
    selectedVariantObj?: ProductVariant
  ) => void;
  onBuyNow: (
    product: Product,
    quantity: number,
    selectedColor?: string,
    selectedSize?: string,
    selectedQuality?: string,
    selectedVariant?: string,
    selectedShade?: PaintShade,
    selectedVariantObj?: ProductVariant
  ) => void;
  onNavigate: (path: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  product,
  categories,
  brands,
  allProducts,
  config,
  onAddToCart,
  onBuyNow,
  onNavigate
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(() => {
    const variants = getActiveVariants(product);
    return variants.find(v => v.isDefault) || variants[0];
  });
  const [selectedShade, setSelectedShade] = useState<PaintShade | undefined>(() => {
    const shades = getActivePaintShades(product);
    return shades.find(s => s.isActive) || shades[0];
  });
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'features'>('details');

  // Touch swipe support for mobile gallery
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Quantity config
  const qtyConfig = getProductQuantityConfig(product);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    setSelectedImageIndex(0);
    const availableVariants = getActiveVariants(product);
    setSelectedVariant(availableVariants.find(v => v.isDefault) || availableVariants[0]);
    const availableShades = getActivePaintShades(product);
    setSelectedShade(availableShades.find(s => s.isActive) || availableShades[0]);
    setQuantity(qtyConfig.defaultQuantity || 1);
  }, [product.id]);

  // Gallery of images
  const mediaImages = useMemo(() => {
    const imgs = normalizeProductImages(product.images, product.image, product.category, product.name);
    return imgs.length > 0 ? imgs : [resolveProductImage(product)];
  }, [product]);

  // Resolved brand and category
  const categoryObj = categories.find(c => c.id === product.categoryId || c.name === product.category);
  const brandObj = brands.find(b => b.id === product.brandId || b.name === product.brand);
  const brandName = product.brand || brandObj?.name || 'Zafar Sarwar Traders Genuine';

  // Active pricing based on selected variant
  const activePricing = getActiveProductPrice(product, selectedVariant);

  // Calculated savings if on sale
  const savingsAmount = useMemo(() => {
    if (!activePricing.isOnSale) return null;
    const orig = parseNumericPrice(activePricing.originalPrice);
    const eff = parseNumericPrice(activePricing.effectivePrice);
    if (orig > eff) {
      return formatPakistaniPrice(orig - eff);
    }
    return null;
  }, [activePricing]);

  // Total price for current quantity
  const totalPriceDisplay = useMemo(() => {
    const eff = parseNumericPrice(activePricing.effectivePrice);
    if (eff > 0 && quantity > 1) {
      return formatPakistaniPrice(eff * quantity);
    }
    return null;
  }, [activePricing.effectivePrice, quantity]);

  // Variants list
  const variants = getActiveVariants(product);
  const hasVariants = hasActiveVariants(product);

  // Paint shades
  const paintShades = getActivePaintShades(product);
  const hasShades = hasActivePaintShades(product);

  // Related products from the same category
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter(p => !p.isHidden && p.id !== product.id && (p.categoryId === product.categoryId || p.category === product.category))
      .slice(0, 4);
  }, [allProducts, product]);

  const handleBack = () => {
    const fallbackPath = categoryObj ? `/category/${getCategorySlug(categoryObj)}` : '/store';
    navigateBackFromProduct(fallbackPath, onNavigate);
  };

  const handleAdd = () => {
    onAddToCart(
      product,
      quantity,
      undefined,
      undefined,
      undefined,
      selectedVariant?.name,
      selectedShade,
      selectedVariant
    );
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuy = () => {
    onBuyNow(
      product,
      quantity,
      undefined,
      undefined,
      undefined,
      selectedVariant?.name,
      selectedShade,
      selectedVariant
    );
  };

  const handleWhatsApp = () => {
    const rawPhone = config?.whatsapp || config?.phone || '923108002863';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const result = buildProductWhatsAppOrderUrl({
      businessName: config?.name || 'Zafar Sarwar Traders',
      whatsappNumber: phone,
      product,
      quantity,
      selectedVariantName: selectedVariant?.name,
      selectedShadeName: selectedShade?.name
    });
    window.open(result.url, '_blank');
  };

  const handleShare = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else if (typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.value = window.location.href;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch {
      // Ignore copy error
    }
  };

  const handleScrollToReviews = () => {
    const el = document.getElementById('product-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Touch gallery gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      // Swiped left -> next image
      setSelectedImageIndex((prev) => (prev + 1 < mediaImages.length ? prev + 1 : 0));
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> prev image
      setSelectedImageIndex((prev) => (prev - 1 >= 0 ? prev - 1 : mediaImages.length - 1));
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Safe Product JSON-LD structured data using existing real data ONLY
  const productJsonLd = useMemo(() => {
    const slug = getProductSlug(product);
    const prodUrl = `https://zafarsarwartraders.shop/product/${slug}`;
    const primaryImg = normalizeProductImage(mediaImages[0] || product.image, product.category, product.name);

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": primaryImg,
      "description": product.description || `${product.name} available at Zafar Sarwar Traders in Chiniot, Pakistan.`,
      ...(brandName ? { "brand": { "@type": "Brand", "name": brandName } } : {}),
      ...(product.category ? { "category": product.category } : {}),
      "offers": {
        "@type": "Offer",
        "url": prodUrl,
        "priceCurrency": "PKR",
        "price": activePricing.effectivePrice,
        "availability": product.stockStatus === 'out_of_stock' 
          ? "https://schema.org/OutOfStock" 
          : "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition",
        "seller": {
          "@type": "HomeGoodsStore",
          "name": "Zafar Sarwar Traders",
          "url": "https://zafarsarwartraders.shop/"
        }
      }
    };
  }, [product, mediaImages, brandName, activePricing.effectivePrice]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 sm:pb-32 md:pb-20">
      
      {/* Schema.org Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Floating Added To Cart Toast */}
      {addedToast && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 px-4 py-3 bg-slate-900/95 border border-emerald-500/60 text-white text-xs font-semibold rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 max-w-[90vw]">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white stroke-[3]" />
          </div>
          <span className="truncate">Added <strong>{product.name}</strong> to Cart!</span>
        </div>
      )}

      {/* Top Mobile/Desktop Navigation Bar */}
      <div className="bg-white/95 border-b border-slate-200/90 sticky top-[56px] sm:top-[64px] z-30 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2">
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200/90 hover:border-blue-300 text-slate-700 hover:text-blue-600 font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
              title="Go back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-600" />
              <span className="text-[11px] sm:text-xs">Back</span>
            </button>

            <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

            {/* Breadcrumb Links */}
            <div className="min-w-0">
              <Breadcrumbs
                items={[
                  { 
                    label: categoryObj?.name || 'Store', 
                    onClick: () => categoryObj ? onNavigate(`/category/${getCategorySlug(categoryObj)}`) : onNavigate('/store') 
                  },
                  { label: product.name, active: true }
                ]}
                onNavigateHome={() => onNavigate('/')}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-xs cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Share product link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            {copiedLink && (
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Copied!
              </span>
            )}

            {/* Store Link on Desktop */}
            <button
              type="button"
              onClick={() => onNavigate('/store')}
              className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors shrink-0 hidden md:inline-flex items-center gap-1 cursor-pointer"
            >
              <span>All Items</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        
        {/* Main Product Container */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-3.5 sm:p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-14">
            
            {/* ======================================================== */}
            {/* 1. PRODUCT IMAGE & GALLERY SECTION                      */}
            {/* ======================================================== */}
            <div className="lg:col-span-6 space-y-3 sm:space-y-4">
              
              {/* Primary Image Display Canvas */}
              <div 
                className="relative w-full h-72 sm:h-96 lg:h-[460px] bg-gradient-to-b from-slate-50 to-slate-100/70 rounded-2xl border border-slate-200/80 p-3 sm:p-6 flex items-center justify-center overflow-hidden select-none group touch-pan-y"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <img
                  src={normalizeProductImage(mediaImages[selectedImageIndex] || mediaImages[0], product.category, product.name)}
                  alt={`${product.name} - ${product.category || 'Sanitaryware & Building Materials'} | Zafar Sarwar Traders Chiniot`}
                  referrerPolicy="no-referrer"
                  loading="eager"
                  decoding="async"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    const altList = Array.isArray(product.images)
                      ? product.images.filter((i: any) => typeof i === 'string' && i.trim().length > 3 && !target.src.includes(i))
                      : [];
                    if (altList.length > 0) {
                      target.src = normalizeProductImage(altList[0], product.category, product.name);
                      return;
                    }
                    handleImageError(e, product.category, product.name);
                  }}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                />

                {/* Top Left Badges (Sale / Discount) */}
                <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 flex flex-col gap-1.5 z-10 pointer-events-none">
                  {activePricing.isOnSale && (
                    <ProductSaleBadge pricing={activePricing} size="md" />
                  )}
                  {product.badge && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Top Right Counter Badge on Mobile */}
                {mediaImages.length > 1 && (
                  <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-sm text-white text-[10px] font-mono font-bold tracking-wider z-10">
                    {selectedImageIndex + 1} / {mediaImages.length}
                  </div>
                )}

                {/* Desktop Arrow Controls */}
                {mediaImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedImageIndex((prev) => (prev - 1 >= 0 ? prev - 1 : mediaImages.length - 1))}
                      className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-slate-200 text-slate-700 items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Previous image"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedImageIndex((prev) => (prev + 1 < mediaImages.length ? prev + 1 : 0))}
                      className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 hover:bg-white border border-slate-200 text-slate-700 items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Next image"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Swipe Dot Indicators */}
              {mediaImages.length > 1 && (
                <div className="flex sm:hidden items-center justify-center gap-1.5 pt-1">
                  {mediaImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'w-6 bg-blue-600'
                          : 'w-1.5 bg-slate-300'
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Image Thumbnails Ribbon */}
              {mediaImages.length > 1 && (
                <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {mediaImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-14 h-14 sm:w-18 sm:h-18 rounded-xl bg-slate-50 border p-1 shrink-0 overflow-hidden cursor-pointer transition-all ${
                        selectedImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-600/30 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={normalizeProductImage(img, product.category, product.name)}
                        alt={`${product.name} view ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, product.category, product.name)}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges Bar (Amazon / Shopify Quality) */}
              <div className="pt-2 sm:pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="p-2 sm:p-3 rounded-xl bg-slate-50 border border-slate-100/90 flex flex-col items-center justify-center">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mb-1" />
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">100% Genuine</div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-slate-500">Verified Stock</div>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-slate-50 border border-slate-100/90 flex flex-col items-center justify-center">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mb-1" />
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">Safe Delivery</div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-slate-500">All Pakistan</div>
                </div>
                <div className="p-2 sm:p-3 rounded-xl bg-slate-50 border border-slate-100/90 flex flex-col items-center justify-center">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mb-1" />
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 leading-tight">Showroom Quality</div>
                  <div className="text-[8.5px] sm:text-[9.5px] text-slate-500">Official Brand</div>
                </div>
              </div>

            </div>

            {/* ======================================================== */}
            {/* 2. PRODUCT INFO, PRICING, VARIANTS & ACTIONS            */}
            {/* ======================================================== */}
            <div className="lg:col-span-6 space-y-4 sm:space-y-5">
              
              {/* Brand, Category & Availability Pill */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase">
                    <span 
                      className="text-blue-600 hover:text-blue-700 cursor-pointer bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100"
                      onClick={() => categoryObj && onNavigate(`/category/${getCategorySlug(categoryObj)}`)}
                    >
                      {product.category || 'Building Materials'}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-700 font-semibold">{brandName}</span>
                  </div>

                  {product.stockStatus && (
                    <div className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{product.stockStatus}</span>
                    </div>
                  )}
                </div>

                {/* Product Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black font-serif text-slate-900 tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Rating & SKU Bar */}
                <div className="flex items-center flex-wrap gap-2 sm:gap-3 pt-0.5">
                  <button 
                    type="button"
                    onClick={handleScrollToReviews}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                    title="View genuine customer reviews"
                  >
                    <ProductCardRating productId={product.id} starClassName="w-3.5 h-3.5" />
                    <span className="text-[11px] font-semibold text-blue-600 underline">
                      Reviews
                    </span>
                  </button>

                  {product.sku && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        SKU: {product.sku}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* 3. PRICING & SAVINGS CARD                                */}
              {/* ======================================================== */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/90 shadow-xs">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div>
                    {activePricing.isOnSale ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2.5 flex-wrap">
                          <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                            {activePricing.effectivePrice}
                          </span>
                          <span className="text-sm sm:text-base font-semibold text-slate-400 line-through">
                            {activePricing.originalPrice}
                          </span>
                          {activePricing.discountPercent && (
                            <span className="px-2 py-0.5 rounded-md bg-red-500 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                              Save {activePricing.discountPercent}%
                            </span>
                          )}
                        </div>
                        {savingsAmount && (
                          <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>You save {savingsAmount} on this order</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                          {activePricing.effectivePrice || 'Contact Showroom for Price'}
                        </span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                      Inclusive of all taxes • Delivery calculated below
                    </div>
                  </div>

                  {totalPriceDisplay && (
                    <div className="text-right bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Total ({quantity} {qtyConfig.unitLabel || 'items'})</div>
                      <div className="text-sm font-black text-blue-600">{totalPriceDisplay}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* ======================================================== */}
              {/* 4. PRODUCT VARIANTS / OPTIONS SELECTOR                   */}
              {/* ======================================================== */}
              {hasVariants && variants.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 uppercase tracking-wider">
                      {product.variantsConfig?.optionName || 'Select Option'}:
                    </span>
                    <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {selectedVariant?.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-600/30'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          <span>{v.name}</span>
                          {v.price && (
                            <span className={`text-[10px] font-mono opacity-80 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                              ({v.price})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Paint Shade Selector */}
              {hasShades && paintShades.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 space-y-2">
                  <PaintShadeSelector
                    product={product}
                    selectedShade={selectedShade}
                    onSelectShade={(shade) => setSelectedShade(shade)}
                  />
                </div>
              )}

              {/* ======================================================== */}
              {/* 5. QUANTITY & IN-PAGE PURCHASE ACTIONS                  */}
              {/* ======================================================== */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-800">
                    Select Quantity {qtyConfig.unitLabel ? `(${qtyConfig.unitLabel})` : ''}:
                  </div>
                  
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(qtyConfig.minQuantity || 1, quantity - (qtyConfig.quantityStep || 1)))}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer"
                      disabled={quantity <= (qtyConfig.minQuantity || 1)}
                      title="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3.5 py-1 text-sm font-black text-slate-900 min-w-[40px] text-center font-mono">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + (qtyConfig.quantityStep || 1))}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-700 hover:bg-slate-200 active:bg-slate-300 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons (Desktop and inline mobile) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="min-h-[46px] w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuy}
                    className="min-h-[46px] w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Buy Now</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="min-h-[46px] w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* ======================================================== */}
              {/* 6. LIVE DELIVERY ESTIMATOR & CHECKER                    */}
              {/* ======================================================== */}
              <div className="rounded-2xl border border-slate-200/90 overflow-hidden bg-white">
                <ProductDeliveryEstimator
                  product={product}
                  quantity={quantity}
                />
              </div>

            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* 7. PRODUCT DETAILS, SPECIFICATIONS & FEATURES TABS       */}
        {/* ======================================================== */}
        <div className="mt-6 sm:mt-8 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-4 sm:p-6 lg:p-8 space-y-5">
          
          {/* Section Heading & Mobile Tab Buttons */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-bold font-serif text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Product Specifications & Details</span>
            </h2>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'details'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'specs'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Specifications
              </button>
              {product.features && product.features.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('features')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'features'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Features
                </button>
              )}
            </div>
          </div>

          {/* Tab 1: Overview & Description */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {product.description ? (
                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 whitespace-pre-line">
                  {product.description}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-slate-500 italic">
                  Genuine {product.name} available at Zafar Sarwar Traders showroom in Chiniot, Pakistan.
                </p>
              )}

              {/* Showroom & Quality Guarantee Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900">Zafar Sarwar Traders Showroom Guarantee</div>
                  <div>Every item is quality checked and sourced directly from authorized factory distributors in Pakistan. For bulk contractor discounts or on-site inspections, visit our showroom on Sargodha Road, Chiniot.</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Technical Specifications Table */}
          {activeTab === 'specs' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                  <span className="font-bold text-slate-600">Product Name</span>
                  <span className="text-slate-900 font-semibold">{product.name}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="font-bold text-slate-600">Category</span>
                  <span className="text-slate-900">{product.category || 'Building Materials'}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                  <span className="font-bold text-slate-600">Brand</span>
                  <span className="text-slate-900">{brandName}</span>
                </div>
                {product.sku && (
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-bold text-slate-600">SKU / Model</span>
                    <span className="text-slate-900 font-mono">{product.sku}</span>
                  </div>
                )}
                {(product as any).material && (
                  <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                    <span className="font-bold text-slate-600">Material</span>
                    <span className="text-slate-900">{(product as any).material}</span>
                  </div>
                )}
                {(product as any).finish && (
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-bold text-slate-600">Surface Finish</span>
                    <span className="text-slate-900">{(product as any).finish}</span>
                  </div>
                )}
                {(product as any).size && (
                  <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                    <span className="font-bold text-slate-600">Dimensions / Size</span>
                    <span className="text-slate-900">{(product as any).size}</span>
                  </div>
                )}
                {(product as any).capacity && (
                  <div className="grid grid-cols-2 p-2.5">
                    <span className="font-bold text-slate-600">Capacity / Volume</span>
                    <span className="text-slate-900">{(product as any).capacity}</span>
                  </div>
                )}
                {product.specs && Object.entries(product.specs).map(([key, val], sIdx) => (
                  <div key={key} className={`grid grid-cols-2 p-2.5 ${sIdx % 2 === 0 ? 'bg-slate-50' : ''}`}>
                    <span className="font-bold text-slate-600">{key}</span>
                    <span className="text-slate-900">{val}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 p-2.5 bg-slate-50">
                  <span className="font-bold text-slate-600">Stock Availability</span>
                  <span className="text-emerald-700 font-bold">{product.stockStatus || 'In Stock'}</span>
                </div>
                <div className="grid grid-cols-2 p-2.5">
                  <span className="font-bold text-slate-600">Showroom Location</span>
                  <span className="text-slate-900">Chiniot, Punjab, Pakistan</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Features List */}
          {activeTab === 'features' && product.features && product.features.length > 0 && (
            <div className="space-y-3">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                    <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* 8. REAL DATABASE PRODUCT REVIEWS & RATINGS SECTION      */}
        {/* ======================================================== */}
        <div id="product-reviews-section" className="pt-6 sm:pt-8 scroll-mt-24">
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            productCategory={product.category}
            onNavigate={onNavigate}
          />
        </div>

        {/* ======================================================== */}
        {/* 9. RELATED PRODUCTS IN SAME CATEGORY                     */}
        {/* ======================================================== */}
        {relatedProducts.length > 0 && (
          <div className="pt-8 sm:pt-12 space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold font-serif text-slate-900">
                  Related in {product.category || 'Store'}
                </h2>
                <p className="text-xs text-slate-500">Popular matching items from our inventory</p>
              </div>
              <button
                type="button"
                onClick={() => categoryObj ? onNavigate(`/category/${getCategorySlug(categoryObj)}`) : onNavigate('/store')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View More</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-5">
              {relatedProducts.map((rel) => {
                const relPricing = getActiveProductPrice(rel);
                const relSlug = getProductSlug(rel);
                return (
                  <div
                    key={rel.id}
                    onClick={() => onNavigate(`/product/${relSlug}`)}
                    className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="relative h-32 sm:h-44 bg-slate-50 rounded-xl p-2 sm:p-3 flex items-center justify-center overflow-hidden">
                      <img
                        src={resolveProductImage(rel)}
                        alt={`${rel.name} - ${rel.category || 'Sanitaryware & Building Materials'} Chiniot`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, rel.category, rel.name)}
                        className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="pt-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-blue-600 uppercase truncate">{rel.category}</span>
                        <ProductCardRating productId={rel.id} />
                      </div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {rel.name}
                      </h3>
                      <div className="text-xs sm:text-sm font-black text-slate-900">
                        {relPricing.effectivePrice}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ======================================================== */}
      {/* 10. STICKY MOBILE BOTTOM PURCHASE ACTION BAR (AMAZON/SHOPIFY) */}
      {/* ======================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] px-3 py-2.5 backdrop-blur-md safe-area-bottom">
        <div className="max-w-md mx-auto flex items-center gap-2">
          
          {/* Quick WhatsApp Inquiry Button */}
          <button
            type="button"
            onClick={handleWhatsApp}
            className="min-h-[46px] min-w-[46px] rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0 transition-colors shadow-2xs active:scale-95 cursor-pointer"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Quick Add To Cart Button */}
          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 min-h-[46px] py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          {/* Quick Buy Now Button */}
          <button
            type="button"
            onClick={handleBuy}
            className="flex-1 min-h-[46px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Buy Now</span>
          </button>

        </div>
      </div>

    </div>
  );
};

