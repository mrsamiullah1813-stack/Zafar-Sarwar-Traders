import React, { useState, useMemo } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  DollarSign, 
  ShoppingBag, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Plus, 
  RotateCcw,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { 
  Product, 
  BusinessConfig, 
  SmartToolsSettings, 
  BudgetProductsAiInputs 
} from '../../types';
import { 
  calculateBudgetToProducts, 
  buildBudgetAiWhatsAppMessage 
} from '../../utils/budgetToProductsAiEngine';

interface BudgetToProductsAiProps {
  products: Product[];
  config: BusinessConfig;
  settings?: SmartToolsSettings;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewProduct: (product: Product) => void;
}

export function BudgetToProductsAi({
  products,
  config,
  settings,
  onAddToCart,
  onViewProduct
}: BudgetToProductsAiProps) {
  const [inputs, setInputs] = useState<BudgetProductsAiInputs>({
    budgetAmountPkr: 100000,
    projectType: 'bathroom',
    bathroomCount: 1,
    preferredQuality: 'standard',
    selectedPriorities: ['toilets', 'vanities', 'showers', 'faucets', 'accessories'],
    additionalNotes: ''
  });

  const [customBudgetString, setCustomBudgetString] = useState<string>('100000');
  const [addedAllSuccess, setAddedAllSuccess] = useState<boolean>(false);

  const result = useMemo(() => {
    return calculateBudgetToProducts(inputs, products);
  }, [inputs, products]);

  const handleBudgetPreset = (amount: number) => {
    setInputs(prev => ({ ...prev, budgetAmountPkr: amount }));
    setCustomBudgetString(amount.toString());
  };

  const handleCustomBudgetChange = (val: string) => {
    setCustomBudgetString(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setInputs(prev => ({ ...prev, budgetAmountPkr: num }));
    }
  };

  const togglePriority = (key: string) => {
    setInputs(prev => {
      const exists = prev.selectedPriorities.includes(key);
      const updated = exists 
        ? prev.selectedPriorities.filter(k => k !== key)
        : [...prev.selectedPriorities, key];
      return { ...prev, selectedPriorities: updated.length > 0 ? updated : ['toilets'] };
    });
  };

  const handleAddAllToCart = () => {
    result.recommendations.forEach(item => {
      onAddToCart(item.product, item.quantity);
    });
    setAddedAllSuccess(true);
    setTimeout(() => setAddedAllSuccess(false), 3000);
  };

  const handleWhatsAppOrder = () => {
    const phone = config.phone || "923108002863";
    const msg = buildBudgetAiWhatsAppMessage(result);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-500/30">
            <Bot className="w-3.5 h-3.5" />
            AI Inventory Matcher & Budget Allocator
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            🤖 Budget-to-Products AI
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Enter your project budget in PKR. Our intelligent engine matches real in-stock showroom fixtures to create an optimized, complete shopping list.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Target Budget in PKR */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>1. Your Budget in PKR</span>
              <span className="text-[11px] text-indigo-400 font-normal">Pakistani Rupees</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Rs. 50,000', value: 50000 },
                { label: 'Rs. 100,000', value: 100000 },
                { label: 'Rs. 150,000', value: 150000 },
                { label: 'Rs. 250,000', value: 250000 },
                { label: 'Rs. 400,000', value: 400000 },
                { label: 'Rs. 600,000', value: 600000 },
              ].map(b => (
                <button
                  key={b.value}
                  onClick={() => handleBudgetPreset(b.value)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                    inputs.budgetAmountPkr === b.value
                      ? 'bg-indigo-600 text-white border border-indigo-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                Or Type Custom Budget Amount:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  PKR
                </span>
                <input
                  type="number"
                  value={customBudgetString}
                  onChange={(e) => handleCustomBudgetChange(e.target.value)}
                  placeholder="e.g. 125000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-12 pr-4 py-2.5 text-sm font-mono font-bold text-amber-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Project Scope & Quality */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                2. Project Scope
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'bathroom', label: '1 Full Bathroom' },
                  { id: 'complete-house-sanitary', label: 'Complete House Sanitary' },
                  { id: 'plumbing', label: 'Plumbing & Pipes' },
                  { id: 'paint', label: 'Paint & Coatings' },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => setInputs(prev => ({ ...prev, projectType: p.id as any }))}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                      inputs.projectType === p.id
                        ? 'bg-indigo-600 text-white font-bold border border-indigo-400'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Standard */}
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                3. Quality Preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'budget', label: 'Economy', desc: 'Lowest price' },
                  { id: 'standard', label: 'Standard', desc: 'Best value' },
                  { id: 'premium', label: 'Executive', desc: 'Luxury line' },
                ].map(q => (
                  <button
                    key={q.id}
                    onClick={() => setInputs(prev => ({ ...prev, preferredQuality: q.id as any }))}
                    className={`p-2 rounded-xl text-left transition-all ${
                      inputs.preferredQuality === q.id
                        ? 'bg-indigo-600 text-white font-bold border border-indigo-400'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    <div className="text-xs font-bold">{q.label}</div>
                    <div className={`text-[10px] ${inputs.preferredQuality === q.id ? 'text-indigo-200' : 'text-slate-500'}`}>
                      {q.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Required Fixtures Checkboxes */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                4. Required Items in Package
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'toilets', label: 'Commode / Toilet' },
                  { id: 'vanities', label: 'Vanity / Basin Set' },
                  { id: 'showers', label: 'Shower & Mixer' },
                  { id: 'faucets', label: 'Taps & Muslim Shower' },
                  { id: 'accessories', label: '6-Piece Accessories' },
                  { id: 'plumbing', label: 'Pipes & Drainage' },
                  { id: 'geysers', label: 'Water Geyser' },
                  { id: 'paints', label: 'Paint & Coatings' },
                ].map(item => {
                  const isChecked = inputs.selectedPriorities.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => togglePriority(item.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-left transition-all border ${
                        isChecked
                          ? 'bg-indigo-950/80 border-indigo-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-indigo-500 text-white' : 'border border-slate-600'
                      }`}>
                        {isChecked && '✓'}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Column: Recommended Shopping List */}
        <div className="lg:col-span-7 space-y-5">
          {/* Summary Metric Header */}
          <div className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block">Target Budget:</span>
                <span className="text-lg font-black text-white font-mono">
                  Rs. {result.targetBudgetPkr.toLocaleString()} PKR
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Curated Package Total:</span>
                <span className={`text-xl font-black font-mono ${
                  result.isWithinBudget ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  Rs. {result.totalEstimatedPkr.toLocaleString()} PKR
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Remaining Buffer:</span>
                <span className={`text-sm font-bold font-mono ${
                  result.remainingBudgetPkr >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {result.remainingBudgetPkr >= 0 ? '+' : ''}Rs. {result.remainingBudgetPkr.toLocaleString()}
                </span>
              </div>
            </div>

            {/* AI Advice Bubble */}
            <div className="bg-indigo-950/50 border border-indigo-800/40 rounded-xl p-3 text-xs text-indigo-200 flex gap-2.5 items-start">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1 leading-relaxed">
                <p>{result.aiAdvice}</p>
                {result.urduAdvice && (
                  <p className="text-[11px] text-indigo-300/80 font-urdu">{result.urduAdvice}</p>
                )}
              </div>
            </div>

            {/* Action Bar */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddAllToCart}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {addedAllSuccess ? '✓ Added All to Cart!' : `Add All (${result.recommendations.length}) to Cart`}
              </button>

              <button
                onClick={handleWhatsAppOrder}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                Order List on WhatsApp
              </button>
            </div>
          </div>

          {/* Curated Product Items List */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Curated Showroom Shopping List ({result.recommendations.length} Items)</span>
              <span className="text-[11px] text-slate-400 font-normal">Real Supabase Products</span>
            </h3>

            {result.recommendations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No matching products found. Please select at least one fixture category.
              </div>
            ) : (
              <div className="space-y-3">
                {result.recommendations.map(item => (
                  <div
                    key={`${item.categoryKey}-${item.product.id}`}
                    className="bg-slate-950/80 border border-slate-800 hover:border-indigo-500/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                        <img
                          src={item.product.image || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200"}
                          alt={item.product.name}
                          className="w-full h-full object-contain p-1"
                          loading="lazy"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                          {item.categoryLabel}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{item.product.brand || 'Original Brand'}</span>
                          {item.product.sku && <span className="font-mono text-[10px]">SKU: {item.product.sku}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                      <div className="text-right">
                        <div className="text-xs font-black text-amber-400 font-mono">
                          Rs. {item.unitPrice.toLocaleString()}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Qty: {item.quantity} = Rs. {item.totalPrice.toLocaleString()}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onViewProduct(item.product)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Quick View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onAddToCart(item.product, item.quantity)}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Catalog Authenticity Notice */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              All product specifications, brands, and prices are fetched directly from our showroom database. No synthetic items are generated.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
