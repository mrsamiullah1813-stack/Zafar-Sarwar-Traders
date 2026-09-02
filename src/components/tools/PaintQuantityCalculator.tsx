import React, { useState, useMemo } from 'react';
import { 
  Palette, 
  Send, 
  Info, 
  ShieldAlert, 
  Layers, 
  ShoppingBag, 
  Eye, 
  Plus, 
  CheckCircle2,
  Sparkles,
  Sliders
} from 'lucide-react';
import { 
  PaintEstimatorInputs, 
  Product, 
  BusinessConfig, 
  SmartToolsSettings 
} from '../../types';
import { 
  calculatePaintEstimate, 
  buildPaintEstimateWhatsAppMessage 
} from '../../utils/paintQuantityEngine';

interface PaintQuantityCalculatorProps {
  products: Product[];
  config: BusinessConfig;
  settings?: SmartToolsSettings;
  onAddToCart: (product: Product, quantity?: number) => void;
  onViewProduct: (product: Product) => void;
}

export function PaintQuantityCalculator({
  products,
  config,
  settings,
  onAddToCart,
  onViewProduct
}: PaintQuantityCalculatorProps) {
  const [inputs, setInputs] = useState<PaintEstimatorInputs>({
    roomLengthFeet: 14,
    roomWidthFeet: 12,
    wallHeightFeet: 10,
    numberOfCoats: 2,
    includeCeiling: true,
    doorsCount: 1,
    windowsCount: 2,
    surfaceType: 'smooth-plaster'
  });

  const result = useMemo(() => {
    return calculatePaintEstimate(inputs, products, settings);
  }, [inputs, products, settings]);

  const handleWhatsAppInquiry = () => {
    const rawPhone = config.whatsapp || config.phone || "923108002863";
    const phone = rawPhone.replace(/[^0-9]/g, '') || "923108002863";
    const msg = buildPaintEstimateWhatsAppMessage(result);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-900/30 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-rose-500/30">
            <Palette className="w-3.5 h-3.5" />
            Paint Coverage & Bucket Estimator
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            🎨 Paint Quantity Calculator
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Calculate exact paint quantities in Litres, Gallons, and Drums for rooms, ceilings, and houses with openings deduction and surface texture adjustment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-5">
          {/* Room Dimensions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
              1. Room Dimensions (Feet)
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Length (Feet)
                </label>
                <input
                  type="number"
                  value={inputs.roomLengthFeet}
                  onChange={(e) => setInputs(prev => ({ ...prev, roomLengthFeet: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono"
                  placeholder="14"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Width (Feet)
                </label>
                <input
                  type="number"
                  value={inputs.roomWidthFeet}
                  onChange={(e) => setInputs(prev => ({ ...prev, roomWidthFeet: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono"
                  placeholder="12"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Wall Height (Feet)
                </label>
                <input
                  type="number"
                  value={inputs.wallHeightFeet}
                  onChange={(e) => setInputs(prev => ({ ...prev, wallHeightFeet: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white font-mono"
                  placeholder="10"
                />
              </div>
            </div>

            {/* Coats & Ceiling */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Number of Coats:
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, numberOfCoats: c }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        inputs.numberOfCoats === c
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c} {c === 1 ? 'Coat' : 'Coats'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Include Ceiling?
                </label>
                <button
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, includeCeiling: !prev.includeCeiling }))}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    inputs.includeCeiling
                      ? 'bg-rose-600 text-white border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-700'
                  }`}
                >
                  {inputs.includeCeiling ? '✓ Ceiling Included' : 'Walls Only'}
                </button>
              </div>
            </div>

            {/* Surface Type */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Surface Condition / Plaster Texture:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'smooth-wall', label: 'Smooth Wall', desc: 'Standard putty' },
                  { id: 'rough-plaster', label: 'Rough Plaster', desc: 'Fresh porous wall' },
                  { id: 'repaint', label: 'Repaint Old', desc: 'Already painted' },
                ].map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, surfaceType: s.id as any }))}
                    className={`p-2 rounded-xl text-left transition-all ${
                      inputs.surfaceType === s.id
                        ? 'bg-rose-600 text-white font-bold border border-rose-400'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.label}</div>
                    <div className={`text-[10px] ${inputs.surfaceType === s.id ? 'text-rose-100' : 'text-slate-500'}`}>
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Openings Deduction */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Doors Count</label>
                <select
                  value={inputs.doorsCount || 1}
                  onChange={(e) => setInputs(prev => ({ ...prev, doorsCount: parseInt(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value={0}>0 Doors</option>
                  <option value={1}>1 Door (~21 sq ft)</option>
                  <option value={2}>2 Doors (~42 sq ft)</option>
                  <option value={3}>3 Doors (~63 sq ft)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Windows Count</label>
                <select
                  value={inputs.windowsCount || 2}
                  onChange={(e) => setInputs(prev => ({ ...prev, windowsCount: parseInt(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value={0}>0 Windows</option>
                  <option value={1}>1 Window (~15 sq ft)</option>
                  <option value={2}>2 Windows (~30 sq ft)</option>
                  <option value={3}>3 Windows (~45 sq ft)</option>
                  <option value={4}>4 Windows (~60 sq ft)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-6 space-y-5">
          {/* Calculation Summary Card */}
          <div className="bg-slate-900 border-2 border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider border border-rose-500/30">
                Estimated Paint Requirement
              </span>
              <span className="text-xs text-slate-400">
                Net Paintable Area: <strong className="text-white font-mono">{result.netPaintableAreaSqFt} Sq Ft</strong>
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Total Paint Volume Needed:
              </div>
              <div className="text-3xl sm:text-4xl font-black text-rose-400 font-mono tracking-tight">
                ~{result.recommendedLitres} Litres
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                (Equivalent to ~{result.approxGallons} Gallons or ~{result.approxDrums} Drums)
              </div>
            </div>

            {/* Packaging Breakdown */}
            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Litres (Approx)</span>
                <span className="font-bold text-white font-mono text-sm">
                  {result.recommendedLitres} L
                </span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Gallons (4L)</span>
                <span className="font-bold text-rose-300 font-mono text-sm">
                  ~{result.approxGallons}
                </span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Drums (16L)</span>
                <span className="font-bold text-amber-300 font-mono text-sm">
                  ~{result.approxDrums}
                </span>
              </div>
            </div>

            <button
              onClick={handleWhatsAppInquiry}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50"
            >
              <Send className="w-4 h-4" />
              Inquire Paint Shades & Brand Prices on WhatsApp
            </button>
          </div>

          {/* Matched Showroom Paint Products */}
          {result.matchedPaintProducts.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
                <span>Available Paint Brands & Accessories</span>
                <span className="text-[11px] text-rose-400 font-normal">Showroom Stock</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.matchedPaintProducts.map(prod => (
                  <div
                    key={prod.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-rose-500/40 rounded-xl p-3 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-1 mb-0.5">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400">{prod.brand || 'Premium Coating'}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                      <span className="text-xs font-mono font-black text-amber-400">
                        Rs. {prod.price}
                      </span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onViewProduct(prod)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Quick View"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onAddToCart(prod, 1)}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-[11px] text-rose-300/90 flex gap-2.5 items-start">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="block font-bold text-rose-200">
                ESTIMATE ONLY — NOT A GUARANTEED COVERAGE QUOTE
              </strong>
              <p>{result.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
