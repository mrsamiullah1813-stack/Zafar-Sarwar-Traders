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
  ChevronLeft, 
  ChevronDown,
  Sparkles, 
  Maximize2, 
  X, 
  Shield, 
  Zap, 
  CheckCircle,
  FileText,
  Sliders,
  RotateCcw
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

// Color Hex map helper for visual swatches while always respecting exact color name
function getKnownColorHex(colorName: string): string | null {
  const c = colorName.trim().toLowerCase();
  const map: Record<string, string> = {
    'black': '#111827',
    'matte black': '#1e293b',
    'jet black': '#0a0a0a',
    'white': '#ffffff',
    'off white': '#f8fafc',
    'ivory': '#fffff0',
    'grey': '#6b7280',
    'gray': '#6b7280',
    'charcoal': '#374151',
    'charcoal gray': '#374151',
    'charcoal grey': '#374151',
    'light grey': '#d1d5db',
    'silver': '#e2e8f0',
    'chrome': '#cbd5e1',
    'gold': '#d97706',
    'rose gold': '#f43f5e',
    'bronze': '#92400e',
    'brass': '#b45309',
    'blue': '#2563eb',
    'navy': '#1e3a8a',
    'navy blue': '#1e3a8a',
    'royal blue': '#1d4ed8',
    'sky blue': '#38bdf8',
    'green': '#16a34a',
    'emerald': '#059669',
    'olive': '#556b2f',
    'red': '#dc2626',
    'maroon': '#800000',
    'brown': '#78350f',
    'beige': '#f5f5dc',
    'cream': '#fffdd0',
    'tan': '#d2b48c',
    'wood': '#854d0e',
    'oak': '#a16207',
    'walnut': '#451a03',
    'yellow': '#eab308',
    'orange': '#ea580c',
    'pink': '#ec4899',
    'purple': '#9333ea'
  };

  return map[c] || null;
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
  // Existing product colors extraction (STRICT: ONLY if colors already exist in product data)
  const productColors = useMemo<string[]>(() => {
    const list: string[] = [];
    if (Array.isArray(product.availableColors) && product.availableColors.length > 0) {
      product.availableColors.forEach(c => {
        if (typeof c === 'string' && c.trim() && !list.includes(c.trim())) {
          list.push(c.trim());
        }
      });
    } else if (Array.isArray((product as any).colors) && (product as any).colors.length > 0) {
      (product as any).colors.forEach((c: any) => {
        if (typeof c === 'string' && c.trim() && !list.includes(c.trim())) {
          list.push(c.trim());
        }
      });
    }
    return list;
  }, [product]);

  const hasColors = productColors.length > 0;
  const [selectedColor, setSelectedColor] = useState<string>(() => (hasColors ? productColors[0] : ''));

  // Variants & Shades
  const variants = getActiveVariants(product);
  const hasVariants = hasActiveVariants(product);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(() => {
    return variants.find(v => v.isDefault) || variants[0];
  });

  const paintShades = getActivePaintShades(product);
  const hasShades = hasActivePaintShades(product);
  const [selectedShade, setSelectedShade] = useState<PaintShade | undefined>(() => {
    return paintShades.find(s => s.isActive) || paintShades[0];
  });

  // Gallery state
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'features' | 'shipping'>('details');

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
    const availVariants = getActiveVariants(product);
    setSelectedVariant(availVariants.find(v => v.isDefault) || availVariants[0]);
    const availShades = getActivePaintShades(product);
    setSelectedShade(availShades.find(s => s.isActive) || availShades[0]);
    setSelectedColor(hasColors ? productColors[0] : '');
    setQuantity(qtyConfig.defaultQuantity || 1);
  }, [product.id, hasColors, productColors]);

  // Normalize all existing images for this product (NO fake images generated)
  const mediaImages = useMemo(() => {
    const imgs = normalizeProductImages(product.images, product.image, product.category, product.name);
    return imgs.length > 0 ? imgs : [resolveProductImage(product)];
  }, [product]);

  // Brand & Category resolution
  const categoryObj = categories.find(c => c.id === product.categoryId || c.name === product.category);
  const brandObj = brands.find(b => b.id === product.brandId || b.name === product.brand);
  const brandName = product.brand || brandObj?.name || 'Zafar Sarwar Traders Genuine';

  // Active pricing calculation
  const activePricing = getActiveProductPrice(product, selectedVariant);

  // Savings amount calculation
  const savingsAmount = useMemo(() => {
    if (!activePricing.isOnSale) return null;
    const orig = parseNumericPrice(activePricing.originalPrice);
    const eff = parseNumericPrice(activePricing.effectivePrice);
    if (orig > eff) {
      return formatPakistaniPrice(orig - eff);
    }
    return null;
  }, [activePricing]);

  // Total price display for selected quantity
  const totalPriceDisplay = useMemo(() => {
    const eff = parseNumericPrice(activePricing.effectivePrice);
    if (eff > 0 && quantity > 1) {
      return formatPakistaniPrice(eff * quantity);
    }
    return null;
  }, [activePricing.effectivePrice, quantity]);

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
      hasColors ? selectedColor : undefined,
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
      hasColors ? selectedColor : undefined,
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
    } catch {}
  };

  const handleScrollToReviews = () => {
    const el = document.getElementById('product-reviews-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Touch handlers for mobile gallery swipe
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
      setSelectedImageIndex((prev) => (prev + 1 < mediaImages.length ? prev + 1 : 0));
    } else if (distance < -45) {
      setSelectedImageIndex((prev) => (prev - 1 >= 0 ? prev - 1 : mediaImages.length - 1));
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Product description summary snippet
  const descriptionSnippet = useMemo(() => {
    if (product.shortDescription && product.shortDescription.trim()) {
      return product.shortDescription.trim();
    }
    if (product.description && product.description.trim()) {
      const firstParagraph = product.description.split('\n')[0].trim();
      if (firstParagraph.length > 220) {
        return firstParagraph.slice(0, 217) + '...';
      }
      return firstParagraph;
    }
    return null;
  }, [product]);

  // Schema.org structured data using real product fields
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 sm:pb-32 md:pb-24">
      
      {/* Schema.org Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Floating Added To Cart Toast */}
      {addedToast && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0 z-50 px-4 py-3 bg-slate-900 text-white text-xs font-semibold rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 max-w-[90vw] border border-slate-700">
          <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-white stroke-[3]" />
          </div>
          <span className="truncate">Added <strong>{product.name}</strong> to Cart</span>
        </div>
      )}

      {/* Top Header / Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200/80 sticky top-[56px] sm:top-[64px] z-30 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 font-semibold text-xs transition-colors cursor-pointer shrink-0 active:scale-95"
              title="Go back"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back</span>
            </button>

            <div className="h-4 w-px bg-slate-200 shrink-0 hidden sm:block" />

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
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Share product link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
            {copiedLink && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                Link Copied!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* ======================================================== */}
        {/* TOP / PRODUCT AREA                                       */}
        {/* ======================================================== */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-6 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* ---------------------------------------------------- */}
            {/* LEFT SIDE: PRODUCT IMAGE GALLERY                     */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Gallery Wrapper: Vertical Rail on Desktop + Main Large Image Canvas */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 items-start">
                
                {/* Vertical Thumbnails Sidebar (Desktop) / Horizontal Row (Mobile) */}
                {mediaImages.length > 1 && (
                  <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[500px] w-full sm:w-20 lg:w-24 shrink-0 pb-1 sm:pb-0 no-scrollbar">
                    {mediaImages.map((img, idx) => {
                      const isSelected = selectedImageIndex === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative aspect-square w-16 sm:w-full rounded-xl bg-slate-50 border p-1.5 shrink-0 overflow-hidden cursor-pointer transition-all ${
                            isSelected
                              ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-xs opacity-100'
                              : 'border-slate-200 hover:border-slate-400 opacity-60 hover:opacity-100'
                          }`}
                          title={`View image ${idx + 1}`}
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
                      );
                    })}
                  </div>
                )}

                {/* Primary Large Display Canvas */}
                <div 
                  className="relative flex-1 w-full min-h-[340px] sm:min-h-[440px] lg:min-h-[520px] max-h-[560px] bg-[#fbfbfb] rounded-2xl border border-slate-200/90 p-4 sm:p-8 flex items-center justify-center overflow-hidden group select-none touch-pan-y"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <img
                    src={normalizeProductImage(mediaImages[selectedImageIndex] || mediaImages[0], product.category, product.name)}
                    alt={`${product.name} - ${product.category || 'Sanitaryware & Building Materials'} | Zafar Sarwar Traders`}
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
                    className="max-h-[460px] max-w-full object-contain filter drop-shadow-sm transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                    onClick={() => setIsZoomModalOpen(true)}
                  />

                  {/* Top Left Sale / Discount Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                    {activePricing.isOnSale && (
                      <ProductSaleBadge pricing={activePricing} size="md" />
                    )}
                    {product.badge && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
                        {product.badge}
                      </span>
                    )}
                  </div>

                  {/* Top Right Image Counter (Mobile & Multi-image) */}
                  {mediaImages.length > 1 && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-semibold tracking-wider z-10">
                      {selectedImageIndex + 1} / {mediaImages.length}
                    </div>
                  )}

                  {/* Desktop Hover Nav Arrows */}
                  {mediaImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev - 1 >= 0 ? prev - 1 : mediaImages.length - 1));
                        }}
                        className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-slate-200 text-slate-800 items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Previous photo"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageIndex((prev) => (prev + 1 < mediaImages.length ? prev + 1 : 0));
                        }}
                        className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-slate-200 text-slate-800 items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Next photo"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Bottom Right Zoom / Lightbox Trigger Button (Inspired by Reference) */}
                  <button
                    type="button"
                    onClick={() => setIsZoomModalOpen(true)}
                    className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-white/95 hover:bg-white border border-slate-200 text-slate-800 flex items-center justify-center shadow-md transition-all hover:scale-105 cursor-pointer z-10"
                    title="Zoom in full view"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

              </div>

              {/* Mobile Dot Indicators */}
              {mediaImages.length > 1 && (
                <div className="flex sm:hidden items-center justify-center gap-1.5 pt-1">
                  {mediaImages.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        selectedImageIndex === idx ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-300'
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* Verified Trust Badges Footer Bar */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 mb-1" />
                  <div className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">100% Genuine</div>
                  <div className="text-[9px] text-slate-500">Verified Stock</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center">
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 mb-1" />
                  <div className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">Safe Delivery</div>
                  <div className="text-[9px] text-slate-500">All Pakistan</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 flex flex-col items-center justify-center">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800 mb-1" />
                  <div className="text-[10px] sm:text-xs font-bold text-slate-900 leading-tight">Showroom Quality</div>
                  <div className="text-[9px] text-slate-500">Authorized Stock</div>
                </div>
              </div>

            </div>

            {/* ---------------------------------------------------- */}
            {/* RIGHT SIDE: PRODUCT INFORMATION & ACTIONS            */}
            {/* ---------------------------------------------------- */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* Category, Brand & Stock Availability Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span 
                      className="text-slate-900 font-bold hover:underline cursor-pointer"
                      onClick={() => categoryObj && onNavigate(`/category/${getCategorySlug(categoryObj)}`)}
                    >
                      {product.category || 'Store'}
                    </span>
                    <span>•</span>
                    <span className="text-slate-700">{brandName}</span>
                  </div>

                  {product.stockStatus && (
                    <div className="text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{product.stockStatus}</span>
                    </div>
                  )}
                </div>

                {/* Main Product Title */}
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {product.name}
                </h1>

                {/* Rating Stars & Reviews Link */}
                <div className="flex items-center flex-wrap gap-2.5 pt-0.5">
                  <button 
                    type="button"
                    onClick={handleScrollToReviews}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
                    title="View customer ratings and reviews"
                  >
                    <ProductCardRating productId={product.id} starClassName="w-4 h-4" />
                    <span className="text-xs font-medium text-slate-500 hover:text-slate-900 underline">
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

              {/* Price & Savings Display */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-1.5">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {activePricing.effectivePrice || 'Contact Showroom'}
                    </span>
                    {activePricing.isOnSale && (
                      <>
                        <span className="text-sm sm:text-base font-medium text-slate-400 line-through">
                          {activePricing.originalPrice}
                        </span>
                        {activePricing.discountPercent && (
                          <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-black uppercase tracking-wider">
                            Save {activePricing.discountPercent}%
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {totalPriceDisplay && (
                    <div className="text-right bg-white px-3 py-1 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total ({quantity} {qtyConfig.unitLabel || 'items'})</span>
                      <span className="text-xs font-black text-slate-900">{totalPriceDisplay}</span>
                    </div>
                  )}
                </div>

                {savingsAmount && (
                  <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>You save {savingsAmount} on this item</span>
                  </div>
                )}

                <div className="text-[11px] text-slate-500 font-normal pt-0.5">
                  Tax included. Delivery fee calculated below based on destination city.
                </div>
              </div>

              {/* Short Product Description Snippet */}
              {descriptionSnippet && (
                <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {descriptionSnippet}
                </div>
              )}

              {/* ======================================================== */}
              {/* COLOR SECTION — STRICT CONDITIONAL RENDERING             */}
              {/* If product has existing colors → Show ONLY those colors  */}
              {/* If product has NO colors → COMPLETELY HIDE THE SECTION   */}
              {/* ======================================================== */}
              {hasColors && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      Color: <span className="font-normal text-slate-600 ml-1">{selectedColor || productColors[0]}</span>
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {productColors.map((colorName) => {
                      const isSelected = selectedColor === colorName;
                      const hex = getKnownColorHex(colorName);

                      return (
                        <button
                          key={colorName}
                          type="button"
                          onClick={() => setSelectedColor(colorName)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                          title={`Select ${colorName}`}
                        >
                          {hex && (
                            <span 
                              className={`w-3.5 h-3.5 rounded-full border shrink-0 ${
                                isSelected ? 'border-white/60' : 'border-slate-300'
                              }`} 
                              style={{ backgroundColor: hex }} 
                            />
                          )}
                          <span>{colorName}</span>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Product Variants Selector (Options / Sizes) */}
              {hasVariants && variants.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">
                      {product.variantsConfig?.optionName || 'Option / Size'}:{' '}
                      <span className="font-normal text-slate-600 ml-1">{selectedVariant?.name}</span>
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
                          className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border active:scale-95 ${
                            isSelected
                              ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          <span>{v.name}</span>
                          {v.price && (
                            <span className={`text-[10px] font-mono opacity-80 ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>
                              ({v.price})
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Paint Shade Selector for paint products */}
              {hasShades && paintShades.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <PaintShadeSelector
                    product={product}
                    selectedShade={selectedShade}
                    onSelectShade={(shade) => setSelectedShade(shade)}
                  />
                </div>
              )}

              {/* Quantity Selector & Action Buttons */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-slate-800">
                    Quantity {qtyConfig.unitLabel ? `(${qtyConfig.unitLabel})` : ''}:
                  </div>
                  
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(qtyConfig.minQuantity || 1, quantity - (qtyConfig.quantityStep || 1)))}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
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
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-700 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
                      title="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary Action Buttons: Add to Cart (Black) + Buy Now + WhatsApp */}
                <div className="space-y-2 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={handleAdd}
                      className="min-h-[48px] w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs sm:text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleBuy}
                      className="min-h-[48px] w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Buy Now</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="min-h-[44px] w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire via WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Delivery Information Section */}
              <div className="pt-2">
                <ProductDeliveryEstimator
                  product={product}
                  quantity={quantity}
                />
              </div>

            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* TABBED INFORMATION SECTION (Description, Specs, Features) */}
        {/* ======================================================== */}
        <div className="mt-8 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-4 sm:p-6 lg:p-8 space-y-6">
          
          {/* Tabs Navigation Header */}
          <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'details'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Description & Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'specs'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Specifications & Material
            </button>
            {product.features && product.features.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('features')}
                className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  activeTab === 'features'
                    ? 'border-slate-900 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Features & Highlights
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`pb-3 px-3 text-xs sm:text-sm font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'shipping'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Shipping & Showroom
            </button>
          </div>

          {/* Tab Content: Details & Full Description */}
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

              {/* Showroom Verification Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <Shield className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-bold text-slate-900">Showroom Verification & Guarantee</div>
                  <div>Every item is verified and sourced directly from authorized manufacturers in Pakistan. For bulk orders, plumbing contractors, or on-site inspections, visit our showroom on Sargodha Road, Chiniot.</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Specifications & Technical Details */}
          {activeTab === 'specs' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 text-xs">
                <div className="grid grid-cols-2 p-3 bg-slate-50">
                  <span className="font-bold text-slate-600">Product Name</span>
                  <span className="text-slate-900 font-semibold">{product.name}</span>
                </div>
                <div className="grid grid-cols-2 p-3">
                  <span className="font-bold text-slate-600">Category</span>
                  <span className="text-slate-900">{product.category || 'Building Materials'}</span>
                </div>
                <div className="grid grid-cols-2 p-3 bg-slate-50">
                  <span className="font-bold text-slate-600">Brand</span>
                  <span className="text-slate-900">{brandName}</span>
                </div>
                {product.sku && (
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-600">SKU / Model</span>
                    <span className="text-slate-900 font-mono">{product.sku}</span>
                  </div>
                )}
                {(product as any).material && (
                  <div className="grid grid-cols-2 p-3 bg-slate-50">
                    <span className="font-bold text-slate-600">Material</span>
                    <span className="text-slate-900">{(product as any).material}</span>
                  </div>
                )}
                {(product as any).finish && (
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-600">Surface Finish</span>
                    <span className="text-slate-900">{(product as any).finish}</span>
                  </div>
                )}
                {(product as any).size && (
                  <div className="grid grid-cols-2 p-3 bg-slate-50">
                    <span className="font-bold text-slate-600">Dimensions / Size</span>
                    <span className="text-slate-900">{(product as any).size}</span>
                  </div>
                )}
                {(product as any).capacity && (
                  <div className="grid grid-cols-2 p-3">
                    <span className="font-bold text-slate-600">Capacity / Volume</span>
                    <span className="text-slate-900">{(product as any).capacity}</span>
                  </div>
                )}
                {product.specs && Object.entries(product.specs).map(([key, val], sIdx) => (
                  <div key={key} className={`grid grid-cols-2 p-3 ${sIdx % 2 === 0 ? 'bg-slate-50' : ''}`}>
                    <span className="font-bold text-slate-600">{key}</span>
                    <span className="text-slate-900">{val}</span>
                  </div>
                ))}
                <div className="grid grid-cols-2 p-3 bg-slate-50">
                  <span className="font-bold text-slate-600">Stock Availability</span>
                  <span className="text-emerald-700 font-bold">{product.stockStatus || 'In Stock'}</span>
                </div>
                <div className="grid grid-cols-2 p-3">
                  <span className="font-bold text-slate-600">Showroom Location</span>
                  <span className="text-slate-900">Chiniot, Punjab, Pakistan</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Features & Highlights */}
          {activeTab === 'features' && product.features && product.features.length > 0 && (
            <div className="space-y-3">
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed font-medium">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tab Content: Shipping & Returns Info */}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-slate-700" />
                    <span>Nationwide Delivery</span>
                  </div>
                  <p className="text-slate-600">
                    We deliver across Pakistan including Lahore, Faisalabad, Chiniot, Islamabad, Karachi, Rawalpindi, and all major cities and towns.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-slate-700" />
                    <span>Showroom Support & Replacement</span>
                  </div>
                  <p className="text-slate-600">
                    Items damaged in transit or manufacturing defects are covered with instant verification and direct replacement assistance.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* CUSTOMER REVIEWS & RATINGS SECTION (Real Database)       */}
        {/* ======================================================== */}
        <div id="product-reviews-section" className="pt-8 scroll-mt-24">
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            productCategory={product.category}
            onNavigate={onNavigate}
          />
        </div>

        {/* ======================================================== */}
        {/* RELATED PRODUCTS IN SAME CATEGORY                         */}
        {/* ======================================================== */}
        {relatedProducts.length > 0 && (
          <div className="pt-10 sm:pt-14 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                  Related in {product.category || 'Store'}
                </h2>
                <p className="text-xs text-slate-500">Popular matching items from our inventory</p>
              </div>
              <button
                type="button"
                onClick={() => categoryObj ? onNavigate(`/category/${getCategorySlug(categoryObj)}`) : onNavigate('/store')}
                className="text-xs font-bold text-slate-900 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
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
                    className="bg-white rounded-2xl border border-slate-200/90 p-3 sm:p-4 shadow-2xs hover:shadow-md hover:border-slate-400 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="relative h-36 sm:h-48 bg-[#fbfbfb] rounded-xl p-2 sm:p-3 flex items-center justify-center overflow-hidden">
                      <img
                        src={resolveProductImage(rel)}
                        alt={`${rel.name} - ${rel.category || 'Sanitaryware & Building Materials'}`}
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                        onError={(e) => handleImageError(e, rel.category, rel.name)}
                        className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="pt-2.5 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase truncate">{rel.category}</span>
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
      {/* FULLSCREEN IMAGE LIGHTBOX / ZOOM MODAL                   */}
      {/* ======================================================== */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header */}
            <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{product.name}</span>
                {mediaImages.length > 1 && (
                  <span className="text-[11px] text-slate-500 font-mono">({selectedImageIndex + 1} / {mediaImages.length})</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Image */}
            <div className="flex-1 p-4 sm:p-8 flex items-center justify-center bg-[#fafafa] overflow-hidden min-h-[300px]">
              <img
                src={normalizeProductImage(mediaImages[selectedImageIndex] || mediaImages[0], product.category, product.name)}
                alt={product.name}
                referrerPolicy="no-referrer"
                className="max-h-[70vh] max-w-full object-contain filter drop-shadow-md"
              />
            </div>

            {/* Modal Thumbnails (if multiple) */}
            {mediaImages.length > 1 && (
              <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-center gap-2 overflow-x-auto no-scrollbar">
                {mediaImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-12 h-12 rounded-lg bg-slate-50 border p-1 overflow-hidden cursor-pointer ${
                      selectedImageIndex === idx ? 'border-slate-900 ring-2 ring-slate-900/20' : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={normalizeProductImage(img, product.category, product.name)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STICKY MOBILE BOTTOM BAR                                 */}
      {/* ======================================================== */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/98 border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-3 py-2.5 backdrop-blur-md safe-area-bottom">
        <div className="max-w-md mx-auto flex items-center gap-2">
          
          <button
            type="button"
            onClick={handleWhatsApp}
            className="min-h-[46px] min-w-[46px] rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0 transition-colors shadow-2xs active:scale-95 cursor-pointer"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </button>

          <button
            type="button"
            onClick={handleAdd}
            className="flex-1 min-h-[46px] py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            onClick={handleBuy}
            className="flex-1 min-h-[46px] py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Buy Now</span>
          </button>

        </div>
      </div>

    </div>
  );
};
