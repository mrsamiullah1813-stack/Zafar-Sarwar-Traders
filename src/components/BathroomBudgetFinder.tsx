import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Sparkles, 
  Home, 
  Check, 
  Layers, 
  ShoppingBag, 
  MessageSquare, 
  Copy, 
  RefreshCw, 
  ArrowRight, 
  AlertCircle, 
  Info, 
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Product, BusinessConfig, BathroomBudgetInputs, BathroomBudgetPackageResult } from '../types';
import { 
  BUDGET_TIERS, 
  FIXTURE_CATEGORIES, 
  calculateBathroomBudgetPackage, 
  formatPricePKR, 
  buildBudgetMessageForWhatsApp 
} from '../utils/bathroomBudgetEngine';

interface BathroomBudgetFinderProps {
  products: Product[];
  config: BusinessConfig;
  onAddToCart?: (product: Product, quantity: number) => void;
  onViewProduct?: (product: Product) => void;
  onClose?: () => void;
}

export const BathroomBudgetFinder: React.FC<BathroomBudgetFinderProps> = ({
  products = [],
  config,
  onAddToCart,
  onViewProduct,
  onClose
}) => {
  const [inputs, setInputs] = useState<BathroomBudgetInputs>({
    bathroomType: 'medium',
    budgetTierId: '100k-200k',
    customBudgetAmount: 150000,
    requiredFixtureTypes: ['toilets', 'vanities', 'faucets', 'showers', 'accessories'],
    preferredStyle: 'modern'
  });

  const [copied, setCopied] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  // Calculate recommendation package dynamically
  const result: BathroomBudgetPackageResult = useMemo(() => {
    return calculateBathroomBudgetPackage(inputs, products);
  }, [inputs, products]);

  const handleToggleFixture = (id: string) => {
    setInputs(prev => {
      const exists = prev.requiredFixtureTypes.includes(id);
      if (exists) {
        // keep at least 1
        if (prev.requiredFixtureTypes.length <= 1) return prev;
        return { ...prev, requiredFixtureTypes: prev.requiredFixtureTypes.filter(f => f !== id) };
      } else {
        return { ...prev, requiredFixtureTypes: [...prev.requiredFixtureTypes, id] };
      }
    });
  };

  const handleCopySummary = () => {
    const text = buildBudgetMessageForWhatsApp(result, config.phone);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppInquiry = () => {
    const text = buildBudgetMessageForWhatsApp(result, config.phone);
    const targetNumber = (config.phone || "923108002863").replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddAllToCart = () => {
    if (!onAddToCart) return;
    let count = 0;
    result.items.forEach(item => {
      if (item.product) {
        onAddToCart(item.product, 1);
        count++;
      }
    });
    setAddedNotice(`Added ${count} items to your shopping cart!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-4 sm:p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Pakistani Bathroom Package Matcher</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight">
            Bathroom Budget & Package Finder
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            باتھ روم بجٹ فائنڈر — اپنے بجٹ کے مطابق مناسب ترین سامان اور مکمل پیکج تلاش کریں۔
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputs({
              bathroomType: 'medium',
              budgetTierId: '100k-200k',
              customBudgetAmount: 150000,
              requiredFixtureTypes: ['toilets', 'vanities', 'faucets', 'showers', 'accessories'],
              preferredStyle: 'modern'
            })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            title="Reset to defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Inputs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* STEP 1: Bathroom Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              1. Bathroom Type / باتھ روم کی قسم
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'small', title: 'Small / Powder', urdu: 'چھوٹا باتھ روم', desc: '4x5 to 5x6 ft' },
                { id: 'medium', title: 'Standard / Attached', urdu: 'معیاری باتھ روم', desc: '6x7 to 7x8 ft' },
                { id: 'master', title: 'Master Bedroom', urdu: 'ماسٹر باتھ روم', desc: '8x10+ ft Luxury' },
                { id: 'commercial', title: 'Guest / Office', urdu: 'مہمان / دفتر', desc: 'High Durability' }
              ].map(bt => (
                <button
                  key={bt.id}
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, bathroomType: bt.id as any }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    inputs.bathroomType === bt.id
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{bt.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{bt.urdu}</div>
                  <div className="text-[10px] text-blue-400 font-mono mt-1">{bt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Budget Range */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                2. Select Your Budget / بجٹ کا انتخاب کریں
              </label>
              <span className="text-xs font-bold text-emerald-400 font-mono">
                Target: {formatPricePKR(result.targetBudget)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {BUDGET_TIERS.map(tier => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, budgetTierId: tier.id }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    inputs.budgetTierId === tier.id
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{tier.label}</div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{tier.description}</div>
                </button>
              ))}
            </div>

            {inputs.budgetTierId === 'custom' && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Enter Custom Amount (PKR):</span>
                <input
                  type="number"
                  min="20000"
                  step="5000"
                  value={inputs.customBudgetAmount || 150000}
                  onChange={(e) => setInputs(prev => ({ ...prev, customBudgetAmount: Math.max(10000, Number(e.target.value)) }))}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-blue-500 w-36"
                />
              </div>
            )}
          </div>

          {/* STEP 3: Required Items Checkboxes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              3. Required Fixtures / کیا کیا سامان چاہیے؟
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FIXTURE_CATEGORIES.map(fc => {
                const isSelected = inputs.requiredFixtureTypes.includes(fc.id);
                return (
                  <button
                    key={fc.id}
                    type="button"
                    onClick={() => handleToggleFixture(fc.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/80 text-white'
                        : 'bg-slate-950/30 border-slate-800/80 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-200">{fc.label}</div>
                      <div className="text-[10px] text-slate-400">{fc.urdu}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isSelected ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 bg-slate-900'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 4: Aesthetic / Style Preference */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              4. Finish & Style Preference / اسٹائل کا انتخاب
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'essential', title: 'Essential Value', urdu: 'کفایتی اور معیاری', desc: 'Polished Chrome' },
                { id: 'modern', title: 'Modern Contemporary', urdu: 'جدید ڈیزائن', desc: 'Concealed & Sleek' },
                { id: 'luxury', title: 'Ultra Luxury', urdu: 'پریمیم لگژری', desc: 'Matte Black & Gold' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, preferredStyle: st.id as any }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    inputs.preferredStyle === st.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{st.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{st.urdu}</div>
                  <div className="text-[10px] text-indigo-400 font-mono mt-1">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Right Output Package Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            
            {/* Status Headline */}
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl ${result.isWithinBudget ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950 text-amber-400 border border-amber-500/30'}`}>
                {result.isWithinBudget ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  {result.isWithinBudget ? 'Matched Package Available' : 'Budget Adjustment Suggested'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {result.statusMessage}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 font-arabic leading-relaxed" dir="rtl">
                  {result.urduStatusMessage}
                </p>
              </div>
            </div>

            {/* Price Compare Banner */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Package Estimated Total</span>
                <span className="text-xl font-extrabold text-blue-400 font-mono">
                  {formatPricePKR(result.totalPackagePrice)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Your Budget</span>
                <span className="text-sm font-bold text-slate-300 font-mono">
                  {formatPricePKR(result.targetBudget)}
                </span>
              </div>
            </div>

            {/* List of Recommended Items */}
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              {result.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.product?.image ? (
                      <img 
                        src={item.product.image} 
                        alt={item.product.name} 
                        className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold">
                        #{idx + 1}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider truncate">
                        {item.categoryTitle}
                      </div>
                      <div className="text-xs font-bold text-white truncate">
                        {item.product ? item.product.name : `Standard Recommended ${item.categoryTitle}`}
                      </div>
                      {item.product?.brand && (
                        <div className="text-[10px] text-slate-400">
                          Brand: {item.product.brand}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end">
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {formatPricePKR(item.estimatedPrice)}
                    </span>
                    {item.product && onViewProduct && (
                      <button
                        onClick={() => onViewProduct(item.product!)}
                        className="text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline mt-0.5 inline-flex items-center gap-0.5"
                      >
                        <span>View</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {addedNotice && (
                <div className="p-2.5 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-semibold text-center animate-fadeIn">
                  ✓ {addedNotice}
                </div>
              )}

              <button
                type="button"
                onClick={handleAddAllToCart}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Complete Package to Cart</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleWhatsAppInquiry}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-600/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Order on WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>
            </div>

            {/* Pakistani Disclaimer Note */}
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              * Rates are indicative based on current catalog. Sanitary accessories, mirror kits, and plumbing fittings can be modified upon order confirmation.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};
