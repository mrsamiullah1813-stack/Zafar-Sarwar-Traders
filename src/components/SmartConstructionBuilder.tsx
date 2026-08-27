import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Wrench, 
  Layers, 
  Check, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  MessageCircle, 
  Copy, 
  CheckCircle2, 
  Search, 
  Sparkles, 
  Droplet, 
  Building2, 
  Printer, 
  SlidersHorizontal, 
  Droplets, 
  Package, 
  X, 
  Maximize2, 
  Minimize2,
  Boxes,
  Zap,
  FileText,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  PhoneCall
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
  initialLanguage?: 'en' | 'ur';
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

export const SmartConstructionBuilder: React.FC<SmartConstructionBuilderProps> = ({
  config = defaultFittingBuilderConfig,
  products = [],
  businessConfig,
  onAddToCart,
  onAddPackageToCart,
  onViewProduct,
  onClose,
  initialLanguage = 'en',
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const currentConfig: FittingBuilderConfig = config || defaultFittingBuilderConfig;
  
  // Package types, categories & items
  const packageTypes = useMemo(() => {
    return (currentConfig.packageTypes?.filter(pt => pt.enabled !== false) || defaultFittingBuilderConfig.packageTypes);
  }, [currentConfig.packageTypes]);

  const categories = useMemo(() => {
    return (currentConfig.categories?.filter(c => c.enabled !== false) || defaultFittingBuilderConfig.categories);
  }, [currentConfig.categories]);

  const allItems = useMemo(() => {
    return (currentConfig.items?.filter(i => i.enabled !== false) || defaultFittingBuilderConfig.items);
  }, [currentConfig.items]);

  // ----------------------------------------------------
  // BILINGUAL STATE (English / اردو)
  // ----------------------------------------------------
  const [lang, setLang] = useState<'en' | 'ur'>(initialLanguage);
  const isUrdu = lang === 'ur';

  // ----------------------------------------------------
  // FULLSCREEN STATE
  // ----------------------------------------------------
  const [internalFullscreen, setInternalFullscreen] = useState<boolean>(false);
  const activeFullscreen = onToggleFullscreen ? isFullscreen : internalFullscreen;

  const handleToggleScreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      setInternalFullscreen(prev => !prev);
    }
  };

  // ----------------------------------------------------
  // NAVIGATION & SELECTION STATE
  // ----------------------------------------------------
  const [selectedPackageTypeId, setSelectedPackageTypeId] = useState<string>(
    packageTypes[0]?.id || 'pkg-bathroom'
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [sizeTypeFilter, setSizeTypeFilter] = useState<'ALL' | 'INCH' | 'MM'>('ALL');

  // Active Package Items (Customer Cart inside Builder)
  const [packageItems, setPackageItems] = useState<FittingPackageItemInCart[]>([]);

  // Selected Variant Map per item (itemId -> variantId)
  const [selectedVariantByItem, setSelectedVariantByItem] = useState<Record<string, string>>({});
  // Quantity Map per item (itemId -> quantity)
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  // UI Drawer / Summary Modals & Feedback
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [addedToCartToast, setAddedToCartToast] = useState<boolean>(false);
  const [recentlyAddedItemId, setRecentlyAddedItemId] = useState<string | null>(null);

  // Active package type object
  const activePackageType = useMemo(() => {
    return packageTypes.find(pt => pt.id === selectedPackageTypeId) || packageTypes[0];
  }, [packageTypes, selectedPackageTypeId]);

  // Unique Materials list for filtering
  const availableMaterials = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach(i => {
      if (i.material) set.add(i.material.trim());
      i.variants.forEach(v => {
        if (v.material) set.add(v.material.trim());
      });
    });
    return Array.from(set).filter(Boolean);
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
        const itemMat = (item.material || '').toLowerCase();
        const variantMatches = item.variants.some(v => (v.material || '').toLowerCase().includes(materialFilter.toLowerCase()));
        if (!itemMat.includes(materialFilter.toLowerCase()) && !variantMatches) {
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
      if (sizeTypeFilter !== 'ALL') {
        const hasUnit = item.variants.some(v => v.sizeType === sizeTypeFilter);
        if (!hasUnit) return false;
      }

      return true;
    });
  }, [allItems, selectedCategoryId, materialFilter, searchQuery, sizeTypeFilter]);

  // Helper to get active selected variant for an item
  const getSelectedVariant = (item: FittingItem): FittingItemVariant => {
    const selectedId = selectedVariantByItem[item.id];
    if (selectedId) {
      const found = item.variants.find(v => v.id === selectedId && v.enabled !== false);
      if (found) return found;
    }
    // Default to first enabled variant
    const enabled = item.variants.filter(v => v.enabled !== false);
    return enabled[0] || item.variants[0];
  };

  // Helper to get active quantity for an item
  const getItemQty = (itemId: string): number => {
    return itemQuantities[itemId] || 1;
  };

  // Set quantity with bounds
  const handleUpdateItemQty = (itemId: string, newQty: number) => {
    const qty = Math.max(1, Math.min(500, Math.round(newQty || 1)));
    setItemQuantities(prev => ({ ...prev, [itemId]: qty }));
  };

  // Select variant for an item
  const handleSelectVariant = (itemId: string, variantId: string) => {
    setSelectedVariantByItem(prev => ({
      ...prev,
      [itemId]: variantId
    }));
  };

  // Add Item to Package
  const handleAddToPackage = (item: FittingItem) => {
    const variant = getSelectedVariant(item);
    if (!variant) return;

    const qty = getItemQty(item.id);
    const category = categories.find(c => c.id === item.categoryId);
    const isPriceOnCall = variant.price === null || variant.price === undefined || variant.isPriceOnCall === true;
    const price = isPriceOnCall ? null : Number(variant.price);
    const entryId = `${item.id}_${variant.id}`;

    setPackageItems(prev => {
      const existingIdx = prev.findIndex(pi => pi.id === entryId || (pi.itemId === item.id && pi.variantId === variant.id));

      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + qty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          lineTotal: price !== null ? price * newQty : 0,
          subtotal: price !== null ? price * newQty : 0
        };
        return updated;
      } else {
        const newItem: FittingPackageItemInCart = {
          id: entryId,
          packageTypeId: activePackageType?.id,
          packageTypeName: isUrdu ? (activePackageType?.urduName || activePackageType?.name) : activePackageType?.name,
          itemId: item.id,
          itemName: item.name,
          name: item.name,
          urduName: item.urduName,
          categoryId: item.categoryId,
          categoryName: isUrdu ? (category?.urduName || category?.name || 'فٹنگ') : (category?.name || 'Fitting'),
          variantId: variant.id,
          sizeLabel: variant.sizeLabel,
          sizeType: variant.sizeType || 'INCH',
          brand: variant.brand || item.brand || 'Master / Standard',
          material: variant.material || item.material || 'UPVC / CPVC',
          unit: variant.unit || item.unit || 'Piece',
          length: variant.length,
          quantity: qty,
          unitPrice: price,
          isPriceOnCall,
          lineTotal: price !== null ? price * qty : 0,
          subtotal: price !== null ? price * qty : 0,
          image: item.image,
          linkedProductId: item.linkedProductId
        };
        return [...prev, newItem];
      }
    });

    // Visual feedback
    setRecentlyAddedItemId(item.id);
    setTimeout(() => setRecentlyAddedItemId(null), 1200);

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
    const confirmMsg = isUrdu ? 'کیا آپ تمام آئٹمز پیکج سے ختم کرنا چاہتے ہیں؟' : 'Clear all items from your custom package?';
    if (window.confirm(confirmMsg)) {
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
    const itemsToLoad = recommendedItemIds.length > 0
      ? allItems.filter(i => recommendedItemIds.includes(i.id))
      : allItems.slice(0, 6);

    const newItems: FittingPackageItemInCart[] = itemsToLoad.map((item, idx) => {
      const variant: FittingItemVariant = item.variants.find(v => v.enabled !== false) || item.variants[0];
      const price = variant?.price || 250;
      const category = categories.find(c => c.id === item.categoryId);
      const qty = idx < 2 ? 10 : idx < 4 ? 6 : 2;
      return {
        id: `preset-${Date.now()}-${idx}`,
        itemId: item.id,
        itemName: item.name,
        name: item.name,
        urduName: item.urduName,
        categoryId: item.categoryId,
        categoryName: isUrdu ? (category?.urduName || category?.name || 'فٹنگ') : (category?.name || 'Fitting'),
        variantId: variant?.id || 'v1',
        sizeLabel: variant?.sizeLabel || '1/2"',
        sizeType: variant?.sizeType || 'INCH',
        brand: variant?.brand || item.brand || 'Master',
        material: variant?.material || item.material || 'CPVC',
        unit: variant?.unit || item.unit || 'Piece',
        quantity: qty,
        unitPrice: price,
        isPriceOnCall: false,
        lineTotal: price * qty,
        subtotal: price * qty,
        image: item.image
      };
    });

    setPackageItems(newItems);
  };

  // Transfer all package items into website shopping cart
  const handleTransferToCart = () => {
    if (packageItems.length === 0) return;

    if (onAddPackageToCart) {
      const cartFormatted = packageItems.map(item => {
        // Try finding matching product in store catalog
        const matchProd = products.find(p => p.id === item.linkedProductId || p.id === item.itemId || p.name.toLowerCase() === item.itemName.toLowerCase());
        const prodObj: Product = matchProd || {
          id: item.itemId || `fitting-${item.id}`,
          name: item.itemName,
          price: item.unitPrice ? String(item.unitPrice) : '0',
          category: item.categoryName || 'Plumbing',
          categoryId: item.categoryId || 'fittings',
          images: item.image ? [item.image] : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400'],
          image: item.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400',
          description: `${item.material || 'Standard'} ${item.sizeLabel} Fitting`,
          brand: item.brand || 'Zafar Sarwar Traders',
          features: [item.sizeLabel, item.material || 'Plumbing Grade', item.unit || 'Piece']
        };

        return {
          product: prodObj,
          quantity: item.quantity,
          selectedVariantName: item.sizeLabel,
          price: item.unitPrice || 0
        };
      });

      onAddPackageToCart(cartFormatted);
      setAddedToCartToast(true);
      setTimeout(() => setAddedToCartToast(false), 3000);
    } else if (onAddToCart) {
      packageItems.forEach(item => {
        const matchProd = products.find(p => p.id === item.linkedProductId || p.id === item.itemId);
        const prodObj: Product = matchProd || {
          id: item.itemId || `fitting-${item.id}`,
          name: item.itemName,
          price: item.unitPrice ? String(item.unitPrice) : '0',
          category: item.categoryName || 'Plumbing',
          categoryId: item.categoryId || 'fittings',
          images: item.image ? [item.image] : ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400'],
          image: item.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400',
          description: `${item.material || 'Standard'} ${item.sizeLabel} Fitting`,
          brand: item.brand || 'Zafar Sarwar Traders',
          features: [item.sizeLabel, item.material || 'Plumbing Grade', item.unit || 'Piece']
        };
        onAddToCart(prodObj, item.quantity, item.sizeLabel);
      });
      setAddedToCartToast(true);
      setTimeout(() => setAddedToCartToast(false), 3000);
    }
  };

  // Helper for Unit Translation
  const getDisplayUnit = (unit?: string) => {
    if (!isUrdu || !unit) return unit || 'Pcs';
    const u = unit.toLowerCase();
    if (u.includes('piece') || u.includes('pcs') || u.includes('عدد')) return 'عدد';
    if (u.includes('length') || u.includes('13 ft') || u.includes('10 ft') || u.includes('فٹ')) return 'پائپ لمبائی';
    if (u.includes('roll') || u.includes('رول')) return 'رول';
    if (u.includes('bag') || u.includes('بیگ') || u.includes('بوری')) return 'بیگ';
    if (u.includes('can') || u.includes('کین')) return 'کین';
    if (u.includes('set') || u.includes('سیٹ')) return 'سیٹ';
    return unit;
  };

  // Helper for Category Icon
  const getCategoryIcon = (id: string) => {
    if (id.includes('pipe')) return <Layers className="w-3.5 h-3.5 text-blue-400" />;
    if (id.includes('cp-')) return <Wrench className="w-3.5 h-3.5 text-indigo-400" />;
    if (id.includes('ci-')) return <Boxes className="w-3.5 h-3.5 text-slate-400" />;
    if (id.includes('upvc')) return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
    if (id.includes('ppr')) return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
    if (id.includes('valve')) return <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />;
    if (id.includes('tank')) return <Droplet className="w-3.5 h-3.5 text-sky-400" />;
    if (id.includes('pump')) return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
    return <Package className="w-3.5 h-3.5 text-slate-400" />;
  };

  // WhatsApp Order Generator
  const handleWhatsAppOrder = () => {
    if (packageItems.length === 0) return;

    const phone = (currentConfig.whatsappNumber || businessConfig?.whatsapp || "+923108002863").replace(/[^0-9]/g, '');
    const pkgName = isUrdu ? (activePackageType?.urduName || activePackageType?.name) : activePackageType?.name;

    let msg = '';
    if (isUrdu) {
      msg += `*🔧 ظفر سرور ٹریڈرز — سمارٹ فٹنگ اور پائپ پیکج کوٹیشن*\n`;
      msg += `*پروجیکٹ:* ${pkgName}\n`;
      msg += `*کل آئٹمز:* ${packageItems.length} اقسام | *کل تعداد:* ${totalItemsCount} پیسز\n`;
      msg += `-----------------------------------------\n`;
      packageItems.forEach((item, idx) => {
        const title = item.urduName || item.itemName || item.name;
        const priceStr = item.unitPrice ? `PKR ${item.unitPrice.toLocaleString()}` : 'قیمت بذریعہ رابطہ';
        const totalStr = item.lineTotal ? `PKR ${item.lineTotal.toLocaleString()}` : '';
        msg += `${idx + 1}. *${title}*\n`;
        msg += `   ▫️ سائز: ${item.sizeLabel} | میٹریل: ${item.material || 'معیاری'}\n`;
        msg += `   ▫️ تعداد: ${item.quantity} ${getDisplayUnit(item.unit)} × ${priceStr} ${totalStr ? `= ${totalStr}` : ''}\n\n`;
      });
      msg += `-----------------------------------------\n`;
      msg += `*کل تخمینہ رقم:* PKR ${packageTotalPkr.toLocaleString()}\n`;
      if (hasPriceOnCallItems) {
        msg += `_(نوٹ: کچھ آئٹمز کی حتمی ہول سیل قیمت تصدیق طلب ہے)_\n`;
      }
      msg += `\nبراہِ کرم اس سامان کا اسٹاک اور ڈلیوری کنفرم فرمائیں۔ شکریہ!`;
    } else {
      msg += `*🔧 ZAFAR SARWAR TRADERS — SMART FITTING & PLUMBING PACKAGE*\n`;
      msg += `*Project / Package:* ${pkgName}\n`;
      msg += `*Total Breakdown:* ${packageItems.length} Items | ${totalItemsCount} Total Units\n`;
      msg += `-----------------------------------------\n`;
      packageItems.forEach((item, idx) => {
        const priceStr = item.unitPrice ? `PKR ${item.unitPrice.toLocaleString()}` : 'Price on Request';
        const totalStr = item.lineTotal ? `PKR ${item.lineTotal.toLocaleString()}` : '';
        msg += `${idx + 1}. *${item.itemName || item.name}*\n`;
        msg += `   ▫️ Size: ${item.sizeLabel} | Material: ${item.material || 'Standard'}\n`;
        msg += `   ▫️ Qty: ${item.quantity} ${item.unit || 'Pcs'} × ${priceStr} ${totalStr ? `= ${totalStr}` : ''}\n\n`;
      });
      msg += `-----------------------------------------\n`;
      msg += `*ESTIMATED TOTAL:* PKR ${packageTotalPkr.toLocaleString()}\n`;
      if (hasPriceOnCallItems) {
        msg += `_(Note: Some specialty items require final wholesale stock confirmation)_\n`;
      }
      msg += `\nPlease confirm availability, delivery timeline, and project quotation. Thank you!`;
    }

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // Copy Quotation Text to Clipboard
  const handleCopyQuotation = () => {
    if (packageItems.length === 0) return;
    const pkgName = isUrdu ? (activePackageType?.urduName || activePackageType?.name) : activePackageType?.name;
    let text = `ZAFAR SARWAR TRADERS — FITTING PACKAGE QUOTATION\nProject: ${pkgName}\nTotal Items: ${packageItems.length} (${totalItemsCount} units)\nDate: ${new Date().toLocaleDateString()}\n\n`;
    packageItems.forEach((item, i) => {
      const name = isUrdu ? (item.urduName || item.itemName || item.name) : (item.itemName || item.name);
      const priceStr = item.unitPrice ? `PKR ${item.unitPrice.toLocaleString()}` : 'Price on Request';
      text += `${i + 1}. ${name} [${item.sizeLabel}] (${item.material || 'Standard'}) - Qty: ${item.quantity} ${item.unit || 'Pcs'} @ ${priceStr} = PKR ${(item.lineTotal || 0).toLocaleString()}\n`;
    });
    text += `\nTotal Estimated Amount: PKR ${packageTotalPkr.toLocaleString()}\nPhone / WhatsApp: ${businessConfig?.whatsapp || '+923108002863'}`;
    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3000);
  };

  // Print Quotation Sheet
  const handlePrintQuotation = () => {
    if (packageItems.length === 0) return;
    window.print();
  };

  return (
    <div 
      className={`w-full h-full flex flex-col bg-slate-950 text-slate-100 transition-all font-sans relative overflow-hidden ${
        activeFullscreen ? 'fixed inset-0 z-50 w-screen h-screen rounded-none' : 'rounded-none sm:rounded-3xl'
      } ${isUrdu ? 'rtl' : 'ltr'}`}
      dir={isUrdu ? 'rtl' : 'ltr'}
    >
      
      {/* ---------------------------------------------------- */}
      {/* TOAST NOTIFICATION (Added to Cart / Copied) */}
      {/* ---------------------------------------------------- */}
      {addedToCartToast && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4" />
          <span>{isUrdu ? 'پیکج کا تمام سامان شاپنگ کارٹ میں شامل ہو گیا!' : 'All package items transferred to your website cart!'}</span>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. TOP HEADER WITH FULLSCREEN & LANGUAGE CONTROLS */}
      {/* ---------------------------------------------------- */}
      <header className="px-3 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/80 border-b border-slate-800/80 flex items-center justify-between gap-2.5 shrink-0 z-30 backdrop-blur-md">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 shadow-lg shadow-blue-500/10">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                {isUrdu ? (currentConfig.urduTitle || 'سمارٹ پلمبنگ اور فٹنگ پیکج بلڈر') : (currentConfig.title || 'Smart Fitting & Plumbing Builder')}
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                {isUrdu ? 'براہِ راست کوٹیشن' : 'Live Quote'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-normal truncate hidden sm:block">
              {isUrdu ? (currentConfig.urduSubtitle || 'پائپ، فٹنگ، سائز اور تعداد منتخب کر کے اپنا حسبِ ضرورت پیکج تیار کریں') : (currentConfig.subtitle || 'Select project, pick sizes and quantities, and build your custom package.')}
            </p>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* English / Urdu Switcher */}
          <div className="flex items-center rounded-xl bg-slate-900 p-0.5 sm:p-1 border border-slate-700/80 shadow-inner">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('ur')}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                lang === 'ur'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              اردو
            </button>
          </div>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={handleToggleScreen}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title={activeFullscreen ? (isUrdu ? 'فل اسکرین سے باہر نکلیں' : 'Exit Fullscreen') : (isUrdu ? 'فل اسکرین موڈ' : 'Enter Fullscreen')}
          >
            {activeFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">{isUrdu ? 'نارمل اسکرین' : 'Exit Fullscreen'}</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-blue-400" />
                <span className="hidden md:inline">{isUrdu ? 'فل اسکرین' : 'Fullscreen'}</span>
              </>
            )}
          </button>

          {/* Cart / Package Summary Button */}
          <button
            type="button"
            onClick={() => setIsBreakdownOpen(true)}
            className="relative px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">{isUrdu ? 'پیکج سمری' : 'Package'}</span>
            {packageItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white text-emerald-900 font-black text-[10px]">
                {packageItems.length}
              </span>
            )}
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title={isUrdu ? 'بند کریں' : 'Close'}
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

        </div>

      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. STEP 1: CHOOSE PROJECT PRESET */}
      {/* ---------------------------------------------------- */}
      <div className="px-3 sm:px-6 py-2.5 bg-slate-900/95 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-600 text-white text-[10px] sm:text-xs font-black flex items-center justify-center">
              1
            </span>
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-200 uppercase tracking-wider">
              {isUrdu ? 'مرحلہ 1: پروجیکٹ منتخب کریں' : 'Step 1: Choose Your Project'}
            </h2>
          </div>
          {activePackageType && (
            <button
              type="button"
              onClick={handleLoadPresetBundle}
              className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{isUrdu ? 'تجویز کردہ بنڈل لوڈ کریں' : 'Load Recommended Preset'}</span>
            </button>
          )}
        </div>

        {/* Horizontal Scrolling Package Types */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          {packageTypes.map(pkg => {
            const isSelected = pkg.id === selectedPackageTypeId;
            return (
              <button
                key={pkg.id}
                type="button"
                onClick={() => {
                  setSelectedPackageTypeId(pkg.id);
                  if (pkg.recommendedCategoryIds && pkg.recommendedCategoryIds.length > 0) {
                    setSelectedCategoryId('all');
                  }
                }}
                className={`shrink-0 px-3 py-1.5 sm:py-2 rounded-2xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white animate-pulse' : 'bg-slate-600'}`} />
                <span>{isUrdu ? (pkg.urduName || pkg.name) : pkg.name}</span>
                {pkg.badge && (
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                    isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {pkg.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. STEP 2: CATEGORY FILTER TABS & SEARCH BAR */}
      {/* ---------------------------------------------------- */}
      <div className="px-3 sm:px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shrink-0">
        
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap whitespace-nowrap pb-1 md:pb-0 scrollbar-thin scrollbar-thumb-slate-800 shrink-0 min-w-0 max-w-full">
          <button
            type="button"
            onClick={() => setSelectedCategoryId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {isUrdu ? 'تمام سامان' : 'All Items'} ({allItems.length})
          </button>

          {categories.map(cat => {
            const isCatActive = selectedCategoryId === cat.id;
            const itemsInCatCount = allItems.filter(i => i.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isCatActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {getCategoryIcon(cat.id)}
                <span>{isUrdu ? (cat.urduName || cat.name) : cat.name}</span>
                <span className="text-[10px] opacity-70">({itemsInCatCount})</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar, Material & Size Filter */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          
          {/* Material Quick Filter (if available) */}
          {availableMaterials.length > 1 && (
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="all">{isUrdu ? 'تمام میٹریل' : 'All Materials'}</option>
              {availableMaterials.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          )}

          {/* Size unit toggle */}
          <div className="flex items-center rounded-xl bg-slate-900 p-0.5 border border-slate-800 text-[11px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => setSizeTypeFilter('ALL')}
              className={`px-2 py-1 rounded-lg transition-colors ${sizeTypeFilter === 'ALL' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              {isUrdu ? 'تمام' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setSizeTypeFilter('INCH')}
              className={`px-2 py-1 rounded-lg transition-colors ${sizeTypeFilter === 'INCH' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              Inch
            </button>
            <button
              type="button"
              onClick={() => setSizeTypeFilter('MM')}
              className={`px-2 py-1 rounded-lg transition-colors ${sizeTypeFilter === 'MM' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
            >
              mm
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-52">
            <Search className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isUrdu ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isUrdu ? 'پائپ، فٹنگ یا سائز تلاش کریں...' : 'Search item or size...'}
              className={`w-full py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all ${
                isUrdu ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs ${isUrdu ? 'left-2.5' : 'right-2.5'}`}
              >
                ✕
              </button>
            )}
          </div>

        </div>

      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. STEP 3: ITEMS GRID (FLUID SCROLLABLE CONTAINER) */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-5 pb-32 sm:pb-36 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-300">
              {isUrdu ? 'کوئی سامان نہیں ملا' : 'No plumbing items match your filters'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {isUrdu ? 'فلٹر تبدیل کریں یا تلاش کو صاف کریں۔' : 'Try clearing your search query or switching categories.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategoryId('all');
                setMaterialFilter('all');
                setSizeTypeFilter('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all cursor-pointer"
            >
              {isUrdu ? 'تمام فلٹرز ری سیٹ کریں' : 'Reset All Filters'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredItems.map(item => {
              const activeVariant = getSelectedVariant(item);
              const activeQty = getItemQty(item.id);
              const isPriceOnCall = activeVariant.price === null || activeVariant.price === undefined || activeVariant.isPriceOnCall === true;
              const unitPrice = isPriceOnCall ? null : Number(activeVariant.price);
              
              // Count already in cart for this item
              const itemsInCartForThis = packageItems.filter(p => p.itemId === item.id);
              const totalCartQty = itemsInCartForThis.reduce((s, i) => s + i.quantity, 0);
              const isJustAdded = recentlyAddedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`relative rounded-2xl bg-slate-900/90 border transition-all p-3.5 flex flex-col justify-between group ${
                    totalCartQty > 0
                      ? 'border-blue-500/50 bg-slate-900/95 shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20'
                      : 'border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  
                  {/* Top Item Info */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.brand && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold">
                              {item.brand}
                            </span>
                          )}
                          {item.material && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 text-[10px] font-semibold">
                              {item.material}
                            </span>
                          )}
                          {totalCartQty > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              {totalCartQty} {isUrdu ? 'پیکج میں' : 'In Package'}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-bold text-white mt-1.5 leading-snug">
                          {isUrdu ? (item.urduName || item.name) : item.name}
                        </h3>

                        {/* Description */}
                        {item.description && (
                          <p className="text-[11px] text-slate-400 font-light mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Optional Thumbnail */}
                      {item.image && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>

                    {/* SIZES SELECTOR PILLS */}
                    <div className="mt-2.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        {isUrdu ? 'سائز منتخب کریں:' : 'Select Size:'}
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-thin">
                        {item.variants.filter(v => v.enabled !== false).map(v => {
                          const isVarSelected = v.id === activeVariant.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleSelectVariant(item.id, v.id)}
                              className={`px-2 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                isVarSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-white/20'
                                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-600'
                              }`}
                            >
                              <span>{v.sizeLabel}</span>
                              {v.price && (
                                <span className={`text-[9px] font-normal opacity-80 ${isUrdu ? 'mr-1' : 'ml-1'}`}>
                                  (₨{v.price})
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM CONTROLS: Price, Stepper & Add Button */}
                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                    
                    {/* Price display */}
                    <div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {isUrdu ? 'ریٹ:' : 'Rate:'}
                      </div>
                      <div className="text-xs sm:text-sm font-black text-emerald-400">
                        {unitPrice !== null ? `PKR ${unitPrice.toLocaleString()}` : (isUrdu ? 'رابطہ پر قیمت' : 'Price on Request')}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                          /{getDisplayUnit(activeVariant.unit || item.unit)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper & Add button */}
                    <div className="flex items-center gap-1.5">
                      
                      {/* Stepper */}
                      <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(item.id, activeQty - 1)}
                          className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="500"
                          value={activeQty}
                          onChange={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value, 10) || 1)}
                          className="w-8 text-center bg-transparent text-xs font-black text-white focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(item.id, activeQty + 1)}
                          className="w-6 h-6 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToPackage(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 transition-all shadow-md cursor-pointer ${
                          isJustAdded
                            ? 'bg-emerald-600 text-white scale-95'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 active:scale-95'
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{isUrdu ? 'شامل' : 'Added'}</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>{isUrdu ? 'شامل کریں' : 'Add'}</span>
                          </>
                        )}
                      </button>

                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. STICKY BOTTOM SUMMARY BAR */}
      {/* ---------------------------------------------------- */}
      <footer className="px-3 sm:px-6 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 z-20 shadow-2xl">
        
        {/* Left Stats */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div>
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              {isUrdu ? 'پیکج سمری:' : 'Package Summary:'}
            </div>
            <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <span>{packageItems.length} {isUrdu ? 'اقسام' : 'Items'}</span>
              <span className="text-slate-600">•</span>
              <span>{totalItemsCount} {isUrdu ? 'کل تعداد' : 'Units'}</span>
            </div>
          </div>

          <div className="border-l border-slate-700/80 pl-3 sm:pl-4 pr-1">
            <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              {isUrdu ? 'تخمینہ رقم:' : 'Estimated Total:'}
            </div>
            <div className="text-sm sm:text-base font-black text-emerald-400">
              PKR {packageTotalPkr.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          
          {/* View Package Breakdown */}
          {packageItems.length > 0 && (
            <button
              type="button"
              onClick={() => setIsBreakdownOpen(true)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-blue-400" />
              <span>{isUrdu ? 'پیکج دیکھیں' : 'View Package'}</span>
            </button>
          )}

          {/* Add to Website Cart */}
          {(onAddPackageToCart || onAddToCart) && packageItems.length > 0 && (
            <button
              type="button"
              onClick={handleTransferToCart}
              className="px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
              title={isUrdu ? 'تمام سامان ویب سائٹ شاپنگ کارٹ میں منتقل کریں' : 'Transfer all package items to online cart'}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isUrdu ? 'کارٹ میں ڈالیں' : 'Add to Cart'}</span>
            </button>
          )}

          {/* WhatsApp Order Button */}
          <button
            type="button"
            disabled={packageItems.length === 0}
            onClick={handleWhatsAppOrder}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition-all cursor-pointer ${
              packageItems.length > 0
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{isUrdu ? 'واٹس ایپ پر آرڈر بھیجیں' : 'Order on WhatsApp'}</span>
          </button>
        </div>

      </footer>

      {/* ---------------------------------------------------- */}
      {/* 6. PACKAGE BREAKDOWN / SUMMARY MODAL DRAWER */}
      {/* ---------------------------------------------------- */}
      {isBreakdownOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
            dir={isUrdu ? 'rtl' : 'ltr'}
          >
            
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {isUrdu ? 'آپ کا منتخب کردہ فٹنگ پیکج' : 'Your Custom Plumbing Package'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {packageItems.length} {isUrdu ? 'آئٹمز' : 'items'} • {totalItemsCount} {isUrdu ? 'پیسز' : 'units'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBreakdownOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Items List */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2.5">
              {packageItems.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-sm text-slate-400 font-medium">
                    {isUrdu ? 'آپ کے پیکج میں ابھی کوئی سامان شامل نہیں ہے۔' : 'Your package is currently empty.'}
                  </p>
                </div>
              ) : (
                packageItems.map(item => {
                  return (
                    <div
                      key={item.id}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">
                            {isUrdu ? (item.urduName || item.itemName || item.name) : (item.itemName || item.name)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-900/40 text-[10px] font-bold">
                            {item.sizeLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {item.material || 'Standard'} • {item.unitPrice ? `PKR ${item.unitPrice.toLocaleString()}` : (isUrdu ? 'رابطہ پر قیمت' : 'Price on request')}
                        </div>
                      </div>

                      {/* Quantity Stepper & Price in Summary */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        
                        {/* Stepper */}
                        <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-0.5">
                          <button
                            type="button"
                            onClick={() => handleUpdatePackageItemQty(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            -
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdatePackageItemQty(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center font-bold text-xs cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[70px]">
                          <span className="text-xs font-black text-emerald-400">
                            PKR {(item.lineTotal || item.subtotal || 0).toLocaleString()}
                          </span>
                        </div>

                        {/* Delete item */}
                        <button
                          type="button"
                          onClick={() => handleRemoveFromPackage(item.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer Controls */}
            {packageItems.length > 0 && (
              <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col gap-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-semibold">
                    {isUrdu ? 'کل تخمینہ رقم:' : 'Total Estimated Amount:'}
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-400">
                    PKR {packageTotalPkr.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={handleClearPackage}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 text-xs font-bold border border-slate-800 transition-colors cursor-pointer"
                  >
                    {isUrdu ? 'خالی کریں' : 'Clear'}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyQuotation}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedNotification ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : (isUrdu ? 'کوٹیشن کاپی کریں' : 'Copy Quote')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintQuotation}
                    className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isUrdu ? 'پرنٹ بل' : 'Print'}</span>
                  </button>

                  {(onAddPackageToCart || onAddToCart) && (
                    <button
                      type="button"
                      onClick={handleTransferToCart}
                      className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>{isUrdu ? 'کارٹ میں ڈالیں' : 'Add to Cart'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleWhatsAppOrder}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{isUrdu ? 'واٹس ایپ پر بھیجیں' : 'WhatsApp Quote'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
