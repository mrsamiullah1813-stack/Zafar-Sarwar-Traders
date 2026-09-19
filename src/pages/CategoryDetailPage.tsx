import React, { useState, useMemo } from 'react';
import { Search, ShoppingBag, Eye, MessageCircle, Check, ArrowLeft, PackageCheck } from 'lucide-react';
import { ProductCategory, Product, ProductBrand, BusinessConfig } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ProductSaleBadge } from '../components/ProductSaleBadge';
import { ProductCardRating } from '../components/ProductCardRating';
import { getProductPricingDetails, buildProductWhatsAppOrderUrl } from '../utils/pricingUtils';
import { getProductSlug } from '../utils/slugUtils';
import { normalizeProductImage, handleImageError } from '../utils/imageUtils';

interface CategoryDetailPageProps {
  category: ProductCategory;
  products?: Product[];
  allProducts?: Product[];
  categories?: ProductCategory[];
  allCategories?: ProductCategory[];
  brands: ProductBrand[];
  config: BusinessConfig;
  isAdmin?: boolean;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onBuyNow: (product: Product, quantity?: number) => void;
  onNavigate: (path: string) => void;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({
  category,
  products: inputProducts,
  allProducts,
  brands,
  config,
  isAdmin,
  onQuickView,
  onAddToCart,
  onBuyNow,
  onNavigate
}) => {
  const products = inputProducts || allProducts || [];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Filter products strictly belonging to this category
  const categoryProducts = useMemo(() => {
    return (products || []).filter(
      (p) => !p.isHidden && (p.categoryId === category.id || p.category === category.name)
    );
  }, [products, category]);

  // Apply in-category search, brand, sort
  const filteredProducts = useMemo(() => {
    return categoryProducts
      .filter((prod) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = prod.name?.toLowerCase().includes(q);
          const matchBrand = prod.brand?.toLowerCase().includes(q);
          const matchDesc = prod.description?.toLowerCase().includes(q);
          const matchSku = prod.sku?.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchDesc && !matchSku) return false;
        }

        if (selectedBrand !== 'all') {
          if (prod.brandId !== selectedBrand && prod.brand !== selectedBrand) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        const priceA = getProductPricingDetails(a).effectivePriceNumeric;
        const priceB = getProductPricingDetails(b).effectivePriceNumeric;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        return 0;
      });
  }, [categoryProducts, searchQuery, selectedBrand, sortBy]);

  // Unique brands present in this category
  const categoryBrands = useMemo(() => {
    const brandIds = new Set<string>();
    categoryProducts.forEach((p) => {
      if (p.brandId) brandIds.add(p.brandId);
      if (p.brand) brandIds.add(p.brand);
    });
    return brands.filter((b) => brandIds.has(b.id) || brandIds.has(b.name));
  }, [categoryProducts, brands]);

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
        items={[
          { label: 'Categories', onClick: () => onNavigate('/categories') },
          { label: category.name, active: true }
        ]}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Category Hero Banner */}
      <div className="relative bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800 overflow-hidden">
        {/* Subtle background image */}
        {category.bannerImage && (
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none filter blur-[1px]"
            style={{ backgroundImage: `url('${category.bannerImage}')` }}
          />
        )}
        <div className="relative max-w-7xl mx-auto space-y-4">
          <button
            type="button"
            onClick={() => onNavigate('/categories')}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {category.badge && (
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                {category.badge}
              </span>
            )}
            <span className="text-xs font-semibold text-slate-400">
              {categoryProducts.length} Verified Products
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight">
            {category.name}
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            {category.fullDescription || category.description || 'Complete catalog of genuine products in this department.'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Search & In-Category Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Search */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search within ${category.name}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Brand filter if category has multiple brands */}
            {categoryBrands.length > 0 && (
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Brands ({categoryBrands.length})</option>
                {categoryBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="featured">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product) => {
              const pricing = getProductPricingDetails(product);
              const brandName = product.brand || (brands.find(b => b.id === product.brandId)?.name) || 'Genuine';
              const productSlug = getProductSlug(product);

              return (
                <div
                  key={product.id}
                  onClick={() => onNavigate(`/product/${productSlug}`)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col overflow-hidden group cursor-pointer"
                >
                  {/* Image */}
                  <div 
                    className="relative w-full h-40 sm:h-56 bg-slate-50 p-2.5 sm:p-4 flex items-center justify-center cursor-pointer overflow-hidden"
                    onClick={() => onNavigate(`/product/${productSlug}`)}
                  >
                    <img
                      src={normalizeProductImage(product.image || product.images?.[0], product.category, product.name)}
                      alt={`${product.name} - ${category.name} in Chiniot`}
                      onError={(e) => handleImageError(e, product.category, product.name)}
                      className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {pricing.isOnSale && (
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <ProductSaleBadge pricing={pricing} size="sm" />
                      </div>
                    )}

                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-1.5 sm:px-2 py-0.5 rounded bg-white/95 border border-slate-200 text-[8.5px] sm:text-[10px] font-bold text-slate-600 uppercase shadow-xs">
                      {brandName}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(`/product/${productSlug}`);
                      }}
                      className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-1.5 sm:p-2 rounded-xl bg-white/95 text-slate-700 hover:text-blue-600 hover:bg-white shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>

                  {/* Body */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2 sm:space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-blue-600 uppercase tracking-wide truncate">
                          {brandName || category.name}
                        </span>
                        <ProductCardRating productId={product.id} />
                      </div>
                      <h2 
                        className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors cursor-pointer line-clamp-2 leading-snug"
                        onClick={() => onNavigate(`/product/${productSlug}`)}
                      >
                        {product.name}
                      </h2>
                    </div>

                    {/* Price */}
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

                    {/* Actions */}
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
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <PackageCheck className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No products found in this category</h3>
            <p className="text-xs text-slate-500">Try clearing your search query or view all products in the store.</p>
            <button
              type="button"
              onClick={() => onNavigate('/store')}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-colors cursor-pointer"
            >
              Browse Full Store Catalog
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
