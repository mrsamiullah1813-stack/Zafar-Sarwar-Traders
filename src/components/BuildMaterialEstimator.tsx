import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  HardHat, 
  Building2, 
  Home, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  Copy, 
  Check, 
  RefreshCw, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Sliders, 
  Info, 
  Package, 
  Truck,
  Plus,
  Minus,
  ExternalLink
} from 'lucide-react';
import { 
  Product, 
  BusinessConfig, 
  BuildMaterialEstimatorConfig, 
  BuildMaterialEstimatorInputs 
} from '../types';
import { defaultBuildMaterialEstimatorConfig } from '../data/defaultEstimatorConfig';
import { calculateCementEstimate, getAvailableCementProducts } from '../utils/cementEstimatorEngine';

interface BuildMaterialEstimatorProps {
  products: Product[];
  config: BusinessConfig;
  estimatorConfig?: BuildMaterialEstimatorConfig;
  onOpenQuickView?: (product: Product) => void;
}

export const BuildMaterialEstimator: React.FC<BuildMaterialEstimatorProps> = ({
  products,
  config,
  estimatorConfig = defaultBuildMaterialEstimatorConfig,
  onOpenQuickView
}) => {
  const currentConfig = estimatorConfig || defaultBuildMaterialEstimatorConfig;

  // Initial user input state
  const [inputs, setInputs] = useState<BuildMaterialEstimatorInputs>({
    projectType: 'new-house',
    houseSizeId: '5-marla',
    customMarla: 5,
    coveredAreaSqFt: 1800,
    floorId: 'ground-1',
    customFloorsCount: 2,
    constructionTypeId: 'grey-structure',
    qualityId: 'standard',
    selectedOptionalFactors: ['rcc-slab', 'additional-concrete', 'boundary-wall'],
    bathroomsCount: 4
  });

  const [copied, setCopied] = useState(false);
  const [showFactorsBreakdown, setShowFactorsBreakdown] = useState(false);

  // Deterministic calculation
  const result = useMemo(() => {
    return calculateCementEstimate(inputs, currentConfig);
  }, [inputs, currentConfig]);

  // Dynamically resolve cement products from catalog
  const cementProducts = useMemo(() => {
    return getAvailableCementProducts(products, currentConfig.cementCategorySlug || 'cement');
  }, [products, currentConfig.cementCategorySlug]);

  // Handle house size preset selection
  const handleSelectHouseSize = (sizeId: string) => {
    const matched = currentConfig.houseSizes?.find(h => h.id === sizeId);
    if (matched) {
      setInputs(prev => ({
        ...prev,
        houseSizeId: sizeId,
        customMarla: matched.marlaCount || (sizeId === '1-kanal' ? 20 : 5),
        coveredAreaSqFt: matched.defaultCoveredAreaSqFt || prev.coveredAreaSqFt
      }));
    } else {
      setInputs(prev => ({ ...prev, houseSizeId: sizeId }));
    }
  };

  // Adjust covered area with numeric stepper buttons
  const handleAdjustCoveredArea = (delta: number) => {
    setInputs(prev => ({
      ...prev,
      coveredAreaSqFt: Math.max(200, Math.min(50000, Number(prev.coveredAreaSqFt || 0) + delta))
    }));
  };

  // Toggle optional construction factor
  const handleToggleFactor = (factorId: string) => {
    setInputs(prev => {
      const exists = prev.selectedOptionalFactors.includes(factorId);
      const updated = exists
        ? prev.selectedOptionalFactors.filter(id => id !== factorId)
        : [...prev.selectedOptionalFactors, factorId];
      return { ...prev, selectedOptionalFactors: updated };
    });
  };

  // Reset to default standard 5 Marla parameters
  const handleReset = () => {
    setInputs({
      projectType: 'new-house',
      houseSizeId: '5-marla',
      customMarla: 5,
      coveredAreaSqFt: 1800,
      floorId: 'ground-1',
      customFloorsCount: 2,
      constructionTypeId: 'grey-structure',
      qualityId: 'standard',
      selectedOptionalFactors: ['rcc-slab', 'additional-concrete', 'boundary-wall'],
      bathroomsCount: 4
    });
  };

  // Build WhatsApp Inquiry Message URL
  const handleWhatsAppInquiry = (productName?: string) => {
    const phone = config.whatsapp || config.phone || '+923108002863';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    const matchedSize = currentConfig.houseSizes?.find(h => h.id === inputs.houseSizeId);
    const sizeName = matchedSize ? matchedSize.name : `${inputs.coveredAreaSqFt} sq ft`;
    const floorsName = result.appliedMultipliers.floors.name;
    const constType = result.appliedMultipliers.constructionType.name;
    const bagsRange = `${result.minEstimatedBags.toLocaleString()} - ${result.maxEstimatedBags.toLocaleString()}`;

    let text = `*ZAFAR SARWAR TRADERS — CEMENT ESTIMATE INQUIRY*\n\n` +
      `Assalam-o-Alaikum,\nI calculated cement requirement for my construction project on your website:\n\n` +
      `• *House Size:* ${sizeName}\n` +
      `• *Covered Area:* ${inputs.coveredAreaSqFt.toLocaleString()} sq ft\n` +
      `• *Structure:* ${floorsName} (${constType})\n` +
      `• *Estimated Bags:* ${bagsRange} Bags (50kg)\n` +
      `• *Recommended Buffer:* ${result.recommendedBags.toLocaleString()} Bags\n\n`;

    if (productName) {
      text += `I am interested in ordering: *${productName}*.\n`;
    }

    text += `Please share current per-bag wholesale rate, brand options (Falcon / Bestway / Maple Leaf / Cherat / Lucky / Fauji), and delivery timeframe for our site.`;

    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copy structured estimate to clipboard
  const handleCopyEstimate = () => {
    const text = `ZAFAR SARWAR TRADERS — CEMENT ESTIMATION SUMMARY\n` +
      `--------------------------------------------------\n` +
      `Covered Area: ${inputs.coveredAreaSqFt.toLocaleString()} sq ft\n` +
      `Building Type: ${result.appliedMultipliers.floors.name} (${result.appliedMultipliers.constructionType.name})\n` +
      `Quality Grade: ${result.appliedMultipliers.quality.name}\n` +
      `Estimated Requirement: ${result.minEstimatedBags.toLocaleString()} – ${result.maxEstimatedBags.toLocaleString()} Bags (50kg each)\n` +
      `Recommended Planning Buffer: ${result.recommendedBags.toLocaleString()} Bags\n\n` +
      `*Notice: Ye sirf ek estimated calculation hai. Final quantity ke liye approved structural drawings aur qualified engineer ki calculation ko priority dein.\n\n` +
      `Official Supplier: Zafar Sarwar Traders (+92 310 8002863)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <section id="cement-estimator" className="py-12 sm:py-16 bg-slate-950 text-slate-100 relative overflow-hidden border-t border-b border-slate-800">
      
      {/* Subtle architectural grid pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 shadow-inner">
            <HardHat className="w-4 h-4 text-amber-400" />
            <span>{currentConfig.tagline || 'DIRECT DISTRIBUTOR CIVIL CALCULATION ENGINE'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-serif font-black text-white tracking-tight">
            {currentConfig.title || 'Build Material & Cement Estimator'}
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 font-light leading-relaxed">
            {currentConfig.subtitle || 'Estimate Grade 53 cement requirements for your house construction in Pakistan.'}
          </p>
        </div>

        {/* MAIN INTERACTIVE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: INTERACTIVE PARAMETER SELECTOR (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* STEP 1: WHAT ARE YOU BUILDING */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Step 1 — What are you building?</span>
                </label>
                <span className="text-[11px] text-slate-400">Project Nature</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'new-house', label: 'New House', icon: Home },
                  { id: 'renovation', label: 'Renovation', icon: Sliders },
                  { id: 'extension', label: 'Extension', icon: Layers },
                  { id: 'other', label: 'Other Work', icon: HardHat }
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = inputs.projectType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, projectType: item.id }))}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-950'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: HOUSE SIZE SELECTION (PAKISTAN PRESETS) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  <span>Step 2 — House Size (Pakistan Marla / Kanal)</span>
                </label>
                <span className="text-[11px] text-slate-400">Standard Sizes</span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {currentConfig.houseSizes?.map(size => {
                  const isSelected = inputs.houseSizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      type="button"
                      onClick={() => handleSelectHouseSize(size.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all relative flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white font-bold shadow-md shadow-blue-950'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white font-medium'
                      }`}
                    >
                      {size.popular && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[9px] font-black uppercase rounded-full tracking-tighter">
                          Popular
                        </span>
                      )}
                      <span className="text-xs sm:text-sm">{size.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Clarification text about Plot size vs Covered Area */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-300">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="text-white">Aham Maloomat:</strong> Plot size aur covered area different ho sakte hain. Behtar aur accurate estimate ke liye niche apna actual <strong className="text-blue-400">Covered Area (Sq Ft)</strong> adjust karein.
                </p>
              </div>
            </div>

            {/* STEP 3: COVERED AREA ADJUSTMENT */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  <span>Step 3 — Total Covered Area (Square Feet)</span>
                </label>
                <span className="text-xs font-mono text-amber-400 font-bold">
                  ≈ {(inputs.coveredAreaSqFt / (currentConfig.sqFtPerMarla || 225)).toFixed(1)} Marla footprint
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full sm:w-1/2">
                  <input
                    type="number"
                    min="100"
                    max="100000"
                    step="50"
                    value={inputs.coveredAreaSqFt || ''}
                    onChange={(e) => setInputs(prev => ({ ...prev, coveredAreaSqFt: Number(e.target.value) || 0 }))}
                    className="w-full pl-4 pr-16 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base sm:text-lg font-bold focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="1800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 uppercase">
                    Sq Ft
                  </span>
                </div>

                {/* Quick Stepper Adjustments */}
                <div className="flex items-center gap-2 w-full sm:w-1/2 justify-between sm:justify-start">
                  <button
                    type="button"
                    onClick={() => handleAdjustCoveredArea(-500)}
                    className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-300"
                  >
                    -500
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCoveredArea(-100)}
                    className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-300"
                  >
                    -100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCoveredArea(100)}
                    className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-300"
                  >
                    +100
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustCoveredArea(500)}
                    className="px-2.5 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-800 text-xs font-mono text-slate-300"
                  >
                    +500
                  </button>
                </div>
              </div>
            </div>

            {/* STEP 4 & STEP 5: FLOORS & CONSTRUCTION TYPE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Floors */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>Step 4 — Number of Floors</span>
                </label>

                <div className="space-y-2">
                  {currentConfig.floorsOptions?.map(floor => {
                    const isSelected = inputs.floorId === floor.id;
                    return (
                      <button
                        key={floor.id}
                        type="button"
                        onClick={() => setInputs(prev => ({ ...prev, floorId: floor.id }))}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span>{floor.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Construction Type */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <HardHat className="w-4 h-4" />
                  <span>Step 5 — Construction Type</span>
                </label>

                <div className="space-y-2">
                  {currentConfig.constructionTypes?.map(cType => {
                    const isSelected = inputs.constructionTypeId === cType.id;
                    return (
                      <button
                        key={cType.id}
                        type="button"
                        onClick={() => setInputs(prev => ({ ...prev, constructionTypeId: cType.id }))}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{cType.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{cType.description}</div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* STEP 6 & STEP 7: QUALITY & OPTIONAL DETAILS */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Step 6 & 7 — Quality Grade & Optional Structural Features</span>
                </label>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Quality Grade Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentConfig.qualityOptions?.map(q => {
                  const isSelected = inputs.qualityId === q.id;
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setInputs(prev => ({ ...prev, qualityId: q.id }))}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span>{q.name}</span>
                        {q.badge && (
                          <span className="px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 text-[10px] font-bold">
                            {q.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-normal leading-tight">{q.description}</p>
                    </button>
                  );
                })}
              </div>

              {/* Optional Structural Factors Checkboxes */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Optional Construction Factors:
                </span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentConfig.optionalFactors?.map(factor => {
                    const isChecked = inputs.selectedOptionalFactors.includes(factor.id);
                    return (
                      <label
                        key={factor.id}
                        onClick={() => handleToggleFactor(factor.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-start gap-2.5 transition-all select-none ${
                          isChecked
                            ? 'bg-blue-950/40 border-blue-500/60 text-white'
                            : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-0 focus:ring-offset-0 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-xs text-slate-200">{factor.label}</div>
                          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{factor.description}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Bathrooms Stepper */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Number of Bathrooms & Wet Areas</span>
                  <span className="text-[10px] text-slate-400">Includes screed, plumbing bed & tile plaster cement</span>
                </div>

                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, bathroomsCount: Math.max(0, (prev.bathroomsCount || 0) - 1) }))}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-bold text-white w-5 text-center">
                    {inputs.bathroomsCount ?? 4}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInputs(prev => ({ ...prev, bathroomsCount: (prev.bathroomsCount || 0) + 1 }))}
                    className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

          </div>

          {/* RIGHT COLUMN: LIVE ESTIMATE RESULT CARD + MANDATORY DISCLAIMER + CEMENT PRODUCTS (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* HERO CALCULATION RESULT CARD */}
            <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-blue-950/70 to-slate-900 border-2 border-blue-500/40 shadow-2xl shadow-blue-950/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <HardHat className="w-32 h-32 text-blue-400" />
              </div>

              {/* Active Summary Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-400/40 text-blue-300 text-[11px] font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {inputs.coveredAreaSqFt.toLocaleString()} sq ft • {result.appliedMultipliers.floors.name} • {result.appliedMultipliers.constructionType.name}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold font-mono">
                  Estimated Cement Requirement
                </span>
                
                {/* Big Metric Display */}
                <div className="flex items-baseline gap-2 pt-1 pb-2">
                  <span className="text-3xl sm:text-5xl font-mono font-black text-white tracking-tight">
                    {result.minEstimatedBags.toLocaleString()} – {result.maxEstimatedBags.toLocaleString()}
                  </span>
                  <span className="text-base sm:text-xl font-bold text-amber-400">
                    Bags
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-light">
                  Standard 50kg bags of Grade 53 / 43 Portland Cement
                </p>
              </div>

              {/* Recommended Planning Estimate */}
              <div className="mt-5 p-4 rounded-2xl bg-blue-900/40 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300 block">
                    Recommended Planning Buffer:
                  </span>
                  <span className="text-lg sm:text-xl font-mono font-black text-white">
                    ≈ {result.recommendedBags.toLocaleString()} Bags
                  </span>
                </div>
                <span className="text-[11px] text-slate-300 text-right max-w-[150px] leading-tight">
                  Includes site handling, lintels & wastage buffer
                </span>
              </div>

              {/* Multiplier Details Collapsible Toggle */}
              <div className="mt-5 pt-4 border-t border-blue-900/60">
                <button
                  type="button"
                  onClick={() => setShowFactorsBreakdown(!showFactorsBreakdown)}
                  className="w-full flex items-center justify-between text-xs text-blue-300 hover:text-blue-200 font-semibold"
                >
                  <span>Calculation Multipliers Breakdown</span>
                  <span>{showFactorsBreakdown ? '▲ Hide' : '▼ Show Details'}</span>
                </button>

                {showFactorsBreakdown && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 font-mono animate-fadeIn">
                    <div className="flex justify-between">
                      <span>Covered Area:</span>
                      <span className="text-white font-bold">{result.coveredAreaSqFt.toLocaleString()} sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Base Civil Rate:</span>
                      <span className="text-white">{result.appliedMultipliers.baseRate} bags/sq ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Structure ({result.appliedMultipliers.constructionType.name}):</span>
                      <span className="text-white">{result.appliedMultipliers.constructionType.multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Floors ({result.appliedMultipliers.floors.name}):</span>
                      <span className="text-white">{result.appliedMultipliers.floors.multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality Grade ({result.appliedMultipliers.quality.name}):</span>
                      <span className="text-white">{result.appliedMultipliers.quality.multiplier}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Optional Features:</span>
                      <span className="text-emerald-400">+{(result.appliedMultipliers.optionalAdjustmentsTotalPercentage * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Washroom Screeds:</span>
                      <span className="text-amber-400">+{result.appliedMultipliers.bathroomBags} bags</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleWhatsAppInquiry()}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Get Wholesale Rate</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyEstimate}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
                </button>
              </div>

            </div>

            {/* MANDATORY PAKISTAN DISCLAIMER & CIVIL FACTORS CARD */}
            <div className="p-5 sm:p-6 rounded-3xl bg-amber-950/30 border border-amber-500/30 text-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-300 leading-snug">
                    {currentConfig.disclaimerHeading || '⚠️ Ye sirf ek estimated calculation hai. Actual cement requirement is se kam ya zyada ho sakti hai.'}
                  </h4>
                  <p className="text-[11px] text-amber-200/80 leading-relaxed">
                    {currentConfig.disclaimerText || 'Actual quantity in cheezon par depend karti hai:'}
                  </p>
                </div>
              </div>

              {/* Factors Bullet Points List */}
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-300 pt-2 border-t border-amber-500/20 list-disc list-inside">
                {(currentConfig.factorsList || [
                  'Covered area',
                  'Architectural plan & design',
                  'Floors quantity',
                  'Foundation depth',
                  'Soil condition',
                  'RCC slab design',
                  'Columns & beams size',
                  'Walls & concrete work',
                  'Boundary wall construction',
                  'Engineer structural specs',
                  'Concrete mix ratio',
                  'Site conditions'
                ]).map((factor, idx) => (
                  <li key={idx} className="truncate">
                    {factor}
                  </li>
                ))}
              </ul>

              {/* Engineering Warning Takeaway */}
              <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-500/40 text-[11px] text-amber-300 font-bold leading-relaxed">
                👉 {currentConfig.engineeringWarningText || 'Final quantity ke liye approved architectural/structural drawings aur qualified engineer ki calculation ko priority dein.'}
              </div>
            </div>

            {/* AVAILABLE CEMENT PRODUCTS IN SHOWROOM */}
            {currentConfig.enableCementProducts !== false && (
              <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Available Cement Brands in Showroom</span>
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    <span>Direct Site Delivery</span>
                  </span>
                </div>

                {cementProducts.length > 0 ? (
                  <div className="space-y-3">
                    {cementProducts.slice(0, 3).map(product => (
                      <div
                        key={product.id}
                        className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80'}
                            alt={product.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{product.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">
                              Brand: <strong className="text-slate-300">{product.brand || 'ZST'}</strong>
                            </p>
                            <p className="text-[11px] font-bold text-blue-400 font-mono mt-0.5">
                              {product.price || 'Wholesale Price on Request'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onOpenQuickView && (
                            <button
                              type="button"
                              onClick={() => onOpenQuickView(product)}
                              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
                              title="View Product Specs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleWhatsAppInquiry(product.name)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>Order</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-950 text-center text-xs text-slate-400 space-y-2">
                    <p>Official distributors for Falcon, Bestway, Maple Leaf, Fauji, Cherat and Lucky Cement.</p>
                    <button
                      type="button"
                      onClick={() => handleWhatsAppInquiry('Bulk Portland Cement')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Request Cement Brand Availability</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
