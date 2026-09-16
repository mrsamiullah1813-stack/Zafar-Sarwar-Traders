import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  ShoppingBag, 
  Eye, 
  MessageCircle, 
  Check, 
  X, 
  ArrowUpDown,
  Filter,
  Tag,
  PackageCheck,
  Truck
} from 'lucide-react';
import { Product, ProductCategory, ProductBrand, BusinessConfig } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductSaleBadge } from '../components/ProductSaleBadge';
import { getProductPricingDetails, buildProductWhatsAppOrderUrl } from '../utils/pricingUtils';
import { getProductSlug, getCategorySlug } from '../utils/slugUtils';
import { normalizeProductImage, handleImageError } from '../utils/imageUtils';

interface StorePageProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  config: BusinessConfig;
  isAdmin?: boolean;
  initialCategory?: string;
  initialBrand?: string;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity?: number) => void;
  onSelectProduct?: (product: Product) => void;
  onNavigate: (path: string) => void;
}

export const StorePage: React.FC<StorePageProps> = ({
  products,
  categories,
  brands,
  config,
  isAdmin,
  initialCategory,
  initialBrand,
  onQuickView,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand || 'all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlySale, setOnlySale] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Active non-hidden products from Supabase
  const safeProducts = useMemo(() => {
    return Array.isArray(products) ? products.filter(p => !p.isHidden) : [];
  }, [products]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return safeProducts
      .filter((prod) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = prod.name?.toLowerCase().includes(q);
          const matchCat = prod.category?.toLowerCase().includes(q);
          const matchBrand = prod.brand?.toLowerCase().includes(q);
          const matchDesc = prod.description?.toLowerCase().includes(q);
          const matchSku = prod.sku?.toLowerCase().includes(q);
          if (!matchName && !matchCat && !matchBrand && !matchDesc && !matchSku) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== 'all') {
          if (prod.categoryId !== selectedCategory && prod.category !== selectedCategory) {
            return false;
          }
        }

        // Brand filter
        if (selectedBrand !== 'all') {
          if (prod.brandId !== selectedBrand && prod.brand !== selectedBrand) {
            return false;
          }
        }

        // Stock filter
        if (onlyInStock) {
          if (prod.stockStatus && (prod.stockStatus.toLowerCase().includes('out') || prod.stockStatus.toLowerCase().includes('unavailable'))) {
            return false;
          }
        }

        // Sale filter
        if (onlySale) {
          const pr = getProductPricingDetails(prod);
          if (!pr.isOnSale) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        const priceA = getProductPricingDetails(a).effectivePriceNumeric;
        const priceB = getProductPricingDetails(b).effectivePriceNumeric;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        return 0; // featured default
      });
  }, [safeProducts, searchQuery, selectedCategory, selectedBrand, sortBy, onlyInStock, onlySale]);

  const handleQuickAdd = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    onAddToCart(prod, 1);
    setAddedToast(prod.name);
    setTimeout(() => setAddedToast(null), 2500);
  };

  const handleWhatsApp = (e: React.MouseEvent, prod: Product) => {
    e.stopPropagation();
    const rawPhone = config?.whatsapp || config?.phone || '923108002863';
    const phone = rawPhone.replace(/[^0-9]/g, '');
    const result = buildProductWhatsAppOrderUrl({
      businessName: config?.name || 'Zafar Sarwar Traders',
      whatsappNumber: phone,
      product: prod,
      quantity: 1
    });
    window.open(result.url, '_blank');
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSortBy('featured');
    setOnlyInStock(false);
    setOnlySale(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-24 right-6 z-50 px-4 py-3 bg-emerald-900/95 border border-emerald-500/50 text-white text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Added <strong>{addedToast}</strong> to Cart!</span>
        </div>
      )}

      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Online Store & Catalog', active: true }]}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <span>OFFICIAL PRODUCT STORE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight">
            Online Store & Building Material Catalog
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Browse authentic sanitaryware, brass faucets, luxury bathroom fixtures, heavy water tanks, pipes, and paints. All items backed by factory guarantee and delivery across Pakistan.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Search and Filters Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Categories ({safeProducts.length})</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

          </div>

          {/* Secondary Quick Toggles & Active Filter Summary */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 font-medium">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <span>In Stock Only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 font-medium">
                <input
                  type="checkbox"
                  checked={onlySale}
                  onChange={(e) => setOnlySale(e.target.checked)}
                  className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                />
                <span>On Sale / Discounted</span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium">
                Showing <strong>{filteredProducts.length}</strong> of {safeProducts.length} items
              </span>
              {(searchQuery || selectedCategory !== 'all' || selectedBrand !== 'all' || onlyInStock || onlySale || sortBy !== 'featured') && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pt-8">
            {filteredProducts.map((product) => {
              const pricing = getProductPricingDetails(product);
              const brandName = product.brand || (brands.find(b => b.id === product.brandId)?.name) || 'Authorized Genuine';
              const productSlug = getProductSlug(product);

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col overflow-hidden group"
                >
                  {/* Image Canvas */}
                  <div 
                    className="relative w-full h-56 bg-slate-50 p-4 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => onNavigate(`/product/${productSlug}`)}
                  >
                    <img
                      src={normalizeProductImage(product.image || product.images?.[0], product.category, product.name)}
                      alt={product.name}
                      onError={(e) => handleImageError(e, product.category, product.name)}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Sale Badge */}
                    {pricing.isOnSale && (
                      <div className="absolute top-3 left-3">
                        <ProductSaleBadge pricing={pricing} size="sm" />
                      </div>
                    )}

                    {/* Brand Pill */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded bg-white/95 border border-slate-200 text-[10px] font-bold text-slate-600 uppercase shadow-xs">
                      {brandName}
                    </div>

                    {/* Quick View Button Hover Overlay */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuickView(product);
                      }}
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-white shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Quick View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                        {product.category || 'Building Supply'}
                      </div>
                      <h2 
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 mt-1 leading-snug"
                        onClick={() => onNavigate(`/product/${productSlug}`)}
                      >
                        {product.name}
                      </h2>
                    </div>

                    {/* Pricing */}
                    <div>
                      {pricing.isOnSale ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-extrabold text-emerald-600">
                            {pricing.effectivePrice}
                          </span>
                          <span className="text-xs text-slate-400 line-through">
                            {pricing.originalPrice}
                          </span>
                        </div>
                      ) : (
                        <div className="text-base font-extrabold text-slate-900">
                          {pricing.effectivePrice || 'Contact for Price'}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(e, product)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onBuyNow(product, 1);
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Buy Now
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleWhatsApp(e, product)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 transition-colors cursor-pointer"
                        title="Order via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 mt-8 p-8 space-y-3">
            <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No products match your current filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms, clearing filters, or browsing other categories.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
