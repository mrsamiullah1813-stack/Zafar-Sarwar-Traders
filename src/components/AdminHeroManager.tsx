import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  Sliders, 
  Clock, 
  Type, 
  Layout, 
  Save, 
  Plus, 
  Trash2, 
  Star, 
  CheckCircle2, 
  Search,
  Eye,
  Layers,
  ShoppingBag,
  ArrowUp,
  ArrowDown,
  Video,
  Play,
  RotateCcw,
  Sparkle,
  Image as ImageIcon,
  MessageCircle,
  Zap,
  Globe,
  Upload
} from 'lucide-react';
import { Product, HeroSettings, ProductCategory, ProductBrand } from '../types';
import { saveHeroSettings } from '../utils/storage';
import { HeroSection } from './HeroSection';

interface AdminHeroManagerProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  heroSettings: HeroSettings;
  onUpdateHeroSettings: (newSettings: HeroSettings) => void;
  onUpdateProducts: (updatedProducts: Product[]) => void;
  showToast: (msg: string) => void;
}

export const AdminHeroManager: React.FC<AdminHeroManagerProps> = ({
  products,
  categories,
  brands,
  heroSettings,
  onUpdateHeroSettings,
  onUpdateProducts,
  showToast,
}) => {
  const [settings, setSettings] = useState<HeroSettings>({ ...heroSettings });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'content' | 'products' | 'design' | 'media'>('content');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Active custom order or heroProductIds
  const currentHeroProductIds = settings?.heroProductIds || [];

  // Filter products for the selector list
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    const q = (searchQuery || '').toLowerCase();
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const brandMatch = !!(p.brand && p.brand.toLowerCase().includes(q));
    const matchesSearch = nameMatch || brandMatch;
    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Selected products list maintaining custom order
  const getSelectedProducts = (): Product[] => {
    const list = (products || []).filter(p => p && currentHeroProductIds.includes(p.id));
    if (settings?.customProductOrder && settings.customProductOrder.length > 0) {
      const orderMap = new Map<string, number>(settings.customProductOrder.map((id, index) => [id, index]));
      list.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 999;
        const orderB = orderMap.get(b.id) ?? 999;
        return orderA - orderB;
      });
    }
    return list;
  };

  const selectedHeroProducts = getSelectedProducts();

  // Handle Save Draft
  const handleSaveDraft = async () => {
    const draftSettings: HeroSettings = {
      ...settings,
      isDraft: true
    };
    const res = await saveHeroSettings(draftSettings);
    if (res && res.success === false) {
      showToast(`Save failed: ${res.error || 'Database error'}`);
      return;
    }
    setSettings(draftSettings);
    onUpdateHeroSettings(draftSettings);
    showToast('Hero Draft saved successfully!');
  };

  // Handle Publish Draft to Live
  const handlePublish = async () => {
    const published: HeroSettings = {
      ...settings,
      isDraft: false,
      publishedSettings: { ...settings }
    };
    const res = await saveHeroSettings(published);
    if (res && res.success === false) {
      showToast(`Publish failed: ${res.error || 'Database error'}`);
      return;
    }
    setSettings(published);
    onUpdateHeroSettings(published);
    showToast('🚀 Hero Section PUBLISHED successfully! Live website updated.');
  };

  // Toggle product in hero
  const handleToggleProductInHero = (productId: string) => {
    let updatedIds: string[];
    if (currentHeroProductIds.includes(productId)) {
      updatedIds = currentHeroProductIds.filter(id => id !== productId);
    } else {
      updatedIds = [...currentHeroProductIds, productId];
    }

    const updatedOrder = (settings.customProductOrder || []).filter(id => updatedIds.includes(id));
    if (!currentHeroProductIds.includes(productId)) {
      updatedOrder.push(productId);
    }

    // Update product isHeroFeatured status
    const updatedProducts = products.map(p => {
      if (p.id === productId) {
        return { ...p, isHeroFeatured: !p.isHeroFeatured };
      }
      return p;
    });
    onUpdateProducts(updatedProducts);

    setSettings(prev => ({
      ...prev,
      heroProductIds: updatedIds,
      customProductOrder: updatedOrder
    }));

    showToast('Updated Hero product selection');
  };

  // Move product position up or down
  const handleMoveProductOrder = (productId: string, direction: 'up' | 'down') => {
    const order = [...(settings.customProductOrder && settings.customProductOrder.length > 0 ? settings.customProductOrder : currentHeroProductIds)];
    const index = order.indexOf(productId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= order.length) return;

    // Swap elements
    const temp = order[index];
    order[index] = order[targetIndex];
    order[targetIndex] = temp;

    setSettings(prev => ({
      ...prev,
      customProductOrder: order
    }));

    showToast('Reordered hero products');
  };

  // Image override handler
  const handleImageOverrideChange = (productId: string, imageUrl: string) => {
    setSettings(prev => ({
      ...prev,
      productImageOverrides: {
        ...(prev.productImageOverrides || {}),
        [productId]: imageUrl
      }
    }));
  };

  return (
    <div className="space-y-8 text-slate-800 dark:text-slate-100">
      
      {/* Top Banner & Main Save / Publish Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl text-white shadow-2xl border border-blue-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/30 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Hero Content CMS & Cinematic Manager</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black font-serif">Ultra-Premium Hero Section</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Configure dynamic database products, cinematic 3D transitions, copywriting, button CTAs, and ambient video backgrounds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10 shrink-0">
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs sm:text-sm border border-cyan-500/30 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Preview Hero</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="px-5 py-3 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-200 font-bold text-xs sm:text-sm border border-blue-500/40 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>

          <button
            onClick={handlePublish}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95 border border-cyan-300/30"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Publish Live</span>
          </button>
        </div>
      </div>

      {/* Hero Master Enable/Disable Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${settings.isEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm block">Homepage Hero Section Status</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {settings.isEnabled ? 'Hero is currently ACTIVE on website' : 'Hero is DISABLED (Next section moves up automatically)'}
            </span>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={settings.isEnabled}
            onChange={(e) => setSettings({ ...settings, isEnabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:peer-focus:ring-blue-800 peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('content')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'content'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Type className="w-4 h-4" />
          <span>Copywriting & CTAs</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'products'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Star className="w-4 h-4" />
          <span>Product Selection ({selectedHeroProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('design')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'design'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>3D Motion & Speed</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
            activeTab === 'media'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Video className="w-4 h-4" />
          <span>Background & Video</span>
        </button>
      </div>

      {/* TAB 1: COPYWRITING & CTAS */}
      {activeTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Headline & Subtitle */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Type className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <span>Hero Copywriting</span>
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Small Top Badge Label
              </label>
              <input
                type="text"
                value={settings.badgeText}
                onChange={(e) => setSettings({ ...settings, badgeText: e.target.value })}
                placeholder="ZAFAR SARWAR TRADERS"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Main Headline Title (Fallback if no products selected)
              </label>
              <textarea
                rows={2}
                value={settings.heading}
                onChange={(e) => setSettings({ ...settings, heading: e.target.value })}
                placeholder="Premium Sanitaryware&#10;& Bathroom Solutions"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-serif font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Subheading Paragraph
              </label>
              <textarea
                rows={3}
                value={settings.subheading}
                onChange={(e) => setSettings({ ...settings, subheading: e.target.value })}
                placeholder="Explore premium sanitaryware..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-normal"
              />
            </div>
          </div>

          {/* Action Buttons Setup */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Layout className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <span>Action Buttons (CTAs)</span>
            </h3>

            {/* Button 1: View Product */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-blue-600 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>Button 1: View Product</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.enablePrimaryBtn}
                  onChange={(e) => setSettings({ ...settings, enablePrimaryBtn: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>

              <input
                type="text"
                value={settings.primaryBtnText}
                onChange={(e) => setSettings({ ...settings, primaryBtnText: e.target.value })}
                placeholder="View Product"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
              />
            </div>

            {/* Button 2: Add to Cart */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-cyan-600 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4" />
                  <span>Button 2: Add to Cart</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.enableSecondaryBtn}
                  onChange={(e) => setSettings({ ...settings, enableSecondaryBtn: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>

              <input
                type="text"
                value={settings.secondaryBtnText}
                onChange={(e) => setSettings({ ...settings, secondaryBtnText: e.target.value })}
                placeholder="Add to Cart"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
              />
            </div>

            {/* Button 3: WhatsApp */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-emerald-600 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>Button 3: Order on WhatsApp</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.enableTertiaryBtn ?? true}
                  onChange={(e) => setSettings({ ...settings, enableTertiaryBtn: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>

              <input
                type="text"
                value={settings.tertiaryBtnText || 'Order on WhatsApp'}
                onChange={(e) => setSettings({ ...settings, tertiaryBtnText: e.target.value })}
                placeholder="Order on WhatsApp"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
              />
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: PRODUCT SELECTION & REORDERING */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Reorderable Selected Products List */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Active Hero Products ({selectedHeroProducts.length})</span>
            </h3>

            {selectedHeroProducts.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-700 dark:text-amber-300">
                No products explicitly selected. The hero will automatically display your latest featured products as fallback.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {selectedHeroProducts.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-slate-400">0{idx + 1}</span>
                      <img
                        src={settings.productImageOverrides?.[prod.id] || prod.image || prod.images?.[0]}
                        alt={prod.name}
                        className="w-10 h-10 object-contain bg-white dark:bg-slate-900 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{prod.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {prod.price ? 'Rs. ' + (!isNaN(Number(prod.price)) && Number(prod.price) > 0 ? Number(prod.price).toLocaleString() : prod.price) : 'Quote'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveProductOrder(prod.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-colors"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleMoveProductOrder(prod.id, 'down')}
                        disabled={idx === selectedHeroProducts.length - 1}
                        className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white disabled:opacity-30 transition-colors"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleProductInHero(prod.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove from Hero"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search & Selector List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold">Select Products from Database</h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredProducts.map(prod => {
                const isSelected = currentHeroProductIds.includes(prod.id);
                const customImage = settings.productImageOverrides?.[prod.id];
                return (
                  <div
                    key={prod.id}
                    className={`p-3 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                      isSelected 
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500' 
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div 
                      onClick={() => handleToggleProductInHero(prod.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={customImage || prod.image || prod.images?.[0]} 
                          alt={prod.name} 
                          className="w-12 h-12 object-contain bg-slate-100 dark:bg-slate-800 rounded-xl p-1"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{prod.name}</p>
                          <p className="text-[10px] text-slate-500">{prod.brand || 'Zafar Sarwar Traders'}</p>
                        </div>
                      </div>

                      <div className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 border-blue-600 text-white' 
                          : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Image Override Input */}
                    {isSelected && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Hero Image Override (Optional URL)
                        </label>
                        <input
                          type="text"
                          value={customImage || ''}
                          onChange={(e) => handleImageOverrideChange(prod.id, e.target.value)}
                          placeholder="Leave empty to use database product image"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-mono"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

      {/* TAB 3: DESIGN & TRANSITION PRESETS */}
      {activeTab === 'design' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <span>Cinematic Animation & 3D Settings</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Auto Slide Toggle */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-xs uppercase text-slate-500 block">Auto-Rotate Products</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Auto Slide</span>
                <input
                  type="checkbox"
                  checked={settings.autoPlay}
                  onChange={(e) => setSettings({ ...settings, autoPlay: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>
            </div>

            {/* Rotation Speed */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-xs uppercase text-slate-500 block">Slide Duration (Seconds)</span>
              <input
                type="number"
                min="2"
                max="15"
                value={settings.rotationDurationSeconds}
                onChange={(e) => setSettings({ ...settings, rotationDurationSeconds: Math.max(2, parseInt(e.target.value) || 5) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              />
            </div>

            {/* Transition Preset */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-xs uppercase text-slate-500 block">Transition Style Preset</span>
              <select
                value={settings.transitionStyle || 'cinematic-depth'}
                onChange={(e: any) => setSettings({ ...settings, transitionStyle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
              >
                <option value="cinematic-depth">Cinematic Depth Transition (Recommended)</option>
                <option value="depth-zoom">Depth Zoom</option>
                <option value="3d-slide">3D Perspective Slide</option>
                <option value="smooth-reveal">Smooth Vertical Reveal</option>
                <option value="scale-reveal">Scale Reveal</option>
                <option value="perspective-slide">Perspective Rotate Slide</option>
              </select>
            </div>

            {/* Pause on Hover */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-xs uppercase text-slate-500 block">Pause on Hover</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Pause when mouse hovers</span>
                <input
                  type="checkbox"
                  checked={settings.pauseOnHover ?? true}
                  onChange={(e) => setSettings({ ...settings, pauseOnHover: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>
            </div>

            {/* 3D Parallax Tilt */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-bold text-xs uppercase text-slate-500 block">Cursor Parallax Response</span>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">3D Tilt on Hover</span>
                <input
                  type="checkbox"
                  checked={settings.enableParallax ?? true}
                  onChange={(e) => setSettings({ ...settings, enableParallax: e.target.checked })}
                  className="rounded text-blue-600"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: BACKGROUND & MEDIA */}
      {activeTab === 'media' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Video className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <span>Hero Background & Media Overrides</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Background Type
              </label>
              <select
                value={settings.bgType || 'ambient-dark'}
                onChange={(e: any) => setSettings({ ...settings, bgType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="ambient-dark">Ambient Showroom Image Backdrop (Default)</option>
                <option value="custom-image">Custom Background Image URL</option>
                <option value="custom-video">Ambient Looping Background Video</option>
              </select>
            </div>

            {settings.bgType === 'custom-image' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Custom Image URL
                </label>
                <input
                  type="text"
                  value={settings.bgMediaUrl || ''}
                  onChange={(e) => setSettings({ ...settings, bgMediaUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            )}

            {settings.bgType === 'custom-video' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Custom MP4 Video URL
                </label>
                <input
                  type="text"
                  value={settings.bgVideoUrl || ''}
                  onChange={(e) => setSettings({ ...settings, bgVideoUrl: e.target.value })}
                  placeholder="https://example.com/ambient-video.mp4"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE HERO PREVIEW MODAL */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-2xl flex flex-col justify-between overflow-y-auto">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white sticky top-0 z-[110]">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              <span className="font-bold text-sm">Hero Live Preview (Draft Settings)</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handlePublish}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs"
              >
                Publish Now
              </button>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="my-auto">
            <HeroSection
              products={products}
              categories={categories}
              brands={brands}
              heroSettings={settings}
              onSelectProduct={() => {}}
              onOpenAiConsultant={() => {}}
            />
          </div>
        </div>
      )}

    </div>
  );
};
