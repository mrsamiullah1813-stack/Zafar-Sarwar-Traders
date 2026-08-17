import React, { useState, useMemo } from 'react';
import { 
  Home, 
  Layers, 
  Sparkles, 
  Send, 
  Info, 
  DollarSign, 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  TrendingUp,
  Percent
} from 'lucide-react';
import { 
  HouseConstructionInputs, 
  BusinessConfig, 
  SmartToolsSettings 
} from '../../types';
import { 
  calculateHouseConstructionCost, 
  buildConstructionEstimateWhatsAppMessage 
} from '../../utils/houseConstructionCostEngine';

interface HouseConstructionCostEstimatorProps {
  config: BusinessConfig;
  settings?: SmartToolsSettings;
}

export function HouseConstructionCostEstimator({
  config,
  settings
}: HouseConstructionCostEstimatorProps) {
  const [inputs, setInputs] = useState<HouseConstructionInputs>({
    houseSizePreset: '5-marla',
    storeys: 'double',
    stage: 'complete-house',
    quality: 'standard',
    bathroomsCount: 3,
    kitchensCount: 2,
    hasBasement: false
  });

  const result = useMemo(() => {
    return calculateHouseConstructionCost(inputs, settings);
  }, [inputs, settings]);

  const handleWhatsAppInquiry = () => {
    const phone = config.phone || "923108002863";
    const msg = buildConstructionEstimateWhatsAppMessage(result);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatLacs = (pkr: number): string => {
    if (pkr >= 10000000) {
      return `${(pkr / 10000000).toFixed(2)} Crore`;
    }
    return `${(pkr / 100000).toFixed(2)} Lacs`;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-900/30 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-amber-500/30">
            <Building2 className="w-3.5 h-3.5" />
            Pakistani Residential Civil Guide
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            🏠 House Construction Cost Estimator
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Estimate approximate construction budget and category materials breakdown for 3, 5, 7, 10 Marla and 1 Kanal homes in Pakistan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* 1. House Size */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>1. House Plot Size</span>
              <span className="text-[11px] text-amber-400 font-normal">Pakistani Units</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: '3-marla', label: '3 Marla', sub: '~675 sq ft' },
                { id: '5-marla', label: '5 Marla', sub: '~1,125 sq ft' },
                { id: '7-marla', label: '7 Marla', sub: '~1,575 sq ft' },
                { id: '10-marla', label: '10 Marla', sub: '~2,250 sq ft' },
                { id: '1-kanal', label: '1 Kanal', sub: '~4,500 sq ft' },
                { id: 'custom', label: 'Custom', sub: 'Custom area' },
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => setInputs(prev => ({ ...prev, houseSizePreset: item.id as any }))}
                  className={`p-3 rounded-xl text-left transition-all ${
                    inputs.houseSizePreset === item.id
                      ? 'bg-amber-600 text-white font-bold border border-amber-400 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700/60'
                  }`}
                >
                  <div className="text-xs font-bold">{item.label}</div>
                  <div className={`text-[10px] ${inputs.houseSizePreset === item.id ? 'text-amber-100' : 'text-slate-500'}`}>
                    {item.sub}
                  </div>
                </button>
              ))}
            </div>

            {inputs.houseSizePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Custom Marla</label>
                  <input
                    type="number"
                    value={inputs.customMarla || ''}
                    onChange={(e) => setInputs(prev => ({ ...prev, customMarla: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g. 6"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-400 block mb-1">Covered Area (Sq Ft)</label>
                  <input
                    type="number"
                    value={inputs.customSqFt || ''}
                    onChange={(e) => setInputs(prev => ({ ...prev, customSqFt: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g. 2400"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Number of Floors & Stage */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  2. Number of Storeys
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'single', label: 'Single Storey (Ground)' },
                    { id: 'double', label: 'Double Storey (G + 1)' },
                    { id: 'triple', label: 'Triple Storey (G + 2)' }
                  ].map(fl => (
                    <button
                      key={fl.id}
                      onClick={() => setInputs(prev => ({ ...prev, storeys: fl.id as any }))}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                        inputs.storeys === fl.id
                          ? 'bg-amber-600 text-white font-bold border border-amber-400'
                          : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                      }`}
                    >
                      {fl.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                  3. Project Stage
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'grey-structure', label: 'Grey Structure Only' },
                    { id: 'finishing', label: 'Finishing Only' },
                    { id: 'complete-house', label: 'Complete House' }
                  ].map(st => (
                    <button
                      key={st.id}
                      onClick={() => setInputs(prev => ({ ...prev, stage: st.id as any }))}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all ${
                        inputs.stage === st.id
                          ? 'bg-amber-600 text-white font-bold border border-amber-400'
                          : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quality Standard */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
                4. Quality Standard
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'basic', label: 'Basic / Economy', desc: 'Standard materials' },
                  { id: 'standard', label: 'Standard High', desc: 'Popular A+ quality' },
                  { id: 'premium', label: 'Luxury Executive', desc: 'Imported fixtures' },
                ].map(q => (
                  <button
                    key={q.id}
                    onClick={() => setInputs(prev => ({ ...prev, quality: q.id as any }))}
                    className={`p-2.5 rounded-xl text-left transition-all ${
                      inputs.quality === q.id
                        ? 'bg-amber-600 text-white font-bold border border-amber-400'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/50'
                    }`}
                  >
                    <div className="text-xs font-bold">{q.label}</div>
                    <div className={`text-[10px] ${inputs.quality === q.id ? 'text-amber-100' : 'text-slate-500'}`}>
                      {q.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Extras */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Bathrooms</label>
                <select
                  value={inputs.bathroomsCount || 3}
                  onChange={(e) => setInputs(prev => ({ ...prev, bathroomsCount: parseInt(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value={1}>1 Bath</option>
                  <option value={2}>2 Baths</option>
                  <option value={3}>3 Baths</option>
                  <option value={4}>4 Baths</option>
                  <option value={5}>5+ Baths</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Kitchens</label>
                <select
                  value={inputs.kitchensCount || 2}
                  onChange={(e) => setInputs(prev => ({ ...prev, kitchensCount: parseInt(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value={1}>1 Kitchen</option>
                  <option value={2}>2 Kitchens</option>
                  <option value={3}>3 Kitchens</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Basement?</label>
                <button
                  type="button"
                  onClick={() => setInputs(prev => ({ ...prev, hasBasement: !prev.hasBasement }))}
                  className={`w-full py-1.5 px-2 rounded-lg font-semibold text-center border transition-all ${
                    inputs.hasBasement
                      ? 'bg-amber-600 text-white border-amber-400'
                      : 'bg-slate-950 text-slate-400 border-slate-700'
                  }`}
                >
                  {inputs.hasBasement ? 'Yes (+45%)' : 'No Basement'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Column */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Price Card */}
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider border border-amber-500/30">
                {result.stageLabel}
              </span>
              <span className="text-xs text-slate-400">
                Covered Area: <strong className="text-white font-mono">{result.coveredAreaSqFt.toLocaleString()} Sq Ft</strong>
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Estimated Project Cost Range:
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
                Rs. {formatLacs(result.totalCostMinPkr)} – {formatLacs(result.totalCostMaxPkr)}
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                (Approx. Rs. {result.totalCostMinPkr.toLocaleString()} – Rs. {result.totalCostMaxPkr.toLocaleString()} PKR)
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Approx Rate / Sq Ft:</span>
                <span className="font-bold text-slate-200 font-mono">
                  Rs. {result.ratePerSqFtMin.toLocaleString()} – {result.ratePerSqFtMax.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Recommended Budget:</span>
                <span className="font-bold text-amber-300 font-mono">
                  ~Rs. {formatLacs(result.recommendedBudgetPkr)}
                </span>
              </div>
            </div>

            <button
              onClick={handleWhatsAppInquiry}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50"
            >
              <Send className="w-4 h-4" />
              Get Material Package Quotation on WhatsApp
            </button>
          </div>

          {/* Category Material Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Estimated Materials & Labour Distribution
            </h3>

            <div className="space-y-2.5">
              {result.categories.map(cat => (
                <div key={cat.id} className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">{cat.name}</span>
                    <span className="font-mono font-bold text-amber-300">
                      ~Rs. {formatLacs((cat.estimatedMinPkr + cat.estimatedMaxPkr) / 2)} ({cat.percentage}%)
                    </span>
                  </div>
                  {cat.approxQuantity && (
                    <div className="text-[11px] text-emerald-400 font-mono">
                      Quantity: {cat.approxQuantity}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 leading-snug">
                    {cat.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical Disclaimer */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300/90 flex gap-2.5 items-start">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="block font-bold text-amber-200">
                ESTIMATE ONLY — NOT A STRUCTURAL ENGINEERING CALCULATION
              </strong>
              <p>{result.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
