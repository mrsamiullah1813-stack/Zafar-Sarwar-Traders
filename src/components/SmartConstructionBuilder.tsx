import React, { useState, useMemo } from 'react';
import { 
  Wrench, 
  Layers, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  MessageCircle, 
  Share2, 
  Copy, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Droplet, 
  Building2, 
  HardHat, 
  ArrowRight, 
  RefreshCw, 
  FileText, 
  Info,
  ChevronDown,
  Filter,
  CheckSquare,
  PackageCheck,
  Zap,
  Boxes,
  HelpCircle,
  ExternalLink,
  Printer
} from 'lucide-react';
import { 
  FittingBuilderConfig, 
  FittingCategory, 
  FittingItem, 
  FittingItemVariant, 
  FittingPackageType, 
  FittingPackageItemInCart, 
  Product, 
  BusinessConfig 
} from '../types';
import { defaultFittingBuilderConfig } from '../data/defaultFittingBuilderData';

interface SmartConstructionBuilderProps {
  config?: FittingBuilderConfig;
  products?: Product[];
  businessConfig?: BusinessConfig;
  onAddToCart?: (product: Product, quantity?: number, selectedVariant?: string) => void;
  onAddPackageToCart?: (items: { product: Product; quantity: number; selectedVariantName?: string; price: number }[]) => void;
  onViewProduct?: (product: Product) => void;
  onClose?: () => void;
}

export const SmartConstructionBuilder: React.FC<SmartConstructionBuilderProps> = ({
  config = defaultFittingBuilderConfig,
  products = [],
  businessConfig,
  onAddToCart,
  onAddPackageToCart,
  onViewProduct,
  onClose
}) => {
  const currentConfig: FittingBuilderConfig = config || defaultFittingBuilderConfig;
  const packageTypes = currentConfig.packageTypes?.filter(pt => pt.enabled) || defaultFittingBuilderConfig.packageTypes;
  const categories = currentConfig.categories?.filter(c => c.enabled) || defaultFittingBuilderConfig.categories;
  const allItems = currentConfig.items?.filter(i => i.enabled) || defaultFittingBuilderConfig.items;

  // Selected State
  const [selectedPackageTypeId, setSelectedPackageTypeId] = useState<string>(
    packageTypes[0]?.id || 'pkg-full-house'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sizeUnitFilter, setSizeUnitFilter] = useState<'ALL' | 'INCH' | 'MM'>('ALL');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  
  // Active Package Items (Cart in Builder)
  const [packageItems, setPackageItems] = useState<FittingPackageItemInCart[]>([]);
  
  // Temporary Selected Variant Map for items (itemId -> variantId)
  const [selectedVariantByItem, setSelectedVariantByItem] = useState<Record<string, string>>({});
  // Temporary Quantity Map for items before or during adding (itemId -> quantity)
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // UI Drawer / Summary Modals
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [addedToCartToast, setAddedToCartToast] = useState<boolean>(false);

  // Active package type object
  const activePackageType = useMemo(() => {
    return packageTypes.find(pt => pt.id === selectedPackageTypeId) || packageTypes[0];
  }, [packageTypes, selectedPackageTypeId]);

  // Filter Categories based on active package type if specified
  const visibleCategories = useMemo(() => {
    return categories.filter(cat => {
      if (!cat.packageTypeIds || cat.packageTypeIds.length === 0 || cat.packageTypeIds.includes('all')) {
        return true;
      }
      return cat.packageTypeIds.includes(selectedPackageTypeId);
    });
  }, [categories, selectedPackageTypeId]);

  // Unique Materials list for filtering
  const availableMaterials = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach(i => {
      if (i.material) set.add(i.material);
      i.variants.forEach(v => {
        if (v.material) set.add(v.material);
      });
    });
    return Array.from(set);
  }, [allItems]);

  // Filter Items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Category filter
      if (selectedCategoryId !== 'all' && item.categoryId !== selectedCategoryId) {
        return false;
      }

      // Material filter
      if (materialFilter !== 'all') {
        const itemMat = item.material || '';
        const variantMatches = item.variants.some(v => (v.material || '').toLowerCase() === materialFilter.toLowerCase());
        if (!itemMat.toLowerCase().includes(materialFilter.toLowerCase()) && !variantMatches) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchUrdu = (item.urduName || '').includes(q);
        const matchBrand = (item.brand || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        const matchVariants = item.variants.some(v => 
          v.sizeLabel.toLowerCase().includes(q) || (v.material || '').toLowerCase().includes(q)
        );
        if (!matchName && !matchUrdu && !matchBrand && !matchDesc && !matchVariants) {
          return false;
        }
      }

      // Size Unit Filter (filter items that have at least one variant of that type)
      if (sizeUnitFilter !== 'ALL') {
        const hasUnit = item.variants.some(v => v.sizeType === sizeUnitFilter);
        if (!hasUnit) return false;
      }

      return true;
    });
  }, [allItems, selectedCategoryId, materialFilter, searchQuery, sizeUnitFilter]);

  // Helper to get active selected variant for an item
  const getSelectedVariant = (item: FittingItem): FittingItemVariant => {
    const selectedId = selectedVariantByItem[item.id];
    if (selectedId) {
      const found = item.variants.find(v => v.id === selectedId);
      if (found) return found;
    }
    // Default to first enabled variant
    const enabled = item.variants.filter(v => v.enabled);
    return enabled[0] || item.variants[0];
  };

  // Helper to get active quantity for an item
  const getItemQty = (itemId: string): number => {
    return itemQuantities[itemId] || 1;
  };

  // Set quantity with bounds
  const handleUpdateItemQty = (itemId: string, newQty: number) => {
    const qty = Math.max(1, Math.min(9999, Math.round(newQty || 1)));
    setItemQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  // Add Item to Package
  const handleAddToPackage = (item: FittingItem) => {
    const variant = getSelectedVariant(item);
    if (!variant) return;

    const qty = getItemQty(item.id);
    const existingIndex = packageItems.findIndex(
      pi => pi.itemId === item.id && pi.variantId === variant.id
    );

    const price = variant.price || 0;
    const category = categories.find(c => c.id === item.categoryId);

    if (existingIndex >= 0) {
      // Update quantity
      const updated = [...packageItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + qty,
        subtotal: (updated[existingIndex].quantity + qty) * price
      };
      setPackageItems(updated);
    } else {
      // Add new
      const newItem: FittingPackageItemInCart = {
        id: `pkg-item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        itemId: item.id,
        itemName: item.name,
        name: item.name,
        urduName: item.urduName,
        categoryId: item.categoryId,
        categoryName: category?.name || 'General Fitting',
        variantId: variant.id,
        sizeLabel: variant.sizeLabel,
        sizeType: variant.sizeType || 'INCH',
        brand: variant.brand || item.brand || 'Master / Standard',
        material: variant.material || item.material || 'UPVC / CPVC',
        unit: variant.unit || item.unit || 'Piece',
        quantity: qty,
        unitPrice: price,
        isPriceOnCall: !!variant.isPriceOnCall || variant.price === null,
        lineTotal: price * qty,
        subtotal: price * qty,
        image: item.image,
        linkedProductId: item.linkedProductId
      };
      setPackageItems(prev => [...prev, newItem]);
    }

    // Reset temporary quantity to 1
    setItemQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  // Remove item from package
  const handleRemoveFromPackage = (id: string) => {
    setPackageItems(prev => prev.filter(item => item.id !== id));
  };

  // Update quantity in package directly
  const handleUpdatePackageItemQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveFromPackage(id);
      return;
    }
    setPackageItems(prev => prev.map(item => {
      if (item.id === id) {
        const uPrice = item.unitPrice || 0;
        return {
          ...item,
          quantity: newQty,
          lineTotal: uPrice * newQty,
          subtotal: uPrice * newQty
        };
      }
      return item;
    }));
  };

  // Clear entire package
  const handleClearPackage = () => {
    if (packageItems.length === 0) return;
    if (window.confirm('Clear all items from your current construction package?')) {
      setPackageItems([]);
    }
  };

  // Calculations
  const packageTotalPkr = useMemo(() => {
    return packageItems.reduce((acc, item) => acc + (item.subtotal || item.lineTotal || 0), 0);
  }, [packageItems]);

  const totalItemsCount = useMemo(() => {
    return packageItems.reduce((acc, item) => acc + item.quantity, 0);
  }, [packageItems]);

  const hasPriceOnCallItems = useMemo(() => {
    return packageItems.some(i => i.isPriceOnCall || i.unitPrice === null || i.unitPrice === 0);
  }, [packageItems]);

  // Load Preset Bundle for the selected project
  const handleLoadPresetBundle = () => {
    const recommendedItemIds = activePackageType?.recommendedItemIds || [];
    if (recommendedItemIds.length === 0) {
      // Pick first 8 items from catalog
      const itemsToLoad = allItems.slice(0, 8);
      const newItems: FittingPackageItemInCart[] = itemsToLoad.map((item, idx) => {
        const variant: FittingItemVariant | undefined = item.variants[0];
        const price = variant?.price || 250;
        const category = categories.find(c => c.id === item.categoryId);
        const qty = idx < 3 ? 10 : idx < 6 ? 5 : 2;
        return {
          id: `preset-${Date.now()}-${idx}`,
          itemId: item.id,
          itemName: item.name,
          name: item.name,
          urduName: item.urduName,
          categoryId: item.categoryId,
          categoryName: category?.name || 'Plumbing',
          variantId: variant?.id || `var-${idx}`,
          sizeLabel: variant?.sizeLabel || '1/2"',
          sizeType: (variant?.sizeType || 'INCH') as 'INCH' | 'MM' | 'OTHER' | 'CUSTOM',
          brand: variant?.brand || item.brand || 'Master',
          material: variant?.material || item.material || 'CPVC',
          unit: variant?.unit || 'Piece',
          quantity: qty,
          unitPrice: price,
          isPriceOnCall: variant ? !!variant.isPriceOnCall : false,
          lineTotal: price * qty,
          subtotal: price * qty,
          image: item.image,
          linkedProductId: item.linkedProductId
        };
      });
      setPackageItems(newItems);
      return;
    }

    const newItems: FittingPackageItemInCart[] = [];
    recommendedItemIds.forEach((itemId, idx) => {
      const item = allItems.find(i => i.id === itemId);
      if (item) {
        const variant: FittingItemVariant | undefined = item.variants[0];
        if (variant) {
          const price = variant.price || 0;
          const category = categories.find(c => c.id === item.categoryId);
          const qty = idx < 2 ? 15 : idx < 5 ? 8 : 4;
          newItems.push({
            id: `preset-${Date.now()}-${idx}`,
            itemId: item.id,
            itemName: item.name,
            name: item.name,
            urduName: item.urduName,
            categoryId: item.categoryId,
            categoryName: category?.name || 'Plumbing',
            variantId: variant.id,
            sizeLabel: variant.sizeLabel,
            sizeType: variant.sizeType || 'INCH',
            brand: variant.brand || item.brand || 'Master',
            material: variant.material || item.material || 'CPVC',
            unit: variant.unit || 'Piece',
            quantity: qty,
            unitPrice: price,
            isPriceOnCall: !!variant.isPriceOnCall,
            lineTotal: price * qty,
            subtotal: price * qty,
            image: item.image,
            linkedProductId: item.linkedProductId
          });
        }
      }
    });
    setPackageItems(newItems);
  };

  // WhatsApp Order Text Generator
  const generateWhatsAppMessage = (): string => {
    const phone = currentConfig.whatsappNumber || businessConfig?.whatsapp || '923108002863';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    
    let msg = `*NEW CONSTRUCTION & FITTING PACKAGE ORDER*\n`;
    msg += `-------------------------------------------\n`;
    msg += `🏢 *Store:* Zafar Sarwar Traders (Chichawatni)\n`;
    msg += `📦 *Project Type:* ${activePackageType?.name || 'Custom Construction Package'}\n`;
    msg += `📅 *Date:* ${new Date().toLocaleDateString('en-GB')}\n`;
    msg += `-------------------------------------------\n\n`;
    msg += `*SELECTED PACKAGE ITEMS (${packageItems.length} Products | ${totalItemsCount} Total Units):*\n\n`;

    packageItems.forEach((item, idx) => {
      const displayName = item.name || item.itemName;
      msg += `${idx + 1}. *${displayName}*\n`;
      msg += `   • Size: *${item.sizeLabel}* (${item.material || 'Standard'})\n`;
      msg += `   • Brand: ${item.brand || 'Standard'}\n`;
      msg += `   • Qty: *${item.quantity} ${item.unit}*\n`;
      if (item.isPriceOnCall || item.unitPrice === 0 || item.unitPrice === null) {
        msg += `   • Rate: Price on Call\n`;
      } else {
        msg += `   • Rate: Rs. ${item.unitPrice.toLocaleString()} / ${item.unit}\n`;
        msg += `   • Item Subtotal: *Rs. ${(item.subtotal || item.lineTotal || 0).toLocaleString()}*\n`;
      }
      msg += `\n`;
    });

    msg += `-------------------------------------------\n`;
    msg += `💰 *TOTAL ESTIMATED PACKAGE:* Rs. ${packageTotalPkr.toLocaleString()}\n`;
    if (hasPriceOnCallItems) {
      msg += `⚠️ _(Some custom items are subject to live market rate confirmation)_\n`;
    }
    msg += `🚚 *Delivery:* City / Site address to be confirmed.\n\n`;
    msg += `Please review this package list, confirm product availability, and provide invoice / delivery details. Thank you!`;

    return msg;
  };

  const handleSendWhatsAppOrder = () => {
    if (packageItems.length === 0) {
      alert('Please add at least one item to your package before placing an order.');
      return;
    }
    const phone = currentConfig.whatsappNumber || businessConfig?.whatsapp || '923108002863';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = generateWhatsAppMessage();
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopyQuotation = () => {
    if (packageItems.length === 0) return;
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3000);
    });
  };

  // Push Package to Main Store Cart
  const handlePushToStoreCart = () => {
    if (packageItems.length === 0) return;

    if (onAddPackageToCart) {
      const itemsToPush = packageItems.map(item => {
        const displayName = item.name || item.itemName;
        // Find matching product or create a virtual compatible product
        const matchedProduct = (products.find(p => p.id === (item.linkedProductId || item.itemId)) || {
          id: `fitting-${item.itemId}`,
          name: `${displayName} (${item.sizeLabel})`,
          price: item.unitPrice || 0,
          category: 'plumbing',
          categoryId: 'plumbing-pipes',
          image: item.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
          description: `${item.material || 'Standard'} fitting package item. Brand: ${item.brand || 'Master'}. Size: ${item.sizeLabel}.`,
          specs: {
            'Size': item.sizeLabel,
            'Material': item.material || 'CPVC / UPVC',
            'Brand': item.brand || 'Master',
            'Unit': item.unit
          },
          features: []
        }) as unknown as Product;

        return {
          product: matchedProduct,
          quantity: item.quantity,
          selectedVariantName: item.sizeLabel,
          price: item.unitPrice || 0
        };
      });

      onAddPackageToCart(itemsToPush);
      setAddedToCartToast(true);
      setTimeout(() => setAddedToCartToast(false), 3500);
    } else if (onAddToCart) {
      packageItems.forEach(item => {
        const displayName = item.name || item.itemName;
        const matchedProduct = (products.find(p => p.id === (item.linkedProductId || item.itemId)) || {
          id: `fitting-${item.itemId}`,
          name: `${displayName} (${item.sizeLabel})`,
          price: item.unitPrice || 0,
          category: 'plumbing',
          categoryId: 'plumbing-pipes',
          image: item.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
          description: `${item.material || 'Standard'} fitting item. Size: ${item.sizeLabel}.`,
          features: []
        }) as unknown as Product;
        onAddToCart(matchedProduct, item.quantity, item.sizeLabel);
      });
      setAddedToCartToast(true);
      setTimeout(() => setAddedToCartToast(false), 3500);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      
      {/* 1. TOP HEADER & PROJECT SELECTOR */}
      <div className="shrink-0 bg-slate-900/90 border-b border-slate-800/80 p-4 sm:p-5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                <span>Plumbing & Construction Builder</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                Live PKR Pricing
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white tracking-tight flex items-center gap-2">
              <span>{currentConfig.title || 'Smart Construction & Fitting Package Builder'}</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-light mt-0.5 max-w-2xl">
              {currentConfig.subtitle || 'Build complete pipe, fitting, valve, water tank, and pump packages for houses, plazas, and bathrooms with real-time size & quantity costing.'}
            </p>
          </div>

          {/* Quick Preset Bundle Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLoadPresetBundle}
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Auto-load recommended items for this project"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Load Preset Bundle</span>
            </button>

            {packageItems.length > 0 && (
              <button
                onClick={() => setIsBreakdownOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/40 animate-pulse"
              >
                <PackageCheck className="w-4 h-4" />
                <span>View Package ({packageItems.length})</span>
                <span className="bg-blue-950/80 px-2 py-0.5 rounded-full text-[11px] font-mono">
                  Rs. {packageTotalPkr.toLocaleString()}
                </span>
              </button>
            )}
          </div>

        </div>

        {/* Project Type Horizontal Cards */}
        <div className="max-w-7xl mx-auto mt-4 overflow-x-auto pb-1 no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {packageTypes.map(pt => {
              const isSelected = pt.id === selectedPackageTypeId;
              return (
                <button
                  key={pt.id}
                  onClick={() => setSelectedPackageTypeId(pt.id)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-950'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <span className={`p-1.5 rounded-xl ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-900 text-blue-400'}`}>
                    <Building2 className="w-3.5 h-3.5" />
                  </span>
                  <div className="text-left">
                    <div className="font-bold whitespace-nowrap">{pt.name}</div>
                    {pt.urduName && (
                      <div className="text-[10px] opacity-75 font-urdu">{pt.urduName}</div>
                    )}
                  </div>
                  {pt.badge && (
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-blue-950 border border-blue-400/40 text-[9px] text-blue-200">
                      {pt.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 2. FILTER & SEARCH TOOLBAR */}
      <div className="shrink-0 bg-slate-900/60 border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategoryId === 'all'
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Categories ({allItems.length})
            </button>

            {visibleCategories.map(cat => {
              const isSelected = cat.id === selectedCategoryId;
              const count = allItems.filter(i => i.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Unit Toggle & Search Bar */}
          <div className="flex items-center gap-2">
            
            {/* MM vs INCH Unit Switcher */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-bold shrink-0">
              <button
                onClick={() => setSizeUnitFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-all ${sizeUnitFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All Units
              </button>
              <button
                onClick={() => setSizeUnitFilter('INCH')}
                className={`px-2.5 py-1 rounded-lg transition-all ${sizeUnitFilter === 'INCH' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Inches (")
              </button>
              <button
                onClick={() => setSizeUnitFilter('MM')}
                className={`px-2.5 py-1 rounded-lg transition-all ${sizeUnitFilter === 'MM' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                MM (mm)
              </button>
            </div>

            {/* Material Filter */}
            {availableMaterials.length > 0 && (
              <select
                value={materialFilter}
                onChange={(e) => setMaterialFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Materials</option>
                {availableMaterials.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            )}

            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <input
                type="text"
                placeholder="Search pipe, elbow, valve, size..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            </div>

          </div>

        </div>
      </div>

      {/* 3. MAIN CATALOG ITEMS GRID (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 bg-slate-950">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {filteredItems.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center max-w-md mx-auto my-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">No Construction Items Found</h3>
              <p className="text-xs text-slate-400">
                No items matched your current filter criteria. Try resetting search or switching categories.
              </p>
              <button
                onClick={() => {
                  setSelectedCategoryId('all');
                  setMaterialFilter('all');
                  setSizeUnitFilter('ALL');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map(item => {
                const activeVariant = getSelectedVariant(item);
                const itemQty = getItemQty(item.id);
                const isPriceOnCall = !!activeVariant?.isPriceOnCall || activeVariant?.price === null;
                const unitPrice = activeVariant?.price || 0;
                const itemSubtotal = unitPrice * itemQty;

                // Check if this variant is already in the active package
                const inPackage = packageItems.find(
                  pi => pi.itemId === item.id && pi.variantId === activeVariant?.id
                );

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-950/20 transition-all group"
                  >
                    <div>
                      
                      {/* Thumbnail & Badges */}
                      <div className="relative aspect-[4/3] rounded-xl bg-slate-950 overflow-hidden mb-3 border border-slate-800/60">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-700">
                            <Wrench className="w-10 h-10 opacity-40" />
                          </div>
                        )}

                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.brand && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700 text-slate-200 text-[10px] font-bold">
                              {item.brand}
                            </span>
                          )}
                          {item.material && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-950/90 border border-blue-500/40 text-blue-300 text-[10px] font-mono font-bold">
                              {item.material}
                            </span>
                          )}
                        </div>

                        {inPackage && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3" />
                            <span>In Package ({inPackage.quantity})</span>
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div className="mb-3">
                        <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                        {item.urduName && (
                          <p className="text-xs text-slate-400 font-urdu mt-0.5 line-clamp-1">
                            {item.urduName}
                          </p>
                        )}
                        {item.description && (
                          <p className="text-[11px] text-slate-400 font-light mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Size / Variant Picker (Buttons or Dropdown) */}
                      <div className="mb-3 space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Select Size / Dimension:
                        </label>

                        {item.variants.length <= 4 ? (
                          <div className="grid grid-cols-2 gap-1.5">
                            {item.variants.map(v => {
                              const isVariantActive = v.id === activeVariant?.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setSelectedVariantByItem(prev => ({ ...prev, [item.id]: v.id }))}
                                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all border ${
                                    isVariantActive
                                      ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <span className="font-mono">{v.sizeLabel}</span>
                                  <span className="text-[10px] opacity-80">
                                    {v.isPriceOnCall || v.price === null ? 'Call' : `Rs.${v.price}`}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <select
                            value={activeVariant?.id}
                            onChange={(e) => setSelectedVariantByItem(prev => ({ ...prev, [item.id]: e.target.value }))}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                          >
                            {item.variants.map(v => (
                              <option key={v.id} value={v.id}>
                                {v.sizeLabel} — {v.isPriceOnCall || v.price === null ? 'Price on Call' : `Rs. ${v.price.toLocaleString()} / ${v.unit || 'Pc'}`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                    </div>

                    {/* Price, Quantity Stepper & Add Button */}
                    <div className="pt-3 border-t border-slate-800/80 space-y-3">
                      
                      {/* Price Header */}
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">Unit Price:</span>
                          <div className="text-base font-bold font-mono text-emerald-400">
                            {isPriceOnCall ? (
                              <span className="text-amber-400 text-xs font-semibold">Price on Call</span>
                            ) : (
                              <>Rs. {unitPrice.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal"> / {activeVariant?.unit || 'Pc'}</span></>
                            )}
                          </div>
                        </div>

                        {!isPriceOnCall && (
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">Subtotal:</span>
                            <div className="text-xs font-bold font-mono text-white">
                              Rs. {itemSubtotal.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Stepper and Add to Package Button */}
                      <div className="flex items-center gap-2">
                        
                        {/* Quantity Stepper */}
                        <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, itemQty - 1)}
                            className="p-2 text-slate-400 hover:text-white transition-colors disabled:opacity-30"
                            disabled={itemQty <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={itemQty}
                            onChange={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-10 text-center bg-transparent text-xs font-bold text-white font-mono focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(item.id, itemQty + 1)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Add to Package Button */}
                        <button
                          type="button"
                          onClick={() => handleAddToPackage(item)}
                          className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-950 flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Package</span>
                        </button>

                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* 4. FLOATING / STICKY PACKAGE SUMMARY FOOTER */}
      <div className="shrink-0 bg-slate-900 border-t border-slate-800 p-3 sm:p-4 shadow-2xl z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Summary Stats */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-semibold">
                  Current Package: <span className="text-white font-bold">{packageItems.length} Items ({totalItemsCount} units)</span>
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400 flex items-center gap-1.5">
                  <span>Rs. {packageTotalPkr.toLocaleString()}</span>
                  {hasPriceOnCallItems && (
                    <span className="text-[10px] text-amber-400 font-sans font-normal">(+ Custom items)</span>
                  )}
                </div>
              </div>
            </div>

            {packageItems.length > 0 && (
              <button
                onClick={() => setIsBreakdownOpen(true)}
                className="text-xs text-blue-400 hover:text-blue-300 font-bold underline sm:hidden"
              >
                View Items
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            
            {packageItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleClearPackage}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/40 transition-all"
                  title="Clear Package"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyQuotation}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                  title="Copy Quotation Summary"
                >
                  {copiedNotification ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-400" />
                      <span className="hidden md:inline">Copy Quote</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsBreakdownOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-700"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Itemized List</span>
                </button>

                <button
                  type="button"
                  onClick={handlePushToStoreCart}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-950"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Store Cart</span>
                </button>
              </>
            )}

            {/* Direct WhatsApp Order CTA */}
            <button
              type="button"
              onClick={handleSendWhatsAppOrder}
              disabled={packageItems.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-950"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Order on WhatsApp</span>
            </button>

          </div>

        </div>
      </div>

      {/* 5. ITEMIZED BREAKDOWN DRAWER / MODAL */}
      {isBreakdownOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">
                    Itemized Package Breakdown
                  </h3>
                  <p className="text-xs text-slate-400 font-light">
                    {activePackageType?.name} • {packageItems.length} Products ({totalItemsCount} Units)
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBreakdownOpen(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-h-0 space-y-3">
              {packageItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Your package is currently empty. Add items from the catalog above.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {packageItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-slate-500 font-bold w-5">
                          #{idx + 1}
                        </span>
                        
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name || item.itemName}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-900 border border-slate-800 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}

                        <div className="min-w-0">
                          <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.name || item.itemName}
                          </h5>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 font-mono text-blue-300">
                              {item.sizeLabel}
                            </span>
                            <span>•</span>
                            <span>{item.material}</span>
                            <span>•</span>
                            <span>{item.brand}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Subtotal */}
                      <div className="flex items-center gap-3 shrink-0">
                        
                        <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800">
                          <button
                            onClick={() => handleUpdatePackageItemQty(item.id, item.quantity - 1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center text-xs font-bold font-mono text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdatePackageItemQty(item.id, item.quantity + 1)}
                            className="p-1 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right w-24">
                          <div className="text-xs font-bold font-mono text-emerald-400">
                            {item.isPriceOnCall ? 'Call' : `Rs. ${(item.subtotal || item.lineTotal || 0).toLocaleString()}`}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {item.isPriceOnCall ? 'Rate on Call' : `@ Rs. ${item.unitPrice}`}
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFromPackage(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/50 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400">Total Estimated Package:</span>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  Rs. {packageTotalPkr.toLocaleString()}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSendWhatsAppOrder}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Send to WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsBreakdownOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Cart Toast Notification */}
      {addedToCartToast && (
        <div className="fixed bottom-20 right-6 z-[200] p-4 rounded-2xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-2xl animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Entire Package ({packageItems.length} Items) added to your store cart!</span>
        </div>
      )}

    </div>
  );
};
