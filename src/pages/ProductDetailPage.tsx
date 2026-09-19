import React, { useState, useMemo, useEffect } from 'react';
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
  CheckCircle2
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
  buildProductWhatsAppOrderUrl
} from '../utils/pricingUtils';
import { getActivePaintShades, hasActivePaintShades } from '../utils/paintShadeUtils';
import { getProductSlug, getCategorySlug } from '../utils/slugUtils';
import { navigateBackFromProduct } from '../utils/navigationHistory';
import { normalizeProductImage, normalizeProductImages, handleImageError } from '../utils/imageUtils';
import { ProductReviewsSection } from '../components/ProductReviewsSection';

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
    return normalizeProductImages(product.images, product.image, product.category, product.name);
  }, [product]);

  // Resolved brand and category
  const categoryObj = categories.find(c => c.id === product.categoryId || c.name === product.category);
  const brandObj = brands.find(b => b.id === product.brandId || b.name === product.brand);
  const brandName = product.brand || brandObj?.name || 'Zafar Sarwar Traders Genuine';

  // Active pricing based on selected variant
  const activePricing = getActiveProductPrice(product, selectedVariant);

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

  // Safe Product JSON-LD structured data using existing real data ONLY (zero fake ratings/reviews)
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Schema.org Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* Toast */}
      {addedToast && (
        <div className="fixed top-24 right-6 z-50 px-4 py-3 bg-emerald-900/95 border border-emerald-500/50 text-white text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Added <strong>{product.name}</strong> to your Cart!</span>
        </div>
      )}

      {/* Top Sticky Navigation Bar with Back Button & Breadcrumbs */}
      <div className="bg-white/95 border-b border-slate-200/90 sticky top-[64px] sm:top-[70px] z-30 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {/* Primary Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 border border-slate-200/90 hover:border-blue-300 text-slate-700 hover:text-blue-600 font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 group active:scale-95"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
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

          <button
            type="button"
            onClick={() => onNavigate('/store')}
            className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors shrink-0 hidden md:inline-flex items-center gap-1 cursor-pointer"
          >
            <span>All Store Items</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        
        {/* Main Product Layout */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            
            {/* LEFT COLUMN: IMAGE GALLERY */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* Main Photo Canvas */}
              <div className="relative w-full h-80 sm:h-96 lg:h-[450px] bg-slate-50 rounded-2xl border border-slate-200/80 p-6 flex items-center justify-center overflow-hidden group">
                <img
                  src={normalizeProductImage(mediaImages[selectedImageIndex] || mediaImages[0], product.category, product.name)}
                  alt={`${product.name} - ${product.category || 'Sanitaryware & Building Materials'} | Zafar Sarwar Traders Chiniot`}
                  onError={(e) => handleImageError(e, product.category, product.name)}
                  className="max-h-full max-w-full object-contain filter drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                />

                {/* Sale Badge */}
                {activePricing.isOnSale && (
                  <div className="absolute top-4 left-4">
                    <ProductSaleBadge pricing={activePricing} size="md" />
                  </div>
                )}

                {/* Share Button */}
                <button
                  type="button"
                  onClick={handleShare}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/90 border border-slate-200 text-slate-600 hover:text-blue-600 transition-colors shadow-xs cursor-pointer"
                  title="Share product link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {copiedLink && (
                  <div className="absolute top-14 right-4 px-2.5 py-1 rounded bg-slate-900 text-white text-[10px] font-bold shadow-md">
                    Link Copied!
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {mediaImages.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                  {mediaImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl bg-slate-50 border p-1.5 shrink-0 overflow-hidden cursor-pointer transition-all ${
                        selectedImageIndex === idx
                          ? 'border-blue-600 ring-2 ring-blue-600/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={normalizeProductImage(img, product.category, product.name)}
                        alt={`${product.name} - ${product.category || 'Sanitaryware'} view ${idx + 1}`}
                        onError={(e) => handleImageError(e, product.category, product.name)}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900">100% Genuine</div>
                  <div className="text-[9px] text-slate-500">Authorized Stock</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <Truck className="w-5 h-5 text-emerald-600 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900">Safe Delivery</div>
                  <div className="text-[9px] text-slate-500">Across Pakistan</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <Award className="w-5 h-5 text-amber-600 mx-auto" />
                  <div className="text-[11px] font-bold text-slate-900">Factory Warranty</div>
                  <div className="text-[9px] text-slate-500">Standard Guarantee</div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: PRODUCT DETAILS & ACTIONS */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Category & Brand Header */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider">
                  <span 
                    className="text-blue-600 hover:underline cursor-pointer"
                    onClick={() => categoryObj && onNavigate(`/category/${getCategorySlug(categoryObj)}`)}
                  >
                    {product.category}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-700">{brandName}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

                {product.sku && (
                  <div className="text-xs font-mono text-slate-400">
                    SKU: {product.sku}
                  </div>
                )}
              </div>

              {/* Pricing Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  {activePricing.isOnSale ? (
                    <div className="flex items-baseline gap-3">
                      <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                        {activePricing.effectivePrice}
                      </span>
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        {activePricing.originalPrice}
                      </span>
                      {activePricing.discountPercent && (
                        <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">
                          Save {activePricing.discountPercent}%
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {activePricing.effectivePrice || 'Contact Showroom for Price'}
                    </span>
                  )}
                  <div className="text-[11px] text-slate-500 font-medium mt-1">
                    Inclusive of taxes • Delivery calculated at checkout
                  </div>
                </div>

                {product.stockStatus && (
                  <div className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {product.stockStatus}
                  </div>
                )}
              </div>

              {/* Short Description */}
              {product.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Variant Selector (if enabled) */}
              {hasVariants && variants.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Select {product.variantsConfig?.optionName || 'Option'}: {selectedVariant?.name}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => {
                      const isSelected = selectedVariant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariant(v)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {v.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Paint Shade Selector (if enabled) */}
              {hasShades && paintShades.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <PaintShadeSelector
                    product={product}
                    selectedShade={selectedShade}
                    onSelectShade={(shade) => setSelectedShade(shade)}
                  />
                </div>
              )}

              {/* Quantity Stepper & Add to Cart Row */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-slate-700">Quantity:</div>
                  <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(qtyConfig.minQuantity || 1, quantity - (qtyConfig.quantityStep || 1)))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 transition-colors"
                      disabled={quantity <= (qtyConfig.minQuantity || 1)}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 py-1 text-sm font-bold text-slate-900 min-w-[36px] text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + (qtyConfig.quantityStep || 1))}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {qtyConfig.unitLabel && (
                    <span className="text-xs text-slate-500 font-medium">{qtyConfig.unitLabel}</span>
                  )}
                </div>

                {/* Primary Buttons: Add to Cart, Buy Now, WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleBuy}
                    className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white text-xs sm:text-sm font-bold transition-all cursor-pointer"
                  >
                    Buy Now
                  </button>

                  <button
                    type="button"
                    onClick={handleWhatsApp}
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Live Delivery Estimator */}
              <div className="pt-3 border-t border-slate-100">
                <ProductDeliveryEstimator
                  product={product}
                  quantity={quantity}
                />
              </div>

              {/* Key Features / Specifications */}
              {product.features && product.features.length > 0 && (
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Key Features & Technical Specifications
                  </div>
                  <ul className="space-y-1.5">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* REAL DATABASE PRODUCT REVIEWS & RATINGS SECTION */}
        <div className="pt-8">
          <ProductReviewsSection
            productId={product.id}
            productName={product.name}
            productCategory={product.category}
            onNavigate={onNavigate}
          />
        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-serif text-slate-900">
                  Related Products in {product.category}
                </h2>
                <p className="text-xs text-slate-500">You may also be interested in these items</p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {relatedProducts.map((rel) => {
                const relPricing = getActiveProductPrice(rel);
                const relSlug = getProductSlug(rel);
                return (
                  <div
                    key={rel.id}
                    onClick={() => onNavigate(`/product/${relSlug}`)}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="relative h-44 bg-slate-50 rounded-xl p-3 flex items-center justify-center overflow-hidden">
                      <img
                        src={normalizeProductImage(rel.image || rel.images?.[0], rel.category, rel.name)}
                        alt={`${rel.name} - ${rel.category || 'Sanitaryware & Building Materials'} Chiniot`}
                        onError={(e) => handleImageError(e, rel.category, rel.name)}
                        className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="pt-3 space-y-1.5">
                      <div className="text-[10px] font-bold text-blue-600 uppercase">{rel.category}</div>
                      <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                        {rel.name}
                      </h3>
                      <div className="text-sm font-black text-slate-900">
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
    </div>
  );
};
