import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Plus, 
  Trash2, 
  Send, 
  Info, 
  ShieldAlert, 
  Layers, 
  RotateCcw,
  CheckCircle2,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { 
  BricksEstimatorInputs, 
  OpeningItem, 
  BusinessConfig, 
  SmartToolsSettings 
} from '../../types';
import { 
  calculateBricksEstimate, 
  buildBricksEstimateWhatsAppMessage 
} from '../../utils/bricksEstimatorEngine';

interface BricksEstimatorProps {
  config: BusinessConfig;
  settings?: SmartToolsSettings;
}

export function BricksEstimator({ config, settings }: BricksEstimatorProps) {
  const [inputs, setInputs] = useState<BricksEstimatorInputs>({
    wallLengthFeet: 20,
    wallHeightFeet: 10,
    wallThicknessType: '9-inch',
    openings: [
      { id: '1', type: 'door', name: 'Main Door (3.5\' × 7\')', widthFeet: 3.5, heightFeet: 7, quantity: 1 },
      { id: '2', type: 'window', name: 'Window (4\' × 4\')', widthFeet: 4, heightFeet: 4, quantity: 1 }
    ],
    wastagePercent: 5
  });

  const [newOpeningType, setNewOpeningType] = useState<'door' | 'window' | 'custom'>('window');
  const [newOpeningW, setNewOpeningW] = useState<string>('4');
  const [newOpeningH, setNewOpeningH] = useState<string>('4');

  const result = useMemo(() => {
    return calculateBricksEstimate(inputs, settings);
  }, [inputs, settings]);

  const handleAddOpening = () => {
    const w = parseFloat(newOpeningW) || 3;
    const h = parseFloat(newOpeningH) || 4;
    const item: OpeningItem = {
      id: Date.now().toString(),
      type: newOpeningType,
      name: `${newOpeningType === 'door' ? 'Door' : 'Window'} (${w}' × ${h}')`,
      widthFeet: w,
      heightFeet: h,
      quantity: 1
    };
    setInputs(prev => ({
      ...prev,
      openings: [...prev.openings, item]
    }));
  };

  const handleRemoveOpening = (id: string) => {
    setInputs(prev => ({
      ...prev,
      openings: prev.openings.filter(o => o.id !== id)
    }));
  };

  const handleWhatsAppInquiry = () => {
    const phone = config.phone || "923108002863";
    const msg = buildBricksEstimateWhatsAppMessage(result);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-orange-950/40 to-slate-900 border border-orange-900/30 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-orange-500/30">
            <Boxes className="w-3.5 h-3.5" />
            Pakistani Masonry Calculator
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            🧱 Bricks Estimator
          </h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
            Calculate accurate brick quantities for 4.5" single leaf or 9" standard double leaf walls with door and window opening deductions and mortar requirements.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-5">
          {/* Wall Dimensions */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
              1. Wall Dimensions (Feet & Inches)
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Wall Length (Feet)
                </label>
                <input
                  type="number"
                  value={inputs.wallLengthFeet}
                  onChange={(e) => setInputs(prev => ({ ...prev, wallLengthFeet: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white font-mono"
                  placeholder="e.g. 20"
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
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-white font-mono"
                  placeholder="e.g. 10"
                />
              </div>
            </div>

            {/* Wall Thickness */}
            <div className="pt-2">
              <label className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Wall Thickness (Pakistani Standard):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '4.5-inch', label: '4.5" (Single Leaf)', desc: 'Partition / Parda wall' },
                  { id: '9-inch', label: '9" (Double Leaf)', desc: 'Standard exterior wall' },
                  { id: '13.5-inch', label: '13.5" (Heavy)', desc: 'Foundation / Retaining' },
                ].map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, wallThicknessType: t.id as any }))}
                    className={`p-2.5 rounded-xl text-left transition-all ${
                      inputs.wallThicknessType === t.id
                        ? 'bg-orange-600 text-white font-bold border border-orange-400 shadow-md'
                        : 'bg-slate-800 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <div className="text-xs font-bold">{t.label}</div>
                    <div className={`text-[10px] ${inputs.wallThicknessType === t.id ? 'text-orange-100' : 'text-slate-500'}`}>
                      {t.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wastage */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-semibold">Wastage / Breakage Buffer:</span>
              <div className="flex gap-1.5">
                {[3, 5, 8, 10].map(w => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, wastagePercent: w }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      inputs.wastagePercent === w
                        ? 'bg-orange-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {w}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Openings Deduction (Doors & Windows) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
            <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>2. Deduct Openings (Doors & Windows)</span>
              <span className="text-[11px] text-orange-400 font-mono">
                Total Deduction: -{result.openingsAreaSqFt} Sq Ft
              </span>
            </label>

            {/* List of existing openings */}
            <div className="space-y-2">
              {inputs.openings.map(op => (
                <div
                  key={op.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <span className="text-slate-200 font-semibold">{op.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-mono font-bold">
                      -{(op.widthFeet * op.heightFeet * op.quantity)} sq ft
                    </span>
                    <button
                      onClick={() => handleRemoveOpening(op.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                      title="Remove Opening"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Opening Form */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800">
              <select
                value={newOpeningType}
                onChange={(e) => setNewOpeningType(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
              >
                <option value="window">Window</option>
                <option value="door">Door</option>
                <option value="custom">Custom Opening</option>
              </select>
              <input
                type="number"
                value={newOpeningW}
                onChange={(e) => setNewOpeningW(e.target.value)}
                placeholder="Width ft"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
              />
              <input
                type="number"
                value={newOpeningH}
                onChange={(e) => setNewOpeningH(e.target.value)}
                placeholder="Height ft"
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddOpening}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Right Output */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Calculation Card */}
          <div className="bg-slate-900 border-2 border-orange-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold uppercase tracking-wider border border-orange-500/30">
                Recommended Masonry Order
              </span>
              <span className="text-xs text-slate-400">
                Net Masonry Area: <strong className="text-white font-mono">{result.netWallAreaSqFt} Sq Ft</strong>
              </span>
            </div>

            <div>
              <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
                Estimated Bricks Requirement:
              </div>
              <div className="text-3xl sm:text-4xl font-black text-orange-400 font-mono tracking-tight">
                ~{result.recommendedBricks.toLocaleString()} Bricks
              </div>
              <div className="text-xs text-slate-400 font-mono mt-1">
                (Range: {result.totalBricksMin.toLocaleString()} – {result.totalBricksMax.toLocaleString()} with {inputs.wastagePercent}% buffer)
              </div>
            </div>

            {/* Mortar Requirements */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Mortar Cement:</span>
                <span className="font-bold text-amber-300 font-mono text-sm">
                  ~{Math.ceil(result.approxCementBags)} Bags (50kg)
                </span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Mortar Sand (Ravi/Chenab):</span>
                <span className="font-bold text-amber-300 font-mono text-sm">
                  ~{result.approxSandCft} CFT Sand
                </span>
              </div>
            </div>

            <button
              onClick={handleWhatsAppInquiry}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50"
            >
              <Send className="w-4 h-4" />
              Inquire Bricks & Cement Order on WhatsApp
            </button>
          </div>

          {/* Detailed Calculations Breakdown */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              Calculation Breakdown
            </h3>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Gross Wall Surface Area:</span>
                <span className="font-mono font-bold text-white">{result.grossWallAreaSqFt} sq ft</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Door & Window Openings:</span>
                <span className="font-mono font-bold text-orange-400">-{result.openingsAreaSqFt} sq ft</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Net Masonry Area:</span>
                <span className="font-mono font-bold text-white">{result.netWallAreaSqFt} sq ft</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Net Wall Masonry Volume:</span>
                <span className="font-mono font-bold text-white">{result.wallVolumeCft} CFT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Base Bricks Count (without wastage):</span>
                <span className="font-mono font-bold text-white">{result.rawBricksCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span>Wastage Allowance ({inputs.wastagePercent}%):</span>
                <span className="font-mono font-bold text-orange-400">+{result.wastageBricksCount} bricks</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-800/40 text-[11px] text-orange-300/90 flex gap-2.5 items-start">
            <ShieldAlert className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="block font-bold text-orange-200">
                ESTIMATE ONLY — NOT GUARANTEED BRICK COUNT
              </strong>
              <p>{result.disclaimer}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
