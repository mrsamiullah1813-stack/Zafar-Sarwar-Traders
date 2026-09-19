import React, { useState, useMemo, useEffect } from 'react';
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
  Truck,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  Award,
  Zap
} from 'lucide-react';
import { Product, ProductCategory, ProductBrand, BusinessConfig } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductSaleBadge } from '../components/ProductSaleBadge';
import { 
  getProductPricingDetails, 
  buildProductWhatsAppOrderUrl,
  hasActiveVariants,
  getActiveVariants
} from '../utils/pricingUtils';
import { hasActivePaintShades, getActivePaintShades } from '../utils/paintShadeUtils';
import { getProductSlug, getCategorySlug, getBrandSlug } from '../utils/slugUtils';
import { normalizeProductImage, handleImageError } from '../utils/imageUtils';
import { updateSeoMetadata } from '../utils/seoUtils';

interface StorePageProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  config: BusinessConfig;
  isAdmin?: boolean;
  initialCategory?: string;
  initialBrand?: string;
  initialSearch?: string;
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
  initialSearch,
  onQuickView,
  onAddToCart,
  onBuyNow,
  onSelectProduct,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'all');
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand || 'all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlySale, setOnlySale] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  useEffect(() => {
    updateSeoMetadata({
      title: 'Online Store & Building Material Catalog | Zafar Sarwar Traders',
      description: 'Explore verified sanitaryware, luxury faucets, bathroom fittings, heavy water tanks, pipes, and Nippon paints in Chiniot with nationwide delivery.',
      path: '/store'
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  // Sync initialCategory & initialBrand if props change
  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialBrand) setSelectedBrand(initialBrand);
  }, [initialBrand]);

  // Active non-hidden products from Supabase
  const safeProducts = useMemo(() => {
    return Array.isArray(products) ? products.filter(p => !p.isHidden) : [];
  }, [products]);

  // Compute product counts per category
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    safeProducts.forEach(p => {
      if (p.categoryId) map[p.categoryId] = (map[p.categoryId] || 0) + 1;
      if (p.category) map[p.category.toLowerCase()] = (map[p.category.toLowerCase()] || 0) + 1;
    });
    return map;
  }, [safeProducts]);

  // Compute product counts per brand
  const brandCounts = useMemo(() => {
    const map: Record<string, number> = {};
    safeProducts.forEach(p => {
      if (p.brandId) map[p.brandId] = (map[p.brandId] || 0) + 1;
      if (p.brand) map[p.brand.toLowerCase()] = (map[p.brand.toLowerCase()] || 0) + 1;
    });
    return map;
  }, [safeProducts]);

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
          const catMatch = 
            prod.categoryId === selectedCategory || 
            prod.category === selectedCategory ||
            prod.category?.toLowerCase() === selectedCategory.toLowerCase();
          if (!catMatch) return false;
        }

        // Brand filter
        if (selectedBrand !== 'all') {
          const brandMatch = 
            prod.brandId === selectedBrand || 
            prod.brand === selectedBrand ||
            prod.brand?.toLowerCase() === selectedBrand.toLowerCase();
          if (!brandMatch) return false;
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

  const hasActiveFilters = Boolean(
    searchQuery || 
    selectedCategory !== 'all' || 
    selectedBrand !== 'all' || 
    onlyInStock || 
    onlySale || 
    sortBy !== 'featured'
  );

  // Render Left Filter Controls
  const renderFilterControls = () => (
    <div className="space-y-6">
      
      {/* Category Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Categories</span>
          </h3>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className="text-[11px] text-blue-600 hover:underline font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto pr-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>All Categories</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              selectedCategory === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {safeProducts.length}
            </span>
          </button>

          {categories.filter(c => c.isActive !== false).map((cat) => {
            const count = categoryCounts[cat.id] || categoryCounts[cat.name.toLowerCase()] || 0;
            const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate pr-2">{cat.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Section */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            <span>Brands</span>
          </h3>
          {selectedBrand !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedBrand('all')}
              className="text-[11px] text-blue-600 hover:underline font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="space-y-1 max-h-56 overflow-y-auto pr-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedBrand('all')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedBrand === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>All Brands</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
              selectedBrand === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-600'
            }`}>
              {safeProducts.length}
            </span>
          </button>

          {brands.filter(b => b.isActive !== false).map((b) => {
            const count = brandCounts[b.id] || brandCounts[b.name.toLowerCase()] || 0;
            const isSelected = selectedBrand === b.id || selectedBrand === b.name;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBrand(b.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="truncate pr-2">{b.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 ${
                  isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Availability & Deals */}
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Availability & Offers
        </h3>

        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyInStock}
              onChange={(e) => setOnlyInStock(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
            />
            <span>In Stock Only</span>
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlySale}
              onChange={(e) => setOnlySale(e.target.checked)}
              className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <span>On Sale / Discounted</span>
              <span className="px-1.5 py-0.2 rounded bg-red-100 text-red-700 text-[10px] font-bold">Deal</span>
            </span>
          </label>
        </div>
      </div>

      {/* Showroom Authenticity Guarantee */}
      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-blue-900">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Showroom Guarantee</span>
        </div>
        <p className="text-blue-800/80 text-[11px] leading-relaxed">
          All items are 100% genuine factory authorized stock from Master, Dura Max, Faisal, and Nippon Paints.
        </p>
      </div>

    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed top-24 right-6 z-50 px-4 py-3 bg-emerald-900/95 border border-emerald-500/50 text-white text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
            <ShoppingBag className="w-3.5 h-3.5" />
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
        
        {/* Top Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 placeholder:text-slate-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Controls: Sort & Mobile Filter Toggle */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            
            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <span className="text-xs font-bold text-slate-500 hidden md:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="featured">Featured Showroom Items</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

          </div>

        </div>

        {/* Active Filters Notification Row */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 mb-6 rounded-xl bg-blue-50 border border-blue-200 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-blue-900">Active Filters:</span>
              {selectedCategory !== 'all' && (
                <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold flex items-center gap-1">
                  <span>Category: {categories.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
                  <button type="button" onClick={() => setSelectedCategory('all')} className="hover:text-blue-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedBrand !== 'all' && (
                <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-bold flex items-center gap-1">
                  <span>Brand: {brands.find(b => b.id === selectedBrand)?.name || selectedBrand}</span>
                  <button type="button" onClick={() => setSelectedBrand('all')} className="hover:text-slate-300">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {onlyInStock && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold flex items-center gap-1">
                  <span>In Stock</span>
                  <button type="button" onClick={() => setOnlyInStock(false)} className="hover:text-emerald-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {onlySale && (
                <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold flex items-center gap-1">
                  <span>On Sale</span>
                  <button type="button" onClick={() => setOnlySale(false)} className="hover:text-red-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold flex items-center gap-1">
                  <span>"{searchQuery}"</span>
                  <button type="button" onClick={() => setSearchQuery('')} className="hover:text-amber-200">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* MAIN BODY: SIDEBAR + PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* DESKTOP LEFT SIDEBAR */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            {renderFilterControls()}
          </div>

          {/* MOBILE FILTER MODAL DRAWER */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden flex">
              <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between z-10">
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                      <span>Filter Products</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsMobileFilterOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {renderFilterControls()}
                </div>

                <div className="pt-6 border-t border-slate-200 mt-6 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
                  >
                    Apply Filters ({filteredProducts.length} Results)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetFilters();
                      setIsMobileFilterOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                  >
                    Reset All
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RIGHT PRODUCT GRID AREA */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Results Count Header */}
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Showing <strong>{filteredProducts.length}</strong> items in showroom catalog</span>
              <span>100% Genuine Certified Stock</span>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => {
                  const pricing = getProductPricingDetails(product);
                  const brandName = product.brand || (brands.find(b => b.id === product.brandId)?.name) || 'Authorized Genuine';
                  const productSlug = getProductSlug(product);
                  const hasVar = hasActiveVariants(product);
                  const hasShade = hasActivePaintShades(product);

                  return (
                    <div
                      key={product.id}
                      onClick={() => onNavigate(`/product/${productSlug}`)}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col overflow-hidden group cursor-pointer"
                    >
                      {/* Image Stage */}
                      <div 
                        className="relative w-full h-44 sm:h-56 bg-slate-50 p-3 sm:p-4 flex items-center justify-center cursor-pointer overflow-hidden"
                        onClick={() => onNavigate(`/product/${productSlug}`)}
                      >
                        <img
                          src={normalizeProductImage(product.image || product.images?.[0], product.category, product.name)}
                          alt={`${product.name} - ${product.category || 'Sanitaryware & Building Materials'} Chiniot`}
                          onError={(e) => handleImageError(e, product.category, product.name)}
                          className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />

                        {/* Sale Badge */}
                        {pricing.isOnSale && (
                          <div className="absolute top-2.5 left-2.5">
                            <ProductSaleBadge pricing={pricing} size="sm" />
                          </div>
                        )}

                        {/* Brand Pill */}
                        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-white/95 border border-slate-200 text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase shadow-xs">
                          {brandName}
                        </div>

                        {/* Variant Pill Tag */}
                        {hasVar && (
                          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-semibold backdrop-blur-xs">
                            Variants Available
                          </div>
                        )}
                        {!hasVar && hasShade && (
                          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-semibold backdrop-blur-xs">
                            Color Shades
                          </div>
                        )}

                        {/* View Details Button Hover Overlay */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(`/product/${productSlug}`);
                          }}
                          className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-white shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer hidden sm:block"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Body Content */}
                      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                            {product.category || 'Building Supply'}
                          </div>
                          <h2 
                            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 mt-1 leading-snug"
                            onClick={() => onNavigate(`/product/${productSlug}`)}
                          >
                            {product.name}
                          </h2>
                        </div>

                        {/* Pricing */}
                        <div>
                          {pricing.isOnSale ? (
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-sm sm:text-base font-extrabold text-emerald-600">
                                {pricing.effectivePrice}
                              </span>
                              <span className="text-[11px] text-slate-400 line-through">
                                {pricing.originalPrice}
                              </span>
                            </div>
                          ) : (
                            <div className="text-sm sm:text-base font-extrabold text-slate-900">
                              {pricing.effectivePrice || 'Contact for Price'}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(e, product)}
                            className="flex-1 py-2 px-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[11px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Add to Cart</span>
                            <span className="sm:hidden">Add</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onBuyNow(product, 1);
                            }}
                            className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] sm:text-xs font-bold transition-colors cursor-pointer hidden sm:block"
                          >
                            Buy
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
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
                <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">No products match your current filters</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your search terms, clearing filters, or browsing other showroom departments.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
