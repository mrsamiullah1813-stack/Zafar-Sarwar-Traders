import React, { useState, useMemo } from 'react';
import { 
  Droplet, 
  Sparkles, 
  Users, 
  Building2, 
  Gauge, 
  Check, 
  ShoppingBag, 
  MessageSquare, 
  Copy, 
  RefreshCw, 
  AlertTriangle, 
  Info, 
  ShieldCheck, 
  ExternalLink,
  CheckCircle2,
  Layers,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Product, BusinessConfig, WaterTankPumpInputs, WaterTankPumpResult } from '../types';
import { 
  calculateWaterTankAndPump, 
  buildWaterGuideWhatsAppMessage 
} from '../utils/waterTankPumpEngine';

interface WaterTankPumpGuideProps {
  products: Product[];
  config: BusinessConfig;
  onAddToCart?: (product: Product, quantity: number) => void;
  onBuyNow?: (product: Product, quantity: number) => void;
  onViewProduct?: (product: Product) => void;
  onClose?: () => void;
}

export const WaterTankPumpGuide: React.FC<WaterTankPumpGuideProps> = ({
  products = [],
  config,
  onAddToCart,
  onBuyNow,
  onViewProduct,
  onClose
}) => {
  const [inputs, setInputs] = useState<WaterTankPumpInputs>({
    peopleCount: 6,
    floorsCount: 2,
    usageLevel: 'standard',
    groundStorageNeeded: true,
    waterSourceType: 'mixed'
  });

  const [copied, setCopied] = useState(false);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  const result: WaterTankPumpResult = useMemo(() => {
    return calculateWaterTankAndPump(inputs, products);
  }, [inputs, products]);

  const handleCopySummary = () => {
    const text = buildWaterGuideWhatsAppMessage(result);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppInquiry = () => {
    const text = buildWaterGuideWhatsAppMessage(result);
    const rawNumber = config.whatsapp || config.phone || "923108002863";
    const targetNumber = rawNumber.replace(/[^0-9]/g, '') || "923108002863";
    window.open(`https://wa.me/${targetNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product, 1);
      setAddedNotice(`Added ${product.name} to cart!`);
      setTimeout(() => setAddedNotice(null), 3000);
    }
  };

  const handleBuyNow = () => {
    const targetProduct = result.recommendedProducts?.[0] || products.find(p => (p.category || '').toLowerCase().includes('tank') || (p.name || '').toLowerCase().includes('tank')) || products[0];
    if (targetProduct) {
      if (onBuyNow) {
        onBuyNow(targetProduct, 1);
        if (onClose) onClose();
      } else if (onAddToCart) {
        onAddToCart(targetProduct, 1);
        if (onClose) onClose();
      }
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-4 sm:p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Droplet className="w-3.5 h-3.5" />
            <span>Pakistani Plumbing & Water Engineering Guide</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight">
            Water Tank & Pump Capacity Guide
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            پانی کا ٹینک اور پمپ گائیڈ — فیملی سائز اور منزلوں کے مطابق مناسب ترین ٹینک اور موٹر ہارس پاور معلوم کریں۔
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputs({
              peopleCount: 6,
              floorsCount: 2,
              usageLevel: 'standard',
              groundStorageNeeded: true,
              waterSourceType: 'mixed'
            })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            title="Reset to defaults"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Inputs & Outputs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* STEP 1: Number of People */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Family Members / افراد کی تعداد
              </label>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {inputs.peopleCount} Persons ({inputs.peopleCount * (inputs.usageLevel === 'high' ? 220 : inputs.usageLevel === 'eco' ? 120 : 160)} L/Day)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { count: 3, label: '1 – 3 People', urdu: 'چھوٹی فیملی', desc: '~450 Litres/Day' },
                { count: 6, label: '4 – 6 People', urdu: 'معیاری فیملی', desc: '~960 Litres/Day' },
                { count: 9, label: '7 – 10 People', urdu: 'بڑی فیملی', desc: '~1,500 Litres/Day' },
                { count: 14, label: '10+ Joint Family', urdu: 'مشترکہ خاندان', desc: '~2,200+ Litres/Day' }
              ].map(preset => (
                <button
                  key={preset.count}
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, peopleCount: preset.count }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    inputs.peopleCount === preset.count
                      ? 'bg-cyan-600/20 border-cyan-500 text-white shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{preset.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{preset.urdu}</div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-1">{preset.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: Number of Floors / Building Height */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              2. Number of Floors / عمارت کی منزلیں (پمپ پریشر کے لیے)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { floors: 1, title: 'Single Storey', urdu: 'ایک منزل (گراؤنڈ)', head: 'Up to 15 ft Head' },
                { floors: 2, title: 'Double Storey (G+1)', urdu: 'دو منزلہ گھر', head: '25-30 ft Head' },
                { floors: 3, title: 'Triple Storey (G+2)', urdu: 'تین منزلہ عمارت', head: '35-45 ft Head' },
                { floors: 4, title: '4+ Floors / Plaza', urdu: 'چار یا زیادہ منزلیں', head: '50+ ft High Head' }
              ].map(fl => (
                <button
                  key={fl.floors}
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, floorsCount: fl.floors }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    inputs.floorsCount === fl.floors
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{fl.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{fl.urdu}</div>
                  <div className="text-[10px] text-blue-400 font-mono mt-1">{fl.head}</div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 3: Water Usage Pattern */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
              3. Water Usage Pattern / پانی کے استعمال کی نوعیت
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'eco', title: 'Moderate / Eco', urdu: 'کفایتی استعمال', desc: '120 Liters / Person / Day' },
                { id: 'standard', title: 'Standard Pakistani', urdu: 'معمول کا استعمال', desc: '160 Liters / Person / Day' },
                { id: 'high', title: 'High Demand / Lawn', urdu: 'زیادہ استعمال اور لان', desc: '220 Liters / Person / Day' }
              ].map(usage => (
                <button
                  key={usage.id}
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, usageLevel: usage.id as any }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    inputs.usageLevel === usage.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs">{usage.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{usage.urdu}</div>
                  <div className="text-[10px] text-indigo-400 font-mono mt-1">{usage.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ground Underground Tank Option */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-white">Underground Water Storage Tank (زیر زمین واٹر ٹینک)</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Calculate ground tank capacity for government municipal line or bore water storage.</div>
            </div>
            <input
              type="checkbox"
              checked={inputs.groundStorageNeeded}
              onChange={(e) => setInputs(prev => ({ ...prev, groundStorageNeeded: e.target.checked }))}
              className="w-5 h-5 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-900"
            />
          </div>

        </div>

        {/* Right Output Recommendations (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-950/80 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
            
            {/* Primary Recommended Tank Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Recommended Overhead Tank</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  {result.recommendedOverheadTankGallons} Gallons
                </span>
              </div>

              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                  {result.recommendedOverheadTankLiters.toLocaleString()} Litres
                </div>
                <div className="text-xs text-slate-300 font-arabic mt-0.5" dir="rtl">
                  تقریباً {result.recommendedOverheadTankLiters.toLocaleString()} لیٹر / {result.recommendedOverheadTankGallons} گیلن اوورہیڈ ٹینک
                </div>
              </div>

              {result.recommendedUndergroundTankLiters && (
                <div className="pt-2 border-t border-cyan-500/20 text-xs flex justify-between text-slate-300">
                  <span>Underground Ground Tank:</span>
                  <span className="font-bold text-cyan-300 font-mono">{result.recommendedUndergroundTankLiters.toLocaleString()} Litres</span>
                </div>
              )}
            </div>

            {/* Pump & Piping Specs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Recommended Pump</span>
                <span className="text-xs font-bold text-emerald-400 font-mono block mt-1">
                  {result.recommendedPumpHorsepower}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Continuous Duty</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Piping Delivery Size</span>
                <span className="text-xs font-bold text-blue-400 font-mono block mt-1">
                  {result.recommendedPipeSizeInches}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">CPVC / UPVC Schedule 40</span>
              </div>
            </div>

            {/* Matching Products from Store */}
            {result.recommendedProducts.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Matching Store Tanks & Plumbing Supplies:
                </span>
                <div className="space-y-2">
                  {result.recommendedProducts.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {prod.image && (
                          <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover bg-slate-950 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-white truncate text-xs">{prod.name}</div>
                          <div className="text-[10px] text-blue-400 font-mono">{prod.salePrice || prod.price || 'Call for Price'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {onViewProduct && (
                          <button
                            onClick={() => onViewProduct(prod)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium"
                          >
                            View
                          </button>
                        )}
                        {onAddToCart && (
                          <button
                            onClick={() => handleAddToCart(prod)}
                            className="p-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
                            title="Add to Cart"
                          >
                            <ShoppingBag className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Tips */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
              <span className="font-bold text-cyan-400 block text-[10px] uppercase tracking-wider">Engineering Advice:</span>
              <ul className="space-y-1 list-disc list-inside text-slate-400 text-[10px]">
                {result.technicalTips.slice(0, 2).map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {addedNotice && (
                <div className="p-2 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-semibold text-center animate-fadeIn">
                  ✓ {addedNotice}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Buy Now</span>
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

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              * Final tank and pump selection depends on building elevation head, supply pressure, pipe lengths, and friction loss. Confirm with a qualified plumber.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};
