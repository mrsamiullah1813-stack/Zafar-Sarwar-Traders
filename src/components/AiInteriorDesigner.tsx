import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Home, 
  Utensils, 
  Minimize2, 
  Maximize2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  ShoppingBag, 
  Share2, 
  Download, 
  Eye, 
  MessageSquare, 
  Layers, 
  Palette, 
  DollarSign, 
  Ruler, 
  Sliders, 
  X, 
  Plus, 
  Trash2, 
  Info,
  Crown,
  Building2
} from 'lucide-react';
import { Product, AiDesignerConfig, AiDesignerSelection, DesignerCategoryType } from '../types';
import { generateDesignerRecommendations, CategoryRecommendation } from '../utils/plannerRecommendationEngine';
import { trackAction } from '../utils/analyticsStorage';

interface AiInteriorDesignerProps {
  products: Product[];
  config: AiDesignerConfig;
  whatsappNumber?: string;
  onViewProduct?: (product: Product) => void;
}

export const AiInteriorDesigner: React.FC<AiInteriorDesignerProps> = ({
  products,
  config,
  whatsappNumber = "923108002863",
  onViewProduct
}) => {
  if (!config.isEnabled) return null;

  // Wizard state
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Selection parameters
  const [roomType, setRoomType] = useState<string>('Bathroom');
  const [style, setStyle] = useState<string>('Modern');
  const [colorTheme, setColorTheme] = useState<string>('Matte Black');
  const [budget, setBudget] = useState<string>('Standard');
  const [roomSize, setRoomSize] = useState<string>('Medium');

  // Exact dimensions optional
  const [lengthFt, setLengthFt] = useState<number>(8);
  const [widthFt, setWidthFt] = useState<number>(6);
  const [heightFt, setHeightFt] = useState<number>(10);
  const [useExactDimensions, setUseExactDimensions] = useState<boolean>(false);

  // Recommendation package state
  const [recommendations, setRecommendations] = useState<CategoryRecommendation[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [itemColors, setItemColors] = useState<Record<string, string>>({});

  // Product Replacement Modal state
  const [replacingCategory, setReplacingCategory] = useState<DesignerCategoryType | null>(null);

  // Saved Design / Print Summary Modal
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [shareSuccess, setShareSuccess] = useState<boolean>(false);

  // Step 1 - 5 labels
  const steps = [
    { num: 1, title: 'Room Type', icon: Home },
    { num: 2, title: 'Style', icon: Layers },
    { num: 3, title: 'Color Theme', icon: Palette },
    { num: 4, title: 'Budget', icon: DollarSign },
    { num: 5, title: 'Room Size', icon: Ruler },
  ];

  // Icon getter for room types
  const getRoomIcon = (iconName: string) => {
    switch (iconName) {
      case 'Utensils': return <Utensils className="w-6 h-6 text-amber-400" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-amber-400" />;
      case 'Minimize2': return <Minimize2 className="w-6 h-6 text-amber-400" />;
      case 'Building2': return <Building2 className="w-6 h-6 text-amber-400" />;
      default: return <Home className="w-6 h-6 text-amber-400" />;
    }
  };

  // Run AI Recommendation Engine
  const handleGeneratePackage = () => {
    const selection: AiDesignerSelection = {
      roomType,
      style,
      colorTheme,
      budget,
      roomSize,
      lengthFt: useExactDimensions ? lengthFt : undefined,
      widthFt: useExactDimensions ? widthFt : undefined,
      heightFt: useExactDimensions ? heightFt : undefined,
    };

    const results = generateDesignerRecommendations(selection, products, config);
    setRecommendations(results);

    // Default select all recommended products
    const initialIds = results.filter((r) => r.product).map((r) => r.product!.id);
    setSelectedProductIds(initialIds);

    // Default colors
    const colorMap: Record<string, string> = {};
    results.forEach((r) => {
      if (r.product) {
        colorMap[r.product.id] = r.selectedColor || colorTheme;
      }
    });
    setItemColors(colorMap);

    setIsCompleted(true);
    trackAction('search', `AI Designer: ${roomType} - ${style} - ${colorTheme}`);
  };

  // Reset wizard
  const handleStartOver = () => {
    setCurrentStep(1);
    setIsCompleted(false);
  };

  // Selected products array
  const selectedProducts = useMemo(() => {
    return recommendations
      .filter((rec) => rec.product && selectedProductIds.includes(rec.product.id))
      .map((rec) => ({
        ...rec.product!,
        recCategory: rec.categoryName,
        recNote: rec.ruleNote,
        chosenColor: itemColors[rec.product!.id] || colorTheme,
      }));
  }, [recommendations, selectedProductIds, itemColors, colorTheme]);

  // Calculate estimated price sum
  const totalPriceEstimate = useMemo(() => {
    let sum = 0;
    let hasPrice = false;

    selectedProducts.forEach((p) => {
      if (p.price && !p.hidePrice && !p.isPriceOnRequest) {
        const num = parseInt(p.price.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num > 0) {
          sum += num;
          hasPrice = true;
        }
      }
    });

    return { sum, hasPrice };
  }, [selectedProducts]);

  // Toggle item in package
  const toggleSelectProduct = (productId: string) => {
    if (selectedProductIds.includes(productId)) {
      setSelectedProductIds(selectedProductIds.filter((id) => id !== productId));
    } else {
      setSelectedProductIds([...selectedProductIds, productId]);
    }
  };

  // Change product finish/color
  const handleColorChange = (productId: string, color: string) => {
    setItemColors((prev) => ({ ...prev, [productId]: color }));
  };

  // Replace item in package
  const handleReplaceProduct = (categoryName: DesignerCategoryType, newProduct: Product) => {
    setRecommendations((prev) =>
      prev.map((rec) => {
        if (rec.categoryName === categoryName) {
          return {
            ...rec,
            product: newProduct,
            ruleNote: `Custom user selection for ${categoryName}`,
            availableColors: newProduct.availableColors || newProduct.availableFinishes || [colorTheme],
            selectedColor: (newProduct.availableColors || newProduct.availableFinishes)?.[0] || colorTheme,
          };
        }
        return rec;
      })
    );

    // Replace in selected array if previous was selected
    setSelectedProductIds((prev) => [...prev.filter((id) => id !== newProduct.id), newProduct.id]);
    setReplacingCategory(null);
  };

  // Generate WhatsApp Order Message
  const handleWhatsAppOrder = () => {
    const squareFeet = useExactDimensions ? lengthFt * widthFt : (roomSize === 'Small' ? 35 : roomSize === 'Large' ? 120 : 70);
    const dimensionsText = useExactDimensions ? `${lengthFt}ft x ${widthFt}ft (${squareFeet} sq.ft)` : `${roomSize} Scale (~${squareFeet} sq.ft)`;

    const productLines = selectedProducts
      .map(
        (p, idx) =>
          `${idx + 1}. *${p.recCategory}:* ${p.name}\n   • Finish/Color: ${p.chosenColor}\n   • Brand: ${p.brand || 'Original'}\n   • Price: ${p.price || 'Wholesale Quote'}`
      )
      .join('\n\n');

    const totalText = totalPriceEstimate.hasPrice
      ? `PKR ${(totalPriceEstimate.sum ?? 0).toLocaleString()}`
      : 'Wholesale Package Quote';

    let message = config.whatsappTemplate || `Hello Zafar Sarwar Traders! I created an interior design package:`;
    message = message
      .replace('{roomType}', roomType)
      .replace('{style}', style)
      .replace('{colorTheme}', colorTheme)
      .replace('{budget}', budget)
      .replace('{roomSize}', roomSize)
      .replace('{dimensions}', dimensionsText)
      .replace('{count}', selectedProducts.length.toString())
      .replace('{productList}', productLines)
      .replace('{totalPrice}', totalText);

    const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`, '_blank');
    trackAction('whatsapp', `AI Designer Package (${selectedProducts.length} items)`);
  };

  // Share Design Link
  const handleShareDesign = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareSuccess(true);
    setTimeout(() => setShareSuccess(false), 3000);
    trackAction('quote', `AI Designer Share: ${roomType}`);
  };

  return (
    <section id="ai-bathroom-planner" className="py-20 bg-[#030712] relative overflow-hidden text-slate-100">
      {/* Cinematic Ambient Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-600/15 via-amber-500/10 to-purple-600/15 blur-[160px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/10 blur-[140px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-widest shadow-xl backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{config.bannerTag || "CINEMATIC 3D INTERIOR DESIGN SUITE"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-white tracking-tight">
            {config.title || "AI Interior Designer"}
          </h2>

          <p className="text-slate-400 text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto">
            {config.subtitle || "Design Your Dream Bathroom in Seconds"}
          </p>
        </div>

        {/* ==================== WIZARD STEPS VIEW ==================== */}
        {!isCompleted ? (
          <div className="max-w-4xl mx-auto">
            {/* Step Progress Bar */}
            <div className="mb-10 bg-slate-900/80 border border-slate-800/80 p-4 sm:p-6 rounded-2xl backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
                <div 
                  className="absolute top-1/2 left-4 h-0.5 bg-gradient-to-r from-blue-500 to-amber-400 transition-all duration-500 -z-0" 
                  style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                />

                {steps.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.num;
                  const isDone = currentStep > step.num;

                  return (
                    <button
                      key={step.num}
                      onClick={() => setCurrentStep(step.num)}
                      className="relative z-10 flex flex-col items-center gap-1.5 group cursor-pointer"
                    >
                      <div
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950 scale-110 border-2 border-amber-400'
                            : isDone
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50'
                            : 'bg-slate-950 text-slate-500 border border-slate-800 group-hover:border-slate-700'
                        }`}
                      >
                        {isDone ? <Check className="w-5 h-5" /> : <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
                      </div>
                      <span className={`text-[10px] sm:text-xs font-semibold tracking-tight hidden sm:block ${
                        isActive ? 'text-amber-400' : isDone ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {step.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step Card Container */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 sm:p-10 backdrop-blur-2xl shadow-2xl relative overflow-hidden"
              >
                {/* STEP 1: ROOM TYPE */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">STEP 1 OF 5</span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif">Choose Room Type</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">Select the space you are planning to build or renovate.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {config.roomTypes.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => setRoomType(room.id)}
                          className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-start gap-4 relative cursor-pointer ${
                            roomType === room.id
                              ? 'bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/80 border-amber-400/80 shadow-xl shadow-blue-950/40 ring-1 ring-amber-400/30'
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                            {getRoomIcon(room.icon)}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-base">{room.label}</h4>
                              {roomType === room.id && (
                                <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{room.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 2: INTERIOR STYLE */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">STEP 2 OF 5</span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif">Choose Interior Style</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">Select your architectural & aesthetic design philosophy.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4">
                      {config.styles.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setStyle(s.id)}
                          className={`p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between relative cursor-pointer min-h-[130px] ${
                            style === s.id
                              ? 'bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/80 border-amber-400/80 shadow-xl shadow-blue-950/40 ring-1 ring-amber-400/30'
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-2">
                            <span className="font-bold text-white text-base">{s.label}</span>
                            {s.badge && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono bg-blue-950 text-blue-300 border border-blue-500/30">
                                {s.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                          {style === s.id && (
                            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-400">
                              <Check className="w-3.5 h-3.5" /> Selected Style
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 3: COLOR THEME */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">STEP 3 OF 5</span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif">Choose Color Theme</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">Select primary material finish and color tone palette.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                      {config.colorThemes.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setColorTheme(c.id)}
                          className={`p-4 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center gap-3 relative cursor-pointer ${
                            colorTheme === c.id
                              ? 'bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/80 border-amber-400/80 shadow-xl shadow-blue-950/40 ring-1 ring-amber-400/30'
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {/* Color Swatch Circle */}
                          <div 
                            className="w-12 h-12 rounded-full shadow-lg border-2 border-white/20 relative flex items-center justify-center overflow-hidden"
                            style={{ backgroundColor: c.hex }}
                          >
                            <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient || ''} opacity-80`} />
                            {colorTheme === c.id && (
                              <Check className={`w-5 h-5 relative z-10 ${c.id === 'White' || c.id === 'Marble' ? 'text-slate-900' : 'text-amber-400'}`} />
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-white text-xs block">{c.label}</span>
                            <span className="text-[10px] text-slate-400 font-light block line-clamp-1">{c.description}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: BUDGET TIER */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">STEP 4 OF 5</span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif">Choose Target Budget</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">Select budget tier to guide product tier matching.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      {config.budgetLevels.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setBudget(b.id)}
                          className={`p-5 rounded-2xl border text-left transition-all duration-300 flex items-start gap-4 relative cursor-pointer ${
                            budget === b.id
                              ? 'bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/80 border-amber-400/80 shadow-xl shadow-blue-950/40 ring-1 ring-amber-400/30'
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 shrink-0 text-amber-400">
                            {b.id === 'Luxury' ? <Crown className="w-6 h-6" /> : <DollarSign className="w-6 h-6" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-base">{b.label}</h4>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-500/30">
                                {b.priceRange || b.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">{b.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 5: ROOM SIZE & DIMENSIONS */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <span className="text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">STEP 5 OF 5</span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white font-serif">Choose Room Size</h3>
                      <p className="text-slate-400 text-xs sm:text-sm">Provide room scale or optional exact measurements.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                      {config.roomSizes.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setRoomSize(s.id)}
                          className={`p-5 rounded-2xl border text-center transition-all duration-300 flex flex-col items-center gap-2 relative cursor-pointer ${
                            roomSize === s.id
                              ? 'bg-gradient-to-br from-blue-950/80 via-slate-900 to-indigo-950/80 border-amber-400/80 shadow-xl shadow-blue-950/40 ring-1 ring-amber-400/30'
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          <Ruler className="w-6 h-6 text-amber-400 mb-1" />
                          <h4 className="font-bold text-white text-base">{s.label}</h4>
                          <span className="text-xs text-amber-300 font-mono">{s.sqftRange}</span>
                          <p className="text-[11px] text-slate-400">{s.description}</p>
                        </button>
                      ))}
                    </div>

                    {/* Optional Exact Dimensions Toggle */}
                    <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
                      <button
                        onClick={() => setUseExactDimensions(!useExactDimensions)}
                        className="flex items-center gap-2 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <Sliders className="w-4 h-4" />
                        <span>{useExactDimensions ? "▼ Hide Exact Dimension Inputs" : "+ Add Exact Room Dimensions (Feet)"}</span>
                      </button>

                      {useExactDimensions && (
                        <div className="grid grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 mb-1">Length (Feet)</label>
                            <input
                              type="number"
                              min={3}
                              max={50}
                              value={lengthFt}
                              onChange={(e) => setLengthFt(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs text-center font-mono font-bold focus:border-amber-400 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 mb-1">Width (Feet)</label>
                            <input
                              type="number"
                              min={3}
                              max={50}
                              value={widthFt}
                              onChange={(e) => setWidthFt(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs text-center font-mono font-bold focus:border-amber-400 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-mono text-slate-400 mb-1">Height (Feet)</label>
                            <input
                              type="number"
                              min={7}
                              max={20}
                              value={heightFt}
                              onChange={(e) => setHeightFt(Number(e.target.value))}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs text-center font-mono font-bold focus:border-amber-400 outline-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Wizard Controls Bottom Nav */}
                <div className="mt-10 pt-6 border-t border-slate-800/80 flex items-center justify-between gap-4">
                  <button
                    disabled={currentStep === 1}
                    onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  {currentStep < 5 ? (
                    <button
                      onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-950 transition-all"
                    >
                      <span>Next Step</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleGeneratePackage}
                      className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm hover:brightness-110 shadow-xl shadow-amber-950/40 transition-all animate-pulse"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate AI Package Now</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          /* ==================== AI RECOMMENDATIONS & PACKAGE SUMMARY VIEW ==================== */
          <div className="space-y-8">
            {/* Top Parameters Bar & Re-Run Button */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-xl bg-blue-950 text-blue-300 font-mono text-xs font-bold border border-blue-500/30">
                  Room: {roomType}
                </span>
                <span className="px-3 py-1 rounded-xl bg-amber-950 text-amber-300 font-mono text-xs font-bold border border-amber-500/30">
                  Style: {style}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs font-bold border border-slate-700">
                  Color: {colorTheme}
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-950 text-emerald-300 font-mono text-xs font-bold border border-emerald-500/30">
                  Budget: {budget}
                </span>
                <span className="px-3 py-1 rounded-xl bg-purple-950 text-purple-300 font-mono text-xs font-bold border border-purple-500/30">
                  Scale: {useExactDimensions ? `${lengthFt}x${widthFt} ft` : roomSize}
                </span>
              </div>

              <button
                onClick={handleStartOver}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Modify Specifications</span>
              </button>
            </div>

            {/* LIVE PACKAGE SUMMARY HEADER */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-950/90 via-slate-900 to-indigo-950/90 border border-blue-500/30 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-amber-400" />
                    <h3 className="text-2xl font-bold font-serif text-white">Live Package Summary</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {selectedProducts.length} certified products selected for your {style} {roomType} package.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-800 transition-all"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>Save Design</span>
                  </button>

                  <button
                    onClick={handleShareDesign}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-800 transition-all relative"
                  >
                    <Share2 className="w-4 h-4 text-blue-400" />
                    <span>{shareSuccess ? "Copied Link!" : "Share Design"}</span>
                  </button>

                  <button
                    onClick={handleWhatsAppOrder}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs hover:brightness-110 shadow-xl shadow-emerald-950 transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Order Package on WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Selected Thumbnails Strip */}
              <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                {selectedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 text-xs"
                  >
                    <img src={p.image} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                    <div>
                      <span className="font-bold text-white block line-clamp-1 max-w-[120px]">{p.name}</span>
                      <span className="text-[10px] text-amber-400 font-mono">{p.chosenColor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* RECOMMENDATION CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec) => {
                const p = rec.product;
                if (!p) return null;

                const isSelected = selectedProductIds.includes(p.id);
                const currentFinish = itemColors[p.id] || colorTheme;

                return (
                  <motion.div
                    key={rec.categoryName}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className={`rounded-3xl border p-5 backdrop-blur-2xl transition-all duration-300 flex flex-col justify-between relative group ${
                      isSelected
                        ? 'bg-slate-900/90 border-slate-800 hover:border-amber-500/50 shadow-2xl'
                        : 'bg-slate-950/60 border-slate-800/60 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Top Category Badge & Select Toggle */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-950 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                          {rec.categoryName}
                        </span>

                        <button
                          onClick={() => toggleSelectProduct(p.id)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                          <span>{isSelected ? "Selected" : "Add"}</span>
                        </button>
                      </div>

                      {/* Product Image */}
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800/80 group-hover:border-amber-500/30 transition-all">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                        
                        {p.brand && (
                          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[10px] font-bold text-white backdrop-blur-md">
                            {p.brand}
                          </span>
                        )}

                        {p.price && !p.hidePrice && (
                          <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-xs font-black font-mono shadow-lg">
                            {p.price}
                          </span>
                        )}
                      </div>

                      {/* Title & Match Note */}
                      <div className="space-y-1.5">
                        <h4 className="font-bold text-white text-base font-serif leading-snug line-clamp-1">
                          {p.name}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {p.description}
                        </p>
                        
                        {rec.ruleNote && (
                          <div className="flex items-start gap-1.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-amber-300/90 font-light">
                            <Info className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                            <span className="line-clamp-2">{rec.ruleNote}</span>
                          </div>
                        )}
                      </div>

                      {/* Finish / Color Selectors */}
                      {rec.availableColors && rec.availableColors.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                            Select Finish / Color:
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {rec.availableColors.map((color) => (
                              <button
                                key={color}
                                onClick={() => handleColorChange(p.id, color)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                  currentFinish === color
                                    ? 'bg-amber-400 text-slate-950 shadow-md font-mono'
                                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                                }`}
                              >
                                {color}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onViewProduct && onViewProduct(p)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-900 hover:text-white transition-all cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        <span>View Details</span>
                      </button>

                      <button
                        onClick={() => setReplacingCategory(rec.categoryName)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-900 hover:text-amber-400 transition-all cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                        <span>Replace</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ==================== PRODUCT REPLACEMENT MODAL ==================== */}
      <AnimatePresence>
        {replacingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-bold font-serif text-white">Select Replacement Product</h3>
                  <p className="text-xs text-slate-400">Choose an alternative item for <strong className="text-amber-400">{replacingCategory}</strong></p>
                </div>

                <button
                  onClick={() => setReplacingCategory(null)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Grid inside Modal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {products
                  .filter((p) => !config.productTags?.[p.id]?.hidden)
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => replacingCategory && handleReplaceProduct(replacingCategory, p)}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-amber-400 transition-all flex items-start gap-4 cursor-pointer group"
                    >
                      <img src={p.image} alt={p.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors line-clamp-1">{p.name}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{p.description}</p>
                        {p.price && <span className="text-xs font-mono font-bold text-amber-400 block">{p.price}</span>}
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== SAVE DESIGN / PRINT SUMMARY MODAL ==================== */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative text-slate-100"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-xl font-bold font-serif text-white">Your Saved Interior Design</h3>
                </div>

                <button
                  onClick={() => setShowSaveModal(false)}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Design Print Preview Card */}
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
                <div className="border-b border-slate-800 pb-3 flex justify-between">
                  <div>
                    <strong className="text-white block font-serif text-sm">ZAFAR SARWAR TRADERS</strong>
                    <span className="text-slate-400 text-[10px]">AI INTERIOR DESIGN CERTIFICATE</span>
                  </div>
                  <span className="text-amber-400 font-bold">{new Date().toLocaleDateString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-300">
                  <div>• Room Type: <strong className="text-white">{roomType}</strong></div>
                  <div>• Style: <strong className="text-white">{style}</strong></div>
                  <div>• Color Theme: <strong className="text-white">{colorTheme}</strong></div>
                  <div>• Target Budget: <strong className="text-white">{budget}</strong></div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-amber-400 font-bold block">SELECTED ITEMS ({selectedProducts.length}):</span>
                  {selectedProducts.map((p, idx) => (
                    <div key={p.id} className="flex justify-between text-slate-300">
                      <span>{idx + 1}. {p.name} ({p.chosenColor})</span>
                      <span className="text-white font-bold">{p.price || 'Wholesale'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
                >
                  🖨️ Print Design Summary
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500"
                >
                  Send to WhatsApp
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
};

// Export as BathroomPlanner for backwards compatibility with imports
export const BathroomPlanner = AiInteriorDesigner;
