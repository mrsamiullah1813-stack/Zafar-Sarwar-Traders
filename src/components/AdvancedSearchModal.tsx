import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter, ArrowUpDown, Tag, Sparkles, ShoppingBag, Eye, Check, ChevronRight, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { Product, ProductCategory, ProductBrand } from '../types';
import { filterProducts, parseNaturalLanguageQuery, getNumericPrice } from '../utils/searchUtils';
import { ProductSaleBadge } from './ProductSaleBadge';
import { getProductPricingDetails } from '../utils/pricingUtils';

interface AdvancedSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  onSelectProduct: (product: Product) => void;
  onSelectCategory?: (category: ProductCategory | string) => void;
  onAddToCart?: (product: Product) => void;
  initialQuery?: string;
}

export const AdvancedSearchModal: React.FC<AdvancedSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  brands,
  onSelectProduct,
  onSelectCategory,
  onAddToCart,
  initialQuery = ''
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedColor, setSelectedColor] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<string>('all');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'featured'>('relevance');
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(true);

  // Debounce input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 180);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      setDebouncedQuery(initialQuery);
    }
  }, [initialQuery]);

  // Extract dynamic filter choices from actual product database
  const availableFilters = useMemo(() => {
    const colorsSet = new Set<string>();
    const materialsSet = new Set<string>();
    const sizesSet = new Set<string>();
    const brandsSet = new Set<string>();
    const categoriesSet = new Set<string>();

    products.forEach(p => {
      if (p.brand) brandsSet.add(p.brand);
      if (p.category) categoriesSet.add(p.category);
      if (p.material) materialsSet.add(p.material);
      (p.availableColors || []).forEach(c => colorsSet.add(c));
      (p.availableFinishes || []).forEach(f => colorsSet.add(f));
      (p.availableMaterials || []).forEach(m => materialsSet.add(m));
      (p.availableSizes || []).forEach(s => sizesSet.add(s));
    });

    return {
      colors: Array.from(colorsSet).sort(),
      materials: Array.from(materialsSet).sort(),
      sizes: Array.from(sizesSet).sort(),
      brands: Array.from(brandsSet).sort(),
      categories: Array.from(categoriesSet).sort(),
    };
  }, [products]);

  // Extract instant search suggestions
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];

    const q = searchQuery.toLowerCase().trim();
    const matches: { title: string; type: 'product' | 'category' | 'brand'; target?: any }[] = [];

    // Categories
    categories.forEach(c => {
      if (c.name.toLowerCase().includes(q)) {
        matches.push({ title: c.name, type: 'category', target: c });
      }
    });

    // Brands
    brands.forEach(b => {
      if (b.name.toLowerCase().includes(q)) {
        matches.push({ title: b.name, type: 'brand', target: b });
      }
    });

    // Products
    products.forEach(p => {
      if (p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q))) {
        if (matches.length < 8) {
          matches.push({ title: p.name, type: 'product', target: p });
        }
      }
    });

    return matches.slice(0, 7);
  }, [searchQuery, products, categories, brands]);

  // Natural Language parse summary
  const parsedNaturalQuery = useMemo(() => {
    if (!debouncedQuery.trim()) return null;
    return parseNaturalLanguageQuery(debouncedQuery);
  }, [debouncedQuery]);

  // Filtered Results
  const filteredResults = useMemo(() => {
    return filterProducts(products, debouncedQuery, {
      categoryId: selectedCategory,
      brandId: selectedBrand,
      color: selectedColor,
      material: selectedMaterial,
      size: selectedSize,
      stockStatus: selectedStock,
      minPrice: minPriceInput ? Number(minPriceInput) : undefined,
      maxPrice: maxPriceInput ? Number(maxPriceInput) : undefined,
      sortBy
    });
  }, [
    products, 
    debouncedQuery, 
    selectedCategory, 
    selectedBrand, 
    selectedColor, 
    selectedMaterial, 
    selectedSize, 
    selectedStock, 
    minPriceInput, 
    maxPriceInput, 
    sortBy
  ]);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedColor('all');
    setSelectedMaterial('all');
    setSelectedSize('all');
    setSelectedStock('all');
    setMinPriceInput('');
    setMaxPriceInput('');
    setSortBy('relevance');
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* TOP SEARCH BAR HEADER */}
        <div className="p-4 sm:p-6 bg-slate-900 border-b border-slate-800 text-white flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center border border-blue-500/30">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-tight font-serif text-white">
                  Advanced Product Search & Filters
                </h2>
                <p className="text-[11px] text-slate-400">
                  Search across names, brands, categories, SKUs, colors, materials & natural prices
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* MAIN INPUT WITH INSTANT SUGGESTIONS */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search products, brands, categories (e.g., 'shower under 15000', '10k basin', 'gold faucet')..."
                className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-medium transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-12 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                className={`absolute right-2 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  showFilterDrawer ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            </div>

            {/* INSTANT SUGGESTIONS DROPDOWN */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 divide-y divide-slate-800/80">
                <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">
                  Instant Suggestions
                </div>
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (s.type === 'product') {
                        onSelectProduct(s.target);
                        onClose();
                      } else {
                        setSearchQuery(s.title);
                        setShowSuggestions(false);
                      }
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{s.title}</span>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {s.type}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* DETECTED NATURAL PRICE TAGS */}
          {parsedNaturalQuery && (parsedNaturalQuery.maxPrice || parsedNaturalQuery.targetPrice || parsedNaturalQuery.cleanKeywords.length > 0) && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 text-[11px]">Understood Query:</span>
              {parsedNaturalQuery.maxPrice && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-blue-300 font-mono text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>Max Price: Rs {(parsedNaturalQuery.maxPrice ?? 0).toLocaleString()}</span>
                </span>
              )}
              {parsedNaturalQuery.targetPrice && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Around Price: Rs {(parsedNaturalQuery.targetPrice ?? 0).toLocaleString()}</span>
                </span>
              )}
              {parsedNaturalQuery.cleanKeywords.map((kw, i) => (
                <span key={i} className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 text-[11px] flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-400" />
                  <span>"{kw}"</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* MAIN BODY: FILTERS + RESULTS */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* SIDEBAR FILTERS (DESKTOP / DRAWER) */}
          <div className={`w-full md:w-72 bg-slate-50 border-r border-slate-200 p-5 overflow-y-auto space-y-5 transition-all ${
            showFilterDrawer ? 'block' : 'hidden md:block'
          }`}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>Refine Search</span>
              </h3>
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            {/* Category Filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="all">All Brands ({availableFilters.brands.length})</option>
                {availableFilters.brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Custom Price Range (PKR)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min Rs"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max Rs"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Color / Finish Filter */}
            {availableFilters.colors.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Color / Finish
                </label>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="all">All Colors / Finishes</option>
                  {availableFilters.colors.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Material Filter */}
            {availableFilters.materials.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Material
                </label>
                <select
                  value={selectedMaterial}
                  onChange={(e) => setSelectedMaterial(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
                >
                  <option value="all">All Materials</option>
                  {availableFilters.materials.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Stock Availability */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Stock Status
              </label>
              <select
                value={selectedStock}
                onChange={(e) => setSelectedStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value="all">All Items</option>
                <option value="In Stock">In Stock Only</option>
                <option value="Limited Stock">Limited Stock</option>
              </select>
            </div>
          </div>

          {/* RESULTS CONTENT PANEL */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-100/60 space-y-4">
            
            {/* RESULTS HEADER & SORTING */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 font-mono">
                <span>Showing {filteredResults.length} Matching Products</span>
                {debouncedQuery && (
                  <span className="text-slate-400 font-normal">
                    for "{debouncedQuery}"
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium hidden sm:inline">Sort By:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="popular">Best Sellers / Popular</option>
                  <option value="featured">Featured First</option>
                </select>
              </div>
            </div>

            {/* PRODUCT GRID OR EMPTY STATE */}
            {filteredResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredResults.map(product => {
                  const pricing = getProductPricingDetails(product);
                  return (
                    <div
                      key={product.id}
                      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col"
                    >
                      {/* IMAGE */}
                      <div className="relative aspect-square bg-slate-50 overflow-hidden cursor-pointer" onClick={() => { onSelectProduct(product); onClose(); }}>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                          <ProductSaleBadge product={product} />
                          {product.badge && !pricing.isSaleActive && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white shadow">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        {product.brand && (
                          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-sm z-10">
                            {product.brand}
                          </span>
                        )}
                      </div>

                      {/* DETAILS */}
                      <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider font-mono">
                            {product.category}
                          </p>
                          <h4 
                            onClick={() => { onSelectProduct(product); onClose(); }}
                            className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-blue-600 transition-colors cursor-pointer mt-0.5"
                          >
                            {product.name}
                          </h4>
                          {product.sku && (
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                              SKU: {product.sku}
                            </p>
                          )}
                        </div>

                        {/* PRICE & BUTTONS */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div>
                            {pricing.isSaleActive ? (
                              <div className="flex flex-col">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-sm font-black text-rose-600 font-mono">
                                    {pricing.formattedSalePrice}
                                  </span>
                                  {pricing.showRegularPriceStrike && (
                                    <span className="text-[10px] line-through text-slate-400 font-mono">
                                      {pricing.formattedRegularPrice}
                                    </span>
                                  )}
                                </div>
                                {pricing.showDiscountPercentage && pricing.discountPercentage > 0 && (
                                  <span className="text-[9px] font-bold text-rose-500 font-mono">
                                    {pricing.discountPercentage}% OFF
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm font-black text-slate-900 font-mono">
                                {product.price || 'On Request'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => { onSelectProduct(product); onClose(); }}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Quick View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {onAddToCart && (
                              <button
                                onClick={() => onAddToCart(product)}
                                className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                                title="Add to Cart"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* EMPTY RESULTS STATE */
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    No products found for your search.
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    Try checking spelling, resetting filters, or explore our primary catalog categories below.
                  </p>
                </div>

                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md"
                >
                  Clear All Search Filters
                </button>

                {/* CATEGORY EXPLORER ALTERNATIVES */}
                <div className="pt-6 border-t border-slate-100 w-full max-w-3xl">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Explore Popular Categories Instead
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {categories.slice(0, 4).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSearchQuery('');
                        }}
                        className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all text-left group"
                      >
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 truncate">
                          {cat.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {cat.itemCount} items
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
