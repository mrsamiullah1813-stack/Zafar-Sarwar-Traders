import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  DollarSign, 
  ShoppingBag, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Eye, 
  Send, 
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Product, BusinessConfig, SmartToolsSettings } from '../../types';

interface SmartProductFinderProps {
  products: Product[];
  config: BusinessConfig;
  settings?: SmartToolsSettings;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewProduct: (product: Product) => void;
}

export function SmartProductFinder({
  products,
  config,
  settings,
  onAddToCart,
  onViewProduct
}: SmartProductFinderProps) {
  const [lookingFor, setLookingFor] = useState<string>('all');
  const [budgetTier, setBudgetTier] = useState<string>('all');
  const [customMin, setCustomMin] = useState<string>('');
  const [customMax, setCustomMax] = useState<string>('');
  const [qualityPreference, setQualityPreference] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract unique brands from real products
  const availableBrands = useMemo(() => {
    const brandsSet = new Set<string>();
    products.forEach(p => {
      if (p.brand && p.brand.trim()) brandsSet.add(p.brand.trim());
    });
    return Array.from(brandsSet).sort();
  }, [products]);

  // Helper to parse price
  const getNumericPrice = (p: Product): number => {
    if (typeof p.price === 'number') return p.price;
    const str = String(p.price || '').replace(/[^0-9.]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  // Filter products strictly from real Supabase inventory
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.isHidden) return false;

      // 1. Text Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(q);
        const matchesCat = (p.category || '').toLowerCase().includes(q);
        const matchesBrand = (p.brand || '').toLowerCase().includes(q);
        const matchesSku = (p.sku || '').toLowerCase().includes(q);
        const variantsList = p.variantsList || p.variantsConfig?.variants || [];
        const matchesVariants = variantsList.some(v => (v.name || '').toLowerCase().includes(q) || (v.sku || '').toLowerCase().includes(q));
        const matchesSizes = (p.availableSizes || []).some(s => s.toLowerCase().includes(q));
        const matchesColors = (p.availableColors || []).some(c => c.toLowerCase().includes(q));
        if (!matchesName && !matchesCat && !matchesBrand && !matchesSku && !matchesVariants && !matchesSizes && !matchesColors) return false;
      }

      // 2. Category / Item Type Filter
      if (lookingFor !== 'all') {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        if (lookingFor === 'toilet' && !text.includes('toilet') && !text.includes('commode') && !text.includes('closet')) return false;
        if (lookingFor === 'basin' && !text.includes('basin') && !text.includes('sink') && !text.includes('vanity')) return false;
        if (lookingFor === 'shower' && !text.includes('shower') && !text.includes('rain') && !text.includes('column')) return false;
        if (lookingFor === 'shower-set' && !text.includes('shower set') && !text.includes('mixer') && !text.includes('panel')) return false;
        if (lookingFor === 'tap' && !text.includes('tap') && !text.includes('faucet') && !text.includes('cock') && !text.includes('spout')) return false;
        if (lookingFor === 'accessories' && !text.includes('accessor') && !text.includes('set') && !text.includes('towel') && !text.includes('holder')) return false;
        if (lookingFor === 'water-tank' && !text.includes('tank')) return false;
        if (lookingFor === 'pump' && !text.includes('pump') && !text.includes('motor')) return false;
        if (lookingFor === 'pipes' && !text.includes('pipe') && !text.includes('cpvc') && !text.includes('upvc') && !text.includes('fitting')) return false;
        if (lookingFor === 'paint' && !text.includes('paint') && !text.includes('emulsion') && !text.includes('primer') && !text.includes('putty')) return false;
        if (lookingFor === 'geyser' && !text.includes('geyser') && !text.includes('heater')) return false;
      }

      // 3. Brand Filter
      if (selectedBrand !== 'all') {
        if ((p.brand || '').trim().toLowerCase() !== selectedBrand.toLowerCase()) return false;
      }

      // 4. Budget Tier Filter
      const price = getNumericPrice(p);
      if (budgetTier === 'under-10k' && price > 10000) return false;
      if (budgetTier === '10k-25k' && (price < 10000 || price > 25000)) return false;
      if (budgetTier === '25k-50k' && (price < 25000 || price > 50000)) return false;
      if (budgetTier === '50k-plus' && price < 50000) return false;
      if (budgetTier === 'custom') {
        const min = parseFloat(customMin);
        const max = parseFloat(customMax);
        if (!isNaN(min) && price < min) return false;
        if (!isNaN(max) && price > max) return false;
      }

      // 5. Quality Tier Filter (Based on relative price distribution or tag)
      if (qualityPreference === 'budget' && price > 20000) return false;
      if (qualityPreference === 'premium' && price < 30000) return false;

      return true;
    });
  }, [products, lookingFor, budgetTier, customMin, customMax, qualityPreference, selectedBrand, searchQuery]);

  const handleReset = () => {
    setLookingFor('all');
    setBudgetTier('all');
    setCustomMin('');
    setCustomMax('');
    setQualityPreference('all');
    setSelectedBrand('all');
    setSearchQuery('');
  };

  const handleWhatsAppProduct = (p: Product) => {
    const rawPhone = config.whatsapp || config.phone || "923108002863";
    const phone = rawPhone.replace(/[^0-9]/g, '') || "923108002863";
    const msg = `*Product Inquiry via Smart Product Finder*\n` +
      `Product: ${p.name}\n` +
      `Price: Rs. ${p.price || 'Call for Price'}\n` +
      `Brand: ${p.brand || 'Original'}\n` +
      `SKU: ${p.sku || 'N/A'}\n` +
      `Please confirm stock availability and discount options.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border border-blue-900/40 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Live Supabase Catalog Query
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              🛒 Smart Product Finder
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Find exactly what you need in seconds. Select category, budget, and brand to explore verified in-stock items with live showroom pricing.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all border border-slate-700 self-start md:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      </div>

      {/* Interactive Filter Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-6">
        {/* 1. What are you looking for? */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>1. What are you looking for?</span>
            <span className="text-[11px] text-blue-400 font-normal">Select Item Type</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {[
              { id: 'all', label: 'All Products', icon: '🌟' },
              { id: 'toilet', label: 'Toilets / Commodes', icon: '🚽' },
              { id: 'basin', label: 'Basins & Vanities', icon: '🪞' },
              { id: 'shower', label: 'Showers & Mixers', icon: '🚿' },
              { id: 'tap', label: 'Taps & Faucets', icon: '🚰' },
              { id: 'accessories', label: 'Bath Accessories', icon: '🧴' },
              { id: 'water-tank', label: 'Water Tanks', icon: '🛢️' },
              { id: 'pump', label: 'Water Pumps', icon: '⚡' },
              { id: 'pipes', label: 'Pipes & Fittings', icon: '🔧' },
              { id: 'paint', label: 'Paints & Primer', icon: '🎨' },
              { id: 'geyser', label: 'Water Geysers', icon: '🔥' },
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setLookingFor(cat.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  lookingFor === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-400'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Budget Range & 3. Quality & Brand */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 border-t border-slate-800">
          {/* Budget */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              2. Budget Range
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'all', label: 'Any Budget' },
                { id: 'under-10k', label: 'Under Rs. 10k' },
                { id: '10k-25k', label: 'Rs. 10k – 25k' },
                { id: '25k-50k', label: 'Rs. 25k – 50k' },
                { id: '50k-plus', label: 'Rs. 50k+ Luxury' },
                { id: 'custom', label: 'Custom Range' },
              ].map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setBudgetTier(tier.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    budgetTier === tier.id
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/50'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            {budgetTier === 'custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="number"
                  placeholder="Min PKR"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Max PKR"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>
            )}
          </div>

          {/* Quality Tier */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              3. Preference
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'all', label: 'All Qualities & Tiers', desc: 'Complete range' },
                { id: 'budget', label: 'Economy / Budget', desc: 'Affordable & reliable' },
                { id: 'standard', label: 'Standard High Quality', desc: 'Best value for money' },
                { id: 'premium', label: 'Luxury & Executive', desc: 'Imported & top brands' }
              ].map(q => (
                <button
                  key={q.id}
                  onClick={() => setQualityPreference(q.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-all ${
                    qualityPreference === q.id
                      ? 'bg-blue-600 text-white font-bold border border-blue-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/50'
                  }`}
                >
                  <span>{q.label}</span>
                  <span className={`text-[10px] ${qualityPreference === q.id ? 'text-blue-200' : 'text-slate-500'}`}>{q.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand & Text Search */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              4. Brand & Search
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search model, finish, SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Brands ({availableBrands.length})</option>
                {availableBrands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">Matching Showroom Products:</span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-900/60 border border-blue-700 text-blue-300 text-xs font-mono font-bold">
            {filteredProducts.length} Items Found
          </span>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Live sync from database
        </span>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">No matching products found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Try adjusting your budget range or clearing some filters to explore our full inventory.
          </p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all mt-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(prod => (
            <div
              key={prod.id}
              className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all group hover:shadow-lg hover:shadow-blue-950/30"
            >
              <div>
                <div className="relative aspect-square rounded-xl bg-slate-950 overflow-hidden mb-3 border border-slate-800/80">
                  <img
                    src={prod.image || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400"}
                    alt={prod.name}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {prod.brand && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 backdrop-blur-sm text-[10px] font-bold text-slate-300 border border-slate-700">
                      {prod.brand}
                    </span>
                  )}
                  {prod.badge && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-950 text-[10px] font-bold text-emerald-400 border border-emerald-800">
                      {prod.badge}
                    </span>
                  )}
                </div>

                <h4 className="text-xs font-bold text-white line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors">
                  {prod.name}
                </h4>
                <p className="text-[11px] text-slate-400 mb-2 truncate">
                  {prod.category || 'Sanitary & Building Materials'}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-black text-amber-400 font-mono">
                    Rs. {typeof prod.price === 'number' ? (prod.price as number).toLocaleString() : (prod.price || 'Contact')}
                  </div>
                  {prod.stockStatus !== 'Out of Stock' && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> {prod.stockStatus || 'In Stock'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => onViewProduct(prod)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold transition-all border border-slate-700"
                  >
                    <Eye className="w-3 h-3" /> Quick View
                  </button>
                  <button
                    onClick={() => onAddToCart(prod, 1)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold transition-all shadow-sm"
                  >
                    <ShoppingBag className="w-3 h-3" /> Add
                  </button>
                </div>

                <button
                  onClick={() => handleWhatsAppProduct(prod)}
                  className="w-full flex items-center justify-center gap-1.5 py-1 text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors font-semibold"
                >
                  <Send className="w-3 h-3" /> Order on WhatsApp
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
