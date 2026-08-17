import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Home, 
  Check, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  ShoppingBag, 
  RotateCcw, 
  Crown, 
  Building2, 
  Droplet, 
  ShowerHead, 
  Pipette, 
  Wrench, 
  PhoneCall, 
  ShieldCheck, 
  Truck, 
  Info,
  Layers,
  Palette,
  DollarSign,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Product, EasyBathroomPlannerConfig, BathroomPackageItem, EasyBathroomPlannerResult } from '../types';
import { defaultEasyBathroomPlannerConfig } from '../data/defaultPlannerConfig';
import { generateBathroomPackage, buildPlannerWhatsAppMessage, formatPKR } from '../utils/bathroomPlannerEngine';
import { trackAction } from '../utils/analyticsStorage';

interface BathroomPlannerProps {
  products: Product[];
  config?: EasyBathroomPlannerConfig | any;
  whatsappNumber?: string;
  onAddToCart?: (product: Product, quantity: number, color?: string) => void;
  onViewProduct?: (product: Product) => void;
}

export const BathroomPlanner: React.FC<BathroomPlannerProps> = ({
  products = [],
  config = defaultEasyBathroomPlannerConfig,
  whatsappNumber = "923108002863",
  onAddToCart,
  onViewProduct
}) => {
  const plannerConfig: EasyBathroomPlannerConfig = {
    ...defaultEasyBathroomPlannerConfig,
    ...(config || {})
  };

  if (!plannerConfig.isEnabled) return null;

  // Wizard state: Step 1 to 4, then Step 5 is the Result Package
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGenerated, setIsGenerated] = useState<boolean>(false);

  // User selections
  const [selectedBathroomType, setSelectedBathroomType] = useState<string>(plannerConfig.bathroomTypes[0]?.id || 'master');
  const [selectedFixtures, setSelectedFixtures] = useState<string[]>(
    plannerConfig.fixtures.map(f => f.id)
  );
  const [selectedStyle, setSelectedStyle] = useState<string>(plannerConfig.styles[0]?.id || 'chrome');
  const [selectedBudget, setSelectedBudget] = useState<string>(plannerConfig.budgetTiers[1]?.id || 'standard');

  // Custom package items state in result screen
  const [packageItems, setPackageItems] = useState<BathroomPackageItem[]>([]);
  const [cartAddedNotice, setCartAddedNotice] = useState<boolean>(false);

  // Step definitions
  const steps = [
    { num: 1, title: 'Bathroom Type', urdu: 'باتھ روم کی قسم', icon: Home },
    { num: 2, title: 'Fixtures Needed', urdu: 'ضروری سامان', icon: Layers },
    { num: 3, title: 'Style & Color', urdu: 'اسٹائل اور رنگ', icon: Palette },
    { num: 4, title: 'Budget Range', urdu: 'آپ کا بجٹ', icon: DollarSign },
  ];

  // Icon selector helper
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'Crown': return <Crown className="w-6 h-6 text-amber-500" />;
      case 'Building2': return <Building2 className="w-6 h-6 text-blue-500" />;
      case 'Sparkles': return <Sparkles className="w-6 h-6 text-cyan-500" />;
      case 'Toilet': return <div className="text-xl">🚽</div>;
      case 'Droplet': return <Droplet className="w-6 h-6 text-blue-400" />;
      case 'ShowerHead': return <ShowerHead className="w-6 h-6 text-indigo-400" />;
      case 'Pipette': return <Pipette className="w-6 h-6 text-emerald-400" />;
      case 'Wrench': return <Wrench className="w-6 h-6 text-amber-400" />;
      default: return <Home className="w-6 h-6 text-emerald-500" />;
    }
  };

  // Toggle single fixture selection
  const handleToggleFixture = (fixtureId: string) => {
    setSelectedFixtures(prev => 
      prev.includes(fixtureId) ? prev.filter(id => id !== fixtureId) : [...prev, fixtureId]
    );
  };

  // Select all or deselect all fixtures
  const handleSelectAllFixtures = () => {
    setSelectedFixtures(plannerConfig.fixtures.map(f => f.id));
  };
  const handleDeselectAllFixtures = () => {
    setSelectedFixtures([]);
  };

  // When bathroom type is chosen, update recommended fixtures
  const handleSelectType = (typeId: string) => {
    setSelectedBathroomType(typeId);
    const chosenType = plannerConfig.bathroomTypes.find(t => t.id === typeId);
    if (chosenType && chosenType.recommendedFixtures) {
      setSelectedFixtures(chosenType.recommendedFixtures);
    }
  };

  // Generate Package
  const handleGenerate = () => {
    if (selectedFixtures.length === 0) {
      alert('Please select at least 1 fixture or sanitary item to continue.');
      return;
    }

    const result = generateBathroomPackage(
      {
        bathroomTypeId: selectedBathroomType,
        selectedFixtures,
        styleId: selectedStyle,
        budgetTierId: selectedBudget
      },
      products,
      plannerConfig
    );

    setPackageItems(result.items);
    setIsGenerated(true);
    setCurrentStep(5);

    trackAction('search', `Bathroom Planner: ${selectedBathroomType} - ${selectedStyle} - ${selectedBudget}`);
  };

  // Toggle item inclusion in result package
  const handleTogglePackageItem = (fixtureId: string) => {
    setPackageItems(prev => 
      prev.map(item => 
        item.fixtureId === fixtureId ? { ...item, isIncluded: !item.isIncluded } : item
      )
    );
  };

  // Calculate current package totals
  const currentResult: EasyBathroomPlannerResult = useMemo(() => {
    const includedItems = packageItems.filter(i => i.isIncluded);
    const total = includedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const bt = plannerConfig.bathroomTypes.find(t => t.id === selectedBathroomType);
    const st = plannerConfig.styles.find(s => s.id === selectedStyle);
    const bg = plannerConfig.budgetTiers.find(b => b.id === selectedBudget);

    return {
      inputs: {
        bathroomTypeId: selectedBathroomType,
        selectedFixtures,
        styleId: selectedStyle,
        budgetTierId: selectedBudget
      },
      bathroomTypeName: bt?.name || 'Bathroom',
      styleName: st?.name || 'Classic Chrome',
      budgetTierName: bg?.name || 'Standard',
      items: packageItems,
      totalPackagePrice: total,
      totalItemsCount: includedItems.length
    };
  }, [packageItems, selectedBathroomType, selectedStyle, selectedBudget, selectedFixtures, plannerConfig]);

  // Add all included items to shopping cart
  const handleAddAllToCart = () => {
    if (!onAddToCart) return;
    const included = packageItems.filter(i => i.isIncluded);
    included.forEach(item => {
      onAddToCart(item.product, item.quantity, item.selectedColor);
    });
    setCartAddedNotice(true);
    setTimeout(() => setCartAddedNotice(false), 4000);
  };

  // Reset planner
  const handleReset = () => {
    setCurrentStep(1);
    setIsGenerated(false);
  };

  return (
    <section id="bathroom-planner" className="py-14 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900/60 dark:to-slate-950/80 border-y border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>4-Step Quick Planning Wizard</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-serif tracking-tight">
            {plannerConfig.title}
          </h2>

          <p className="text-sm font-arabic text-emerald-800 dark:text-emerald-400 font-medium">
            {plannerConfig.urduSubtitle}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-normal max-w-xl mx-auto">
            {plannerConfig.subtitle}
          </p>
        </div>

        {/* Progress Bar & Steps Tabs */}
        {!isGenerated && (
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-2xl mx-auto">
              {steps.map((s) => {
                const isActive = currentStep === s.num;
                const isPast = currentStep > s.num;
                return (
                  <button
                    key={s.num}
                    type="button"
                    onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                    disabled={s.num > currentStep}
                    className={`flex flex-col items-center p-2.5 sm:p-3 rounded-2xl text-center transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/30 font-semibold' 
                        : isPast 
                          ? 'bg-white dark:bg-slate-800/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' 
                          : 'bg-white/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-[11px] uppercase tracking-wider mb-1 font-mono">
                      <span>Step {s.num}</span>
                      {isPast && <Check className="w-3 h-3 text-emerald-500 stroke-[3]" />}
                    </div>
                    <span className="text-xs sm:text-sm font-bold truncate max-w-full">{s.title}</span>
                    <span className="hidden sm:inline-block text-[10px] opacity-75 font-arabic mt-0.5">{s.urdu}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Wizard Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          
          <AnimatePresence mode="wait">
            {/* STEP 1: BATHROOM TYPE */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-8 space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Question 1 of 4
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Select Your Bathroom Type (باتھ روم کی قسم منتخب کریں)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Choose the room you are building or renovating. This helps auto-select the right fixtures for you.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plannerConfig.bathroomTypes.map((type) => {
                    const isSelected = selectedBathroomType === type.id;
                    return (
                      <div
                        key={type.id}
                        onClick={() => handleSelectType(type.id)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                            {getIconComponent(type.icon)}
                          </div>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                            <span>{type.name}</span>
                          </h4>
                          <p className="text-xs font-arabic text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                            {type.urduName}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step 1 Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Selected: <strong className="text-slate-900 dark:text-white">{plannerConfig.bathroomTypes.find(t => t.id === selectedBathroomType)?.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                  >
                    <span>Next: Fixtures Needed</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: FIXTURES NEEDED */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-8 space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Question 2 of 4
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                      What Fixtures Do You Need? (آپ کو کیا کیا سامان چاہیے؟)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Check all items you plan to buy. We will assemble them into a matching set.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFixtures}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAllFixtures}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold hover:bg-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {plannerConfig.fixtures.map((fix) => {
                    const isChecked = selectedFixtures.includes(fix.id);
                    return (
                      <div
                        key={fix.id}
                        onClick={() => handleToggleFixture(fix.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-sm'
                            : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100 bg-slate-50/50 dark:bg-slate-900/50'
                        }`}
                      >
                        <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border shrink-0 ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {fix.name}
                          </h4>
                          <p className="text-[11px] font-arabic text-emerald-800 dark:text-emerald-400 font-medium truncate mt-0.5">
                            {fix.urduName}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {fix.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step 2 Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedFixtures.length === 0) {
                        alert('Please select at least 1 item.');
                        return;
                      }
                      setCurrentStep(3);
                    }}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                  >
                    <span>Next: Style & Color ({selectedFixtures.length} chosen)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: STYLE & COLOR */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-8 space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Question 3 of 4
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Choose Your Favorite Style & Color (پسندیدہ اسٹائل اور رنگ)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    We will color-match all faucets, showers, and accessories in this consistent finish.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plannerConfig.styles.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    return (
                      <div
                        key={style.id}
                        onClick={() => setSelectedStyle(style.id)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 shadow-md"
                              style={{ backgroundColor: style.colorHex }}
                            />
                            {style.badge && (
                              <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                                {style.badge}
                              </span>
                            )}
                          </div>

                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {style.name}
                          </h4>
                          <p className="text-xs font-arabic text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                            {style.urduName}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                            {style.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step 3 Footer */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
                  >
                    <span>Next: Budget Range</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: BUDGET TIER */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 sm:p-8 space-y-6"
              >
                <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Question 4 of 4
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    Select Your Preferred Budget Range (بجٹ کی حد منتخب کریں)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    We offer genuine certified products across all price tiers — from budget economy to imported luxury.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {plannerConfig.budgetTiers.map((tier) => {
                    const isSelected = selectedBudget === tier.id;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedBudget(tier.id)}
                        className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/40 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold font-mono">
                            {tier.priceRange}
                          </span>

                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${
                            isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">
                            {tier.name}
                          </h4>
                          <p className="text-xs font-arabic text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                            {tier.urduName}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                            {tier.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Step 4 Footer / Generate Action */}
                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold shadow-xl shadow-emerald-600/30 transition-all flex items-center gap-2 transform active:scale-95"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate My Bathroom Package (پیکج بنائیں)</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5 / RESULT SCREEN: COMPLETE SANITARY PACKAGE */}
            {isGenerated && currentStep === 5 && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 sm:p-8 space-y-8"
              >
                {/* Result Top Summary Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 text-white border border-blue-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ready Bathroom Package Created</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-bold font-serif">
                      {currentResult.bathroomTypeName} Complete Package
                    </h3>

                    <p className="text-xs text-blue-200">
                      Style: <strong>{currentResult.styleName}</strong> • Budget: <strong>{currentResult.budgetTierName}</strong> • Selected Items: <strong>{currentResult.totalItemsCount} Fixtures</strong>
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15 text-right flex flex-col justify-center min-w-[220px]">
                    <span className="text-[11px] uppercase tracking-wider text-blue-200 font-mono">
                      Estimated Package Total
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-0.5">
                      {formatPKR(currentResult.totalPackagePrice)}
                    </div>
                    <span className="text-[10px] text-slate-300 mt-0.5">
                      *Includes full matching sanitary ensemble
                    </span>
                  </div>
                </div>

                {/* Notice on Cart Addition */}
                {cartAddedNotice && (
                  <div className="p-4 rounded-xl bg-emerald-900/80 border border-emerald-500/40 text-emerald-200 text-xs font-semibold flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>All {currentResult.totalItemsCount} package products have been added to your shopping cart!</span>
                    </div>
                    <a href="#cart" className="underline font-bold text-white ml-3 hover:text-emerald-300">
                      View Cart
                    </a>
                  </div>
                )}

                {/* Itemized Products List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Included Package Items ({currentResult.totalItemsCount} Fixtures)
                    </h4>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Uncheck any item you don't need
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packageItems.map((item) => {
                      return (
                        <div
                          key={item.fixtureId}
                          className={`p-4 rounded-2xl border-2 transition-all flex gap-4 ${
                            item.isIncluded
                              ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-sm'
                              : 'border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30 opacity-50'
                          }`}
                        >
                          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                            <img
                              src={item.product.images?.[0] || item.product.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80'}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                            {item.product.brand && (
                              <span className="absolute bottom-1 left-1 right-1 px-1 py-0.5 bg-slate-950/80 backdrop-blur-xs text-[9px] font-bold text-center text-amber-300 rounded truncate">
                                {item.product.brand}
                              </span>
                            )}
                          </div>

                          <div className="flex-1 flex flex-col justify-between min-w-0">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  {item.fixtureName}
                                </span>
                                
                                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.isIncluded}
                                    onChange={() => handleTogglePackageItem(item.fixtureId)}
                                    className="w-4 h-4 rounded text-emerald-600 bg-slate-100 border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
                                  />
                                </label>
                              </div>

                              <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                {item.product.name}
                              </h5>

                              <p className="text-[11px] font-arabic text-emerald-700 dark:text-emerald-400 font-medium">
                                {item.fixtureUrduName}
                              </p>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                              <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                {formatPKR(item.totalPrice)}
                              </span>

                              {onViewProduct && (
                                <button
                                  type="button"
                                  onClick={() => onViewProduct(item.product)}
                                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                                >
                                  <span>View Details</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    
                    {/* WhatsApp Action Button */}
                    <a
                      href={buildPlannerWhatsAppMessage(currentResult, whatsappNumber, plannerConfig.whatsappTemplate)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2.5 text-center"
                    >
                      <PhoneCall className="w-4 h-4 shrink-0" />
                      <span>Order on WhatsApp (واٹس ایپ پر آرڈر کریں)</span>
                    </a>

                    {/* Add Entire Package to Cart Button */}
                    {onAddToCart && (
                      <button
                        type="button"
                        onClick={handleAddAllToCart}
                        className="py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2.5 text-center"
                      >
                        <ShoppingBag className="w-4 h-4 shrink-0" />
                        <span>Add All ({currentResult.totalItemsCount}) Items to Cart</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-semibold flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Modify / Recalculate (دوبارہ تبدیل کریں)</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>10-Year Warranty</span>
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Nationwide Delivery</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Disclaimer / Showroom Guarantee */}
                {plannerConfig.disclaimerText && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-2xl mx-auto italic">
                    {plannerConfig.disclaimerText}
                  </p>
                )}

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </section>
  );
};
