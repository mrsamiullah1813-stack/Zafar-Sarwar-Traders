import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Save, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Search, 
  Check, 
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  Flame,
  LayoutGrid
} from 'lucide-react';
import { Product, ProductCategory, FeaturedCarouselSettings } from '../types';
import { normalizeProductImage, resolveProductImage, handleImageError } from '../utils/imageUtils';
import { getProductPricingDetails } from '../utils/pricingUtils';
import { defaultFeaturedCarouselSettings } from '../utils/storage';

interface AdminFeaturedCarouselManagerProps {
  products: Product[];
  categories: ProductCategory[];
  settings: FeaturedCarouselSettings;
  onSaveSettings: (newSettings: FeaturedCarouselSettings) => Promise<{ success: boolean; error?: string } | void>;
  showToast: (msg: string) => void;
}

export const AdminFeaturedCarouselManager: React.FC<AdminFeaturedCarouselManagerProps> = ({
  products,
  categories,
  settings,
  onSaveSettings,
  showToast
}) => {
  const [localSettings, setLocalSettings] = useState<FeaturedCarouselSettings>(() => ({
    ...defaultFeaturedCarouselSettings,
    ...settings
  }));

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Map of real products for rapid lookup
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => {
      if (p && p.id) map.set(p.id, p);
    });
    return map;
  }, [products]);

  // Currently selected products in order
  const selectedProducts = useMemo(() => {
    return localSettings.productIds
      .map(id => productMap.get(id))
      .filter((p): p is Product => Boolean(p));
  }, [localSettings.productIds, productMap]);

  // Selected product IDs set for quick check
  const selectedIdSet = useMemo(() => {
    return new Set(localSettings.productIds);
  }, [localSettings.productIds]);

  // Filter available products from database to add
  const availableProducts = useMemo(() => {
    return products.filter(p => {
      if (p.isHidden) return false;
      const matchesSearch = !searchQuery.trim() || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCatFilter === 'all' || p.categoryId === selectedCatFilter || p.category === selectedCatFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCatFilter]);

  // Add product to carousel
  const handleAddProduct = (prodId: string) => {
    if (selectedIdSet.has(prodId)) return;
    setLocalSettings(prev => ({
      ...prev,
      productIds: [...prev.productIds, prodId]
    }));
    setStatusMessage(null);
  };

  // Remove product from carousel
  const handleRemoveProduct = (prodId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      productIds: prev.productIds.filter(id => id !== prodId)
    }));
    setStatusMessage(null);
  };

  // Move product up in order
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setLocalSettings(prev => {
      const next = [...prev.productIds];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return { ...prev, productIds: next };
    });
    setStatusMessage(null);
  };

  // Move product down in order
  const handleMoveDown = (index: number) => {
    if (index >= localSettings.productIds.length - 1) return;
    setLocalSettings(prev => {
      const next = [...prev.productIds];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return { ...prev, productIds: next };
    });
    setStatusMessage(null);
  };

  // Auto-fill top recommended real products
  const handleAutoFillRecommended = () => {
    const pool = products.filter(p => !p.isHidden);
    const sorted = [...pool].sort((a, b) => {
      const scoreA = (a.isFeatured ? 4 : 0) + (a.isBestSeller ? 2 : 0) + (a.isNew ? 1 : 0);
      const scoreB = (b.isFeatured ? 4 : 0) + (b.isBestSeller ? 2 : 0) + (b.isNew ? 1 : 0);
      return scoreB - scoreA;
    });
    const topIds = sorted.slice(0, 6).map(p => p.id);
    setLocalSettings(prev => ({
      ...prev,
      productIds: topIds
    }));
    showToast('Loaded 6 top recommended real products');
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await onSaveSettings(localSettings);
      if (res && (res as any).success === false) {
        setStatusMessage({ type: 'error', text: (res as any).error || 'Failed to save settings' });
        showToast('Error saving carousel settings');
      } else {
        setStatusMessage({ type: 'success', text: 'Carousel settings saved and published successfully!' });
        showToast('Featured Products Carousel updated!');
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Error saving settings' });
      showToast('Error saving carousel settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* HEADER SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Homepage Product Showcase</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Featured Products Carousel
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
            Control which real products appear in the premium horizontal carousel showcase on the homepage, customize titles, and manage auto-rotation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK STATUS BANNER */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs sm:text-sm ${
          statusMessage.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-950/40 border-rose-500/30 text-rose-400'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* CONFIGURATION CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CARD 1: GENERAL & DISPLAY TOGGLES */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-md">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-4 h-4 text-blue-400" />
            <span>Display Controls</span>
          </h3>

          {/* Enable / Disable Section Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div>
              <div className="text-sm font-bold text-white">Enable Carousel</div>
              <div className="text-xs text-slate-400">Display this section on the homepage</div>
            </div>
            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                localSettings.isEnabled ? 'bg-emerald-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                localSettings.isEnabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Autoplay Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div>
              <div className="text-sm font-bold text-white">Autoplay Rotation</div>
              <div className="text-xs text-slate-400">Automatically advance slides</div>
            </div>
            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, autoplay: !prev.autoplay }))}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                localSettings.autoplay ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 left-0.5 ${
                localSettings.autoplay ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Autoplay Interval Seconds */}
          {localSettings.autoplay && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">
                Rotation Speed ({localSettings.autoplayIntervalSeconds || 5} seconds)
              </label>
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={localSettings.autoplayIntervalSeconds || 5}
                onChange={(e) => setLocalSettings(prev => ({
                  ...prev,
                  autoplayIntervalSeconds: parseInt(e.target.value, 10) || 5
                }))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Fast (3s)</span>
                <span>Normal (5s)</span>
                <span>Slow (12s)</span>
              </div>
            </div>
          )}
        </div>

        {/* CARD 2: SECTION LABELS & TEXT */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-md lg:col-span-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Section Titles & Branding</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Badge Text</label>
              <input
                type="text"
                value={localSettings.badgeText}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, badgeText: e.target.value }))}
                placeholder="e.g. Editor's Choice"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Main Heading</label>
              <input
                type="text"
                value={localSettings.title}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Curated Masterpieces"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Subtitle / Description</label>
            <textarea
              rows={2}
              value={localSettings.subtitle}
              onChange={(e) => setLocalSettings(prev => ({ ...prev, subtitle: e.target.value }))}
              placeholder="e.g. Handpicked luxury sanitaryware, designer faucets & architectural fittings direct from our showroom inventory."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Selected for Carousel: <strong className="text-white">{selectedProducts.length} products</strong></span>
            <button
              type="button"
              onClick={handleAutoFillRecommended}
              className="text-cyan-400 hover:text-cyan-300 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill with Top 6 Best Sellers</span>
            </button>
          </div>
        </div>

      </div>

      {/* SELECTED PRODUCTS IN CAROUSEL (ORDERABLE LIST) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-400" />
              <span>Selected Carousel Products ({selectedProducts.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Arrange the display order from left to right. Recommended: 5 to 8 products.
            </p>
          </div>

          {selectedProducts.length > 0 && (
            <button
              type="button"
              onClick={() => setLocalSettings(prev => ({ ...prev, productIds: [] }))}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-rose-200 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              Clear All
            </button>
          )}
        </div>

        {selectedProducts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-slate-500 space-y-3">
            <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm">No products explicitly selected yet.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Select products from the catalog below, or click &quot;Fill with Top 6 Best Sellers&quot; to automatically populate with real high-demand items.
            </p>
            <button
              type="button"
              onClick={handleAutoFillRecommended}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Auto-Select Top Products
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedProducts.map((prod, index) => {
              const pricing = getProductPricingDetails(prod);

              return (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition-colors gap-3"
                >
                  {/* Left: Position Badge & Product Image + Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-7 h-7 rounded-xl bg-blue-950 text-blue-400 font-mono text-xs font-black flex items-center justify-center shrink-0 border border-blue-500/20">
                      {index + 1}
                    </div>

                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={resolveProductImage(prod)}
                        alt={prod.name}
                        onError={(e) => handleImageError(e, prod.category, prod.name)}
                        className="w-full h-full object-contain mix-blend-screen"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                        {prod.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="text-blue-400 font-semibold">{prod.category}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-400">{pricing.formattedCurrentPrice}</span>
                        {pricing.isSaleActive && (
                          <span className="px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-300 text-[9px] font-bold">
                            SALE
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Reorder & Remove Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      aria-label="Move Up"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === selectedProducts.length - 1}
                      aria-label="Move Down"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(prod.id)}
                      aria-label="Remove Product"
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CATALOG SEARCH & ADD SELECTOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Add Products From Catalog</span>
          </h3>
          <p className="text-xs text-slate-400">
            Search existing products from the database and add them to the Featured Carousel.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search product by name, brand, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedCatFilter}
            onChange={(e) => setSelectedCatFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Product Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
          {availableProducts.slice(0, 30).map(product => {
            const isSelected = selectedIdSet.has(product.id);
            const pricing = getProductPricingDetails(product);

            return (
              <div
                key={product.id}
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                  isSelected
                    ? 'bg-blue-950/30 border-blue-500/40'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src={resolveProductImage(product)}
                      alt={product.name}
                      onError={(e) => handleImageError(e, product.category, product.name)}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate max-w-[140px]">
                      {product.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate">
                      {pricing.formattedCurrentPrice}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => isSelected ? handleRemoveProduct(product.id) : handleAddProduct(product.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800/60'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
