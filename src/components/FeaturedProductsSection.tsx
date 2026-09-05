import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  Eye, 
  Check, 
  Video, 
  Edit, 
  Plus, 
  Trash2,
  Heart,
  Scale,
  ShoppingBag,
  Star,
  Flame,
  Percent,
  Timer,
  Boxes,
  Zap
} from 'lucide-react';
import { Product, BusinessConfig, ProductCategory } from '../types';
import { ProductSaleBadge } from './ProductSaleBadge';
import { SaleCountdownTimer } from './SaleCountdownTimer';
import { getProductPricingDetails, getProductVariantDisplaySummary, hasActiveVariants, getActiveProductPrice, buildProductWhatsAppOrderUrl } from '../utils/pricingUtils';

interface FeaturedProductsProps {
  products: Product[];
  categories?: ProductCategory[];
  config: BusinessConfig;
  isAdmin?: boolean;
  wishlistIds?: string[];
  compareIds?: string[];
  onQuickView: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onBuyNow?: (product: Product) => void;
  onToggleWishlist?: (productId: string) => void;
  onToggleCompare?: (productId: string) => void;
  onAddProduct?: () => void;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  selectedCategoryFilter?: string;
}

export const FeaturedProductsSection: React.FC<FeaturedProductsProps> = ({
  products,
  categories = [],
  config,
  isAdmin = false,
  wishlistIds = [],
  compareIds = [],
  onQuickView,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  onToggleCompare,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  selectedCategoryFilter
}) => {
  const [filter, setFilter] = useState<string>(selectedCategoryFilter || 'all');

  useEffect(() => {
    if (selectedCategoryFilter) {
      setFilter(selectedCategoryFilter);
    }
  }, [selectedCategoryFilter]);

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const activeFilter = filter || 'all';

  // Build lookup helpers for robust category resolution
  const matchedCategoryObj = safeCategories.find(c => 
    c && (
      c.id === activeFilter ||
      c.slug === activeFilter ||
      (c.name && c.name.toLowerCase() === activeFilter.toLowerCase()) ||
      (c.slug && activeFilter.toLowerCase() === c.slug.toLowerCase())
    )
  );

  const matchedFilterValues = new Set<string>();
  if (activeFilter !== 'all' && activeFilter !== 'featured') {
    matchedFilterValues.add(activeFilter.toLowerCase());
  }
  if (matchedCategoryObj) {
    if (matchedCategoryObj.id) matchedFilterValues.add(matchedCategoryObj.id.toLowerCase());
    if (matchedCategoryObj.slug) matchedFilterValues.add(matchedCategoryObj.slug.toLowerCase());
    if (matchedCategoryObj.name) matchedFilterValues.add(matchedCategoryObj.name.toLowerCase());
  }

  const filteredProducts = safeProducts.filter((p) => {
    if (!p) return false;
    if (activeFilter === 'all') return true;
    if (activeFilter === 'featured') return p.isFeatured;

    const pCatId = (p.categoryId || '').toLowerCase();
    const pCatName = (p.category || '').toLowerCase();
    const filterLower = activeFilter.toLowerCase();

    // Check direct Set match
    if (matchedFilterValues.has(pCatId) || matchedFilterValues.has(pCatName)) {
      return true;
    }

    // Check if category name matches
    if (matchedCategoryObj) {
      if (pCatName === matchedCategoryObj.name.toLowerCase() || pCatId === matchedCategoryObj.id.toLowerCase()) {
        return true;
      }
      if (matchedCategoryObj.slug && (pCatId === matchedCategoryObj.slug.toLowerCase() || pCatName === matchedCategoryObj.slug.toLowerCase())) {
        return true;
      }
    }

    // Partial substring fallback
    return (
      pCatId === filterLower ||
      pCatName === filterLower ||
      (pCatId && pCatId.includes(filterLower)) ||
      (filterLower.length >= 3 && pCatName.includes(filterLower))
    );
  });

  useEffect(() => {
    console.log(`[UI Diagnostics] FeaturedProductsSection: received ${safeCategories.length} categories, rendering ${safeCategories.filter(c => c && c.showOnHomepage !== false).length} category filter pills`);
  }, [safeCategories.length]);

  const rawWhatsApp = config?.whatsapp || config?.phone || '923108002863';
  const targetWhatsAppNumber = rawWhatsApp.replace(/[^0-9]/g, '');

  const handleWhatsAppProduct = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    const result = buildProductWhatsAppOrderUrl({
      businessName: config?.name || 'Zafar Sarwar Traders',
      whatsappNumber: targetWhatsAppNumber,
      product,
      quantity: 1
    });
    window.open(result.url, '_blank');
  };

  return (
    <section id="products" className="py-20 bg-white relative overflow-hidden border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Flagship Showroom Collection</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
              Best Selling Sanitaryware & Materials
            </h2>
            <p className="mt-2 text-slate-600 text-xs sm:text-sm max-w-xl font-normal">
              Explore products from Master, Dura Max, Faisal, and Nippon Paints. Instant online checkout or add to cart.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && onAddProduct && (
              <button
                onClick={onAddProduct}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            )}

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 no-scrollbar max-w-xl">
              <button
                onClick={() => setFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  filter === 'all'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Products
              </button>
              {safeCategories.filter(c => c && c.showOnHomepage !== false).map((cat) => {
                const isCatActive = 
                  filter === cat.id || 
                  filter === cat.slug || 
                  filter.toLowerCase() === (cat.name || '').toLowerCase();
                return (
                  <button
                    key={cat.id}
                    onClick={() => setFilter(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      isCatActive
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Filter Notification Bar */}
        {activeFilter !== 'all' && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs">
            <div className="flex items-center gap-2 text-blue-900 font-medium">
              <span className="font-bold">Showing category:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-blue-600 text-white font-bold">
                {matchedCategoryObj ? matchedCategoryObj.name : activeFilter}
              </span>
              <span className="text-blue-600">({filteredProducts.length} items found)</span>
            </div>
            <button
              onClick={() => setFilter('all')}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
            >
              Reset to All Products
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 border border-dashed border-slate-300">
            <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No products found in this category</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
              We are constantly updating our live showroom inventory. Contact our team directly on WhatsApp for live stock checks or view all available items.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setFilter('all')}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-md"
              >
                View All Showroom Products
              </button>
              <button
                onClick={(e) => {
                  const targetWhatsApp = (config?.whatsapp || config?.phone || '923108002863').replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${targetWhatsApp}?text=${encodeURIComponent(`Hello ${config?.name || 'Zafar Sarwar Traders'}, I am looking for specific products in category: ` + (matchedCategoryObj ? matchedCategoryObj.name : activeFilter))}`, '_blank');
                }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all shadow-md flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ask on WhatsApp</span>
              </button>
            </div>
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, idx) => {
              const isWishlisted = wishlistIds.includes(product.id);
              const isCompared = compareIds.includes(product.id);
              const pricing = getProductPricingDetails(product);
              const isVariantEnabled = hasActiveVariants(product);
              const variantSummary = isVariantEnabled ? getProductVariantDisplaySummary(product) : null;

              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.02 }}
                  onClick={() => onQuickView(product)}
                  className="group bg-white rounded-2xl border border-slate-200/85 shadow-sm hover:shadow-xl hover:border-blue-500/60 hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden relative"
                >
                  
                  {/* Image Box */}
                  <div className="relative h-60 w-full bg-gradient-to-b from-slate-50 to-slate-100/60 overflow-hidden flex items-center justify-center p-3">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'}
                      alt={`${product.name} - Luxury Sanitaryware & Bathroom Fittings Pakistan | Zafar Sarwar Traders`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('unsplash.com/photo-1584622650111')) {
                          target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80';
                        }
                      }}
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 items-start">
                      {/* Product Sale Badge if Sale is Active */}
                      <ProductSaleBadge product={product} />

                      {/* Variant Badge if active */}
                      {isVariantEnabled && variantSummary && variantSummary.variantCount > 1 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-sm text-white font-bold text-[10px] shadow-sm flex items-center gap-1">
                          <Boxes className="w-3 h-3 text-cyan-400" />
                          <span>{variantSummary.variantCount} {product.optionName || 'Sizes'}</span>
                        </span>
                      )}

                      {product.isNew && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[10px] shadow-sm">
                          NEW
                        </span>
                      )}
                      {product.isBestSeller && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black text-[10px] shadow-sm">
                          BESTSELLER
                        </span>
                      )}
                      {product.badge && !product.isNew && !product.isBestSeller && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-bold text-[10px] shadow-sm">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    {/* Wishlist & Compare Quick Floating Buttons */}
                    <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                      {onToggleWishlist && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(product.id);
                          }}
                          className={`p-2 rounded-xl border backdrop-blur-md transition-colors ${
                            isWishlisted 
                              ? 'bg-rose-500 text-white border-rose-400' 
                              : 'bg-white/95 text-slate-600 border-slate-200/90 hover:text-rose-600 hover:bg-white shadow-sm'
                          }`}
                          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        >
                          <Heart className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}

                      {onToggleCompare && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleCompare(product.id);
                          }}
                          className={`p-2 rounded-xl border backdrop-blur-md transition-colors ${
                            isCompared 
                              ? 'bg-amber-500 text-slate-950 border-amber-400' 
                              : 'bg-white/95 text-slate-600 border-slate-200/90 hover:text-amber-600 hover:bg-white shadow-sm'
                          }`}
                          title={isCompared ? 'Remove from Compare' : 'Add to Compare'}
                        >
                          <Scale className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Admin Edit / Delete Floating Buttons */}
                    {isAdmin && onEditProduct && (
                      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditProduct(product);
                          }}
                          className="p-1.5 rounded-lg bg-blue-600 text-white shadow hover:bg-blue-500 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        {onDeleteProduct && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Are you sure you want to delete this product?')) onDeleteProduct(product.id);
                            }}
                            className="p-1.5 rounded-lg bg-rose-600 text-white shadow hover:bg-rose-500 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Body Info */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
                        <span className="truncate max-w-[140px]">{product.brand || product.category}</span>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="text-slate-700 font-mono text-[10px] font-bold">
                            {typeof product.rating === 'number' ? product.rating.toFixed(1) : (product.rating || '4.8')}
                          </span>
                          {(product.reviewsCount || product.reviews_count) && (
                            <span className="text-slate-400 text-[9px] font-normal">
                              ({product.reviewsCount || product.reviews_count})
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-slate-500 text-xs line-clamp-2 font-normal leading-relaxed">
                        {product.description}
                      </p>

                      {/* Dynamic Pricing: Sale or Regular */}
                      <div className="mt-2.5">
                        {pricing.isSaleActive ? (
                          <div className="space-y-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-base font-black text-rose-600 font-mono">
                                {pricing.formattedSalePrice}
                              </span>
                              {pricing.showRegularPriceStrike && (
                                <span className="text-xs text-slate-400 line-through font-mono">
                                  {pricing.formattedRegularPrice}
                                </span>
                              )}
                              {pricing.showDiscountPercentage && pricing.discountPercentage > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 font-black text-[10px] font-mono border border-rose-200">
                                  {pricing.discountPercentage}% OFF
                                </span>
                              )}
                            </div>

                            {pricing.showSavings && pricing.savingsAmount > 0 && (
                              <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                <span>🎉 Save {pricing.formattedSavings}</span>
                              </div>
                            )}

                            {pricing.showCountdown && pricing.saleEndDate && (
                              <div className="pt-1">
                                <SaleCountdownTimer endDate={pricing.saleEndDate} compact />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-bold text-slate-900 font-mono product-price-typography">
                              {isVariantEnabled && variantSummary && variantSummary.variantCount > 0
                                ? (variantSummary.minPrice > 0 ? (variantSummary.minPrice === variantSummary.maxPrice ? `Rs. ${variantSummary.minPrice.toLocaleString('en-PK')}` : `Rs. ${variantSummary.minPrice.toLocaleString('en-PK')} – ${variantSummary.maxPrice.toLocaleString('en-PK')}`) : (product.price || 'Price on Request'))
                                : (product.hidePrice ? 'Call for Price' : (product.isPriceOnRequest ? 'Price on Request' : (product.price || 'Price on Request')))}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                      {onAddToCart && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToCart(product);
                          }}
                          className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add Cart</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onBuyNow) {
                            onBuyNow(product);
                          } else if (onAddToCart) {
                            onAddToCart(product);
                          }
                        }}
                        className="py-2.5 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm shadow-blue-600/20 active:scale-95 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                        <span>Buy Now</span>
                      </button>
                    </div>

                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
