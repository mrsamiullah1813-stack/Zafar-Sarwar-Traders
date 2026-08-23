import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Wrench, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  MessageSquare, 
  Check, 
  Sparkles, 
  Layers, 
  Package, 
  Filter, 
  ArrowRight, 
  ChevronRight, 
  SlidersHorizontal, 
  Building2, 
  ShowerHead, 
  Droplets, 
  Boxes, 
  Home, 
  Settings, 
  HardHat, 
  Zap, 
  ShieldCheck, 
  Phone, 
  CheckCircle2, 
  Info,
  RotateCcw,
  ShoppingBag,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { 
  FittingBuilderConfig, 
  FittingPackageType, 
  FittingCategory, 
  FittingItem, 
  FittingItemVariant, 
  FittingPackageItemInCart,
  BusinessConfig,
  Product
} from '../types';

interface SmartConstructionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FittingBuilderConfig;
  businessConfig: BusinessConfig;
  products?: Product[];
}

export const SmartConstructionBuilderModal: React.FC<SmartConstructionBuilderModalProps> = ({
  isOpen,
  onClose,
  config,
  businessConfig,
  products = []
}) => {
  // State
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg-bathroom');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('all');
  const [sizeTypeFilter, setSizeTypeFilter] = useState<'ALL' | 'INCH' | 'MM'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<FittingPackageItemInCart[]>([]);
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState<boolean>(false);
  const [addedAnimationItemId, setAddedAnimationItemId] = useState<string | null>(null);
  
  // Selected variant map per item { itemId: variantId }
  const [selectedVariantMap, setSelectedVariantMap] = useState<Record<string, string>>({});
  // Selected quantity map per item { itemId: number }
  const [itemQtyMap, setItemQtyMap] = useState<Record<string, number>>({});

  // Active package object
  const activePackage = useMemo(() => {
    const pkgs = config.packageTypes || [];
    return pkgs.find(p => p.id === selectedPackageId) || pkgs[0] || null;
  }, [config.packageTypes, selectedPackageId]);

  // Active Categories
  const enabledCategories = useMemo(() => {
    return (config.categories || []).filter(c => c.enabled !== false);
  }, [config.categories]);

  // Materials extracted dynamically
  const availableMaterials = useMemo(() => {
    const mats = new Set<string>();
    (config.items || []).forEach(item => {
      if (item.material) mats.add(item.material);
      item.variants?.forEach(v => {
        if (v.material) mats.add(v.material);
      });
    });
    return Array.from(mats).sort();
  }, [config.items]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = (config.items || []).filter(i => i.enabled !== false);

    // Filter by selected package recommendation if requested or active
    if (activePackage && selectedCategoryId === 'recommended') {
      const recCatIds = activePackage.recommendedCategoryIds || [];
      const recItemIds = (activePackage as any).recommendedItemIds || [];
      items = items.filter(i => recCatIds.includes(i.categoryId) || recItemIds.includes(i.id));
    } else if (selectedCategoryId !== 'all') {
      items = items.filter(i => i.categoryId === selectedCategoryId);
    }

    // Filter by Material
    if (selectedMaterialFilter !== 'all') {
      items = items.filter(i => {
        if (i.material?.toLowerCase().includes(selectedMaterialFilter.toLowerCase())) return true;
        return i.variants?.some(v => v.material?.toLowerCase().includes(selectedMaterialFilter.toLowerCase()));
      });
    }

    // Filter by Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(i => {
        const nameMatch = i.name.toLowerCase().includes(q);
        const urduMatch = i.urduName?.toLowerCase().includes(q);
        const descMatch = i.description?.toLowerCase().includes(q);
        const brandMatch = i.brand?.toLowerCase().includes(q);
        const matMatch = i.material?.toLowerCase().includes(q);
        const varMatch = i.variants?.some(v => v.sizeLabel.toLowerCase().includes(q) || v.unit?.toLowerCase().includes(q));
        return nameMatch || urduMatch || descMatch || brandMatch || matMatch || varMatch;
      });
    }

    return items;
  }, [config.items, activePackage, selectedCategoryId, selectedMaterialFilter, searchQuery]);

  // Initialize default variant for items when list changes
  useEffect(() => {
    setSelectedVariantMap(prev => {
      const next = { ...prev };
      (config.items || []).forEach(item => {
        if (!next[item.id] && item.variants && item.variants.length > 0) {
          const firstEnabled = item.variants.find(v => v.enabled !== false) || item.variants[0];
          if (firstEnabled) {
            next[item.id] = firstEnabled.id;
          }
        }
      });
      return next;
    });
  }, [config.items]);

  // Cart Calculations
  const cartSummary = useMemo(() => {
    let totalItemsCount = 0;
    let totalPrice = 0;
    let priceOnCallCount = 0;

    cart.forEach(item => {
      totalItemsCount += item.quantity;
      if (item.isPriceOnCall || item.unitPrice === null) {
        priceOnCallCount += 1;
      } else {
        totalPrice += (item.unitPrice * item.quantity);
      }
    });

    return {
      totalItemsCount,
      totalPrice,
      hasPriceOnCall: priceOnCallCount > 0,
      priceOnCallCount,
      linesCount: cart.length
    };
  }, [cart]);

  if (!isOpen) return null;

  // Helpers
  const getItemActiveVariant = (item: FittingItem): FittingItemVariant | null => {
    const varId = selectedVariantMap[item.id];
    if (varId) {
      const found = item.variants?.find(v => v.id === varId && v.enabled !== false);
      if (found) return found;
    }
    return item.variants?.find(v => v.enabled !== false) || item.variants?.[0] || null;
  };

  const getItemQuantity = (itemId: string): number => {
    return itemQtyMap[itemId] || 1;
  };

  const handleUpdateItemQty = (itemId: string, delta: number) => {
    setItemQtyMap(prev => {
      const current = prev[itemId] || 1;
      const next = Math.max(1, Math.min(500, current + delta));
      return { ...prev, [itemId]: next };
    });
  };

  const handleSelectVariant = (itemId: string, variantId: string) => {
    setSelectedVariantMap(prev => ({
      ...prev,
      [itemId]: variantId
    }));
  };

  const handleAddToCart = (item: FittingItem) => {
    const variant = getItemActiveVariant(item);
    if (!variant) return;

    const qty = getItemQuantity(item.id);
    const isPriceOnCall = variant.price === null || variant.price === undefined || variant.isPriceOnCall === true;
    const unitPrice = isPriceOnCall ? null : Number(variant.price);
    const lineTotal = unitPrice !== null ? unitPrice * qty : 0;
    const cat = enabledCategories.find(c => c.id === item.categoryId);

    const entryId = `${item.id}_${variant.id}`;

    setCart(prev => {
      const existingIdx = prev.findIndex(p => p.id === entryId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + qty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          lineTotal: unitPrice !== null ? unitPrice * newQty : 0
        };
        return updated;
      } else {
        const newItem: FittingPackageItemInCart = {
          id: entryId,
          packageTypeId: activePackage?.id,
          packageTypeName: activePackage?.name,
          itemId: item.id,
          itemName: item.name,
          categoryId: item.categoryId,
          categoryName: cat?.name || 'Fittings',
          variantId: variant.id,
          sizeType: variant.sizeType,
          sizeLabel: variant.sizeLabel,
          unit: variant.unit || item.unit || 'Piece',
          length: variant.length,
          material: variant.material || item.material,
          brand: variant.brand || item.brand,
          grade: variant.grade,
          image: item.image,
          unitPrice,
          isPriceOnCall,
          quantity: qty,
          lineTotal
        };
        return [...prev, newItem];
      }
    });

    // Reset qty to 1 and trigger visual animation
    setItemQtyMap(prev => ({ ...prev, [item.id]: 1 }));
    setAddedAnimationItemId(item.id);
    setTimeout(() => setAddedAnimationItemId(null), 1200);
  };

  const handleUpdateCartItemQty = (entryId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === entryId) {
          const nextQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: nextQty,
            lineTotal: item.unitPrice !== null ? item.unitPrice * nextQty : 0
          };
        }
        return item;
      });
    });
  };

  const handleRemoveFromCart = (entryId: string) => {
    setCart(prev => prev.filter(item => item.id !== entryId));
  };

  const handleClearCart = () => {
    if (confirm('Clear all items from your custom package?')) {
      setCart([]);
    }
  };

  // WhatsApp Order Generation
  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;

    const targetPhone = (config.whatsappNumber || businessConfig.whatsapp || "923108002863").replace(/[^0-9]/g, "");
    
    let msg = `*🔧 SMART CONSTRUCTION & FITTING PACKAGE ORDER*\n`;
    msg += `*Store:* ZAFAR SARWAR TRADERS\n`;
    msg += `*Selected Project:* ${activePackage?.name || "Custom Plumbing Package"}\n`;
    msg += `-------------------------------------------\n`;
    msg += `*PACKAGE ITEMS LIST (${cart.length} items / ${cartSummary.totalItemsCount} units):*\n\n`;

    cart.forEach((item, idx) => {
      const priceText = item.unitPrice !== null ? `Rs. ${item.unitPrice.toLocaleString()}` : `Price on Call`;
      const totalText = item.unitPrice !== null ? `Rs. ${item.lineTotal.toLocaleString()}` : `Confirm on Call`;
      msg += `${idx + 1}. *${item.itemName}*\n`;
      msg += `   • Size: *${item.sizeLabel}* (${item.sizeType})\n`;
      if (item.material) msg += `   • Material: ${item.material}\n`;
      if (item.brand) msg += `   • Brand: ${item.brand}\n`;
      msg += `   • Quantity: *${item.quantity} ${item.unit}*\n`;
      msg += `   • Rate: ${priceText} | Line Total: ${totalText}\n\n`;
    });

    msg += `-------------------------------------------\n`;
    msg += `*ESTIMATED PACKAGE TOTAL:* Rs. ${cartSummary.totalPrice.toLocaleString()}\n`;
    if (cartSummary.hasPriceOnCall) {
      msg += `⚠️ *Note:* ${cartSummary.priceOnCallCount} item(s) marked "Price on Call" (Rates to be confirmed by showroom team).\n`;
    }
    msg += `\n*Customer Note:* ${config.whatsappDisclaimerNote || "Please confirm stock availability, brand rates and delivery schedule."}\n`;

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const getIconComponent = (iconName?: string) => {
    switch (iconName) {
      case 'ShowerHead': return ShowerHead;
      case 'Droplet':
      case 'Droplets': return Droplets;
      case 'Boxes': return Boxes;
      case 'Home': return Home;
      case 'Wrench': return Wrench;
      case 'Settings': return Settings;
      case 'Building2': return Building2;
      case 'HardHat': return HardHat;
      case 'Zap': return Zap;
      default: return Package;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-md flex flex-col text-slate-100 overflow-hidden animate-fadeIn">
      
      {/* 1. TOP HEADER BAR */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>{config.title || "Smart Construction & Fitting Builder"}</span>
              </h1>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-blue-300 text-[10px] font-bold uppercase tracking-wider">
                {config.heroBadge || "Live Builder"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-light truncate max-w-md sm:max-w-xl">
              {config.subtitle || "Build your custom plumbing, pipe, fitting and water system package with live price calculation."}
            </p>
          </div>
        </div>

        {/* Right Header CTAs */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Package Cart Trigger Button */}
          <button
            onClick={() => setIsSummaryDrawerOpen(true)}
            className="relative px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">My Package</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white text-blue-900 font-black text-[10px]">
              {cartSummary.totalItemsCount}
            </span>
            <span className="hidden md:inline text-blue-100 font-mono">
              Rs. {cartSummary.totalPrice.toLocaleString()}
            </span>
          </button>

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close Builder"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. MAIN BUILDER BODY CONTAINER */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* LEFT / MAIN WORKSPACE AREA */}
        <div className="flex-1 flex flex-col overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 space-y-6 pb-28 lg:pb-8">
          
          {/* STEP 1: PROJECT / PACKAGE TYPE SELECTION */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">1</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Select Project Package Type</h2>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">Choose a project template to see recommended materials</span>
            </div>

            {/* Package Type Cards Slider / Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
              {(config.packageTypes || []).filter(p => p.enabled !== false).map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                const IconComponent = getIconComponent(pkg.iconName);

                return (
                  <button
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackageId(pkg.id);
                      // If user selects a specific package, auto-highlight recommended category
                      setSelectedCategoryId('recommended');
                    }}
                    className={`relative text-left p-3 rounded-2xl border transition-all flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-blue-900/40 border-blue-500 shadow-lg shadow-blue-950/80 ring-2 ring-blue-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-xl ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-blue-400 group-hover:bg-blue-600/20 group-hover:text-blue-300'
                        } transition-colors`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        {pkg.badge && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                            isSelected ? 'bg-blue-500/30 text-blue-200 border border-blue-400/40' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs font-bold leading-tight group-hover:text-white transition-colors">
                        {pkg.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug font-light">
                        {pkg.subtitle || pkg.description}
                      </p>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                      <span className={isSelected ? 'text-blue-400 font-bold' : 'text-slate-500'}>
                        {isSelected ? '✓ Selected' : 'Select'}
                      </span>
                      <ChevronRight className={`w-3 h-3 ${isSelected ? 'text-blue-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* STEP 2: CATEGORY & MATERIAL FILTERS */}
          <section className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">2</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Choose Category & Material</h2>
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search pipe, elbow, valve, size..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills Slider */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
              <button
                onClick={() => setSelectedCategoryId('recommended')}
                className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                  selectedCategoryId === 'recommended'
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>★ Recommended for {activePackage?.name?.split(' ')[0] || 'Project'}</span>
              </button>

              <button
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3 py-1.5 rounded-xl shrink-0 transition-all ${
                  selectedCategoryId === 'all'
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                All Categories ({config.items?.length || 0})
              </button>

              {enabledCategories.map(cat => {
                const count = (config.items || []).filter(i => i.categoryId === cat.id && i.enabled !== false).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition-all flex items-center gap-1.5 ${
                      selectedCategoryId === cat.id
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950'
                        : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Filters: Material + Size Type Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
              {/* Material Dropdown / Chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-blue-400" />
                  Material:
                </span>
                <button
                  onClick={() => setSelectedMaterialFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    selectedMaterialFilter === 'all'
                      ? 'bg-slate-700 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  All Materials
                </button>
                {availableMaterials.slice(0, 6).map(mat => (
                  <button
                    key={mat}
                    onClick={() => setSelectedMaterialFilter(mat)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                      selectedMaterialFilter === mat
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {mat}
                  </button>
                ))}
              </div>

              {/* MM vs INCH filter */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                <span className="text-[10px] text-slate-500 font-bold px-1.5">Size Unit:</span>
                <button
                  onClick={() => setSizeTypeFilter('ALL')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    sizeTypeFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSizeTypeFilter('INCH')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    sizeTypeFilter === 'INCH' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  INCH (½", ¾", 1"...)
                </button>
                <button
                  onClick={() => setSizeTypeFilter('MM')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                    sizeTypeFilter === 'MM' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  MM (20mm, 25mm, 32mm...)
                </button>
              </div>
            </div>
          </section>

          {/* STEP 3: ITEMS & FITTINGS CATALOG GRID */}
          <section className="space-y-3 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center">3</span>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Select Size, Quantity & Add to Package ({filteredItems.length} Products)
                </h2>
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                <Package className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-300 font-semibold">No items match your filter criteria.</p>
                <button
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setSelectedMaterialFilter('all');
                    setSizeTypeFilter('ALL');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 font-bold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                  const activeVariant = getItemActiveVariant(item);
                  const qty = getItemQuantity(item.id);
                  const isJustAdded = addedAnimationItemId === item.id;

                  // Filter variants by sizeType if needed
                  const visibleVariants = (item.variants || []).filter(v => {
                    if (v.enabled === false) return false;
                    if (sizeTypeFilter === 'INCH') return v.sizeType === 'INCH';
                    if (sizeTypeFilter === 'MM') return v.sizeType === 'MM';
                    return true;
                  });

                  const isPriceOnCall = !activeVariant || activeVariant.price === null || activeVariant.price === undefined || activeVariant.isPriceOnCall;
                  const unitPrice = activeVariant?.price !== null && activeVariant?.price !== undefined ? Number(activeVariant.price) : 0;
                  const calculatedTotal = unitPrice * qty;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between ${
                        isJustAdded ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        {/* Item Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {item.material && (
                                <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                                  {item.material}
                                </span>
                              )}
                              {item.brand && (
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                  {item.brand}
                                </span>
                              )}
                              {item.grade && (
                                <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 text-[10px]">
                                  {item.grade}
                                </span>
                              )}
                            </div>
                            <h3 className="text-sm font-bold text-white leading-snug">
                              {item.name}
                            </h3>
                            {item.urduName && (
                              <p className="text-xs text-slate-400 font-serif font-medium mt-0.5" dir="rtl">
                                {item.urduName}
                              </p>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-400 font-light line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}

                        {/* Size / Variant Selector */}
                        <div className="space-y-1.5 mb-3.5">
                          <label className="text-[11px] font-bold text-slate-400 flex items-center justify-between">
                            <span>Select Size / Variant:</span>
                            {activeVariant && (
                              <span className="text-[10px] text-blue-400 font-mono">
                                Unit: {activeVariant.unit || item.unit || 'Piece'}
                              </span>
                            )}
                          </label>

                          <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
                            {visibleVariants.map(v => {
                              const isSelected = activeVariant?.id === v.id;
                              return (
                                <button
                                  key={v.id}
                                  onClick={() => handleSelectVariant(item.id, v.id)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    isSelected
                                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900 ring-1 ring-blue-400'
                                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                                  }`}
                                >
                                  <span>{v.sizeLabel}</span>
                                  {v.price !== null && v.price !== undefined && !v.isPriceOnCall ? (
                                    <span className={`ml-1 text-[10px] ${isSelected ? 'text-blue-100' : 'text-emerald-400'}`}>
                                      Rs. {Number(v.price).toLocaleString()}
                                    </span>
                                  ) : (
                                    <span className="ml-1 text-[9px] text-amber-400">Call</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Add to Cart Controls */}
                      <div className="pt-3 border-t border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Unit Rate</span>
                            {isPriceOnCall ? (
                              <span className="text-xs font-bold text-amber-400">
                                Rate on Call
                              </span>
                            ) : (
                              <span className="text-sm font-black text-emerald-400 font-mono">
                                Rs. {unitPrice.toLocaleString()}
                                <span className="text-[10px] text-slate-400 font-normal ml-1">
                                  / {activeVariant?.unit || item.unit || 'pc'}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                            <button
                              onClick={() => handleUpdateItemQty(item.id, -1)}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-white">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleUpdateItemQty(item.id, 1)}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Add to Package Button */}
                        <button
                          onClick={() => handleAddToCart(item)}
                          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 ${
                            isJustAdded
                              ? 'bg-emerald-600 text-white shadow-emerald-950'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Added to Package!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>
                                Add to Package {!isPriceOnCall && calculatedTotal > 0 && `(Rs. ${calculatedTotal.toLocaleString()})`}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

        </div>

        {/* RIGHT SIDEBAR / LIVE PACKAGE DRAWER (Desktop Permanent, Mobile Slide-out) */}
        <aside className={`
          fixed lg:static inset-y-0 right-0 z-50 w-full sm:w-96 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col justify-between shadow-2xl transition-transform duration-300
          ${isSummaryDrawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>My Custom Package</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 font-mono text-[10px]">
                    {cartSummary.totalItemsCount} units
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-light truncate">
                  {activePackage?.name || "Plumbing Package"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {cart.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Clear Package"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsSummaryDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Items List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-500">
                <Package className="w-12 h-12 stroke-[1.2] text-slate-600" />
                <div>
                  <p className="text-sm font-bold text-slate-300">Your package is currently empty</p>
                  <p className="text-xs text-slate-400 mt-1 font-light">
                    Select your project above, pick sizes and click "Add to Package" to build your order.
                  </p>
                </div>
              </div>
            ) : (
              cart.map((cartItem) => (
                <div
                  key={cartItem.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 group hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">
                        {cartItem.itemName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                        <span className="px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 font-mono font-bold">
                          {cartItem.sizeLabel}
                        </span>
                        {cartItem.material && <span>• {cartItem.material}</span>}
                        {cartItem.brand && <span>• {cartItem.brand}</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(cartItem.id)}
                      className="text-slate-600 hover:text-rose-400 transition-colors p-1"
                      title="Remove Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quantity & Line Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                    <div className="flex items-center gap-1 bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => handleUpdateCartItemQty(cartItem.id, -1)}
                        className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-white text-[11px]">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateCartItemQty(cartItem.id, 1)}
                        className="w-5 h-5 rounded hover:bg-slate-800 text-slate-300 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="text-right">
                      {cartItem.isPriceOnCall || cartItem.unitPrice === null ? (
                        <span className="text-[11px] font-bold text-amber-400">
                          Price on Call
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          Rs. {cartItem.lineTotal.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer / WhatsApp Order Action */}
          <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 space-y-3 shrink-0">
            {/* Price Summary */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Total Items:</span>
                <span className="font-mono font-bold text-white">{cartSummary.totalItemsCount} units ({cartSummary.linesCount} lines)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Estimated Subtotal:</span>
                <span className="font-mono font-bold text-white">Rs. {cartSummary.totalPrice.toLocaleString()}</span>
              </div>
              {cartSummary.hasPriceOnCall && (
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300 flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{cartSummary.priceOnCallCount} item(s) require verbal rate confirmation.</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm font-bold">
                <span className="text-white">Package Total:</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  Rs. {cartSummary.totalPrice.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Main WhatsApp CTA */}
            <button
              disabled={cart.length === 0}
              onClick={handleWhatsAppOrder}
              className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 ${
                cart.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Order Complete Package on WhatsApp</span>
            </button>

            <p className="text-[10px] text-slate-500 text-center italic">
              Official WhatsApp Line: +92 310 8002863
            </p>
          </div>
        </aside>

      </div>

      {/* MOBILE STICKY BOTTOM BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 py-3 z-40 flex items-center justify-between gap-3 shadow-2xl">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">My Package:</span>
            <span className="font-bold text-white text-xs">{cartSummary.totalItemsCount} units</span>
          </div>
          <span className="text-sm font-black text-emerald-400 font-mono">
            Rs. {cartSummary.totalPrice.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSummaryDrawerOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
            <span>View List ({cart.length})</span>
          </button>

          <button
            disabled={cart.length === 0}
            onClick={handleWhatsAppOrder}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md ${
              cart.length > 0
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Order</span>
          </button>
        </div>
      </div>

    </div>
  );
};
